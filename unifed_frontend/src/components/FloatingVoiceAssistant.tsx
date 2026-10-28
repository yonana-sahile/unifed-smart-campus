import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Send,
  Bot,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { User } from "../types";
import { sendChatMessage, api } from "../services/api";
import { RobotFace } from "./RobotFace";   
interface FloatingVoiceAssistantProps {
  currentUser?: User | null;
}

type Phase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface VoiceMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const GROQ_TTS_VOICE = "troy";
const TTS_CHAR_LIMIT = 200;

// ---------------------------------------------------------------------------
// Hook: record microphone audio, return a Blob
// ---------------------------------------------------------------------------
function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async (): Promise<Blob | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);

      return new Promise<Blob | null>((resolve) => {
        resolveRef.current = resolve;
      });
    } catch (err) {
      console.error("Mic error:", err);
      return null;
    }
  }, []);

  // Auto-stop after 15 seconds to avoid runaway recordings
  useEffect(() => {
    if (!isRecording) return;
    const t = setTimeout(stop, 15000);
    return () => clearTimeout(t);
  }, [isRecording, stop]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  return { start, stop, isRecording };
}

// ---------------------------------------------------------------------------
// Groq STT — via Django backend (key stays server-side)
// ---------------------------------------------------------------------------
async function transcribeAudio(
  blob: Blob,
  language: "en" | "am" = "en"
): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "audio.webm");
  form.append("language", language);

  const res = await api.post("/ai/transcribe/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (res.data.text || "").trim();
}

// ---------------------------------------------------------------------------
// Groq TTS — via Django backend (key stays server-side)
// ---------------------------------------------------------------------------
async function speakText(text: string): Promise<HTMLAudioElement | null> {
  const trimmed = text.slice(0, TTS_CHAR_LIMIT);

  const res = await api.post(
    "/ai/speak/",
    { text: trimmed, voice: GROQ_TTS_VOICE },
    { responseType: "blob" }
  );

  const url = URL.createObjectURL(res.data);
  return new Audio(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [micSupported] = useState(
    typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { start: startRecording, stop: stopRecording, isRecording } =
    useMediaRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const pushMessage = (sender: "user" | "ai", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${sender}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // Full pipeline: text -> AI reply -> TTS
  const runPipeline = async (userText: string) => {
    if (!userText.trim()) return;
    setErrorMsg(null);
    pushMessage("user", userText);
    setPhase("thinking");

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));
      const { reply } = await sendChatMessage({
        message: userText,
        history,
      });
      pushMessage("ai", reply);

      // Speak
      try {
        const audio = await speakText(reply);
        if (audio) {
          audioRef.current = audio;
          setPhase("speaking");
          audio.onended = () => {
            setPhase("idle");
            audioRef.current = null;
            URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => {
            setPhase("idle");
            audioRef.current = null;
          };
          await audio.play();
        } else {
          setPhase("idle");
        }
      } catch (ttsErr) {
        console.error("TTS failed:", ttsErr);
        setPhase("idle");
        setErrorMsg("Spoken reply unavailable — text shown above.");
      }
    } catch (err: any) {
      console.error("Chat failed:", err);
      setPhase("error");
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Could not reach the AI. Try again."
      );
    }
  };

  // Mic tap: start recording; second tap stops and submits
  const handleMicTap = async () => {
    if (phase !== "idle") return;
    setErrorMsg(null);

    if (!micSupported) {
      setErrorMsg("Microphone not available in this browser.");
      return;
    }

    // Cancel any speech still playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPhase("listening");
    const blob = await startRecording();
    if (!blob) {
      setPhase("error");
      setErrorMsg("Could not access the microphone.");
      return;
    }

    setPhase("thinking");
    try {
      const transcript = await transcribeAudio(blob, "en");
      if (!transcript) {
        setPhase("error");
        setErrorMsg("No speech detected. Try again.");
        return;
      }
      await runPipeline(transcript);
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err?.message || "Transcription failed.");
    }
  };

  const handleStopListening = () => {
    stopRecording();
  };

  const handleStopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPhase("idle");
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || phase !== "idle") return;
    const text = inputText.trim();
    setInputText("");
    runPipeline(text);
  };

  const statusLabel: Record<Phase, string> = {
    idle: "Online",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    error: "Offline",
  };

  return (
    <>
     {/* FLOATING TRIGGER — bottom LEFT (robot) */}
<AnimatePresence>
  {!isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="fixed bottom-5 left-5 z-50 flex flex-col items-center gap-1"
    >
      <motion.button
        onClick={() => {
          setIsOpen(true);
          if (isMinimized) setIsMinimized(false);
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        aria-label="Open voice assistant — tap to talk"
        title="Talk to your AI companion"
      >
        <RobotFace phase={phase} size={80} />
      </motion.button>
      <span className="text-[9px] font-bold text-cyan-200/90 font-mono tracking-wider bg-slate-950/70 px-2 py-0.5 rounded-full border border-cyan-400/30 backdrop-blur-sm">
        Talk • ተናገር
      </span>
    </motion.div>
  )}
</AnimatePresence>

      {/* PANEL — bottom LEFT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed bottom-24 left-4 sm:left-6 z-50 w-[92vw] sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isMinimized ? "h-[76px]" : "h-[620px] max-h-[82vh]"
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 text-white flex items-center justify-between border-b border-cyan-400/30 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-cyan-400/20 border border-cyan-300/40 flex items-center justify-center text-cyan-100">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-sm">
                      Campus Voice Companion
                    </h3>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        phase === "error"
                          ? "bg-red-400"
                          : "bg-emerald-400 animate-pulse"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-cyan-200 font-mono">
                    {statusLabel[phase]} • English
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/70">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                      <Bot className="w-10 h-10 mx-auto mb-2 text-cyan-500" />
                      <p className="font-semibold">
                        Tap the mic and ask anything
                      </p>
                      <p className="text-[11px] mt-1">
                        “What are my assignments?” • “Explain my last grade.”
                      </p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl p-3 leading-relaxed ${
                          m.sender === "user"
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                        }`}
                      >
                        <div className="text-[10px] font-bold mb-1 opacity-80">
                          {m.sender === "user" ? "You" : "Voice AI"}{" "}
                          <span className="opacity-60 ml-1">{m.timestamp}</span>
                        </div>
                        <div className="whitespace-pre-line">{m.text}</div>
                      </div>
                    </div>
                  ))}

                  {phase === "thinking" && (
                    <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                      <span>Analyzing…</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-800 dark:text-amber-200">
                        {errorMsg}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    {phase === "listening" ? (
                      <button
                        onClick={handleStopListening}
                        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
                        aria-label="Stop listening"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleMicTap}
                        disabled={phase === "thinking" || phase === "speaking"}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Start listening"
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    )}

                    {phase === "speaking" && (
                      <button
                        onClick={handleStopSpeaking}
                        className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                        aria-label="Stop speaking"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Typed fallback */}
                  <form
                    onSubmit={handleTypedSubmit}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={phase !== "idle"}
                      placeholder="Type instead of speaking…"
                      className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || phase !== "idle"}
                      className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Send typed message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingVoiceAssistant;