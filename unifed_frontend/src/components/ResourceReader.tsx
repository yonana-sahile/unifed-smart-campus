// src/components/ResourceReader.tsx
import { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Video,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { LibraryResource } from "../types";

interface ResourceReaderProps {
  resource: LibraryResource;
  initialProgress?: number;
  initialLocation?: string;
  onClose: () => void;
  onProgress: (percent: number, location?: string) => void;
  onMarkFinished: () => void;
}

export function ResourceReader({
  resource,
  initialProgress = 0,
  initialLocation,
  onClose,
  onProgress,
  onMarkFinished,
}: ResourceReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReported = useRef(-1);
  const [manualPercent, setManualPercent] = useState(initialProgress);
  const [finishedNotice, setFinishedNotice] = useState(false);

  // Resolve file source
  const src =
    (resource as any).fileData ??
    (resource as any).fileUrl ??
    (resource as any).file_url ??
    (resource as any).url;

  const isVideo = resource.resourceType === "VIDEO";
  const isDataUrl =
    typeof src === "string" && src.startsWith("data:");

  const filename =
    (resource as any).fileName ??
    (resource as any).file_name ??
    `${resource.title.replace(/[^\w.-]+/g, "_")}${isVideo ? ".mp4" : ".pdf"}`;

  // ── ESC to close + lock body scroll ─────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // ── Restore scroll position for non-video ───────────────
  useEffect(() => {
    if (isVideo) return;
    const el = containerRef.current;
    if (!el) return;
    if (
      initialLocation?.startsWith("scroll:") &&
      el.scrollHeight > el.clientHeight
    ) {
      const ratio = parseFloat(initialLocation.split(":")[1]);
      requestAnimationFrame(() => {
        el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio;
      });
    }
  }, [isVideo, initialLocation]);

  // ── Track scroll progress for PDFs / images ─────────────
  useEffect(() => {
    if (isVideo) return;
    const el = containerRef.current;
    if (!el) return;

    const handler = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((el.scrollTop / scrollable) * 100);
      const clamped = Math.min(100, Math.max(0, pct));
      if (Math.abs(clamped - lastReported.current) >= 3) {
        lastReported.current = clamped;
        setManualPercent(clamped);
        onProgress(
          clamped,
          `scroll:${(el.scrollTop / scrollable).toFixed(3)}`
        );
        if (clamped >= 100 && !finishedNotice) {
          setFinishedNotice(true);
        }
      }
    };

    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, resource.id]);

  // ── Track video progress + restore time ─────────────────
  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (!v) return;

    // Restore playback position
    if (initialLocation?.startsWith("time:")) {
      const t = parseFloat(initialLocation.split(":")[1]);
      if (Number.isFinite(t) && t > 0) {
        const restore = () => {
          try {
            v.currentTime = t;
          } catch {
            /* ignore */
          }
        };
        if (v.readyState >= 1) restore();
        else v.addEventListener("loadedmetadata", restore, { once: true });
      }
    }

    const handler = () => {
      if (!v.duration || !Number.isFinite(v.duration)) return;
      const pct = Math.round((v.currentTime / v.duration) * 100);
      const clamped = Math.min(100, Math.max(0, pct));
      if (Math.abs(clamped - lastReported.current) >= 3) {
        lastReported.current = clamped;
        setManualPercent(clamped);
        onProgress(clamped, `time:${v.currentTime.toFixed(2)}`);
        if (clamped >= 100 && !finishedNotice) {
          setFinishedNotice(true);
        }
      }
    };

    v.addEventListener("timeupdate", handler);
    return () => v.removeEventListener("timeupdate", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, resource.id]);

  // ── Manual "Mark as Finished" ───────────────────────────
  const handleMarkFinished = () => {
    lastReported.current = 100;
    setManualPercent(100);
    setFinishedNotice(true);
    onProgress(100);
    onMarkFinished();
  };

  // ── Download from inside the reader ─────────────────────
  const handleDownload = () => {
    if (!src) return;
    if (isDataUrl) {
      const a = document.createElement("a");
      a.href = src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const a = document.createElement("a");
      a.href = src;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const Icon = isVideo ? Video : resource.resourceType === "BOOK" ? BookOpen : FileText;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-slate-950/85 backdrop-blur-sm flex flex-col"
    >
      {/* Top bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-[#071526] text-white shrink-0"
      >
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{resource.title}</h3>
              <p className="text-[10px] text-slate-400 truncate">
                {resource.author}
                {resource.fileSize ? ` • ${resource.fileSize}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {src && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
            style={{ width: `${manualPercent}%` }}
          />
        </div>
      </motion.div>

      {/* Content */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-slate-100 ${
          isVideo ? "flex items-center justify-center" : ""
        }`}
      >
        {!src ? (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div className="max-w-md bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-display font-bold text-slate-800 text-sm mb-1">
                No file attached
              </h4>
              <p className="text-xs text-slate-500">
                "{resource.title}" has no file URL on the backend yet. The
                Library Directorate needs to upload the actual PDF/video file
                before students can open it.
              </p>
            </div>
          </div>
        ) : isVideo ? (
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full h-full max-h-full object-contain bg-black"
          />
        ) : isDataUrl && (src as string).startsWith("data:image") ? (
          <div className="min-h-full p-4 flex items-start justify-center">
            <img
              src={src as string}
              alt={resource.title}
              className="max-w-full h-auto shadow-2xl rounded-lg"
            />
          </div>
        ) : (
          <iframe
            src={src as string}
            title={resource.title}
            className="w-full h-full border-0 bg-white"
            // For PDFs: browser native viewer handles scroll.
            // Note: iframe scroll is not always measurable cross-origin;
            // progress will still update via parent scroll where possible.
          />
        )}
      </div>

      {/* Footer with progress + mark finished */}
      <div className="bg-[#071526] text-white shrink-0 px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>
            {manualPercent}% {isVideo ? "watched" : "read"}
          </span>
        </div>

        {manualPercent >= 100 || finishedNotice ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finished</span>
          </span>
        ) : (
          <button
            onClick={handleMarkFinished}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark as Finished</span>
            <span className="sm:hidden">Finish</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}