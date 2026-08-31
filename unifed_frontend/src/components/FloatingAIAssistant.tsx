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
  Award
} from "lucide-react";
import type { User } from "../types";

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

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialGreeting = currentUser
    ? `Selam ${currentUser.fullName.split(" ")[0]}! I am your Mekdela Amba University AI Academic Assistant & Advisor. How can I assist your ${currentUser.role.replace("_", " ").toLowerCase()} journey today?`
    : `Selam! Welcome to Mekdela Amba University (Tulu Awliya & Masha Campuses). I am your 24/7 AI Campus Guide & Academic Assistant. How can I help you today? (እንደምን አደሩ/ዋሉ! እንዴት ልርዳዎት?)`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      sender: "ai",
      text: initialGreeting,
      timestamp: "Just now",
      category: "GENERAL"
    }
  ]);

  // Update greeting when user changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "msg_init") {
      setMessages([
        {
          id: "msg_init",
          sender: "ai",
          text: initialGreeting,
          timestamp: "Just now",
          category: "GENERAL"
        }
      ]);
    }
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "msg_" + Date.now(),
        sender: "ai",
        text: `Chat history cleared. How else can I assist you with Mekdela Amba University resources?`,
        timestamp: "Just now",
        category: "GENERAL"
      }
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const lower = query.toLowerCase();

      if (lower.includes("exit exam") || lower.includes("heee") || lower.includes("national exam") || lower.includes("ብሔራዊ ፈተና")) {
        aiResponseText = `📌 **Ministry of Education (MoE) Higher Education Exit Exam (HEEE) Blueprint:**\n\n• **Eligibility:** All graduating final-year undergraduate students.\n• **Pass Mark:** 50% cumulative aggregate score.\n• **Curriculum Breakdown:** 100 standardized Multiple Choice Questions testing core departmental competencies (e.g., Software Engineering covers Architecture 25%, Algorithms 20%, Databases 20%, Networks & Security 15%, QA & Testing 10%, Project Ethics 10%).\n• **Resources:** Check the Digital Library or Department Head notices for mock trial exam schedules.`;
      } else if (lower.includes("cgpa") || lower.includes("gpa") || lower.includes("grading") || lower.includes("ውጤት") || lower.includes("distinction")) {
        aiResponseText = `🎓 **Mekdela Amba University Grading & Honors Policy:**\n\n• **Assessment Model (50/20/30):** 50% Continuous Quizzes/Labs/Projects + 20% Midterm Exam + 30% Final Exam.\n• **Graduation Honors:**\n  - *Very Great Distinction (Gold Medal):* CGPA ≥ 3.75 (no grade below B)\n  - *Great Distinction:* CGPA 3.50 – 3.74\n  - *Distinction:* CGPA 3.00 – 3.49\n  - *Pass:* CGPA 2.00 – 2.99\n• **Academic Probation:** Semester GPA < 1.75 triggers an academic warning.`;
      } else if (lower.includes("clearance") || lower.includes("ማጣሪያ") || lower.includes("ዲጂታል ክሊራንስ") || lower.includes("kostima")) {
        aiResponseText = `📑 **Digital Clearance (ክሊራንስ) Workflow:**\n\n1. **Submit Request:** Log in as a student and navigate to the "Digital Clearance" portal.\n2. **Departmental Verification:**\n   - Library (Returned books & no overdue fines)\n   - Department Head (Lab kits, equipment & capstone thesis)\n   - Student Service & Proctor (Dorm inventory & key return)\n   - Registrar & Finance (Fee settlements & transcript processing)\n3. **QR Certificate:** Once all 6 departments approve, a cryptographically signed University Exit Certificate with a verifiable QR code is generated instantly.`;
      } else if (lower.includes("campus") || lower.includes("location") || lower.includes("tulu awliya") || lower.includes("masha") || lower.includes("የት ይገኛል")) {
        aiResponseText = `🏛️ **Mekdela Amba University Campuses & Geography:**\n\n• **Main Campus (Tulu Awliya):** Located in South Wollo Zone, Amhara Region, Ethiopia. Houses the Central Administration, College of Technology & Engineering, College of Natural & Computational Sciences, and Central Stadium.\n• **Masha Campus:** Located in Sheka Zone, Southwest Ethiopia Peoples' Region. Specializes in Agricultural Science, Forestry, Natural Resource Management, and High-Altitude Eco-Research.\n• **Liaison Office:** Ministry of Education Compound, Addis Ababa.`;
      } else if (lower.includes("dorm") || lower.includes("cafe") || lower.includes("food") || lower.includes("ካፌ") || lower.includes("ዶርም") || lower.includes("ምግብ")) {
        aiResponseText = `🏢 **Student Services & Campus Facilities:**\n\n• **Student Dining (ካፌ):** Breakfast (6:30 AM - 8:30 AM), Lunch (11:30 AM - 1:30 PM), Dinner (5:30 PM - 7:30 PM). Managed via digital meal card.\n• **Dormitories:** Block 1-12 (Tulu Awliya) with 24/7 proctor oversight and high-speed campus Wi-Fi.\n• **Health Center:** 24/7 Student Clinic with emergency medical response and counseling services.`;
      } else if (lower.includes("library") || lower.includes("መጽሐፍ") || lower.includes("research") || lower.includes("digital library")) {
        aiResponseText = `📚 **Digital Library & E-Learning Access:**\n\n• The university digital library provides 45,000+ open-access e-books, IEEE journals, and MoE past exit exams.\n• Students and faculty can reserve study carrels and check physical book availability directly through the Library Staff Portal.`;
      } else if (lower.includes("selam") || lower.includes("hi") || lower.includes("hello") || lower.includes("ሰላም") || lower.includes("hey")) {
        aiResponseText = `ሰላም! (Selam!) How may I assist your academic endeavors at Mekdela Amba University today? You can ask me about course schedules, exam blueprints, clearance status, university regulations, or campus navigation!`;
      } else {
        aiResponseText = `🤖 **Mekdela Amba University AI Intelligence:**\n\nI have received your query regarding "${query}".\n\n• **Institutional Knowledge Base:** All university operations adhere to the FDRE Ministry of Education Guidelines and Mekdela Amba Senate Legislation.\n• **Quick Help Options:** You can explore the **Portal Help**, check **Campus Facilities**, or navigate through your assigned role dashboard. Is there a specific regulation, departmental contact, or academic procedure you would like me to clarify?`;
      }

      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: "GENERAL"
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 650);
  };

  const quickPrompts = [
    { label: "MoE Exit Exam Blueprint", amharic: "የብሔራዊ ፈተና መመሪያ", query: "What is the MoE Exit Exam blueprint and pass mark?" },
    { label: "Grading & Honors Policy", amharic: "የውጤትና ምረቃ ደረጃዎች", query: "Explain the university grading 50/20/30 and graduation distinction levels." },
    { label: "Digital Clearance Process", amharic: "የዲጂታል ክሊራንስ ቅደም-ተከተል", query: "How does the digital student clearance workflow work?" },
    { label: "Campuses & Facilities", amharic: "ካምፓሶችና አድራሻ", query: "Tell me about Tulu Awliya and Masha campuses." }
  ];

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Icon + Text in One Single Button, visible when closed) */}
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
              {/* Subtle Outer Glow */}
              <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse blur-md -z-10" />

              {/* Bot Icon with pencil badge */}
              <div className="relative w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
                <Pencil className="w-3 h-3 text-slate-950 absolute -top-0.5 -right-0.5" />
              </div>

              {/* Text & Status Inside the Single Button */}
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

      {/* EXPANDABLE RIGHT-SIDE AI CHAT DRAWER */}
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

            {/* Chat Body (Only if not minimized) */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/70">
                {/* Messages List */}
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
                        {/* Sender Label & Category Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold font-mono ${
                              msg.sender === "user" ? "text-amber-200" : "text-amber-600 dark:text-amber-400"
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

                        {/* Message Text with Markdown formatting */}
                        <div className="whitespace-pre-line text-xs">
                          {msg.text}
                        </div>

                        {/* Copy Button */}
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

                  {/* Typing Indicator */}
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

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Chips */}
                <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto scrollbar-none flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                  {quickPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-[10px] font-medium whitespace-nowrap transition cursor-pointer flex items-center space-x-1 shrink-0"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Input Form */}
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
