import { useRef, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CameraComponent() {
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
    // fetch(`${API}/health`).catch(() => {});

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
      setDetecting(false)
    }
  }

  async function detectOnce() {
    if (detecting || paused) return;

    pauseCamera()
    setDetecting(true);
    setStatus("uploading frame...");

    try {
      const video = videoRef.current;
      const hidden = hiddenRef.current;

      hidden.width = 640;
      hidden.height = 640;

      const hctx = hidden.getContext("2d");
      hctx.drawImage(video, 0, 0, 640, 640);

      const blob = await new Promise(resolve =>
        hidden.toBlob(resolve, "image/jpeg", 0.6)
      );

      const form = new FormData();
      form.append("file", blob, "capture.jpg");
      form.append("conf", "0.35");

      setStatus("running AI model...");

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 45000);

      const resp = await fetch(`${API}/detect`, {
        method: "POST",
        body: form,
        signal: controller.signal
      });

      const json = await resp.json();
      drawDetections(json.boxes || []);
      
      setStatus("detected");
    } catch (e) {
      if (e.name === "AbortError") {
        setStatus("server waking up...");
      } else {
        console.error(e);
        setStatus("error");
      }
    } finally {
      setDetecting(false);
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

  return (
    <div className="p-3  rounded-2xl h-screen w-[50dvw] flex flex-col justify-center ">
      <h3 className="mb-3 ml-9 text-lg font-medium">
        Status: <span className="font-semibold">{status}</span>
      </h3>

      <div className="relative  h-[40dvw] w-[48dvw] place-items-center">
        <video
          ref={videoRef}
          className="h-[40dvw] bg-black rounded-2xl   "
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={overlayRef}
          className="absolute left-0 top-0"
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

      <canvas ref={hiddenRef} className="hidden" />
    </div>
  );
}
