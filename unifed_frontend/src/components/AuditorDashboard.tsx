import { useState, useEffect } from "react";
import { User, Grade, AuditLog } from "../types";
import { CampusDatabase } from "../services/api"; // ✅ Changed from mockData
import { AcademicFooter, EthiopianFlag } from "./UniversityHeader";
import { UpdateProfileModal } from "./UpdateProfileModal";
import {
  ShieldAlert,
  FileText,
  Shield,
  Check,
  RefreshCw,
  BarChart2,
  Coins,
  CheckSquare,
  Database,
  UserCog,
  Camera,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AuditorDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  // ✅ Profile update state
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      if (e.detail && e.detail.id === currentUser.id) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("uscms_user_updated", handleUserUpdate);
    return () => window.removeEventListener("uscms_user_updated", handleUserUpdate);
  }, [currentUser.id]);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<"hemis" | "exit-exams" | "grading-audit" | "grants" | "reports">("hemis");
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("2026-06-28T10:15:22Z");

  // States for Fayda & Exit Exam interactive tools
  const [faydaStatus, setFaydaStatus] = useState<{ [id: string]: "VERIFIED" | "PENDING" | "FLAGGED" }>({
    "U_ST01": "VERIFIED",
    "U_ST02": "VERIFIED",
    "U_ST03": "PENDING"
  });

  const [exitExamStatus, setExitExamStatus] = useState<{ [id: string]: "PENDING" | "APPROVED" | "FLAGGED" }>({
    "U_ST01": "PENDING",
    "U_ST02": "APPROVED",
    "U_ST03": "PENDING"
  });

  const [releasingGrant, setReleasingGrant] = useState(false);
  const [grantHash, setGrantHash] = useState<string>("");
  const [grantReleased, setGrantReleased] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIXED: Async data loading with proper error handling
  const loadData = async () => {
    try {
      const [usersData, gradesData, logsData] = await Promise.all([
        CampusDatabase.getUsers(),
        CampusDatabase.getGrades(),
        CampusDatabase.getAuditLogs(),
      ]);

      setStudents(Array.isArray(usersData) ? usersData.filter(u => u.role === "STUDENT") : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setAuditLogs(Array.isArray(logsData) ? logsData.slice(0, 30) : []);
    } catch (error) {
      console.error("Failed to load auditor data:", error);
      setStudents([]);
      setGrades([]);
      setAuditLogs([]);
    }
  };

  // ✅ FIXED: Async HEMIS sync
  const triggerHEMISSync = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      setIsSyncing(false);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      try {
        await CampusDatabase.addAuditLog(
          currentUser.id,
          currentUser.fullName,
          "GOVERNMENT_AUDITOR",
          "HEMIS Master Sync",
          "System",
          "CentralHEMIS",
          "Triggered fully encrypted full-ledger synchronization with Ministry of Education HEMIS servers (SSLv3 SHA-512)."
        );
        showToast("HEMIS master database synchronization completed successfully!");
        await loadData();
      } catch (error) {
        console.error("Failed to sync HEMIS:", error);
        showToast("HEMIS sync failed. Please try again.");
      }
    }, 1800);
  };

  // ✅ FIXED: Async verify Fayda ID
  const verifyFaydaID = async (studentId: string, name: string) => {
    setFaydaStatus(prev => ({
      ...prev,
      [studentId]: "VERIFIED"
    }));
    try {
      await CampusDatabase.addAuditLog(
        currentUser.id,
        currentUser.fullName,
        "GOVERNMENT_AUDITOR",
        "Verify National Fayda ID",
        "User",
        studentId,
        `Verified national biometric ID 'Fayda' registration status for ${name}.`
      );
      showToast(`National Fayda ID verified for ${name}!`);
    } catch (error) {
      console.error("Failed to verify Fayda ID:", error);
      showToast("Failed to verify Fayda ID. Please try again.");
    }
  };

  // ✅ FIXED: Async approve exit exam ticket
  const approveExitExamTicket = async (studentId: string, name: string) => {
    setExitExamStatus(prev => ({
      ...prev,
      [studentId]: "APPROVED"
    }));
    try {
      await CampusDatabase.addAuditLog(
        currentUser.id,
        currentUser.fullName,
        "GOVERNMENT_AUDITOR",
        "Issue Exit Exam Hall Ticket",
        "User",
        studentId,
        `Officially issued MoE National Exit Examination Hall Ticket for graduating senior: ${name}.`
      );
      showToast(`National Exit Exam Ticket issued for ${name}!`);
    } catch (error) {
      console.error("Failed to approve exit exam ticket:", error);
      showToast("Failed to approve exit exam ticket. Please try again.");
    }
  };

  // ✅ FIXED: Async flag exit exam ticket
  const flagExitExamTicket = async (studentId: string, name: string) => {
    setExitExamStatus(prev => ({
      ...prev,
      [studentId]: "FLAGGED"
    }));
    try {
      await CampusDatabase.addAuditLog(
        currentUser.id,
        currentUser.fullName,
        "GOVERNMENT_AUDITOR",
        "Flag Exit Exam Eligibility",
        "User",
        studentId,
        `Flagged graduating senior: ${name} from exit exam due to outstanding institutional reviews.`
      );
      showToast(`Flagged exit exam ticket for ${name}.`);
    } catch (error) {
      console.error("Failed to flag exit exam ticket:", error);
      showToast("Failed to flag exit exam ticket. Please try again.");
    }
  };

  // ✅ FIXED: Async release grant
  const handleReleaseGrant = async () => {
    setReleasingGrant(true);
    setTimeout(async () => {
      setReleasingGrant(false);
      setGrantReleased(true);
      const mockHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join("");
      setGrantHash(mockHash);
      try {
        await CampusDatabase.addAuditLog(
          currentUser.id,
          currentUser.fullName,
          "GOVERNMENT_AUDITOR",
          "Release Capital Operational Grant",
          "Finance",
          "GRANT_2026_Q2",
          `Authorized Federal Ministry capital operational grant of 25,000,000 ETB for campus laboratory scaling. Hash: ${mockHash}`
        );
        showToast("MoE Semester Grant of 25,000,000 ETB released successfully!");
      } catch (error) {
        console.error("Failed to release grant:", error);
        showToast("Failed to release grant. Please try again.");
      }
    }, 1500);
  };

  const showToast = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => {
      setActiveNotification(null);
    }, 4000);
  };

  // Basic stats for Quality Audit
  const averageGpa = students.length > 0 ? (students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / students.length).toFixed(2) : "0.00";

  // Grade Distribution count
  const letterGradeCounts = Array.isArray(grades) ? grades.reduce((acc, g) => {
    acc[g.letterGrade] = (acc[g.letterGrade] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number }) : {};

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Interactive notification toaster */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500/30 px-6 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs md:text-sm font-semibold max-w-lg"
          >
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 font-bold">Federal Monitor:</span>
            <span>{activeNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Government Header with Profile Update */}
      <header className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-500/20 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-500/15 border border-emerald-400/30 p-1.5 rounded-xl flex items-center justify-center shadow-inner">
            <EthiopianFlag className="w-10 h-6.5 rounded-sm shadow-md" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold tracking-widest border border-emerald-500/10">
                FDRE Government Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">• Active Clearance</span>
            </div>
            <h1 className="text-lg md:text-xl font-display font-extrabold text-slate-100 tracking-tight leading-tight">
              Higher Education Management Information System (HEMIS)
            </h1>
            <p className="text-xs text-emerald-400/80 font-medium">
              Ministry of Education • National Quality Assurance & Audit Directorate
            </p>
          </div>
        </div>

        {/* ✅ Profile section with edit button */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            title="Click to edit profile, update name, password, or avatar • መገለጫዎን ለማዘመን ይጫኑ"
            className="group flex items-center space-x-3 p-1.5 rounded-xl hover:bg-white/10 transition text-left cursor-pointer border border-transparent hover:border-emerald-400/40"
          >
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1">
                <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  {currentUser.fullName}
                </span>
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="block text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wider">
                Senior Federal Inspector
              </span>
            </div>

            <div className="relative">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl border border-emerald-500/60 object-cover shadow-md group-hover:border-emerald-400 transition"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-display font-bold text-sm shadow-md group-hover:border-emerald-400 transition">
                  {currentUser.fullName.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-md shadow-xs opacity-80 group-hover:opacity-100 transition-opacity">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
            title="Update Profile, Name, Password & Avatar"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <div className="h-8 w-px bg-slate-700" />
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-200 hover:text-red-300 rounded-lg text-xs font-bold transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ✅ Update Profile Modal */}
      <UpdateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80">
          {/* Quick Stats Summary Card */}
          <div className="p-5 border-b border-slate-800/50 bg-slate-950/20">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
              Audited Institution
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-8 bg-emerald-500 rounded" />
              <div>
                <h4 className="font-display font-extrabold text-slate-200 text-sm">Mekdela Amba University</h4>
                <p className="text-xs text-slate-500 font-mono">ID: MAU-GOV-90112</p>
              </div>
            </div>
          </div>

          <nav className="p-4 flex-1 space-y-1.5">
            <button
              onClick={() => setActiveTab("hemis")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "hemis"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>HEMIS Integration Portal</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab("exit-exams")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "exit-exams"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Exit Exam Compliance</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                National
              </span>
            </button>

            <button
              onClick={() => setActiveTab("grading-audit")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "grading-audit"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Academic Grade Audit</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("grants")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "grants"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Federal Operational Grants</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "reports"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Executive Quality Report</span>
              </div>
            </button>
          </nav>

          {/* Secure Audit Badge */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/30 space-y-2 mt-auto">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-bold font-mono">COMPLIANCE ASSURED</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              All inspections logged instantly in the national ledger for transparency under Higher Education Proclamation No. 1152/2019.
            </p>
          </div>
        </aside>

        {/* Right Side Auditing Canvas */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: HEMIS MASTER INTEGRATION */}
          {activeTab === "hemis" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                    National HEMIS Interface & Sync Core
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">
                    Manage secure administrative bridges, audit biometric National Fayda records, and trace data health indicators.
                  </p>
                </div>
                <button
                  onClick={triggerHEMISSync}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2.5 shadow-md shadow-emerald-600/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing Entire Ledger..." : "Trigger Master HEMIS Sync"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      HEMIS Bridge Status
                    </span>
                    <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">CONNECTED</strong>
                    <span className="text-xs text-emerald-600 font-bold font-mono">SSL Secure</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p>Endpoint: <span className="font-mono">https://hemis.moe.gov.et/api/v4</span></p>
                    <p>Last Audited Handshake: <span className="font-mono">{new Date(lastSyncTime).toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      Biometric Fayda Alignment
                    </span>
                    <span className="text-xs text-slate-500 font-semibold font-mono">MAU Directory</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">
                      {Object.values(faydaStatus).filter(s => s === "VERIFIED").length} / {students.length}
                    </strong>
                    <span className="text-xs bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-500/10">
                      {Object.values(faydaStatus).filter(s => s === "PENDING").length} Pending
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Ensuring all engineering cohorts align with the National Registry database.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      Data Portability Health
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">100% Valid</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">99.8%</strong>
                    <span className="text-[10px] text-slate-400 font-mono">0 Sync Dropped</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Institutional ledger matches Ministry standardization rules perfectly.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-base">
                    Federal Biometric Fayda ID Audit
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Align student records with biometric ID tokens to prevent duplicate identity registry or credential forging.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student ID</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">College Program</th>
                        <th className="p-4">National Entrance Exam Score</th>
                        <th className="p-4">Biometric Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students.map((st) => {
                        const status = faydaStatus[st.id] || "PENDING";
                        const mockEntranceScores: { [id: string]: number } = {
                          "U_ST01": 568,
                          "U_ST02": 591,
                          "U_ST03": 512
                        };
                        const score = mockEntranceScores[st.id] || 480;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/30 transition">
                            <td className="p-4 font-mono font-bold text-slate-900">{st.studentId}</td>
                            <td className="p-4 font-semibold text-slate-800">{st.fullName}</td>
                            <td className="p-4 text-xs font-mono">{st.program}</td>
                            <td className="p-4 font-mono font-bold text-slate-700">
                              {score} <span className="text-[10px] text-slate-400">/ 700</span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                                status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-500/10"
                                  : "bg-amber-50 text-amber-700 border-amber-500/10"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {status === "PENDING" ? (
                                <button
                                  onClick={() => verifyFaydaID(st.id, st.fullName)}
                                  className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Verify Biometric token
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono font-medium">✓ Verified Systemwide</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXIT EXAM COMPLIANCE */}
          {activeTab === "exit-exams" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 flex items-center space-x-2">
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                  <span>National Graduation Exit Examination Clearance Desk</span>
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Enforcing MoE Directive 2023 on mandatory exit testing for final year engineering modules. Graduating seniors cannot obtain transcripts until exit exam tickets are issued and verified.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow border border-emerald-500/10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Exit Exam Enrollees
                  </span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-3xl font-display font-black">3</span>
                    <span className="text-xs text-slate-300 font-mono">Software Eng.</span>
                  </div>
                  <div className="h-1 bg-emerald-950 rounded-full mt-3 overflow-hidden">
                    <div className="w-2/3 h-full bg-emerald-400 rounded-full" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Tickets Approved
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-display font-black text-slate-800">
                      {Object.values(exitExamStatus).filter(s => s === "APPROVED").length}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">Passed MoE Clearance</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Hall entrance tickets dispatched to student profiles.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Min Attendance Target
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-display font-black text-slate-800">80%</span>
                    <span className="text-xs text-slate-400">MoE Directive UC-I-07</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Continuous attendance tracking audited.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-base">Graduating Student Clearance Desk</h4>
                  <p className="text-slate-500 text-xs">Verify study hours, continuous grading status, outstanding fees, and dispatch examination hall tickets.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student</th>
                        <th className="p-4">CGPA Track</th>
                        <th className="p-4">Institutional Attendance</th>
                        <th className="p-4">Finances Status</th>
                        <th className="p-4">National Exit Exam Clearance</th>
                        <th className="p-4 text-right">Clearance Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students.map((st) => {
                        const status = exitExamStatus[st.id] || "PENDING";
                        const attendances: { [id: string]: number } = {
                          "U_ST01": 92,
                          "U_ST02": 96,
                          "U_ST03": 74
                        };
                        const att = attendances[st.id] || 85;
                        const fees = st.outstandingFees || 0;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/30 transition">
                            <td className="p-4">
                              <span className="block font-semibold text-slate-900">{st.fullName}</span>
                              <span className="block text-[10px] font-mono text-slate-400">{st.studentId}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-800">{st.cgpa?.toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-bold ${att < 80 ? "text-danger" : "text-emerald-700"}`}>
                                  {att}%
                                </span>
                                {att < 80 && (
                                  <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold border border-red-200">
                                    Low Attendance
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono font-semibold">
                              {fees > 0 ? (
                                <span className="text-red-600">{fees} ETB Overdue</span>
                              ) : (
                                <span className="text-emerald-700">✓ Fully Paid</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                                status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-500/10"
                                  : status === "FLAGGED"
                                  ? "bg-red-50 text-danger border-red-500/10"
                                  : "bg-amber-50 text-amber-700 border-amber-500/10"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => approveExitExamTicket(st.id, st.fullName)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                                  >
                                    Approve Entrance Ticket
                                  </button>
                                  <button
                                    onClick={() => flagExitExamTicket(st.id, st.fullName)}
                                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                  >
                                    Flag Student
                                  </button>
                                </>
                              ) : status === "FLAGGED" ? (
                                <button
                                  onClick={() => approveExitExamTicket(st.id, st.fullName)}
                                  className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Reinstate & Clear
                                </button>
                              ) : (
                                <div className="text-xs text-emerald-600 font-semibold font-mono flex items-center justify-end space-x-1">
                                  <Check className="w-4 h-4" />
                                  <span>Ticket Cleared</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC GRADE AUDIT */}
          {activeTab === "grading-audit" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                  Academic Standardizations & Grade Curve Compliance
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Enforcing grade distribution policies under Higher Education Quality Assurance guidelines. Standard MoE policy recommends A-grade distribution should fall between 10% - 20% to prevent grade inflation.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">Grading Curve Distribution</h4>
                    <p className="text-slate-500 text-xs mt-0.5">MAU vs MoE National Benchmark Curve</p>
                  </div>

                  <div className="space-y-4 my-6">
                    {[
                      { grade: "A Grade", count: letterGradeCounts["A"] || 0, pct: 25, benchmark: "15%" },
                      { grade: "B Grade", count: letterGradeCounts["B"] || 0, pct: 40, benchmark: "30%" },
                      { grade: "C Grade", count: letterGradeCounts["C"] || 0, pct: 25, benchmark: "40%" },
                      { grade: "D/F Grade", count: (letterGradeCounts["D"] || 0) + (letterGradeCounts["F"] || 0), pct: 10, benchmark: "15%" }
                    ].map((g, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-semibold">{g.grade} <span className="text-slate-400 font-normal">({g.count} records)</span></span>
                          <span className="font-mono text-slate-500">Benchmark: {g.benchmark}</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center relative">
                          <div
                            style={{ width: `${g.pct}%` }}
                            className="bg-emerald-600 h-full rounded-r transition-all duration-500"
                          />
                          <span className="absolute left-3 text-[10px] text-slate-950 font-bold drop-shadow-sm font-mono">
                            {g.pct}% (MAU Cohort)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs space-y-1.5 text-slate-600 leading-normal">
                    <p className="flex items-center space-x-1.5 font-semibold text-slate-800">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      <span>QA Council Conclusion:</span>
                    </p>
                    <p>MAU exhibits exceptional grade distribution adherence. The software engineering department remains aligned with the official standard deviation guidelines.</p>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="font-display font-bold text-slate-800 text-base">Grading Ledgers Verification Queue</h4>
                  <p className="text-slate-500 text-xs">Verify continuous assessments vs final exams weight distribution (50/20/30 MoE policy).</p>

                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs sticky top-0 bg-white">
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Course Code</th>
                          <th className="p-3">Continuous (50)</th>
                          <th className="p-3">Mid Exam (20)</th>
                          <th className="p-3">Final Exam (30)</th>
                          <th className="p-3">Total (100)</th>
                          <th className="p-3">Assigned Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-sans text-xs md:text-sm">
                        {Array.isArray(grades) && grades.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/20">
                            <td className="p-3 font-semibold text-slate-800">{g.studentName}</td>
                            <td className="p-3 font-mono font-bold text-primary">{g.courseCode}</td>
                            <td className="p-3 font-mono">{g.continuousAssessmentScore}</td>
                            <td className="p-3 font-mono">{g.midExamScore}</td>
                            <td className="p-3 font-mono">{g.finalExamScore}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{g.totalGrade}%</td>
                            <td className="p-3">
                              <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-500/10">
                                {g.letterGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAPITAL OPERATIONS GRANTS */}
          {activeTab === "grants" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 flex items-center space-x-2">
                  <Coins className="w-6 h-6 text-emerald-600" />
                  <span>Federal Capacity Building & Capital Grants Allocation</span>
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Manage MoE special infrastructure development funds, distribute operational grants to Mekdela Amba University laboratories, and view central bank cryptographic ledger hashes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-base">Federal Lab Scaling Grant</h4>
                    <p className="text-slate-500 text-xs">Authorize and sign off on semester infrastructure grants for research labs.</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Fund Target:</span>
                      <strong className="text-slate-800">Advanced Systems Lab (Engineering Block C)</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Allocation Amount:</span>
                      <strong className="text-slate-900 font-mono text-base text-emerald-700 font-bold">25,000,000 ETB</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Status:</span>
                      {grantReleased ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center space-x-1 font-mono">
                          <Check className="w-4 h-4" />
                          <span>RELEASED TO CENTRAL BANK</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold text-xs font-mono">PENDING RELEASE AUTHORIZATION</span>
                      )}
                    </div>
                  </div>

                  {grantReleased && (
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-1.5 font-mono text-[10px] text-slate-500">
                      <p className="font-semibold text-slate-700">Cryptographic Central Bank Hash Token:</p>
                      <p className="text-slate-800 break-all select-all border border-slate-200 bg-white p-2 rounded leading-normal font-bold">
                        {grantHash}
                      </p>
                      <p className="text-emerald-600 text-[9px] font-bold">✓ Transaction confirmed on National Higher Education Blockchain Ledger (FDRE-Ledger-Core-V2)</p>
                    </div>
                  )}

                  {!grantReleased ? (
                    <button
                      onClick={handleReleaseGrant}
                      disabled={releasingGrant}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 disabled:opacity-75"
                    >
                      {releasingGrant ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing Transaction Ledger...</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Release & Cryptographically Sign Grant</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full bg-emerald-50 text-emerald-800 py-3 rounded-xl font-bold text-center border border-emerald-200 text-xs">
                      Grant Funds Dispatched & Ledger Finalized
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-base">Gender Inclusivity & Support Support Fund</h4>
                    <p className="text-slate-500 text-xs">Under Federal Directive 41/2012, 10% of institutional grant allocations must directly support special programs for female engineering candidates.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Cohort Support Allocation Ratio</span>
                        <strong className="text-emerald-700">12.5% Audited (Exceeds Target)</strong>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-emerald-600 rounded-full" />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs font-sans">
                      <div className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 block text-sm">Female SE Study Grants</strong>
                          <span className="text-[10px] text-slate-400">MAU Engineering Block</span>
                        </div>
                        <span className="font-mono text-slate-700 font-bold">1,250,000 ETB</span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 block text-sm">Biometric Laptop Distribution Program</strong>
                          <span className="text-[10px] text-slate-400">Special Ministry support package</span>
                        </div>
                        <span className="font-mono text-emerald-600 font-bold">Allocated & Received</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLIANCE REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                  Institutional Compliance & Quality Assurance Report
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Compile verified academic, financial, and national integration metrics into an official Federal compliance dossier suitable for cabinet presentation.
                </p>
              </div>

              <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-2xl p-8 shadow-xl space-y-8 relative">
                <div className="text-center space-y-2 border-b border-double border-slate-300 pb-6">
                  <span className="text-3xl">🇪🇹</span>
                  <h4 className="text-base font-display font-extrabold tracking-tight text-slate-900 uppercase">
                    Federal Democratic Republic of Ethiopia
                  </h4>
                  <h5 className="text-sm font-display font-bold text-slate-700 uppercase">
                    Ministry of Education
                  </h5>
                  <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                    National Higher Education Quality & Audit Commission
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p>REPORT SERIAL: <span className="font-bold text-slate-800">MOE-QA-2026-MAU-SE</span></p>
                    <p>AUDITOR IN CHARGE: <span className="font-bold text-slate-800">{currentUser.fullName}</span></p>
                  </div>
                  <div className="text-right">
                    <p>DATE COMPILED: <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span></p>
                    <p>COMPLIANCE RATING: <span className="font-bold text-emerald-600">CLASS A • CERTIFIED</span></p>
                  </div>
                </div>

                <div className="space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed font-sans">
                  <h5 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">
                    Executive Findings & Audited Ledgers
                  </h5>

                  <p>
                    This evaluation document certifies that <strong>Mekdela Amba University (College of Engineering and Technology)</strong>, having completed systemic review on software engineering cohorts, remains fully compliant with high-level federal directives under Article 14 of Higher Education proclamation:
                  </p>

                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li>
                      <strong>Enrollment Synchronization:</strong> Core student databases are completely synchronized with the central MoE HEMIS API database with an active registry rate of 100%.
                    </li>
                    <li>
                      <strong>National ID Biometric Compliance:</strong> Student national IDs (Fayda tokens) are validated across primary rosters, ensuring absolute identity safety.
                    </li>
                    <li>
                      <strong>National Senior Graduation Exit Exams:</strong> Out of graduating software engineering seniors, {Object.values(exitExamStatus).filter(s => s === "APPROVED").length} of 3 eligible candidates have been issued examination tickets for immediate entry.
                    </li>
                    <li>
                      <strong>Standard Grading Adherence:</strong> No grade inflation has been detected. Average CGPA stands at <strong>{averageGpa}</strong>, compliant with quality standards.
                    </li>
                  </ul>
                </div>

                <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                  <div className="space-y-1 text-center text-xs">
                    <div className="font-bold font-mono text-slate-800">Dr. Tolossa Seme</div>
                    <div className="text-[10px] text-slate-400 font-mono">Senior Director, Quality Assurance MoE</div>
                    <div className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold uppercase mt-1">
                      ✓ Biometric Signed
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <p>Document SHA-256 Token Checksum:</p>
                    <p className="font-bold text-slate-600 select-all font-mono text-[9px]">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 print:hidden">
                  <button
                    onClick={async () => {
                      try {
                        await CampusDatabase.addAuditLog(
                          currentUser.id,
                          currentUser.fullName,
                          "GOVERNMENT_AUDITOR",
                          "Print Quality Dossier",
                          "Report",
                          "QA_REPORT_2026",
                          "Generated and printed official PDF compliance report dossier."
                        );
                        window.print();
                      } catch (error) {
                        console.error("Failed to print report:", error);
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print/Export Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}
