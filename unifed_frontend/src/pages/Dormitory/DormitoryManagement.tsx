import { useState } from "react";
import type { User } from "../../types";
import { DormDashboard } from "./DormDashboard";
import { RoomAllocationView } from "./RoomAllocationView";
import { MaintenancePortal } from "./MaintenancePortal";
import { BedDouble, Building2, LayoutDashboard, Wrench } from "lucide-react";

type DormView = "overview" | "rooms" | "maintenance";

interface DormitoryManagementProps {
  user: User;
}

const TABS: {
  id: DormView;
  label: string;
  shortLabel: string;
  Icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: "Dormitory Overview", shortLabel: "Overview", Icon: LayoutDashboard },
  { id: "rooms", label: "Room Allocation", shortLabel: "Rooms", Icon: BedDouble },
  { id: "maintenance", label: "Maintenance Portal", shortLabel: "Maintenance", Icon: Wrench },
];

export function DormitoryManagement({ user }: DormitoryManagementProps) {
  const [view, setView] = useState<DormView>("overview");
  const isManager = user.role === "ADMIN" || user.role === "REGISTRAR";

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white shadow-lg">
        <div className="absolute -top-10 right-0 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-200/80">
                Student Services · Residential Life
              </p>
              <h1 className="font-display font-bold text-xl sm:text-2xl mt-0.5">
                Dormitory Management
              </h1>
              <p className="text-blue-200/80 text-xs mt-1 max-w-xl">
                {isManager
                  ? "Manage blocks and rooms, allocate beds, and track repair work across campus residences."
                  : "Find your bed, review your housing status, and report maintenance issues in one place."}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-blue-100">
            {isManager ? "Dormitory Administrator" : "Resident Portal"}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
        {TABS.map(({ id, label, shortLabel, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              view === id
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {view === "overview" && <DormDashboard user={user} onNavigate={setView} />}
      {view === "rooms" && <RoomAllocationView user={user} isManager={isManager} />}
      {view === "maintenance" && <MaintenancePortal user={user} isManager={isManager} />}
    </div>
  );
}

export default DormitoryManagement;
