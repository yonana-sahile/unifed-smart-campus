import { useState, useEffect } from "react";
import type { User, Grade, SystemSettings } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import {
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  Radio,
  Search,
  X,
  GraduationCap,
  Mail,
  Phone,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Save,
  UserCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function RegistrarDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "records" | "grades" | "calendar" | "clearance" | "alerts"
  >("records");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, gradesData, settingsData] = await Promise.all([
        CampusDatabase.getUsers(),
        CampusDatabase.getGrades(),
        CampusDatabase.getSettings().catch(() => null),
      ]);

      setStudents(
        Array.isArray(usersData) ? usersData.filter((u) => u.role === "STUDENT") : []
      );
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setSettings(settingsData || null);
    } catch (error) {
      console.error("Failed to load registrar data:", error);
      setStudents([]);
      setGrades([]);
      setSettings(null);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setSaving(true);
    try {
      const numericId = String(editingStudent.id).replace(/^U_/, "");

      await CampusDatabase.updateUser({
        id: numericId,
        username: editingStudent.username,
        email: editingStudent.email,
        first_name: editingStudent.fullName?.split(" ")[0] || "",
        last_name: editingStudent.fullName?.split(" ").slice(1).join(" ") || "",
        student_id: editingStudent.studentId || null,
        program: editingStudent.program || null,
        academic_year: editingStudent.academicYear ?? null,
        semester: editingStudent.semester ?? null,
        cgpa: editingStudent.cgpa ?? null,
        gpa: editingStudent.gpa ?? null,
        outstanding_fees: editingStudent.outstandingFees ?? 0,
        phone_number: editingStudent.phoneNumber || null,
      } as any);

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Update Student Record",
        "User",
        editingStudent.id,
        `Updated record details for student: ${editingStudent.fullName}`
      );

      alert("✅ Student record updated successfully.");
      setEditingStudent(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to update student:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : error?.message || "Unknown error";
      alert("Failed to update student record:\n" + detail);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveGrade = async (gradeId: string) => {
    try {
      const updated: any = await CampusDatabase.updateGrade(gradeId, {
        status: "APPROVED",
      });

      setGrades((prev) =>
        prev.map((g) =>
          g.id === gradeId
            ? { ...g, status: (updated?.status ?? "APPROVED") as Grade["status"] }
            : g
        )
      );

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Approve Semester Grade",
        "Grade",
        gradeId,
        "Officially approved student score to be stamped on transcripts."
      );

      alert("✅ Grade verified and approved for transcript posting.");
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to approve grade: " + detail);
    }
  };

  const handleRejectGrade = async (gradeId: string) => {
    try {
      const updated: any = await CampusDatabase.updateGrade(gradeId, {
        status: "RETURNED",
      });

      setGrades((prev) =>
        prev.map((g) =>
          g.id === gradeId
            ? { ...g, status: (updated?.status ?? "RETURNED") as Grade["status"] }
            : g
        )
      );

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Reject Semester Grade",
        "Grade",
        gradeId,
        "Returned grades to subject instructor for revision."
      );

      alert("📤 Grades returned to instructor for revision.");
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to reject grade: " + detail);
    }
  };

  const filteredStudents = Array.isArray(students)
    ? students.filter((st) => {
        const q = searchQuery.toLowerCase();
        return (
          st.fullName?.toLowerCase().includes(q) ||
          st.studentId?.toLowerCase().includes(q) ||
          st.program?.toLowerCase().includes(q) ||
          st.username?.toLowerCase().includes(q)
        );
      })
    : [];

  // dashboard stats
  const totalStudents = students.length;
  const studentsWithFees = students.filter((s) => (s.outstandingFees ?? 0) > 0).length;
  const pendingGrades = grades.filter((g) => g.status === "SUBMITTED").length;
  const approvedGrades = grades.filter((g) => g.status === "APPROVED").length;

  const navItems = [
    { id: "records", label: "Student Records", shortLabel: "Records", Icon: Users },
    { id: "grades", label: "Verify Instructor Grades", shortLabel: "Grades", Icon: FileText },
    { id: "calendar", label: "Academic Calendar", shortLabel: "Calendar", Icon: Calendar },
    { id: "clearance", label: "Digital Clearance", shortLabel: "Clearance", Icon: ShieldCheck },
    { id: "alerts", label: "Broadcast Circulars", shortLabel: "Alerts", Icon: Radio },
  ] as const;

  const goToTab = (id: string) => {
    setActiveTab(id as any);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="registrar_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Office of the University Registrar"
        portalSubtitle="Directorate of Academic Records, Enrollment & Grade Certification"
        badgeText="REGISTRAR GENERAL"
        badgeType="admin"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#071526] text-slate-300 shadow-2xl flex flex-col border-r border-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">REGISTRAR GENERAL</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 flex-1 overflow-y-auto space-y-1">
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      activeTab === id
                        ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE HORIZONTAL QUICK-NAV */}
      <div className="md:hidden sticky top-[48px] sm:top-[57px] z-30 bg-[#071526] border-b border-slate-800/90 px-2 py-1.5 overflow-x-auto flex items-center space-x-1.5 shadow-md shrink-0 scrollbar-none">
        {navItems.map(({ id, shortLabel, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 active:scale-95 ${
              activeTab === id
                ? "bg-primary text-white border border-amber-400/40 shadow-xs"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeTab === id ? "text-amber-300" : "text-amber-400/80"}`} />
            <span>{shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center space-x-2 mb-1">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                Registrar Management
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Mekdela Amba University</p>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${id === "alerts" ? "text-red-400" : "text-amber-400"}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Registrar Code: <span className="text-amber-400">REG-DIR-01</span></p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
              Verification: Cryptographic
            </p>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0 space-y-6">
          {/* ============ STUDENT RECORDS TAB ============ */}
          {activeTab === "records" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* HERO */}
              <div className="bg-gradient-to-br from-[#0b2136] via-[#0d2942] to-[#071526] rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-amber-300 font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Academic Records • Live Data</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      Student Records Directory
                    </h1>
                    <p className="text-sm text-slate-300 max-w-2xl">
                      Complete academic profiles for all enrolled students. Edit personal data,
                      academic status, and financial records.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">Total Enrolled</p>
                      <p className="text-3xl font-display font-bold text-white">{totalStudents}</p>
                    </div>
                  </div>
                </div>

                {/* STAT CARDS */}
                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-amber-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">Students</span>
                    </div>
                    <p className="text-lg font-bold text-white">{totalStudents}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-red-400 mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">Outstanding Fees</span>
                    </div>
                    <p className="text-lg font-bold text-white">{studentsWithFees}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-blue-400 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">Pending Grades</span>
                    </div>
                    <p className="text-lg font-bold text-white">{pendingGrades}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">Approved Grades</span>
                    </div>
                    <p className="text-lg font-bold text-white">{approvedGrades}</p>
                  </div>
                </div>
              </div>

              {/* SEARCH */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-900">
                    Academic Records
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing {filteredStudents.length} of {totalStudents} students
                  </p>
                </div>
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, program, or username…"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3.5">Student</th>
                        <th className="px-4 py-3.5">Student ID</th>
                        <th className="px-4 py-3.5">Program</th>
                        <th className="px-4 py-3.5">Year / Semester</th>
                        <th className="px-4 py-3.5">CGPA</th>
                        <th className="px-4 py-3.5">Fees</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <UserCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-600">No students found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {searchQuery
                                ? `No matches for "${searchQuery}".`
                                : "No students enrolled yet."}
                            </p>
                          </td>
                        </tr>
                      )}
                      {filteredStudents.map((st) => {
                        const hasFees = (st.outstandingFees ?? 0) > 0;
                        const hasCGPA = (st.cgpa ?? 0) > 0;
                        return (
                          <tr
                            key={st.id}
                            className="hover:bg-slate-50/60 transition group"
                          >
                            {/* PHOTO + NAME */}
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                {st.avatarUrl ? (
                                  <img
                                    src={st.avatarUrl}
                                    alt={st.fullName}
                                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                    {st.fullName?.charAt(0).toUpperCase() || "?"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {st.fullName || st.username || "Unnamed"}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate font-mono">
                                    @{st.username || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* STUDENT ID */}
                            <td className="px-4 py-3">
                              {st.studentId ? (
                                <span className="font-mono text-slate-700 font-medium">
                                  {st.studentId}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-[10px]">
                                  NOT SET
                                </span>
                              )}
                            </td>

                            {/* PROGRAM */}
                            <td className="px-4 py-3">
                              {st.program ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                  {st.program}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>

                            {/* YEAR / SEMESTER */}
                            <td className="px-4 py-3">
                              {st.academicYear || st.semester ? (
                                <span className="font-mono text-slate-700">
                                  Yr {st.academicYear || "?"} • Sem {st.semester || "?"}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>

                            {/* CGPA */}
                            <td className="px-4 py-3">
                              {hasCGPA ? (
                                <div className="flex items-center space-x-1.5">
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="font-mono font-bold text-slate-800">
                                    {st.cgpa!.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>

                            {/* FEES */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                  hasFees
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {hasFees
                                  ? `${st.outstandingFees?.toLocaleString()} ETB`
                                  : "Cleared"}
                              </span>
                            </td>

                            {/* ACTION */}
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditingStudent(st)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-[11px] font-semibold transition"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============ EDIT MODAL ============ */}
              <AnimatePresence>
                {editingStudent && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => !saving && setEditingStudent(null)}
                      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ type: "spring", damping: 26, stiffness: 320 }}
                      className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                      {/* HEADER */}
                      <div className="bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942] p-6 text-white shrink-0 relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            {editingStudent.avatarUrl ? (
                              <img
                                src={editingStudent.avatarUrl}
                                alt={editingStudent.fullName}
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-400/50"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold ring-2 ring-amber-400/50">
                                {editingStudent.fullName?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                            <div>
                              <h3 className="font-display font-bold text-xl">
                                {editingStudent.fullName || "Unnamed Student"}
                              </h3>
                              <p className="text-xs font-mono text-slate-300">
                                {editingStudent.studentId || "No ID assigned"}
                              </p>
                              <p className="text-[10px] text-amber-300 font-mono font-bold mt-1">
                                EDIT ACADEMIC PROFILE
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => !saving && setEditingStudent(null)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* BODY */}
                      <div className="p-6 space-y-5 overflow-y-auto">
                        {/* ACADEMIC */}
                        <section className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Academic Information</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Student ID
                              </label>
                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.studentId || ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    studentId: e.target.value,
                                  })
                                }
                                placeholder="MAU1406159"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Program
                              </label>
                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.program || ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    program: e.target.value,
                                  })
                                }
                                placeholder="Software Engineering"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Academic Year
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={7}
                                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.academicYear ?? ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    academicYear: parseInt(e.target.value) || undefined,
                                  })
                                }
                                placeholder="4"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Semester
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={3}
                                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.semester ?? ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    semester: parseInt(e.target.value) || undefined,
                                  })
                                }
                                placeholder="2"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                CGPA (0.00 – 4.00)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={4}
                                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.cgpa ?? ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    cgpa: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                placeholder="3.50"
                              />
                            </div>
                          </div>
                        </section>

                        {/* PERSONAL */}
                        <section className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                            <UserCircle2 className="w-3.5 h-3.5" />
                            <span>Personal Information</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.fullName || ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    fullName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>Email</span>
                              </label>
                              <input
                                type="email"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.email || ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>Phone</span>
                              </label>
                              <input
                                type="tel"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                value={editingStudent.phoneNumber || ""}
                                onChange={(e) =>
                                  setEditingStudent({
                                    ...editingStudent,
                                    phoneNumber: e.target.value,
                                  })
                                }
                                placeholder="+251 9XX XXX XXX"
                              />
                            </div>
                          </div>
                        </section>

                        {/* FINANCE */}
                        <section className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Financial</span>
                          </h4>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Outstanding Fees (ETB)
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                              value={editingStudent.outstandingFees ?? 0}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  outstandingFees: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Set to 0 if the student has cleared all dues.
                            </p>
                          </div>
                        </section>
                      </div>

                      {/* FOOTER */}
                      <div className="p-4 border-t border-slate-200 bg-slate-50 flex space-x-3 shrink-0">
                        <button
                          onClick={() => !saving && setEditingStudent(null)}
                          disabled={saving}
                          className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateStudent}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          {saving ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving…</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ============ GRADES TAB ============ */}
          {activeTab === "grades" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Verify Instructor Grades
                </h2>
                <p className="text-sm text-slate-500">
                  Review and approve grades submitted by instructors before transcript posting.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Pending Approval
                  </span>
                  <p className="text-2xl font-display font-bold text-blue-700 mt-1">
                    {pendingGrades}
                  </p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono text-emerald-700 uppercase">
                    Approved
                  </span>
                  <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
                    {approvedGrades}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Total Records
                  </span>
                  <p className="text-2xl font-display font-bold text-slate-900 mt-1">
                    {grades.length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3.5">Student</th>
                        <th className="px-4 py-3.5">Course</th>
                        <th className="px-4 py-3.5">Assessment</th>
                        <th className="px-4 py-3.5">Final</th>
                        <th className="px-4 py-3.5">Total</th>
                        <th className="px-4 py-3.5">Grade</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grades.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {g.studentName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {g.courseCode}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {g.continuousAssessmentScore}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {g.finalExamScore}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {g.totalGrade}%
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {g.letterGrade}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                g.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : g.status === "SUBMITTED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {g.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {g.status === "SUBMITTED" ? (
                              <>
                                <button
                                  onClick={() => handleApproveGrade(g.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectGrade(g.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Return
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {g.status === "APPROVED" ? "Locked" : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {grades.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                            No grade records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ CALENDAR TAB ============ */}
          {activeTab === "calendar" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Academic Calendar
                </h2>
                <p className="text-sm text-slate-500">
                  Semester dates, registration deadlines, and academic periods.
                </p>
              </div>

              {!settings ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">
                    No academic calendar configured
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Create a SystemSettings record in the Django admin to define the semester
                    dates.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-mono text-slate-500 uppercase">
                        Semester Start
                      </span>
                      <strong className="block text-lg mt-1 text-slate-900">
                        {(settings as any).semester_start ?? "Not set"}
                      </strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-mono text-slate-500 uppercase">
                        Semester End
                      </span>
                      <strong className="block text-lg mt-1 text-slate-900">
                        {(settings as any).semester_end ?? "Not set"}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Course Registration Add/Drop Deadline
                    </label>
                    <input
                      type="date"
                      className="border border-slate-200 rounded-lg p-3 text-xs font-mono w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      value={
                        (settings as any).registration_deadline?.slice(0, 10) ??
                        (settings as any).registrationDeadline?.slice(0, 10) ??
                        ""
                      }
                      onChange={async (e) => {
                        const newDeadline = e.target.value;
                        const settingsId =
                          (settings as any).id ?? (settings as any).settings_id ?? 1;
                        try {
                          const updated: any = await (CampusDatabase as any).updateSettings(
                            String(settingsId),
                            { registration_deadline: newDeadline }
                          );
                          setSettings(updated ?? settings);
                          alert("✅ Calendar updated.");
                        } catch (err: any) {
                          alert(
                            "Failed to save: " +
                              (err?.message ||
                                JSON.stringify(err?.response?.data) ||
                                "Unknown")
                          );
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "clearance" && (
            <div className="space-y-6">
              <SmartClearancePortal user={user} isOfficerMode={true} />
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-6">
              <SmartCampusAlerts user={user} />
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}