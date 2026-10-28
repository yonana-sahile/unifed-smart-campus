import React from "react";
import { motion } from "motion/react";

export type RobotPhase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface RobotFaceProps {
  phase: RobotPhase;
  size?: number;
}

export const RobotFace: React.FC<RobotFaceProps> = ({ phase, size = 100 }) => {
  const s = size;
  
  // Base colors matching the image
  const silverGradient = "linear-gradient(135deg, #f8f9fa 0%, #d1d5db 40%, #9ca3af 100%)";
  const silverBorder = "#6b7280";
  const darkGradient = "linear-gradient(180deg, #111827 0%, #000000 100%)";
  const eyeGlow = "#67e8f9"; // cyan-300

  // Arm waving animation
  const waveAnimation = {
    rotate: [-10, -60, -10], // angles for waving
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    }
  };

  return (
    <div
      className="relative flex items-end justify-center"
      style={{ width: s, height: s, perspective: 600 }}
    >
      {/* 🌟 Glowing Aura behind the robot */}
      <motion.div
        className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
        animate={{
          scale: phase === "listening" ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🤖 Robot Body Container (bobbing animation) */}
      <motion.div
        className="relative flex flex-col items-center"
        style={{ width: s * 0.7, height: s * 0.8 }}
        animate={{
          y: phase === "idle" ? [0, -4, 0] : 0, // floating up and down
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        
        {/* --- ANTENNA --- */}
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center">
           <div className="w-1 h-3 bg-gray-400 rounded-t-full" />
           <motion.div 
             className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-400 shadow-md"
             animate={{ scale: phase === "listening" ? [1, 1.5, 1] : 1 }}
             transition={{ duration: 0.5, repeat: Infinity }}
           />
        </div>

        {/* --- HEAD --- */}
        <div 
          className="relative w-[75%] h-[50%] rounded-[35%] flex items-center justify-center shadow-xl z-10"
          style={{ 
            background: silverGradient, 
            border: `1px solid ${silverBorder}`,
            boxShadow: "inset 0 4px 10px rgba(255,255,255,0.8), inset 0 -4px 10px rgba(0,0,0,0.2)"
          }}
        >
          {/* Ear pieces */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-1/2 bg-gray-300 rounded-l-md border border-gray-400" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-1/2 bg-gray-300 rounded-r-md border border-gray-400" />

          {/* Black Faceplate */}
          <div 
            className="relative w-[85%] h-[70%] rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ 
              background: darkGradient,
              border: "1.5px solid #374151",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)"
            }}
          >
            {/* Eyes / State logic */}
            {phase === "error" ? (
              <div className="flex gap-3 text-rose-400 font-black text-xl">
                <span>✕</span><span>✕</span>
              </div>
            ) : phase === "listening" ? (
               // Listening Waveform
               <div className="flex items-end gap-1 h-4">
                 {[1, 2, 3, 4].map((i) => (
                   <motion.div
                     key={i}
                     className="w-1 rounded-full bg-cyan-300"
                     animate={{ height: ["20%", "100%", "20%"] }}
                     transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                   />
                 ))}
               </div>
            ) : phase === "thinking" ? (
              // Thinking Dots
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-cyan-300"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            ) : phase === "speaking" ? (
              // Speaking Mouth
              <div className="flex flex-col items-center gap-2 mt-2">
                 <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                 </div>
                 <motion.div 
                   className="w-6 h-3 bg-gray-900 border border-cyan-400/50 rounded-full relative overflow-hidden"
                   animate={{ scaleY: [1, 0.3, 1, 0.5, 1] }}
                   transition={{ duration: 0.6, repeat: Infinity }}
                 >
                   {/* Red inner mouth */}
                   <div className="absolute inset-x-0 bottom-0 h-1/2 bg-rose-500 rounded-b-full" />
                 </motion.div>
              </div>
            ) : (
              // IDLE: The big blue glowing eyes
              <div className="flex gap-3 items-center justify-center">
                 {[0, 1].map((i) => (
                   <motion.div
                     key={i}
                     className="relative w-[18px] h-[22px] rounded-full border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_8px_#67e8f9]"
                     animate={{ scaleY: [1, 1, 0.1, 1, 1] }} // Blink
                     transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 0.98, 1] }}
                   >
                     {/* Inner pupil */}
                     <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                   </motion.div>
                 ))}
              </div>
            )}
          </div>
        </div>

        {/* --- BODY --- */}
        <div 
          className="relative w-[65%] h-[40%] rounded-[40%] mt-1 shadow-lg z-0 flex items-center justify-center"
          style={{ 
            background: silverGradient, 
            border: `1px solid ${silverBorder}`,
            boxShadow: "inset 0 4px 10px rgba(255,255,255,0.8), inset 0 -4px 10px rgba(0,0,0,0.2)"
          }}
        >
          {/* Blue Belly Panel */}
          <div className="w-[60%] h-[60%] rounded-xl bg-blue-300/60 border border-blue-400/50 shadow-inner" />
        </div>

        {/* --- LEFT ARM (Waving) --- */}
        <motion.div
          className="absolute left-[-10%] top-[55%] w-[15%] h-[35%] origin-top"
          animate={waveAnimation}
        >
           <div className="w-full h-full rounded-full border border-gray-400 shadow-sm" style={{ background: silverGradient }} />
        </motion.div>

        {/* --- RIGHT ARM (Static) --- */}
        <div className="absolute right-[-8%] top-[55%] w-[15%] h-[35%] origin-top rotate-12">
           <div className="w-full h-full rounded-full border border-gray-400 shadow-sm" style={{ background: silverGradient }} />
        </div>

        {/* --- LEGS --- */}
        <div className="absolute bottom-[-10%] flex gap-2 w-full justify-center z-[-1]">
            <div className="w-[20%] h-[15%] rounded-b-lg border border-gray-400 shadow-sm" style={{ background: silverGradient }} />
            <div className="w-[20%] h-[15%] rounded-b-lg border border-gray-400 shadow-sm" style={{ background: silverGradient }} />
        </div>

      </motion.div>
    </div>
  );
};

export default RobotFace;