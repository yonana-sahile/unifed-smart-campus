import { useState, useEffect, useRef } from "react";
import type { User, Grade, SystemSettings } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import { RegistrarCommandCenter } from "./RegistrarCommandCenter";
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
  Plus,
  Save,
  UserCircle2,
  RefreshCw,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  deriveRegistrarNotifications,
  getReadIds,
  markRead,
  markAllRead,
} from "../utils/notifications";

/**
 * Small animated count-up used by the hero + stat cards.
 * Runs once on mount, then stays at the target value.
 */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);

  // keep ref in sync so we can animate *from* the current value
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/**
 * Stat card: big number, small label, hover lift.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  tone = "gold",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "gold" | "danger" | "info" | "success";
}) {
  const toneMap: Record<string, { bg: string; fg: string }> = {
    gold: { bg: "bg-[#c59b27]/10", fg: "text-[#a8811f]" },
    danger: { bg: "bg-red-50", fg: "text-red-600" },
    info: { bg: "bg-blue-50", fg: "text-blue-600" },
    success: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  };
  const t = toneMap[tone];

  return (
    <div className="group bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center ${t.fg} transition-transform group-hover:scale-110`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-display text-3xl sm:text-4xl leading-none text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function RegistrarDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
const [activeTab, setActiveTab] = useState<
  "overview" | "records" | "grades" | "calendar" | "clearance" | "alerts"
>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
const [editingStudent, setEditingStudent] = useState<User | null>(null);
const [saving, setSaving] = useState(false);

// ── Load state (NEW) ─────────────────────────────────────────
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState<string | null>(null);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

// ── Create-student mode ──────────────────────────────────────
const [isCreating, setIsCreating] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds());
  const [newStudentDraft, setNewStudentDraft] = useState<Partial<User>>({
    fullName: "",
    email: "",
    username: "",
    studentId: "",
    program: "",
    academicYear: undefined,
    semester: undefined,
    phoneNumber: "",
    outstandingFees: 0,
  });
  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  setLoading(true);
  setLoadError(null);
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
    setLastUpdated(new Date());
  } catch (error: any) {
    console.error("Failed to load registrar data:", error);
    setLoadError(error?.message ?? "Failed to load data from server");
    // Deliberately do NOT wipe students/grades/settings —
    // if this is a refresh, keep showing last-known-good data.
  } finally {
    setLoading(false);
  }
};

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setSaving(true);
    const tId = toast.loading("Saving student record…");
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

      toast.success("Record updated", {
        id: tId,
        description: `${editingStudent.fullName}'s profile was saved.`,
        duration: 4000,
      });
      setEditingStudent(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to update student:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : error?.message || "Unknown error";
      toast.error("Couldn't save record", {
        id: tId,
        description: detail,
        duration: 8000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── CREATE a new student ─────────────────────────────────────
  const handleCreateStudent = async () => {
    if (!isCreating) return;

    // Basic required-field checks (the server does the real validation)
    if (!newStudentDraft.fullName?.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!newStudentDraft.username?.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!newStudentDraft.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!newStudentDraft.studentId?.trim()) {
      toast.error("Student ID is required");
      return;
    }

    setSaving(true);
    const tId = toast.loading("Creating student record…");

    // Split fullName → first_name + last_name (matches Django's User model)
    const fullName = newStudentDraft.fullName.trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Generate a temporary password (student changes it on first login)
    const tempPassword = `${newStudentDraft.studentId.replace(/[^A-Za-z0-9]/g, "")}${Math.random().toString(36).slice(2, 6)}`;

    try {
      const created: any = await CampusDatabase.addUser({
        username: newStudentDraft.username.trim(),
        email: newStudentDraft.email.trim(),
        first_name: firstName,
        last_name: lastName,
        password: tempPassword,
        role: "STUDENT",
        student_id: newStudentDraft.studentId.trim(),
        program: newStudentDraft.program || null,
        academic_year: newStudentDraft.academicYear ?? null,
        semester: newStudentDraft.semester ?? null,
        outstanding_fees: newStudentDraft.outstandingFees ?? 0,
        phone_number: newStudentDraft.phoneNumber || null,
      } as any);

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Create Student Record",
        "User",
        String(created?.id ?? "unknown"),
        `Created new student: ${fullName} (${newStudentDraft.studentId})`
      );

      toast.success("Student created", {
        id: tId,
        description: `${fullName} · Temp password: ${tempPassword}`,
        duration: 8000,
      });

      // Reset + close + refresh
      setNewStudentDraft({
        fullName: "",
        email: "",
        username: "",
        studentId: "",
        program: "",
        academicYear: undefined,
        semester: undefined,
        phoneNumber: "",
        outstandingFees: 0,
      });
      setIsCreating(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to create student:", error);
      const detail =
        error?.response?.data?.username?.[0] ||
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.student_id?.[0] ||
        error?.response?.data?.password?.[0] ||
        (error?.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : error?.message) ||
        "Unknown error";
      toast.error("Couldn't create student", {
        id: tId,
        description: detail,
        duration: 8000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveGrade = async (gradeId: string) => {
    const prevSnapshot = grades;
    setGrades((prev) =>
      prev.map((g) =>
        g.id === gradeId ? { ...g, status: "APPROVED" as Grade["status"] } : g
      )
    );
    const tId = toast.loading("Approving grade…");

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

      toast.success("Grade approved", {
        id: tId,
        description: "Posted to the student's transcript.",
        duration: 4000,
      });
    } catch (error: any) {
      setGrades(prevSnapshot);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      toast.error("Approval failed", {
        id: tId,
        description: detail,
        duration: 8000,
      });
    }
  };
  const handleRejectGrade = async (gradeId: string) => {
    const prevSnapshot = grades;
    setGrades((prev) =>
      prev.map((g) =>
        g.id === gradeId ? { ...g, status: "RETURNED" as Grade["status"] } : g
      )
    );
    const tId = toast.loading("Returning to instructor…");

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

      toast.success("Returned to instructor", {
        id: tId,
        description: "Grade marked for revision.",
        duration: 4000,
      });
    } catch (error: any) {
      setGrades(prevSnapshot);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      toast.error("Could not return grade", {
        id: tId,
        description: detail,
        duration: 8000,
      });
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
  // ── Pagination ───────────────────────────────────────────────
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // dashboard stats
  const totalStudents = students.length;
  const studentsWithFees = students.filter((s) => (s.outstandingFees ?? 0) > 0).length;
  const pendingGrades = grades.filter((g) => g.status === "SUBMITTED").length;
  const approvedGrades = grades.filter((g) => g.status === "APPROVED").length;

  // animated hero + stat-card values (run once on first load)
  const animTotal = useCountUp(totalStudents);
  const animFees = useCountUp(studentsWithFees);
  const animPending = useCountUp(pendingGrades);
  const animApproved = useCountUp(approvedGrades);

  // ── Grades grouped by course (for the grades tab) ─────────────
  const gradeGroups = (() => {
    const map = new Map<string, Grade[]>();
    for (const g of grades) {
      const key = g.courseCode || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return Array.from(map.entries())
      .map(([code, rows]) => ({
        code,
        rows: rows.sort((a, b) =>
          (a.studentName || "").localeCompare(b.studentName || "")
        ),
        pending: rows.filter((r) => r.status === "SUBMITTED").length,
        approved: rows.filter((r) => r.status === "APPROVED").length,
      }))
      .sort((a, b) => {
        // courses with pending first, then alpha by code
        if (b.pending !== a.pending) return b.pending - a.pending;
        return a.code.localeCompare(b.code);
      });
  })();

  // Batch-approve every SUBMITTED grade in a given course group
  const handleBatchApprove = async (courseCode: string) => {
    const target = grades.filter(
      (g) => g.courseCode === courseCode && g.status === "SUBMITTED"
    );
    if (target.length === 0) return;

    const tId = toast.loading(
      `Approving ${target.length} grade${target.length !== 1 ? "s" : ""}…`
    );
    const prevSnapshot = grades;

    // optimistic: flip all of them
    setGrades((prev) =>
      prev.map((g) =>
        g.courseCode === courseCode && g.status === "SUBMITTED"
          ? { ...g, status: "APPROVED" as Grade["status"] }
          : g
      )
    );

    try {
      await Promise.all(
        target.map((g) =>
          CampusDatabase.updateGrade(g.id, { status: "APPROVED" })
        )
      );
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Batch Approve Grades",
        "Grade",
        courseCode,
        `Batch-approved ${target.length} grade(s) for course ${courseCode}.`
      );
      toast.success("Grades approved", {
        id: tId,
        description: `${target.length} grade${target.length !== 1 ? "s" : ""} in ${courseCode} posted to transcripts.`,
        duration: 4000,
      });
    } catch (error: any) {
      setGrades(prevSnapshot);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      toast.error("Batch approval failed", {
        id: tId,
        description: detail,
        duration: 8000,
      });
    }
  };
const navItems = [
  { id: "overview", label: "Command Center", shortLabel: "Home", Icon: Home },
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

  // ── Derived notifications ────────────────────────────────────
  const derivedNotifications = deriveRegistrarNotifications({
    students,
    grades,
    settings,
  });

  const notificationsWithReadState = derivedNotifications.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  const handleNotificationClick = (targetTab: string, id: string) => {
    const next = markRead(id);
    setReadIds(new Set(next));
    setActiveTab(targetTab as any);
    setIsMobileNavOpen(false);
  };

  const handleMarkAllRead = () => {
    const next = markAllRead(derivedNotifications.map((n) => n.id));
    setReadIds(new Set(next));
  };

  return (
   <div
  className="min-h-screen bg-[#FDFCF8] flex flex-col font-sans antialiased"
  id="registrar_dashboard_main"
>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans",
          style: {
            background: "#071526",
            color: "#F8FAFC",
            border: "1px solid rgba(197, 155, 39, 0.25)",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />

      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Office of the University Registrar"
        portalSubtitle="Directorate of Academic Records, Enrollment & Grade Certification"
        badgeText="REGISTRAR GENERAL"
        badgeType="admin"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
        notifications={notificationsWithReadState}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
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
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/60 shrink-0">
          <div className="px-4 py-3.5 border-b border-slate-800/60">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#c59b27]" />
              <span className="text-[10px] font-mono text-[#c59b27] font-semibold uppercase tracking-[0.15em]">
                Registrar
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Mekdela Amba University</p>
          </div>

          <nav className="p-3 flex-1 space-y-0.5">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 ${
                  activeTab === id
                    ? "bg-white/5 text-white border-[#c59b27]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    activeTab === id
                      ? "text-[#c59b27]"
                      : id === "alerts"
                      ? "text-red-400/80"
                      : "text-slate-500"
                  }`}
                />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 mb-2.5">
              This Semester
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Week</span>
                <span className="text-white font-mono tabular-nums">
                  {(() => {
                    const s: any = settings;
                    if (!s?.semester_start || !s?.semester_end) return "—";
                    const start = new Date(s.semester_start).getTime();
                    const end = new Date(s.semester_end).getTime();
                    const now = Date.now();
                    if (now < start || now > end) return "—";
                    const weeks = Math.round((end - start) / (7 * 24 * 60 * 60 * 1000));
                    const current = Math.floor(
                      (now - start) / (7 * 24 * 60 * 60 * 1000)
                    ) + 1;
                    return `${current} / ${weeks}`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pending grades</span>
                <span
                  className={`font-mono tabular-nums ${
                    pendingGrades > 0 ? "text-amber-400" : "text-white"
                  }`}
                >
                  {pendingGrades}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee holds</span>
                <span
                  className={`font-mono tabular-nums ${
                    studentsWithFees > 0 ? "text-amber-400" : "text-white"
                  }`}
                >
                  {studentsWithFees}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0 space-y-6">
          {/* ============ OVERVIEW / COMMAND CENTER TAB ============ */}
          {activeTab === "overview" && (
            <RegistrarCommandCenter
              user={user}
              students={students}
              grades={grades}
              settings={settings}
              loading={loading}
              lastUpdated={lastUpdated}
              onRefresh={loadData}
              onNavigate={goToTab}
            />
          )}

          {/* ============ STUDENT RECORDS TAB ============ */}
          {activeTab === "records" && (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="space-y-6"
  >
    {/* NEW — error banner */}
    {loadError && (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <p className="text-sm text-red-800 flex-1">{loadError}</p>
        <button
          onClick={loadData}
          className="text-xs font-semibold text-red-700 hover:underline shrink-0"
        >
          Retry
        </button>
      </div>
    )}

    {/* HERO */}
    <div className="relative overflow-hidden rounded-2xl bg-[#071526] text-white">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#c59b27]/10 blur-3xl pointer-events-none"
                />

                <div className="relative px-6 sm:px-9 py-7 sm:py-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c59b27]/90 font-semibold">
                          Academic Records
                        </p>
                        {lastUpdated && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={loadData}
                          disabled={loading}
                          aria-label="Refresh data"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-semibold text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </button>
                      </div>
                      <h1 className="font-display text-3xl sm:text-4xl leading-[1.1] mt-2.5 tracking-tight">
                        Student Records
                      </h1>
                      <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                        Complete academic profiles for all enrolled students. Edit
                        personal data, academic status, and financial records.
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                        Total Enrolled
                      </p>
                      <p className="font-display text-6xl leading-none mt-1.5 tabular-nums">
                        {animTotal}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                        students
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STAT CARDS — staggered entry */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
                  },
                }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                {[
                  { label: "Students", value: animTotal, icon: Users, tone: "gold" as const },
                  { label: "Outstanding Fees", value: animFees, icon: AlertCircle, tone: "danger" as const },
                  { label: "Pending Grades", value: animPending, icon: FileText, tone: "info" as const },
                  { label: "Approved Grades", value: animApproved, icon: CheckCircle2, tone: "success" as const },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    variants={{
                      hidden: { opacity: 0, y: 12, filter: "blur(2px)" },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 28,
                        },
                      },
                    }}
                  >
                    <StatCard
                      label={s.label}
                      value={s.value}
                      icon={s.icon}
                      tone={s.tone}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* SEARCH */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-slate-900 leading-tight">
                    Academic Records
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing{" "}
                    <span className="font-mono tabular-nums text-slate-700">
                      {filteredStudents.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-mono tabular-nums text-slate-700">
                      {totalStudents}
                    </span>{" "}
                    students
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStudentDraft({
                        fullName: "",
                        email: "",
                        username: "",
                        studentId: "",
                        program: "",
                        academicYear: undefined,
                        semester: undefined,
                        phoneNumber: "",
                        outstandingFees: 0,
                      });
                      setIsCreating(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold active:scale-[0.98] transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Student</span>
                  </button>
                  <div className="relative flex-1 sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, program, or username…"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on search
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 transition"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TABLE */}
              {/* TABLE */}
              <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[1000px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#FAFAF9] border-b border-slate-200">
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Student
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Student ID
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Program
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Year / Sem
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          CGPA
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Fees
                        </th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* NEW — skeleton rows while first load is in flight */}
                      {loading && currentStudents.length === 0 &&
                        Array.from({ length: 8 }).map((_, i) => (
                          <tr key={`sk-${i}`} className="animate-pulse">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="h-4 bg-slate-100 rounded w-full" />
                            </td>
                          </tr>
                        ))}

                      {/* Empty state — only show when NOT loading */}
                      {!loading && filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-20 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-100 mb-4">
                              <UserCircle2 className="w-6 h-6 text-slate-400" />
                            </div>
                            <h4 className="font-display text-lg text-slate-900">
                              {searchQuery
                                ? `No matches for "${searchQuery}"`
                                : "No students enrolled yet"}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                              {searchQuery
                                ? "Try a different name, ID, or program."
                                : "Student records will appear here once enrollment opens for the semester."}
                            </p>
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="mt-4 text-xs font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-4 transition"
                              >
                                Clear search
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                      {currentStudents.map((st) => {
                        const hasFees = (st.outstandingFees ?? 0) > 0;
                        const hasCGPA = (st.cgpa ?? 0) > 0;
                        return (
                          <tr
                            key={st.id}
                            className="group hover:bg-[#FAFAF9] transition-colors"
                          >
                            {/* PHOTO + NAME */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {st.avatarUrl ? (
                                  <img
                                    src={st.avatarUrl}
                                    alt={st.fullName}
                                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                                    {st.fullName?.charAt(0).toUpperCase() || "?"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">
                                    {st.fullName || st.username || "Unnamed"}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate font-mono">
                                    @{st.username || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* STUDENT ID */}
                            <td className="px-5 py-4">
                              {st.studentId ? (
                                <span className="font-mono text-xs text-slate-600 tracking-wide tabular-nums">
                                  {st.studentId}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">—</span>
                              )}
                            </td>

                            {/* PROGRAM */}
                            <td className="px-5 py-4">
                              {st.program ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                                  {st.program}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>

                            {/* YEAR / SEMESTER */}
                            <td className="px-5 py-4">
                              {st.academicYear || st.semester ? (
                                <span className="font-mono text-xs text-slate-600 tabular-nums">
                                  Yr {st.academicYear || "?"} · Sem {st.semester || "?"}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>

                            {/* CGPA */}
                            <td className="px-5 py-4">
                              {hasCGPA ? (
                                <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                  {st.cgpa!.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>

                            {/* FEES — dot + text, no pill */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    hasFees ? "bg-red-500" : "bg-emerald-500"
                                  }`}
                                />
                                <span className="text-xs font-mono tabular-nums text-slate-700">
                                  {hasFees
                                    ? `${st.outstandingFees?.toLocaleString()} ETB`
                                    : "Cleared"}
                                </span>
                              </div>
                            </td>

                            {/* ACTION — hover reveal */}
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => setEditingStudent(st)}
                               className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-900 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── PAGINATION CONTROLS ────────────────────────── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-[#FAFAF9]">
                    <span className="text-xs text-slate-500 font-mono">
                      Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-7 h-7 rounded-md text-xs font-mono font-semibold transition ${
                            currentPage === page
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ============ EDIT MODAL ============ */}
              <AnimatePresence>
                {(editingStudent || isCreating) && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        if (saving) return;
                        setEditingStudent(null);
                        setIsCreating(false);
                      }}
                      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 12 }}
                      transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
                      className="relative bg-white w-full max-w-2xl rounded-2xl shadow-[0_24px_64px_-12px_rgba(15,23,42,0.25)] overflow-hidden max-h-[92vh] flex flex-col"
                    >
                      {/* HEADER — white record header (dual mode) */}
                      <div className="border-b border-slate-200 bg-white px-6 py-5 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            {isCreating ? (
                              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                                <Plus className="w-6 h-6" />
                              </div>
                            ) : editingStudent?.avatarUrl ? (
                              <img
                                src={editingStudent.avatarUrl}
                                alt={editingStudent.fullName}
                                className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-display text-xl shrink-0">
                                {editingStudent?.fullName?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-display text-xl text-slate-900 leading-tight truncate">
                                {isCreating
                                  ? "Create Student Record"
                                  : editingStudent?.fullName || "Unnamed Student"}
                              </h3>
                              <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                                {isCreating
                                  ? "Fill in the details below"
                                  : editingStudent?.studentId || "No ID assigned"}
                                {!isCreating && editingStudent?.program && (
                                  <>
                                    <span className="mx-1.5 text-slate-300">·</span>
                                    {editingStudent.program}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                                isCreating
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isCreating ? "New Record" : "Editing Record"}
                            </span>
                            <button
                              onClick={() => {
                                if (saving) return;
                                setEditingStudent(null);
                                setIsCreating(false);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              aria-label="Close"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* BODY */}
                      <div className="flex-1 overflow-y-auto">
                        {(() => {
                          const current = isCreating ? newStudentDraft : editingStudent!;
                          const setCurrent = (patch: Partial<User>) => {
                            if (isCreating) {
                              setNewStudentDraft((prev) => ({ ...prev, ...patch }));
                            } else if (editingStudent) {
                              setEditingStudent({ ...editingStudent, ...patch });
                            }
                          };
                          return (
                            <>
                        {/* ACADEMIC */}
                        <section className="px-6 py-5">
                          <h4 className="font-display text-base text-slate-900 flex items-center gap-2 mb-4">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <span>Academic Information</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Student ID
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.studentId || ""}
                                onChange={(e) => setCurrent({ studentId: e.target.value })}
                                placeholder="MAU1406159"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Program
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.program || ""}
                                onChange={(e) => setCurrent({ program: e.target.value })}
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
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.academicYear ?? ""}
                                onChange={(e) =>
                                  setCurrent({ academicYear: parseInt(e.target.value) || undefined })
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
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.semester ?? ""}
                                onChange={(e) =>
                                  setCurrent({ semester: parseInt(e.target.value) || undefined })
                                }
                                placeholder="2"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                CGPA (0.00 – 4.00)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={4}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.cgpa ?? ""}
                                onChange={(e) =>
                                  setCurrent({ cgpa: parseFloat(e.target.value) || undefined })
                                }
                                placeholder="3.50"
                              />
                            </div>
                          </div>
                        </section>

                        <div className="border-t border-slate-100" />

                        {/* PERSONAL */}
                        <section className="px-6 py-5">
                          <h4 className="font-display text-base text-slate-900 flex items-center gap-2 mb-4">
                            <UserCircle2 className="w-4 h-4 text-slate-400" />
                            <span>Personal Information</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.fullName || ""}
                                onChange={(e) => setCurrent({ fullName: e.target.value })}
                              />
                            </div>
                            {isCreating && (
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Username
                                </label>
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                  value={current.username || ""}
                                  onChange={(e) => setCurrent({ username: e.target.value })}
                                  placeholder="e.g. abebe.bekele"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                  Used for login. Must be unique.
                                </p>
                              </div>
                            )}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>Email</span>
                              </label>
                              <input
                                type="email"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.email || ""}
                                onChange={(e) => setCurrent({ email: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>Phone</span>
                              </label>
                              <input
                                type="tel"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                                value={current.phoneNumber || ""}
                                onChange={(e) => setCurrent({ phoneNumber: e.target.value })}
                                placeholder="+251 9XX XXX XXX"
                              />
                            </div>
                          </div>
                        </section>

                        <div className="border-t border-slate-100" />

                        {/* FINANCE */}
                        <section className="px-6 py-5">
                          <h4 className="font-display text-base text-slate-900 flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <span>Financial</span>
                          </h4>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Outstanding Fees (ETB)
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                              value={current.outstandingFees ?? 0}
                              onChange={(e) =>
                                setCurrent({ outstandingFees: parseFloat(e.target.value) || 0 })
                              }
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5">
                              Set to 0 if the student has cleared all dues.
                            </p>
                          </div>
                        </section>
                            </>
                          );
                        })()}
                      </div>

                      {/* FOOTER */}
                      <div className="px-6 py-4 border-t border-slate-200 bg-[#FAFAF9] flex items-center justify-end gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (saving) return;
                            setEditingStudent(null);
                            setIsCreating(false);
                          }}
                          disabled={saving}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={isCreating ? handleCreateStudent : handleUpdateStudent}
                          disabled={saving || (isCreating && !newStudentDraft.fullName)}
                          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving…</span>
                            </>
                          ) : isCreating ? (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Student</span>
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
              key="grades-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#a8811f] font-semibold">
                  Grade Verification
                </p>
                <h2 className="font-display text-3xl text-slate-900 mt-1.5">
                  Verify Instructor Grades
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Review and approve grades submitted by instructors before
                  transcript posting.
                </p>
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  label="Pending Approval"
                  value={pendingGrades}
                  icon={AlertCircle}
                  tone="info"
                />
                <StatCard
                  label="Approved"
                  value={approvedGrades}
                  icon={CheckCircle2}
                  tone="success"
                />
                <StatCard
                  label="Total Records"
                  value={grades.length}
                  icon={FileText}
                  tone="gold"
                />
              </div>

              {/* Empty state */}
              {gradeGroups.length === 0 && (
                <div className="bg-white border border-slate-200/70 rounded-2xl py-20 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-100 mb-4">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-display text-lg text-slate-900">
                    No grade records yet
                  </h4>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Grade submissions from instructors will appear here for
                    verification.
                  </p>
                </div>
              )}

              {/* Grade groups — one card per course */}
              <div className="space-y-4">
                {gradeGroups.map((group) => (
                  <div
                    key={group.code}
                    className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden"
                  >
                    {/* Group header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3.5 bg-[#FAFAF9] border-b border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-sm font-semibold text-slate-900 tracking-wide">
                          {group.code}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {group.rows.length} student
                          {group.rows.length !== 1 ? "s" : ""}
                        </span>
                        {group.pending > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {group.pending} pending
                          </span>
                        )}
                      </div>
                      {group.pending > 0 && (
                        <button
                          onClick={() => handleBatchApprove(group.code)}
                          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve all {group.pending}</span>
                        </button>
                      )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[800px]">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              Student
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              CA
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              Final
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              Total
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              Grade
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                              Status
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.rows.map((g) => {
                            const isPending = g.status === "SUBMITTED";
                            const isApproved = g.status === "APPROVED";
                            return (
                              <tr
                                key={g.id}
                                className="group hover:bg-[#FAFAF9] transition-colors"
                              >
                                <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">
                                  {g.studentName}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                                  {g.continuousAssessmentScore}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                                  {g.finalExamScore}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                  {g.totalGrade}%
                                </td>
                                <td className="px-5 py-3.5 font-semibold text-slate-900">
                                  {g.letterGrade}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isApproved
                                          ? "bg-emerald-500"
                                          : isPending
                                          ? "bg-amber-500"
                                          : "bg-slate-400"
                                      }`}
                                    />
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600">
                                      {g.status}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {isPending ? (
                                    <div className="inline-flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleApproveGrade(g.id)}
                                        className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectGrade(g.id)}
                                        className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 text-xs font-semibold transition"
                                      >
                                        Return
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      {isApproved ? "Locked" : "—"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ============ CALENDAR TAB ============ */}
          {activeTab === "calendar" && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#a8811f] font-semibold">
                  Academic Year
                </p>
                <h2 className="font-display text-3xl text-slate-900 mt-1.5">
                  Academic Calendar
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Semester dates, registration deadlines, and academic periods.
                </p>
              </div>

              {!settings ? (
                <div className="bg-white border border-slate-200/70 rounded-2xl py-20 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-100 mb-4">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-display text-lg text-slate-900">
                    No academic calendar configured
                  </h4>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Create a SystemSettings record in the Django admin to define
                    semester dates. The timeline will appear here.
                  </p>
                </div>
              ) : (
                (() => {
                  // ── Build the timeline from settings ──
                  const s: any = settings;
                  const startRaw = s.semester_start;
                  const endRaw = s.semester_end;
                  const regRaw =
                    s.registration_deadline ?? s.registrationDeadline;

                  const startDate = startRaw ? new Date(startRaw) : null;
                  const endDate = endRaw ? new Date(endRaw) : null;
                  const regDate = regRaw ? new Date(regRaw) : null;

                  const now = new Date();

                  // mid-exam = start + 50% of semester
                  const midDate =
                    startDate && endDate
                      ? new Date(
                          startDate.getTime() +
                            (endDate.getTime() - startDate.getTime()) * 0.5
                        )
                      : null;

                  // finals = last 3 weeks before end
                  const finalsDate = endDate
                    ? new Date(endDate.getTime() - 21 * 24 * 60 * 60 * 1000)
                    : null;

                  const milestones = [
                    { label: "Semester Start", date: startDate, key: "start" },
                    { label: "Add/Drop Deadline", date: regDate, key: "reg" },
                    { label: "Mid-Exam Period", date: midDate, key: "mid" },
                    { label: "Final Exams Begin", date: finalsDate, key: "finals" },
                    { label: "Semester End", date: endDate, key: "end" },
                  ].filter((m) => m.date !== null) as {
                    label: string;
                    date: Date;
                    key: string;
                  }[];

                  milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

                  // Current milestone = first not yet passed
                  const currentIdx = milestones.findIndex(
                    (m) => m.date.getTime() >= now.getTime()
                  );

                  // Weeks elapsed
                  let weekInfo: string | null = null;
                  if (startDate && endDate) {
                    const daysElapsed = Math.floor(
                      (now.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const totalDays = Math.floor(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    if (daysElapsed >= 0 && daysElapsed <= totalDays) {
                      const currentWeek = Math.floor(daysElapsed / 7) + 1;
                      const totalWeeks = Math.round(totalDays / 7);
                      weekInfo = `Week ${currentWeek} of ${totalWeeks}`;
                    }
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Left: timeline */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-3 mb-6">
                          <div>
                            <h3 className="font-display text-lg text-slate-900">
                              Semester Timeline
                            </h3>
                            {weekInfo && (
                              <p className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
                                {weekInfo}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="relative pl-6 border-l-2 border-slate-100 space-y-7">
                          {milestones.map((m, idx) => {
                            const isPast = m.date.getTime() < now.getTime();
                            const isCurrent = idx === currentIdx;
                            return (
                              <div key={m.key} className="relative">
                                <div
                                  className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                                    isCurrent
                                      ? "bg-[#c59b27]"
                                      : isPast
                                      ? "bg-slate-300"
                                      : "bg-slate-200"
                                  }`}
                                />
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500 tabular-nums">
                                      {m.date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                      {m.label}
                                    </p>
                                  </div>
                                  {isCurrent && (
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#a8811f] bg-[#c59b27]/10 border border-[#c59b27]/30 px-2 py-0.5 rounded-full font-semibold">
                                      Current
                                    </span>
                                  )}
                                  {isPast && !isCurrent && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: key dates + deadline editor */}
                      <div className="space-y-4">
                        <div className="bg-white border border-slate-200/70 rounded-2xl p-5">
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 font-semibold mb-3">
                            Key Dates
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-mono text-slate-400 uppercase">
                                Semester Start
                              </p>
                              <p className="text-sm text-slate-900 font-mono tabular-nums">
                                {startDate
                                  ? startDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Not set"}
                              </p>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <p className="text-[10px] font-mono text-slate-400 uppercase">
                                Semester End
                              </p>
                              <p className="text-sm text-slate-900 font-mono tabular-nums">
                                {endDate
                                  ? endDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200/70 rounded-2xl p-5">
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 font-semibold mb-3">
                            Add/Drop Deadline
                          </h4>
                          <input
                            type="date"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition"
                            value={regRaw?.slice(0, 10) ?? ""}
                            onChange={async (e) => {
                              const newDeadline = e.target.value;
                              const settingsId = s.id ?? s.settings_id ?? 1;
                              const tId = toast.loading("Updating calendar…");
                              try {
                                const updated: any = await (
                                  CampusDatabase as any
                                ).updateSettings(String(settingsId), {
                                  registration_deadline: newDeadline,
                                });
                                setSettings(updated ?? settings);
                                toast.success("Calendar updated", {
                                  id: tId,
                                  description: `Registration deadline set to ${newDeadline || "—"}.`,
                                  duration: 4000,
                                });
                              } catch (err: any) {
                                const detail =
                                  err?.message ||
                                  JSON.stringify(err?.response?.data) ||
                                  "Unknown error";
                                toast.error("Couldn't update calendar", {
                                  id: tId,
                                  description: detail,
                                  duration: 8000,
                                });
                              }
                            }}
                          />
                          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                            Changing this updates the timeline milestone and the
                            registration enforcement for students.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
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