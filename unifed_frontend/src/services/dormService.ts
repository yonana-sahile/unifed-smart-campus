import { api } from "./api";
import type {
  DormAssignment,
  DormBlock,
  DormGenderType,
  DormMaintenanceRequest,
  DormMaintenanceStatus,
  DormRoom,
  DormStats,
} from "../types";

const unwrapList = <T>(raw: any): T[] =>
  Array.isArray(raw) ? raw : raw?.results ?? [];

const numericId = (id: string | number): string =>
  String(id).replace(/^[A-Z]+_/, "");

// ---------- MAPPERS ----------
const mapBlock = (b: any): DormBlock => ({
  id: String(b.id),
  blockName: b.block_name ?? b.blockName ?? "",
  genderType: (b.gender_type ?? b.genderType ?? "M") as DormGenderType,
  totalRooms: Number(b.total_rooms ?? b.totalRooms ?? 0),
  occupiedRooms: Number(b.occupied_rooms ?? b.occupiedRooms ?? 0),
  availableRooms: Number(b.available_rooms ?? b.availableRooms ?? 0),
  totalBeds: Number(b.total_beds ?? b.totalBeds ?? 0),
  occupiedBeds: Number(b.occupied_beds ?? b.occupiedBeds ?? 0),
});

const mapRoom = (r: any): DormRoom => {
  const capacity = Number(r.capacity ?? 0);
  const occupants = Number(r.current_occupants_count ?? r.currentOccupantsCount ?? 0);
  return {
    id: String(r.id),
    block: String(r.block ?? r.blockId ?? ""),
    blockName: r.block_name ?? r.blockName ?? undefined,
    genderType: (r.gender_type ?? r.genderType ?? undefined) as DormGenderType | undefined,
    roomNumber: r.room_number ?? r.roomNumber ?? "",
    capacity,
    currentOccupantsCount: occupants,
    availableBeds: Number(r.available_beds ?? r.availableBeds ?? Math.max(0, capacity - occupants)),
    isAvailable: Boolean(r.is_available ?? r.isAvailable ?? occupants < capacity),
  };
};

const mapAssignment = (a: any): DormAssignment => ({
  id: String(a.id),
  student: String(a.student ?? a.studentId ?? ""),
  studentName: a.student_name ?? a.studentName ?? "",
  room: String(a.room ?? a.roomId ?? ""),
  roomNumber: a.room_number ?? a.roomNumber ?? "",
  blockName: a.block_name ?? a.blockName ?? "",
  genderType: (a.gender_type ?? a.genderType ?? undefined) as DormGenderType | undefined,
  assignedDate: a.assigned_date ?? a.assignedDate ?? "",
  academicYear: a.academic_year ?? a.academicYear ?? "",
  status: (a.status ?? "ACTIVE") as "ACTIVE" | "TERMINATED",
});

const mapMaintenance = (m: any): DormMaintenanceRequest => ({
  id: String(m.id),
  room: String(m.room ?? m.roomId ?? ""),
  roomNumber: m.room_number ?? m.roomNumber ?? "",
  blockName: m.block_name ?? m.blockName ?? "",
  reportedBy: String(m.reported_by ?? m.reportedBy ?? ""),
  reportedByName: m.reported_by_name ?? m.reportedByName ?? "",
  issueDescription: m.issue_description ?? m.issueDescription ?? "",
  status: (m.status ?? "PENDING") as DormMaintenanceStatus,
  createdAt: m.created_at ?? m.createdAt ?? "",
});

const mapStats = (s: any): DormStats => ({
  totalBlocks: Number(s.total_blocks ?? s.totalBlocks ?? 0),
  totalRooms: Number(s.total_rooms ?? s.totalRooms ?? 0),
  totalBeds: Number(s.total_beds ?? s.totalBeds ?? 0),
  occupiedBeds: Number(s.occupied_beds ?? s.occupiedBeds ?? 0),
  availableBeds: Number(s.available_beds ?? s.availableBeds ?? 0),
  occupancyRate: Number(s.occupancy_rate ?? s.occupancyRate ?? 0),
  activeAssignments: Number(s.active_assignments ?? s.activeAssignments ?? 0),
  openMaintenance: Number(s.open_maintenance ?? s.openMaintenance ?? 0),
  pendingMaintenance: Number(s.pending_maintenance ?? s.pendingMaintenance ?? 0),
  byBlock: unwrapList<any>(s.by_block ?? s.byBlock).map((b) => ({
    id: String(b.id),
    blockName: b.block_name ?? b.blockName ?? "",
    genderType: (b.gender_type ?? b.genderType ?? "M") as DormGenderType,
    totalRooms: Number(b.total_rooms ?? b.totalRooms ?? 0),
    availableRooms: Number(b.available_rooms ?? b.availableRooms ?? 0),
    totalBeds: Number(b.total_beds ?? b.totalBeds ?? 0),
    occupiedBeds: Number(b.occupied_beds ?? b.occupiedBeds ?? 0),
    availableBeds: Number(b.available_beds ?? b.availableBeds ?? 0),
    occupancyRate: Number(b.occupancy_rate ?? b.occupancyRate ?? 0),
  })),
});

