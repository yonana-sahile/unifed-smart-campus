import { useState, useEffect, useMemo, FormEvent } from "react";
import type { User, Course, AttendanceSession } from "../types";
import { CampusDatabase } from "../services/api";
import {
  Radio,
  Clock,
  Users,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  X,
  Timer,
} from "lucide-react";

interface InstructorAttendanceManagerProps {
  instructor: User;
  courses: Course[];
  selectedCourseId?: string;
  onAttendanceUpdated?: () => void;
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

const formatCountdown = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

const formatTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function InstructorAttendanceManager({
  instructor,
  courses,
  selectedCourseId,
  onAttendanceUpdated,
}: InstructorAttendanceManagerProps) {
  const myCourses = useMemo(
    () => courses.filter((c) => String(c.instructorId) === String(instructor.id)),
    [courses, instructor.id]
  );
  const availableCourses = myCourses.length > 0 ? myCourses : courses;

  const [courseId, setCourseId] = useState(selectedCourseId || availableCourses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(15);
  const [lateAfter, setLateAfter] = useState(10);

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (selectedCourseId) setCourseId(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    if (!courseId && availableCourses[0]?.id) setCourseId(availableCourses[0].id);
  }, [availableCourses, courseId]);

  useEffect(() => {
    loadSessions();
    const poll = setInterval(loadSessions, 15000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const loadSessions = async () => {
    try {
      const rows = await CampusDatabase.getAttendanceSessions();
      const list = Array.isArray(rows) ? rows : [];
      setSessions(list);
      const live = list.find((s) => s.status === "OPEN" && !isExpired(s)) ?? null;
      setActiveSession(live);
    } catch (err) {
      console.error("Failed to load attendance sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (session: AttendanceSession) => {
    if (session.status !== "OPEN") return true;
    const expires = new Date(session.expiresAt).getTime();
    return Number.isFinite(expires) ? expires <= now : session.secondsRemaining <= 0;
  };

  const secondsRemaining = (session: AttendanceSession) => {
    const expires = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expires)) return session.secondsRemaining;
    return Math.max(0, Math.round((expires - now) / 1000));
  };

  const handleOpen = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const course = availableCourses.find((c) => String(c.id) === String(courseId));
    if (!course) {
      setError("Choose a course before opening a session.");
      return;
    }

    setBusy(true);
    try {
      const opened = await CampusDatabase.openAttendanceSession({
        course: course.id,
        title: title.trim() || `Live Attendance — ${course.courseCode}`,
        topic: topic.trim(),
        location: location.trim(),
        duration_minutes: duration,
        late_after_minutes: lateAfter,
      });
      setActiveSession(opened);
      setSessions((prev) => [opened, ...prev.filter((s) => s.id !== opened.id)]);
      setNotice("Attendance window opened. Read the code aloud to your class.");
      setTitle("");
      setTopic("");
      setLocation("");
      onAttendanceUpdated?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async (session: AttendanceSession) => {
    if (!window.confirm("Close this attendance window and apply totals to the ledger?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const closed = await CampusDatabase.closeAttendanceSession(session.id);
      setSessions((prev) => prev.map((s) => (s.id === closed.id ? closed : s)));
      setActiveSession((prev) => (prev && prev.id === closed.id ? null : prev));
      setNotice(
        `Session closed. ${closed.checkedInCount} check-in${closed.checkedInCount === 1 ? "" : "s"} applied to the ledger.`
      );
      onAttendanceUpdated?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const recentSessions = sessions.slice(0, 8);
  const activeCourse = availableCourses.find((c) => String(c.id) === String(courseId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" /> Live Attendance Check-In
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Open a short-lived window, read the 6-character code to the class, and close it when
            you are done. The roster ledger updates automatically when a session closes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            loadSessions();
          }}
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

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Open a session */}
        <form
          onSubmit={handleOpen}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Play className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Open Check-In Window</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {activeCourse?.courseCode || "Select a course"}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Course</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select course…</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} — {course.courseTitle}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Session Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Live Attendance — ${activeCourse?.courseCode || "Session"}`}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Topic (optional)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Chapter 4 — Normalisation"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Location (optional)</span>
            <div className="relative mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Block B, Room 204"
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Window (min)</span>
              <input
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Late after (min)</span>
              <input
                type="number"
                min={0}
                max={duration}
                value={lateAfter}
                onChange={(e) => setLateAfter(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            {busy ? "Working…" : activeSession ? "Replace Active Window" : "Open Attendance"}
          </button>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Opening a new window automatically closes the previous open window for this course and
            locks its totals into the ledger.
          </p>
        </form>

        {/* Active session */}
        <div className="lg:col-span-3 space-y-5">
          {activeSession ? (
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live now
                  </span>
                  <h3 className="font-display font-bold text-slate-900 text-lg mt-2">
                    {activeSession.courseCode} · {activeSession.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSession.topic || activeSession.courseTitle}
                    {activeSession.location ? ` · ${activeSession.location}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <Timer className="w-3.5 h-3.5" /> Time left
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary tabular-nums">
                    {formatCountdown(secondsRemaining(activeSession))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Check-in code
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-3xl sm:text-4xl font-black tracking-[0.35em] text-slate-900">
                      {activeSession.checkInCode || "——————"}
                    </span>
                    {activeSession.checkInCode && (
                      <button
                        type="button"
                        onClick={() => copyCode(activeSession.checkInCode as string)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Students open their Attendance tab and enter this code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClose(activeSession)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-3 transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" /> Close & Apply Totals
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {activeSession.checkedInCount} checked in
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Late after {activeSession.lateAfterMinutes} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> Opened {formatTime(activeSession.startedAt)}
                </span>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
                  Checked-in students
                </h4>
                {activeSession.checkIns.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Waiting for the first student to enter the code…
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {activeSession.checkIns.map((checkIn) => (
                      <div
                        key={checkIn.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {checkIn.studentName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {formatTime(checkIn.checkedInAt)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            checkIn.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {checkIn.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
              <Radio className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-display font-bold text-slate-700 text-sm mt-3">No live window</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Open an attendance window on the left when class starts. Students will see the code
                prompt on their dashboard.
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm">Recent Sessions</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {sessions.length} total
              </span>
            </div>
            {loading ? (
              <p className="p-4 text-xs text-slate-400">Loading sessions…</p>
            ) : recentSessions.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 italic">No attendance sessions yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSessions.map((session) => {
                  const expired = isExpired(session);
                  const status =
                    session.status === "OPEN" && !expired
                      ? "LIVE"
                      : session.status === "CANCELLED"
                        ? "CANCELLED"
                        : "CLOSED";
                  return (
                    <div key={session.id} className="px-4 py-3 flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          status === "LIVE"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {status === "LIVE" ? (
                          <Radio className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {session.courseCode} · {session.title}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {session.sessionDate} · {formatTime(session.startedAt)} ·{" "}
                          {session.checkedInCount} check-in
                          {session.checkedInCount === 1 ? "" : "s"}
                          {session.totalsApplied ? " · applied" : ""}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                          status === "LIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "CANCELLED"
                              ? "bg-slate-50 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {status}
                      </span>
                      {status === "LIVE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSession(session);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer shrink-0"
                        >
                          Open
                        </button>
                      )}
                      {status !== "LIVE" && !session.totalsApplied && session.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleClose(session)}
                          disabled={busy}
                          className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          Apply totals
                        </button>
                      )}
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
