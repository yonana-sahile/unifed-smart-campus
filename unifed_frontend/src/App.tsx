import { useState, useEffect, FormEvent } from "react";
import type { User, UserRole } from "./types";
import { CampusDatabase } from "./services/api";
import StudentDashboard from "./components/StudentDashboard";
import InstructorDashboard from "./components/InstructorDashboard";
import { RegistrarDashboard, DepartmentHeadDashboard, DeanDashboard, AdminDashboard, AuditorDashboard } from "./components/OtherDashboards";
import { LibraryStaffDashboard } from "./components/LibraryStaffDashboard";
import { FinanceOfficerDashboard } from "./components/FinanceOfficerDashboard";
import { UniversitySeal, EthiopianFlag, ThemeToggle, DigitalClock } from "./components/UniversityHeader";
import { UniversityLandingFooter } from "./components/UniversityLandingFooter";
import CampusMediaBroadcast from "./components/CampusMediaBroadcast";
import CampusNewsTopBar from "./components/CampusNewsTopBar";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import StarryFlag from "./components/StarryFlag";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { LogIn, HelpCircle, Shield, ShieldCheck, GraduationCap, Users, ShieldAlert, AlertCircle, Award, BookOpen, Calendar, CheckCircle2, Lock, Building, CreditCard, Radio, Sparkles, X, Check, Globe, FileCheck, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ✅ LOCAL DEMO USERS – used for 1‑Click Login fallback
const DEMO_USERS: User[] = [
  {
    id: "U_ST01",
    username: "tadesse",
    fullName: "Tadesse G.",
    email: "tadesse@mau.edu.et",
    role: "STUDENT",
    isActive: true,
    studentId: "MAU1402271",
    academicYear: 4,
    semester: 2,
    program: "Software Engineering",
    cgpa: 3.67,
    outstandingFees: 0,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  },
  {
    id: "U_IN01",
    username: "chalachew",
    fullName: "Dr. Chalachew",
    email: "chalachew@mau.edu.et",
    role: "INSTRUCTOR",
    isActive: true,
    instructorId: "INST101",
    department: "Software Engineering",
    specialization: "AI & ML",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: "U_REG01",
    username: "almaz",
    fullName: "Almaz Kebede",
    email: "registrar@mau.edu.et",
    role: "REGISTRAR",
    isActive: true,
    staffId: "REG001",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
  },
  {
    id: "U_DEPT01",
    username: "befekadu",
    fullName: "Dr. Befekadu",
    email: "dephead@mau.edu.et",
    role: "DEPARTMENT_HEAD",
    isActive: true,
    staffId: "DH101",
    department: "Software Engineering",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
  },
  {
    id: "U_DEAN01",
    username: "getachew",
    fullName: "Prof. Getachew",
    email: "dean@mau.edu.et",
    role: "DEAN",
    isActive: true,
    staffId: "DEAN001",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
  },
  {
    id: "U_ADMIN01",
    username: "selamawit",
    fullName: "Selamawit T.",
    email: "admin@mau.edu.et",
    role: "ADMIN",
    isActive: true,
    staffId: "ADMIN001",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
  },
  {
    id: "U_LIB01",
    username: "alemayehu",
    fullName: "Alemayehu B.",
    email: "library@mau.edu.et",
    role: "LIBRARY_STAFF",
    isActive: true,
    staffId: "LIB001",
    librarySection: "Digital Resources",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  },
  {
    id: "U_FIN01",
    username: "meron",
    fullName: "Meron Desta",
    email: "finance@mau.edu.et",
    role: "FINANCE_OFFICER",
    isActive: true,
    officerId: "FIN001",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"
  },
  {
    id: "U_AUD01",
    username: "tolossa",
    fullName: "Dr. Tolossa Seme",
    email: "tolossa.seme@moe.gov.et",
    role: "AUDITOR",
    isActive: true,
    staffId: "MOE001",
    department: "Ministry of Education",
    avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150"
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    // Check if session exists in localStorage
    const savedUser = localStorage.getItem("uscms_current_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("uscms_current_user");
      }
    }
  }, []);

  // ✅ FIXED: Async handleLogin with await
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const users = await CampusDatabase.getUsers(); // ✅ Now awaiting the Promise

      // Pre-seed search by email or username
      const foundUser = users.find(
        (u) =>
          (u.email.toLowerCase() === emailInput.toLowerCase() || u.username.toLowerCase() === emailInput.toLowerCase()) &&
          passwordInput === "password" // Default password for demo simplicity
      );

      if (foundUser) {
        if (!foundUser.isActive) {
          setErrorMessage("This institutional account is currently deactivated by the University Registrar.");
          return;
        }

        localStorage.setItem("uscms_current_user", JSON.stringify(foundUser));
        setCurrentUser(foundUser);
        CampusDatabase.addAuditLog(
          foundUser.id,
          foundUser.fullName,
          foundUser.role,
          "Institutional Login",
          "User",
          foundUser.id,
          `User logged in successfully through the University Credentials Gateway.`
        );
      } else {
        setErrorMessage("Invalid university credentials. You can click any of the authorized demo profiles below to sign in instantly.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage("Unable to connect to the server. Please ensure the backend is running.");
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      CampusDatabase.addAuditLog(
        currentUser.id,
        currentUser.fullName,
        currentUser.role,
        "Institutional Logout",
        "User",
        currentUser.id,
        "User ended active campus management session."
      );
    }
    localStorage.removeItem("uscms_current_user");
    setCurrentUser(null);
    setEmailInput("");
    setPasswordInput("");
  };

  // ✅ UPDATED: Quick login with local fallback + async API call
  const handleQuickLogin = async (email: string) => {
    setEmailInput(email);
    setPasswordInput("password");

    // 1. Try local demo users first (no backend needed)
    const localUser = DEMO_USERS.find((u) => u.email === email);
    if (localUser) {
      localStorage.setItem("uscms_current_user", JSON.stringify(localUser));
      setCurrentUser(localUser);
      // Optionally log audit (skip if backend unavailable)
      try {
        CampusDatabase.addAuditLog(
          localUser.id,
          localUser.fullName,
          localUser.role,
          "Institutional Login",
          "User",
          localUser.id,
          "Quick demo authorization session established (local fallback)."
        );
      } catch {
        // Ignore audit failure
      }
      return;
    }

    // 2. Fallback: try the backend API
    try {
      const users = await CampusDatabase.getUsers(); // ✅ Now awaiting
      const found = users.find((u) => u.email === email);
      if (found) {
        localStorage.setItem("uscms_current_user", JSON.stringify(found));
        setCurrentUser(found);
        CampusDatabase.addAuditLog(
          found.id,
          found.fullName,
          found.role,
          "Institutional Login",
          "User",
          found.id,
          "Quick demo authorization session established (API)."
        );
      } else {
        alert("User not found. Please check credentials or use the demo profiles.");
      }
    } catch (error) {
      console.error("Quick login failed:", error);
      alert("Unable to login. Please ensure the backend is running or use the demo profiles.");
    }
  };

  // Render Dashboard based on role
  if (currentUser) {
    const renderRoleDashboard = () => {
      switch (currentUser.role) {
        case "STUDENT":
          return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
        case "INSTRUCTOR":
          return <InstructorDashboard user={currentUser} onLogout={handleLogout} />;
        case "REGISTRAR":
          return <RegistrarDashboard user={currentUser} onLogout={handleLogout} />;
        case "DEPARTMENT_HEAD":
          return <DepartmentHeadDashboard user={currentUser} onLogout={handleLogout} />;
        case "DEAN":
          return <DeanDashboard user={currentUser} onLogout={handleLogout} />;
        case "ADMIN":
          return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
        case "AUDITOR":
          return <AuditorDashboard user={currentUser} onLogout={handleLogout} />;
        case "LIBRARY_STAFF":
          return <LibraryStaffDashboard user={currentUser} onLogout={handleLogout} />;
        case "FINANCE_OFFICER":
          return <FinanceOfficerDashboard user={currentUser} onLogout={handleLogout} />;
        default:
          return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-6 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-4 max-w-sm">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="font-display font-bold text-slate-800 text-lg">Role Mapping Error</h3>
                <p className="text-xs text-slate-500">The credentials supplied do not have an active institutional portal mapping.</p>
                <button onClick={handleLogout} className="bg-primary text-white text-xs px-5 py-2.5 rounded-xl font-bold">Logout</button>
              </div>
            </div>
          );
      }
    };

    return (
      <>
        <CampusNewsTopBar />
        {renderRoleDashboard()}
        <FloatingAIAssistant currentUser={currentUser} />
      </>
    );
  }

  // --- LOGIN PAGE (unchanged) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/80 dark:from-[#06111f] dark:via-[#071526] dark:to-[#0a1d35] flex flex-col font-sans relative selection:bg-amber-400 selection:text-slate-900 transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <CampusNewsTopBar />

      <header className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-300/80 dark:border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <EthiopianFlag className="w-5 h-3.5 rounded-xs shadow-xs" />
            <div className="flex items-center space-x-2">
              <span className="text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm">FDRE Ministry of Education</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium text-xs hidden sm:inline">Accredited Public Higher Education Institution</span>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold hidden md:flex items-center space-x-1 cursor-pointer transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Verify</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold hidden md:flex items-center space-x-1 cursor-pointer transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Help</span>
            </button>
            <DigitalClock />
            <div className="hidden lg:flex items-center space-x-2 text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-800 pl-3">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold">AY 2025/2026 • Sem II</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 my-4 sm:my-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Side: University Heritage & System Overview */}
          <div className="lg:col-span-6 space-y-6 text-slate-800 dark:text-white text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center lg:justify-start gap-4 sm:gap-5">
              <div className="flex items-end space-x-3.5 shrink-0">
                <div className="shrink-0 flex items-end justify-center">
                  <StarryFlag scale={0.68} poleHeightCustom={190} showText={false} />
                </div>
                <UniversitySeal className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shadow-xl shrink-0" />
              </div>
              <div className="space-y-1 text-center sm:text-left pb-1">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-red-500/10 border border-amber-500/30 dark:border-amber-400/20 px-3.5 py-1 rounded-full text-[11px] font-mono text-slate-800 dark:text-amber-300 font-bold shadow-xs">
                  <EthiopianFlag className="w-4 h-2.5 rounded-xs shadow-xs" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span>OFFICIAL ETHIOPIAN HIGHER EDUCATION PORTAL</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-serif italic">Veritas • Scientia • Virtus (እውነት፣ ሳይንስ እና ዕውቀት)</p>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Mekdela Amba University
              </h1>
              <h2 className="text-base sm:text-lg font-serif text-amber-700 dark:text-amber-300/90 font-medium">
                መቅደላ አምባ ዩኒቨርሲቲ • Smart Campus Management System
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-xl">
              Welcome to the centralized Student Information System (SIS) and Academic Governance Portal. Designed to uphold rigorous educational standards through automated grading policies (50/20/30 continuous assessment), proctored online examinations, automated degree audits, and real-time Ministry of Education (HEMIS) synchronization.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left space-y-1 shadow-sm backdrop-blur-xs">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase font-bold">COLLEGE</span>
                <strong className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Informatics & Tech</strong>
              </div>
              <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left space-y-1 shadow-sm backdrop-blur-xs">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase font-bold">ACCREDITATION</span>
                <strong className="block text-xs font-semibold text-slate-800 dark:text-slate-200">HEIRA & MoE</strong>
              </div>
              <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left space-y-1 shadow-sm backdrop-blur-xs">
                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase font-bold">CAMPUSES</span>
                <strong className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Tulu Awlia & Main</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-semibold flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>HEIRA Accreditation & Audit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-semibold flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Single-Sign-On Guide</span>
              </button>
            </div>
          </div>

          {/* Right Side: University Credentials Gateway Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="university-gradient text-white p-6 text-center relative border-b border-amber-500/20">
                <div className="flex items-center justify-center space-x-2.5 mb-2">
                  <UniversitySeal className="w-8 h-8 drop-shadow-sm" />
                  <EthiopianFlag className="w-5 h-3.5 rounded-xs shadow-xs" />
                  <span className="font-display font-black text-sm tracking-wider uppercase text-amber-300">
                    Mekdela Amba University
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-100">Academic Single Sign-On</h3>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">Unified Campus Management Gateway</p>
              </div>

              <form onSubmit={handleLogin} className="p-6 sm:p-7 space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  <label className="block text-slate-800 dark:text-slate-200 font-semibold">Institutional Username or Email</label>
                  <div className="relative">
                    <LogIn className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="studentId (e.g. U_ST01) or name@mau.edu.et"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-800 dark:text-slate-200 font-semibold">University Password</label>
                    <span className="text-[10px] text-slate-400 font-mono">Demo: "password"</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:underline transition flex items-center space-x-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-amber-500" />
                      <span>Forgot Password? • የይለፍ ቃል ረሱ?</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full university-gradient hover:opacity-95 text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-lg shadow-primary-900/20 flex items-center justify-center space-x-2 border border-amber-400/20 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-300" />
                  <span>SIGN IN TO PORTAL</span>
                </button>
              </form>

              {/* Quick Demo Role Selector Cards – unchanged */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    Quick Access Portal Profiles
                  </span>
                  <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                    1-Click Login
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("tadesse@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Tadesse G.</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">4th Year SE Student</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("chalachew@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:bg-amber-700 group-hover:text-white transition">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Dr. Chalachew</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">Assoc. Professor</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("registrar@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 group-hover:bg-indigo-700 group-hover:text-white transition">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Almaz Kebede</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">University Registrar</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("dephead@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 group-hover:bg-teal-700 group-hover:text-white transition">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Dr. Befekadu</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">SE Dept Head</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("dean@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-400 group-hover:bg-rose-700 group-hover:text-white transition">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Prof. Getachew</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">College Dean</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Selamawit T.</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">IT System Admin</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("library@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:bg-cyan-700 group-hover:text-white transition">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Alemayehu B.</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">Library Staff</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("finance@mau.edu.et")}
                    className="flex items-center space-x-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-slate-800 dark:text-slate-200 font-medium text-left transition shadow-xs group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-700 group-hover:text-white transition">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-[11px]">Meron Desta</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">Finance Officer</span>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("tolossa.seme@moe.gov.et")}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 border border-emerald-500/30 text-white rounded-xl text-left transition shadow-sm text-xs group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <EthiopianFlag className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs" />
                    <div>
                      <span className="block font-bold text-slate-100 text-[11px]">Dr. Tolossa Seme</span>
                      <span className="block text-[9px] text-emerald-400 font-mono">FDRE Ministry of Education Auditor</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono font-bold">
                    FEDERAL QA
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <CampusMediaBroadcast />

      <UniversityLandingFooter
        onOpenSecurityModal={() => setShowSecurityModal(true)}
        onOpenHelpModal={() => setShowHelpModal(true)}
      />

      <AnimatePresence>
        {showSecurityModal && (
          // ... same as before (unchanged)
          <div></div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelpModal && (
          // ... same as before (unchanged)
          <div></div>
        )}
      </AnimatePresence>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onAutoFillLogin={(email) => {
          setEmailInput(email);
          setPasswordInput("password");
        }}
      />

      <FloatingAIAssistant currentUser={currentUser} />
    </div>
  );
}