// ---------- BLOCKS ----------
export const getDormBlocks = (): Promise<DormBlock[]> =>
  api.get("/dormitories/dorm-blocks/").then((r) => unwrapList<any>(r.data).map(mapBlock));

export const createDormBlock = (payload: {
  block_name: string;
  gender_type: DormGenderType;
  total_rooms?: number;
}): Promise<DormBlock> =>
  api.post("/dormitories/dorm-blocks/", payload).then((r) => mapBlock(r.data));

export const updateDormBlock = (
  id: string,
  payload: Partial<{ block_name: string; gender_type: DormGenderType; total_rooms: number }>
): Promise<DormBlock> =>
  api.patch(`/dormitories/dorm-blocks/${numericId(id)}/`, payload).then((r) => mapBlock(r.data));

export const deleteDormBlock = (id: string): Promise<void> =>
  api.delete(`/dormitories/dorm-blocks/${numericId(id)}/`).then(() => undefined);

export const getDormStats = (): Promise<DormStats> =>
  api.get("/dormitories/dorm-blocks/stats/").then((r) => mapStats(r.data));

// ---------- ROOMS ----------
export const getDormRooms = (): Promise<DormRoom[]> =>
  api.get("/dormitories/dorm-rooms/").then((r) => unwrapList<any>(r.data).map(mapRoom));

export const getAvailableDormRooms = (): Promise<DormRoom[]> =>
  api
    .get("/dormitories/dorm-rooms/available-rooms/")
    .then((r) => unwrapList<any>(r.data).map(mapRoom));

export const createDormRoom = (payload: {
  block: string | number;
  room_number: string;
  capacity: number;
}): Promise<DormRoom> =>
  api.post("/dormitories/dorm-rooms/", payload).then((r) => mapRoom(r.data));

export const updateDormRoom = (
  id: string,
  payload: Partial<{ block: string | number; room_number: string; capacity: number }>
): Promise<DormRoom> =>
  api.patch(`/dormitories/dorm-rooms/${numericId(id)}/`, payload).then((r) => mapRoom(r.data));

export const deleteDormRoom = (id: string): Promise<void> =>
  api.delete(`/dormitories/dorm-rooms/${numericId(id)}/`).then(() => undefined);

// ---------- ASSIGNMENTS ----------
export const getDormAssignments = (): Promise<DormAssignment[]> =>
  api
    .get("/dormitories/dorm-assignments/")
    .then((r) => unwrapList<any>(r.data).map(mapAssignment));

export const getMyDormAssignment = async (): Promise<DormAssignment | null> => {
  const { data } = await api.get("/dormitories/dorm-assignments/my-assignment/");
  return data ? mapAssignment(data) : null;
};

export const assignDormRoom = (payload: {
  room: string | number;
  student?: string | number;
  assigned_date?: string;
  academic_year?: string;
}): Promise<DormAssignment> =>
  api.post("/dormitories/dorm-assignments/assign-room/", payload).then((r) => mapAssignment(r.data));

export const terminateDormAssignment = (id: string): Promise<DormAssignment> =>
  api
    .post(`/dormitories/dorm-assignments/${numericId(id)}/terminate/`)
    .then((r) => mapAssignment(r.data));

export const deleteDormAssignment = (id: string): Promise<void> =>
  api.delete(`/dormitories/dorm-assignments/${numericId(id)}/`).then(() => undefined);

// ---------- MAINTENANCE ----------
export const getDormMaintenanceRequests = (): Promise<DormMaintenanceRequest[]> =>
  api
    .get("/dormitories/dorm-maintenance/")
    .then((r) => unwrapList<any>(r.data).map(mapMaintenance));

export const createDormMaintenanceRequest = (payload: {
  room: string | number;
  issue_description: string;
}): Promise<DormMaintenanceRequest> =>
  api.post("/dormitories/dorm-maintenance/", payload).then((r) => mapMaintenance(r.data));

export const updateDormMaintenanceRequest = (
  id: string,
  payload: Partial<{ status: DormMaintenanceStatus; issue_description: string }>
): Promise<DormMaintenanceRequest> =>
  api
    .patch(`/dormitories/dorm-maintenance/${numericId(id)}/`, payload)
    .then((r) => mapMaintenance(r.data));

export const deleteDormMaintenanceRequest = (id: string): Promise<void> =>
  api
    .delete(`/dormitories/dorm-maintenance/${numericId(id)}/`)
    .then(() => undefined);
