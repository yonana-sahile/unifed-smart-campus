import { useState, useEffect, FormEvent } from "react";
import { User, UserRole } from "./types";
import { CampusDatabase } from "./services/api"; // ✅ CHANGED: now using the new API service
import StudentDashboard from "./components/StudentDashboard";
import InstructorDashboard from "./components/InstructorDashboard";
import { RegistrarDashboard, DepartmentHeadDashboard, DeanDashboard, AdminDashboard, AuditorDashboard } from "./components/OtherDashboards";
import { LibraryStaffDashboard } from "./components/LibraryStaffDashboard";
import { FinanceOfficerDashboard } from "./components/FinanceOfficerDashboard";
import { UniversitySeal, ThemeToggle, DigitalClock } from "./components/UniversityHeader";
import { LogIn, HelpCircle, Shield, GraduationCap, Users, ShieldAlert, AlertCircle, Award, BookOpen, Calendar, CheckCircle2, Lock, Building, CreditCard, DollarSign } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const users = CampusDatabase.getUsers();
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

  const handleQuickLogin = (email: string) => {
    setEmailInput(email);
    setPasswordInput("password");

    // Auto-login
    const found = CampusDatabase.getUsers().find((u) => u.email === email);
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
        "Quick demo authorization session established."
      );
    }
  };

  // Render Dashboard based on role
  if (currentUser) {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/80 dark:from-[#06111f] dark:via-[#071526] dark:to-[#0a1d35] flex flex-col font-sans relative selection:bg-amber-400 selection:text-slate-900 transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Academic Sub-Header - Clean Top Bar */}
      <header className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-300/80 dark:border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">🇪🇹 FDRE Ministry of Education</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs hidden sm:inline">Accredited Public Higher Education Institution</span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <DigitalClock />
            <div className="hidden lg:flex items-center space-x-2 text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-800 pl-3">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold">AY 2025/2026 • Sem II</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Single Sign-On Gateway Container (Positioned below top navbar, no overlap on desktop/PC) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Side: University Heritage & System Overview */}
          <div className="lg:col-span-6 space-y-6 text-slate-800 dark:text-white text-center lg:text-left">
            {/* University Crest & Badge */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <UniversitySeal className="w-16 h-16 sm:w-20 sm:h-20 shadow-xl shrink-0" />
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/20 px-3 py-1 rounded-full text-[11px] font-mono text-amber-800 dark:text-amber-300 font-bold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span>OFFICIAL ACADEMIC PORTAL</span>
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

            {/* Academic Features Badges */}
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
          </div>

          {/* Right Side: University Credentials Gateway Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header with University Royal Navy */}
              <div className="university-gradient text-white p-6 text-center relative border-b border-amber-500/20">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <UniversitySeal className="w-8 h-8" />
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
                </div>

                <button
                  type="submit"
                  className="w-full university-gradient hover:opacity-95 text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-lg shadow-primary-900/20 flex items-center justify-center space-x-2 border border-amber-400/20 cursor-pointer"
                >
                  <span>SIGN IN TO PORTAL</span>
                </button>
              </form>

              {/* Quick Demo Role Selector Cards */}
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

                {/* Federal Government Auditor Quick Access */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("tolossa.seme@moe.gov.et")}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 border border-emerald-500/30 text-white rounded-xl text-left transition shadow-sm text-xs group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">🇪🇹</span>
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
    </div>
  );
}
