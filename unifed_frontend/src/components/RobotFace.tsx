import React from "react";
import { motion } from "motion/react";

export type RobotPhase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface RobotFaceProps {
  phase: RobotPhase;
  size?: number; // px, default 72
}

/**
 * A friendly geometric robot face.
 * - idle:     eyes open, subtle blink, gentle bob
 * - listening: eyes become waveform bars that animate
 * - thinking: eyes become 3 pulsing dots in sequence
 * - speaking: eyes become volume bars pulsing
 * - error:    eyes become "x x"
 */
export const RobotFace: React.FC<RobotFaceProps> = ({ phase, size = 72 }) => {
  const s = size;
  const eyeSize = s * 0.14;
  const ringColor =
    phase === "error"
      ? "from-red-400/40 via-rose-500/30 to-red-400/40"
      : "from-cyan-400/40 via-blue-500/30 to-indigo-400/40";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: s, height: s }}
    >
      {/* Pulsing ring */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringColor} blur-md`}
        animate={{
          scale: phase === "idle" ? [1, 1.12, 1] : [1, 1.05, 1],
          opacity: phase === "error" ? 0.5 : [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: phase === "listening" ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Robot head */}
      <motion.div
        className="relative rounded-[28%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-cyan-300/40 shadow-2xl shadow-cyan-500/30 flex items-center justify-center"
        style={{ width: s * 0.82, height: s * 0.82 }}
        animate={{
          y: phase === "idle" ? [0, -2, 0] : 0,
          rotate: phase === "listening" ? [0, -2, 2, 0] : 0,
        }}
        transition={{
          duration: phase === "idle" ? 3.5 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Antenna */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ width: s * 0.08 }}
        >
          <motion.div
            className="rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/60"
            style={{ width: s * 0.08, height: s * 0.08 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <div
            className="bg-cyan-300/60"
            style={{ width: 1.5, height: s * 0.06 }}
          />
        </div>

        {/* Face plate */}
        <div
          className="relative rounded-2xl bg-slate-950/90 border border-cyan-400/30 flex items-center justify-center gap-2"
          style={{ width: s * 0.62, height: s * 0.42 }}
        >
          {phase === "error" ? (
            // ✕ ✕ eyes
            <div className="flex items-center gap-2">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="text-rose-400 font-black"
                  style={{ fontSize: s * 0.16, lineHeight: 1 }}
                >
                  ✕
                </span>
              ))}
            </div>
          ) : phase === "listening" ? (
            // Waveform bars
            <div className="flex items-end gap-1" style={{ height: s * 0.22 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="bg-cyan-300 rounded-full"
                  style={{ width: Math.max(2, s * 0.035) }}
                  animate={{ height: [s * 0.06, s * 0.22, s * 0.06] }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.09,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          ) : phase === "thinking" ? (
            // Three pulsing dots
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-cyan-300"
                  style={{ width: eyeSize, height: eyeSize }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.18,
                  }}
                />
              ))}
            </div>
          ) : phase === "speaking" ? (
            // Volume bars
            <div className="flex items-center gap-1" style={{ height: s * 0.22 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="bg-emerald-300 rounded-full"
                  style={{ width: Math.max(2, s * 0.035) }}
                  animate={{ height: [s * 0.05, s * 0.2, s * 0.05] }}
                  transition={{
                    duration: 0.55,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          ) : (
            // idle: two rounded eyes that blink
            <div className="flex items-center gap-3">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-cyan-300 shadow-sm shadow-cyan-400"
                  style={{ width: eyeSize, height: eyeSize }}
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    times: [0, 0.92, 0.94, 0.96, 1],
                    ease: "easeInOut",
                    delay: i * 0.02,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Small smile line */}
        <motion.div
          className="absolute bg-cyan-300/70 rounded-full"
          style={{
            width: s * 0.16,
            height: 1.5,
            bottom: s * 0.08,
          }}
          animate={{ opacity: phase === "speaking" ? [0.4, 1, 0.4] : 0.7 }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

export default RobotFace;