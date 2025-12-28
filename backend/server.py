# server.py
import os
import io
import traceback
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import uvicorn

# Ultralytics import (may print settings message at import)
try:
    from ultralytics import YOLO
except Exception as e:
    YOLO = None
    print("ultralytics import failed:", e)

app = FastAPI(title="RiverBot ONNX/YOLO Detector")

# CORS - allow netlify + local dev. Tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://riverbot.netlify.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model handle (None until loaded)
MODEL_PATH = os.environ.get("MODEL_PATH", "best.pt")
model: Optional[object] = None
NAMES = {}

@app.get("/health")
def health():
    """Health endpoint for pre-warm / uptime checks."""
    status = "ok" if model is not None else "starting"
    return {"status": status, "model_loaded": model is not None, "model_path": MODEL_PATH}

@app.on_event("startup")
def load_model_on_startup():
    """
    Load the model in a guarded way so import never crashes the process.
    If loading fails, the server still starts and /detect will return a helpful error.
    """
    global model, NAMES
    if YOLO is None:
        print("Warning: ultralytics.YOLO unavailable. Model will not load.")
        return

    try:
        print(f"Attempting to load model from: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        # Resolve names mapping (robust)
        try:
            NAMES = getattr(model, "model").names
        except Exception:
            NAMES = getattr(model, "names", None) or {}
        # Ensure NAMES is a dict-like mapping
        if isinstance(NAMES, (list, tuple)):
            NAMES = {i: n for i, n in enumerate(NAMES)}
        print("Model loaded successfully. Example classes:", {k: NAMES[k] for k in list(NAMES)[:10]})
    except Exception as e:
        model = None
        print("Failed to load model during startup. Server will remain up.")
        traceback.print_exc()

@app.post("/detect")
async def detect(file: UploadFile = File(...), conf: float = Form(0.4)):
    """
    Accepts multipart/form-data with 'file' (image) and 'conf' float form field.
    Returns JSON: { "boxes": [ {x,y,w,h,score,class_id,class_name}, ... ] }
    """
    if model is None:
        return {"error": "model not loaded on server. Please check logs or upload model."}

    contents = await file.read()
    try:
        # Use PIL to handle more formats robustly, convert to BGR array for ultralytics if needed
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(img)  # RGB HWC
        # Convert to BGR for OpenCV-like behavior if your model expects BGR; adjust if needed
        img_bgr = img_np[:, :, ::-1].copy()
    except Exception:
        # fallback to numpy decode
        import cv2
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {"error": "invalid image"}

    try:
        # Run inference; use model.predict which is compatible with Ultralytics YOLO instances
        results = model.predict(img_bgr, conf=conf, verbose=False)
        r = results[0]
    except Exception as e:
        traceback.print_exc()
        return {"error": f"inference error: {e}"}

    boxes_out = []
    try:
        if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
            try:
                xyxy = r.boxes.xyxy.cpu().numpy()    # shape (N,4)
                scores = r.boxes.conf.cpu().numpy()  # shape (N,)
                classes = r.boxes.cls.cpu().numpy()  # shape (N,)
            except Exception:
                # fallback if already numpy-like
                xyxy = np.array(r.boxes.xyxy)
                scores = np.array(r.boxes.conf)
                classes = np.array(r.boxes.cls)

            for (x1, y1, x2, y2), sc, cl in zip(xyxy, scores, classes):
                class_id = int(cl)
                class_name = str(NAMES.get(class_id, f"class_{class_id}"))
                boxes_out.append({
                    "x": float(x1),
                    "y": float(y1),
                    "w": float(x2 - x1),
                    "h": float(y2 - y1),
                    "score": float(sc),
                    "class_id": class_id,
                    "class_name": class_name
                })
    except Exception:
        traceback.print_exc()
        return {"error": "postprocessing error"}

    return {"boxes": boxes_out}

# If you run server.py directly (local dev), this honors PORT and DEV_RELOAD env vars.
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    reload_flag = os.environ.get("DEV_RELOAD", "False").lower() in ("1", "true")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=reload_flag)
