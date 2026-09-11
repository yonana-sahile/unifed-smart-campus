import { useState, useEffect, FormEvent } from "react";
import type { User, Course, ZoomClassSession } from "../types";
import { CampusDatabase } from "../services/api";
import { ZoomClassroomModal } from "./ZoomClassroomModal";
import {
  Video,
  Plus,
  Radio,
  Clock,
  Users,
  Copy,
  Check,
  ExternalLink,
  Play,
  Trash2,
  Film,
  CheckCircle2,
  X
} from "lucide-react";

interface InstructorZoomManagerProps {
  instructor: User;
  courses: Course[];
  selectedCourseId?: string;
}

export function InstructorZoomManager({
  instructor,
  courses,
  selectedCourseId,
}: InstructorZoomManagerProps) {
  const [sessions, setSessions] = useState<ZoomClassSession[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "recorded">("all");
  const [selectedSessionForClassroom, setSelectedSessionForClassroom] = useState<ZoomClassSession | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formCourseId, setFormCourseId] = useState(selectedCourseId || courses[0]?.id || "");
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState(90);
  const [formPasscode, setFormPasscode] = useState("MAU2026");
  const [formNotes, setFormNotes] = useState("");

  const [previewRecordingSession, setPreviewRecordingSession] = useState<ZoomClassSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const all = await CampusDatabase.getZoomSessions();
      // Only show sessions taught by this instructor
      const mine = (all || []).filter(
        (s: any) => String(s.instructorId) === String(instructor.id)
      );
      setSessions(mine);
    } catch (err) {
      console.error("Failed to load zoom sessions:", err);
      setSessions([]);
    }
  };

  const handleInstantStartClass = async () => {
    const activeCourse = courses.find((c) => c.id === formCourseId) || courses[0];
    if (!activeCourse) {
      alert("Please create a course first before starting a Zoom class.");
      return;
    }

    const meetingNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const formattedId = `${meetingNum.slice(0, 3)} ${meetingNum.slice(3, 7)} ${meetingNum.slice(7)}`;

    try {
      const created = await CampusDatabase.addZoomSession({
        courseId: activeCourse.id,
        courseCode: activeCourse.courseCode,
        courseTitle: activeCourse.courseTitle,
        title: `Instant Live Teaching: ${activeCourse.courseCode} Session`,
        topic: "Live interactive lecture, question & answer, and code walkthrough.",
        instructorId: instructor.id,
        instructorName: instructor.fullName,
        startTime: new Date().toISOString(),
        durationMinutes: 90,
        meetingId: formattedId,
        passcode: "MAU" + Math.floor(1000 + Math.random() * 9000),
        joinUrl: `https://zoom.us/j/${meetingNum}?pwd=MAU_LIVE_${activeCourse.courseCode}`,
        hostUrl: `https://zoom.us/s/${meetingNum}`,
        status: "LIVE",
        lectureNotes: "Instant interactive lecture session started by instructor.",
        activeAttendees: [
          {
            id: String(instructor.id),
            name: `${instructor.fullName} (Host)`,
            role: "INSTRUCTOR",
            joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMuted: false,
            isVideoOn: true
          }
        ],
        chatMessages: [
          {
            id: "sys-" + Date.now(),
            senderId: "system",
            senderName: "System",
            senderRole: "INSTRUCTOR",
            message: `Live lecture started by ${instructor.fullName}. Welcome students!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]
      });

      await CampusDatabase.addAuditLog(
        String(instructor.id),
        instructor.fullName,
        instructor.role,
        "STARTED_INSTANT_ZOOM_LECTURE",
        "ZoomClassSession",
        String(created.id),
        `Instructor initiated instant Zoom lecture ${created.title}`
      );

      await loadSessions();
      setSelectedSessionForClassroom(created);
    } catch (err: any) {
      console.error(err);
      alert("Failed to start instant class: " + (err?.message || "Unknown error"));
    }
  };

  const handleScheduleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please enter a lecture title.");
      return;
    }

    const activeCourse = courses.find((c) => c.id === formCourseId) || courses[0];
    if (!activeCourse) {
      alert("Please create a course first.");
      return;
    }

    const meetingNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const formattedId = `${meetingNum.slice(0, 3)} ${meetingNum.slice(3, 7)} ${meetingNum.slice(7)}`;

    const dateStr = formDate
      ? `${formDate}T${formTime}:00`
      : new Date(Date.now() + 2 * 3600 * 1000).toISOString();

    try {
      await CampusDatabase.addZoomSession({
        courseId: activeCourse.id,
        courseCode: activeCourse.courseCode,
        courseTitle: activeCourse.courseTitle,
        title: formTitle.trim(),
        topic: formTopic.trim() || "Virtual lecture and interactive discussion.",
        instructorId: instructor.id,
        instructorName: instructor.fullName,
        startTime: dateStr,
        durationMinutes: formDuration,
        meetingId: formattedId,
        passcode: formPasscode.trim() || "MAU2026",
        joinUrl: `https://zoom.us/j/${meetingNum}?pwd=MAU_${activeCourse.courseCode}`,
        hostUrl: `https://zoom.us/s/${meetingNum}`,
        status: "UPCOMING",
        lectureNotes: formNotes.trim(),
        activeAttendees: [],
        chatMessages: []
      });

      await CampusDatabase.addAuditLog(
        String(instructor.id),
        instructor.fullName,
        instructor.role,
        "SCHEDULED_ZOOM_CLASS",
        "ZoomClassSession",
        formattedId,
        `Scheduled Zoom lecture ${formTitle} for ${activeCourse.courseCode}`
      );

      await loadSessions();
      setIsScheduleModalOpen(false);
      setFormTitle("");
      setFormTopic("");
      setFormNotes("");
      alert("Zoom class successfully scheduled and notified to all enrolled students!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to schedule: " + (err?.message || "Unknown error"));
    }
  };

  const handleDeleteSession = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to cancel and remove "${title}"?`)) return;
    try {
      await CampusDatabase.deleteZoomSession(id);
      await loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete session.");
    }
  };

  const handleCopyInvitation = (session: ZoomClassSession) => {
    const text = `Mekdela Amba University - Online Zoom Lecture\nCourse: ${session.courseCode} - ${session.courseTitle}\nTopic: ${session.title}\nTime: ${new Date(session.startTime).toLocaleString()}\nMeeting ID: ${session.meetingId}\nPasscode: ${session.passcode}\nJoin Link: ${session.joinUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "live") return s.status === "LIVE";
    if (activeTab === "upcoming") return s.status === "UPCOMING";
    if (activeTab === "recorded") return s.status === "COMPLETED";
    return true;
  });

  const liveCount = sessions.filter((s) => s.status === "LIVE").length;
  const upcomingCount = sessions.filter((s) => s.status === "UPCOMING").length;
  const recordedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>MAU VIRTUAL CLASSROOM & DISTANCE LEARNING</span>
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-white">
              Zoom Live Teaching & Virtual Lectures
            </h2>
            <p className="text-sm text-blue-200/90 mt-1 max-w-2xl">
              Conduct live lectures, share presentation slides, answer student questions in real-time,
              and record classroom archives directly linked to the University SIS portal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleInstantStartClass}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg transition border border-emerald-400/40"
            >
              <Video className="w-4 h-4" />
              <span>Instant Start Class Now</span>
            </button>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg transition border border-blue-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Zoom Class</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Active Live Now</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-lg font-bold text-emerald-300">{liveCount}</span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Upcoming Scheduled</span>
            <span className="text-lg font-bold text-white mt-1 block">{upcomingCount}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Recorded Archives</span>
            <span className="text-lg font-bold text-blue-300 mt-1 block">{recordedCount}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Virtual Attendance</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">—</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          {[
            { id: "all", label: `All Lectures (${sessions.length})`, color: "bg-blue-700" },
            { id: "live", label: `Live Now (${liveCount})`, color: "bg-emerald-600", dot: true },
            { id: "upcoming", label: `Upcoming (${upcomingCount})`, color: "bg-blue-700" },
            { id: "recorded", label: `Recorded Archives (${recordedCount})`, color: "bg-blue-700" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === t.id
                  ? `${t.color} text-white shadow-xs`
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.dot && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSessions.map((s) => {
          const isLive = s.status === "LIVE";
          const isCompleted = s.status === "COMPLETED";
          return (
            <div
              key={s.id}
              className={`rounded-xl p-5 border transition-all ${
                isLive
                  ? "bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 text-white border-emerald-500/50 shadow-xl"
                  : "bg-white text-slate-900 border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                      isLive
                        ? "bg-blue-500/30 text-blue-300 border border-blue-400/40"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {s.courseCode}
                  </span>
                  <span className={`text-xs ${isLive ? "text-slate-300" : "text-slate-500"} truncate max-w-[180px]`}>
                    {s.courseTitle}
                  </span>
                </div>
                {isLive ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>LIVE</span>
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recorded</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Scheduled</span>
                  </span>
                )}
              </div>

              <h3 className={`font-bold text-base mb-1 ${isLive ? "text-white" : "text-slate-900"}`}>
                {s.title}
              </h3>
              <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${isLive ? "text-slate-300" : "text-slate-600"}`}>
                {s.topic}
              </p>

              <div className={`p-3 rounded-lg text-xs font-mono mb-4 flex flex-wrap items-center justify-between gap-2 ${isLive ? "bg-slate-950/80 border border-slate-800" : "bg-slate-50 border border-slate-200 text-slate-700"}`}>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Meeting ID</span>
                  <span className="font-bold">{s.meetingId}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Passcode</span>
                  <span className="font-bold">{s.passcode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Time</span>
                  <span className="font-sans font-medium">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({s.durationMinutes} min)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionForClassroom(s)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${isLive ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isLive ? "Enter Live Classroom" : "Start Teaching"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyInvitation(s)}
                    className={`p-2 rounded-xl border text-xs transition ${isLive ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"}`}
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={s.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center space-x-1 px-2.5 py-2 rounded-xl border text-xs font-medium transition ${isLive ? "bg-slate-800 text-blue-300 border-slate-700" : "bg-slate-100 text-blue-700 border-slate-300"}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Zoom App</span>
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  {isCompleted && s.recordingUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewRecordingSession(s)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-semibold"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Watch Recording</span>
                    </button>
                  )}
                  {!isLive && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s.id, s.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
          <Video className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h4 className="font-semibold text-slate-700 text-sm">No Zoom sessions found</h4>
          <p className="text-xs mt-1">Click "Schedule New Zoom Class" or "Instant Start Class Now" above to begin.</p>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700"><Video className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Schedule Zoom Virtual Lecture</h3>
                  <p className="text-xs text-slate-500">Set up an online lecture session for your enrolled students</p>
                </div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course</label>
                <select value={formCourseId} onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white">
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.courseCode} - {c.courseTitle}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Title *</label>
                <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                <textarea rows={2} value={formTopic} onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <select value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300">
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passcode</label>
                <input type="text" value={formPasscode} onChange={(e) => setFormPasscode(e.target.value)} className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes for Students</label>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300" />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">Confirm & Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewRecordingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">{previewRecordingSession.courseCode}: {previewRecordingSession.title}</h3>
                <p className="text-xs text-slate-400">Recorded • {previewRecordingSession.recordingDuration || "1 hr 18 min"}</p>
              </div>
              <button onClick={() => setPreviewRecordingSession(null)} className="p-1 rounded text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
              <video controls src={previewRecordingSession.recordingUrl} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-blue-400 block mb-1">Notes:</span>
              <p>{previewRecordingSession.lectureNotes}</p>
            </div>
          </div>
        </div>
      )}

      {selectedSessionForClassroom && (
        <ZoomClassroomModal
          isOpen={!!selectedSessionForClassroom}
          onClose={() => {
            setSelectedSessionForClassroom(null);
            loadSessions();
          }}
          session={selectedSessionForClassroom}
          currentUser={instructor}
          onSessionUpdated={(updated) => {
            setSelectedSessionForClassroom(updated);
            loadSessions();
          }}
        />
      )}
    </div>
  );
}
