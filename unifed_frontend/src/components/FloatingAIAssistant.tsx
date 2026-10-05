import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Pencil,
  PenTool,
  Send,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Compass,
  MessageSquare,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronRight,
  Flame,
  Award,
  AlertCircle,
} from "lucide-react";
import type { User } from "../types";
import { sendChatMessage } from "../services/api";

interface FloatingAIAssistantProps {
  currentUser?: User | null;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  category?: "ACADEMIC" | "CLEARANCE" | "EXIT_EXAM" | "CAMPUS_LIFE" | "GENERAL";
}

interface QuickPrompt {
  label: string;
  amharic: string;
  query: string;
  category?: string;
}

// ---------------------------------------------------------------------------
// LOCAL FAST-PATH ANSWERS
// Used only when the backend is unreachable, so the user still gets *something*.
// ---------------------------------------------------------------------------
const LOCAL_FALLBACKS: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["exit exam", "heee", "national exam", "ብሔራዊ ፈተና"],
    reply: `📌 MoE Exit Exam (HEEE) — key facts:

• Eligibility: All graduating final-year undergraduates.
• Pass mark: 50% cumulative aggregate score.
• Format: 100 MCQs, 3 hours.

For your program-specific blueprint, contact your department head.`,
  },
  {
    keywords: ["cgpa", "gpa", "grading", "ውጤት"],
    reply: `🎓 Grading at MAU:

• 50% Continuous Assessment
• 20% Midterm Exam
• 30% Final Exam

Honors: Distinction 3.00–3.49 | Great 3.50–3.74 | Very Great ≥ 3.75`,
  },
  {
    keywords: ["clearance", "ማጣሪያ", "ክሊራንስ"],
    reply: `📑 Digital Clearance workflow:

1. Submit request from "Digital Clearance".
2. Library → Department Head → Dorm Proctor → Registrar & Finance.
3. Exit Certificate with QR code generated automatically.`,
  },
  {
    keywords: ["register", "registration", "enroll", "ምዝገባ"],
    reply: `📝 Course Registration:

1. Log in to student dashboard.
2. Click "Browse & Register".
3. Search for the course.
4. Click "Enroll".
5. Confirm. Course appears in "My Courses".`,
  },
  {
    keywords: ["campus", "tulu", "masha", "የት ይገኛል"],
    reply: `🏛️ Campuses:

• Tulu Awliya (Main) — South Wollo, Amhara Region.
• Masha — Sheka Zone, Southwest Ethiopia.

Registrar: +251 33 222 0120`,
  },
  {
    keywords: ["fee", "tuition", "payment", "finance", "ክፍያ"],
    reply: `💰 Finance & Tuition:

Methods: Telebirr, CBE Birr, Awash Bank, Bank Transfer.
View balance under "Finance & Tuition" in the portal.`,
  },
];

function getLocalFallback(query: string): string | null {
  const lower = query.toLowerCase();
  for (const entry of LOCAL_FALLBACKS) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) return entry.reply;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// MARKDOWN RENDERER (bold only)
