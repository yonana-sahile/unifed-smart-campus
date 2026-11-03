import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import type {
  DormAssignment,
  DormMaintenanceRequest,
  DormMaintenanceStatus,
  DormRoom,
  User,
} from "../../types";
import {
  createDormMaintenanceRequest,
  getDormMaintenanceRequests,
  getDormRooms,
  getMyDormAssignment,
  updateDormMaintenanceRequest,
} from "../../services/dormService";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  Send,
  Wrench,
  X,
} from "lucide-react";

interface MaintenancePortalProps {
  user: User;
  isManager?: boolean;
}

const STATUS_OPTIONS: DormMaintenanceStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED"];

const statusStyles: Record<DormMaintenanceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabels: Record<DormMaintenanceStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture",
  "Internet",
  "Cleaning",
  "Doors & Windows",
  "Other",
];

const formatDateTime = (value?: string) => {
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

export function MaintenancePortal({ user, isManager = false }: MaintenancePortalProps) {
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [tickets, setTickets] = useState<DormMaintenanceRequest[]>([]);
  const [myAssignment, setMyAssignment] = useState<DormAssignment | null>(null);
  const [roomId, setRoomId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"ALL" | DormMaintenanceStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyTicketId, setBusyTicketId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roomsRes, ticketsRes, assignmentRes] = await Promise.allSettled([
        getDormRooms(),
        getDormMaintenanceRequests(),
        getMyDormAssignment(),
      ]);

      const nextRooms = roomsRes.status === "fulfilled" ? roomsRes.value : [];
      setRooms(nextRooms);
      setTickets(ticketsRes.status === "fulfilled" ? ticketsRes.value : []);
      const assignment = assignmentRes.status === "fulfilled" ? assignmentRes.value : null;
      setMyAssignment(assignment);

      setRoomId((current) => {
        if (current) return current;
        if (assignment?.room) return assignment.room;
        return nextRooms[0]?.id ?? "";
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Unable to load maintenance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      PENDING: tickets.filter((ticket) => ticket.status === "PENDING").length,
      IN_PROGRESS: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      RESOLVED: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets]
  );

  const visibleTickets = useMemo(() => {
    const sorted = [...tickets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return filter === "ALL" ? sorted : sorted.filter((ticket) => ticket.status === filter);
  }, [tickets, filter]);

  const selectedRoom = rooms.find((room) => room.id === roomId);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!roomId) {
      setError("Select the room that needs maintenance.");
      return;
    }
    if (description.trim().length < 8) {
      setError("Please describe the issue in at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await createDormMaintenanceRequest({
        room: roomId,
        issue_description: `[${category}] ${description.trim()}`,
      });
      setDescription("");
      setCategory(CATEGORIES[0]);
      setNotice("Maintenance ticket submitted. Dormitory staff will review it shortly.");
      await load();
    } catch (err: any) {
      const data = err?.response?.data;
      setError(
        data?.error ||
          data?.issue_description?.[0] ||
          data?.room?.[0] ||
          err?.message ||
          "Could not submit the ticket."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    ticket: DormMaintenanceRequest,
    nextStatus: DormMaintenanceStatus
  ) => {
    if (ticket.status === nextStatus) return;
    setBusyTicketId(ticket.id);
    setError("");
    setNotice("");
    try {
      await updateDormMaintenanceRequest(ticket.id, { status: nextStatus });
      setTickets((current) =>
        current.map((entry) =>
          entry.id === ticket.id ? { ...entry, status: nextStatus } : entry
        )
      );
      setNotice(`Ticket #${ticket.id} marked ${statusLabels[nextStatus].toLowerCase()}.`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Could not update this ticket.");
    } finally {
      setBusyTicketId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" /> Maintenance Portal
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Report plumbing, electrical, furniture or connectivity problems and follow each repair
            from pending to resolved.
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

      {(error || notice) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{error || notice}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
            }}
            className="ml-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "ALL" : status)}
            className={`rounded-xl border p-3 text-left transition cursor-pointer ${
              filter === status
                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
              {statusLabels[status]}
            </span>
            <div className="text-xl font-display font-bold text-slate-900 mt-0.5">
              {counts[status]}
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 h-fit"
        >
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Report an Issue</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Your housing, our repair team
              </p>
            </div>
          </div>

          {!isManager && myAssignment && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[10px] text-emerald-800">
              Assigned room: {myAssignment.blockName} · Room {myAssignment.roomNumber}
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Room
            </span>
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select room…</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.blockName} · Room {room.roomNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Describe the problem
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="e.g. The shower drain is blocked and water backs up."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || rooms.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-bold py-2.5 transition cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {submitting ? "Submitting…" : "Submit Maintenance Ticket"}
          </button>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Tickets are visible to dormitory staff. You will see the status change here as the
            repair progresses.
          </p>
        </form>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-fit">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-500" /> Repair Tickets
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as "ALL" | DormMaintenanceStatus)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 focus:outline-none"
              >
                <option value="ALL">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {visibleTickets.length} shown
              </span>
            </div>
          </div>

          {loading ? (
            <p className="p-4 text-xs text-slate-400">Loading tickets…</p>
          ) : visibleTickets.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">
                {filter === "ALL"
                  ? "No maintenance tickets have been reported."
                  : `No ${statusLabels[filter as DormMaintenanceStatus].toLowerCase()} tickets.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {visibleTickets.map((ticket) => (
                <div key={ticket.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800 font-medium leading-snug">
                        {ticket.issueDescription}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {ticket.blockName} · Room {ticket.roomNumber}
                        {isManager && ticket.reportedByName
                          ? ` · reported by ${ticket.reportedByName}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                        statusStyles[ticket.status]
                      }`}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <Clock className="w-3 h-3" /> {formatDateTime(ticket.createdAt)}
                    </span>

                    {isManager ? (
                      <div className="flex items-center gap-1.5">
                        {busyTicketId === ticket.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                        )}
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={busyTicketId === ticket.id || ticket.status === status}
                            onClick={() => handleStatusChange(ticket, status)}
                            className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition cursor-pointer disabled:opacity-40 ${
                              ticket.status === status
                                ? statusStyles[status]
                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {ticket.status === "RESOLVED"
                          ? "Repair completed"
                          : "Staff will update this ticket"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRoom && (
        <p className="text-[10px] text-slate-400 text-center">
          Reporting for {selectedRoom.blockName} · Room {selectedRoom.roomNumber} as{" "}
          {user.fullName}.
        </p>
      )}
    </div>
  );
}
