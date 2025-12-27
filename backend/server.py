# backend/server.py
import io
import os
from typing import List, Dict, Any

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
import uvicorn

# CONFIG
MODEL_PATH = os.environ.get("MODEL_PATH", "best.onnx")  # relative to working dir in container
CLASSES_TXT = os.environ.get("CLASSES_TXT", "classes.txt")
MODEL_SIZE = int(os.environ.get("MODEL_SIZE", "640"))  # must match frontend MODEL_SIZE
CONF_THRESH_DEFAULT = float(os.environ.get("CONF_THRESH", "0.35"))
IOU_THRESHOLD = float(os.environ.get("IOU_THRESHOLD", "0.45"))

app = FastAPI(title="RiverBot ONNX Detector")

# Allow CORS for your frontend (adjust origin as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load classes
if os.path.exists(CLASSES_TXT):
    with open(CLASSES_TXT, "r", encoding="utf-8") as f:
        CLASS_NAMES = [l.strip() for l in f.readlines() if l.strip()]
else:
    CLASS_NAMES = []
print("Loaded classes:", CLASS_NAMES)

# Initialize ONNX session once
print("Loading ONNX model:", MODEL_PATH)
so = ort.SessionOptions()
so.intra_op_num_threads = int(os.environ.get("ORT_THREADS", "1"))
so.inter_op_num_threads = 1
# Use CPU execution provider by default on Render
sess = ort.InferenceSession(MODEL_PATH, sess_options=so, providers=["CPUExecutionProvider"])
input_name = sess.get_inputs()[0].name
print("ONNX input name:", input_name)
print("ONNX outputs:", [o.name + str(o.shape) for o in sess.get_outputs()])


# utils: letterbox (resize w/o distortion)
def letterbox(im: Image.Image, new_shape=(MODEL_SIZE, MODEL_SIZE), color=(114, 114, 114)):
    # Resize and pad image while meeting stride-multiple constraints (simple version)
    w, h = im.size
    new_w, new_h = new_shape
    scale = min(new_w / w, new_h / h)
    nw, nh = int(w * scale), int(h * scale)
    im_resized = im.resize((nw, nh), Image.BILINEAR)
    new_img = Image.new("RGB", new_shape, color)
    pad_x = (new_w - nw) // 2
    pad_y = (new_h - nh) // 2
    new_img.paste(im_resized, (pad_x, pad_y))
    return new_img, scale, pad_x, pad_y


def xywh2xyxy(box):
    x, y, w, h = box
    x1 = x - w / 2
    y1 = y - h / 2
    x2 = x + w / 2
    y2 = y + h / 2
    return [x1, y1, x2, y2]


def nms(boxes, scores, iou_threshold=0.45):
    # boxes: Nx4 in xyxy
    # scores: N
    if len(boxes) == 0:
        return []
    boxes = np.array(boxes)
    scores = np.array(scores)
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        rem_areas = areas[order[1:]]
        union = (areas[i] + rem_areas - inter)
        iou = inter / union
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    return keep


def postprocess_yolo(output, conf_thres=0.35, iou_thres=0.45, orig_size=(MODEL_SIZE, MODEL_SIZE)):
    """
    Expect output shape (1, N, 85) or (N,85) with xywh normalized or absolute.
    Returns list of detections in pixel coords (x,y,w,h) relative to MODEL_SIZE canvas.
    """
    if isinstance(output, list):
        output = output[0]
    out = np.array(output)
    if out.ndim == 3 and out.shape[0] == 1:
        out = out[0]  # (N,85)
    if out.size == 0:
        return []

    # detect format: last dim: [x,y,w,h, obj_conf, class_prob...]
    if out.shape[1] < 5:
        return []

    # For typical YOLO: first 4 = xywh (center), 5 = obj_conf, rest = class probs
    xywh = out[:, :4]
    obj_conf = out[:, 4:5]
    class_probs = out[:, 5:]
    class_ids = np.argmax(class_probs, axis=1)
    class_scores = class_probs[np.arange(len(class_ids)), class_ids]
    scores = (obj_conf[:, 0] * class_scores).astype(float)

    # filter by conf threshold
    mask = scores >= conf_thres
    if not mask.any():
        return []
    xywh = xywh[mask]
    scores = scores[mask]
    class_ids = class_ids[mask]

    # convert to xyxy absolute coordinates relative to MODEL_SIZE
    # determine scale: if xywh values appear normalized (max <=1), multiply by MODEL_SIZE
    max_val = xywh.max()
    if max_val <= 1.001:
        xywh_abs = xywh * MODEL_SIZE
    else:
        xywh_abs = xywh  # assume already pixel values

    boxes_xyxy = [xywh2xyxy(b) for b in xywh_abs]

    # run NMS
    keep_idx = nms(boxes_xyxy, scores, iou_threshold=iou_thres)
    detections = []
    for i in keep_idx:
        x1, y1, x2, y2 = boxes_xyxy[i]
        w = x2 - x1
        h = y2 - y1
        x = float(max(0.0, x1))
        y = float(max(0.0, y1))
        detections.append({
            "x": float(x),
            "y": float(y),
            "w": float(max(0.0, w)),
            "h": float(max(0.0, h)),
            "score": float(scores[i]),
            "class_id": int(class_ids[i]),
            "class_name": CLASS_NAMES[int(class_ids[i])] if CLASS_NAMES and int(class_ids[i]) < len(CLASS_NAMES) else str(int(class_ids[i]))
        })
    return detections


@app.post("/detect")
async def detect(file: UploadFile = File(...), conf: str = Form(None)):
    # read conf threshold
    try:
        conf_val = float(conf) if conf else CONF_THRESH_DEFAULT
    except:
        conf_val = CONF_THRESH_DEFAULT

    # read image bytes
    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")

    # letterbox to MODEL_SIZE
    img_resized, _, pad_x, pad_y = letterbox(img, (MODEL_SIZE, MODEL_SIZE))
    img_np = np.asarray(img_resized).astype(np.float32)
    # normalize to 0..1 (Ultralytics standard), transpose to NCHW
    img_np = img_np / 255.0
    img_np = img_np[:, :, ::-1]  # if model expects BGR, but many exports use RGB; if results strange, toggle this line
    input_tensor = np.transpose(img_np, (2, 0, 1))[None, :, :, :].astype(np.float32)

    # run inference
    try:
        ort_inputs = {input_name: input_tensor}
        outputs = sess.run(None, ort_inputs)
    except Exception as e:
        return {"error": f"inference error: {e}"}

    # postprocess
    dets = postprocess_yolo(outputs, conf_thres=conf_val, iou_thres=IOU_THRESHOLD)

    # Return detection list
    return {"boxes": dets}


# For local dev
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, log_level="info", workers=1)
