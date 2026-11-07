from pathlib import Path

# ---- Edit 1: Add facility functions to api.ts ----
api_path = Path(r"C:\Users\A\unifed-smart-campus\unifed_frontend\src\services\api.ts")
c = api_path.read_text(encoding="utf-8")

marker = "export const deleteFacilityBooking = (id: string): Promise<void> =>\n  api.delete(`/facility-bookings/${numericId(id)}/`).then(() => undefined);"
assert marker in c, "FACILITY BLOCK MARKER NOT FOUND IN api.ts"

new_block = marker + """

// ---------- FACILITIES (Phase 3) ----------
export const getFacilities = (): Promise<any[]> =>
  api.get('/facilities/').then(r => unwrapList<any>(r.data));

export const approveFacilityBooking = (id: string): Promise<any> =>
  api.post(`/facility-bookings/${numericId(id)}/approve/`).then(r => r.data);

export const rejectFacilityBooking = (id: string, reason: string): Promise<any> =>
  api.post(`/facility-bookings/${numericId(id)}/reject/`, { reason }).then(r => r.data);

export const cancelFacilityBooking = (id: string): Promise<any> =>
  api.post(`/facility-bookings/${numericId(id)}/cancel/`).then(r => r.data);"""

c = c.replace(marker, new_block)

# Also add to CampusDatabase exports
export_marker = "  deleteFacilityBooking,"
assert export_marker in c, "EXPORT MARKER NOT FOUND IN api.ts"
export_replacement = export_marker + "\n  getFacilities,\n  approveFacilityBooking,\n  rejectFacilityBooking,\n  cancelFacilityBooking,"
c = c.replace(export_marker, export_replacement, 1)

api_path.write_text(c, encoding="utf-8")
print("DONE api.ts")

# ---- Edit 2: Rewrite services/facilities.ts ----
fac_path = Path(r"C:\Users\A\unifed-smart-campus\unifed_frontend\src\services\facilities.ts")

content = r'''// src/services/facilities.ts
// Phase 4: real Django backend wiring. No more localStorage.

import {
  getFacilities,
  getFacilityBookings,
  addFacilityBooking,
  cancelFacilityBooking,
} from './api';

export type Facility = {
  id: string;
  name: string;
  kind: "LAB" | "LECTURE_HALL" | "SEMINAR_ROOM";
  location: string;
  capacity: number;
  maintenanceUntil?: string;
  maintenanceReason?: string;
};

export type Booking = {
  id: string;
  facilityId: string;
  title: string;
  requesterName: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  status: "CONFIRMED" | "CANCELLED";
};

export function isMock(): boolean {
  return false;
}

export function mockNotice(): string {
  return "";
}

const KIND_MAP: Record<string, Facility["kind"]> = {
  LAB: "LAB",
  LECTURE_HALL: "LECTURE_HALL",
  SEMINAR_ROOM: "SEMINAR_ROOM",
  AUDITORIUM: "LECTURE_HALL",
  LIBRARY_CUBICLE: "SEMINAR_ROOM",
  CONFERENCE_ROOM: "SEMINAR_ROOM",
  MEETING_ROOM: "SEMINAR_ROOM",
};

function toFacility(raw: any): Facility {
  const loc = [raw.building, raw.room_number].filter(Boolean).join(" \u00b7 ") || raw.campus || "";
  return {
    id: String(raw.id),
    name: raw.name || raw.facility_code || "Unknown",
    kind: KIND_MAP[raw.facility_type] ?? "LAB",
    location: loc,
    capacity: raw.capacity ?? 0,
    maintenanceUntil: raw.maintenance_until ?? undefined,
    maintenanceReason: raw.maintenance_reason || undefined,
  };
}

function toBooking(raw: any): Booking {
  const startsAt = raw.date && raw.start_time
    ? `${raw.date}T${raw.start_time}`
    : new Date().toISOString();
  const endsAt = raw.date && raw.end_time
    ? `${raw.date}T${raw.end_time}`
    : new Date().toISOString();
  return {
    id: String(raw.id),
    facilityId: String(raw.facility ?? ""),
    title: raw.purpose || "Untitled booking",
    requesterName: raw.requester_name || raw.requested_by?.full_name || "Unknown",
    startsAt,
    endsAt,
    createdAt: raw.created_at || new Date().toISOString(),
    status:
      raw.status === "APPROVED" || raw.status === "PENDING"
        ? "CONFIRMED"
        : "CANCELLED",
  };
}

export async function listFacilities(): Promise<Facility[]> {
  const raw = await getFacilities();
  return raw.map(toFacility);
}

export async function listBookings(): Promise<Booking[]> {
  const raw = await getFacilityBookings();
  return (raw as any[]).map(toBooking);
}

export type CreateBookingInput = {
  facilityId: string;
  title: string;
  requesterName: string;
  startsAt: string;
  endsAt: string;
};

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  try {
    const raw = await addFacilityBooking({
      facility: Number(input.facilityId),
      date: input.startsAt.slice(0, 10),
      start_time: input.startsAt.slice(11, 16),
      end_time: input.endsAt.slice(11, 16),
      purpose: input.title || "Untitled booking",
      expected_attendees: 10,
    } as any);
    return { ok: true, booking: toBooking(raw) };
  } catch (err: any) {
    const detail = err?.response?.data;
    let message = "Booking failed.";
    if (detail && typeof detail === "object") {
      const first = Object.values(detail)[0];
      if (Array.isArray(first)) message = String(first[0]);
      else if (typeof first === "string") message = first;
    } else if (typeof detail === "string") {
      message = detail;
    }
    return { ok: false, error: message };
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await cancelFacilityBooking(bookingId);
}
'''

fac_path.write_text(content, encoding="utf-8")
print("DONE facilities.ts")

# ---- Edit 3: Update FacilitiesTab.tsx to await ----
tab_path = Path(r"C:\Users\A\unifed-smart-campus\unifed_frontend\src\components\FacilitiesTab.tsx")
t = tab_path.read_text(encoding="utf-8")

# refresh → async
t = t.replace(
    "const refresh = () => {\n    setLoading(true);\n    setError(null);\n    try {\n      setFacilities(listFacilities());\n      setBookings(listBookings());",
    "const refresh = async () => {\n    setLoading(true);\n    setError(null);\n    try {\n      setFacilities(await listFacilities());\n      setBookings(await listBookings());"
)

# handleConfirm → async
t = t.replace(
    "const handleConfirm = (input: {\n    facilityId: string; title: string; startsAt: string; endsAt: string;\n  }) => {\n    const result = createBooking({",
    "const handleConfirm = async (input: {\n    facilityId: string; title: string; startsAt: string; endsAt: string;\n  }) => {\n    const result = await createBooking({"
)

# confirmCancel → async
t = t.replace(
    "const confirmCancel = () => {\n    if (!cancellingBooking) return;\n    cancelBooking(cancellingBooking.id);",
    "const confirmCancel = async () => {\n    if (!cancellingBooking) return;\n    await cancelBooking(cancellingBooking.id);"
)

tab_path.write_text(t, encoding="utf-8")
print("DONE FacilitiesTab.tsx")

print()
print("ALL DONE — now run:")
print("  cd C:\\Users\\A\\unifed-smart-campus\\unifed_frontend")
print("  npm run build")