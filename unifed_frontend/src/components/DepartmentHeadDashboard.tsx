import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
      alert("Please select an instructor.");
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

      setReassigning(null);
      setPickedInstructorId("");
    } catch (err: any) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      alert("Failed to reassign faculty: " + detail);
    } finally {
      setSaving(false);
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
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-mono font-bold text-amber-300 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ACADEMIC YEAR 2025/2026 • SEMESTER II</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                    Department Performance
                  </h1>
                  <p className="text-slate-300/90 text-sm max-w-2xl leading-relaxed">
                    Real-time academic intelligence — faculty workloads, student outcomes, and course delivery in one view.
                  </p>
                </div>

                <motion.button
                  onClick={loadData}
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="self-start inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Syncing…" : "Sync Data"}</span>
                </motion.button>
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
              />
              <StatCard
                icon={BookOpen}
                label="Active Courses"
                value={String(courses.length)}
                sub="Current catalogue"
                accent="from-violet-500 to-purple-600"
                delay={0.1}
              />
              <StatCard
                icon={Target}
                label="Pass Rate"
                value={`${stats.passRate.toFixed(1)}%`}
                sub={`${stats.passed} of ${stats.totalGrades} students`}
                accent="from-emerald-500 to-teal-600"
                delay={0.15}
              />
              <StatCard
                icon={AlertTriangle}
                label="At-Risk Students"
                value={`${stats.failRate.toFixed(1)}%`}
                sub={`${stats.failed} flagged`}
                accent="from-amber-500 to-orange-600"
                delay={0.2}
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
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search courses…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
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
                    {instructors.map((i) => (
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
}: {
  icon: typeof Layout;
  label: string;
  value: string;
  sub: string;
  accent: string;
  delay?: number;
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
          <strong className="block text-2xl font-display font-bold text-slate-900 mt-1">
            {value}
          </strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>
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