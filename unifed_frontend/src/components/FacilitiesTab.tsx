// src/components/FacilitiesTab.tsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu, Calendar, Clock, Plus, X, Check, AlertTriangle, RefreshCw,
  MapPin, Users as UsersIcon, Search,
} from "lucide-react";
import type { User } from "../types";
import {
  listFacilities, listBookings, createBooking, cancelBooking,
  mockNotice, isMock,
  type Facility, type Booking,
} from "../services/facilities";

type Props = { user: User; pushToast: (t: any) => void };

function facilityKindLabel(kind: Facility["kind"]): string {
  switch (kind) {
    case "LAB": return "Lab";
    case "LECTURE_HALL": return "Lecture Hall";
    case "SEMINAR_ROOM": return "Seminar Room";
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FacilitiesTab({ user, pushToast }: Props) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookingFacility, setBookingFacility] = useState<Facility | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setFacilities(await listFacilities());
      setBookings(await listBookings());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load facilities. Browser storage may be unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // E: re-evaluate occupancy every 60s without a full reload.
  // We don't re-fetch storage — just nudge React to recompute time-based
  // derived state. The render-time checks in each card re-read Date.now().
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      forceTick((n) => n + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const notice = mockNotice();

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED"),
    [bookings]
  );

  const upcomingBookings = useMemo(
    () =>
      [...confirmedBookings]
        .filter((b) => new Date(b.endsAt).getTime() >= Date.now() - 60_000)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [confirmedBookings]
  );

  const bookingsByFacility = useMemo(() => {
    const map = new Map<string, Booking[]>();
    upcomingBookings.forEach((b) => {
      const list = map.get(b.facilityId) ?? [];
      list.push(b);
      map.set(b.facilityId, list);
    });
    return map;
  }, [upcomingBookings]);

  const filteredFacilities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return facilities;
    return facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        facilityKindLabel(f.kind).toLowerCase().includes(q)
    );
  }, [facilities, search]);

  const handleConfirm = async (input: {
    facilityId: string; title: string; startsAt: string; endsAt: string;
  }) => {
    const result = await createBooking({
      ...input,
      requesterName: user.fullName,
    });
    if (!result.ok) {
      pushToast({ type: "error", title: "Booking rejected", message: result.error });
      return;
    }
    pushToast({
      type: "success", title: "Booking confirmed",
      message: `${input.title} · ${formatDateTime(input.startsAt)}`,
    });
    setBookingFacility(null);
    refresh();
  };

  const handleCancel = (booking: Booking) => {
    setCancellingBooking(booking);
  };

  const confirmCancel = async () => {
    if (!cancellingBooking) return;
    await cancelBooking(cancellingBooking.id);
    pushToast({
      type: "success", title: "Booking cancelled",
      message: cancellingBooking.title,
    });
    setCancellingBooking(null);
    refresh();
  };
  return (
    <motion.div
      key="facilities"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Lab & Hall Bookings</h2>
          <p className="text-sm text-slate-500">
            {facilities.length} facilities · {upcomingBookings.length} upcoming booking{upcomingBookings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-primary/40 hover:text-primary hover:shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Loading…" : "Refresh"}</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-300/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-900">Local mode</p>
            <p className="text-[11px] text-amber-700 mt-0.5">{notice}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, location, or type…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-300/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-red-900">Could not load facilities</p>
            <p className="text-[11px] text-red-700 mt-0.5">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 inline-flex items-center space-x-1 text-[11px] font-bold text-red-700 hover:underline"
            >
              <RefreshCw className="w-3 h-3" /><span>Try again</span>
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-5 w-40 bg-slate-200/70 rounded-md animate-pulse" />
              <div className="h-3 w-24 bg-slate-200/70 rounded-md animate-pulse" />
              <div className="h-2.5 w-full bg-slate-200/70 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No facilities match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFacilities.map((f) => {
            const list = bookingsByFacility.get(f.id) ?? [];
            const next = list[0];
            const nowMs = Date.now();
            const currentlyOccupied = list.some((b) => {
              const start = new Date(b.startsAt).getTime();
              const end = new Date(b.endsAt).getTime();
              return start <= nowMs && end > nowMs;
            });
            const underMaintenance =
              f.maintenanceUntil != null &&
              new Date(f.maintenanceUntil).getTime() > Date.now();
            const statusKind: "maintenance" | "in-use" | "booked" | "available" =
              underMaintenance
                ? "maintenance"
                : currentlyOccupied
                ? "in-use"
                : list.length > 0
                ? "booked"
                : "available";
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-slate-900 truncate">{f.name}</h3>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          {facilityKindLabel(f.kind)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${
                      statusKind === "maintenance"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : statusKind === "in-use"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : statusKind === "booked"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {statusKind === "maintenance"
                      ? "MAINTENANCE"
                      : statusKind === "in-use"
                      ? "IN USE"
                      : statusKind === "booked"
                      ? "BOOKED"
                      : "AVAILABLE"}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" /><span>{f.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <UsersIcon className="w-3 h-3" /><span>{f.capacity} seats</span>
                  </span>
                </div>

                {next && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                    <p className="font-semibold text-slate-700 truncate">{next.title}</p>
                    <p className="font-mono text-slate-400 mt-0.5">
                      {formatDateTime(next.startsAt)} → {formatDateTime(next.endsAt)}
                    </p>
                  </div>
                )}

                {underMaintenance && f.maintenanceReason && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                    <p className="font-semibold text-slate-700">Under maintenance</p>
                    <p className="text-slate-500 mt-0.5">{f.maintenanceReason}</p>
                    <p className="font-mono text-slate-400 mt-0.5">
                      Until {new Date(f.maintenanceUntil!).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-400">
                    {list.length} upcoming
                  </span>
                  {underMaintenance ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold text-slate-400">
                      <AlertTriangle className="w-3 h-3" /><span>Unavailable</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setBookingFacility(f)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Plus className="w-3 h-3" /><span>Book</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-slate-900">Upcoming bookings</h3>
        </div>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No upcoming bookings.</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((b) => {
              const f = facilities.find((x) => x.id === b.facilityId);
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.title}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {f?.name ?? "Unknown facility"} · {formatDateTime(b.startsAt)} → {formatDateTime(b.endsAt)}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">by {b.requesterName}</p>
                  </div>
                  {(() => {
                    const isOwn = b.requesterName === user.fullName;
                    const canCancel = isOwn || user.role === "DEPARTMENT_HEAD";
                    return canCancel ? (
                      <button
                        onClick={() => handleCancel(b)}
                        className="shrink-0 text-[11px] font-bold text-slate-400 hover:text-red-500 transition"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span
                        className="shrink-0 text-[10px] font-mono text-slate-400"
                        title="Only the requester or department head can cancel"
                      >
                        {b.requesterName.split(" ")[0]}
                      </span>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {bookingFacility && (
          <BookingModal
            facility={bookingFacility}
            onClose={() => setBookingFacility(null)}
            onConfirm={handleConfirm}
          />
        )}
        {cancellingBooking && (
          <CancelConfirmModal
            booking={cancellingBooking}
            onClose={() => setCancellingBooking(null)}
            onConfirm={confirmCancel}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BookingModal({
  facility, onClose, onConfirm,
}: {
  facility: Facility;
  onClose: () => void;
  onConfirm: (input: { facilityId: string; title: string; startsAt: string; endsAt: string }) => void;
}) {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  defaultStart.setMinutes(0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInputValue(defaultStart));
  const [endsAt, setEndsAt] = useState(toLocalInputValue(defaultEnd));

  const startTime = new Date(startsAt).getTime();
  const endTime = new Date(endsAt).getTime();

  const startValid = Number.isFinite(startTime) && startTime > Date.now();
  const endValid = Number.isFinite(endTime) && endTime > startTime;
  const ready =
    title.trim().length > 0 &&
    Boolean(startsAt) &&
    Boolean(endsAt) &&
    startValid &&
    endValid;

  return (
    <div className="fixed inset-0 z-[58] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-primary tracking-wider">NEW BOOKING</span>
            <h3 className="font-display font-bold text-lg mt-1 text-slate-900 truncate">{facility.name}</h3>
            <p className="text-[11px] font-mono text-slate-400">{facility.location}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Purpose</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SE-301 lecture, team demo…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" /><span>Start</span>
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" /><span>End</span>
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {startsAt && endsAt && !startValid && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Start time must be in the future.
            </p>
          )}
          {startsAt && endsAt && startValid && !endValid && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              End time must be after the start time.
            </p>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            disabled={!ready}
            onClick={() => onConfirm({
              facilityId: facility.id,
              title,
              startsAt: new Date(startsAt).toISOString(),
              endsAt: new Date(endsAt).toISOString(),
            })}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" /><span>Confirm</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
function CancelConfirmModal({
  booking, onClose, onConfirm,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[58] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900">Cancel this booking?</h3>
            <p className="text-sm text-slate-500 mt-1 truncate">{booking.title}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              {formatDateTime(booking.startsAt)} → {formatDateTime(booking.endsAt)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            This cannot be undone. The facility will be released for other bookings.
          </p>
        </div>
        <div className="p-5 border-t border-slate-100 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Keep booking
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold shadow-lg shadow-red-500/30"
          >
            Cancel booking
          </button>
        </div>
      </motion.div>
    </div>
  );
}