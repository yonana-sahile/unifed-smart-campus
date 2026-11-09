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
  // ✅ FIX #5: explicit error state — no more silent failures.
  const [error, setError] = useState<string | null>(null);
  // ✅ FIX #5: tiny inline toast (replaces alert()).
  const [toast, setToast] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);
  // ✅ FIX #6/2B: selected department for the slide-over drawer.
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  // ✅ STEP 7: Faculty tab UI state.
  const [facultySearch, setFacultySearch] = useState("");
  const [facultySort, setFacultySort] = useState<
    "name" | "load" | "count" | "avg"
  >("avg");
  const [facultySortDir, setFacultySortDir] = useState<"asc" | "desc">("desc");
  const [facultyBand, setFacultyBand] = useState<
    "all" | "excellent" | "good" | "ok" | "review" | "nodata"
  >("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);

  // ✅ STEP 9: Alerts composer state
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertAudience, setAlertAudience] = useState<
    "ALL" | "FACULTY" | "STUDENTS" | "STAFF"
  >("ALL");
  const [alertPriority, setAlertPriority] = useState<
    "NORMAL" | "IMPORTANT" | "URGENT"
  >("NORMAL");
  const [alertSending, setAlertSending] = useState(false);
  const [sentAlerts, setSentAlerts] = useState<
    {
      id: string;
      title: string;
      message: string;
      audience: string;
      priority: string;
      sentAt: string;
      // ✅ STEP 1: distinguish real broadcasts from local drafts
      status: "SENT" | "DRAFT";
    }[]
  >([]);

  // ✅ STEP 10: global state
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // ✅ STEP 8: recent downloads (audit-log driven, graceful fallback)
  // ASSUMPTION: CampusDatabase.getAuditLogs may not exist. We guard with typeof.
  const [recentDownloads, setRecentDownloads] = useState<
    { id: string; label: string; timestamp: string }[]
  >([]);

  // ✅ STEP 10: initialise tab from URL hash, sync back on change.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    const valid: Tab[] = ["overview", "departments", "faculty", "reports", "alerts"];
    if (valid.includes(fromHash as Tab)) {
      setActiveTab(fromHash as Tab);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const fromHash = window.location.hash.replace(/^#/, "");
      const valid: Tab[] = ["overview", "departments", "faculty", "reports", "alerts"];
      if (valid.includes(fromHash as Tab) && fromHash !== activeTab) {
        setActiveTab(fromHash as Tab);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, "", `#${activeTab}`);
      }
    }
  }, [activeTab]);

  // ✅ STEP 10 + 11.5: Cmd/Ctrl+K opens palette, Escape closes all overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      if (e.key === "Escape") {
        if (commandOpen) {
          setCommandOpen(false);
          setCommandQuery("");
        }
        if (selectedDept) setSelectedDept(null);
        if (selectedInstructor) setSelectedInstructor(null);
        if (isMobileNavOpen) setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, selectedDept, selectedInstructor, isMobileNavOpen]);

  // ✅ FIX: define loadData BEFORE the effects that reference it.
  const loadData = async () => {
    setLoading(true);
    setError(null); // clear previous error on retry
    try {
      // ✅ FIX #5: no more `.catch(() => [])` swallowing. Each call is
      // wrapped individually so one failure doesn't hide the others.
      const results = await Promise.allSettled([
        CampusDatabase.getCourses(),
        CampusDatabase.getGrades(),
        CampusDatabase.getUsers(),
        CampusDatabase.getEvaluations(),
      ]);

      const [coursesRes, gradesRes, usersRes, evalsRes] = results;
      const failures: string[] = [];

      if (coursesRes.status === "fulfilled") {
        setCourses(Array.isArray(coursesRes.value) ? coursesRes.value : []);
      } else {
        setCourses([]);
        failures.push("courses");
      }

      if (gradesRes.status === "fulfilled") {
        setGrades(Array.isArray(gradesRes.value) ? gradesRes.value : []);
      } else {
        setGrades([]);
        failures.push("grades");
      }

      if (usersRes.status === "fulfilled") {
        setAllUsers(Array.isArray(usersRes.value) ? usersRes.value : []);
      } else {
        setAllUsers([]);
        failures.push("users");
      }

      if (evalsRes.status === "fulfilled") {
        setEvaluations(Array.isArray(evalsRes.value) ? evalsRes.value : []);
      } else {
        setEvaluations([]);
        failures.push("evaluations");
      }

      if (failures.length > 0) {
        setError(
          `Failed to load: ${failures.join(", ")}. Other data loaded fine. Click Retry.`
        );
      }
    } catch (err) {
      console.error("Failed to load dean data:", err);
      setError("Failed to load dashboard data. Click Retry.");
    } finally {
      setLoading(false);
      // ✅ STEP 10: record sync time.
      setLastSynced(new Date());
    }
  };

  // ✅ STEP 10: initial load + auto-refresh every 5 min, paused when tab hidden.
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ STEP 11.5: toast auto-dismiss after 4 seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ✅ STEP 8: load recent downloads from audit log, if the API exists.
  useEffect(() => {
    const load = async () => {
      const db = CampusDatabase as any;
      if (typeof db.getAuditLogs !== "function") return;
      try {
        const logs = await db.getAuditLogs();
        if (!Array.isArray(logs)) return;
        const mine = logs
          .filter(
            (l: any) =>
              String(l.userId ?? "") === String(user.id ?? "") &&
              String(l.action ?? "").toLowerCase().includes("download")
          )
          .slice(-5)
          .reverse()
          .map((l: any) => ({
            id: String(l.id ?? Math.random()),
            label: String(l.action ?? "Download"),
            timestamp: String(l.timestamp ?? ""),
          }));
        setRecentDownloads(mine);
      } catch {
        // silent — feature is best-effort
      }
    };
    load();
  }, [user.id]);

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

    // ✅ STEP 1: one flag per student. A student with any fail is at-risk.
    // No double-counting — each student appears exactly once.
    const hasFail = new Map<string, boolean>();
    grades.forEach((g) => {
      const sid = String(g.studentId ?? "").replace(/^U_/, "").trim();
      if (!sid) return;
      hasFail.set(sid, (hasFail.get(sid) ?? false) || (g.totalGrade ?? 0) < 50);
    });
    const totalStudentsGraded = hasFail.size;
    const atRiskStudents = [...hasFail.values()].filter(Boolean).length;
    const passedStudents = totalStudentsGraded - atRiskStudents;
    const studentPassRate =
      totalStudentsGraded > 0
        ? (passedStudents / totalStudentsGraded) * 100
        : 0;

    const instructors = allUsers.filter((u) => u.role === "INSTRUCTOR").length;
    const students = allUsers.filter((u) => u.role === "STUDENT").length;

    // ✅ FIX #3: only average VALID ratings (> 0). Missing/zero ratings are
    // skipped, not coerced to 0 (which would drag the mean down).
    const validRatings = evaluations
      .map((e: any) => {
        const raw =
          e?.ratings?.overallRating ?? e?.overall_rating ?? e?.overallRating ?? null;
        if (raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
      })
      .filter((v): v is number => v != null);
    const avgEval =
      validRatings.length > 0
        ? validRatings.reduce((s, v) => s + v, 0) / validRatings.length
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
      // ✅ FIX #1: new distinct-student fields
      atRiskStudents,
      passedStudents,
      studentPassRate,
    };
  }, [grades, allUsers, evaluations]);

  // Group grades by "department" (derived from courseCode prefix)
  // ✅ FIX #2: regex prefix + alias map so "SWEG 3101", "SE 201", and "SWE 301"
  // all land in ONE "Software Engineering" card. Unknown prefixes → "General".
  const departments = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        passRate: number;
        count: number;
        avgGrade: number;
        color: string;
        accent: string;
        atRiskStudentIds: Set<string>;
      }
    > = {};

    // Canonical department display names, keyed by canonical prefix.
    const deptNames: Record<string, string> = {
      SWE: "Software Engineering",
      CS: "Computer Science",
      IT: "Information Technology",
      IS: "Information Systems",
      GENERAL: "General",
    };

    // Canonical colors, keyed by canonical prefix.
    const deptColors: Record<string, { bg: string; accent: string }> = {
      SWE: { bg: "bg-blue-600", accent: "from-blue-500 to-indigo-600" },
      CS: { bg: "bg-emerald-600", accent: "from-emerald-500 to-teal-600" },
      IT: { bg: "bg-amber-600", accent: "from-amber-500 to-orange-600" },
      IS: { bg: "bg-purple-600", accent: "from-purple-500 to-pink-600" },
      GENERAL: { bg: "bg-slate-600", accent: "from-slate-500 to-slate-700" },
    };

    // Alias map: raw prefix → canonical prefix.
    // Add new aliases here as the curriculum grows.
    const deptAliases: Record<string, string> = {
      SWE: "SWE",
      SE: "SWE",
      SWEG: "SWE",
      CS: "CS",
      COSC: "CS",
      CSE: "CS",
      COMP: "CS",
      IT: "IT",
      ITEC: "IT",
      IS: "IS",
      INFO: "IS",
    };

    // Extract alphabetic prefix from a course code ("SWEG 3101" → "SWEG").
    const extractPrefix = (courseCode: string): string => {
      const match = courseCode.trim().toUpperCase().match(/^[A-Z]+/);
      return match ? match[0] : "";
    };

    grades.forEach((g) => {
      const rawPrefix = extractPrefix(g.courseCode || "");
      const key = deptAliases[rawPrefix] ?? "GENERAL";

      if (!map[key]) {
        const colors = deptColors[key] ?? deptColors.GENERAL;
        map[key] = {
          name: deptNames[key] ?? `Department ${key}`,
          passRate: 0,
          count: 0,
          avgGrade: 0,
          color: colors.bg,
          accent: colors.accent,
          atRiskStudentIds: new Set<string>(),
        };
      }

      const tg = g.totalGrade ?? 0;
      const sid = String(g.studentId ?? "").replace(/^U_/, "").trim();

      map[key].count += 1;
      map[key].avgGrade += tg;
      if (tg >= 50) map[key].passRate += 1;
      if (tg < 50 && sid) map[key].atRiskStudentIds.add(sid);
    });

    return Object.values(map)
      .map((d) => ({
        name: d.name,
        passRate: d.count > 0 ? (d.passRate / d.count) * 100 : 0,
        count: d.count,
        avgGrade: d.count > 0 ? d.avgGrade / d.count : 0,
        color: d.color,
        accent: d.accent,
        atRiskStudents: d.atRiskStudentIds.size,
      }))
      .sort((a, b) => b.passRate - a.passRate);
  }, [grades]);

  const topInstructors = useMemo(() => {
    const instructors = allUsers.filter((u) => u.role === "INSTRUCTOR");
    return instructors
      .map((inst) => {
        const instEvals = evaluations.filter(
          (e) => String(e.instructorId) === String(inst.id).replace(/^U_/, "")
        );
        // ✅ FIX #3: same valid-only averaging for each instructor.
        const validInstRatings = instEvals
          .map((e: any) => {
            const raw =
              e?.ratings?.overallRating ?? e?.overall_rating ?? e?.overallRating ?? null;
            if (raw == null) return null;
            const n = Number(raw);
            return Number.isFinite(n) && n > 0 ? n : null;
          })
          .filter((v): v is number => v != null);
        const avg =
          validInstRatings.length > 0
            ? validInstRatings.reduce((sum, v) => sum + v, 0) /
              validInstRatings.length
            : null;
        const load = courses.filter(
          (c) => String(c.instructorId) === String(inst.id).replace(/^U_/, "")
        ).length;
        return { inst, avg, count: instEvals.length, load };
      })
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  }, [allUsers, evaluations, courses]);

  // ✅ STEP 7: filter + sort faculty rows for the Faculty tab.
  const filteredFaculty = useMemo(() => {
    const q = facultySearch.trim().toLowerCase();

    const ratingBand = (avg: number | null): "excellent" | "good" | "ok" | "review" | "nodata" => {
      if (avg == null) return "nodata";
      if (avg >= 4.5) return "excellent";
      if (avg >= 3.5) return "good";
      if (avg >= 2.5) return "ok";
      return "review";
    };

    const rows = topInstructors.filter(({ inst, avg }) => {
      if (q) {
        const nameMatch = inst.fullName.toLowerCase().includes(q);
        const specMatch = (inst.specialization ?? "").toLowerCase().includes(q);
        if (!nameMatch && !specMatch) return false;
      }
      if (facultyBand !== "all" && ratingBand(avg) !== facultyBand) return false;
      return true;
    });

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (facultySort === "name") cmp = a.inst.fullName.localeCompare(b.inst.fullName);
      else if (facultySort === "load") cmp = a.load - b.load;
      else if (facultySort === "count") cmp = a.count - b.count;
      else cmp = (a.avg ?? -1) - (b.avg ?? -1);
      return facultySortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [topInstructors, facultySearch, facultyBand, facultySort, facultySortDir]);

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
      // ✅ FIX #5: toast instead of alert().
      setToast({ kind: "error", message: "Failed to generate report." });
    } finally {
      setGeneratingReport(false);
    }
  };

  const buildReport = () => {
    const lines: string[] = [];
    const now = new Date().toLocaleString();

    // ✅ FIX #4: derive academic year + semester from the current date.
    // Sep–Jan = Semester I, Feb–Jun = Semester II, Jul–Aug = Summer.
    // Academic year = Sep 1 → Aug 31.
    const _now = new Date();
    const _year = _now.getFullYear();
    const _month = _now.getMonth(); // 0 = Jan
    const _startYear = _month >= 8 ? _year : _year - 1;
    const _endYear = _startYear + 1;
    const _semester =
      _month >= 8 || _month === 0
        ? "Semester I"
        : _month >= 1 && _month <= 5
        ? "Semester II"
        : "Summer";
    const academicYearLabel = `${_startYear}/${_endYear}`;

    lines.push("=".repeat(70));
    lines.push("  MEKDELA AMBA UNIVERSITY");
    lines.push("  College of Informatics & Mathematical Sciences");
    lines.push("  OFFICIAL COLLEGE ANNUAL REPORT");
    lines.push("=".repeat(70));
    lines.push("");
    lines.push(`Generated: ${now}`);
    lines.push(`Prepared by: ${user.fullName} (College Dean)`);
    lines.push(`Academic Year: ${academicYearLabel} • ${_semester}`);
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
    lines.push(`  At-Risk Students .............. ${stats.atRiskStudents}`);
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

  // ✅ STEP 8: download any text/mime as a file.
  const downloadFile = (
    filename: string,
    content: string,
    mime: string = "text/plain;charset=utf-8"
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ✅ STEP 8: build CSV for departments.
  const buildDepartmentsCSV = (): string => {
    const header = [
      "Rank",
      "Department",
      "Pass Rate (%)",
      "Avg Grade (%)",
      "Records",
      "At-Risk Students",
    ];
    const rows = departments.map((d, i) => [
      String(i + 1),
      d.name,
      d.passRate.toFixed(1),
      d.avgGrade.toFixed(1),
      String(d.count),
      String(d.atRiskStudents),
    ]);
    const escape = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    return [header, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
  };

  // ✅ STEP 8: build CSV for faculty.
  const buildFacultyCSV = (): string => {
    const header = [
      "Instructor",
      "Specialization",
      "Courses",
      "Evaluations",
      "Avg Rating",
      "Standing",
    ];
    const rows = topInstructors.map((t) => {
      const avg = t.avg != null ? t.avg.toFixed(2) : "";
      const standing =
        t.avg == null
          ? "NO DATA"
          : t.avg >= 4.5
          ? "EXCELLENT"
          : t.avg >= 3.5
          ? "GOOD"
          : t.avg >= 2.5
          ? "OK"
          : "REVIEW";
      return [
        t.inst.fullName,
        t.inst.specialization ?? "",
        String(t.load),
        String(t.count),
        avg,
        standing,
      ];
    });
    const escape = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    return [header, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
  };

  // ✅ STEP 8: handle CSV download + audit.
  const handleDownloadCSV = async (kind: "departments" | "faculty") => {
    try {
      const csv = kind === "departments" ? buildDepartmentsCSV() : buildFacultyCSV();
      const date = new Date().toISOString().split("T")[0];
      const filename = `MAU_College_${kind === "departments" ? "Departments" : "Faculty"}_${date}.csv`;
      downloadFile(filename, csv, "text/csv;charset=utf-8");
      try {
        await CampusDatabase.addAuditLog(
          user.id,
          user.fullName,
          "DEAN",
          `Download ${kind === "departments" ? "Departments" : "Faculty"} CSV`,
          "Report",
          `${kind}-${date}`,
          `Downloaded ${kind} CSV export`
        );
      } catch {
        // Audit failure shouldn't block the download.
      }
      setToast({ kind: "success", message: `${kind === "departments" ? "Departments" : "Faculty"} CSV downloaded.` });
    } catch (err) {
      console.error(err);
      setToast({ kind: "error", message: "Failed to export CSV." });
    }
  };

  // ✅ STEP 8: print / Save as PDF via window.print().
  const handlePrint = () => {
    window.print();
    setToast({ kind: "info", message: "Print dialog opened — choose “Save as PDF” to export." });
  };

  // (recentDownloads state + effect moved to top of component — see Step 8)

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

      {/* ✅ FIX #5: error banner with Retry */}
      {error && (
        <div
          role="alert"
          className="sticky top-0 z-40 bg-red-50 border-b border-red-200 px-4 sm:px-6 md:px-8 py-3 flex items-start space-x-3"
        >
          <div className="flex-1 text-sm text-red-800">
            <strong className="font-bold">Could not load data.</strong>{" "}
            <span className="text-red-700">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            aria-current={activeTab === id ? "page" : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
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

                <div className="self-start flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={loadData}
                      disabled={loading}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      <span>{loading ? "Syncing…" : "Sync Data"}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setCommandOpen(true)}
                      aria-label="Open command palette"
                      className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                    >
                      <span className="font-mono text-[11px] opacity-80">⌘K</span>
                    </button>
                  </div>
                  {lastSynced && (
                    <p className="text-[11px] font-mono text-slate-400">
                      Last synced:{" "}
                      {lastSynced.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
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
                      Ranked by pass rate. Click a card to see at-risk students.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((d, i) => {
                      // ✅ FIX #6/2B: rank = position in sorted list (1-based).
                      const rank = i + 1;
                      const rankBadge =
                        rank === 1
                          ? "bg-amber-400 text-amber-950"
                          : rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : rank === 3
                          ? "bg-orange-400 text-orange-950"
                          : "bg-slate-100 text-slate-500";

                      return (
                        <motion.button
                          key={d.name}
                          type="button"
                          onClick={() => setSelectedDept(d.name)}
                          aria-label={`Open details for ${d.name}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -3 }}
                          className="relative text-left bg-white rounded-2xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition p-6 space-y-4 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <div
                            className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${d.accent}`}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 min-w-0">
                              {/* ✅ FIX #6/2B: rank badge */}
                              <span
                                className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${rankBadge}`}
                                aria-label={`Rank ${rank}`}
                              >
                                #{rank}
                              </span>
                              <div className="min-w-0">
                                <h3 className="font-display font-bold text-slate-900 truncate">
                                  {d.name}
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {d.count} grade record{d.count !== 1 ? "s" : ""}
                                </p>
                              </div>
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

                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                AVG
                              </span>
                              <strong className="block text-base text-slate-800 mt-0.5">
                                {d.avgGrade.toFixed(1)}%
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                RECORDS
                              </span>
                              <strong className="block text-base text-slate-800 mt-0.5">
                                {d.count}
                              </strong>
                            </div>
                            {/* ✅ FIX #6/2B: at-risk count now visible */}
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                              <span className="block text-[10px] font-mono text-red-500 uppercase">
                                AT-RISK
                              </span>
                              <strong className="block text-base text-red-800 mt-0.5">
                                {d.atRiskStudents}
                              </strong>
                            </div>
                          </div>

                          <div className="pt-1 text-[11px] font-bold text-primary flex items-center space-x-1">
                            <span>View details</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </motion.button>
                      );
                    })}
                    {departments.length === 0 && (
                      <div className="col-span-full text-center py-16 text-slate-400 text-sm">
                        No departmental data available yet.
                      </div>
                    )}
                  </div>

                  {/* ✅ FIX #6/2B: slide-over drawer */}
                  <AnimatePresence>
                    {selectedDept && (() => {
                      const dept = departments.find((x) => x.name === selectedDept);
                      if (!dept) return null;
                      return (
                        <div className="fixed inset-0 z-50">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDept(null)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                          />
                          <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${dept.name} details`}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
                          >
                            <div className="p-5 border-b border-slate-200 flex items-start justify-between">
                              <div>
                                <h3 className="font-display font-bold text-slate-900 text-lg">
                                  {dept.name}
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {dept.count} grade record{dept.count !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedDept(null)}
                                aria-label="Close details"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                    Pass Rate
                                  </span>
                                  <strong className="block text-lg text-slate-800 mt-0.5">
                                    {dept.passRate.toFixed(1)}%
                                  </strong>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                    Average Grade
                                  </span>
                                  <strong className="block text-lg text-slate-800 mt-0.5">
                                    {dept.avgGrade.toFixed(1)}%
                                  </strong>
                                </div>
                              </div>

                              <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-1">
                                <span className="block text-[10px] font-mono text-red-500 uppercase">
                                  At-Risk Students
                                </span>
                                <strong className="block text-2xl text-red-800">
                                  {dept.atRiskStudents}
                                </strong>
                                <p className="text-[11px] text-red-700">
                                  Distinct students with at least one grade below 50 in this department.
                                </p>
                              </div>

                              {/* Names are hidden behind "View list" per the brief. */}
                              <details className="rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="px-4 py-3 cursor-pointer bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 transition list-none">
                                  View list of at-risk students
                                </summary>
                                <div className="p-4 text-sm text-slate-600">
                                  <p className="text-[11px] text-slate-400 italic">
                                    Hidden by default to protect student privacy. Enable
                                    the “View list” action once you have a
                                    <code className="mx-1 px-1 bg-slate-100 rounded font-mono">studentId → fullName</code>
                                    resolver in place.
                                  </p>
                                </div>
                              </details>

                              <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  Records
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {dept.count} grade{dept.count !== 1 ? "s" : ""} across{" "}
                                  {dept.count} enrollment{dept.count !== 1 ? "s" : ""}.
                                </p>
                              </div>
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => setSelectedDept(null)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                Close
                              </button>
                            </div>
                          </motion.aside>
                        </div>
                      );
                    })()}
                  </AnimatePresence>
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
                      Search, sort, filter by rating band. Click a row for details.
                    </p>
                  </div>

                  {/* ✅ STEP 7: search + band filter row */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="search"
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                        placeholder="Search instructor name or specialization…"
                        aria-label="Search faculty"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      />
                    </div>
                    <select
                      value={facultyBand}
                      onChange={(e) => setFacultyBand(e.target.value as typeof facultyBand)}
                      aria-label="Filter by rating band"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <option value="all">All ratings</option>
                      <option value="excellent">Excellent (≥ 4.5)</option>
                      <option value="good">Good (3.5–4.49)</option>
                      <option value="ok">OK (2.5–3.49)</option>
                      <option value="review">Review (&lt; 2.5)</option>
                      <option value="nodata">No data</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[720px]">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            <th
                              className="px-6 py-4 cursor-pointer select-none hover:text-slate-800"
                              onClick={() => {
                                if (facultySort === "name") {
                                  setFacultySortDir(facultySortDir === "asc" ? "desc" : "asc");
                                } else {
                                  setFacultySort("name");
                                  setFacultySortDir("asc");
                                }
                              }}
                              aria-sort={
                                facultySort === "name"
                                  ? facultySortDir === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                              }
                            >
                              Instructor {facultySort === "name" && (facultySortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th
                              className="px-6 py-4 text-center cursor-pointer select-none hover:text-slate-800"
                              onClick={() => {
                                if (facultySort === "load") {
                                  setFacultySortDir(facultySortDir === "asc" ? "desc" : "asc");
                                } else {
                                  setFacultySort("load");
                                  setFacultySortDir("desc");
                                }
                              }}
                            >
                              Courses {facultySort === "load" && (facultySortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th
                              className="px-6 py-4 text-center cursor-pointer select-none hover:text-slate-800"
                              onClick={() => {
                                if (facultySort === "count") {
                                  setFacultySortDir(facultySortDir === "asc" ? "desc" : "asc");
                                } else {
                                  setFacultySort("count");
                                  setFacultySortDir("desc");
                                }
                              }}
                            >
                              Evals {facultySort === "count" && (facultySortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th
                              className="px-6 py-4 text-center cursor-pointer select-none hover:text-slate-800"
                              onClick={() => {
                                if (facultySort === "avg") {
                                  setFacultySortDir(facultySortDir === "asc" ? "desc" : "asc");
                                } else {
                                  setFacultySort("avg");
                                  setFacultySortDir("desc");
                                }
                              }}
                            >
                              Rating {facultySort === "avg" && (facultySortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-6 py-4 text-center">Ring</th>
                            <th className="px-6 py-4 text-center">Standing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredFaculty.map(({ inst, avg, count, load }) => (
                            <tr
                              key={inst.id}
                              onClick={() => setSelectedInstructor(inst.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedInstructor(inst.id);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`Open details for ${inst.fullName}`}
                              className="hover:bg-slate-50/60 transition cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                            >
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
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  <RatingRing avg={avg} />
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <RatingBadge average={avg} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredFaculty.length === 0 && (
                      <div className="text-center py-16 text-slate-400 text-sm">
                        {topInstructors.length === 0
                          ? "No faculty records yet."
                          : "No faculty match your search / filter."}
                      </div>
                    )}
                  </div>

                  {/* ✅ STEP 7: instructor detail drawer */}
                  <AnimatePresence>
                    {selectedInstructor && (() => {
                      const row = topInstructors.find((r) => r.inst.id === selectedInstructor);
                      if (!row) return null;
                      const instCourses = courses.filter(
                        (c) =>
                          String(c.instructorId).replace(/^U_/, "") ===
                          String(row.inst.id).replace(/^U_/, "")
                      );
                      return (
                        <div className="fixed inset-0 z-50">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInstructor(null)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                          />
                          <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${row.inst.fullName} details`}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
                          >
                            <div className="p-5 border-b border-slate-200 flex items-start justify-between">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                  {row.inst.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-display font-bold text-slate-900 truncate">
                                    {row.inst.fullName}
                                  </h3>
                                  <p className="text-[11px] font-mono text-slate-400">
                                    {row.inst.specialization || "Faculty"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedInstructor(null)}
                                aria-label="Close details"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                  <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                    Rating
                                  </span>
                                  <strong className="block text-base text-slate-800 mt-0.5">
                                    {row.avg != null ? row.avg.toFixed(2) : "—"}
                                  </strong>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                  <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                    Evals
                                  </span>
                                  <strong className="block text-base text-slate-800 mt-0.5">
                                    {row.count}
                                  </strong>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                  <span className="block text-[10px] font-mono text-slate-400 uppercase">
                                    Courses
                                  </span>
                                  <strong className="block text-base text-slate-800 mt-0.5">
                                    {row.load}
                                  </strong>
                                </div>
                              </div>

                              <div className="flex justify-center py-2">
                                <RatingRing avg={row.avg} size={88} />
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  Courses Taught
                                </h4>
                                {instCourses.length === 0 ? (
                                  <p className="text-sm text-slate-400">No courses assigned.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {instCourses.map((c) => (
                                      <li
                                        key={c.id}
                                        className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm"
                                      >
                                        <span className="font-mono text-slate-500 mr-2">
                                          {c.courseCode}
                                        </span>
                                        <span className="text-slate-800">
                                          {c.courseTitle}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  Rating History
                                </h4>
                                <p className="text-[11px] text-slate-400 italic">
                                  TODO: rating history requires per-semester evaluations.
                                  Currently only a current-snapshot average is available.
                                </p>
                              </div>
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => setSelectedInstructor(null)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                Close
                              </button>
                            </div>
                          </motion.aside>
                        </div>
                      );
                    })()}
                  </AnimatePresence>
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
                      Download .txt, .csv, or print to PDF — signed and ready for senate review
                    </p>
                  </div>

                  {/* ✅ STEP 8: main report card + preview + actions */}
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
                      </div>
                    </div>

                    {/* ✅ STEP 8: preview panel */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Preview
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Generated live
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            STUDENTS
                          </span>
                          <strong className="block text-base mt-0.5">
                            {stats.students}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            FACULTY
                          </span>
                          <strong className="block text-base mt-0.5">
                            {stats.instructors}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            PASS RATE
                          </span>
                          <strong className="block text-base mt-0.5">
                            {stats.passRate.toFixed(1)}%
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            DEPARTMENTS
                          </span>
                          <strong className="block text-base mt-0.5">
                            {departments.length}
                          </strong>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            DISTINCTIONS
                          </span>
                          <strong className="block text-base mt-0.5">
                            {stats.distinguished}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            AT-RISK STUDENTS
                          </span>
                          <strong className="block text-base mt-0.5 text-red-700">
                            {stats.atRiskStudents}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="block text-[10px] font-mono text-slate-400">
                            AVG RATING
                          </span>
                          <strong className="block text-base mt-0.5">
                            {stats.avgEval > 0 ? stats.avgEval.toFixed(2) : "—"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* ✅ STEP 8: all four actions */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleDownloadReport}
                          disabled={generatingReport}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                        >
                          {generatingReport ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Generating…</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Download .txt</span>
                            </>
                          )}
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => handleDownloadCSV("departments")}
                          className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center space-x-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <Download className="w-4 h-4" />
                          <span>Departments .csv</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadCSV("faculty")}
                          className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center space-x-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <Download className="w-4 h-4" />
                          <span>Faculty .csv</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePrint}
                          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center space-x-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Print / Save as PDF</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        All exports are audit-logged. Choose “Save as PDF” in the print dialog for a shareable document.
                      </p>
                    </div>
                  </div>

                  {/* ✅ STEP 8: recent downloads (best-effort, audit-log driven) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                    <h3 className="font-display font-bold text-slate-900">
                      Recent Downloads
                    </h3>
                    {recentDownloads.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No recent downloads on record.{" "}
                        <span className="text-[11px] italic">
                          TODO: wire to <code className="px-1 bg-slate-100 rounded font-mono">CampusDatabase.getAuditLogs</code> once available.
                        </span>
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {recentDownloads.map((d) => (
                          <li
                            key={d.id}
                            className="py-2.5 flex items-center justify-between text-sm"
                          >
                            <span className="text-slate-700">{d.label}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {d.timestamp}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
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
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      Broadcast Circulars
                    </h2>
                    <p className="text-sm text-slate-500">
                      Compose and broadcast college-wide announcements. Sent history is kept
                      for this session.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* ✅ STEP 9: composer */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Radio className="w-5 h-5 text-red-500" />
                        <h3 className="font-display font-bold text-slate-900">Compose</h3>
                      </div>

                      <div>
                        <label
                          htmlFor="alert-title"
                          className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                        >
                          Title
                        </label>
                        <input
                          id="alert-title"
                          type="text"
                          value={alertTitle}
                          onChange={(e) => setAlertTitle(e.target.value)}
                          maxLength={120}
                          placeholder="e.g. End-of-semester exam schedule published"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        />
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {alertTitle.length} / 120
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="alert-message"
                          className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                        >
                          Message
                        </label>
                        <textarea
                          id="alert-message"
                          value={alertMessage}
                          onChange={(e) => setAlertMessage(e.target.value)}
                          maxLength={500}
                          rows={4}
                          placeholder="Write the announcement body…"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 resize-y"
                        />
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {alertMessage.length} / 500
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="alert-audience"
                            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                          >
                            Audience
                          </label>
                          <select
                            id="alert-audience"
                            value={alertAudience}
                            onChange={(e) =>
                              setAlertAudience(e.target.value as typeof alertAudience)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          >
                            <option value="ALL">Everyone</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="STUDENTS">Students</option>
                            <option value="STAFF">Staff</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="alert-priority"
                            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                          >
                            Priority
                          </label>
                          <select
                            id="alert-priority"
                            value={alertPriority}
                            onChange={(e) =>
                              setAlertPriority(e.target.value as typeof alertPriority)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          >
                            <option value="NORMAL">Normal</option>
                            <option value="IMPORTANT">Important</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          alertSending ||
                          alertTitle.trim().length === 0 ||
                          alertMessage.trim().length === 0
                        }
                        onClick={async () => {
                          if (
                            alertTitle.trim().length === 0 ||
                            alertMessage.trim().length === 0
                          )
                            return;
                          setAlertSending(true);
                          try {
                            // ✅ STEP 1 (Fix C): be honest about what actually happened.
                            // Only claim "broadcast" if the backend method exists AND succeeded.
                            const db = CampusDatabase as any;
                            let wasSent = false;
                            if (typeof db.sendAlert === "function") {
                              await db.sendAlert({
                                title: alertTitle.trim(),
                                message: alertMessage.trim(),
                                targetAudience: alertAudience,
                                severity: alertPriority,
                                senderName: user.fullName,
                              });
                              wasSent = true;
                            } else {
                              // Backend not connected — record as DRAFT, not SENT.
                              await new Promise((r) => setTimeout(r, 300));
                            }
                            setSentAlerts((prev) => [
                              {
                                id: `A_${Date.now()}`,
                                title: alertTitle.trim(),
                                message: alertMessage.trim(),
                                audience: alertAudience,
                                priority: alertPriority,
                                sentAt: new Date().toISOString(),
                                status: wasSent ? "SENT" : "DRAFT",
                              },
                              ...prev,
                            ]);
                            setToast({
                              kind: wasSent ? "success" : "info",
                              message: wasSent
                                ? "Announcement broadcast."
                                : "Saved as draft only. Broadcast service is not connected.",
                            });
                            setAlertTitle("");
                            setAlertMessage("");
                            setAlertAudience("ALL");
                            setAlertPriority("NORMAL");
                          } catch (err) {
                            console.error(err);
                            setToast({
                              kind: "error",
                              message: "Failed to broadcast announcement.",
                            });
                          } finally {
                            setAlertSending(false);
                          }
                        }}
                        className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        {alertSending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending…</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4" />
                            <span>Broadcast Announcement</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* ✅ STEP 9: preview card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900">Preview</h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          Live
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl border p-5 space-y-2 ${
                          alertPriority === "URGENT"
                            ? "bg-red-50 border-red-200"
                            : alertPriority === "IMPORTANT"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                              alertPriority === "URGENT"
                                ? "bg-red-600 text-white"
                                : alertPriority === "IMPORTANT"
                                ? "bg-amber-500 text-white"
                                : "bg-slate-600 text-white"
                            }`}
                          >
                            {alertPriority}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            To: {alertAudience}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-slate-900 text-base">
                          {alertTitle.trim() || "Untitled announcement"}
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {alertMessage.trim() ||
                            "Your message will appear here as you type."}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/70">
                          From: {user.fullName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ STEP 9: sent history */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-slate-900">
                        Sent History
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {sentAlerts.filter((a) => a.status === "SENT").length} sent •{" "}
                        {sentAlerts.filter((a) => a.status === "DRAFT").length} draft
                      </span>
                    </div>
                    {sentAlerts.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No announcements sent yet. Compose one above to start.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {sentAlerts.map((a) => (
                          <li key={a.id} className="py-3 space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-slate-800 truncate">
                                {a.title}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                                {new Date(a.sentAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] font-mono">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  a.status === "SENT"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {a.status}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {a.audience}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  a.priority === "URGENT"
                                    ? "bg-red-100 text-red-700"
                                    : a.priority === "IMPORTANT"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {a.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {a.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ✅ FIX #5: toast — replaces alert() */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className={`fixed bottom-6 right-6 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-2xl border flex items-start space-x-3 ${
              toast.kind === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : toast.kind === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded hover:bg-black/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ STEP 10: Command Palette (Cmd/Ctrl+K) */}
      <AnimatePresence>
        {commandOpen && (
          <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[12vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setCommandOpen(false);
                setCommandQuery("");
              }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-3 border-b border-slate-200">
                <input
                  autoFocus
                  type="text"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Jump to a section…"
                  aria-label="Search sections"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                />
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {[...navItems, ...smartItems]
                  .filter((item) =>
                    item.label
                      .toLowerCase()
                      .includes(commandQuery.trim().toLowerCase())
                  )
                  .map(({ id, label, Icon }) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(id);
                          setIsMobileNavOpen(false);
                          setCommandOpen(false);
                          setCommandQuery("");
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-left transition focus:outline-none focus-visible:bg-slate-50"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-slate-800">{label}</span>
                      </button>
                    </li>
                  ))}
                {[...navItems, ...smartItems].filter((item) =>
                  item.label.toLowerCase().includes(commandQuery.trim().toLowerCase())
                ).length === 0 && (
                  <li className="px-4 py-3 text-sm text-slate-400">
                    No matches.
                  </li>
                )}
              </ul>
              <div className="px-4 py-2 border-t border-slate-200 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Enter to jump • Esc to close</span>
                <span className="opacity-70">⌘K</span>
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

// ✅ STEP 7: mini SVG progress ring for instructor rating (0–5 scale).
function RatingRing({
  avg,
  size = 40,
}: {
  avg: number | null;
  size?: number;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = avg != null ? Math.max(0, Math.min(1, avg / 5)) : 0;
  const dashOffset = circumference * (1 - pct);

  const color =
    avg == null
      ? "#cbd5e1" // slate-300
      : avg >= 4.5
      ? "#10b981" // emerald-500
      : avg >= 3.5
      ? "#3b82f6" // blue-500
      : avg >= 2.5
      ? "#f59e0b" // amber-500
      : "#ef4444"; // red-500

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Rating ${avg != null ? avg.toFixed(2) : "not rated"} of 5`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-[10px] font-mono font-bold"
        style={{ color: avg == null ? "#94a3b8" : "#0f172a" }}
      >
        {avg != null ? avg.toFixed(1) : "—"}
      </span>
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