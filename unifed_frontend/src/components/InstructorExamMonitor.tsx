import { useEffect, useState } from "react";
import { CampusDatabase } from "../services/api";
import { AlertTriangle, CheckCircle2, Camera, Eye } from "lucide-react";

export function InstructorExamMonitor() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await CampusDatabase.getMonitoringEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load monitoring events", err);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case "MULTIPLE_FACES":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>Multiple Faces</span></span>;
      case "NO_FACE":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1"><Eye className="w-3 h-3" /><span>Face Not Detected</span></span>;
      case "CAMERA_DISCONNECTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1"><Camera className="w-3 h-3" /><span>Camera Lost</span></span>;
      case "MONITORING_READY":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>Camera Ready</span></span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-sm animate-pulse">Loading monitoring logs...</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-800">Live Proctoring Logs</h2>
          <p className="text-xs text-slate-500">Review face detection events from student exams.</p>
        </div>
        <button onClick={fetchEvents} className="text-xs font-semibold text-primary hover:underline">
          Refresh Logs
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Attempt ID</th>
              <th className="px-6 py-3">Event Type</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/60 transition">
                <td className="px-6 py-4 font-mono font-bold text-slate-800">
                  #{ev.attempt}
                </td>
                <td className="px-6 py-4">{getBadge(ev.event_type)}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{ev.details || "—"}</td>
                <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">
                  No monitoring events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}