import React, { useRef, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const hiddenRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [detecting, setDetecting] = useState(false);
  const [paused, setPaused] = useState(false);

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
      try {
        const s = videoRef.current && videoRef.current.srcObject;
        if (s) s.getTracks().forEach(t => t.stop());
      } catch {}
    };
  }, []);

  async function detectOnce() {
    if (detecting || paused) return;

    setDetecting(true);
    setStatus("detecting...");
    pauseCamera();

    try {
      const video = videoRef.current;
      const hidden = hiddenRef.current;
      const overlay = overlayRef.current;

      const MODEL_W = 640;
      const MODEL_H = 640;

      hidden.width = MODEL_W;
      hidden.height = MODEL_H;

      const hctx = hidden.getContext("2d");
      hctx.drawImage(video, 0, 0, MODEL_W, MODEL_H);

      const blob = await new Promise(resolve =>
        hidden.toBlob(resolve, "image/jpeg", 0.85)
      );

      const form = new FormData();
      form.append("file", blob, "capture.jpg");
      form.append("conf", "0.35");

      const resp = await fetch(`${API}/detect`, {
        method: "POST",
        body: form
      });

      const json = await resp.json();
      drawDetections(json.boxes || []);
      setStatus("detected");
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setDetecting(false);
    }
  }

  function pauseCamera() {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
      setPaused(true);
    }
  }

  function resumeCamera() {
    const video = videoRef.current;
    if (video && video.paused) {
      clearOverlay();
      video.play();
      setPaused(false);
      setStatus("ready");
    }
  }

  function clearOverlay() {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawDetections(boxes) {
    const video = videoRef.current;
    const canvas = overlayRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.font = "16px Arial";

    const scaleX = canvas.width / 640;
    const scaleY = canvas.height / 640;

    boxes.forEach(b => {
      const x = Math.round(b.x * scaleX);
      const y = Math.round(b.y * scaleY);
      const w = Math.round(b.w * scaleX);
      const h = Math.round(b.h * scaleY);

      const label = `${b.class_name} ${Math.round(b.score * 100)}%`;

      ctx.strokeStyle = "lime";
      ctx.strokeRect(x, y, w, h);

      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x, y - 22, tw + 8, 20);

      ctx.fillStyle = "lime";
      ctx.fillText(label, x + 4, y - 6);
    });
  }

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
        style: { position: "absolute", left: 0, top: 0 }
      })
    ),

    React.createElement(
      "div",
      { style: { marginTop: 12, display: "flex", gap: 12 } },

      React.createElement(
        "button",
        {
          onClick: detectOnce,
          disabled: detecting || paused,
          style: {
            padding: "10px 20px",
            fontSize: 16,
            cursor: detecting || paused ? "not-allowed" : "pointer"
          }
        },
        detecting ? "Detecting..." : "Detect"
      ),

      React.createElement(
        "button",
        {
          onClick: resumeCamera,
          disabled: !paused,
          style: {
            padding: "10px 20px",
            fontSize: 16,
            cursor: paused ? "pointer" : "not-allowed"
          }
        },
        "Release / Resume"
      )
    ),

    React.createElement("canvas", {
      ref: hiddenRef,
      style: { display: "none" }
    })
  );
}
