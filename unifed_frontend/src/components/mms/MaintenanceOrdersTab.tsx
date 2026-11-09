import { useState, FormEvent } from "react";
import { MaintenanceWorkOrder, FixedAssetItem, User } from "../../types";
import { CampusDatabase } from "../../services/api"; // 👈 UPDATED THIS LINE
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
  Hammer,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MaintenanceOrdersTabProps {
  user: User;
  fixedAssets: FixedAssetItem[];
  workOrders: MaintenanceWorkOrder[];
  onRefresh: () => void;
}

const STATUS_ORDER: MaintenanceWorkOrder["status"][] = [
  "REPORTED",
  "DIAGNOSIS",
  "IN_REPAIR",
  "REPAIRED"
];

export function MaintenanceOrdersTab({
  user,
  fixedAssets,
  workOrders,
  onRefresh
}: MaintenanceOrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<MaintenanceWorkOrder | null>(null);
  const [activeJobCard, setActiveJobCard] = useState<MaintenanceWorkOrder | null>(null);

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState(user.fullName);
  const [reportedDept, setReportedDept] = useState("Software Engineering");
  const [faultDesc, setFaultDesc] = useState("");
  const [urgency, setUrgency] = useState<MaintenanceWorkOrder["urgency"]>("MEDIUM");
  const [estimatedCost, setEstimatedCost] = useState<number>(2000);

  // Action Modal State
  const [newStatus, setNewStatus] = useState<MaintenanceWorkOrder["status"]>("DIAGNOSIS");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [actualCost, setActualCost] = useState<number>(0);

  const filteredOrders = workOrders.filter((wo) => {
    const matchesQuery =
      wo.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.assetTag && wo.assetTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      wo.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.reportedDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.faultDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || wo.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = fixedAssets.find((a) => a.id === assetId);
    if (asset) {
      setEquipmentName(asset.name);
      setLocation(asset.location);
      setReportedDept(asset.custodianDepartment);
    }
  };

  const handleCreateOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim() || !faultDesc.trim()) {
      alert("Please provide equipment name and fault description.");
      return;
    }

    const orderNum = `WO-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const assetObj = fixedAssets.find((a) => a.id === selectedAssetId);

    const newOrder: MaintenanceWorkOrder = {
      id: "WO_" + Date.now(),
      orderNumber: orderNum,
      assetId: assetObj ? assetObj.id : undefined,
      assetTag: assetObj ? assetObj.assetTag : undefined,
      equipmentName: equipmentName.trim(),
      location: location.trim() || "University Campus",
      reportedBy: reportedBy.trim(),
      reportedDepartment: reportedDept.trim(),
      reportedDate: new Date().toISOString().split("T")[0],
      faultDescription: faultDesc.trim(),
      urgency,
      status: "REPORTED",
      estimatedCostETB: Number(estimatedCost)
    };

    CampusDatabase.addMaintenanceOrder(newOrder);
    onRefresh();
    setShowNewModal(false);

    // Reset Form
    setSelectedAssetId("");
    setEquipmentName("");
    setLocation("");
    setFaultDesc("");
    setEstimatedCost(2000);

    alert(`Maintenance Work Order ${orderNum} created and dispatched to Central Maintenance Workshop.`);
  };

  const handleUpdateStatus = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAction) return;

    CampusDatabase.updateMaintenanceOrderStatus(
      selectedOrderForAction.id,
      newStatus,
      technicianNotes,
      newStatus === "REPAIRED" ? Number(actualCost) : undefined
    );

    onRefresh();
    setSelectedOrderForAction(null);
    setTechnicianNotes("");
    setActualCost(0);

    alert(`Work Order status updated to ${newStatus}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Equipment Maintenance & Repair Orders (የዕቃ ጥገና መጠየቂያ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              WORKSHOP DISPATCH
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log equipment faults, assign specialized technicians, and record repair spare parts costs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Maintenance Order</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search work order #, equipment, asset tag, technician, or fault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(["ALL", "REPORTED", "DIAGNOSIS", "IN_REPAIR", "REPAIRED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? "All Orders" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Equipment & Tag</th>
                <th className="py-3 px-4">Fault Description & Urgency</th>
                <th className="py-3 px-4">Technician Assigned</th>
                <th className="py-3 px-4">Status Pipeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No equipment maintenance work orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {wo.orderNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{wo.reportedDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{wo.equipmentName}</span>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 font-mono">
                          {wo.assetTag && <span className="text-primary dark:text-amber-400 font-bold">{wo.assetTag}</span>}
                          <span>•</span>
                          <span>{wo.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{wo.faultDescription}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            wo.urgency === "HIGH" || wo.urgency === "CAMPUS_HALTING"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                              : wo.urgency === "MEDIUM"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {wo.urgency}
                        </span>
                        <span className="text-[10px] text-slate-400">By: {wo.reportedBy}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {wo.assignedTechnician ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{wo.assignedTechnician}</span>
                          {wo.actualCostETB ? (
                            <span className="block text-[10px] font-mono text-emerald-600 font-bold">
                              Cost: {wo.actualCostETB.toLocaleString()} ETB
                            </span>
                          ) : (
                            <span className="block text-[10px] font-mono text-slate-400">
                              Est: {wo.estimatedCostETB.toLocaleString()} ETB
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {/* Step Progress Pill */}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          wo.status === "REPAIRED"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : wo.status === "IN_REPAIR"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse"
                            : wo.status === "DIAGNOSIS"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {wo.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveJobCard(wo)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                          title="Print Workshop Job Card"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForAction(wo);
                            setNewStatus(wo.status === "REPORTED" ? "DIAGNOSIS" : wo.status === "DIAGNOSIS" ? "IN_REPAIR" : "REPAIRED");
                            setTechnicianNotes(wo.technicianNotes || "");
                            setActualCost(wo.actualCostETB || wo.estimatedCostETB);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary hover:bg-primary-dark text-white transition flex items-center space-x-1"
                        >
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: LOG MAINTENANCE WORK ORDER */}
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
                  <Wrench className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Log Equipment Maintenance Work Order</h3>
                    <p className="text-[11px] text-amber-300 font-mono">የዕቃ ጥገና መጠየቂያ ቅጽ</p>
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

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Select University Fixed Asset (Optional):
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handleSelectAsset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    <option value="">-- Or enter custom un-tagged device below --</option>
                    {fixedAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.assetTag} • {a.name} ({a.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Equipment / Device Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rigol Digital Oscilloscope"
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Location / Room *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Block C, Room 204"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Reported By *</label>
                    <input
                      type="text"
                      required
                      value={reportedBy}
                      onChange={(e) => setReportedBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Department / Directorate *</label>
                    <input
                      type="text"
                      required
                      value={reportedDept}
                      onChange={(e) => setReportedDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Fault Description & Symptoms *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe failure, error codes, burning smell, screen behavior, or physical damage..."
                    value={faultDesc}
                    onChange={(e) => setFaultDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Urgency Level *</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="LOW">Low (Routine)</option>
                      <option value="MEDIUM">Medium (Lab Scheduled Soon)</option>
                      <option value="HIGH">High (Active Course In Progress)</option>
                      <option value="CAMPUS_HALTING">Critical (Facility Stoppage)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Est. Repair Budget (ETB) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
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
                    Dispatch Work Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: UPDATE WORK ORDER STATUS & COST */}
      <AnimatePresence>
        {selectedOrderForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-amber-400">
                  UPDATE WORK ORDER: {selectedOrderForAction.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForAction(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedOrderForAction.equipmentName}</p>
                  <p className="text-slate-500 text-[11px]">{selectedOrderForAction.faultDescription}</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Advance Workflow Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="REPORTED">REPORTED (Received at Workshop)</option>
                    <option value="DIAGNOSIS">DIAGNOSIS (Component Inspection)</option>
                    <option value="IN_REPAIR">IN_REPAIR (Soldering / Replacement in Progress)</option>
                    <option value="REPAIRED">REPAIRED (Passed QA & Ready for Return)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Technician Progress Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Replaced power transistors, updated firmware, cleaned cooling assembly..."
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {newStatus === "REPAIRED" && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Actual Spare Parts & Labor Cost (ETB)</label>
                    <input
                      type="number"
                      min={0}
                      value={actualCost}
                      onChange={(e) => setActualCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForAction(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold"
                  >
                    Save Status Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRINT WORKSHOP JOB CARD */}
      <AnimatePresence>
        {activeJobCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">
                  WORKSHOP MAINTENANCE JOB CARD
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveJobCard(null)}
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
                  <div className="inline-block border border-slate-900 px-3 py-0.5 rounded mt-1 font-mono font-bold text-xs bg-slate-100">
                    CENTRAL WORKSHOP EQUIPMENT REPAIR JOB CARD (የጥገና ካርድ)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Job Order No:</strong> <span className="font-mono font-bold">{activeJobCard.orderNumber}</span></div>
                    <div><strong>Equipment Name:</strong> {activeJobCard.equipmentName}</div>
                    {activeJobCard.assetTag && (
                      <div><strong>Fixed Asset Tag:</strong> <span className="font-mono">{activeJobCard.assetTag}</span></div>
                    )}
                    <div><strong>Location / Room:</strong> {activeJobCard.location}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Reported:</strong> <span className="font-mono">{activeJobCard.reportedDate}</span></div>
                    <div><strong>Reported By:</strong> {activeJobCard.reportedBy}</div>
                    <div><strong>Department:</strong> {activeJobCard.reportedDepartment}</div>
                    <div><strong>Urgency:</strong> <span className="font-mono font-bold">{activeJobCard.urgency}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans text-xs space-y-1">
                  <span className="font-bold text-slate-900">Fault Description & Symptoms:</span>
                  <p className="text-slate-700 leading-relaxed font-sans text-xs">
                    {activeJobCard.faultDescription}
                  </p>
                </div>

                {activeJobCard.technicianNotes && (
                  <div className="bg-emerald-50 p-3 rounded border border-emerald-200 font-sans text-xs space-y-1">
                    <span className="font-bold text-emerald-900">Technician Diagnostic & Repair Notes:</span>
                    <p className="text-emerald-800 leading-relaxed font-sans text-xs">
                      {activeJobCard.technicianNotes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 font-sans text-xs pt-2">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-mono block">ESTIMATED COST:</span>
                    <span className="font-mono font-bold text-slate-900">{activeJobCard.estimatedCostETB.toLocaleString()} ETB</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">FINAL REPAIR COST:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {activeJobCard.actualCostETB ? `${activeJobCard.actualCostETB.toLocaleString()} ETB` : "In Progress"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Workshop Chief / Assigned Tech:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeJobCard.assignedTechnician || "Lead Electronics Specialist"}</p>
                      <p className="text-[10px] text-slate-400">Signature</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Property Administration Clearance:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">Solomon Kassa (Store Officer)</p>
                      <p className="text-[10px] text-slate-400">Sign & Stamp</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={() => setActiveJobCard(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
