import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Newspaper,
  Flame,
  Tag,
  Calendar,
  Clock,
  Sparkles,
  UserCheck,
  RotateCcw,
  LogOut,
  Building2,
  Radio,
  FileText,
  Eye
} from "lucide-react";
import type { User, UserRole } from "./types";
import { CampusDatabase } from "./services/api";
import { UniversitySeal, EthiopianFlag } from "./UniversityHeader";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

interface CampusNewsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewsUpdated?: () => void;
  currentUser?: User | null;
}

export function CampusNewsAdminModal({
  isOpen,
  onClose,
  onNewsUpdated,
  currentUser
}: CampusNewsAdminModalProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    // If the currently logged in user in the app is an ADMIN, auto authenticate
    return currentUser?.role === "ADMIN";
  });

  const [activeTab, setActiveTab] = useState<"CREATE" | "MANAGE">("CREATE");
  const [usernameInput, setUsernameInput] = useState("yonassahile");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  // New News Item Form State
  const [title, setTitle] = useState("");
  const [amharicTitle, setAmharicTitle] = useState("");
  const [category, setCategory] = useState<CampusNewsItem["category"]>("TECH_AI");
  const [summary, setSummary] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [author, setAuthor] = useState("MAU ICT Directorate & Communications");
  const [isBreaking, setIsBreaking] = useState(false);
  const [priorityScore, setPriorityScore] = useState(90);
  const [highlightTag, setHighlightTag] = useState("OFFICIAL ANNOUNCEMENT");
  const [readTime, setReadTime] = useState("2 min read");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Existing News List
  const [newsList, setNewsList] = useState<CampusNewsItem[]>(() =>
    CampusDatabase.getCampusNews()
  );

  const categoryConfigs: Record<
    CampusNewsItem["category"],
    { label: string; amharic: string; color: string }
  > = {
    EXIT_EXAM: {
      label: "National Exit Exam",
      amharic: "ብሔራዊ መውጫ ፈተና",
      color: "from-rose-600 via-red-600 to-amber-600 border-rose-400 text-white"
    },
    TECH_AI: {
      label: "Smart Campus & AI",
      amharic: "ዘመናዊ ቴክኖሎጂ እና ኤአይ",
      color: "from-amber-500 via-yellow-500 to-amber-600 border-amber-300 text-slate-950 font-bold"
    },
    RESEARCH: {
      label: "Agro-Research",
      amharic: "ግብርናና የተፈጥሮ ምርምር",
      color: "from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400 text-white"
    },
    ACADEMIC: {
      label: "Registrar Notice",
      amharic: "ሬጅስትራር ማስታወቂያ",
      color: "from-blue-600 via-indigo-600 to-sky-600 border-blue-400 text-white"
    },
    COMMUNITY: {
      label: "Campus Community",
      amharic: "ማህበረሰብ አገልግሎት",
      color: "from-purple-600 via-indigo-600 to-pink-600 border-purple-400 text-white"
    }
  };

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Check credentials: username 'yonassahile' or 'admin', password '1234' or 'password'
    const isYonas =
      (cleanUser === "yonassahile" || cleanUser === "yonas") &&
      (cleanPass === "1234" || cleanPass === "password");

    const users = CampusDatabase.getUsers();
    const foundAdmin = users.find(
      (u) =>
        u.role === "ADMIN" &&
        (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
        (cleanPass === "1234" || cleanPass === "password")
    );

    if (isYonas || foundAdmin) {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል! (ትክክለኛ፦ username: yonassahile / password: 1234)");
    }
  };

  const handlePublishNews = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim() || !amharicTitle.trim() || !fullContent.trim()) {
      setFeedback({
        type: "error",
        text: "እባክዎ ርዕስ (እንግሊዝኛና አማርኛ) እንዲሁም ሙሉውን የዜና ዝርዝር ያስገቡ።"
      });
      return;
    }

    const config = categoryConfigs[category];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const formattedDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const createdItem = CampusDatabase.addCampusNews({
      title: title.trim(),
      amharicTitle: amharicTitle.trim(),
      category,
      categoryLabel: config.label,
      categoryAmharic: config.amharic,
      badgeColor: config.color,
      date: formattedDate,
      ethiopianDate: "የካቲት 2018 ዓ.ም.",
      readTime: readTime.trim() || "2 min read",
      summary: summary.trim() || title.trim(),
      fullContent: fullContent.trim(),
      author: author.trim() || "Mekdela Amba University Public Relations",
      isBreaking,
      priorityScore: Number(priorityScore) || 90,
      highlightTag: highlightTag.trim() || (isBreaking ? "URGENT • አስቸኳይ" : "OFFICIAL NOTICE")
    });

    const updated = CampusDatabase.getCampusNews();
    setNewsList(updated);
    onNewsUpdated?.();

    setFeedback({
      type: "success",
      text: "አዲሱ የዩኒቨርሲቲ ዜና በተሳካ ሁኔታ በዋናው የቀጥታ ስርጭት ባር (News Bar) ላይ ተለጥፏል!"
    });

    // Reset Form
    setTitle("");
    setAmharicTitle("");
    setSummary("");
    setFullContent("");
    setIsBreaking(false);
  };

  const handleDeleteNews = (id: string) => {
    if (confirm("እርግጠኛ ነዎት ይህን ዜና ከይፋዊው የዩኒቨርሲቲ ዜና ማሰራጫ ማስወገድ ይፈልጋሉ?")) {
      CampusDatabase.deleteCampusNews(id);
      const updated = CampusDatabase.getCampusNews();
      setNewsList(updated);
      onNewsUpdated?.();
    }
  };

  const handleToggleBreaking = (id: string, current: boolean) => {
    CampusDatabase.updateCampusNews(id, { isBreaking: !current });
    const updated = CampusDatabase.getCampusNews();
    setNewsList(updated);
    onNewsUpdated?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans my-auto"
        >
          {/* Header */}
          <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-display font-bold text-base sm:text-lg">
                    Campus News Administration Hub
                  </h3>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                    ADMIN GATE
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 font-mono">
                  የዩኒቨርሲቲው ይፋዊ ዜናዎችና ማስታወቂያዎች ማስተዳደሪያ
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* If NOT Authenticated: Show Secure Admin Login Barrier */}
          {!isAdminAuthenticated ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-bold">
                    Institutional Administrator Verification Required
                  </p>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                    ይህ ክፍል የተጠበቀ የዩኒቨርሲቲው የሚዲያ እና የህዝብ ግንኙነት አስተዳደር ክፍል ነው። እባክዎ የአድሚን መለያዎን ያስገቡ።
                  </p>
                  <div className="pt-1 flex items-center space-x-2 text-[11px]">
                    <span className="font-semibold text-slate-500">ይፋዊ የአድሚን መለያ፦</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-amber-300 font-bold text-amber-800 dark:text-amber-300">
                      User: yonassahile | Pass: 1234
                    </span>
                  </div>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                    Admin Username • የተጠቃሚ ስም
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. yonassahile or admin"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 dark:text-slate-200 font-semibold">
                      Admin Password • የይለፍ ቃል
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Forgot Password? • የይለፍ ቃል ረሱ?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter Admin Password (1234)"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 university-gradient hover:opacity-95 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Verify & Access News Dashboard</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* If Authenticated: Show Full News Management Hub */
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Authenticated Admin Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Authenticated as Admin (Yonas Sahile • Media Directorate)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminAuthenticated(false)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-red-500" />
                  <span>Lock Session</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("CREATE")}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer ${
                    activeTab === "CREATE"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Publish New News • አዲስ ዜና ማተሚያ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("MANAGE")}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer ${
                    activeTab === "MANAGE"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5 text-blue-500" />
                  <span>Manage Active ({newsList.length}) • ማስተዳደሪያ</span>
                </button>
              </div>

              {/* Tab 1: Create News */}
              {activeTab === "CREATE" && (
                <form onSubmit={handlePublishNews} className="space-y-4">
                  {feedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                        feedback.type === "error"
                          ? "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                          : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      }`}
                    >
                      {feedback.type === "error" ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                        English News Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mekdela Amba University Launches New AI Pod"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                        Amharic Title (የአማርኛ ርዕስ) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ምሳሌ፦ መቅደላ አምባ ዩኒቨርሲቲ አዲስ የቴክኖሎጂ ማዕከል አስመረቀ"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                        value={amharicTitle}
                        onChange={(e) => setAmharicTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                        Category • ዘርፍ
                      </label>
                      <select
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                      >
                        <option value="EXIT_EXAM">National Exit Exam (መውጫ ፈተና)</option>
                        <option value="TECH_AI">Smart Campus & AI (ቴክኖሎጂ)</option>
                        <option value="RESEARCH">Agro-Research (ምርምር)</option>
                        <option value="ACADEMIC">Registrar Notice (ሬጅስትራር)</option>
                        <option value="COMMUNITY">Campus Community (ማህበረሰብ)</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                        Highlight Badge / Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. URGENT, BREAKING, TECH"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                        value={highlightTag}
                        onChange={(e) => setHighlightTag(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                        Read Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2 min read"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                      Author / Directorate Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MAU ICT Directorate & Communications"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                      Brief Lead Summary (አጭር ማጠቃለያ)
                    </label>
                    <input
                      type="text"
                      placeholder="One-line summary for ticker preview..."
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                      Full Official Announcement / Article Body *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Enter the full press release, guidelines, or detailed instructions..."
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:outline-none"
                      value={fullContent}
                      onChange={(e) => setFullContent(e.target.value)}
                    />
                  </div>

                  {/* Breaking News Toggle */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Mark as Urgent / Breaking Live Beacon
                        </p>
                        <p className="text-[10px] text-slate-500">
                          በቀይ/ቢጫ የፍላሽ ማብሪያ ባጅ በዋናው የቀጥታ ዜና ላይ እንዲደምቅ ያደርጋል
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBreaking}
                        onChange={(e) => setIsBreaking(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="university-gradient hover:opacity-95 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>ይፋ አድርግ (Publish Live to Campus Ticker)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Manage Existing News */}
              {activeTab === "MANAGE" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Currently published broadcasts appearing on the top ticker bar:
                  </p>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {newsList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              {item.categoryLabel}
                            </span>
                            {item.isBreaking && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white flex items-center space-x-1">
                                <Flame className="w-3 h-3" />
                                <span>BREAKING</span>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.date}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.amharicTitle}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleBreaking(item.id, !!item.isBreaking)}
                            title="Toggle Breaking Status"
                            className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                              item.isBreaking
                                ? "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-600"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 hover:text-red-500"
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 transition cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Contact Help Desk */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Media Directorate & Communications</span>
            </span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
              yonassahile@mau.edu.et
            </span>
          </div>
        </motion.div>
      </div>

      {/* Embedded Forgot Password for Admin Recovery */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onAutoFillLogin={(email) => {
          setUsernameInput(email);
          setPasswordInput("1234");
        }}
      />
    </AnimatePresence>
  );
}
export default CampusNewsAdminModal;
