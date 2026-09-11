import { useState, useEffect } from "react";
import type { User, Course, ZoomClassSession } from "../types";
import { CampusDatabase } from "../services/api";
import { ZoomClassroomModal } from "./ZoomClassroomModal";
import {
  Video, Radio, Clock, Calendar, Copy, Check, ExternalLink, Play,
  Film, Search, CheckCircle2, X, Tv, BookOpen
} from "lucide-react";

interface StudentZoomLearningHubProps {
  student: User;
  enrolledCourses: Course[];
}

export function StudentZoomLearningHub({ student, enrolledCourses }: StudentZoomLearningHubProps) {
  const [sessions, setSessions] = useState<ZoomClassSession[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "upcoming" | "recorded">("all");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionForClassroom, setSelectedSessionForClassroom] = useState<ZoomClassSession | null>(null);
  const [previewRecordingSession, setPreviewRecordingSession] = useState<ZoomClassSession | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const all = await CampusDatabase.getZoomSessions();
      setSessions(all || []);
    } catch (err) {
      console.error("Failed to load zoom sessions:", err);
      setSessions([]);
    }
  };

  const handleCopyMeetingInfo = (s: ZoomClassSession) => {
    const text = `MAU Virtual Zoom Class\nCourse: ${s.courseCode} - ${s.courseTitle}\nTopic: ${s.title}\nMeeting ID: ${s.meetingId}\nPasscode: ${s.passcode}\nJoin Link: ${s.joinUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(s.id);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  const liveSession = sessions.find((s) => s.status === "LIVE");

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === "live" && s.status !== "LIVE") return false;
    if (activeFilter === "upcoming" && s.status !== "UPCOMING") return false;
    if (activeFilter === "recorded" && s.status !== "COMPLETED") return false;
    if (selectedCourseCode !== "ALL" && s.courseCode !== selectedCourseCode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        s.instructorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const liveCount = sessions.filter((s) => s.status === "LIVE").length;
  const upcomingCount = sessions.filter((s) => s.status === "UPCOMING").length;
  const recordedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  const uniqueCourseCodes = Array.from(new Set(sessions.map((s) => s.courseCode).filter(Boolean)));

  return (
    <div className="space-y-6">
      {liveSession && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border-2 border-emerald-500/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  LIVE RIGHT NOW • የቀጥታ ትምህርት
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300">{liveSession.courseCode}</span>
              </div>
              <h3 className="text-lg font-bold mt-1">{liveSession.title}</h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Instructor: <span className="font-semibold text-white">{liveSession.instructorName}</span> • Meeting ID: <span className="font-mono text-emerald-300 font-bold">{liveSession.meetingId}</span> • Passcode: <span className="font-mono text-emerald-300 font-bold">{liveSession.passcode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedSessionForClassroom(liveSession)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Zoom Lecture</span>
            </button>
            <a href={liveSession.joinUrl} target="_blank" rel="noreferrer"
               className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-400/30 transition">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-2">
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span>MAU DISTANCE LEARNING & VIRTUAL CLASSROOMS</span>
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight">Online Virtual Lectures & Zoom Classroom</h2>
            <p className="text-sm text-blue-200/90 mt-1 max-w-2xl">
              Attend live interactive lectures with your professors, raise your hand to ask questions, and review recorded archives at any time.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <BookOpen className="w-5 h-5 text-blue-300 shrink-0" />
            <div>
              <span className="font-semibold block">Attendance Credit Synced</span>
              <span className="text-[11px] text-blue-200">Attending live Zoom classes automatically credits your course attendance.</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-blue-200 block text-[11px]">Live Classes Now</span>
              <span className="text-base font-bold text-emerald-300 mt-0.5 block">{liveCount}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Upcoming Sessions</span>
            <span className="text-base font-bold text-white mt-0.5 block">{upcomingCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-blue-200 block text-[11px]">Recorded Archives</span>
            <span className="text-base font-bold text-blue-300 mt-0.5 block">{recordedCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${sessions.length})` },
            { id: "live", label: `Live (${liveCount})`, dot: true },
            { id: "upcoming", label: `Upcoming (${upcomingCount})` },
            { id: "recorded", label: `Recorded (${recordedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === f.id
                  ? f.dot ? "bg-emerald-600 text-white" : "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.dot && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <select value={selectedCourseCode} onChange={(e) => setSelectedCourseCode(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white">
            <option value="ALL">All Courses</option>
            {uniqueCourseCodes.map((code) => (<option key={code} value={code}>{code}</option>))}
          </select>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search topic..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-44 sm:w-56" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.map((s) => {
          const isLive = s.status === "LIVE";
          const isCompleted = s.status === "COMPLETED";
          return (
            <div key={s.id} className={`rounded-xl p-5 border transition-all ${
              isLive ? "bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 text-white border-emerald-500/50 shadow-xl"
                     : "bg-white text-slate-900 border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                    isLive ? "bg-blue-500/30 text-blue-300 border border-blue-400/40"
                           : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}>{s.courseCode}</span>
                  <span className={`text-xs ${isLive ? "text-slate-300" : "text-slate-500"} truncate max-w-[200px]`}>
                    {s.courseTitle}
                  </span>
                </div>
                {isLive ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>LIVE NOW</span>
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recorded</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upcoming</span>
                  </span>
                )}
              </div>
              <h3 className={`font-bold text-base mb-1 ${isLive ? "text-white" : "text-slate-900"}`}>{s.title}</h3>
              <p className={`text-xs line-clamp-2 mb-3.5 ${isLive ? "text-slate-300" : "text-slate-600"}`}>{s.topic}</p>

              <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {s.instructorName.charAt(0)}
                  </div>
                  <span className={`font-medium ${isLive ? "text-slate-200" : "text-slate-700"}`}>{s.instructorName}</span>
                </div>
                <div className={`flex items-center space-x-1 ${isLive ? "text-emerald-400" : "text-slate-500"}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <div className={`p-3 rounded-lg text-xs font-mono mb-4 flex flex-wrap items-center justify-between gap-2 ${isLive ? "bg-slate-950/80 border border-slate-800" : "bg-slate-50 border border-slate-200"}`}>
                <div><span className="text-[11px] text-slate-400 block font-sans">Meeting ID</span><span className="font-bold">{s.meetingId}</span></div>
                <div><span className="text-[11px] text-slate-400 block font-sans">Passcode</span><span className="font-bold">{s.passcode}</span></div>
                <div><span className="text-[11px] text-slate-400 block font-sans">Duration</span><span className="font-sans font-medium">{s.durationMinutes} min</span></div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  {isCompleted ? (
                    <button type="button" onClick={() => setPreviewRecordingSession(s)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch ({s.recordingDuration || "1h"})</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => setSelectedSessionForClassroom(s)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${isLive ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                      <Video className="w-3.5 h-3.5" />
                      <span>{isLive ? "Enter Live Classroom" : "Join Virtual Room"}</span>
                    </button>
                  )}
                  <button type="button" onClick={() => handleCopyMeetingInfo(s)}
                    className={`p-2 rounded-xl border text-xs ${isLive ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                    {copiedSessionId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a href={s.joinUrl} target="_blank" rel="noreferrer"
                    className={`flex items-center space-x-1 px-2.5 py-2 rounded-xl border text-xs font-medium ${isLive ? "bg-slate-800 text-blue-300 border-slate-700" : "bg-slate-100 text-blue-700 border-slate-300"}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Zoom App</span>
                  </a>
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
          <p className="text-xs mt-1">Check back soon for upcoming lectures scheduled by your professors.</p>
        </div>
      )}

      {previewRecordingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono uppercase">
                  Recorded Zoom Archive
                </span>
                <h3 className="font-bold text-sm mt-1">{previewRecordingSession.courseCode}: {previewRecordingSession.title}</h3>
                <p className="text-xs text-slate-400">Lecturer: {previewRecordingSession.instructorName}</p>
              </div>
              <button onClick={() => setPreviewRecordingSession(null)} className="p-1 rounded text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
              <video controls src={previewRecordingSession.recordingUrl} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-blue-400 block mb-1">Summary:</span>
              <p>{previewRecordingSession.lectureNotes}</p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Attendance Marked</span>
              </span>
              <button onClick={() => setPreviewRecordingSession(null)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedSessionForClassroom && (
        <ZoomClassroomModal
          isOpen={!!selectedSessionForClassroom}
          onClose={() => { setSelectedSessionForClassroom(null); loadSessions(); }}
          session={selectedSessionForClassroom}
          currentUser={student}
          onSessionUpdated={(updated) => { setSelectedSessionForClassroom(updated); loadSessions(); }}
        />
      )}
    </div>
  );
}
