import { useState, useEffect, useMemo, useRef } from "react";
import type { User, Course, Grade, InstructorEvaluation } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Layout,
  X,
  Check,
  RefreshCw,
  Sparkles,
  BarChart3,
  Award,
  Activity,
  ChevronRight,
  Search,
  Zap,
  GraduationCap,
  Target,
  Radio,
  Cpu,
  Command,
  ArrowRight,
  CornerDownLeft,
  Hash,
  GripVertical,
  Layers,
  User as UserIcon,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "motion/react";
import confetti from "canvas-confetti";

type Tab = "overview" | "courses" | "faculty" | "evaluations" | "alerts" | "facilities";

export function DepartmentHeadDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<InstructorEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const [reassigning, setReassigning] = useState<Course | null>(null);
  const [pickedInstructorId, setPickedInstructorId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // ---- Command Palette (⌘K) ----
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  // ---- Drag-and-Drop Reassign Board ----
  const [isBoardOpen, setIsBoardOpen] = useState(false);

  // ---- Toasts (confetti + feedback) ----
  const [toasts, setToasts] = useState<
    { id: string; type: "success" | "error"; title: string; message?: string }[]
  >([]);

  const pushToast = (toast: {
    type: "success" | "error";
    title: string;
    message?: string;
  }) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsPaletteOpen(false);
        setIsBoardOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, gradesData, usersData, evalsData] = await Promise.all([
        CampusDatabase.getCourses().catch(() => []),
        CampusDatabase.getGrades().catch(() => []),
        CampusDatabase.getUsers().catch(() => []),
        CampusDatabase.getEvaluations().catch(() => []),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setInstructors(
        Array.isArray(usersData) ? usersData.filter((u) => u.role === "INSTRUCTOR") : []
      );
      setEvaluations(Array.isArray(evalsData) ? evalsData : []);
    } catch (error) {
      console.error("Failed to load department data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- COMPUTED STATS ----------
  const stats = useMemo(() => {
    const total = grades.length;
    const passed = grades.filter((g) => (g.totalGrade ?? 0) >= 50).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const failRate = total > 0 ? (failed / total) * 100 : 0;
    const avgGrade =
      total > 0 ? grades.reduce((s, g) => s + (g.totalGrade ?? 0), 0) / total : 0;
    const avgLoad = instructors.length > 0 ? courses.length / instructors.length : 0;
    return { totalGrades: total, passed, failed, passRate, failRate, avgGrade, avgLoad };
  }, [grades, courses.length, instructors.length]);

  // ---------- PULSE GAUGE METRICS ----------
  const pulseMetrics = useMemo(() => {
    // 1. Pass rate (already computed, but re-exposed cleanly)
    const passRate = stats.passRate;

    // 2. Faculty load health: 100% = every instructor at ideal load (3 courses)
    //    Overloaded (>4) or underloaded (<1) reduces the score.
    const IDEAL_LOAD = 3;
    const MAX_ACCEPTABLE_LOAD = 6;
    let loadHealth = 0;
    if (instructors.length > 0) {
      const totalCourses = courses.length;
      const avgLoad = totalCourses / instructors.length;
      // 100 if avgLoad is at or below ideal; drops linearly to 0 at MAX
      loadHealth =
        avgLoad <= IDEAL_LOAD
          ? 100
          : Math.max(
              0,
              ((MAX_ACCEPTABLE_LOAD - avgLoad) /
                (MAX_ACCEPTABLE_LOAD - IDEAL_LOAD)) *
                100
            );
    }

    // 3. Student satisfaction: avg rating out of 5 → normalized to %
    const rated = evaluations.filter(
      (e) => typeof e.overallRating === "number" && e.overallRating > 0
    );
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, e) => s + (e.overallRating || 0), 0) / rated.length
        : 0;
    const satisfaction = (avgRating / 5) * 100;

    // 4. Coverage: % of courses that have an instructor assigned
    const assigned = courses.filter((c) => c.instructorId || c.instructorName).length;
    const coverage = courses.length > 0 ? (assigned / courses.length) * 100 : 0;

    return {
      passRate: {
        value: passRate,
        label: "Pass Rate",
        suffix: "%",
      },
      loadHealth: {
        value: loadHealth,
        label: "Load Health",
        suffix: "%",
      },
      satisfaction: {
        value: satisfaction,
        label: "Satisfaction",
        suffix: "%",
      },
      coverage: {
        value: coverage,
        label: "Coverage",
        suffix: "%",
      },
    };
  }, [stats.passRate, instructors.length, courses, evaluations]);

  // ---------- REASSIGN ----------
  const openReassign = (course: Course) => {
    setReassigning(course);
    const current = instructors.find(
      (i) => String(i.id).replace(/^U_/, "") === String(course.instructorId)
    );
    setPickedInstructorId(current?.id ?? "");
  };

  const handleSaveReassign = async () => {
    if (!reassigning || !pickedInstructorId) {
      pushToast({
        type: "error",
        title: "No instructor selected",
        message: "Pick an instructor before confirming.",
      });
      return;
    }
    setSaving(true);
    try {
      const newInstructor = instructors.find((i) => i.id === pickedInstructorId);
      if (!newInstructor) throw new Error("Selected instructor not found.");
      const numericId = String(newInstructor.id).replace(/^U_/, "");

      await CampusDatabase.updateCourse(reassigning.id, {
        instructor: Number(numericId) || numericId,
        instructor_name: newInstructor.fullName,
      });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === reassigning.id
            ? { ...c, instructorId: String(newInstructor.id), instructorName: newInstructor.fullName }
            : c
        )
      );

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "DEPARTMENT_HEAD",
        "Reassign Faculty",
        "Course",
        reassigning.id,
        `Assigned ${newInstructor.fullName} to ${reassigning.courseCode}`
      );

      fireConfettiBurst();
      pushToast({
        type: "success",
        title: "Reassignment saved",
        message: `${newInstructor.fullName} → ${reassigning.courseCode}`,
      });

      setReassigning(null);
      setPickedInstructorId("");
    } catch (err: any) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      pushToast({
        type: "error",
        title: "Reassignment failed",
        message: detail,
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------- BOARD REASSIGN (drag-and-drop) ----------
  const boardReassign = async (
    courseId: string,
    instructorId: string | null
  ): Promise<boolean> => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return false;

    const previousCourses = courses;
    const newInstructor = instructorId
      ? instructors.find((i) => i.id === instructorId) || null
      : null;

    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              instructorId: newInstructor ? String(newInstructor.id) : "",
              instructorName: newInstructor ? newInstructor.fullName : "",
            }
          : c
      )
    );

    try {
      if (newInstructor) {
        const numericId = String(newInstructor.id).replace(/^U_/, "");
        await CampusDatabase.updateCourse(courseId, {
          instructor: Number(numericId) || numericId,
          instructor_name: newInstructor.fullName,
        });
      } else {
        await CampusDatabase.updateCourse(courseId, {
          instructor: null,
          instructor_name: "",
        });
      }

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "DEPARTMENT_HEAD",
        "Reassign Faculty (Board)",
        "Course",
        courseId,
        newInstructor
          ? `Assigned ${newInstructor.fullName} to ${course.courseCode}`
          : `Unassigned ${course.courseCode}`
      );

      fireConfettiBurst({ x: 0.8, y: 0.6, count: 45 });
      pushToast({
        type: "success",
        title: newInstructor ? "Instructor assigned" : "Course unassigned",
        message: newInstructor
          ? `${newInstructor.fullName} → ${course.courseCode}`
          : `${course.courseCode} moved to Unassigned`,
      });

      return true;
    } catch (err: any) {
      setCourses(previousCourses);
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      pushToast({
        type: "error",
        title: "Reassignment failed",
        message: detail,
      });
      return false;
    }
  };

  // ---------- EVALUATIONS BY INSTRUCTOR ----------
  const evaluationsByInstructor = useMemo(() => {
    return instructors.map((inst) => {
      const instEvals = evaluations.filter(
        (e) => String(e.instructorId) === String(inst.id).replace(/^U_/, "")
      );
      const avg =
        instEvals.length > 0
          ? instEvals.reduce((sum, e) => sum + (e.overallRating || 0), 0) / instEvals.length
          : null;
      return { instructor: inst, count: instEvals.length, average: avg };
    });
  }, [instructors, evaluations]);

  const filteredCourses = courses.filter(
    (c) =>
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems: { id: Tab; label: string; shortLabel: string; Icon: typeof Layout }[] = [
    { id: "overview", label: "Department Overview", shortLabel: "Overview", Icon: Layout },
    { id: "courses", label: "Course Offerings", shortLabel: "Courses", Icon: BookOpen },
    { id: "faculty", label: "Faculty & Workload", shortLabel: "Faculty", Icon: Users },
    { id: "evaluations", label: "Instructor Evaluations", shortLabel: "Evaluations", Icon: TrendingUp },
  ];

  const smartItems: { id: Tab; label: string; shortLabel: string; Icon: typeof Layout }[] = [
    { id: "alerts", label: "Broadcast Circulars", shortLabel: "Alerts", Icon: Radio },
    { id: "facilities", label: "Lab & Hall Bookings", shortLabel: "Facilities", Icon: Cpu },
  ];

  const goToTab = (id: string) => {
    setActiveTab(id as Tab);
    setIsMobileNavOpen(false);
  };
  // Called when a command palette item is selected
  const handlePaletteAction = (action: {
    type: "tab" | "course" | "instructor" | "reassign";
    id: string;
  }) => {
    setIsPaletteOpen(false);
    if (action.type === "tab") {
      setActiveTab(action.id as Tab);
      return;
    }
    if (action.type === "reassign") {
      const course = courses.find((c) => c.id === action.id);
      if (course) {
        setActiveTab("courses");
        openReassign(course);
      }
      return;
    }
    if (action.type === "course") {
      const course = courses.find((c) => c.id === action.id);
      if (course) {
        setActiveTab("courses");
        setSearchQuery(course.courseCode);
      }
      return;
    }
    if (action.type === "instructor") {
      setActiveTab("faculty");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dept_head_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Department Chair & Academic Council"
        portalSubtitle="College of Informatics • Department of Software Engineering"
        badgeText="DEPARTMENT HEAD"
        badgeType="faculty"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* ============ MOBILE SLIDE-OUT DRAWER ============ */}
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
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">DEPT HEAD</p>
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
                <div className="pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Academic Management
                  </span>
                </div>

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

                <div className="pt-2 pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Smart Operations
                  </span>
                </div>

                {smartItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
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

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <p>Staff ID: <span className="text-amber-400">{user.staffId || "DH101"}</span></p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">Status: Department Chair</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ MOBILE HORIZONTAL QUICK-NAV ============ */}
      <div className="md:hidden sticky top-[48px] sm:top-[57px] z-30 bg-[#071526] border-b border-slate-800/90 px-2 py-1.5 overflow-x-auto flex items-center space-x-1.5 shadow-md shrink-0 scrollbar-none">
        {[...navItems, ...smartItems].map(({ id, shortLabel, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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
        {/* ============ DESKTOP SIDEBAR ============ */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
              <p className="text-[10px] font-mono text-amber-400 font-bold">
                DEPT OF SOFTWARE ENG.
              </p>
            </div>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <div className="pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Academic Management
              </span>
            </div>

            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 text-amber-400" />
                <span>{label}</span>
              </button>
            ))}

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Operations
              </span>
            </div>

            {smartItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
            <p>Staff ID: <span className="text-amber-400">{user.staffId || "DH101"}</span></p>
            <p>College: Informatics</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">Status: Department Chair</p>
          </div>
        </aside>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* ============ HERO HEADER ============ */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942]">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-4 sm:px-6 md:px-8 pt-8 pb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-mono font-bold text-amber-300 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ACADEMIC YEAR 2025/2026 • SEMESTER II</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                    Department Performance
                  </h1>
                  <p className="text-slate-300/90 text-sm leading-relaxed">
                    Real-time academic intelligence — faculty workloads, student outcomes, and course delivery in one view.
                  </p>

                  <motion.button
                    onClick={loadData}
                    disabled={loading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-2 inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span>{loading ? "Syncing…" : "Sync Data"}</span>
                  </motion.button>
                </div>

                {/* PULSE GAUGES */}
                <PulseGaugesGrid
                  loading={loading}
                  metrics={[
                    {
                      value: pulseMetrics.passRate.value,
                      label: pulseMetrics.passRate.label,
                      suffix: pulseMetrics.passRate.suffix,
                      accent: "emerald",
                    },
                    {
                      value: pulseMetrics.loadHealth.value,
                      label: pulseMetrics.loadHealth.label,
                      suffix: pulseMetrics.loadHealth.suffix,
                      accent: "blue",
                    },
                    {
                      value: pulseMetrics.satisfaction.value,
                      label: pulseMetrics.satisfaction.label,
                      suffix: pulseMetrics.satisfaction.suffix,
                      accent: "amber",
                    },
                    {
                      value: pulseMetrics.coverage.value,
                      label: pulseMetrics.coverage.label,
                      suffix: pulseMetrics.coverage.suffix,
                      accent: "violet",
                    },
                  ]}
                />
              </motion.div>
            </div>

            {/* Curved bottom transition */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50 rounded-t-[3rem]" />
          </div>

          {/* ============ FLOATING STAT CARDS ============ */}
          <div className="px-4 sm:px-6 md:px-8 -mt-16 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Faculty Members"
                value={String(instructors.length)}
                sub={`${stats.avgLoad.toFixed(1)} avg load`}
                accent="from-blue-500 to-indigo-600"
                delay={0.05}
                loading={loading}
              />
              <StatCard
                icon={BookOpen}
                label="Active Courses"
                value={String(courses.length)}
                sub="Current catalogue"
                accent="from-violet-500 to-purple-600"
                delay={0.1}
                loading={loading}
              />
              <StatCard
                icon={Target}
                label="Pass Rate"
                value={`${stats.passRate.toFixed(1)}%`}
                sub={`${stats.passed} of ${stats.totalGrades} students`}
                accent="from-emerald-500 to-teal-600"
                delay={0.15}
                loading={loading}
              />
              <StatCard
                icon={AlertTriangle}
                label="At-Risk Students"
                value={`${stats.failRate.toFixed(1)}%`}
                sub={`${stats.failed} flagged`}
                accent="from-amber-500 to-orange-600"
                delay={0.2}
                loading={loading}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
            <AnimatePresence mode="wait">
              {/* ==================== OVERVIEW ==================== */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {loading ? (
                    <OverviewSkeleton />
                  ) : (
                    <>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h3 className="font-display font-bold text-slate-900">
                          Department Grade Distribution
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {stats.totalGrades} records
                      </span>
                    </div>

                    <div className="space-y-3">
                      <DistributionBar
                        label="Passed (≥ 50%)"
                        value={stats.passed}
                        total={stats.totalGrades}
                        color="bg-gradient-to-r from-emerald-400 to-teal-500"
                      />
                      <DistributionBar
                        label="At Risk (< 50%)"
                        value={stats.failed}
                        total={stats.totalGrades}
                        color="bg-gradient-to-r from-amber-400 to-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <MiniStat icon={Award} label="Avg Grade" value={`${stats.avgGrade.toFixed(1)}%`} />
                      <MiniStat
                        icon={GraduationCap}
                        label="Distinctions"
                        value={String(grades.filter((g) => (g.totalGrade ?? 0) >= 85).length)}
                      />
                      <MiniStat icon={Activity} label="Evaluations" value={String(evaluations.length)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900">Top Workload</h3>
                        <button
                          onClick={() => setActiveTab("faculty")}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1"
                        >
                          <span>View all</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {instructors
                          .map((inst) => ({
                            inst,
                            load: courses.filter(
                              (c) => String(c.instructorId) === String(inst.id).replace(/^U_/, "")
                            ).length,
                          }))
                          .sort((a, b) => b.load - a.load)
                          .slice(0, 4)
                          .map(({ inst, load }) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                  {inst.fullName.charAt(0)}
                                </div>
                                <div>
                                  <span className="block text-sm font-semibold text-slate-800">
                                    {inst.fullName}
                                  </span>
                                  <span className="block text-[11px] text-slate-400 font-mono">
                                    {inst.specialization || "Faculty"}
                                  </span>
                                </div>
                              </div>
                              <LoadPill load={load} />
                            </div>
                          ))}
                        {instructors.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">No instructors yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900">
                          Highest Rated Instructors
                        </h3>
                        <button
                          onClick={() => setActiveTab("evaluations")}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1"
                        >
                          <span>View all</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {evaluationsByInstructor
                          .filter((e) => e.average != null)
                          .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
                          .slice(0, 4)
                          .map(({ instructor, average, count }) => (
                            <div
                              key={instructor.id}
                              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                  {instructor.fullName.charAt(0)}
                                </div>
                                <div>
                                  <span className="block text-sm font-semibold text-slate-800">
                                    {instructor.fullName}
                                  </span>
                                  <span className="block text-[11px] text-slate-400 font-mono">
                                    {count} evaluation{count !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                                <Sparkles className="w-3 h-3" />
                                <span>{(average ?? 0).toFixed(2)}</span>
                              </span>
                            </div>
                          ))}
                        {evaluationsByInstructor.filter((e) => e.average != null).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">No evaluations yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ==================== COURSES ==================== */}
              {activeTab === "courses" && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-900">Course Offerings</h2>
                      <p className="text-sm text-slate-500">
                        {courses.length} courses • {instructors.length} instructors
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsBoardOpen(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-bold shadow-md shadow-primary/30 hover:shadow-lg transition shrink-0"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Reassign Board</span>
                      </motion.button>
                      <button
                        onClick={() => setIsPaletteOpen(true)}
                        className="flex-1 sm:flex-none sm:w-56 flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-500 hover:border-primary/40 hover:shadow-sm transition group"
                      >
                        <span className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-slate-400" />
                          <span>Search…</span>
                        </span>
                        <kbd className="hidden sm:inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-mono font-bold text-slate-500 group-hover:border-primary/30">
                          <Command className="w-2.5 h-2.5" />
                          <span>K</span>
                        </kbd>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group relative bg-white rounded-2xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all p-5 space-y-4 overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-indigo-600 opacity-0 group-hover:opacity-100 transition" />

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block text-[10px] font-mono font-bold text-primary bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg">
                              {c.courseCode}
                            </span>
                            <h3 className="font-display font-bold text-slate-900 mt-2 leading-tight">
                              {c.courseTitle}
                            </h3>
                          </div>
                          <span className="shrink-0 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                            {c.creditHours} CR
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {(c.instructorName || "?").charAt(0)}
                            </div>
                            <span className="text-xs text-slate-600 font-medium truncate">
                              {c.instructorName || "Unassigned"}
                            </span>
                          </div>
                          <button
                            onClick={() => openReassign(c)}
                            className="shrink-0 text-[11px] font-bold text-primary hover:text-primary-600 flex items-center space-x-1 transition"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Reassign</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredCourses.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      No courses match your search.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ==================== FACULTY ==================== */}
              {activeTab === "faculty" && (
                <motion.div
                  key="faculty"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Faculty Members</h2>
                    <p className="text-sm text-slate-500">
                      {instructors.length} active instructors in the department
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instructors.map((inst, i) => {
                      const load = courses.filter(
                        (c) => String(c.instructorId) === String(inst.id).replace(/^U_/, "")
                      ).length;
                      const evalData = evaluationsByInstructor.find((e) => e.instructor.id === inst.id);
                      return (
                        <motion.div
                          key={inst.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition p-5 space-y-4"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {inst.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 truncate">{inst.fullName}</h3>
                              <p className="text-[11px] text-slate-500 font-mono truncate">
                                {inst.specialization || "Faculty"} • {inst.department || "SE"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <span className="block text-[10px] font-mono text-slate-400">COURSES</span>
                              <strong className="block text-lg mt-0.5 text-slate-900">{load}</strong>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <span className="block text-[10px] font-mono text-slate-400">RATING</span>
                              <strong className="block text-lg mt-0.5 text-slate-900">
                                {evalData?.average != null ? evalData.average.toFixed(1) : "—"}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <LoadPill load={load} />
                            {inst.officeHours && (
                              <span className="text-[10px] font-mono text-slate-400 truncate">
                                {inst.officeHours}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {instructors.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-sm">No instructors found.</div>
                  )}
                </motion.div>
              )}

              {/* ==================== EVALUATIONS ==================== */}
              {activeTab === "evaluations" && (
                <motion.div
                  key="evaluations"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      Instructor Evaluations
                    </h2>
                    <p className="text-sm text-slate-500">Student feedback aggregated per instructor</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[640px]">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Instructor</th>
                            <th className="px-6 py-4 text-center">Evaluations</th>
                            <th className="px-6 py-4 text-center">Average</th>
                            <th className="px-6 py-4 text-center">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evaluationsByInstructor.map(({ instructor, count, average }) => (
                            <tr key={instructor.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                    {instructor.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="block font-semibold text-slate-800">
                                      {instructor.fullName}
                                    </span>
                                    <span className="block text-[11px] text-slate-400 font-mono">
                                      {instructor.specialization || "Faculty"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-slate-600">
                                {count}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {average != null ? (
                                  <span className="inline-flex items-center space-x-1 font-bold text-slate-800">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{average.toFixed(2)}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <RatingBadge average={average} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {evaluationsByInstructor.length === 0 && (
                      <div className="text-center py-16 text-slate-400 text-sm">
                        No evaluation data available.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ==================== ALERTS (placeholder) ==================== */}
              {activeTab === "alerts" && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
                    <Radio className="w-12 h-12 text-red-400 mx-auto" />
                    <h2 className="text-xl font-display font-bold text-slate-900">
                      Broadcast Circulars
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Broadcast messages to the department. Ask your admin to enable the
                      SmartCampusAlerts module here.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ==================== FACILITIES (placeholder) ==================== */}
              {activeTab === "facilities" && (
                <motion.div
                  key="facilities"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
                    <Cpu className="w-12 h-12 text-amber-500 mx-auto" />
                    <h2 className="text-xl font-display font-bold text-slate-900">
                      Lab & Hall Bookings
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Reserve departmental labs and lecture halls. Facility booking module
                      is available on the instructor portal.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ==================== REASSIGN MODAL ==================== */}
      <AnimatePresence>
        {reassigning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setReassigning(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942] p-6 text-white overflow-hidden">
                <div className="absolute -top-20 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">
                      COURSE REASSIGNMENT
                    </span>
                    <h3 className="font-display font-bold text-xl mt-1">
                      {reassigning.courseCode}
                    </h3>
                    <p className="text-xs text-slate-300/90 mt-0.5 truncate max-w-xs">
                      {reassigning.courseTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => !saving && setReassigning(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Currently assigned to
                  </span>
                  <p className="font-semibold text-slate-800">
                    {reassigning.instructorName || "Unassigned"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select New Instructor
                  </label>
                  <select
                    value={pickedInstructorId}
                    onChange={(e) => setPickedInstructorId(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  >
                    <option value="">— Choose an instructor —</option>
                   {instructors
  .filter(
    (i) =>
      String(i.department || "").trim().toLowerCase() ===
      String(user.department || "").trim().toLowerCase()
  )
  .map((i) => (
    <option key={i.id} value={i.id}>
      {i.fullName}
      {i.specialization ? ` • ${i.specialization}` : ""}
    </option>
  ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => !saving && setReassigning(null)}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveReassign}
                    disabled={saving || !pickedInstructorId}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2 transition"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Assigning…</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Reassignment</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== COMMAND PALETTE (⌘K) ==================== */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        courses={courses}
        instructors={instructors}
        navItems={[...navItems, ...smartItems]}
        onAction={handlePaletteAction}
        onOpenReassign={openReassign}
      />

      {/* ==================== REASSIGN BOARD (Drag & Drop) ==================== */}
      {/* ==================== REASSIGN BOARD (Drag & Drop) ==================== */}
      <ReassignBoard
        isOpen={isBoardOpen}
        onClose={() => setIsBoardOpen(false)}
        courses={courses}
        instructors={instructors}
        onReassign={boardReassign}
      />

      {/* ==================== TOASTS ==================== */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <AcademicFooter />
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
  loading = false,
}: {
  icon: typeof Layout;
  label: string;
  value: string;
  sub: string;
  accent: string;
  delay?: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 p-5 overflow-hidden"
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accent} opacity-10 rounded-full blur-2xl -mr-10 -mt-10`}
      />
      <div className="relative space-y-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </span>
          {loading ? (
            <>
              <Skeleton className="h-8 w-20 mt-1.5" />
              <Skeleton className="h-3 w-28 mt-2" />
            </>
          ) : (
            <>
              <strong className="block text-2xl font-display font-bold text-slate-900 mt-1">
                <AnimatedNumber value={value} delay={delay} />
              </strong>
              <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
function DistributionBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">
          {value} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layout;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-mono text-slate-400 uppercase">{label}</span>
        <strong className="block text-sm text-slate-800 truncate">{value}</strong>
      </div>
    </div>
  );
}

function LoadPill({ load }: { load: number }) {
  const cls =
    load > 4
      ? "bg-red-50 text-red-700 border-red-200"
      : load > 2
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${cls}`}
    >
      {load} course{load !== 1 ? "s" : ""}
    </span>
  );
}

function RatingBadge({ average }: { average: number | null }) {
  if (average == null) {
    return (
      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
        NO DATA
      </span>
    );
  }
  if (average >= 4.5) {
    return (
      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
        EXCELLENT
      </span>
    );
  }
  if (average >= 3.5) {
    return (
      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
        GOOD
      </span>
    );
  }
  if (average >= 2.5) {
    return (
      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
        OK
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
      REVIEW
    </span>
  );
} 
/* ==================== COMMAND PALETTE (⌘K) ==================== */

type PaletteAction = {
  type: "tab" | "course" | "instructor" | "reassign";
  id: string;
};

type PaletteItem = {
  key: string;
  group: "Actions" | "Navigate" | "Courses" | "Instructors";
  label: string;
  sub?: string;
  icon: typeof Layout;
  action: PaletteAction;
};

function CommandPalette({
  isOpen,
  onClose,
  courses,
  instructors,
  navItems,
  onAction,
  onOpenReassign,
}: {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  instructors: User[];
  navItems: { id: string; label: string; Icon: typeof Layout }[];
  onAction: (action: PaletteAction) => void;
  onOpenReassign: (course: Course) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input + reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build the flat, ordered list of items
  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (...fields: (string | undefined)[]) =>
      !q || fields.some((f) => (f || "").toLowerCase().includes(q));

    const navResults: PaletteItem[] = navItems
      .filter((n) => match(n.label))
      .map((n) => ({
        key: `nav-${n.id}`,
        group: "Navigate",
        label: n.label,
        icon: n.Icon,
        action: { type: "tab", id: n.id },
      }));

    const courseResults: PaletteItem[] = courses
      .filter((c) => match(c.courseCode, c.courseTitle, c.instructorName))
      .slice(0, 6)
      .map((c) => ({
        key: `course-${c.id}`,
        group: "Courses",
        label: c.courseTitle,
        sub: `${c.courseCode} · ${c.instructorName || "Unassigned"}`,
        icon: BookOpen,
        action: { type: "course", id: c.id },
      }));

    const instructorResults: PaletteItem[] = instructors
      .filter((i) => match(i.fullName, i.specialization, i.department))
      .slice(0, 6)
      .map((i) => ({
        key: `inst-${i.id}`,
        group: "Instructors",
        label: i.fullName,
        sub: i.specialization || i.department || "Faculty",
        icon: UserIcon,
        action: { type: "instructor", id: i.id },
      }));

    const reassignResults: PaletteItem[] = courses
      .filter((c) => match(c.courseCode, c.courseTitle))
      .slice(0, 4)
      .map((c) => ({
        key: `reassign-${c.id}`,
        group: "Actions",
        label: `Reassign ${c.courseCode}`,
        sub: c.instructorName ? `Currently: ${c.instructorName}` : "Unassigned",
        icon: Zap,
        action: { type: "reassign", id: c.id },
      }));

    return [...reassignResults, ...navResults, ...courseResults, ...instructorResults];
  }, [query, courses, instructors, navItems]);

  // Clamp activeIndex when list shrinks
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(items.length > 0 ? items.length - 1 : 0);
    }
  }, [items.length, activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) {
        onAction(item.action);
        if (item.action.type === "reassign") {
          const c = courses.find((x) => x.id === item.action.id);
          if (c) onOpenReassign(c);
        }
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Group items for rendering, but keep flat index mapping
  const grouped = useMemo(() => {
    const groups: { name: string; entries: { item: PaletteItem; index: number }[] }[] = [];
    items.forEach((item, index) => {
      let g = groups.find((x) => x.name === item.group);
      if (!g) {
        g = { name: item.group, entries: [] };
        groups.push(g);
      }
      g.entries.push({ item, index });
    });
    return groups;
  }, [items]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Input row */}
            <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search courses, faculty, actions…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-mono font-bold text-slate-500">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <div className="text-center py-10 text-sm text-slate-400">
                  No results for "<span className="font-semibold text-slate-600">{query}</span>"
                </div>
              )}

              {grouped.map((group) => (
                <div key={group.name} className="mb-1">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.name}
                  </div>
                  {group.entries.map(({ item, index }) => {
                    const isActive = index === activeIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        data-idx={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          onAction(item.action);
                          if (item.action.type === "reassign") {
                            const c = courses.find((x) => x.id === item.action.id);
                            if (c) onOpenReassign(c);
                          }
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {item.label}
                          </div>
                          {item.sub && (
                            <div
                              className={`text-[11px] font-mono truncate ${
                                isActive ? "text-white/70" : "text-slate-400"
                              }`}
                            >
                              {item.sub}
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-white/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-[10px] font-mono text-slate-500">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white">↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white">↵</kbd>
                  <span>select</span>
                </span>
              </div>
              <span className="flex items-center space-x-1">
                <Command className="w-2.5 h-2.5" />
                <span>K to toggle</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
/* ==================== ANIMATED NUMBER ==================== */

/**
 * Renders a number that counts up from 0 to its target value.
 * Understands strings like "12", "78.4%", "-3", "1,204".
 * Preserves the prefix/suffix (e.g. "%", ",", "pts").
 */
function AnimatedNumber({
  value,
  delay = 0,
  duration = 1.1,
}: {
  value: string | number;
  delay?: number;
  duration?: number;
}) {
  // Split the input into: prefix, numeric part, suffix
  const raw = String(value);
  const match = raw.match(/^([^\d.-]*)(-?[\d.,]+)(.*)$/);

  const prefix = match?.[1] ?? "";
  const numericStr = match?.[2] ?? raw;
  const suffix = match?.[3] ?? "";

  const hasComma = numericStr.includes(",");
  const cleaned = numericStr.replace(/,/g, "");
  const target = parseFloat(cleaned);
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1].length : 0;

  const isNumeric = Number.isFinite(target);

  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (latest) => {
    if (!isNumeric) return numericStr;
    const fixed = latest.toFixed(decimals);
    return hasComma
      ? Number(fixed).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : fixed;
  });

  // Re-run animation whenever the target value or delay changes
  useEffect(() => {
    if (!isNumeric) return;
    const controls = animate(motionVal, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint — feels premium
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay, duration, isNumeric]);

  if (!isNumeric) {
    return <span>{raw}</span>;
  }

  return (
    <span className="tabular-nums inline-flex items-baseline">
      {prefix && <span>{prefix}</span>}
      <motion.span>{display}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
/* ==================== SKELETON PRIMITIVES ==================== */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/70 rounded-md ${className}`}
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.4,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />
    </div>
  );
}
/* ==================== OVERVIEW SKELETON ==================== */

function OverviewSkeleton() {
  return (
    <>
      {/* Grade distribution skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-56" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column lists skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((col) => (
          <div
            key={col}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
/* ==================== PULSE GAUGES ==================== */

type GaugeAccent = "emerald" | "blue" | "amber" | "violet";

const GAUGE_ACCENTS: Record<
  GaugeAccent,
  { stroke: string; glow: string; text: string; track: string }
> = {
  emerald: {
    stroke: "#34d399",
    glow: "rgba(52, 211, 153, 0.45)",
    text: "text-emerald-300",
    track: "rgba(52, 211, 153, 0.15)",
  },
  blue: {
    stroke: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.45)",
    text: "text-blue-300",
    track: "rgba(96, 165, 250, 0.15)",
  },
  amber: {
    stroke: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.45)",
    text: "text-amber-300",
    track: "rgba(251, 191, 36, 0.15)",
  },
  violet: {
    stroke: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.45)",
    text: "text-violet-300",
    track: "rgba(167, 139, 250, 0.15)",
  },
};

function PulseGauge({
  value,
  label,
  suffix = "%",
  accent,
  delay = 0,
  size = 92,
  stroke = 8,
}: {
  value: number;
  label: string;
  suffix?: string;
  accent: GaugeAccent;
  delay?: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  const theme = GAUGE_ACCENTS[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, type: "spring", stiffness: 140 }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.55] }}
          transition={{ duration: 2.4, delay: delay + 0.3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: theme.glow }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative -rotate-90"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.track}
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.4,
              delay: delay + 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ filter: `drop-shadow(0 0 6px ${theme.glow})` }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display font-black text-base tabular-nums ${theme.text}`}
          >
            <AnimatedNumber value={`${Math.round(clamped)}${suffix}`} delay={delay + 0.2} duration={1.2} />
          </span>
        </div>
      </div>
      <span className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-white/60">
        {label}
      </span>
    </motion.div>
  );
}

function PulseGaugesGrid({
  metrics,
  loading,
}: {
  metrics: {
    value: number;
    label: string;
    suffix?: string;
    accent: GaugeAccent;
  }[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-3 shrink-0">
      {metrics.map((m, i) => (
        <PulseGauge
          key={m.label}
          value={loading ? 0 : m.value}
          label={m.label}
          suffix={m.suffix}
          accent={m.accent}
          delay={0.15 + i * 0.1}
          size={86}
          stroke={7}
        />
      ))}
    </div>
  );
}
/* ==================== REASSIGN BOARD (Drag & Drop) ==================== */

function ReassignBoard({
  isOpen,
  onClose,
  courses,
  instructors,
  onReassign,
}: {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  instructors: User[];
  onReassign: (courseId: string, instructorId: string | null) => Promise<boolean>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverColumnId, setHoverColumnId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const MAX_LOAD = 5;

  const unassigned = courses.filter((c) => !c.instructorId && !c.instructorName);
  const coursesFor = (inst: User) =>
    courses.filter(
      (c) =>
        String(c.instructorId).replace(/^U_/, "") ===
        String(inst.id).replace(/^U_/, "")
    );

  const handleDrop = async (targetInstructorId: string | null) => {
    if (!draggingId) return;
    setHoverColumnId(null);

    const course = courses.find((c) => c.id === draggingId);
    if (!course) return;

    const currentInstId = course.instructorId
      ? String(course.instructorId).replace(/^U_/, "")
      : "";
    const targetId = targetInstructorId
      ? String(targetInstructorId).replace(/^U_/, "")
      : "";

    if (currentInstId === targetId) {
      setDraggingId(null);
      return;
    }

    setSavingId(draggingId);
    setDraggingId(null);
    await onReassign(course.id, targetInstructorId);
    setSavingId(null);
  };

  const columns = [
    { id: null as string | null, name: "Unassigned", subtitle: undefined, courses: unassigned, load: unassigned.length },
    ...instructors.map((inst) => {
      const list = coursesFor(inst);
      return {
        id: inst.id as string | null,
        name: inst.fullName,
        subtitle: inst.specialization,
        courses: list,
        load: list.length,
      };
    }),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex flex-col bg-slate-950/85 backdrop-blur-md"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-white text-sm sm:text-base truncate">
                  Faculty Reassignment Board
                </h2>
                <p className="text-[10px] sm:text-xs font-mono text-slate-400 truncate">
                  Drag a course card onto an instructor column · Changes save instantly
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition shrink-0"
              aria-label="Close board"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Columns */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
            <div className="flex items-stretch gap-3 sm:gap-4 h-full min-w-max">
              {columns.map((col, i) => {
                const isOverloaded = col.load >= MAX_LOAD;
                const isWarn = col.load === MAX_LOAD - 1;
                const isHover = hoverColumnId === col.id;
                const isUnassigned = col.id === null;

                return (
                  <motion.div
                    key={col.id ?? "__unassigned__"}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverColumnId(col.id);
                    }}
                    onDragLeave={() => {
                      if (hoverColumnId === col.id) setHoverColumnId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(col.id);
                    }}
                    className={`relative flex flex-col w-64 shrink-0 rounded-2xl border transition-colors overflow-hidden ${
                      isUnassigned
                        ? "bg-slate-900/60 border-slate-700"
                        : isHover
                        ? "bg-emerald-950/40 border-emerald-500/60"
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    {/* Column header */}
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {col.name}
                          </span>
                          {!isUnassigned && isOverloaded && (
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                          {!isUnassigned && isWarn && (
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        {col.subtitle && (
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            {col.subtitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                          isUnassigned
                            ? "bg-slate-800 text-slate-400 border-slate-700"
                            : isOverloaded
                            ? "bg-red-500/15 text-red-300 border-red-500/40"
                            : isWarn
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {col.load}
                        {!isUnassigned && `/${MAX_LOAD}`}
                      </span>
                    </div>

                    {/* Course cards */}
                    <div className="p-2 flex-1 space-y-2 overflow-y-auto min-h-[200px]">
                      {col.courses.map((c) => {
                        const isSaving = savingId === c.id;
                        const isDragging = draggingId === c.id;
                        return (
                          <motion.div
                            key={c.id}
                            layout
                            draggable={!isSaving}
                            onDragStart={(e) => {
                              if (isSaving) {
                                e.preventDefault();
                                return;
                              }
                              setDraggingId(c.id);
                              try {
                                (e as any).dataTransfer?.setData("text/plain", c.id);
                              } catch {}
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setHoverColumnId(null);
                            }}
                            whileDrag={{ scale: 1.04, rotate: 2, zIndex: 50 }}
                            whileHover={{ y: -1 }}
                            className={`group relative bg-slate-800 border border-slate-700 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition shadow-sm hover:shadow-md hover:border-primary/40 ${
                              isDragging
                                ? "opacity-40 border-dashed"
                                : isSaving
                                ? "opacity-70 cursor-wait"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="inline-block text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded">
                                  {c.courseCode}
                                </span>
                                <p className="text-[11px] text-slate-300 font-medium truncate mt-1.5">
                                  {c.courseTitle}
                                </p>
                              </div>
                              {isSaving ? (
                                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0 mt-1" />
                              ) : (
                                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5 transition" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/60">
                              <span className="text-[9px] font-mono text-slate-500">
                                {c.creditHours ?? "?"} CR
                              </span>
                              {!isUnassigned && (
                                <button
                                  onClick={() => handleDrop(null)}
                                  className="text-[9px] font-mono font-bold text-slate-500 hover:text-red-400 transition"
                                  title="Unassign"
                                >
                                  × unassign
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                      {col.courses.length === 0 && (
                        <div
                          className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed transition ${
                            isHover
                              ? "border-emerald-500/60 bg-emerald-500/5"
                              : "border-slate-700/60"
                          }`}
                        >
                          <p className="text-[10px] font-mono text-slate-500">
                            {isHover ? "Drop here" : "Empty"}
                          </p>
                        </div>
                      )}
                    </div>

                    {isHover && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400/40"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
/* ==================== CONFETTI ==================== */

function fireConfettiBurst({
  x = 0.5,
  y = 0.7,
  count = 70,
}: {
  x?: number;
  y?: number;
  count?: number;
} = {}) {
  const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#fbbf24", "#a78bfa"];

  confetti({
    particleCount: count,
    spread: 70,
    origin: { x, y },
    colors: palette,
    scalar: 0.95,
    ticks: 180,
    gravity: 0.9,
    decay: 0.92,
    startVelocity: 45,
    zIndex: 9999,
  });

  setTimeout(() => {
    confetti({
      particleCount: Math.floor(count * 0.55),
      spread: 110,
      origin: { x, y },
      colors: palette,
      scalar: 0.7,
      ticks: 140,
      gravity: 0.8,
      zIndex: 9999,
    });
  }, 120);
}

/* ==================== TOAST STACK ==================== */

type ToastShape = {
  id: string;
  type: "success" | "error";
  title: string;
  message?: string;
};

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastShape[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col items-end space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const Icon = isSuccess ? CheckCircle2 : AlertCircle;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden"
            >
              <div
                className={`h-1 w-full ${
                  isSuccess
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                    : "bg-gradient-to-r from-red-400 to-orange-500"
                }`}
              />

              <div className="p-3.5 flex items-start space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 260,
                    delay: 0.08,
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {t.title}
                    </h4>
                    {isSuccess && (
                      <PartyPopper className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {t.message && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 line-clamp-2 break-words">
                      {t.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onDismiss(t.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.5, ease: "linear" }}
                className={`h-0.5 ${
                  isSuccess ? "bg-emerald-400/70" : "bg-red-400/70"
                }`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}