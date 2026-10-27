import { useRef, useState, useEffect, MouseEvent, TouchEvent } from "react";
import { Pencil, Eraser, Trash2, Palette } from "lucide-react";

interface WhiteboardCanvasProps {
  isInstructor: boolean;
}

const COLORS = [
  { name: "Crimson", value: "#dc2626" },
  { name: "White", value: "#f8fafc" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
];

const SIZES = [2, 4, 8, 14];

export function WhiteboardCanvas({ isInstructor }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#f8fafc");
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Size the canvas to its container, handle DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const getPoint = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const t = e.touches[0];
      if (!t) return null;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    if (!isInstructor) return;
    const pt = getPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    lastPoint.current = pt;

    // Draw a dot on single click
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "#0f172a" : color;
      ctx.fill();
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !isInstructor) return;
    e.preventDefault();
    const pt = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!pt || !ctx || !lastPoint.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = tool === "eraser" ? "#0f172a" : color;
    ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPoint.current = pt;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  return (
    <div className="flex-1 flex flex-col h-full space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2 zoom-glass rounded-xl border border-slate-700/50">
        <div className="flex items-center space-x-2">
          {/* Pen / Eraser */}
          <button
            type="button"
            onClick={() => setTool("pen")}
            disabled={!isInstructor}
            className={`p-2 rounded-lg border transition ${
              tool === "pen"
                ? "bg-red-600/20 border-red-500/50 text-red-300"
                : "bg-slate-800 border-slate-700 text-slate-300"
            } disabled:opacity-40`}
            title="Pen"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            disabled={!isInstructor}
            className={`p-2 rounded-lg border transition ${
              tool === "eraser"
                ? "bg-red-600/20 border-red-500/50 text-red-300"
                : "bg-slate-800 border-slate-700 text-slate-300"
            } disabled:opacity-40`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Colors */}
          <div className="flex items-center space-x-1.5">
            <Palette className="w-4 h-4 text-slate-400" />
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setColor(c.value);
                  setTool("pen");
                }}
                disabled={!isInstructor}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c.value && tool === "pen"
                    ? "border-white scale-110"
                    : "border-slate-600"
                } disabled:opacity-40`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Brush sizes */}
          <div className="flex items-center space-x-1">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBrushSize(s)}
                disabled={!isInstructor}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition ${
                  brushSize === s
                    ? "bg-red-600/20 border-red-500/50"
                    : "bg-slate-800 border-slate-700"
                } disabled:opacity-40`}
                title={`${s}px`}
              >
                <span
                  className="rounded-full bg-slate-200"
                  style={{ width: s, height: s }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Clear */}
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!isInstructor}
            className="p-2 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-300 transition disabled:opacity-40"
            title="Clear whiteboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative rounded-xl border border-slate-700/50 overflow-hidden zoom-glass"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`absolute inset-0 w-full h-full ${
            isInstructor ? "cursor-crosshair" : "cursor-not-allowed"
          }`}
        />
        {!isInstructor && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-medium pointer-events-none">
            👁 View only — instructor is presenting
          </div>
        )}
      </div>
    </div>
  );
}

export default WhiteboardCanvas;