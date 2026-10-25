import { useState, useEffect, useRef } from "react";
import { CampusDatabase } from "../services/api";
import type { User, Grade, ExamAttempt, Course, Assignment, Submission } from "../types";
import { Sparkles, Bot, Send, BookOpen, Target, Award, CheckCircle2, Loader2, User as UserIcon, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MaterialUploader, ExtractedPDF } from "./MaterialUploader";

interface SmartAICopilotProps {
  user: User;
  courses?: Course[];
  grades?: Grade[];
  examAttempts?: ExamAttempt[];
  assignments?: Assignment[];
  submissions?: Submission[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const gradePoints: { [key: string]: number } = {
  "A+": 4.0, A: 4.0, "A-": 3.75, "B+": 3.5, B: 3.0, "B-": 2.75, "C+": 2.5, C: 2.0, D: 1.0, F: 0.0,
};

export function SmartAICopilot({
  user, courses = [], grades = [], examAttempts = [], assignments = [], submissions = [],
}: SmartAICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init_1", sender: "ai",
      text: `Selam ${user.fullName.split(" ")[0]}! I am your MAU Smart Academic Copilot. Upload a PDF lecture note, and ask me anything about it — or ask about your grades, courses, and exams.`,
      timestamp: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"CHAT" | "CGPA_SIMULATOR" | "EXIT_EXAM">("CHAT");
  const [material, setMaterial] = useState<ExtractedPDF | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [targetCgpa, setTargetCgpa] = useState<number>(3.75);
  const [simulatedCourses, setSimulatedCourses] = useState<{ code: string; title: string; credits: number; expectedGrade: string }[]>([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    if (grades.length > 0 && simulatedCourses.length === 0) {
      setSimulatedCourses(grades.map((g) => ({
        code: g.courseCode, title: g.courseTitle, credits: g.creditHours,
        expectedGrade: g.letterGrade && g.letterGrade !== "-" ? g.letterGrade : "B",
      })));
    }
  }, [grades]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isTyping) return;

    const userMsg: Message = {
      id: "u_" + Date.now(), sender: "user", text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    try {
      const realGrades = grades.map((g) => `${g.courseCode}: ${g.totalGrade}% (${g.letterGrade}), ${g.creditHours} credits`).join("\n");
      const realCourses = courses.map((c) => `${c.courseCode} - ${c.courseTitle} (${c.creditHours} credits, Instructor: ${c.instructorName || "TBA"}, Prerequisites: ${c.prerequisites?.join(", ") || "None"})`).join("\n");
      const realAssignments = assignments.filter((a) => !submissions.some((s) => String(s.assignmentId) === String(a.id))).map((a) => `${a.title} (due: ${new Date(a.dueDate).toLocaleDateString()})`).join("\n");

      let context = `
Student: ${user.fullName}
Department: ${user.department || "N/A"}
Program: ${user.program || "N/A"}
CGPA: ${user.cgpa?.toFixed(2) || "0.00"}
Outstanding Fees: ${user.outstandingFees || 0} ETB

Enrolled Courses:
${realCourses || "None"}

Current Grades:
${realGrades || "No grades yet"}

Pending Assignments:
${realAssignments || "None"}
      `.trim();

if (material) {
const truncatedPages = material.pages.slice(0, 5).map(
  (p) => `[Page ${p.pageNumber}]\n${p.text}`
).join("\n\n");
  context += `\n\n[UPLOADED MATERIAL: ${material.fileName}]\n${truncatedPages}`;
}
      const fullMessage = `[STUDENT CONTEXT]\n${context}\n\n[QUESTION]\n${query}`;
      const response = await CampusDatabase.sendChatMessage({
        message: fullMessage,
        history: messages.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
      });

      const aiMsg: Message = {
        id: "ai_" + Date.now(), sender: "ai", text: response.reply || "I couldn't generate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI chat failed:", err);
      setMessages((prev) => [...prev, {
        id: "err_" + Date.now(), sender: "ai",
        text: "⚠️ I'm having trouble connecting to the AI service. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally { setIsTyping(false); }
  };

  const calculateSimulatedGPA = () => {
    let totalPoints = 0, totalCredits = 0;
    simulatedCourses.forEach((c) => { totalPoints += (gradePoints[c.expectedGrade] || 3.0) * c.credits; totalCredits += c.credits; });
    const semGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const currentCgpa = user.cgpa || 0;
    const completedCredits = grades.filter((g) => g.totalGrade >= 50).reduce((s, g) => s + g.creditHours, 0);
    const projectedCgpa = completedCredits + totalCredits > 0 ? (currentCgpa * completedCredits + semGpa * totalCredits) / (completedCredits + totalCredits) : 0;
    return { semesterGpa: semGpa.toFixed(2), projectedCgpa: projectedCgpa.toFixed(2), meetsTarget: projectedCgpa >= targetCgpa };
  };
  const simResult = calculateSimulatedGPA();

  const exitExamDomains = [
    { key: "architecture", label: "Software Requirements & Architecture", weight: "25%", topics: "UML, Design Patterns, Microservices", keywords: ["architecture", "design", "requirements", "uml"] },
    { key: "algorithms", label: "Algorithms, Data Structures & OOP", weight: "20%", topics: "Trees, Graphs, DP, OOP", keywords: ["algorithm", "data structure", "oop", "programming"] },
    { key: "database", label: "Database Systems & Cloud", weight: "20%", topics: "SQL, Normalization, ACID, NoSQL", keywords: ["database", "sql", "normalization", "cloud"] },
    { key: "security", label: "Security, Testing & Ethics", weight: "20%", topics: "OWASP, Unit Testing, CI/CD, Ethics", keywords: ["security", "testing", "ethic", "network"] },
  ];
  const exitExamReadiness = exitExamDomains.map((domain) => {
    const relatedAttempts = examAttempts.filter((a) => domain.keywords.some((kw) => a.examTitle?.toLowerCase().includes(kw)));
    if (relatedAttempts.length === 0) return { ...domain, score: 0, attempts: 0 };
    const totalPercent = relatedAttempts.reduce((sum, a) => sum + Math.min(100, ((a.score || 0) / 100) * 100), 0);
    return { ...domain, score: Math.round(totalPercent / relatedAttempts.length), attempts: relatedAttempts.length };
  });

  const quickPrompts = ["What is my CGPA?", "What are my current grades?", "Do I have pending assignments?", "How do I get First Class Distinction?"];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md"><Sparkles className="w-5 h-5" /></div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif font-bold text-lg text-slate-900">MAU Smart Academic Copilot</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">AI Powered</span>
            </div>
            <p className="text-xs text-slate-500">Upload PDFs, ask about grades, or use simulators</p>
          </div>
        </div>
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          {(["CHAT", "CGPA_SIMULATOR", "EXIT_EXAM"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === tab ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}>
              {tab === "CHAT" ? "Advisor Chat" : tab === "CGPA_SIMULATOR" ? "CGPA Simulator" : "Exit Exam"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "CHAT" && (
          <div className="flex-1 flex flex-col overflow-hidden">

            <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Queries:</span>
              {quickPrompts.map((p, idx) => (
                <button key={idx} onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-cyan-500 text-[11px] text-slate-700 whitespace-nowrap transition shrink-0">{p}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start space-x-3 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-primary text-white" : "bg-cyan-50 text-cyan-600 border border-cyan-200"}`}>
                      {msg.sender === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${msg.sender === "user" ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"}`}>
                      <div className="whitespace-pre-line">{msg.text}</div>
                      <div className={`text-[10px] mt-2 ${msg.sender === "user" ? "text-white/75 text-right" : "text-slate-400"}`}>{msg.timestamp}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 border border-slate-200 flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
<div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
  {/* PDF chip — plain HTML, driven by `material` state */}
  {material && (
    <div className="flex items-center space-x-2 mb-2">
      <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-xs max-w-full">
        <FileText className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
        <span className="font-semibold text-cyan-900 truncate max-w-[180px]">
          {material.fileName}
        </span>
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <button
          type="button"
          onClick={() => setMaterial(null)}
          className="text-cyan-700 hover:text-red-600 transition"
          title="Remove PDF"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <span className="text-[11px] text-slate-500">
        {material.pages.length} pages · first 5 analyzed
      </span>
    </div>
  )}

  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
  {/* Search bar: input + paperclip inside one rounded container */}
  <div className="flex-1 flex items-center space-x-2 pl-4 pr-1.5 py-1 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-500 transition">
    <input
      type="text"
      value={inputQuery}
      onChange={(e) => setInputQuery(e.target.value)}
      placeholder={material ? `Ask about "${material.fileName}"...` : "Ask about your grades, courses, or attach a PDF..."}
      className="flex-1 bg-transparent border-none py-1.5 text-sm focus:outline-none disabled:opacity-50"
      disabled={isTyping}
    />

    {/* Paperclip — right edge, INSIDE the search bar */}
    <MaterialUploader
      compact
      currentFileName={material?.fileName}
      onExtracted={setMaterial}
      onClear={() => setMaterial(null)}
    />
  </div>

  <button type="submit" disabled={!inputQuery.trim() || isTyping}
    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center space-x-1.5">
    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Ask</span><Send className="w-4 h-4" /></>}
  </button>
</form>
</div>
          </div>
        )}

        {activeTab === "CGPA_SIMULATOR" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-700 block mb-1">Current CGPA</span>
                <div className="font-serif font-black text-3xl text-blue-950">{user.cgpa?.toFixed(2) || "0.00"}</div>
                <span className="text-[11px] text-blue-600 mt-1 block">{grades.filter((g) => g.totalGrade >= 50).reduce((s, g) => s + g.creditHours, 0)} completed credit hours</span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200">
                <span className="text-xs font-bold text-cyan-700 block mb-1">Projected Semester GPA</span>
                <div className="font-serif font-black text-3xl text-cyan-950">{simResult.semesterGpa}</div>
                <span className="text-[11px] text-cyan-600 mt-1 block">{simulatedCourses.reduce((s, c) => s + c.credits, 0)} credits this semester</span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700">Projected Final CGPA</span>
                  {simResult.meetsTarget && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Target Met</span>}
                </div>
                <div className="font-serif font-black text-3xl text-emerald-950">{simResult.projectedCgpa}</div>
                <span className="text-[11px] text-emerald-600 mt-1 block font-semibold">
                  {Number(simResult.projectedCgpa) >= 3.75 ? "★ Gold Medalist" : Number(simResult.projectedCgpa) >= 3.5 ? "★ First Class" : Number(simResult.projectedCgpa) >= 3.0 ? "★ Merit" : "★ Pass"}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-2"><Target className="w-4 h-4 text-primary" /><span>Desired Graduation Target CGPA</span></label>
                <span className="font-mono font-bold text-base text-primary">{targetCgpa.toFixed(2)}</span>
              </div>
              <input type="range" min="2.0" max="4.0" step="0.05" value={targetCgpa} onChange={(e) => setTargetCgpa(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Enrolled Courses</h4>
              {simulatedCourses.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl">You are not enrolled in any courses yet.</p>
              ) : (
                <div className="space-y-2">
                  {simulatedCourses.map((c, idx) => (
                    <div key={c.code} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-primary">{c.code}</span>
                          <span className="text-xs text-slate-500">({c.credits} Cr. Hr)</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 block truncate">{c.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">Grade:</span>
                        <select value={c.expectedGrade} onChange={(e) => { const updated = [...simulatedCourses]; updated[idx].expectedGrade = e.target.value; setSimulatedCourses(updated); }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-primary">
                          {Object.keys(gradePoints).map((g) => (<option key={g} value={g}>{g} ({gradePoints[g].toFixed(2)})</option>))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "EXIT_EXAM" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md">
              <div className="flex items-center space-x-2 mb-2"><Award className="w-5 h-5 text-yellow-300" /><h3 className="font-serif font-bold text-lg">National Exit Exam Readiness</h3></div>
              <p className="text-xs text-white/90">Based on your real exam attempts, here is your readiness per domain.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exitExamReadiness.map((pill) => (
                <div key={pill.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{pill.label}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">{pill.weight}</span>
                  </div>
                  <p className="text-xs text-slate-500">{pill.topics}</p>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600">Readiness ({pill.attempts} exam{pill.attempts !== 1 ? "s" : ""})</span>
                      <span className={`font-mono ${pill.score >= 70 ? "text-emerald-600" : pill.score > 0 ? "text-amber-600" : "text-slate-400"}`}>{pill.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${pill.score >= 70 ? "bg-emerald-500" : pill.score > 0 ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${pill.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {exitExamReadiness.every((d) => d.attempts === 0) && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">No exam attempts yet</span>
                  Your readiness is 0% because you haven't taken any online exams.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}