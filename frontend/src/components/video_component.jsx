import { useRef, useEffect, useState } from "react";
import { ingestDetections } from "../functions/services/detectionService";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MODEL_SIZE = 640;

export default function CameraComponent() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const hiddenRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [detecting, setDetecting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastDetectionCount, setLastDetectionCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        setStatus("starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) return;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        // Wait for metadata to ensure video dimensions are available
        await new Promise(resolve => {
          if (video.videoWidth > 0) {
            resolve();
          } else {
            video.onloadedmetadata = resolve;
          }
        });

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
        const s = videoRef.current?.srcObject;
        s?.getTracks().forEach(t => t.stop());
      } catch {}
    };
  }, []);

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
      setLastDetectionCount(0);
    }
  }

  async function detectOnce() {
    if (detecting || paused) return;

    setDetecting(true);
    setStatus("uploading frame...");
    pauseCamera();

    try {
      const video = videoRef.current;
      const hidden = hiddenRef.current;

      hidden.width = MODEL_SIZE;
      hidden.height = MODEL_SIZE;

      const hctx = hidden.getContext("2d");
      hctx.drawImage(video, 0, 0, MODEL_SIZE, MODEL_SIZE);

      const blob = await new Promise(resolve =>
        hidden.toBlob(resolve, "image/jpeg", 0.85)
      );

      const form = new FormData();
      form.append("file", blob, "capture.jpg");
      form.append("conf", "0.35");

      setStatus("running AI model...");

      const resp = await fetch(`${API}/detect`, {
        method: "POST",
        body: form
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const json = await resp.json();
      const boxes = json.boxes || [];
      
      drawDetections(boxes);
      setLastDetectionCount(boxes.length);
      setStatus(`detected ${boxes.length} items`);

      // 🔥 SEND TO FIREBASE BACKEND
      if (boxes.length > 0) {
        await sendDetectionsToFirebase(boxes);
      } else {
        setStatus("no plastic detected");
      }

    } catch (e) {
      console.error(e);
      setStatus("error - " + e.message);
    } finally {
      setDetecting(false);
    }
  }

  /**
   * 🔥 Send detections to Firebase backend
   */
  async function sendDetectionsToFirebase(boxes) {
    try {
      setStatus("saving to database...");
      
      const result = await ingestDetections(boxes);
      
      console.log("✅ Firebase ingestion successful:", result);
      setStatus(`✓ detected & saved ${boxes.length} items`);
    } catch (error) {
      console.error("❌ Failed to save to Firebase:", error);
      // Don't block the UI on Firebase errors
      setStatus(`detected ${boxes.length} items (save failed)`);
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

    // Set canvas dimensions to match video dimensions every time
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.font = "16px Arial";

    const scaleX = canvas.width / MODEL_SIZE;
    const scaleY = canvas.height / MODEL_SIZE;

    boxes.forEach(b => {
      const x = b.x * scaleX;
      const y = b.y * scaleY;
      const w = b.w * scaleX;
      const h = b.h * scaleY;

      const label = `${b.class_name} ${Math.round(b.score * 100)}%`;

      ctx.strokeStyle = "lime";
      ctx.strokeRect(x, y, w, h);

      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x, y - 20, tw + 8, 20);

      ctx.fillStyle = "lime";
      ctx.fillText(label, x + 4, y - 6);
    });
  }

  return (
    <div className="p-3 rounded-2xl h-screen w-[50dvw] flex flex-col justify-center">
      <h3 className="mb-3 ml-9 text-lg font-medium">
        Status: <span className="font-semibold">{status}</span>
      </h3>

      <div className="relative h-[40dvw] w-[48dvw]">
        <video
          ref={videoRef}
          className="w-full h-full bg-black rounded-2xl"
          autoPlay
          muted
          playsInline
        />

        <canvas
          ref={overlayRef}
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
        />
      </div>

      <div className="mt-4 ml-8 flex gap-3">
        <button
          onClick={() => detectOnce()}
          disabled={detecting || paused}
          className={`px-5 py-2 text-base rounded 
            ${detecting || paused
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 cursor-pointer"}
            text-white transition`}
        >
          {detecting ? "Detecting..." : "Detect"}
        </button>

        <button
          onClick={resumeCamera}
          disabled={!paused}
          className={`px-5 py-2 text-base rounded 
            ${paused
              ? "bg-gray-800 hover:bg-gray-900 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"}
            text-white transition`}
        >
          Release / Resume
        </button>
      </div>

      {lastDetectionCount > 0 && (
        <div className="mt-3 ml-9 text-sm text-green-600 font-medium">
          ✓ Last detection: {lastDetectionCount} plastic items found
        </div>
      )}

      <canvas ref={hiddenRef} className="hidden" />
    </div>
  );
}