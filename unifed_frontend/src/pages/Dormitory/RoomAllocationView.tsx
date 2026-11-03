import { useCallback, useEffect, useMemo, useState } from "react";
import type { DormAssignment, DormBlock, DormRoom, User } from "../../types";
import { CampusDatabase } from "../../services/api";
import {
  assignDormRoom,
  getDormAssignments,
  getDormBlocks,
  getDormRooms,
  getMyDormAssignment,
  terminateDormAssignment,
} from "../../services/dormService";
import {
  AlertTriangle,
  ArrowRightLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  DoorOpen,
  Home,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

interface RoomAllocationViewProps {
  user: User;
  isManager?: boolean;
}

const genderLabel = (gender?: string) => (gender === "F" ? "Female" : "Male");

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";

export function RoomAllocationView({ user, isManager = false }: RoomAllocationViewProps) {
  const [blocks, setBlocks] = useState<DormBlock[]>([]);
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [assignments, setAssignments] = useState<DormAssignment[]>([]);
  const [myAssignment, setMyAssignment] = useState<DormAssignment | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("ALL");
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyRoomId, setBusyRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [blocksRes, roomsRes, assignmentsRes, myRes, usersRes] = await Promise.allSettled([
        getDormBlocks(),
        getDormRooms(),
        isManager ? getDormAssignments() : Promise.resolve([]),
        getMyDormAssignment(),
        isManager ? CampusDatabase.getUsers() : Promise.resolve([]),
      ]);

      setBlocks(blocksRes.status === "fulfilled" ? blocksRes.value : []);
      setRooms(roomsRes.status === "fulfilled" ? roomsRes.value : []);
      setAssignments(assignmentsRes.status === "fulfilled" ? assignmentsRes.value : []);
      setMyAssignment(myRes.status === "fulfilled" ? myRes.value : null);
      setStudents(
        usersRes.status === "fulfilled"
          ? (usersRes.value as User[]).filter((entry) => entry.role === "STUDENT")
          : []
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Unable to load room data.");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    load();
  }, [load]);

  const activeAssignments = useMemo(() => {
    if (isManager) {
      return assignments.filter((assignment) => assignment.status === "ACTIVE");
    }
    return myAssignment && myAssignment.status === "ACTIVE" ? [myAssignment] : [];
  }, [assignments, isManager, myAssignment]);

  const activeByStudent = useMemo(() => {
    const map: Record<string, DormAssignment> = {};
    activeAssignments.forEach((assignment) => {
      map[String(assignment.student)] = assignment;
    });
    return map;
  }, [activeAssignments]);

  const activeByRoom = useMemo(() => {
    const map: Record<string, DormAssignment> = {};
    activeAssignments.forEach((assignment) => {
      map[String(assignment.room)] = assignment;
    });
    return map;
  }, [activeAssignments]);

  const selectedStudent = students.find(
    (student) => String(student.id).replace(/\D/g, "") === selectedStudentId
  );
  const selectedStudentAssignment = selectedStudent
    ? activeByStudent[String(selectedStudent.id).replace(/\D/g, "")]
    : undefined;

  const visibleRooms = rooms.filter((room) => {
    if (selectedBlock !== "ALL" && room.block !== selectedBlock) return false;
    if (onlyAvailable && !room.isAvailable) return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack = `${room.roomNumber} ${room.blockName ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const handleAssign = async (room: DormRoom) => {
    if (isManager && !selectedStudentId) {
      setError("Select a student before assigning a room.");
      return;
    }

    setBusyRoomId(room.id);
    setError("");
    setNotice("");
    try {
      const payload: {
        room: string;
        assigned_date: string;
        academic_year: string;
        student?: string;
      } = {
        room: room.id,
        assigned_date: new Date().toISOString().split("T")[0],
        academic_year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      };
      if (isManager) payload.student = selectedStudentId;
      const assignment = await assignDormRoom(payload);
      setNotice(
        `${isManager ? assignment.studentName : "You"} assigned to ${assignment.blockName} · Room ${assignment.roomNumber}.`
      );
      await load();
    } catch (err: any) {
      const data = err?.response?.data;
      setError(
        data?.error ||
          data?.room?.[0] ||
          data?.student?.[0] ||
          err?.message ||
          "Could not assign this room."
      );
    } finally {
      setBusyRoomId(null);
    }
  };

  const handleTerminate = async (assignment: DormAssignment) => {
    if (!window.confirm(`Check ${assignment.studentName} out of Room ${assignment.roomNumber}?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await terminateDormAssignment(assignment.id);
      setNotice(`${assignment.studentName} checked out of Room ${assignment.roomNumber}.`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Could not check out this student.");
    }
  };

  const assigneeLabel = isManager ? selectedStudent?.fullName : user.fullName;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-primary" /> Room Allocation
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Browse beds by block, occupy an available room, and manage active assignments.
            Occupancy updates automatically as students check in or out.
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

      {!isManager && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            myAssignment
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-dashed border-slate-300 bg-slate-50/70"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                myAssignment ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-400"
              }`}
            >
              <Home className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                My housing status
              </p>
              {myAssignment ? (
                <>
                  <p className="font-display font-bold text-slate-900 text-sm">
                    {myAssignment.blockName} · Room {myAssignment.roomNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {myAssignment.academicYear || "Current academic year"} ·{" "}
                    {myAssignment.status.toLowerCase()}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display font-bold text-slate-800 text-sm">
                    You do not have a room yet
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Choose an available room below to send an allocation request.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isManager && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="block flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Student to house
              </span>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select student…</option>
                {students.map((student) => {
                  const numeric = String(student.id).replace(/\D/g, "");
                  const existing = activeByStudent[numeric];
                  return (
                    <option key={student.id} value={numeric}>
                      {student.fullName}
                      {student.studentId ? ` (${student.studentId})` : ""}
                      {existing ? " — housed" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            {selectedStudentAssignment && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800 sm:max-w-xs">
                Currently in {selectedStudentAssignment.blockName} · Room{" "}
                {selectedStudentAssignment.roomNumber}. Assigning another room will transfer the
                student and free the old bed.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search room number or block…"
              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={selectedBlock}
            onChange={(event) => setSelectedBlock(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ALL">All blocks</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.blockName} ({genderLabel(block.genderType)})
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(event) => setOnlyAvailable(event.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary/30"
            />
            Available beds only
          </label>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
          Loading rooms…
        </div>
      ) : visibleRooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <DoorOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">
            No rooms match the current filters. Try another block or turn off the availability
            filter.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {visibleRooms.map((room) => {
            const assigned = activeByRoom[room.id];
            const isMine =
              !isManager &&
              String(assigned?.student ?? "") === String(user.id).replace(/\D/g, "");
            const occupancyRate = room.capacity
              ? Math.min(100, Math.round((room.currentOccupantsCount / room.capacity) * 100))
              : 0;
            const canAssign = room.isAvailable && room.availableBeds > 0 && !isMine;

            return (
              <div
                key={room.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {room.blockName}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          room.genderType === "F"
                            ? "bg-pink-50 text-pink-700 border-pink-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {genderLabel(room.genderType)}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-base mt-0.5">
                      Room {room.roomNumber}
                    </h3>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                      isMine
                        ? "bg-primary/10 text-primary border-primary/30"
                        : room.isAvailable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isMine ? "YOUR ROOM" : room.isAvailable ? "AVAILABLE" : "FULL"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.currentOccupantsCount}/{room.capacity} beds
                  </span>
                  <span>{room.availableBeds} free</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      occupancyRate >= 100
                        ? "bg-rose-500"
                        : occupancyRate >= 60
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>

                {assigned && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[8px] font-bold flex items-center justify-center">
                      {initials(assigned.studentName)}
                    </span>
                    <span className="text-[10px] text-slate-600 truncate">{assigned.studentName}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canAssign || busyRoomId === room.id}
                  onClick={() => handleAssign(room)}
                  className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold py-2 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    isMine
                      ? "bg-slate-100 text-slate-500"
                      : room.isAvailable
                        ? "bg-primary hover:bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isMine ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Allocated to you
                    </>
                  ) : busyRoomId === room.id ? (
                    "Assigning…"
                  ) : myAssignment && !isManager ? (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer here
                    </>
                  ) : (
                    <>
                      <BedDouble className="w-3.5 h-3.5" /> Request bed
                    </>
                  )}
                </button>

                {isManager && (
                  <p className="mt-1.5 text-[9px] text-slate-400 text-center">
                    {selectedStudent ? `Assign ${selectedStudent.fullName}` : "Select a student above"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isManager && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-500" /> Active Assignments
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {activeAssignments.length} housed
            </span>
          </div>
          {activeAssignments.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 italic">No active assignments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-[10px]">
                    <th className="p-3">Student</th>
                    <th className="p-3">Block / Room</th>
                    <th className="p-3">Academic Year</th>
                    <th className="p-3">Assigned</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50/40">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {assignment.studentName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ID: {assignment.student}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {assignment.blockName} · {assignment.roomNumber}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {assignment.academicYear || "—"}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {formatDate(assignment.assignedDate)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTerminate(assignment)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] font-semibold cursor-pointer"
                        >
                          Check out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {assigneeLabel && (
        <p className="text-[10px] text-slate-400 text-center">
          <Building2 className="w-3 h-3 inline mr-1" />
          Requests are recorded against {assigneeLabel}.
        </p>
      )}
    </div>
  );
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};
