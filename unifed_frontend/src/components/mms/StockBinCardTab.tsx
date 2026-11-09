import { useState } from "react";
import {
  StockBinCardEntry,
  MaterialInventoryItem,
  User
} from "../../types";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  FileSpreadsheet,
  Search,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  PackageCheck,
  Building2,
  Calendar,
  Layers,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StockBinCardTabProps {
  user: User;
  inventory: MaterialInventoryItem[];
  binCardEntries: StockBinCardEntry[];
  onRefresh: () => void;
}

export function StockBinCardTab({
  user,
  inventory,
  binCardEntries,
  onRefresh
}: StockBinCardTabProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    inventory[0]?.id || "MMS-ITEM-01"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const activeItem = inventory.find((i) => i.id === selectedItemId) || inventory[0];

  const itemEntries = binCardEntries
    .filter((e) => e.itemId === activeItem?.id || e.itemCode === activeItem?.itemCode)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const filteredEntries = itemEntries.filter((entry) => {
    return (
      entry.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.voucherType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.remarks.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalIn = itemEntries.reduce((acc, e) => acc + (e.quantityIn || 0), 0);
  const totalOut = itemEntries.reduce((acc, e) => acc + (e.quantityOut || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Digital Stock Bin Card (ቢን ካርድ) Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time chronological timeline tracking Model 19 (Receipts), Model 20/22 (Issues), Model 21 (Transfers) & Model 23 (Returns).
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors self-start md:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Bin Card Ledger
        </button>
      </div>

      {/* Item Selector & Overview Panel */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Inventory Item to View Bin Card
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {inventory.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  [{inv.itemCode}] {inv.name} ({inv.quantityInStock} {inv.unit})
                </option>
              ))}
            </select>
          </div>

          {activeItem && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Warehouse & Shelf:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {activeItem.warehouseLocation} · {activeItem.shelfBin}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="text-slate-400 block">Min Threshold:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {activeItem.minThreshold} {activeItem.unit}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="text-slate-400 block">Current Balance:</span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {activeItem.quantityInStock} {activeItem.unit}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Inflow (Model 19 & Returns)</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <ArrowDownLeft className="w-5 h-5" />
            +{totalIn} <span className="text-xs font-normal text-slate-500">{activeItem?.unit}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Recorded warehouse receipts</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Outflow (Model 20 & Transfers)</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <ArrowUpRight className="w-5 h-5" />
            -{totalOut} <span className="text-xs font-normal text-slate-500">{activeItem?.unit}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Departmental issues</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Ledger Entries Count</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {itemEntries.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Immutable audit trail</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Current Valuation</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {(activeItem ? activeItem.quantityInStock * activeItem.unitCostETB : 0).toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            @ {activeItem?.unitCostETB.toLocaleString()} ETB / unit
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher number, storekeeper, remarks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Official Government Model Form Bin Card
        </span>
      </div>

      {/* Printable Bin Card Official Ledger Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm print:border-none print:shadow-none">
        {/* Print-Only Header */}
        <div className="hidden print:block p-6 border-b border-slate-900 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <UniversitySeal className="w-10 h-10" />
            <div>
              <h1 className="text-base font-bold uppercase">Mekdela Amba University</h1>
              <p className="text-xs text-slate-600">Stock Bin Card Ledger (ቢን ካርድ መዝገብ)</p>
            </div>
          </div>
          <div className="grid grid-cols-3 text-xs text-left border p-2 mt-4">
            <div>
              <strong>Item:</strong> [{activeItem?.itemCode}] {activeItem?.name}
            </div>
            <div>
              <strong>Warehouse:</strong> {activeItem?.warehouseLocation}
            </div>
            <div>
              <strong>Shelf/Bin:</strong> {activeItem?.shelfBin}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Voucher Type & Reference</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                  Received (+)
                </th>
                <th className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400">
                  Issued (-)
                </th>
                <th className="py-3 px-4 text-right font-bold">Balance</th>
                <th className="py-3 px-4">Storekeeper Signature</th>
                <th className="py-3 px-4">Particulars / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No ledger transactions recorded for this item yet.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {entry.timestamp}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white block">
                        {entry.voucherNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {entry.voucherType.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px]">{entry.warehouseLocation}</td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {entry.quantityIn > 0 ? `+${entry.quantityIn}` : "—"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {entry.quantityOut > 0 ? `-${entry.quantityOut}` : "—"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {entry.balanceStock} {activeItem?.unit}
                    </td>

                    <td className="py-3 px-4 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                      {entry.performedBy}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.remarks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
