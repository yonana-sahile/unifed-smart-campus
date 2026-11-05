import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { User, Grade, SystemSettings } from "../types";

type Props = {
  user: User;
  students: User[];
  grades: Grade[];
  settings: SystemSettings | null;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
};

function daysUntil(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function RegistrarCommandCenter({
  user,
  students,
  grades,
  settings,
  loading,
  lastUpdated,
  onRefresh,
  onNavigate,
}: Props) {
  // ── All counts derived from existing data, nothing fake ──
  const stats = useMemo(() => {
    const total = students.length;
    const withFees = students.filter((s) => (s.outstandingFees ?? 0) > 0).length;
    const pendingGrades = grades.filter((g) => g.status === "SUBMITTED").length;
    const approved = grades.filter((g) => g.status === "APPROVED").length;
    const incomplete = students.filter(
      (s) => !s.studentId || !s.program || !s.email
    ).length;

    const byProgram = new Map<string, number>();
    for (const s of students) {
      if (s.program) byProgram.set(s.program, (byProgram.get(s.program) ?? 0) + 1);
    }
    const byYear = new Map<number, number>();
    for (const s of students) {
      if (s.academicYear)
        byYear.set(s.academicYear, (byYear.get(s.academicYear) ?? 0) + 1);
    }

    return { total, withFees, pendingGrades, approved, incomplete, byProgram, byYear };
  }, [students, grades]);

  // ── Deadlines from settings (registration_deadline + semester_end) ──
  const deadlines = useMemo(() => {
    const s: any = settings;
    if (!s) return [];
    const out: { label: string; date: Date }[] = [];
    const push = (label: string, raw: any) => {
      if (raw) out.push({ label, date: new Date(raw) });
    };
    push("Add / Drop Deadline", s.registration_deadline ?? s.registrationDeadline);
    push("Semester Ends", s.semester_end);
    return out
      .filter((d) => !Number.isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [settings]);

  const priorities = [
    {
      label: "Grades awaiting approval",
      count: stats.pendingGrades,
      tab: "grades",
      Icon: FileText,
    },
    {
      label: "Students with outstanding fees",
      count: stats.withFees,
      tab: "records",
      Icon: AlertCircle,
    },
    {
      label: "Incomplete student records",
      count: stats.incomplete,
      tab: "records",
      Icon: Users,
    },
  ].filter((p) => p.count > 0);

  const topPrograms = [...stats.byProgram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topYears = [...stats.byYear.entries()].sort((a, b) => a[0] - b[0]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.fullName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-[#071526] text-white">
        <div
          aria-hidden
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#c59b27]/10 blur-3xl pointer-events-none"
        />
        <div className="relative px-6 sm:px-9 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c59b27]/90 font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl leading-[1.1] mt-2 tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Here's what needs your attention today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Enrolled Students", value: stats.total, Icon: Users, tone: "text-slate-900" },
          { label: "Pending Grades", value: stats.pendingGrades, Icon: FileText, tone: "text-amber-600" },
          { label: "Approved Grades", value: stats.approved, Icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Fee Holds", value: stats.withFees, Icon: AlertCircle, tone: "text-red-600" },
        ].map(({ label, value, Icon, tone }) => (
          <div
            key={label}
            className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500">
                {label}
              </span>
              <Icon className={`w-4 h-4 ${tone}`} />
            </div>
            <p className={`font-display text-3xl leading-none tabular-nums ${tone}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* PRIORITIES + DEADLINES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display text-base text-slate-900">
              Today's Priorities
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {priorities.length} active
            </span>
          </div>
          {priorities.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">All clear</p>
              <p className="text-xs text-slate-500 mt-1">
                No pending work requires your attention.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {priorities.map(({ label, count, tab, Icon }) => (
                <button
                  key={label}
                  onClick={() => onNavigate(tab)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-900">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                      {count}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="font-display text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Deadlines
            </h3>
          </div>
          {deadlines.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-500">
              No deadlines configured.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deadlines.map(({ label, date }) => {
                const days = daysUntil(date);
                const tone =
                  days < 0
                    ? "text-slate-400"
                    : days < 3
                    ? "text-red-600"
                    : days < 7
                    ? "text-amber-600"
                    : "text-emerald-600";
                return (
                  <div key={label} className="px-5 py-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-slate-500">
                      {label}
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="font-mono text-xs text-slate-700">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p
                        className={`font-mono text-sm font-semibold tabular-nums ${tone}`}
                      >
                        {days < 0 ? "closed" : days === 0 ? "today" : `${days}d`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DISTRIBUTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DistributionCard
          title="Students by Program"
          rows={topPrograms.map(([k, v]) => ({ label: k, value: v }))}
          total={stats.total}
          onRowClick={() => onNavigate("records")}
        />
        <DistributionCard
          title="Students by Year"
          rows={topYears.map(([k, v]) => ({ label: `Year ${k}`, value: v }))}
          total={stats.total}
          onRowClick={() => onNavigate("records")}
        />
      </div>
    </motion.div>
  );
}

function DistributionCard({
  title,
  rows,
  total,
  onRowClick,
}: {
  title: string;
  rows: { label: string; value: number }[];
  total: number;
  onRowClick?: () => void;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200">
        <h3 className="font-display text-base text-slate-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-500">
          No data yet.
        </div>
      ) : (
        <div className="p-5 space-y-3">
          {rows.map(({ label, value }) => (
            <button
              key={label}
              onClick={onRowClick}
              className="w-full text-left group"
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 truncate">{label}</span>
                <span className="font-mono tabular-nums text-slate-500 shrink-0 ml-2">
                  {value} · {total ? Math.round((value / total) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c59b27] rounded-full transition-all group-hover:bg-[#a8811f]"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}