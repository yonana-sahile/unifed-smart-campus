import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { Camera, CameraOff, AlertTriangle, CheckCircle2 } from "lucide-react";

interface WebcamMonitorProps {
  onEventDetected: (eventType: string, details: string) => void;
}

export function WebcamMonitor({ onEventDetected }: WebcamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [faceStatus, setFaceStatus] = useState<"LOADING" | "OK" | "NO_FACE" | "MULTI_FACE">("LOADING");
  
  // Refs to prevent spamming the backend with the same event
  const lastEventRef = useRef<string>("");
  const noFaceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detectionInterval: ReturnType<typeof setInterval>;

    const startCamera = async () => {
      try {
        // 1. Load the Face Detection Models from a CDN (No need to download files manually)
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        // 2. Request Camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
          onEventDetected("MONITORING_READY", "Camera started successfully");
        }

        // 3. Start Face Detection Loop (every 1 second)
        detectionInterval = setInterval(async () => {
          if (!videoRef.current) return;
          
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          );

          if (detections.length === 0) {
            setFaceStatus("NO_FACE");
            handleEventDebounce("NO_FACE", "Student moved out of frame");
          } else if (detections.length > 1) {
            setFaceStatus("MULTI_FACE");
            handleEventDebounce("MULTIPLE_FACES", `${detections.length} faces detected`);
          } else {
            setFaceStatus("OK");
            lastEventRef.current = ""; // Reset event lock when student is back to normal
          }
        }, 1000);

      } catch (err: any) {
        console.error(err);
        setStreamActive(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMsg("Camera permission denied. Please allow camera access to take this exam.");
          onEventDetected("CAMERA_UNAVAILABLE", "Permission denied by browser");
        } else {
          setErrorMsg("No camera found or it is currently in use by another app.");
          onEventDetected("CAMERA_DISCONNECTED", "Hardware error or camera in use");
        }
      }
    };

    startCamera();

    // Cleanup: Stop camera and interval when exam is submitted or component unmounts
    return () => {
      if (detectionInterval) clearInterval(detectionInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Helper: Prevents spamming the same event over and over (e.g. "MULTIPLE_FACES" 20 times a second)
  const handleEventDebounce = (type: string, details: string) => {
    if (lastEventRef.current === type) return; // Ignore if it's the exact same event
    
    // If it's a NO_FACE event, wait 5 seconds before logging to avoid false positives
    if (type === "NO_FACE") {
      if (noFaceTimerRef.current) return;
      noFaceTimerRef.current = window.setTimeout(() => {
        onEventDetected(type, details);
        lastEventRef.current = type;
        noFaceTimerRef.current = null;
      }, 5000);
    } else {
      onEventDetected(type, details);
      lastEventRef.current = type;
    }
  };

  // If camera fails, show a red box
  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3 text-red-800">
        <CameraOff className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
        <div>
          <p className="text-xs font-bold">Camera Error</p>
          <p className="text-xs mt-1">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // Otherwise, show the camera preview and status
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700">Proctoring Camera</span>
        {faceStatus === "OK" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {faceStatus === "NO_FACE" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        {faceStatus === "MULTI_FACE" && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>

      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]" // Mirror image (scale-x-[-1]) so it feels like a mirror
        />
        
        {/* Warning overlay for Multiple Faces */}
        {faceStatus === "MULTI_FACE" && (
          <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center p-2 text-center">
            <AlertTriangle className="w-6 h-6 text-white mb-1" />
            <span className="text-[10px] font-bold text-white leading-tight">
              Multiple faces detected. Please ensure only you are in frame.
            </span>
          </div>
        )}

        {/* Warning overlay for No Face */}
        {faceStatus === "NO_FACE" && (
          <div className="absolute inset-0 bg-amber-900/60 flex flex-col items-center justify-center p-2 text-center">
            <AlertTriangle className="w-6 h-6 text-white mb-1" />
            <span className="text-[10px] font-bold text-white leading-tight">
              Face not detected. Please position yourself in the center.
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-center justify-center space-x-1">
        <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          {streamActive ? 'Live Monitoring Active' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
}