import React, { useEffect, useRef } from 'react';

interface StarryFlagProps {
  scale?: number;
  className?: string;
  showText?: boolean;
  poleHeightCustom?: number;
}

export const StarryFlag: React.FC<StarryFlagProps> = ({
  scale = 0.68,
  className = "",
  showText = false,
  poleHeightCustom
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dimensions - exact 2:1 proportion matching standard Ethiopian flag ratio
  const poleHeight = poleHeightCustom ?? Math.round(230 * scale);
  const flagW = Math.round(240 * scale);
  const flagH = Math.round(120 * scale);
  const finialSize = Math.max(9, Math.round(15 * scale));
  const poleWidth = Math.max(3.5, Math.round(6.5 * scale));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-resolution internal canvas for crisp rendering (2:1 ratio matching 1200x600)
    const internalW = 480;
    const internalH = 240;
    canvas.width = internalW;
    canvas.height = internalH;

    // Create an offscreen buffer canvas containing the exact Ethiopian flag
    const offscreen = document.createElement('canvas');
    offscreen.width = internalW;
    offscreen.height = internalH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Draw the Ethiopian Flag texture
    const stripeH = internalH / 3;

    // Green stripe
    offCtx.fillStyle = '#078930';
    offCtx.fillRect(0, 0, internalW, stripeH);

    // Yellow stripe
    offCtx.fillStyle = '#FCDD09';
    offCtx.fillRect(0, stripeH, internalW, stripeH);

    // Red stripe
    offCtx.fillStyle = '#DA121A';
    offCtx.fillRect(0, stripeH * 2, internalW, stripeH);

    // Blue Circle Emblem (r=160 in 1200x600 -> 160/600 * internalH)
    const centerX = internalW / 2;
    const centerY = internalH / 2;
    const radius = (160 / 600) * internalH;

    offCtx.beginPath();
    offCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    offCtx.fillStyle = '#0F47AF';
    offCtx.fill();

    // Emblem Star & Rays
    offCtx.save();
    offCtx.translate(centerX, centerY);
    const starScale = (radius / 160) * 0.85;
    offCtx.scale(starScale, starScale);

    offCtx.strokeStyle = '#FCDD09';
    offCtx.lineWidth = 13;
    offCtx.lineJoin = 'round';
    offCtx.lineCap = 'round';

    // Pentagram
    offCtx.beginPath();
    offCtx.moveTo(0, -160);
    offCtx.lineTo(94, 129.4);
    offCtx.lineTo(-152.1, -49.4);
    offCtx.lineTo(152.1, -49.4);
    offCtx.lineTo(-94, 129.4);
    offCtx.closePath();
    offCtx.stroke();

    // 5 Rays
    const rays = [
      [50, -69, 94, -129],
      [81, 26, 152, 49],
      [0, 85, 0, 160],
      [-81, 26, -152, 49],
      [-50, -69, -94, -129]
    ];
    rays.forEach(([x1, y1, x2, y2]) => {
      offCtx.beginPath();
      offCtx.moveTo(x1, y1);
      offCtx.lineTo(x2, y2);
      offCtx.stroke();
    });
    offCtx.restore();

    // Cloth Simulation Animation Loop
    let animId: number;
    let time = 0;
    let windTime = 0;
    const slices = 160; // Ultra-fine slicing for smooth cloth fluidity
    const sliceWidth = internalW / slices;

    const render = () => {
      // Natural organic wind turbulence: combines slow atmospheric swells with gentle micro-gusts
      // Speed naturally fluctuates between a gentle breeze (0.018) and a moderate flutter (0.038)
      windTime += 0.015;
      const windGustFactor = 0.026 +
        0.009 * Math.sin(windTime * 0.7) +
        0.006 * Math.sin(windTime * 1.63 + 1.2) +
        0.004 * Math.cos(windTime * 3.1);

      time += windGustFactor;

      ctx.clearRect(0, 0, internalW, internalH);

      // Global billow towards the screen (Z-axis depth swell):
      // Slowly oscillates so the flag sometimes billows towards the viewer/camera in 3D, and sometimes streams straight
      const globalZBillow = Math.sin(time * 0.75) * 0.45 + Math.sin(time * 1.35 + 0.5) * 0.25;

      for (let i = 0; i < slices; i++) {
        const x = i * sliceWidth;
        const progress = i / slices; // 0 at flagpole (anchored), 1 at free flying edge

        // Wave amplitude scales smoothly with progress from flagpole
        const baseAmp = Math.pow(progress, 1.18) * (13 + 5 * Math.sin(windTime * 0.9));
        const flutterAmp = Math.pow(progress, 2.3) * 3.2;

        // Realistic traveling harmonic waves with natural wave dispersion
        const wave1 = Math.sin(progress * 6.8 - time * 2.4) * baseAmp;
        const wave2 = Math.sin(progress * 11.5 - time * 3.6 + 0.6) * (baseAmp * 0.32);
        const wave3 = Math.cos(progress * 18.0 - time * 5.2) * flutterAmp;
        const yOffset = wave1 + wave2 + wave3;

        // 3D Depth / Screen Billow (Z-displacement):
        // As the flag comes towards the screen, progress * globalZBillow creates a realistic perspective bow
        const zDisplacement = Math.sin(progress * 5.2 - time * 2.1) * (progress * 18 * globalZBillow) +
                              (progress * 12 * Math.max(0, globalZBillow));

        // Wave slope / normal vector calculation for lighting and 3D folding
        const nextProg = progress + 0.02;
        const nextWave = Math.sin(nextProg * 6.8 - time * 2.4) * baseAmp +
                         Math.sin(nextProg * 11.5 - time * 3.6 + 0.6) * (baseAmp * 0.32);
        const slope = (nextWave - (wave1 + wave2)) * 1.4;

        // Perspective scale: forward billows towards the camera appear slightly taller & closer
        const perspectiveScale = 1.0 + (zDisplacement / 220) - Math.abs(slope) * 0.015;
        const drawH = internalH * Math.max(0.75, Math.min(1.22, perspectiveScale));
        const drawY = (internalH - drawH) / 2 + yOffset;

        // Draw the vertical flag slice with natural perspective scaling
        ctx.drawImage(
          offscreen,
          x, 0, sliceWidth, internalH,
          x, drawY, sliceWidth + 0.6, drawH
        );

        // Dynamic 3D Cloth Lighting & Highlights:
        // Highlights when crest faces lighting, shadows in troughs and deep folds
        const totalSlope = slope + (zDisplacement > 0 ? 0.12 : -0.1);
        if (totalSlope > 0.18) {
          // Crest facing light source: Soft Satin Highlight
          const highlightAlpha = Math.min(0.36, (totalSlope - 0.18) * 0.26);
          ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
          ctx.fillRect(x, drawY, sliceWidth + 0.6, drawH);
        } else if (totalSlope < -0.18) {
          // Trough facing away: Natural Cloth Shadow
          const shadowAlpha = Math.min(0.4, (-totalSlope - 0.18) * 0.3);
          ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
          ctx.fillRect(x, drawY, sliceWidth + 0.6, drawH);
        }

        // Ambient depth gradient along the length of the cloth
        const ambientDrape = progress * 0.06;
        if (ambientDrape > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${ambientDrape})`;
          ctx.fillRect(x, drawY, sliceWidth + 0.6, drawH);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [scale]);

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <div className="flex items-start">
        {/* Flagpole Structure */}
        <div className="flex flex-col items-center shrink-0 z-20">
          {/* Golden Finial Sphere Top */}
          <div
            className="bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-full shadow-md z-10"
            style={{ width: `${finialSize}px`, height: `${finialSize}px` }}
          />
          {/* Metallic Stainless Steel Pole */}
          <div
            className="bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-md"
            style={{
              width: `${poleWidth}px`,
              height: `${poleHeight}px`,
              boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.35)'
            }}
          />
        </div>

        {/* Real Physics Waving Flag Canvas */}
        <div
          className="-ml-0.5 mt-1 origin-left shrink-0"
          style={{
            width: `${flagW}px`,
            height: `${flagH + 20}px`,
            filter: 'drop-shadow(3px 8px 10px rgba(0,0,0,0.35))'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: `${flagW}px`,
              height: `${flagH}px`,
              display: 'block'
            }}
          />
        </div>
      </div>

      {/* Optional Neon text below flagpole */}
      {showText && (
        <div
          className="mt-1 text-center font-bold text-xs tracking-wider text-slate-700 dark:text-slate-200"
          style={{
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            whiteSpace: 'nowrap',
            marginLeft: '-4px'
          }}
        >
          ኢትዮጵያ
        </div>
      )}
    </div>
  );
};

export default StarryFlag;

