import React from "react";
import { motion } from "motion/react";

export type RobotPhase =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

interface RobotFaceProps {
  phase: RobotPhase;
  size?: number;
}

/* ─────────────────────────────────────────────
   MATERIAL SYSTEM
   ───────────────────────────────────────────── */
const silver =
  "linear-gradient(145deg,#ffffff 0%,#e2e8f0 18%,#94a3b8 45%,#cbd5e1 62%,#f8fafc 100%)";
const darkMetal =
  "linear-gradient(145deg,#334155 0%,#0f172a 55%,#475569 100%)";
const visorGlass =
  "linear-gradient(160deg,#0b1220 0%,#020617 60%,#1e293b 100%)";
const bootMetal =
  "linear-gradient(165deg,#e2e8f0 0%,#94a3b8 35%,#475569 70%,#1e293b 100%)";

export const RobotFace: React.FC<RobotFaceProps> = ({
  phase,
  size = 110,
}) => {
  const glow = phase === "error" ? "#fb7185" : "#22d3ee";
  const glowSoft = phase === "error" ? "rgba(251,113,133,0.6)" : "rgba(34,211,238,0.6)";
  const active = phase !== "idle";

  /* Common materials */
  const jointStyle: React.CSSProperties = {
    background: darkMetal,
    border: "1px solid #64748b",
    boxShadow:
      "inset 0 1px 3px #94a3b8, inset 0 -2px 3px #020617, 0 1px 2px #020617",
  };

  const armorStyle: React.CSSProperties = {
    background: silver,
    border: "1px solid #64748b",
    boxShadow:
      "inset 0 2px 4px rgba(255,255,255,.95), inset 0 -2px 4px rgba(15,23,42,.35), 0 2px 4px rgba(0,0,0,.25)",
  };

  const armorDarkStyle: React.CSSProperties = {
    background: darkMetal,
    border: "1px solid #475569",
    boxShadow:
      "inset 0 1px 3px rgba(148,163,184,.5), inset 0 -2px 3px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.4)",
  };

  const bootStyle: React.CSSProperties = {
    background: bootMetal,
    border: "1px solid #334155",
    boxShadow:
      "inset 0 2px 3px rgba(255,255,255,.6), inset 0 -3px 4px rgba(0,0,0,.55), 0 4px 6px rgba(0,0,0,.4)",
  };

  const blueLight: React.CSSProperties = {
    background: glow,
    boxShadow: `0 0 4px ${glow}, 0 0 10px ${glowSoft}, 0 0 16px ${glowSoft}`,
  };

  const limbTransition = {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  /* Blink for idle */
  const blink = {
    scaleY: [1, 1, 0.08, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      times: [0, 0.9, 0.94, 1],
    },
  };

  /* Hand gesture by phase */
  const getLeftHandAnim = () => {
    switch (phase) {
      case "listening":
        return { rotate: [-25, -45, -25] };
      case "speaking":
        return { rotate: [-15, 10, -15] };
      case "thinking":
        return { rotate: [-10, -18, -10] };
      case "error":
        return { rotate: [-5, -5, -5] };
      default:
        return { rotate: [-12, -22, -12] };
    }
  };

  /* Finger curl by phase */
  const fingerCurl = (idx: number) => {
    const base = phase === "idle" ? 15 : 5;
    const wobble = phase === "idle" ? idx % 2 ? 8 : -8 : 2;
    return [base, base + wobble, base];
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size, perspective: 900 }}
    >
      {/* ═══════════ REACTOR AURA ═══════════ */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle,${glowSoft},rgba(37,99,235,.12),transparent 72%)`,
          filter: "blur(6px)",
        }}
        animate={{
          scale: active ? [1, 1.22, 1] : [1, 1.08, 1],
          opacity: [0.4, 0.85, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* ═══════════ FULL ROBOT ═══════════ */}
      <motion.div
        className="relative"
        style={{
          width: "78%",
          height: "98%",
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: [0, -2, 0],
          rotateZ:
            phase === "listening"
              ? [-2, 2, -2]
              : phase === "speaking"
              ? [-1, 1, -1]
              : 0,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* ══════════ ANTENNA ══════════ */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          <div
            className="w-[2.5px] h-[5px]"
            style={{ background: darkMetal }}
          />
          <div
            className="w-[4px] h-[4px] rounded-full mb-[1px]"
            style={jointStyle}
          />
          <motion.div
            className="rounded-full"
            style={{ width: "5px", height: "5px", ...blueLight }}
            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </div>

        {/* ══════════ HEAD ══════════ */}
        <motion.div
          className="absolute z-20"
          style={{
            top: "5%",
            left: "10%",
            width: "80%",
            height: "29%",
            borderRadius: "38% 38% 30% 30%",
            ...armorStyle,
          }}
          animate={{
            rotateY: phase === "listening" ? [-7, 7, -7] : [0, 0, 0],
          }}
          transition={limbTransition}
        >
          {/* Helmet panel line (top seam) */}
          <div className="absolute top-[8%] left-[18%] right-[18%] h-[1px] bg-slate-500/60" />
          <div className="absolute top-[12%] left-[22%] right-[22%] h-[2px] rounded-full bg-white/90" />

          {/* Side mechanical ears with glowing ring */}
          <div
            className="absolute top-[28%] -left-[12%] w-[15%] h-[45%] rounded-l-xl overflow-hidden"
            style={armorStyle}
          >
            <div
              className="absolute inset-[24%] rounded-full border-2"
              style={{ borderColor: glow, boxShadow: `0 0 6px ${glow}, inset 0 0 4px ${glow}` }}
            />
            <div className="absolute top-[10%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
          </div>

          <div
            className="absolute top-[28%] -right-[12%] w-[15%] h-[45%] rounded-r-xl overflow-hidden"
            style={armorStyle}
          >
            <div
              className="absolute inset-[24%] rounded-full border-2"
              style={{ borderColor: glow, boxShadow: `0 0 6px ${glow}, inset 0 0 4px ${glow}` }}
            />
            <div className="absolute top-[10%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Face visor */}
          <div
            className="absolute top-[22%] left-[9%] right-[9%] bottom-[12%] rounded-[28%] overflow-hidden"
            style={{
              background: visorGlass,
              border: "1px solid #475569",
              boxShadow:
                "inset 0 0 14px #000, inset 0 1px 0 rgba(148,163,184,.2)",
            }}
          >
            {/* Visor glass reflection */}
            <div
              className="absolute top-[6%] left-[8%] right-[40%] h-[18%] rounded-full pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg,rgba(255,255,255,.18),transparent)",
                filter: "blur(1px)",
              }}
            />

            {/* Eyes / mouth area */}
            <div className="absolute inset-0 flex items-center justify-center gap-[19%]">
              {phase === "error" ? (
                <div className="flex gap-3 text-rose-400 font-black text-xs">
                  <span>×</span>
                  <span>×</span>
                </div>
              ) : phase === "listening" ? (
                <div className="flex items-center gap-[4px] h-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full"
                      style={{ background: glow, boxShadow: `0 0 4px ${glow}` }}
                      animate={{ height: ["20%", "100%", "20%"] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                    />
                  ))}
                </div>
              ) : phase === "thinking" ? (
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[4px] h-[4px] rounded-full"
                      style={{ background: glow, boxShadow: `0 0 4px ${glow}` }}
                      animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              ) : (
                [1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="relative rounded-full overflow-hidden"
                    style={{
                      width: "19%",
                      height: "38%",
                      background: "linear-gradient(#a5f3fc,#06b6d4)",
                      boxShadow: `0 0 7px ${glow},0 0 14px ${glow}`,
                    }}
                    animate={
                      phase === "speaking"
                        ? { scaleY: [1, 0.7, 1.15, 1] }
                        : blink
                    }
                    transition={
                      phase === "speaking"
                        ? { duration: 0.6, repeat: Infinity }
                        : undefined
                    }
                  >
                    {/* Eye highlight */}
                    <div className="absolute top-[10%] left-[20%] w-[30%] h-[25%] bg-white rounded-full opacity-80" />
                  </motion.div>
                ))
              )}
            </div>

            {/* Animated mouth when speaking */}
            {phase === "speaking" && (
              <motion.div
                className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: "20%", background: glow, boxShadow: `0 0 6px ${glow}` }}
                animate={{ height: ["2px", "6px", "2px"] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
            )}
          </div>

          {/* Helmet forehead detail */}
          <div className="absolute top-[9%] left-[28%] w-[44%] h-[3px] rounded-full bg-white/90" />
          <div className="absolute top-[15%] left-[35%] w-[30%] h-[1px] rounded-full bg-slate-500/70" />
        </motion.div>

        {/* ══════════ NECK ══════════ */}
        <div
          className="absolute z-[9] top-[31%] left-[38%] w-[24%] h-[7%] rounded-b-lg"
          style={jointStyle}
        >
          <div
            className="absolute left-[20%] right-[20%] top-[35%] h-[2px] rounded-full"
            style={blueLight}
          />
        </div>

        {/* ══════════ CHEST ══════════ */}
        <div
          className="absolute z-10 top-[35%] left-[19%] w-[62%] h-[30%] rounded-[30%_30%_24%_24%] overflow-hidden"
          style={armorStyle}
        >
          {/* Chest panel lines */}
          <div className="absolute top-[6%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />
          <div className="absolute top-[88%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />

          {/* Chest core */}
          <div
            className="absolute top-[22%] left-[31%] w-[38%] h-[43%] rounded-xl flex items-center justify-center"
            style={{
              background: darkMetal,
              border: "1px solid #38bdf8",
              boxShadow: `inset 0 0 8px rgba(2,6,23,.8), 0 0 8px ${glowSoft}`,
            }}
          >
            <motion.div
              className="rounded-full"
              style={{ width: "35%", aspectRatio: "1", ...blueLight }}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            {/* Core ring */}
            <div
              className="absolute inset-[18%] rounded-lg border pointer-events-none"
              style={{ borderColor: `${glow}60` }}
            />
          </div>

          {/* Chest side vents */}
          {[0, 1, 2].map((i) => (
            <div
              key={`lvent-${i}`}
              className="absolute rounded-full bg-slate-500/70"
              style={{
                left: "9%",
                top: `${38 + i * 6}%`,
                width: "13%",
                height: "1.5px",
              }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <div
              key={`rvent-${i}`}
              className="absolute rounded-full bg-slate-500/70"
              style={{
                right: "9%",
                top: `${38 + i * 6}%`,
                width: "13%",
                height: "1.5px",
              }}
            />
          ))}

          {/* Cyan accent bars */}
          <div className="absolute left-[8%] top-[30%] w-[15%] h-[2px] rounded-full bg-cyan-400/90" />
          <div className="absolute right-[8%] top-[30%] w-[15%] h-[2px] rounded-full bg-cyan-400/90" />

          {/* Lower torso armor */}
          <div
            className="absolute bottom-[-10%] left-[13%] w-[74%] h-[27%] rounded-b-xl"
            style={jointStyle}
          />
        </div>

        {/* ══════════ LEFT ARM (DETAILED) ══════════ */}
        <motion.div
          className="absolute z-10 top-[39%] left-[-2%] w-[24%] h-[31%] origin-top"
          animate={getLeftHandAnim()}
          transition={limbTransition}
        >
          {/* Shoulder pauldron */}
          <div
            className="absolute top-0 left-[10%] w-[80%] aspect-square rounded-full overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute inset-[22%] rounded-full" style={jointStyle} />
            <div className="absolute top-[15%] left-[25%] right-[25%] h-[1px] bg-white/70" />
          </div>

          {/* Upper arm */}
          <div
            className="absolute top-[26%] left-[22%] w-[56%] h-[28%] rounded-full overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[40%] left-[15%] right-[15%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Elbow joint */}
          <div
            className="absolute top-[49%] left-[26%] w-[48%] aspect-square rounded-full"
            style={jointStyle}
          >
            <div
              className="absolute inset-[30%] rounded-full"
              style={{ ...blueLight, opacity: 0.6 }}
            />
          </div>

          {/* Forearm */}
          <div
            className="absolute top-[65%] left-[18%] w-[64%] h-[26%] rounded-[35%_35%_50%_50%] overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[30%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />
            <div className="absolute top-[55%] left-[25%] right-[25%] h-[1px] bg-slate-500/60" />
          </div>

          {/* Wrist joint */}
          <div
            className="absolute bottom-[-2%] left-[30%] w-[40%] h-[10%] rounded-full"
            style={jointStyle}
          />

          {/* Palm */}
          <motion.div
            className="absolute bottom-[-12%] left-[14%] w-[72%] h-[22%] rounded-[40%] overflow-hidden"
            style={armorStyle}
            animate={
              phase === "speaking"
                ? { rotate: [-6, 6, -6] }
                : { rotate: 0 }
            }
            transition={
              phase === "speaking"
                ? { duration: 0.9, repeat: Infinity }
                : { duration: 0.4 }
            }
          >
            <div className="absolute top-[15%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />
          </motion.div>

          {/* ═══ 4 FINGERS + THUMB — 2-SEGMENT EACH ═══ */}
          {[0, 1, 2, 3].map((finger) => {
            const fingerLen =
              finger === 0 ? "16%" : finger === 3 ? "12%" : "14%";
            const fingerW = "14%";
            const leftPos = 18 + finger * 16;
            return (
              <motion.div
                key={`lfinger-${finger}`}
                className="absolute"
                style={{
                  bottom: `-${parseInt(fingerLen)}%`,
                  left: `${leftPos}%`,
                  width: fingerW,
                  height: fingerLen,
                  transformOrigin: "top center",
                  transformStyle: "preserve-3d",
                }}
                animate={{ rotate: fingerCurl(finger) }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: finger * 0.08,
                }}
              >
                {/* Proximal phalanx (upper segment) */}
                <div
                  className="absolute top-0 left-0 w-full h-[55%] rounded-t-full"
                  style={{
                    background: silver,
                    border: "1px solid #64748b",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
                  }}
                />
                {/* Knuckle joint */}
                <div
                  className="absolute left-[10%] right-[10%] h-[6%] rounded-full"
                  style={{
                    top: "52%",
                    ...jointStyle,
                  }}
                />
                {/* Distal phalanx (lower segment) */}
                <div
                  className="absolute left-[5%] right-[5%] h-[40%] rounded-b-full"
                  style={{
                    top: "58%",
                    background: silver,
                    border: "1px solid #64748b",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
                  }}
                />
              </motion.div>
            );
          })}

          {/* Thumb */}
          <motion.div
            className="absolute"
            style={{
              bottom: "-8%",
              right: "-4%",
              width: "16%",
              height: "20%",
              transformOrigin: "top center",
              transformStyle: "preserve-3d",
            }}
            animate={{ rotate: [25, 35, 25] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="absolute top-0 left-0 w-full h-[55%] rounded-full"
              style={{
                background: silver,
                border: "1px solid #64748b",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
              }}
            />
            <div
              className="absolute left-[15%] right-[15%] h-[6%] rounded-full"
              style={{ top: "52%", ...jointStyle }}
            />
            <div
              className="absolute left-[8%] right-[8%] h-[40%] rounded-full"
              style={{
                top: "58%",
                background: silver,
                border: "1px solid #64748b",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
              }}
            />
          </motion.div>
        </motion.div>

        {/* ══════════ RIGHT ARM (DETAILED) ══════════ */}
        <motion.div
          className="absolute z-10 top-[39%] right-[-2%] w-[24%] h-[31%] origin-top"
          animate={{
            rotate:
              phase === "idle"
                ? [12, 22, 12]
                : phase === "speaking"
                ? [10, -5, 10]
                : [5, 5, 5],
          }}
          transition={limbTransition}
        >
          {/* Shoulder */}
          <div
            className="absolute top-0 left-[10%] w-[80%] aspect-square rounded-full overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute inset-[22%] rounded-full" style={jointStyle} />
            <div className="absolute top-[15%] left-[25%] right-[25%] h-[1px] bg-white/70" />
          </div>

          {/* Upper arm */}
          <div
            className="absolute top-[26%] left-[22%] w-[56%] h-[28%] rounded-full overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[40%] left-[15%] right-[15%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Elbow */}
          <div
            className="absolute top-[49%] left-[26%] w-[48%] aspect-square rounded-full"
            style={jointStyle}
          >
            <div
              className="absolute inset-[30%] rounded-full"
              style={{ ...blueLight, opacity: 0.6 }}
            />
          </div>

          {/* Forearm */}
          <div
            className="absolute top-[65%] left-[18%] w-[64%] h-[26%] rounded-[35%_35%_50%_50%] overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[30%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />
            <div className="absolute top-[55%] left-[25%] right-[25%] h-[1px] bg-slate-500/60" />
          </div>

          {/* Wrist */}
          <div
            className="absolute bottom-[-2%] left-[30%] w-[40%] h-[10%] rounded-full"
            style={jointStyle}
          />

          {/* Palm */}
          <div
            className="absolute bottom-[-12%] left-[14%] w-[72%] h-[22%] rounded-[40%] overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[15%] left-[20%] right-[20%] h-[1px] bg-slate-500/60" />
          </div>

          {/* Right fingers */}
          {[0, 1, 2, 3].map((finger) => {
            const fingerLen =
              finger === 0 ? "16%" : finger === 3 ? "12%" : "14%";
            const leftPos = 18 + finger * 16;
            return (
              <div
                key={`rfinger-${finger}`}
                className="absolute"
                style={{
                  bottom: `-${parseInt(fingerLen)}%`,
                  left: `${leftPos}%`,
                  width: "14%",
                  height: fingerLen,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="absolute top-0 left-0 w-full h-[55%] rounded-t-full"
                  style={{
                    background: silver,
                    border: "1px solid #64748b",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
                  }}
                />
                <div
                  className="absolute left-[10%] right-[10%] h-[6%] rounded-full"
                  style={{ top: "52%", ...jointStyle }}
                />
                <div
                  className="absolute left-[5%] right-[5%] h-[40%] rounded-b-full"
                  style={{
                    top: "58%",
                    background: silver,
                    border: "1px solid #64748b",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
                  }}
                />
              </div>
            );
          })}

          {/* Right thumb */}
          <div
            className="absolute"
            style={{
              bottom: "-8%",
              left: "-4%",
              width: "16%",
              height: "20%",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-[55%] rounded-full"
              style={{
                background: silver,
                border: "1px solid #64748b",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
              }}
            />
            <div
              className="absolute left-[15%] right-[15%] h-[6%] rounded-full"
              style={{ top: "52%", ...jointStyle }}
            />
            <div
              className="absolute left-[8%] right-[8%] h-[40%] rounded-full"
              style={{
                top: "58%",
                background: silver,
                border: "1px solid #64748b",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.3)",
              }}
            />
          </div>
        </motion.div>

        {/* ══════════ PELVIS / HIP ══════════ */}
        <div
          className="absolute z-[8] top-[62%] left-[27%] w-[46%] h-[11%] rounded-[25%_25%_40%_40%] overflow-hidden"
          style={armorStyle}
        >
          <div className="absolute left-[47%] top-[15%] bottom-[20%] w-[5%] rounded-full bg-slate-500/60" />
          <div className="absolute left-[12%] top-[25%] w-[18%] h-[2px] rounded-full bg-cyan-400/90" />
          <div className="absolute right-[12%] top-[25%] w-[18%] h-[2px] rounded-full bg-cyan-400/90" />
          <div className="absolute top-[60%] left-[18%] right-[18%] h-[1px] bg-slate-500/50" />
        </div>

        {/* ══════════ LEFT LEG (DETAILED) ══════════ */}
        <div className="absolute z-[7] top-[70%] left-[24%] w-[24%] h-[28%]">
          {/* Hip joint */}
          <div
            className="absolute top-[-4%] left-[30%] w-[40%] aspect-square rounded-full"
            style={jointStyle}
          />

          {/* Thigh armor */}
          <div
            className="absolute top-[2%] left-[10%] w-[80%] h-[36%] rounded-[30%_30%_35%_35%] overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[25%] left-[15%] right-[15%] h-[1px] bg-slate-500/50" />
            <div className="absolute top-[55%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Knee joint (with glowing core) */}
          <div
            className="absolute top-[36%] left-[18%] w-[64%] aspect-square rounded-[40%]"
            style={jointStyle}
          >
            <div
              className="absolute inset-[28%] rounded-full"
              style={blueLight}
            />
            {/* Knee cap */}
            <div
              className="absolute top-[8%] left-[15%] right-[15%] h-[20%] rounded-full"
              style={{ background: silver, border: "1px solid #94a3b8" }}
            />
          </div>

          {/* Shin armor */}
          <div
            className="absolute top-[52%] left-[16%] w-[68%] h-[36%] rounded-[25%_25%_30%_30%] overflow-hidden"
            style={armorStyle}
          >
            <div
              className="absolute left-[15%] right-[15%] top-[28%] h-[2px] rounded-full"
              style={blueLight}
            />
            <div className="absolute top-[55%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
            <div className="absolute top-[75%] left-[25%] right-[25%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Ankle joint */}
          <div
            className="absolute bottom-[8%] left-[32%] w-[36%] h-[12%] rounded-full"
            style={jointStyle}
          />

          {/* Boot */}
          <div
            className="absolute bottom-0 left-[-8%] w-[116%] h-[20%] rounded-[35%_35%_20%_20%] overflow-hidden"
            style={bootStyle}
          >
            {/* Boot side panel line */}
            <div className="absolute top-[30%] left-[10%] right-[10%] h-[1px] bg-slate-800/50" />
            {/* Boot light strip */}
            <div
              className="absolute bottom-[25%] left-[18%] right-[18%] h-[2px] rounded-full"
              style={blueLight}
            />
            {/* Boot toe accent */}
            <div className="absolute bottom-[10%] left-[35%] right-[35%] h-[1px] bg-slate-800/60" />
          </div>
        </div>

        {/* ══════════ RIGHT LEG (DETAILED) ══════════ */}
        <div className="absolute z-[7] top-[70%] right-[24%] w-[24%] h-[28%]">
          {/* Hip joint */}
          <div
            className="absolute top-[-4%] left-[30%] w-[40%] aspect-square rounded-full"
            style={jointStyle}
          />

          {/* Thigh */}
          <div
            className="absolute top-[2%] left-[10%] w-[80%] h-[36%] rounded-[30%_30%_35%_35%] overflow-hidden"
            style={armorStyle}
          >
            <div className="absolute top-[25%] left-[15%] right-[15%] h-[1px] bg-slate-500/50" />
            <div className="absolute top-[55%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Knee */}
          <div
            className="absolute top-[36%] left-[18%] w-[64%] aspect-square rounded-[40%]"
            style={jointStyle}
          >
            <div className="absolute inset-[28%] rounded-full" style={blueLight} />
            <div
              className="absolute top-[8%] left-[15%] right-[15%] h-[20%] rounded-full"
              style={{ background: silver, border: "1px solid #94a3b8" }}
            />
          </div>

          {/* Shin */}
          <div
            className="absolute top-[52%] left-[16%] w-[68%] h-[36%] rounded-[25%_25%_30%_30%] overflow-hidden"
            style={armorStyle}
          >
            <div
              className="absolute left-[15%] right-[15%] top-[28%] h-[2px] rounded-full"
              style={blueLight}
            />
            <div className="absolute top-[55%] left-[20%] right-[20%] h-[1px] bg-slate-500/50" />
            <div className="absolute top-[75%] left-[25%] right-[25%] h-[1px] bg-slate-500/50" />
          </div>

          {/* Ankle */}
          <div
            className="absolute bottom-[8%] left-[32%] w-[36%] h-[12%] rounded-full"
            style={jointStyle}
          />

          {/* Boot */}
          <div
            className="absolute bottom-0 left-[-8%] w-[116%] h-[20%] rounded-[35%_35%_20%_20%] overflow-hidden"
            style={bootStyle}
          >
            <div className="absolute top-[30%] left-[10%] right-[10%] h-[1px] bg-slate-800/50" />
            <div
              className="absolute bottom-[25%] left-[18%] right-[18%] h-[2px] rounded-full"
              style={blueLight}
            />
            <div className="absolute bottom-[10%] left-[35%] right-[35%] h-[1px] bg-slate-800/60" />
          </div>
        </div>

        {/* ══════════ GROUND LIGHT ══════════ */}
        <motion.div
          className="absolute bottom-0 left-[28%] right-[28%] h-[2px] rounded-full z-20"
          style={{
            background: glow,
            boxShadow: `0 0 6px ${glow}, 0 0 14px ${glowSoft}`,
          }}
          animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* ══════════ ACTIVE HALO RING ══════════ */}
      {active && (
        <motion.div
          className="absolute inset-[5%] rounded-full border pointer-events-none"
          style={{ borderColor: `${glow}80` }}
          animate={{ scale: [1, 1.14, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default RobotFace;