import { useState, useEffect, useMemo } from "react";
import type { User, Course, Grade } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import {
  Layout,
  Users,
  BookOpen,
  Award,
  Target,
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Activity,
  GraduationCap,
  Building2,
  Radio,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Tab = "overview" | "departments" | "faculty" | "reports" | "alerts";

export function DeanDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

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
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setEvaluations(Array.isArray(evalsData) ? evalsData : []);
    } catch (error) {
      console.error("Failed to load dean data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- DERIVED DATA ----------
  const stats = useMemo(() => {
    const totalGrades = grades.length;
    const passed = grades.filter((g) => (g.totalGrade ?? 0) >= 50).length;
    const distinguished = grades.filter((g) => (g.totalGrade ?? 0) >= 85).length;
    const failed = totalGrades - passed;
    const passRate = totalGrades > 0 ? (passed / totalGrades) * 100 : 0;
    const avgGrade =
      totalGrades > 0
        ? grades.reduce((s, g) => s + (g.totalGrade ?? 0), 0) / totalGrades
        : 0;

    const instructors = allUsers.filter((u) => u.role === "INSTRUCTOR").length;
    const students = allUsers.filter((u) => u.role === "STUDENT").length;

    // ✅ FIXED: read overallRating from nested `ratings` object, fall back to
    // flat fields for robustness. `Number()` guarantees a numeric result.
    const avgEval =
      evaluations.length > 0
        ? evaluations.reduce(
            (s, e: any) =>
              s + Number(e?.ratings?.overallRating ?? e?.overall_rating ?? e?.overallRating ?? 0),
            0
          ) / evaluations.length
        : 0;

    return {
      totalGrades,
      passed,
      failed,
      distinguished,
      passRate,
      avgGrade,
      instructors,
      students,
      avgEval,
    };
  }, [grades, allUsers, evaluations]);

  // Group grades by "department" (derived from courseCode prefix)
  const departments = useMemo(() => {
    const map: Record<
      string,
      { name: string; passRate: number; count: number; avgGrade: number; color: string; accent: string }
    > = {};

    const deptNames: Record<string, string> = {
      SWE: "Software Engineering",
      CS: "Computer Science",
      IT: "Information Technology",
      IS: "Information Systems",
      SE: "Software Engineering",
      COSC: "Computer Science",
    };

    const deptColors: Record<string, { bg: string; accent: string }> = {
      SWE: { bg: "bg-blue-600", accent: "from-blue-500 to-indigo-600" },
      CS: { bg: "bg-emerald-600", accent: "from-emerald-500 to-teal-600" },
      IT: { bg: "bg-amber-600", accent: "from-amber-500 to-orange-600" },
      IS: { bg: "bg-purple-600", accent: "from-purple-500 to-pink-600" },
      SE: { bg: "bg-indigo-600", accent: "from-indigo-500 to-purple-600" },
      COSC: { bg: "bg-rose-600", accent: "from-rose-500 to-red-600" },
    };

    grades.forEach((g) => {
      const code = (g.courseCode || "").toUpperCase().replace(/[0-9\s]/g, "");
      const prefix = code.slice(0, 4) || "GEN";
      if (!map[prefix]) {
        const colors =
          deptColors[prefix] ?? { bg: "bg-slate-600", accent: "from-slate-500 to-slate-700" };
        map[prefix] = {
          name: deptNames[prefix] || `Department ${prefix}`,
          passRate: 0,
          count: 0,
          avgGrade: 0,
          color: colors.bg,
          accent: colors.accent,
        };
      }
      map[prefix].count += 1;
      map[prefix].avgGrade += g.totalGrade ?? 0;
      if ((g.totalGrade ?? 0) >= 50) map[prefix].passRate += 1;
    });

    return Object.values(map).map((d) => ({
      ...d,
      passRate: d.count > 0 ? (d.passRate / d.count) * 100 : 0,
      avgGrade: d.count > 0 ? d.avgGrade / d.count : 0,
    }));
  }, [grades]);

  const topInstructors = useMemo(() => {
    const instructors = allUsers.filter((u) => u.role === "INSTRUCTOR");
    return instructors
      .map((inst) => {
        const instEvals = evaluations.filter(
          (e) => String(e.instructorId) === String(inst.id).replace(/^U_/, "")
        );
        // ✅ FIXED: same nested-ratings lookup as above
        const avg =
          instEvals.length > 0
            ? instEvals.reduce(
                (sum, e: any) =>
                  sum +
                  Number(e?.ratings?.overallRating ?? e?.overall_rating ?? e?.overallRating ?? 0),
                0
              ) / instEvals.length
            : null;
        const load = courses.filter(
          (c) => String(c.instructorId) === String(inst.id).replace(/^U_/, "")
        ).length;
        return { inst, avg, count: instEvals.length, load };
      })
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  }, [allUsers, evaluations, courses]);

  // ---------- REPORT DOWNLOAD ----------
  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const report = buildReport();
      downloadTextFile(
        `MAU_College_Annual_Report_${new Date().toISOString().split("T")[0]}.txt`,
        report
      );
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "DEAN",
        "Download College Report",
        "Report",
        "annual-" + new Date().toISOString().split("T")[0],
        "Downloaded official College Annual Report"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const buildReport = () => {
    const lines: string[] = [];
    const now = new Date().toLocaleString();

    lines.push("=".repeat(70));
    lines.push("  MEKDELA AMBA UNIVERSITY");
    lines.push("  College of Informatics & Mathematical Sciences");
    lines.push("  OFFICIAL COLLEGE ANNUAL REPORT");
    lines.push("=".repeat(70));
    lines.push("");
    lines.push(`Generated: ${now}`);
    lines.push(`Prepared by: ${user.fullName} (College Dean)`);
    lines.push(`Academic Year: 2025/2026 • Semester II`);
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("1. EXECUTIVE SUMMARY");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push(`  Total Enrolled Students ....... ${stats.students}`);
    lines.push(`  Active Faculty Members ........ ${stats.instructors}`);
    lines.push(`  Courses Offered ............... ${courses.length}`);
    lines.push(`  Grade Records Processed ....... ${stats.totalGrades}`);
    lines.push(`  College Pass Rate ............. ${stats.passRate.toFixed(1)}%`);
    lines.push(`  Average Grade ................. ${stats.avgGrade.toFixed(1)}%`);
    lines.push(`  Distinctions (≥ 85%) .......... ${stats.distinguished}`);
    lines.push(`  At-Risk Students .............. ${stats.failed}`);
    lines.push(`  Average Instructor Rating ..... ${stats.avgEval.toFixed(2)} / 5.00`);
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("2. DEPARTMENTAL PERFORMANCE");
    lines.push("-".repeat(70));
    lines.push("");
    if (departments.length === 0) {
      lines.push("  No departmental data available.");
    } else {
      departments.forEach((d, i) => {
        lines.push(`  ${i + 1}. ${d.name}`);
        lines.push(`     Pass Rate ......... ${d.passRate.toFixed(1)}%`);
        lines.push(`     Average Grade ..... ${d.avgGrade.toFixed(1)}%`);
        lines.push(`     Records ........... ${d.count}`);
        lines.push("");
      });
    }
    lines.push("-".repeat(70));
    lines.push("3. TOP PERFORMING FACULTY");
    lines.push("-".repeat(70));
    lines.push("");
    topInstructors
      .filter((t) => t.avg != null)
      .slice(0, 5)
      .forEach((t, i) => {
        lines.push(
          `  ${i + 1}. ${t.inst.fullName.padEnd(30)} Rating: ${(t.avg ?? 0).toFixed(2)} / 5.00`
        );
        lines.push(
          `     ${t.count} evaluation${t.count !== 1 ? "s" : ""} • ${t.load} course${t.load !== 1 ? "s" : ""}`
        );
        lines.push("");
      });
    lines.push("-".repeat(70));
    lines.push("4. CERTIFICATION");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push("  This report is generated from the University Smart Campus Management");
    lines.push("  System (USCMS) and reflects verified academic records.");
    lines.push("");
    lines.push("  Prepared by: " + user.fullName);
    lines.push("  Position: College Dean, College of Informatics & Math Sciences");
    lines.push("  Date: " + now);
    lines.push("");
    lines.push("=".repeat(70));
    lines.push("  END OF REPORT");
    lines.push("=".repeat(70));
    return lines.join("\n");
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------- NAV ITEMS ----------
  const navItems: { id: Tab; label: string; shortLabel: string; Icon: typeof Layout }[] = [
    { id: "overview", label: "College Overview", shortLabel: "Overview", Icon: Layout },
    { id: "departments", label: "Departmental Analytics", shortLabel: "Departments", Icon: Building2 },
    { id: "faculty", label: "Faculty Performance", shortLabel: "Faculty", Icon: Users },
    { id: "reports", label: "Official Reports", shortLabel: "Reports", Icon: FileText },
  ];

  const smartItems: { id: Tab; label: string; shortLabel: string; Icon: typeof Layout }[] = [
    { id: "alerts", label: "Broadcast Circulars", shortLabel: "Alerts", Icon: Radio },
  ];

  const goToTab = (id: string) => {
    setActiveTab(id as Tab);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dean_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="College Dean & Academic Senate Executive"
        portalSubtitle="College of Informatics & Mathematical Sciences • University Senate"
        badgeText="COLLEGE DEAN"
        badgeType="admin"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE DRAWER */}
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
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">COLLEGE DEAN</p>
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
                    Executive Console
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
                    Governance
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
                    <Icon className="w-4 h-4 text-red-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <p>
                  Staff ID: <span className="text-amber-400">{user.staffId || "DEAN001"}</span>
                </p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                  Senate Seat: Executive
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE QUICK-NAV */}
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
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
              <p className="text-[10px] font-mono text-amber-400 font-bold">
                COLLEGE OF INFORMATICS
              </p>
            </div>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <div className="pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Executive Console
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
                Governance
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
                <Icon className="w-4 h-4 text-red-400" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>
              Staff ID: <span className="text-amber-400">{user.staffId || "DEAN001"}</span>
            </p>
            <p>College: Informatics</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
              Senate Seat: Executive
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* HERO */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942]">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
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
                    <span>ACADEMIC SENATE • EXECUTIVE COUNCIL</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                    College Academic Standing
                  </h1>
                  <p className="text-slate-300/90 text-sm max-w-2xl leading-relaxed">
                    Comprehensive college metrics, departmental retention indices, and faculty
                    performance analytics — the entire College of Informatics in one view.
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

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50 rounded-t-[3rem]" />
          </div>

          {/* FLOATING STAT CARDS */}
          <div className="px-4 sm:px-6 md:px-8 -mt-16 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={GraduationCap}
                label="Enrolled Students"
                value={String(stats.students)}
                sub="Across all departments"
                accent="from-blue-500 to-indigo-600"
                delay={0.05}
              />
              <StatCard
                icon={Users}
                label="Faculty Members"
                value={String(stats.instructors)}
                sub="Active instructors"
                accent="from-violet-500 to-purple-600"
                delay={0.1}
              />
              <StatCard
                icon={Target}
                label="College Pass Rate"
                value={`${stats.passRate.toFixed(1)}%`}
                sub={`${stats.passed} of ${stats.totalGrades} graded`}
                accent="from-emerald-500 to-teal-600"
                delay={0.15}
              />
              <StatCard
                icon={Award}
                label="Avg Faculty Rating"
                value={stats.avgEval > 0 ? `${stats.avgEval.toFixed(2)}` : "—"}
                sub={`${evaluations.length} evaluations`}
                accent="from-amber-500 to-orange-600"
                delay={0.2}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
            <AnimatePresence mode="wait">
              {/* OVERVIEW */}
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
                          College Grade Distribution
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {stats.totalGrades} records
                      </span>
                    </div>

                    <div className="space-y-3">
                      <DistributionBar
                        label="Distinguished (≥ 85%)"
                        value={stats.distinguished}
                        total={stats.totalGrades}
                        color="bg-gradient-to-r from-emerald-400 to-teal-500"
                      />
                      <DistributionBar
                        label="Passed (≥ 50%)"
                        value={stats.passed - stats.distinguished}
                        total={stats.totalGrades}
                        color="bg-gradient-to-r from-blue-400 to-indigo-500"
                      />
                      <DistributionBar
                        label="At Risk (< 50%)"
                        value={stats.failed}
                        total={stats.totalGrades}
                        color="bg-gradient-to-r from-amber-400 to-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <MiniStat
                        icon={Activity}
                        label="Avg Grade"
                        value={`${stats.avgGrade.toFixed(1)}%`}
                      />
                      <MiniStat
                        icon={BookOpen}
                        label="Courses"
                        value={String(courses.length)}
                      />
                      <MiniStat
                        icon={Sparkles}
                        label="Evaluations"
                        value={String(evaluations.length)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900">
                          Departmental Performance
                        </h3>
                        <button
                          onClick={() => setActiveTab("departments")}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {departments.slice(0, 4).map((d) => (
                          <div key={d.name} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 truncate">
                                {d.name}
                              </span>
                              <span className="font-mono text-slate-500">
                                {d.passRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${d.passRate}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${d.color}`}
                              />
                            </div>
                          </div>
                        ))}
                        {departments.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">
                            No departmental data yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900">
                          Top Performing Faculty
                        </h3>
                        <button
                          onClick={() => setActiveTab("faculty")}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1"
                        >
                          <span>View all</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {topInstructors
                          .filter((t) => t.avg != null)
                          .slice(0, 4)
                          .map(({ inst, avg, count }) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                  {inst.fullName.charAt(0)}
                                </div>
                                <div>
                                  <span className="block text-sm font-semibold text-slate-800">
                                    {inst.fullName}
                                  </span>
                                  <span className="block text-[11px] text-slate-400 font-mono">
                                    {count} evaluation{count !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                                <Sparkles className="w-3 h-3" />
                                <span>{(avg ?? 0).toFixed(2)}</span>
                              </span>
                            </div>
                          ))}
                        {topInstructors.filter((t) => t.avg != null).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">
                            No evaluations yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DEPARTMENTS */}
              {activeTab === "departments" && (
                <motion.div
                  key="departments"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      Departmental Analytics
                    </h2>
                    <p className="text-sm text-slate-500">
                      Pass rates, grade averages, and enrolment counts per department
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((d, i) => (
                      <motion.div
                        key={d.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition p-6 space-y-4 overflow-hidden"
                      >
                        <div
                          className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${d.accent}`}
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display font-bold text-slate-900">{d.name}</h3>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {d.count} grade record{d.count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <span className="text-2xl font-display font-bold text-slate-900">
                            {d.passRate.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.passRate}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${d.color}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              AVG GRADE
                            </span>
                            <strong className="block text-base text-slate-800 mt-0.5">
                              {d.avgGrade.toFixed(1)}%
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              RECORDS
                            </span>
                            <strong className="block text-base text-slate-800 mt-0.5">
                              {d.count}
                            </strong>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {departments.length === 0 && (
                      <div className="col-span-full text-center py-16 text-slate-400 text-sm">
                        No departmental data available yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* FACULTY */}
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
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      College Faculty Performance
                    </h2>
                    <p className="text-sm text-slate-500">
                      Ratings, course loads, and evaluation counts across the college
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[680px]">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Instructor</th>
                            <th className="px-6 py-4 text-center">Courses</th>
                            <th className="px-6 py-4 text-center">Evaluations</th>
                            <th className="px-6 py-4 text-center">Rating</th>
                            <th className="px-6 py-4 text-center">Standing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {topInstructors.map(({ inst, avg, count, load }) => (
                            <tr key={inst.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {inst.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="block font-semibold text-slate-800">
                                      {inst.fullName}
                                    </span>
                                    <span className="block text-[11px] text-slate-400 font-mono">
                                      {inst.specialization || "Faculty"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-slate-600">
                                {load}
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-slate-600">
                                {count}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {avg != null ? (
                                  <span className="inline-flex items-center space-x-1 font-bold text-slate-800">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{avg.toFixed(2)}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <RatingBadge average={avg} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {topInstructors.length === 0 && (
                      <div className="text-center py-16 text-slate-400 text-sm">
                        No faculty records yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* REPORTS */}
              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      Official Reports
                    </h2>
                    <p className="text-sm text-slate-500">
                      Generated from live USCMS data — signed and ready for senate review
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shrink-0">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-slate-900 text-lg">
                          College Annual Report
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                          A comprehensive summary of the college's academic performance —
                          including departmental pass rates, faculty standings, grade
                          distributions, and executive certification.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              STUDENTS
                            </span>
                            <strong className="block text-base mt-0.5">
                              {stats.students}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              FACULTY
                            </span>
                            <strong className="block text-base mt-0.5">
                              {stats.instructors}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              PASS RATE
                            </span>
                            <strong className="block text-base mt-0.5">
                              {stats.passRate.toFixed(1)}%
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] font-mono text-slate-400">
                              DEPARTMENTS
                            </span>
                            <strong className="block text-base mt-0.5">
                              {departments.length}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadReport}
                        disabled={generatingReport}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                      >
                        {generatingReport ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating…</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Official College Report</span>
                          </>
                        )}
                      </motion.button>
                      <p className="text-[11px] text-slate-400 mt-3 font-mono">
                        Generates a plain-text report (.txt) with all live data. Audit-logged.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ALERTS */}
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
                      Broadcast college-wide announcements to faculty, students, and staff.
                      This module can be wired to{" "}
                      <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        SmartCampusAlerts
                      </code>
                      .
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

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