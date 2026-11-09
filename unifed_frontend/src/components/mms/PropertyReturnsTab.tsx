import { useState, FormEvent } from "react";
import {
  PropertyReturnRecord,
  MaterialInventoryItem,
  User,
  MaintenanceWorkOrder
} from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  X,
  FileText,
  Eye,
  Wrench,
  Trash2,
  Boxes,
  GraduationCap,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PropertyReturnsTabProps {
  user: User;
  inventory: MaterialInventoryItem[];
  returns: PropertyReturnRecord[];
  onRefresh: () => void;
}

const WAREHOUSE_OPTIONS = [
  "Central Warehouse (Main Campus)",
  "Science & Engineering Lab Store",
  "Health Sciences & Clinic Store",
  "Dormitory & Facilities Depot",
  "Masha Satellite Campus Store"
];

export function PropertyReturnsTab({
  user,
  inventory,
  returns,
  onRefresh
}: PropertyReturnsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<PropertyReturnRecord | null>(null);

  // Form State
  const [returnerType, setReturnerType] = useState<PropertyReturnRecord["returnerType"]>("FACULTY");
  const [returnerName, setReturnerName] = useState("");
  const [returnerId, setReturnerId] = useState("");
  const [department, setDepartment] = useState("Software Engineering");
  const [warehouseLocation, setWarehouseLocation] = useState(WAREHOUSE_OPTIONS[0]);
  const [reason, setReason] = useState<PropertyReturnRecord["reason"]>("SEMESTER_COMPLETION");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [returnQty, setReturnQty] = useState<number>(1);
  const [itemCondition, setItemCondition] = useState<"REUSABLE_GOOD" | "MINOR_REPAIR_NEEDED" | "SCRAP_UNUSABLE">("REUSABLE_GOOD");
  const [restockDecision, setRestockDecision] = useState<"RESTOCK_TO_STORE" | "SEND_TO_MAINTENANCE" | "SCRAP_DISPOSAL">("RESTOCK_TO_STORE");
  const [notes, setNotes] = useState("");

  const filteredReturns = returns.filter((r) => {
    const matchesQuery =
      r.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.returnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.items.some((it) => it.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesReason = reasonFilter === "ALL" || r.reason === reasonFilter;
    return matchesQuery && matchesReason;
  });

  const handleRegisterReturn = (e: FormEvent) => {
    e.preventDefault();
    if (!returnerName.trim()) {
      alert("Please provide the returner's full name.");
      return;
    }

    const itemObj = inventory.find((it) => it.id === selectedItemId);
    const itemName = itemObj ? itemObj.name : (customItemName.trim() || "Returned University Property");
    const itemCode = itemObj ? itemObj.itemCode : `MMS-RET-${Math.floor(Math.random() * 900 + 100)}`;
    const unit = itemObj ? itemObj.unit : "units";

    const voucherNum = `M23-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const newRecord: PropertyReturnRecord = {
      id: "RET_" + Date.now(),
      voucherNumber: voucherNum,
      returnerId: returnerId.trim() || "EXT-01",
      returnerName: returnerName.trim(),
      returnerType,
      department: department.trim(),
      returnDate: new Date().toISOString().split("T")[0],
      receivedBy: user.fullName || "Solomon Kassa",
      warehouseLocation,
      reason,
      items: [
        {
          itemId: itemObj ? itemObj.id : undefined,
          itemCode,
          itemName,
          quantity: Number(returnQty),
          unit,
          condition: itemCondition,
          restockDecision
        }
      ],
      status: "VERIFIED",
      notes: notes.trim() || "Property intake assessment completed by Property Administration."
    };

    CampusDatabase.addPropertyReturn(newRecord);

    // If decision is SEND_TO_MAINTENANCE, automatically trigger a Maintenance Work Order!
    if (restockDecision === "SEND_TO_MAINTENANCE") {
      const newWO: MaintenanceWorkOrder = {
        id: "WO_" + Date.now(),
        orderNumber: `WO-2026-${Math.floor(Math.random() * 900 + 100)}`,
        equipmentName: itemName,
        location: warehouseLocation,
        reportedBy: `${returnerName} (via Return Voucher ${voucherNum})`,
        reportedDepartment: department,
        reportedDate: new Date().toISOString().split("T")[0],
        faultDescription: `Received from ${returnerName} in condition: ${itemCondition}. Notes: ${notes || "Needs bench testing & diagnosis"}`,
        urgency: "MEDIUM",
        status: "REPORTED",
        estimatedCostETB: 1200
      };
      CampusDatabase.addMaintenanceOrder(newWO);
    }

    onRefresh();
    setShowNewModal(false);

    // Reset Form
    setReturnerName("");
    setReturnerId("");
    setSelectedItemId("");
    setCustomItemName("");
    setReturnQty(1);
    setNotes("");

    alert(`Model 23 Property Return Voucher ${voucherNum} recorded! Item condition: ${itemCondition}. Decision: ${restockDecision}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Property Returns & Recovery (Model 23 / የተመለሰ ዕቃ መቀበያ ደረሰኝ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              FDRE MODEL 23
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intake of borrowed apparatus, student clearance recoveries, and returned faculty equipment with condition triage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Return (Model 23)</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search return voucher number, returner name, department, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(["ALL", "SEMESTER_COMPLETION", "GRADUATION_CLEARANCE", "DEFECTIVE_EXCHANGE"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReasonFilter(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                reasonFilter === r
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {r === "ALL"
                ? "All Returns"
                : r === "SEMESTER_COMPLETION"
                ? "Semester End"
                : r === "GRADUATION_CLEARANCE"
                ? "Student Clearance"
                : "Defective Exchange"}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Returns */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Return Voucher</th>
                <th className="py-3 px-4">Returner / Department</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Returned Item & Qty</th>
                <th className="py-3 px-4">Condition & Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No property return records found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {rec.voucherNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{rec.returnDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{rec.returnerName}</span>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <span className="font-mono uppercase">{rec.returnerType}</span>
                          <span>•</span>
                          <span>{rec.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {rec.reason.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {rec.items.map((it, idx) => (
                          <div key={idx}>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.itemName}</span>
                            <span className="font-mono text-slate-500 text-[10px] ml-1">
                              ({it.quantity} {it.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {rec.items.map((it, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded w-fit ${
                                it.condition === "REUSABLE_GOOD"
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                  : it.condition === "MINOR_REPAIR_NEEDED"
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                                  : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                              }`}
                            >
                              {it.condition.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ↳ {it.restockDecision.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveVoucher(rec)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1 ml-auto"
                        title="View Model 23 Voucher"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER PROPERTY RETURN */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <RotateCcw className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Register Property Return (Model 23)</h3>
                    <p className="text-[11px] text-amber-300 font-mono">የተመለሰ ዕቃ መቀበያ ደረሰኝ</p>
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

              <form onSubmit={handleRegisterReturn} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Returner Type *</label>
                    <select
                      value={returnerType}
                      onChange={(e) => setReturnerType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="FACULTY">Faculty / Instructor</option>
                      <option value="STUDENT">Graduating / Leaving Student</option>
                      <option value="DEPARTMENT">Academic Department</option>
                      <option value="CONTRACTOR">External Contractor</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Returner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Chalachew M or Tadesse Mersha"
                      value={returnerName}
                      onChange={(e) => setReturnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">ID Number / Student ID</label>
                    <input
                      type="text"
                      placeholder="e.g. MAU1402271 or INST001"
                      value={returnerId}
                      onChange={(e) => setReturnerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Department / Office *</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Receiving Store *</label>
                    <select
                      value={warehouseLocation}
                      onChange={(e) => setWarehouseLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {WAREHOUSE_OPTIONS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Return Reason *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="SEMESTER_COMPLETION">Semester Completion</option>
                      <option value="GRADUATION_CLEARANCE">Graduation Clearance Process</option>
                      <option value="PROJECT_CONCLUDED">Research / Project Concluded</option>
                      <option value="DEFECTIVE_EXCHANGE">Defective / Faulty Item Exchange</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-500" />
                    <span>Returned Item Details</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Match Existing Catalog Item (Optional):
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    >
                      <option value="">-- Or enter custom name below --</option>
                      {inventory.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.itemCode} • {it.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedItemId && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Custom Item Name (e.g. Dormitory Key, Borrowed Projector Remote):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dormitory Room Key (Block 12, Room 204)"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={returnQty}
                        onChange={(e) => setReturnQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Condition Assessment *</label>
                      <select
                        value={itemCondition}
                        onChange={(e) => setItemCondition(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="REUSABLE_GOOD">Reusable / Good Condition</option>
                        <option value="MINOR_REPAIR_NEEDED">Minor Repair Needed</option>
                        <option value="SCRAP_UNUSABLE">Scrap / Irreparable</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Disposition Decision *</label>
                      <select
                        value={restockDecision}
                        onChange={(e) => setRestockDecision(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="RESTOCK_TO_STORE">Restock to Store (+Qty)</option>
                        <option value="SEND_TO_MAINTENANCE">Send to Maintenance (Auto Work Order)</option>
                        <option value="SCRAP_DISPOSAL">Scrap Disposal / Write-Off</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Inspector Inspection Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Physical appearance, functional verification, or missing accessories..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
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
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Issue Model 23 Voucher
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MODEL 23 VOUCHER PRINT PREVIEW */}
      <AnimatePresence>
        {activeVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">
                  PRINT PREVIEW • MODEL 23 PROPERTY RETURN NOTE
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Model 23</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVoucher(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-serif">
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <EthiopianFlag className="w-7 h-4.5 rounded-xs" />
                    <UniversitySeal className="w-12 h-12" />
                  </div>
                  <h2 className="font-bold text-xs uppercase tracking-wide">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <div className="inline-block border border-slate-900 px-3 py-1 rounded mt-2 font-mono font-bold text-xs bg-emerald-50">
                    MODEL 23: PROPERTY RETURN & CLEARANCE RECEIPT (የተመለሰ ዕቃ መቀበያ ደረሰኝ)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Voucher Number:</strong> <span className="font-mono font-bold">{activeVoucher.voucherNumber}</span></div>
                    <div><strong>Returner:</strong> {activeVoucher.returnerName} ({activeVoucher.returnerType})</div>
                    <div><strong>Department / Unit:</strong> {activeVoucher.department}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Received:</strong> <span className="font-mono">{activeVoucher.returnDate}</span></div>
                    <div><strong>Store Location:</strong> {activeVoucher.warehouseLocation}</div>
                    <div><strong>Return Reason:</strong> {activeVoucher.reason.replace(/_/g, " ")}</div>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-300 font-sans">
                  <thead className="bg-slate-100 font-mono text-[11px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">Code</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Description</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">Qty</th>
                      <th className="py-2 px-3 border-r border-slate-300">Condition</th>
                      <th className="py-2 px-3">Disposition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeVoucher.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold">{it.itemCode}</td>
                        <td className="py-2 px-3 border-r border-slate-300">{it.itemName}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-bold">{it.quantity} {it.unit}</td>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold">{it.condition.replace(/_/g, " ")}</td>
                        <td className="py-2 px-3 font-mono">{it.restockDecision.replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {activeVoucher.notes && (
                  <p className="text-[11px] font-sans text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <strong>Inspection Notes:</strong> {activeVoucher.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Returned By (Faculty / Student / Rep):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucher.returnerName}</p>
                      <p className="text-[10px] text-slate-400">Signature</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Received & Inspected By (Store Officer):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucher.receivedBy}</p>
                      <p className="text-[10px] text-slate-400">Storekeeper / Property Administration</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={() => setActiveVoucher(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Voucher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
