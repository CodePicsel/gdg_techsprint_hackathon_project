import { useRef, useEffect, useState } from "react";
import { db } from "../firebase/firebase.config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import logo from '../assets/riverbot.png'

const API = import.meta.env.VITE_API_URL || "https://your-app.onrender.com";
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
      setStatus("Ready");
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

      // 🔥 SAVE DIRECTLY TO FIRESTORE
      if (boxes.length > 0) {
        await saveToFirestore(boxes);
      } else {
        setStatus("No plastic detected");
      }

    } catch (e) {
      console.error(e);
      setStatus("error - " + e.message);
    } finally {
      setDetecting(false);
    }
  }

  /**
   * 🔥 Save detections directly to Firestore
   */
  async function saveToFirestore(boxes) {
    try {
      setStatus("saving to database...");
      
      console.log("📤 Saving to Firestore:", boxes);

      // Save each detection
      const promises = boxes.map(detection => 
        addDoc(collection(db, "detections"), {
          timestamp: serverTimestamp(),
          className: detection.class_name,
          confidence: detection.score,
          classId: detection.class_id || 0,
          bbox: {
            x: detection.x,
            y: detection.y,
            w: detection.w,
            h: detection.h
          }
        })
      );

      await Promise.all(promises);
      
      console.log("✅ Firestore save successful");
      setStatus(`✓ detected & saved ${boxes.length} items`);
      
    } catch (error) {
      console.error("❌ Firestore error:", error);
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
    <div className="p-3 ml-4 rounded-2xl h-screen w-[50dvw] flex flex-col justify-center">
      <section className="flex m-4 align-bottom gap-2">
        <img src={logo} alt='RiverBot logo' className='h-12 w-12' />
          <h1 className="text-3xl font-bold text-sky-600 flex self-center ">RiverBot</h1>
      <h3 className=" ml-9 text-lg font-medium capitalize flex items-center gap-2">
        Status: <span className={`font-semibold ${status == 'ready' ? 'text-green-600' : 'text-yellow-300'}`}>{status}</span>
      </h3>
      </section>
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
            text-gray-200 transition`}
        >
          {detecting ? "Detecting..." : "Detect"}
        </button>

        <button
          onClick={() => (resumeCamera(), setDetecting(false), setStatus('ready'))}
          disabled={!paused}
          className={`px-5 py-2 text-base rounded 
            ${paused
              ? "bg-blue-800 hover:bg-blue-950 cursor-pointer"
              : "bg-gray-950 cursor-not-allowed"}
            text-gray-200 transition`}
        >
          Release
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