// ---------------------------------------------------------------------------
const renderMarkdown = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialGreeting = currentUser
    ? `Selam ${currentUser.fullName.split(" ")[0]}! I am your Mekdela Amba University AI Academic Assistant & Advisor. How can I assist your ${currentUser.role.replace("_", " ").toLowerCase()} journey today?`
    : `Selam! Welcome to Mekdela Amba University (Tulu Awliya & Masha Campuses). I am your 24/7 AI Campus Guide & Academic Assistant. How can I help you today? (እንደምን አደሩ/ዋሉ! እንዴት ልርዳዎት?)`;

  // ---------- RESTORE FROM LOCALSTORAGE ON MOUNT ----------
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("mau_ai_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [
      {
        id: "msg_init",
        sender: "ai",
        text: initialGreeting,
        timestamp: "Just now",
        category: "GENERAL",
      },
    ];
  });

  // ---------- PERSIST TO LOCALSTORAGE ----------
  useEffect(() => {
    try {
      localStorage.setItem("mau_ai_chat_history", JSON.stringify(messages.slice(-50)));
    } catch {
      /* ignore quota errors */
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "msg_init") {
      setMessages([
        {
          id: "msg_init",
          sender: "ai",
          text: initialGreeting,
          timestamp: "Just now",
          category: "GENERAL",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    const fresh: Message[] = [
      {
        id: "msg_" + Date.now(),
        sender: "ai",
        text: `Chat history cleared. How else can I assist you with Mekdela Amba University resources?`,
        timestamp: "Just now",
        category: "GENERAL",
      },
    ];
    setMessages(fresh);
    try {
      localStorage.removeItem("mau_ai_chat_history");
    } catch {
      /* ignore */
    }
  };

  // ---------- SEND MESSAGE ----------
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);
    setLastFailedQuery(null);

    const history = messages
      .filter((m) => m.id !== "msg_init")
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

    try {
      const { reply } = await sendChatMessage({ message: query.trim(), history });
      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: "GENERAL",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errDetail =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      // Try local fallback for known topics
      const local = getLocalFallback(query);

      const aiMsg: Message = {
        id: "ai_err_" + Date.now(),
        sender: "ai",
      text: local
  ? `${local}\n\n— (Offline answer — live AI temporarily unavailable.)`
  : `⚠️ I couldn't reach the AI service. Please try again.\n\nDetails: ${errDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: "GENERAL",
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!local) setLastFailedQuery(query.trim());
    } finally {
      setIsTyping(false);
    }
  };

  const retryLast = () => {
    if (lastFailedQuery) {
      setLastFailedQuery(null);
      handleSendMessage(lastFailedQuery);
    }
  };

  // ---------- QUICK PROMPTS ----------
  const allQuickPrompts: QuickPrompt[] = [
    { label: "MoE Exit Exam Blueprint", amharic: "የብሔራዊ ፈተና መመሪያ", query: "What is the MoE Exit Exam blueprint and pass mark?", category: "EXIT_EXAM" },
    { label: "Grading & Honors", amharic: "የውጤትና ምረቃ ደረጃዎች", query: "Explain the university grading 50/20/30 and graduation distinction levels.", category: "ACADEMIC" },
    { label: "Digital Clearance", amharic: "የዲጂታል ክሊራንስ", query: "How does the digital student clearance workflow work?", category: "CLEARANCE" },
    { label: "Campuses & Facilities", amharic: "ካምፓሶችና አድራሻ", query: "Tell me about Tulu Awliya and Masha campuses.", category: "CAMPUS_LIFE" },
    { label: "Course Registration", amharic: "የኮርስ ምዝገባ", query: "How do I register for a course?", category: "ACADEMIC" },
    { label: "Tuition & Payments", amharic: "ክፍያ", query: "How do I pay my tuition fees?", category: "ACADEMIC" },
    { label: "Academic Probation", amharic: "የአካዳሚክ ጥንቃቄ", query: "What is academic probation and when is it triggered?", category: "ACADEMIC" },
    { label: "Library Rules", amharic: "የቤተ መጻሕፍት ሕጎች", query: "What are the library loan rules and overdue fines?", category: "CAMPUS_LIFE" },
    { label: "Dorm Rules", amharic: "የዶርም ሕጎች", query: "What are the dormitory curfew and visitor rules?", category: "CAMPUS_LIFE" },
    { label: "Cafe Hours", amharic: "የካፌ ሰዓት", query: "What are the cafe dining hours?", category: "CAMPUS_LIFE" },
    { label: "Grade Appeal", amharic: "የውጤት ቅሬታ", query: "How do I appeal a grade?", category: "ACADEMIC" },
    { label: "Scholarships", amharic: "ስኮላርሺፕ", query: "What scholarship types are available?", category: "ACADEMIC" },
  ];

  const visiblePrompts = showAllPrompts ? allQuickPrompts : allQuickPrompts.slice(0, 5);

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.button
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setIsOpen(true);
                if (isMinimized) setIsMinimized(false);
              }}
              className="relative flex items-center space-x-2.5 px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer border border-amber-400/40 backdrop-blur-md bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 hover:shadow-amber-500/40 group"
              title="Open Mekdela Amba University AI Assistant"
            >
              <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse blur-md -z-10" />
              <div className="relative w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
                <Pencil className="w-3 h-3 text-slate-950 absolute -top-0.5 -right-0.5" />
              </div>
              <div className="flex flex-col items-start text-left leading-tight pr-1">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-extrabold text-xs sm:text-sm text-slate-950 tracking-tight">
                    AI Assistant
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-800 animate-pulse" />
                </div>
                <span className="text-[10px] font-semibold text-slate-900/80 font-mono">
                  የኤአይ ረዳት • 24/7 Live
                </span>
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* CHAT DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-300 ${
              isMinimized ? "h-[76px]" : "h-[620px] max-h-[82vh]"
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-primary to-slate-950 text-white flex items-center justify-between border-b border-amber-500/20 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-display font-bold text-sm text-white">
                      MAU AI Academic Assistant
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-amber-300 font-mono">
                    Mekdela Amba University • የኤአይ ረዳት
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                  title="Clear Chat"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/70">
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl p-3.5 relative group shadow-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-xs"
                            : "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold font-mono ${
                              msg.sender === "user"
                                ? "text-amber-200"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {msg.sender === "user" ? "You" : "MAU AI Advisor"}
                          </span>
                          <span
                            className={`text-[9px] ${
                              msg.sender === "user" ? "text-white/70" : "text-slate-400"
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>

                        <div className="whitespace-pre-line text-xs">
                          {renderMarkdown(msg.text)}
                        </div>

                        {msg.sender === "ai" && (
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      </div>
                      <div className="flex space-x-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[11px] font-mono">Analyzing academic regulations...</span>
                    </div>
                  )}

                  {lastFailedQuery && !isTyping && (
                    <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-800 dark:text-amber-200 flex-1">
                        Couldn't reach the AI.
                      </span>
                      <button
                        onClick={retryLast}
                        className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick prompts */}
                <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
                  <div className="flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                    {visiblePrompts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query)}
                        title={item.amharic}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-[10px] font-medium whitespace-nowrap transition cursor-pointer shrink-0"
                      >
                        {item.label}
                      </button>
                    ))}
                    {allQuickPrompts.length > 5 && (
                      <button
                        onClick={() => setShowAllPrompts((s) => !s)}
                        className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {showAllPrompts ? "Less" : `+${allQuickPrompts.length - 5} more`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask about Exit Exam, CGPA, Clearance, rules..."
                    className="flex-1 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition shadow cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIAssistant;