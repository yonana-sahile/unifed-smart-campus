import { useState, useEffect, useCallback, FormEvent } from "react";
import type { User, Course, AttendanceRecord, AttendanceSession } from "../types";
import { CampusDatabase } from "../services/api";
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Radio,
  Users,
  Award,
  ArrowRight,
  X,
  Fingerprint,
} from "lucide-react";

interface StudentAttendanceCheckInProps {
  student: User;
  courses: Course[];
}

const errorMessage = (err: any) => {
  const data = err?.response?.data;
  if (!data) return err?.message || "Something went wrong.";
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? String(first[0]) : String(first);
};

const formatTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const secondsBetween = (target?: string) => {
  if (!target) return 0;
  const time = new Date(target).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.round((time - Date.now()) / 1000));
};

export function StudentAttendanceCheckIn({ student, courses }: StudentAttendanceCheckInProps) {
  const [code, setCode] = useState("");
  const [ledger, setLedger] = useState<AttendanceRecord[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const [records, active, sessions] = await Promise.allSettled([
        CampusDatabase.getAttendance(),
        CampusDatabase.getActiveAttendanceSessions(),
        CampusDatabase.getAttendanceSessions(),
      ]);

      setLedger(
        records.status === "fulfilled" && Array.isArray(records.value) ? records.value : []
      );
      setActiveSessions(
        active.status === "fulfilled" && Array.isArray(active.value) ? active.value : []
      );
      setHistory(
        sessions.status === "fulfilled" && Array.isArray(sessions.value)
          ? sessions.value.filter((s) => s.checkIns.some((c) => String(c.studentId) === String(student.id).replace(/\D/g, "")))
          : []
      );
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 20000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setError("Enter the full check-in code shown by your instructor.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const result = await CampusDatabase.checkInAttendance(cleaned);
      setSuccess(result.message || "Checked in successfully.");
      setCode("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalSessions = ledger.reduce((sum, row) => sum + row.totalSessions, 0);
  const attendedSessions = ledger.reduce((sum, row) => sum + row.attendedSessions, 0);
  const overallPercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  const atRisk = ledger.filter((row) => row.totalSessions > 0 && row.attendancePercentage < 80);

  const courseLabel = (courseId: string) => {
    const course = courses.find((c) => String(c.id) === String(courseId));
    return course?.courseTitle || "Course";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" /> Attendance Check-In
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            When your instructor opens a live window, enter the 6-character code shown in class.
            Your attendance ledger updates as soon as the instructor closes the session.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Check-in form */}
        <div className="lg:col-span-2 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Enter Check-In Code</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Shown by your instructor
                </p>
              </div>
            </div>

            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
                setError("");
              }}
              placeholder="ABC123"
              autoComplete="off"
              inputMode="text"
              className="mt-4 w-full rounded-xl border-2 border-slate-200 focus:border-primary px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.4em] text-slate-900 uppercase focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || code.trim().length < 4}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-bold py-3 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Checking in…" : "Check In"}
            </button>
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              Codes expire when the window closes. You can only check in once per session.
            </p>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" /> Open Windows
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {activeSessions.length} live
              </span>
            </div>
            {activeSessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No live attendance windows right now. Check back when class begins.
              </p>
            ) : (
              <div className="space-y-2">
                {activeSessions.map((session) => {
                  const remaining = secondsBetween(session.expiresAt);
                  const already = session.checkIns.some(
                    (c) => String(c.studentId) === String(student.id).replace(/\D/g, "")
                  );
                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {session.courseCode} · {session.title}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            {courseLabel(session.courseId)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 shrink-0">
                          <Clock className="w-3 h-3" />
                          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                        {already ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> You are checked in
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3 h-3" /> Ask your instructor for the code, then enter it above
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ledger */}
        <div className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Overall</span>
              <div
                className={`text-xl font-display font-bold mt-0.5 ${
                  overallPercentage >= 80 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {overallPercentage.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Attended</span>
              <div className="text-xl font-display font-bold text-slate-900 mt-0.5">
                {attendedSessions}
                <span className="text-xs text-slate-400 font-mono">/{totalSessions}</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Courses</span>
              <div className="text-xl font-display font-bold text-slate-900 mt-0.5">{ledger.length}</div>
            </div>
          </div>

          {atRisk.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>{atRisk.length}</strong> course{atRisk.length === 1 ? "" : "s"} below the 80%
                minimum. Attend upcoming sessions to stay eligible for exams.
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" /> Attendance Ledger
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                80% minimum
              </span>
            </div>
            {loading ? (
              <p className="p-4 text-xs text-slate-400">Loading your attendance…</p>
            ) : ledger.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 italic">
                No attendance records yet. They appear after your first live session.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {ledger.map((row) => (
                  <div key={row.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {row.courseCode || "—"}{" "}
                          <span className="font-normal text-slate-500">· {courseLabel(row.courseId)}</span>
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {row.attendedSessions} of {row.totalSessions} sessions attended
                        </p>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold shrink-0 ${
                          row.attendancePercentage >= 80 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {row.attendancePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.attendancePercentage >= 80 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, row.attendancePercentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" /> My Check-In History
              </h3>
            </div>
            {history.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 italic">
                No check-ins recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {history.slice(0, 12).map((session) => {
                  const mine = session.checkIns.find(
                    (c) => String(c.studentId) === String(student.id).replace(/\D/g, "")
                  );
                  return (
                    <div key={session.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {session.courseCode} · {session.title}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {session.sessionDate} · {formatTime(mine?.checkedInAt)}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                          mine?.status === "LATE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {mine?.status || "PRESENT"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
