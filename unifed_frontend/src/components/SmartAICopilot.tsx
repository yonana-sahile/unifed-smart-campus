import { useState, useId } from "react";
import type { User } from "../types";
import { Sparkles, Bot, Send, BookOpen, Target, Calendar, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SmartAICopilotProps {
  user: User;
  courses?: { courseCode: string; courseTitle: string; creditHours: number }[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  category?: "ACADEMIC" | "SIMULATOR" | "ADVICE" | "EXAM_PREP";
}

export function SmartAICopilot({ user }: SmartAICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init_1",
      sender: "ai",
      text: `Selam ${user.fullName.split(" ")[0]}! I am your Mekdela Amba University Smart Academic Copilot & Advisor. I am trained on your current 4th-Year Software Engineering curriculum, MoE Exit Exam blueprints, and academic regulation policies. How can I assist you today?`,
      timestamp: "Just now",
      category: "ACADEMIC"
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"CHAT" | "CGPA_SIMULATOR" | "STUDY_PLANNER">("CHAT");

  // CGPA Simulator State
  const [targetCgpa, setTargetCgpa] = useState<number>(3.80);
  const [simulatedCourses, setSimulatedCourses] = useState([
    { code: "SEng 4122", title: "Software Architecture & Design", credits: 4, expectedGrade: "A" },
    { code: "CoSc 4102", title: "Distributed Systems & Cloud Computing", credits: 3, expectedGrade: "A-" },
    { code: "SEng 4201", title: "Final Senior Capstone Project II", credits: 4, expectedGrade: "A" },
    { code: "SEng 4112", title: "Software Quality Assurance & Testing", credits: 3, expectedGrade: "B+" },
    { code: "CoSc 3101", title: "Artificial Intelligence & Expert Systems", credits: 3, expectedGrade: "A" }
  ]);

  const gradePoints: { [key: string]: number } = {
    "A+": 4.0, "A": 4.0, "A-": 3.75, "B+": 3.5, "B": 3.0, "B-": 2.75, "C+": 2.5, "C": 2.0, "D": 1.0, "F": 0.0
  };

  const calculateSimulatedGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    simulatedCourses.forEach((c) => {
      totalPoints += (gradePoints[c.expectedGrade] || 3.0) * c.credits;
      totalCredits += c.credits;
    });
    const semGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const currentCgpa = user.cgpa || 3.58;
    // Assuming 120 completed credits prior + this semester credits
    const projectedCgpa = ((currentCgpa * 120) + (semGpa * totalCredits)) / (120 + totalCredits);
    return {
      semesterGpa: semGpa.toFixed(2),
      projectedCgpa: projectedCgpa.toFixed(2),
      meetsTarget: projectedCgpa >= targetCgpa
    };
  };

  const simResult = calculateSimulatedGPA();

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const lower = query.toLowerCase();

      if (lower.includes("exit exam") || lower.includes("heee") || lower.includes("national exam")) {
        aiResponseText = `📌 **Ministry of Education (MoE) Exit Exam Blueprint for Software Engineering:**\n\n1. **Core Domains Tested:**\n   • Software Requirements & Architecture (25%)\n   • Data Structures, Algorithms & OOP (20%)\n   • Database Management & Distributed Systems (20%)\n   • Network Security & Web Technologies (15%)\n   • Software Testing & Quality Assurance (10%)\n   • Project Management & Professional Ethics (10%)\n\n2. **Pass Mark Requirement:** Minimum 50% cumulative score across all 100 standardized MCQs.\n3. **Recommendation:** Focus on Data Structures (Trees/Graphs) and System Design diagrams in the Digital Library repository.`;
      } else if (lower.includes("cgpa") || lower.includes("gpa") || lower.includes("distinction") || lower.includes("honors")) {
        aiResponseText = `🎓 **Mekdela Amba University Academic Honors Criteria:**\n\n• **First Class with Very Great Distinction (Gold Medalist):** CGPA ≥ 3.75 with no grade below B\n• **First Class with Distinction:** CGPA 3.50 – 3.74\n• **First Class (Merit):** CGPA 3.00 – 3.49\n• **Pass:** CGPA 2.00 – 2.99\n\nYour current CGPA is **${user.cgpa || 3.58}**, placing you comfortably in the **First Class with Distinction** category! Switch to the **CGPA Simulator** tab to project your final graduation rank.`;
      } else if (lower.includes("study plan") || lower.includes("schedule") || lower.includes("exam")) {
        aiResponseText = `📅 **Recommended 7-Day High-Retention Study Plan:**\n\n• **Mon & Tue:** Software Architecture (Design Patterns: MVC, Microservices, Event-Driven)\n• **Wed & Thu:** Distributed Systems (Consensus Protocols, CAP Theorem, RPCs)\n• **Fri:** Database Systems (Indexing, ACID, Normalization & SQL Queries)\n• **Sat:** Practice 50 Exit Exam mock questions in the Library Staff repository\n• **Sun:** Capstone code refactoring and rest.`;
      } else if (lower.includes("architecture") || lower.includes("design pattern") || lower.includes("mvc")) {
        aiResponseText = `💡 **Software Architecture Summary:**\n\n• **MVC (Model-View-Controller):** Decouples business data (Model) from presentation (View) and routing logic (Controller).\n• **Microservices:** Independently deployable services communicating over lightweight HTTP REST or gRPC.\n• **Repository Pattern:** Mediates between domain logic and data mapping layers to isolate database queries.`;
      } else {
        aiResponseText = `🤖 Based on your academic record in **${user.program || "Software Engineering"}** at Mekdela Amba University:\n\n• Your academic status is **Healthy & In Good Standing**.\n• Suggested next action: Review your continuous assessment marks in the student portal and confirm that all prerequisite courses have been fulfilled. Is there a specific subject concept or university rule you'd like me to explain?`;
      }

      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 750);
  };

  const quickPrompts = [
    "MoE Exit Exam Blueprint & Topics",
    "How to achieve First Class Distinction?",
    "Generate 7-day Exam Revision Plan",
    "Explain Software Architecture Patterns"
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Header with Navigation Pills */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                Mekdela Smart Academic Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                AI Engine 2.5
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized academic tutor, workload advisor & curriculum assistant
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("CHAT")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "CHAT"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Advisor Chat
          </button>
          <button
            onClick={() => setActiveTab("CGPA_SIMULATOR")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "CGPA_SIMULATOR"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            CGPA Simulator
          </button>
          <button
            onClick={() => setActiveTab("STUDY_PLANNER")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "STUDY_PLANNER"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Exit Exam Matrix
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "CHAT" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Prompts Bar */}
            <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Queries:</span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap transition cursor-pointer hover:shadow-xs shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start space-x-3 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.sender === "user"
                          ? "bg-primary text-white"
                          : "bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                      }`}
                    >
                      {msg.sender === "user" ? <span className="text-xs font-bold">You</span> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/70 dark:border-slate-700/60"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                      <div
                        className={`text-[10px] mt-2 ${
                          msg.sender === "user" ? "text-white/75 text-right" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200/70 dark:border-slate-700 flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask anything about courses, exit exams, grading rules, or study plans..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isTyping}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Ask</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "CGPA_SIMULATOR" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-1">Current Cumulative GPA</span>
                <div className="font-serif font-black text-3xl text-blue-950 dark:text-blue-100">
                  {user.cgpa?.toFixed(2) || "3.58"}
                </div>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 block">Based on 120 completed credit hours</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/40 dark:to-teal-950/40 border border-cyan-200 dark:border-cyan-800">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 block mb-1">Projected Semester GPA</span>
                <div className="font-serif font-black text-3xl text-cyan-950 dark:text-cyan-100">
                  {simResult.semesterGpa}
                </div>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 block">17 Active Semester Credits</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Final Projected CGPA</span>
                  {simResult.meetsTarget && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Target Met
                    </span>
                  )}
                </div>
                <div className="font-serif font-black text-3xl text-emerald-950 dark:text-emerald-100">
                  {simResult.projectedCgpa}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                  {Number(simResult.projectedCgpa) >= 3.75 ? "★ Gold Medalist Distinction" : "★ First Class Distinction"}
                </span>
              </div>
            </div>

            {/* Target Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Desired Graduation Target CGPA</span>
                </label>
                <span className="font-mono font-bold text-base text-primary">{targetCgpa.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="3.00"
                max="4.00"
                step="0.05"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Interactive Course Grade Adjusters */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Interactive Semester Course Forecast
              </h4>
              <div className="space-y-2">
                {simulatedCourses.map((c, idx) => (
                  <div
                    key={c.code}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-primary">{c.code}</span>
                        <span className="text-xs text-slate-500">({c.credits} Cr. Hr)</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {c.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Grade:</span>
                      <select
                        value={c.expectedGrade}
                        onChange={(e) => {
                          const updated = [...simulatedCourses];
                          updated[idx].expectedGrade = e.target.value;
                          setSimulatedCourses(updated);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-primary"
                      >
                        {Object.keys(gradePoints).map((g) => (
                          <option key={g} value={g}>
                            {g} ({gradePoints[g].toFixed(1)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "STUDY_PLANNER" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="font-serif font-bold text-lg">National Higher Education Exit Exam (HEEE) Readiness Matrix</h3>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                National standardized exit benchmark developed in compliance with the Ministry of Education (MoE) directive. 100 questions assessing software engineering competencies.
              </p>
            </div>

            {/* Core Competency Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  domain: "Software Requirements, Analysis & Architecture",
                  weight: "25% Weight",
                  topics: "UML Design, Architectural Patterns (Microservices, Event-Driven), Requirements Engineering",
                  readiness: 88
                },
                {
                  domain: "Algorithms, Data Structures & OOP",
                  weight: "20% Weight",
                  topics: "Trees, Graphs, Dynamic Programming, Big-O Analysis, Design Patterns",
                  readiness: 92
                },
                {
                  domain: "Database Systems & Cloud Infrastructures",
                  weight: "20% Weight",
                  topics: "Relational Normalization, Distributed Transactions (2PC), NoSQL, AWS/Docker fundamentals",
                  readiness: 85
                },
                {
                  domain: "Cybersecurity, Testing & Professional Ethics",
                  weight: "20% Weight",
                  topics: "OWASP Top 10, Unit/Integration Testing, CI/CD Pipelines, Ethiopian ICT Legal Code",
                  readiness: 90
                }
              ].map((pill, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{pill.domain}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                      {pill.weight}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pill.topics}</p>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Knowledge Readiness Score</span>
                      <span className="text-emerald-600 font-mono">{pill.readiness}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pill.readiness}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Mock Exam Schedule for 4th Year Cohort:</span>
                The automated Computer-Based Exit Mock Exam will be activated in ICT Lab 1 on September 8, 2026. All students can test their readiness in the Exam Module.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
