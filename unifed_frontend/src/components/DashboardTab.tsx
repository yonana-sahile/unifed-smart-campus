// src/components/DashboardTab.tsx
import { motion } from "motion/react";
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  Video,
  AlertCircle,
  FileText,
  TrendingUp,
} from "lucide-react";
import type { Course, Grade, Exam, Submission, AttendanceRecord } from "../types";

interface DashboardTabProps {
  user: { fullName: string; department?: string };
  courses: Course[];
  grades: Grade[];
  exams: Exam[];
  submissions: Submission[];
  attendanceRecords: any[];
  liveExamCount: number;
  onGoToTab: (tab: "materials" | "exams" | "grades" | "attendance" | "zoom" | "assignments") => void;
}

export function DashboardTab({
  user,
  courses,
  grades,
  exams,
  submissions,
  attendanceRecords,
  liveExamCount,
  onGoToTab,
}: DashboardTabProps) {
  // ─────────────────────────────────────────────────────────
  // Derived stats — computed from real data, no hardcoding
  // ─────────────────────────────────────────────────────────
  const totalStudents = attendanceRecords.length;

  const pendingGrades = grades.filter((g) => g.status === "CALCULATED").length;

  const upcomingExams = exams.filter((e) => {
    if (!e.isPushed && e.status !== "ACTIVE" && e.status !== "SCHEDULED") return false;
    return true;
  }).length;

  const pendingSubmissions = submissions.filter((s) => s.status !== "GRADED").length;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      label: "Courses",
      sublabel: "Assigned",
      value: courses.length,
      icon: BookOpen,
      accent: "text-blue-600 bg-blue-50 border-blue-200",
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Students",
      sublabel: "Enrolled",
      value: totalStudents,
      icon: Users,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
      onClick: undefined,
    },
    {
      label: "Pending",
      sublabel: "Grades",
      value: pendingGrades,
      icon: Clock,
      accent: "text-amber-600 bg-amber-50 border-amber-200",
      onClick: () => onGoToTab("grades"),
    },
    {
      label: "Upcoming",
      sublabel: "Exams",
      value: upcomingExams,
      icon: Calendar,
      accent: "text-rose-600 bg-rose-50 border-rose-200",
      onClick: () => onGoToTab("exams"),
    },
  ];

  // ─────────────────────────────────────────────────────────
  // Action Center items — derived from real state
  // ─────────────────────────────────────────────────────────
  const actionItems: {
    id: string;
    icon: React.ElementType;
    label: string;
    count: number;
    ctaLabel: string;
    ctaTab: "grades" | "assignments" | "attendance" | "exams";
    severity: "warning" | "info";
  }[] = [];

  if (pendingGrades > 0) {
    actionItems.push({
      id: "grades",
      icon: AlertCircle,
      label: "grades to submit to Registrar",
      count: pendingGrades,
      ctaLabel: "Review grades",
      ctaTab: "grades",
      severity: "warning",
    });
  }

  if (pendingSubmissions > 0) {
    actionItems.push({
      id: "submissions",
      icon: FileText,
      label: "submissions awaiting grading",
      count: pendingSubmissions,
      ctaLabel: "Grade submissions",
      ctaTab: "assignments",
      severity: "info",
    });
  }

  const belowMinCount = attendanceRecords.filter(
    (a) => a.attendancePercentage < 80
  ).length;

  if (belowMinCount > 0) {
    actionItems.push({
      id: "attendance",
      icon: AlertCircle,
      label: "students below 80% attendance",
      count: belowMinCount,
      ctaLabel: "Review attendance",
      ctaTab: "attendance",
      severity: "warning",
    });
  }

  if (liveExamCount > 0) {
    actionItems.push({
      id: "live-exams",
      icon: TrendingUp,
      label: "live exams open to students",
      count: liveExamCount,
      ctaLabel: "Manage exams",
      ctaTab: "exams",
      severity: "info",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
      key="instructor-dashboard-tab"
    >
      {/* ──────── 1. Greeting Header ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            {greeting}, {user.fullName.split(" ").slice(-1)[0] || user.fullName} 👋
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Your teaching overview and academic priorities for today.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-mono text-slate-500">{dayName}</p>
          <p className="text-sm font-semibold text-slate-700">{dateStr}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            AY 2025/2026 • Semester II
          </p>
        </div>
      </div>

      {/* ──────── 2. Stat Cards ──────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs transition ${
              stat.onClick
                ? "cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  {stat.sublabel}
                </span>
                <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-0.5 tabular-nums">
                  {stat.value}
                </div>
                <span className="text-xs font-semibold text-slate-600">{stat.label}</span>
              </div>
              <div
                className={`p-2 rounded-xl border ${stat.accent} shrink-0`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ──────── 3. Two-column: Courses + Action Center ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Courses */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>My Assigned Courses</span>
            </h2>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
              {courses.length} active
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-200" />
              <p className="text-xs">No courses assigned yet.</p>
              <p className="text-[10px] font-mono">
                Contact your department head to be added to a course.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const courseGrades = grades.filter(
                  (g) => String(g.courseId) === String(course.id)
                );
                const courseExams = exams.filter(
                  (e) => String(e.courseId) === String(course.id)
                );
                const courseStudents = attendanceRecords.filter(
                  (a) => String(a.courseId) === String(course.id)
                );

                const nextExam = courseExams
                  .filter((e) => new Date(e.examDate) > new Date())
                  .sort(
                    (a, b) =>
                      new Date(a.examDate).getTime() -
                      new Date(b.examDate).getTime()
                  )[0];

                return (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {course.courseCode || "COURSE"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {courseStudents.length} students
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-slate-800 text-sm truncate">
                          {course.courseTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {nextExam
                            ? `Next: ${nextExam.examTitle} on ${new Date(
                                nextExam.examDate
                              ).toLocaleDateString()}`
                            : courseExams.length > 0
                            ? `${courseExams.length} exam(s) authored`
                            : "No exams scheduled yet"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onGoToTab("materials")}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center space-x-1 transition shrink-0 cursor-pointer"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="text-center">
                        <div className="text-sm font-display font-bold text-slate-800 tabular-nums">
                          {courseGrades.length}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Grades
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-display font-bold text-slate-800 tabular-nums">
                          {courseExams.length}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Exams
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-display font-bold text-slate-800 tabular-nums">
                          {
                            courseGrades.filter(
                              (g) => g.status === "CALCULATED"
                            ).length
                          }
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Pending
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Center */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Action Center</span>
            </h2>
          </div>

          {actionItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                All caught up!
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                No pending actions right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition ${
                    item.severity === "warning"
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-blue-50/50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <item.icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        item.severity === "warning"
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        <span className="font-display font-bold text-base tabular-nums">
                          {item.count}
                        </span>{" "}
                        {item.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => onGoToTab(item.ctaTab)}
                        className={`mt-1.5 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                          item.severity === "warning"
                            ? "text-amber-700 hover:text-amber-800"
                            : "text-blue-700 hover:text-blue-800"
                        }`}
                      >
                        <span>{item.ctaLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──────── 4. Live Zoom Banner ──────── */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Video className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold font-mono text-emerald-400">
                MAU VIRTUAL CLASSROOM
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Online Zoom Teaching & Virtual Lectures
            </h3>
            <p className="text-xs text-blue-200">
              Start instant live classes, share slides, manage student chat &
              take attendance.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onGoToTab("zoom")}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Open Zoom Teaching Hub</span>
        </button>
      </div>
    </motion.div>
  );
}