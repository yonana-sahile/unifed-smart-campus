import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, CheckCircle2 } from "lucide-react";

interface FaceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export function FaceCaptureModal({ isOpen, onClose, onCapture }: FaceCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError("");
    } catch (err) {
      setError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Identity Verification Photo</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-4">
          <p className="text-xs text-slate-500 text-center">
            Please ensure your face is clearly visible and well-lit. This photo will be used as your reference for online exams.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs w-full text-center">
              {error}
            </div>
          )}

          <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Face Guide Oval */}
                <div className="absolute inset-0 border-[30px] border-black/40 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-white/70 rounded-[50%] border-dashed"></div>
                </div>
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex w-full gap-3 pt-2">
            {!capturedImage ? (
              <button
                onClick={takePhoto}
                disabled={!!error}
                className="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>Capture Photo</span>
              </button>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}