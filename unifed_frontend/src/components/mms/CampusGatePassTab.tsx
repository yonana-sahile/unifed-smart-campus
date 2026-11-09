import { useState, FormEvent } from "react";
import { CampusGatePassRecord, User } from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  X,
  FileText,
  Eye,
  Truck,
  QrCode,
  Barcode,
  Calendar,
  AlertTriangle,
  Building,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CampusGatePassTabProps {
  user: User;
  gatePasses: CampusGatePassRecord[];
  onRefresh: () => void;
}

export function CampusGatePassTab({
  user,
  gatePasses,
  onRefresh
}: CampusGatePassTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [activePass, setActivePass] = useState<CampusGatePassRecord | null>(null);

  // Form State
  const [bearerName, setBearerName] = useState("");
  const [bearerRole, setBearerRole] = useState("University Logistics Driver");
  const [bearerIdCard, setBearerIdCard] = useState("");
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState<CampusGatePassRecord["purpose"]>("INTER_CAMPUS_TRANSFER");
  const [gateName, setGateName] = useState<CampusGatePassRecord["gateName"]>("MAIN_GATE_1");
  const [itemsDescription, setItemsDescription] = useState("");
  const [itemCount, setItemCount] = useState<number>(1);
  const [validityDays, setValidityDays] = useState<number>(2);

  const filteredPasses = gatePasses.filter((gp) => {
    const matchesQuery =
      gp.gatePassNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gp.bearerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gp.vehiclePlateNumber && gp.vehiclePlateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      gp.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gp.itemsDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || gp.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleCreateGatePass = (e: FormEvent) => {
    e.preventDefault();
    if (!bearerName.trim() || !destination.trim() || !itemsDescription.trim()) {
      alert("Please fill in bearer, destination, and items description.");
      return;
    }

    const passNum = `GP-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const newPass: CampusGatePassRecord = {
      id: "GP_" + Date.now(),
      gatePassNumber: passNum,
      bearerName: bearerName.trim(),
      bearerRole: bearerRole.trim(),
      bearerIdCard: bearerIdCard.trim() || "MAU-AUTH-PASS",
      vehiclePlateNumber: vehiclePlateNumber.trim() || undefined,
      destination: destination.trim(),
      purpose,
      authorizedBy: `${user.fullName} (Store Officer)`,
      authorizedDate: now.toISOString().replace("T", " ").substring(0, 16),
      validUntil: expiry.toISOString().replace("T", " ").substring(0, 16),
      itemsDescription: itemsDescription.trim(),
      itemCount: Number(itemCount),
      gateName,
      status: "AUTHORIZED"
    };

    CampusDatabase.addCampusGatePass(newPass);
    onRefresh();
    setShowNewModal(false);

    // Reset Form
    setBearerName("");
    setBearerIdCard("");
    setVehiclePlateNumber("");
    setDestination("");
    setItemsDescription("");
    setItemCount(1);

    alert(`Campus Security Gate Pass ${passNum} generated! Pass valid until ${newPass.validUntil}.`);
  };

  const handleSecurityCheckOut = (passId: string) => {
    const guardName = prompt("Campus Security Guard Station: Enter guard on-duty name:", "Sergeant Tadesse G.");
    if (guardName) {
      CampusDatabase.updateGatePassStatus(passId, "CHECKED_OUT", guardName);
      onRefresh();
      alert("Security Check-Out confirmed! Material exit logged at campus perimeter gate.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Campus Security Gate Pass (የዕቃ መውጫ ፈቃድ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              SECURITY DIRECTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorizes physical equipment, transfer deliveries, or research instruments leaving university gates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Gate Pass</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gate pass #, vehicle plate, bearer name, destination, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(["ALL", "AUTHORIZED", "CHECKED_OUT"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? "All Passes" : st === "AUTHORIZED" ? "Authorized (Pending Exit)" : "Checked Out"}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Passes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Gate Pass #</th>
                <th className="py-3 px-4">Bearer & Vehicle</th>
                <th className="py-3 px-4">Destination & Purpose</th>
                <th className="py-3 px-4">Items Permitted</th>
                <th className="py-3 px-4">Gate & Validity</th>
                <th className="py-3 px-4">Security Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No campus security gate passes found.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Barcode className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {pass.gatePassNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Auth: {pass.authorizedDate.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{pass.bearerName}</span>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <span>{pass.bearerRole}</span>
                          {pass.vehiclePlateNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {pass.vehiclePlateNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{pass.destination}</span>
                        <div className="text-[10px] font-mono text-slate-500">
                          {pass.purpose.replace(/_/g, " ")}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{pass.itemsDescription}</p>
                      <span className="text-[10px] font-mono text-slate-500">
                        {pass.itemCount} items authorized
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px]">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        {pass.gateName.replace(/_/g, " ")}
                      </div>
                      <div className="text-slate-500">Valid to: {pass.validUntil}</div>
                    </td>
                    <td className="py-3 px-4">
                      {pass.status === "CHECKED_OUT" ? (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>EXITED GATE</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>AUTHORIZED</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setActivePass(pass)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
                          title="Print / View Gate Pass"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Pass</span>
                        </button>
                        {pass.status === "AUTHORIZED" && (
                          <button
                            type="button"
                            onClick={() => handleSecurityCheckOut(pass.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1"
                            title="Guard Station Check-Out"
                          >
                            <Check className="w-3 h-3" />
                            <span>Gate Check-Out</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: GENERATE GATE PASS */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Generate Campus Security Gate Pass</h3>
                    <p className="text-[11px] text-amber-300 font-mono">የዕቃ መውጫ ፈቃድ ሰነድ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGatePass} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Bearer Name (ሹፌር / ተሸካሚ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hailu Bekele or Girma Worku"
                      value={bearerName}
                      onChange={(e) => setBearerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Bearer Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={bearerRole}
                      onChange={(e) => setBearerRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Staff ID / Driver License #</label>
                    <input
                      type="text"
                      placeholder="e.g. MAU-STAFF-9021"
                      value={bearerIdCard}
                      onChange={(e) => setBearerIdCard(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Vehicle Plate # (If motorized)</label>
                    <input
                      type="text"
                      placeholder="e.g. 4-38912 ET (or leave blank if on foot)"
                      value={vehiclePlateNumber}
                      onChange={(e) => setVehiclePlateNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Destination *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masha Satellite Campus Store"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Purpose *</label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="INTER_CAMPUS_TRANSFER">Inter-Campus Store Transfer</option>
                      <option value="EXTERNAL_REPAIR_CALIBRATION">External Repair & Calibration</option>
                      <option value="FIELD_RESEARCH">Field Research & Community Service</option>
                      <option value="DISPOSAL_WRITE_OFF">Authorized Disposal / Scrap Write-Off</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Items Description & Serial Numbers *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 10x Dell OptiPlex Desktops & 20x Boxes A4 Paper per Model 21 Transfer M21-2026-002"
                    value={itemsDescription}
                    onChange={(e) => setItemsDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Item Count *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={itemCount}
                      onChange={(e) => setItemCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Authorized Gate *</label>
                    <select
                      value={gateName}
                      onChange={(e) => setGateName(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    >
                      <option value="MAIN_GATE_1">Main Gate 1 (Front Entrance)</option>
                      <option value="EAST_GATE_COMMERCIAL">East Gate (Logistics & Heavy)</option>
                      <option value="SCIENCE_GATE_3">Science Gate 3 (Tech Complex)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Validity (Days) *</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      required
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold"
                  >
                    Authorize & Issue Pass
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRINT OFFICIAL GATE PASS */}
      <AnimatePresence>
        {activePass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">
                  OFFICIAL CAMPUS SECURITY EXIT PASS
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Gate Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePass(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto text-xs font-serif">
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center justify-center space-x-3 mb-1">
                    <EthiopianFlag className="w-6 h-4 rounded-xs" />
                    <UniversitySeal className="w-10 h-10" />
                  </div>
                  <h2 className="font-bold text-[11px] uppercase tracking-wide">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <div className="inline-block border border-slate-900 px-3 py-0.5 rounded mt-1 font-mono font-bold text-xs bg-amber-50">
                    CAMPUS SECURITY EXIT GATE PASS (የዕቃ መውጫ ፈቃድ)
                  </div>
                </div>

                {/* Barcode & Pass Serial Container */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">GATE PASS IDENTIFIER:</span>
                    <p className="font-mono font-black text-base text-slate-900 tracking-wider">
                      {activePass.gatePassNumber}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Authorized Gate: <strong>{activePass.gateName.replace(/_/g, " ")}</strong>
                    </p>
                  </div>
                  {/* SVG Code 128 Simulation */}
                  <div className="text-right">
                    <div className="inline-flex items-center h-9 space-x-0.5 px-2 bg-white border border-slate-300 rounded">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4].map((w, i) => (
                        <span
                          key={i}
                          className="bg-slate-900 h-7 inline-block"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    <span className="block font-mono text-[9px] text-slate-500 text-center mt-0.5">
                      *{activePass.gatePassNumber}*
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Bearer Name:</strong> {activePass.bearerName}</div>
                    <div><strong>Role / Capacity:</strong> {activePass.bearerRole}</div>
                    <div><strong>Bearer ID Card:</strong> <span className="font-mono">{activePass.bearerIdCard}</span></div>
                    {activePass.vehiclePlateNumber && (
                      <div><strong>Vehicle Plate No:</strong> <span className="font-mono font-bold">{activePass.vehiclePlateNumber}</span></div>
                    )}
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Destination:</strong> {activePass.destination}</div>
                    <div><strong>Purpose:</strong> {activePass.purpose.replace(/_/g, " ")}</div>
                    <div><strong>Authorized Date:</strong> <span className="font-mono">{activePass.authorizedDate}</span></div>
                    <div><strong>Valid Until:</strong> <span className="font-mono font-bold text-rose-700">{activePass.validUntil}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Authorized Items to Exit:</span>
                    <span className="font-mono">Qty: {activePass.itemCount}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-mono text-[11px]">
                    {activePass.itemsDescription}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[10px] font-sans text-amber-900 space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Instructions for University Security Guards at Gate:</span>
                  </p>
                  <p>
                    1. Check vehicle interior and trunk against itemized list above. <br />
                    2. Verify driver identity against institutional Staff ID or driving license. <br />
                    3. Do not permit exit if timestamp exceeds validity threshold or serials mismatch.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Authorized By (Property Officer):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activePass.authorizedBy}</p>
                      <p className="text-[10px] text-slate-400">Official Directorate Seal</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Guard Inspection & Check-Out:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">
                        {activePass.guardName || "Pending Gate Verification"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Exit Timestamp: {activePass.securityExitTimestamp || "Pending Exit"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={() => setActivePass(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Pass
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
