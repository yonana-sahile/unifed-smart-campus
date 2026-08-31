import { useState, FormEvent } from "react";
import type { User, CampusAlert } from "../types";
import { CampusDatabase } from "../services/api"
import {
  Bell,
  Radio,
  Send,
  AlertTriangle,
  Info,
  ShieldAlert,
  Smartphone,
  MessageSquare,
  Globe,
  Clock,
  Plus,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";

interface SmartCampusAlertsProps {
  user: User;
}

export function SmartCampusAlerts({ user }: SmartCampusAlertsProps) {
  const [alerts, setAlerts] = useState<CampusAlert[]>(CampusDatabase.getCampusAlerts());
  const [selectedSeverity, setSelectedSeverity] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Alert State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"ACADEMIC" | "EMERGENCY" | "WEATHER" | "FACILITY" | "FINANCE">("ACADEMIC");
  const [severity, setSeverity] = useState<"INFO" | "WARNING" | "CRITICAL">("INFO");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "STUDENTS" | "FACULTY" | "STAFF">("ALL");
  const [channels, setChannels] = useState<("PORTAL" | "TELEGRAM" | "SMS")[]>(["PORTAL", "TELEGRAM"]);

  const canDispatch = ["ADMIN", "DEAN", "DEPARTMENT_HEAD", "REGISTRAR", "FINANCE_OFFICER"].includes(user.role);

  const handleCreateAlert = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Please provide both an alert title and detailed message content.");
      return;
    }

    const newAlert = CampusDatabase.addCampusAlert({
      title,
      message,
      category,
      severity,
      targetAudience,
      senderName: `${user.fullName} (${user.role})`,
      activeUntil: "2026-09-30",
      channelsSent: channels
    });

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      user.role,
      "CAMPUS_ALERT_DISPATCHED",
      "CAMPUS_ALERT",
      newAlert.id,
      `Broadcasted campus alert '${title}' via channels [${channels.join(", ")}].`
    );

    setAlerts(CampusDatabase.getCampusAlerts());
    setShowCreateModal(false);
    setTitle("");
    setMessage("");
  };

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity === "ALL") return true;
    return a.severity === selectedSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CRITICAL BROADCAST</span>
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HIGH PRIORITY</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Info className="w-3.5 h-3.5" />
            <span>ANNOUNCEMENT</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-primary to-indigo-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-red-400 animate-pulse" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl tracking-tight">
              Mekdela Amba Smart Broadcast & Emergency Dispatcher
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Integrated multi-channel telecommunication dispatcher pushing real-time emergency notices, MoE ministerial circulars, and academic scheduling shifts via Web Portal, Telegram Bot, and SMS.
          </p>
        </div>

        {canDispatch && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Broadcast Alert</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Alerts:</span>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedSeverity === s
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {s === "ALL" ? "All Broadcasts" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-3">
        {filteredAlerts.map((a) => (
          <div
            key={a.id}
            className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-3 transition ${
              a.severity === "CRITICAL"
                ? "border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10"
                : a.severity === "WARNING"
                ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {getSeverityBadge(a.severity)}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {a.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">Audience: {a.targetAudience}</span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(a.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">{a.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{a.message}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <span className="text-slate-500">
                Authorized by: <strong className="text-slate-800 dark:text-slate-200">{a.senderName}</strong>
              </span>

              {/* Channels Delivered */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-400">Delivered via:</span>
                {a.channelsSent.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {c === "TELEGRAM" ? <MessageSquare className="w-3 h-3 text-cyan-500" /> : c === "SMS" ? <Smartphone className="w-3 h-3 text-emerald-500" /> : <Globe className="w-3 h-3 text-primary" />}
                    <span>{c}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Radio className="w-6 h-6 text-red-500" />
                <h3 className="font-serif font-bold text-lg">Broadcast Campus Alert</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Alert Title / Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., MoE Higher Education Exit Exam Schedule Announced"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="INFO">INFO (Standard Notice)</option>
                    <option value="WARNING">WARNING (High Priority)</option>
                    <option value="CRITICAL">CRITICAL (Emergency / Immediate Action)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="FACILITY">FACILITY</option>
                    <option value="FINANCE">FINANCE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Detailed Message Body</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter full announcement text, instructions, and target student cohort details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Delivery Channels */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Broadcast Channels</label>
                <div className="flex items-center space-x-4">
                  {(["PORTAL", "TELEGRAM", "SMS"] as const).map((c) => (
                    <label key={c} className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setChannels([...channels, c]);
                          } else {
                            setChannels(channels.filter((x) => x !== c));
                          }
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
