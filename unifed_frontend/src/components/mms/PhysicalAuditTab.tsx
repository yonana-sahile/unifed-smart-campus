import { useState } from "react";
import { PhysicalAuditEntry, User } from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Check,
  TrendingUp,
  TrendingDown,
  X,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PhysicalAuditTabProps {
  user: User;
  audits: PhysicalAuditEntry[];
  onRefresh: () => void;
}

export function PhysicalAuditTab({
  user,
  audits,
  onRefresh
}: PhysicalAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<PhysicalAuditEntry | null>(null);
  const [newPhysicalCount, setNewPhysicalCount] = useState<number>(0);
  const [discrepancyNote, setDiscrepancyNote] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);

  const filteredAudits = audits.filter((a) => {
    const matchesQuery =
      a.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.discrepancyReason && a.discrepancyReason.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || a.reconciliationStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalSystemValue = audits.reduce((sum, a) => sum + a.systemStock * a.unitCostETB, 0);
  const totalPhysicalValue = audits.reduce((sum, a) => sum + a.physicalCount * a.unitCostETB, 0);
  const totalVarianceValue = audits.reduce((sum, a) => sum + a.varianceValueETB, 0);
  const reconciledCount = audits.filter((a) => a.reconciliationStatus === "RECONCILED").length;
  const reconciliationRate = audits.length > 0 ? Math.round((reconciledCount / audits.length) * 100) : 100;

  const handleSaveAuditCount = () => {
    if (!selectedEntryForEdit) return;

    const diff = Number(newPhysicalCount) - selectedEntryForEdit.systemStock;
    const diffValue = diff * selectedEntryForEdit.unitCostETB;

    const updated: PhysicalAuditEntry = {
      ...selectedEntryForEdit,
      physicalCount: Number(newPhysicalCount),
      variance: diff,
      varianceValueETB: diffValue,
      discrepancyReason: discrepancyNote.trim() || selectedEntryForEdit.discrepancyReason,
      reconciliationStatus: diff === 0 ? "RECONCILED" : "PENDING_REVIEW",
      auditDate: new Date().toISOString().split("T")[0]
    };

    CampusDatabase.updatePhysicalAuditEntry(updated);
    onRefresh();
    setSelectedEntryForEdit(null);
    setDiscrepancyNote("");

    alert(`Physical count updated for ${updated.itemName}! Variance: ${diff > 0 ? `+${diff}` : diff}`);
  };

  const handleMarkReconciled = (entry: PhysicalAuditEntry) => {
    const reason = prompt("Enter justification for reconciliation approval / adjustment:", "Physical reconciliation accepted per MoE audit inspection.");
    if (reason !== null) {
      const updated: PhysicalAuditEntry = {
        ...entry,
        reconciliationStatus: "RECONCILED",
        discrepancyReason: reason
      };
      CampusDatabase.updatePhysicalAuditEntry(updated);
      onRefresh();
      alert("Entry marked as RECONCILED in the university audit register.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Annual Physical Inventory Count & Audit (የዕቃ ቆጠራ እና ማስታረቂያ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              FDRE MoE QA VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconciliation between system store balances and physical shelf counts. Joint audit with MoE QA Inspector.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPrintModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Audit Sheet</span>
        </button>
      </div>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">System Book Valuation</span>
          <p className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            {totalSystemValue.toLocaleString()} ETB
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Counted Physical Stock</span>
          <p className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
            {totalPhysicalValue.toLocaleString()} ETB
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Net Audit Variance</span>
          <p
            className={`font-mono font-bold text-lg tabular-nums mt-0.5 ${
              totalVarianceValue < 0
                ? "text-rose-600"
                : totalVarianceValue > 0
                ? "text-blue-600"
                : "text-emerald-600"
            }`}
          >
            {totalVarianceValue > 0 ? `+${totalVarianceValue.toLocaleString()}` : totalVarianceValue.toLocaleString()} ETB
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Reconciliation Rate</span>
          <p className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            {reconciliationRate}% ({reconciledCount}/{audits.length})
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audited item, warehouse, or justification notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(["ALL", "RECONCILED", "PENDING_REVIEW"] as const).map((st) => (
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
              {st === "ALL" ? "All Entries" : st === "RECONCILED" ? "Reconciled" : "Pending Review"}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 text-right">System Stock</th>
                <th className="py-3 px-4 text-right">Physical Count</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-right">Variance Value</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No physical audit entries found.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((entry) => (
                  <tr key={entry.itemId + entry.warehouse} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                          {entry.itemCode}
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          {entry.itemName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{entry.warehouse}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {entry.systemStock}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {entry.physicalCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {entry.variance === 0 ? (
                        <span className="text-emerald-600">0</span>
                      ) : entry.variance > 0 ? (
                        <span className="text-blue-600">+{entry.variance}</span>
                      ) : (
                        <span className="text-rose-600">{entry.variance}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {entry.varianceValueETB === 0 ? (
                        <span className="text-slate-400">0 ETB</span>
                      ) : (
                        <span className={entry.varianceValueETB < 0 ? "text-rose-600" : "text-blue-600"}>
                          {entry.varianceValueETB.toLocaleString()} ETB
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {entry.reconciliationStatus === "RECONCILED" ? (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>RECONCILED</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>PENDING REVIEW</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEntryForEdit(entry);
                            setNewPhysicalCount(entry.physicalCount);
                            setDiscrepancyNote(entry.discrepancyReason || "");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                        >
                          Recount
                        </button>
                        {entry.reconciliationStatus === "PENDING_REVIEW" && (
                          <button
                            type="button"
                            onClick={() => handleMarkReconciled(entry)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Reconcile</span>
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

      {/* MODAL: EDIT PHYSICAL COUNT */}
      <AnimatePresence>
        {selectedEntryForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400">
                  RECOUNT AUDIT: {selectedEntryForEdit.itemCode}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEntryForEdit(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedEntryForEdit.itemName}</h4>
                  <p className="text-slate-500">{selectedEntryForEdit.warehouse}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">SYSTEM BOOK STOCK:</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedEntryForEdit.systemStock}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">UNIT COST:</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedEntryForEdit.unitCostETB.toLocaleString()} ETB
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Verified Physical Count on Shelf:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPhysicalCount}
                    onChange={(e) => setNewPhysicalCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-lg font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Discrepancy Justification / Auditor Notes:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 2 units found in transit to Registrar exam room..."
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedEntryForEdit(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAuditCount}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold"
                  >
                    Save Recount
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRINT OFFICIAL MoE AUDIT SHEET */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">
                  OFFICIAL PHYSICAL INVENTORY AUDIT RECONCILIATION SHEET
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Audit Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-serif">
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center justify-center space-x-3 mb-1">
                    <EthiopianFlag className="w-6 h-4 rounded-xs" />
                    <UniversitySeal className="w-10 h-10" />
                  </div>
                  <h2 className="font-bold text-[11px] uppercase tracking-wide">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <div className="inline-block border border-slate-900 px-3 py-0.5 rounded mt-1 font-mono font-bold text-xs bg-emerald-50">
                    ANNUAL PHYSICAL INVENTORY AUDIT & RECONCILIATION REPORT (የዕቃ ቆጠራ ማጠቃለያ)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <p><strong>Auditing Directorate:</strong> Property Administration & Store Management</p>
                    <p><strong>External QA Oversight:</strong> Ministry of Education (FDRE MoE QA Team)</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Audit Date:</strong> 2026-06-25</p>
                    <p><strong>Reconciliation Rate:</strong> {reconciliationRate}%</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-300 font-sans">
                  <thead className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 border-r border-slate-300">Item Code</th>
                      <th className="py-2 px-2 border-r border-slate-300">Item Name</th>
                      <th className="py-2 px-2 border-r border-slate-300">Store</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-right">System</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-right">Physical</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-right">Variance</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-right">Net Value</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {audits.map((a, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 border-r border-slate-300 font-mono font-bold">{a.itemCode}</td>
                        <td className="py-2 px-2 border-r border-slate-300">{a.itemName}</td>
                        <td className="py-2 px-2 border-r border-slate-300">{a.warehouse}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-right font-mono">{a.systemStock}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-right font-mono">{a.physicalCount}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-right font-mono font-bold">
                          {a.variance === 0 ? "0" : a.variance > 0 ? `+${a.variance}` : a.variance}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-300 text-right font-mono font-bold">
                          {a.varianceValueETB.toLocaleString()} ETB
                        </td>
                        <td className="py-2 px-2 font-mono text-[10px]">{a.reconciliationStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300 font-sans">
                      <td colSpan={3} className="py-2 px-2 text-right">Audited Valuation Totals:</td>
                      <td className="py-2 px-2 text-right font-mono">{totalSystemValue.toLocaleString()} ETB</td>
                      <td className="py-2 px-2 text-right font-mono">{totalPhysicalValue.toLocaleString()} ETB</td>
                      <td colSpan={2} className="py-2 px-2 text-right font-mono font-black text-rose-700">
                        Net: {totalVarianceValue.toLocaleString()} ETB
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">University Property Administration Officer:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">Solomon Kassa (Store Officer)</p>
                      <p className="text-[10px] text-slate-400">Signature & Official University Stamp</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Federal MoE External Quality Auditor:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">Dr. Tolossa Seme (MoE Auditor)</p>
                      <p className="text-[10px] text-slate-400">External Audit Certification</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Audit Sheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
