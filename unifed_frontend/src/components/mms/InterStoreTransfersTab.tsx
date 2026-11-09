import { useState, FormEvent } from "react";
import {
  InterStoreTransferRecord,
  MaterialInventoryItem,
  User
} from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Warehouse,
  Truck,
  FileText,
  Eye,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InterStoreTransfersTabProps {
  user: User;
  inventory: MaterialInventoryItem[];
  transfers: InterStoreTransferRecord[];
  onRefresh: () => void;
}

const WAREHOUSE_OPTIONS = [
  "Central Warehouse (Main Campus)",
  "Science & Engineering Lab Store",
  "Health Sciences & Clinic Store",
  "Dormitory & Facilities Depot",
  "Masha Satellite Campus Store"
];

export function InterStoreTransfersTab({
  user,
  inventory,
  transfers,
  onRefresh
}: InterStoreTransfersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<InterStoreTransferRecord | null>(null);

  // Form State
  const [sourceWarehouse, setSourceWarehouse] = useState(WAREHOUSE_OPTIONS[0]);
  const [destinationWarehouse, setDestinationWarehouse] = useState(WAREHOUSE_OPTIONS[1]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferReason, setTransferReason] = useState("");
  const [gatePassRef, setGatePassRef] = useState("");

  const filteredTransfers = transfers.filter((t) => {
    const matchesQuery =
      t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sourceWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destinationWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.items.some((it) => it.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleCreateTransfer = (e: FormEvent) => {
    e.preventDefault();
    if (sourceWarehouse === destinationWarehouse) {
      alert("Source and destination warehouses cannot be the same.");
      return;
    }
    const itemObj = inventory.find((it) => it.id === selectedItemId);
    if (!itemObj) {
      alert("Please select an item to transfer.");
      return;
    }
    if (transferQty > itemObj.quantityInStock) {
      alert(`Cannot transfer ${transferQty} ${itemObj.unit}. Available in stock is ${itemObj.quantityInStock}.`);
      return;
    }

    const transferNum = `M21-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const newRecord: InterStoreTransferRecord = {
      id: "TRF_" + Date.now(),
      transferNumber: transferNum,
      sourceWarehouse,
      destinationWarehouse,
      initiatedBy: `${user.fullName} (${user.role === "MATERIAL_MANAGER" ? "Store Officer" : "Department Rep"})`,
      initiatedDate: new Date().toISOString().split("T")[0],
      reason: transferReason.trim() || "Institutional inter-store operational transfer",
      items: [
        {
          itemId: itemObj.id,
          itemCode: itemObj.itemCode,
          itemName: itemObj.name,
          quantity: Number(transferQty),
          unit: itemObj.unit
        }
      ],
      status: "IN_TRANSIT",
      gatePassRef: gatePassRef.trim() || undefined,
      remarks: `Dispatched from ${sourceWarehouse} to ${destinationWarehouse}.`
    };

    CampusDatabase.addInterStoreTransfer(newRecord);
    onRefresh();
    setShowNewModal(false);

    // Reset Form
    setSelectedItemId("");
    setTransferQty(1);
    setTransferReason("");
    setGatePassRef("");

    alert(`Model 21 Inter-Store Transfer Voucher ${transferNum} issued! Balance deducted from ${sourceWarehouse}.`);
  };

  const handleConfirmReceived = (transferId: string) => {
    const receiverName = prompt("Enter the name of the storekeeper receiving this transfer:", user.fullName);
    if (receiverName) {
      CampusDatabase.updateInterStoreTransferStatus(transferId, "COMPLETED", receiverName);
      onRefresh();
      alert("Transfer confirmed as COMPLETED and received into destination warehouse ledger.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Inter-Store Transfers (Model 21 / የዕቃ ማስተላለፊያ ደረሰኝ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              FDRE MODEL 21
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reallocate materials between Central Warehouse, Science Labs, Health Clinic, and Masha Sub-Campus.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transfer (Model 21)</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transfer voucher number, store, item, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(["ALL", "IN_TRANSIT", "COMPLETED"] as const).map((st) => (
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
              {st === "ALL" ? "All Transfers" : st === "IN_TRANSIT" ? "In Transit" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Transfer Voucher</th>
                <th className="py-3 px-4">Route (Source → Destination)</th>
                <th className="py-3 px-4">Items Transferred</th>
                <th className="py-3 px-4">Initiated By / Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No inter-store transfer records found.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {rec.transferNumber}
                          </span>
                          {rec.gatePassRef && (
                            <span className="text-[10px] font-mono text-slate-500">GP: {rec.gatePassRef}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-medium">
                          <span className="text-[11px]">{rec.sourceWarehouse}</span>
                          <span className="text-slate-400 font-bold">→</span>
                        </div>
                        <p className="text-[11px] font-bold text-primary dark:text-amber-400">
                          {rec.destinationWarehouse}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {rec.items.map((it, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.itemName}</span>
                            <span className="font-mono text-slate-500 text-[10px]">
                              ({it.quantity} {it.unit})
                            </span>
                          </div>
                        ))}
                        <p className="text-[10px] text-slate-500 italic truncate max-w-xs">{rec.reason}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{rec.initiatedBy}</div>
                      <div className="text-[10px] text-slate-500">{rec.initiatedDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      {rec.status === "COMPLETED" ? (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>COMPLETED</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                          <Truck className="w-3 h-3" />
                          <span>IN TRANSIT</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveVoucher(rec)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
                          title="View Model 21 Voucher"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Voucher</span>
                        </button>
                        {rec.status === "IN_TRANSIT" && (
                          <button
                            type="button"
                            onClick={() => handleConfirmReceived(rec.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1"
                            title="Confirm Receipt into Destination Store"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm Receipt</span>
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

      {/* MODAL: NEW INTER-STORE TRANSFER */}
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
                  <ArrowRightLeft className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Issue Model 21 Inter-Store Transfer</h3>
                    <p className="text-[11px] text-amber-300 font-mono">የዕቃ ማስተላለፊያ ደረሰኝ</p>
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

              <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Source Store (መነሻ) *</label>
                    <select
                      value={sourceWarehouse}
                      onChange={(e) => setSourceWarehouse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {WAREHOUSE_OPTIONS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Destination Store (መድረሻ) *</label>
                    <select
                      value={destinationWarehouse}
                      onChange={(e) => setDestinationWarehouse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {WAREHOUSE_OPTIONS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Material to Transfer *</label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    <option value="">-- Select Inventory Item --</option>
                    {inventory.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.itemCode} • {it.name} (Stock: {it.quantityInStock} {it.unit} at {it.warehouseLocation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Transfer Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={transferQty}
                      onChange={(e) => setTransferQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Security Gate Pass Ref (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. GP-2026-0089"
                      value={gatePassRef}
                      onChange={(e) => setGatePassRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Transfer Reason / Purpose *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Equipping newly constructed Masha sub-campus computer laboratory..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
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
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold"
                  >
                    Authorize & Dispatch Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MODEL 21 VOUCHER PRINT PREVIEW */}
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
                  PRINT PREVIEW • MODEL 21 INTER-STORE TRANSFER
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Model 21</span>
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
                  <div className="inline-block border border-slate-900 px-3 py-1 rounded mt-2 font-mono font-bold text-xs bg-blue-50">
                    MODEL 21: INTER-STORE TRANSFER VOUCHER (የዕቃ ማስተላለፊያ ደረሰኝ)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Transfer Voucher No:</strong> <span className="font-mono font-bold">{activeVoucher.transferNumber}</span></div>
                    <div><strong>Source Store:</strong> {activeVoucher.sourceWarehouse}</div>
                    <div><strong>Destination Store:</strong> {activeVoucher.destinationWarehouse}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Issued:</strong> <span className="font-mono">{activeVoucher.initiatedDate}</span></div>
                    <div><strong>Status:</strong> <span className="font-mono font-bold">{activeVoucher.status}</span></div>
                    {activeVoucher.gatePassRef && (
                      <div><strong>Security Gate Pass:</strong> <span className="font-mono">{activeVoucher.gatePassRef}</span></div>
                    )}
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-300 font-sans">
                  <thead className="bg-slate-100 font-mono text-[11px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">Item Code</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Description</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">Quantity</th>
                      <th className="py-2 px-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeVoucher.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold">{it.itemCode}</td>
                        <td className="py-2 px-3 border-r border-slate-300">{it.itemName}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-bold">{it.quantity}</td>
                        <td className="py-2 px-3 font-mono">{it.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-[11px] font-sans text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong>Transfer Justification:</strong> {activeVoucher.reason}
                </p>

                <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Dispatched By (Issuing Storekeeper):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucher.initiatedBy}</p>
                      <p className="text-[10px] text-slate-400">Signature & Date</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Received By (Destination Storekeeper):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucher.receivedBy || "Pending Delivery Confirmation"}</p>
                      <p className="text-[10px] text-slate-400">Signature & Date: {activeVoucher.receivedDate || "---"}</p>
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
