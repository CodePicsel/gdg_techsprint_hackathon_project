# server.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from ultralytics import YOLO
import uvicorn

app = FastAPI()

# Allow requests from React dev server (change origin if different)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://riverbot.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your .pt model (load once at startup)
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)
print("Model loaded:", MODEL_PATH)

# Resolve names mapping (robust)
try:
    # preferred: model.model.names (Ultralytics internals)
    NAMES = getattr(model, "model").names
except Exception:
    # fallback to model.names if present
    NAMES = getattr(model, "names", None)

# If still not available, build a fallback mapping (0,1,2...)
if NAMES is None:
    # try to infer number of classes from model
    try:
        nc = int(getattr(model, "model").nc)
    except Exception:
        nc = 0
    if nc > 0:
        NAMES = {i: f"class_{i}" for i in range(nc)}
    else:
        NAMES = {}

print("Class names loaded (example):", {k: NAMES[k] for k in list(NAMES)[:10]})

@app.post("/detect")
async def detect(file: UploadFile = File(...), conf: float = Form(0.4)):
    """
    Accepts multipart/form-data with a single file field (image/jpeg).
    Returns JSON: { "boxes": [ {x,y,w,h,score,class_id,class_name}, ... ] }
    Coordinates are in pixel values relative to the input frame.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  # BGR

    if img is None:
        return {"error": "invalid image"}

    # Run inference
    results = model.predict(img, conf=conf, verbose=False)
    r = results[0]

    boxes_out = []
    # r.boxes may be empty; handle gracefully
    if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
        # Extract arrays (these are Torch tensors on CPU by default)
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
            class_name = str(NAMES[class_id]) if class_id in NAMES else f"class_{class_id}"
            boxes_out.append({
                "x": float(x1),
                "y": float(y1),
                "w": float(x2 - x1),
                "h": float(y2 - y1),
                "score": float(sc),
                "class_id": class_id,
                "class_name": class_name
            })

    return {"boxes": boxes_out}

if __name__ == "__main__":
    # Dev server
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
