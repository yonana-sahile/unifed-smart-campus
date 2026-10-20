import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { ShieldCheck, ShieldAlert, Loader2, Camera } from "lucide-react";

interface FaceVerificationModalProps {
  isOpen: boolean;
  savedPhotoUrl: string;
  onVerified: () => void;
  onFailed: (reason: string) => void;
  onClose: () => void;
}

export function FaceVerificationModal({
  isOpen,
  savedPhotoUrl,
  onVerified,
  onFailed,
  onClose,
}: FaceVerificationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<
    "LOADING" | "READY" | "VERIFYING" | "SUCCESS" | "FAILED"
  >("LOADING");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);

  // ✅ Guard so onVerified/onFailed fire only once per mount
  const hasReportedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        // ✅ LOCAL MODELS — served from public/models/ in the frontend
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("READY");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(
          "Failed to load camera or AI models. Please refresh and try again."
        );
        setStatus("FAILED");
        if (!hasReportedRef.current) {
          hasReportedRef.current = true;
          onFailed("Camera/model load failed");
        }
      }
    };
    start();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);

  const verifyFace = async () => {
    if (!videoRef.current || !savedPhotoUrl) return;
    setStatus("VERIFYING");
    setErrorMsg("");

    try {
      // 1. Get reference descriptor from the saved photo
      const referenceImage = await faceapi.fetchImage(savedPhotoUrl);
      const referenceDetection = await faceapi
        .detectSingleFace(referenceImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!referenceDetection) {
        setErrorMsg(
          "Could not detect a face in your saved photo. Please retake your ID photo."
        );
        setStatus("FAILED");
        if (!hasReportedRef.current) {
          hasReportedRef.current = true;
          onFailed("No face in reference photo");
        }
        return;
      }

      // 2. Get live descriptor from the video
      const liveDetection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        setErrorMsg(
          "No face detected in the camera. Please position yourself clearly."
        );
        setStatus("READY");
        setAttempts((prev) => prev + 1);
        return;
      }

      // 3. Compare descriptors
      const dist = faceapi.euclideanDistance(
        referenceDetection.descriptor,
        liveDetection.descriptor
      );
      setDistance(dist);
      console.log("Face distance:", dist, "(threshold: 0.60)");

      // 4. Threshold: 0.55 strict, 0.60 standard, 0.65 lenient
      if (dist < 0.6) {
        console.log("✅ FACE MATCHED. Distance:", dist);
        setStatus("SUCCESS");
        setTimeout(() => {
          if (hasReportedRef.current) {
            console.log("⏭️  onVerified already called — skipping duplicate");
            return;
          }
          hasReportedRef.current = true;
          console.log("🚀 Calling onVerified() now");
          onVerified();
        }, 800);
      } else {
        console.log("❌ FACE MISMATCH. Distance:", dist);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setErrorMsg(
            "Identity verification failed 3 times. Please contact your instructor."
          );
          setStatus("FAILED");
          if (!hasReportedRef.current) {
            hasReportedRef.current = true;
            onFailed("Too many failed attempts");
          }
        } else {
          setErrorMsg(
            `Face does not match (confidence ${(100 - dist * 100).toFixed(
              0
            )}%). Attempt ${newAttempts}/3. Try again.`
          );
          setStatus("READY");
        }
      }
    } catch (err: any) {
      console.error("verifyFace error:", err);
      setErrorMsg("Verification error. Please try again.");
      setStatus("READY");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Identity Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 text-center">
            Look directly at the camera. We will compare your live face to your
            registered ID photo.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase">
                Saved ID
              </p>
              <img
                src={savedPhotoUrl}
                alt="Saved"
                className="w-full aspect-square object-cover rounded-xl border border-slate-200"
              />
            </div>
            <div className="relative">
              <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase">
                Live Camera
              </p>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-square object-cover rounded-xl border border-slate-200 scale-x-[-1]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "LOADING" && (
            <div className="flex items-center justify-center space-x-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading AI models...</span>
            </div>
          )}

          {status === "SUCCESS" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm flex items-center justify-center space-x-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Identity Verified! Starting exam...</span>
            </div>
          )}

          {status !== "SUCCESS" && (
            <div className="flex space-x-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyFace}
                disabled={status === "LOADING" || status === "VERIFYING"}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2"
              >
                {status === "VERIFYING" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>
                      {attempts > 0 ? `Try Again (${attempts}/3)` : "Verify My Face"}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}