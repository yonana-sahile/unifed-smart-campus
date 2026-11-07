// src/services/facilities.ts
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
 requesterName: raw.requester_name || (typeof raw.requested_by === "object" ? raw.requested_by?.full_name : null) || "Unknown",
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
