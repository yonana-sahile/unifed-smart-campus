import { useCallback, useEffect, useState } from "react";
import type {
  DormAssignment,
  DormBlock,
  DormMaintenanceRequest,
  DormRoom,
  DormStats,
  User,
} from "../../types";
import {
  getDormBlocks,
  getDormMaintenanceRequests,
  getDormRooms,
  getDormStats,
  getMyDormAssignment,
} from "../../services/dormService";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  Percent,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";

type DormView = "overview" | "rooms" | "maintenance";

interface DormDashboardProps {
  user: User;
  onNavigate?: (view: DormView) => void;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

export function DormDashboard({ user, onNavigate }: DormDashboardProps) {
  const [stats, setStats] = useState<DormStats | null>(null);
  const [blocks, setBlocks] = useState<DormBlock[]>([]);
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [assignment, setAssignment] = useState<DormAssignment | null>(null);
  const [tickets, setTickets] = useState<DormMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, blocksRes, roomsRes, assignmentRes, ticketsRes] = await Promise.allSettled([
        getDormStats(),
        getDormBlocks(),
        getDormRooms(),
        getMyDormAssignment(),
        getDormMaintenanceRequests(),
      ]);

      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setBlocks(blocksRes.status === "fulfilled" ? blocksRes.value : []);
      setRooms(roomsRes.status === "fulfilled" ? roomsRes.value : []);
      setAssignment(assignmentRes.status === "fulfilled" ? assignmentRes.value : null);
      setTickets(ticketsRes.status === "fulfilled" ? ticketsRes.value : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Unable to load dormitory data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTickets = tickets.filter((ticket) => ticket.status !== "RESOLVED");
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const cards = [
    {
      label: "Dormitory Blocks",
      value: stats?.totalBlocks ?? blocks.length,
      sub: `${stats?.totalRooms ?? rooms.length} rooms`,
      Icon: Building2,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Available Beds",
      value: stats?.availableBeds ?? 0,
      sub: `of ${stats?.totalBeds ?? 0} total beds`,
      Icon: BedDouble,
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Occupancy Rate",
      value: `${stats?.occupancyRate ?? 0}%`,
      sub: `${stats?.occupiedBeds ?? 0} beds occupied`,
      Icon: Percent,
      accent: "text-blue-700 bg-blue-50",
    },
    {
      label: "Open Tickets",
      value: stats?.openMaintenance ?? openTickets.length,
      sub: `${stats?.pendingMaintenance ?? 0} pending`,
      Icon: Wrench,
      accent: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Dormitory Overview
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Live occupancy, room availability and maintenance activity across the campus
            residential blocks.
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
        </div>
      )}

      {assignment && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BedDouble className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Your current room
            </p>
            <p className="font-display font-bold text-slate-900 text-sm">
              {assignment.blockName} · Room {assignment.roomNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Assigned {formatDate(assignment.assignedDate)}
              {assignment.academicYear ? ` · ${assignment.academicYear}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("rooms")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-semibold transition cursor-pointer"
          >
            View room <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(({ label, value, sub, Icon, accent }) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {label}
              </span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 mt-2">{value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800 text-sm">Block Occupancy</h3>
            <button
              type="button"
              onClick={() => onNavigate?.("rooms")}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Room allocation <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <p className="p-4 text-xs text-slate-400">Loading blocks…</p>
          ) : blocks.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">
                No dormitory blocks configured yet. An administrator can add them from Django admin.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blocks.map((block) => {
                const blockRooms = rooms.filter((room) => room.block === block.id);
                const totalBeds = blockRooms.reduce((sum, room) => sum + room.capacity, 0);
                const occupied = blockRooms.reduce(
                  (sum, room) => sum + room.currentOccupantsCount,
                  0
                );
                const rate = totalBeds ? Math.round((occupied / totalBeds) * 100) : 0;
                const availableBeds = Math.max(0, totalBeds - occupied);

                return (
                  <div key={block.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {block.blockName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {blockRooms.length} rooms · {availableBeds} beds free
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                            block.genderType === "F"
                              ? "bg-pink-50 text-pink-700 border-pink-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {block.genderType === "F" ? "FEMALE" : "MALE"}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">{rate}%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 90 ? "bg-red-500" : rate >= 70 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" /> Assignments
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 mt-2">
              {stats?.activeAssignments ?? 0}
            </div>
            <p className="text-[10px] text-slate-400">students currently housed on campus</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-slate-500" /> Latest Tickets
              </h3>
              <button
                type="button"
                onClick={() => onNavigate?.("maintenance")}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Open portal
              </button>
            </div>
            {recentTickets.length === 0 ? (
              <div className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-400 mt-1.5">No maintenance tickets reported.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] text-slate-700 line-clamp-2">
                        {ticket.issueDescription}
                      </p>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          statusStyles[ticket.status] || statusStyles.PENDING
                        }`}
                      >
                        {statusLabel[ticket.status] || ticket.status}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {ticket.blockName} · Room{" "}
                      {ticket.roomNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user.role === "STUDENT" && !assignment && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center">
              <BedDouble className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 mt-1.5">No room assigned</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Browse available rooms and request a bed.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.("rooms")}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold cursor-pointer"
              >
                Find a room <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
