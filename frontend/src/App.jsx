import React, { useRef, useEffect, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const hiddenRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const sendingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        setStatus("starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setStatus("camera error");
      }
    }
    initCamera();
    return () => {
      mounted = false;
      // stop camera
      try {
        const s = videoRef.current && videoRef.current.srcObject;
        if (s) s.getTracks().forEach(t => t.stop());
      } catch (e) {}
    };
  }, []);

  // Send a frame to server
  async function sendFrame() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      const video = videoRef.current;
      const hidden = hiddenRef.current;
      const overlay = overlayRef.current;
      if (!video || !hidden) return;

      // Set hidden canvas size smaller for speed (model expects ~640 or 320)
      const MODEL_W = 640;
      const MODEL_H = 640;
      hidden.width = MODEL_W;
      hidden.height = MODEL_H;
      const hctx = hidden.getContext("2d");
      hctx.drawImage(video, 0, 0, MODEL_W, MODEL_H);

      // Convert to blob
      const blob = await new Promise(resolve => hidden.toBlob(resolve, "image/jpeg", 0.8));
      const form = new FormData();
      form.append("file", blob, "frame.jpg");
      form.append("conf", "0.35");
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

      const resp = await fetch(`${API}/detect`, {
        method: "POST",
        body: form
      });

      const json = await resp.json();
      drawDetections(json.boxes || [], overlay, video);
    } catch (e) {
      console.error("sendFrame error", e);
    } finally {
      sendingRef.current = false;
    }
  }

  // Draw detection boxes onto overlay canvas sized to video element
  function drawDetections(boxes, overlay, video) {
    if (!overlay || !video) return;
    const ctx = overlay.getContext("2d");
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.lineWidth = 2;
    ctx.font = "16px Arial";
    ctx.strokeStyle = "lime";
    ctx.fillStyle = "lime";

    // Scale factor because backend runs on 640x640 but boxes are returned in model coords (we used 640)
    const scaleX = overlay.width / 640;
    const scaleY = overlay.height / 640;

    boxes.forEach(b => {
      const x = Math.round(b.x * scaleX);
      const y = Math.round(b.y * scaleY);
      const w = Math.round(b.w * scaleX);
      const h = Math.round(b.h * scaleY);
      // Prefer class_name if present, otherwise fallback to class_id
      const classLabel = b.class_name ? b.class_name : (b.class_id !== undefined ? `id_${b.class_id}` : "unknown");
      const label = `${classLabel} ${Math.round(b.score * 100)}%`;
      ctx.strokeRect(x, y, w, h);
      // draw filled background for better readability
      const textWidth = ctx.measureText(label).width;
      const padding = 4;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x, y - 20, textWidth + padding * 2, 20);
      ctx.fillStyle = "lime";
      ctx.fillText(label, x + padding, y - 6);
    });
  }

  // Loop: send frames at a controlled interval (e.g., 6 FPS -> every 167 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) sendFrame();
    }, 200); // 5 fps ~ tune this
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render (no JSX)
  return React.createElement(
    "div",
    { style: { padding: 12 } },
    React.createElement("h3", null, "Status: " + status),
    React.createElement(
      "div",
      { style: { position: "relative", width: 640, height: 480 } },
      React.createElement("video", {
        ref: videoRef,
        style: { width: 640, height: 480, background: "#000" },
        autoPlay: true,
        muted: true,
        playsInline: true
      }),
      React.createElement("canvas", {
        ref: overlayRef,
        style: { position: "absolute", left: 0, top: 0, pointerEvents: "none" }
      })
    ),
    // Hidden canvas used to send frames to backend
    React.createElement("canvas", { ref: hiddenRef, style: { display: "none" } })
  );
}
