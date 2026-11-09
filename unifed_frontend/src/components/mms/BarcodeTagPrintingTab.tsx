import { useState } from "react";
import { FixedAssetItem } from "../../types";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  Barcode,
  Search,
  Printer,
  QrCode,
  Tag,
  Building,
  CheckCircle2,
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BarcodeTagPrintingTabProps {
  assets: FixedAssetItem[];
}

export function BarcodeTagPrintingTab({ assets }: BarcodeTagPrintingTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedTagForPrint, setSelectedTagForPrint] = useState<FixedAssetItem | null>(null);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);

  const filteredAssets = assets.filter((a) => {
    const matchesQuery =
      a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.custodianDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || a.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Barcode & Asset Tag Printing Suite (የባርኮድ እና ንብረት መለያ ማተሚያ)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              BARCODE & RFID TAGS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and print tamper-evident physical barcode asset tags for laboratories, offices, and campus assets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBulkPrintModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Bulk Print Tag Sheet</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search asset tag barcode, device name, serial number, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(["ALL", "ICT_ELECTRONICS", "LAB_APPARATUS", "CLINICAL_MEDICAL"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            No fixed assets match your search criteria.
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-4 shadow-sm hover:border-primary/50 transition space-y-3 relative overflow-hidden group"
            >
              {/* Top Tag Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-1.5">
                  <UniversitySeal className="w-6 h-6 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-[10px] tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                      Mekdela Amba University
                    </h5>
                    <p className="text-[8px] font-mono text-slate-500">PROPERTY OF MAU • DO NOT REMOVE</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTagForPrint(asset)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900"
                  title="Print this Asset Tag"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Barcode Graphic (SVG Code 128 Simulation) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center space-y-1">
                <div className="flex justify-center items-center h-10 space-x-0.5 px-2">
                  {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3].map((w, i) => (
                    <span
                      key={i}
                      className="bg-slate-900 dark:bg-slate-100 h-8 inline-block"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <div className="font-mono font-black text-xs text-slate-900 dark:text-slate-100 tracking-widest">
                  {asset.assetTag}
                </div>
              </div>

              {/* Asset Info */}
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{asset.name}</h4>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-500">
                  <div>Model: <span className="text-slate-700 dark:text-slate-300 font-bold">{asset.model}</span></div>
                  <div>SN: <span className="text-slate-700 dark:text-slate-300 font-bold truncate">{asset.serialNumber}</span></div>
                  <div>Location: <span className="text-slate-700 dark:text-slate-300">{asset.location}</span></div>
                  <div>Dept: <span className="text-slate-700 dark:text-slate-300 truncate">{asset.custodianDepartment}</span></div>
                </div>
              </div>

              {/* Bottom Condition & Tag Print Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {asset.condition}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTagForPrint(asset)}
                  className="font-bold text-primary dark:text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>Preview Tag</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: SINGLE ASSET TAG PREVIEW & PRINT */}
      <AnimatePresence>
        {selectedTagForPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">PHYSICAL ASSET TAG</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Tag</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTagForPrint(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Physical Tag Simulation (Standard Aluminum Adhesive Plate Style) */}
              <div className="p-6">
                <div className="border-4 border-slate-900 rounded-2xl p-4 bg-white space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                    <div className="flex items-center space-x-2">
                      <UniversitySeal className="w-8 h-8 shrink-0" />
                      <div>
                        <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900 leading-none">
                          MEKDELA AMBA UNIVERSITY
                        </h4>
                        <p className="text-[9px] font-mono text-slate-600 mt-0.5">PROPERTY ADMINISTRATION</p>
                      </div>
                    </div>
                  </div>

                  {/* High Contrast Barcode */}
                  <div className="text-center py-1">
                    <div className="flex justify-center items-center h-12 space-x-0.5 px-3">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3].map((w, i) => (
                        <span
                          key={i}
                          className="bg-slate-950 h-10 inline-block"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono font-black text-sm tracking-widest text-slate-950 block mt-1">
                      {selectedTagForPrint.assetTag}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-900 pt-2 text-[10px] space-y-0.5 font-mono">
                    <p className="font-bold text-slate-900 truncate">
                      NAME: {selectedTagForPrint.name}
                    </p>
                    <p>SN: {selectedTagForPrint.serialNumber} • MODEL: {selectedTagForPrint.model}</p>
                    <p>CUSTODIAN: {selectedTagForPrint.custodianName}</p>
                    <p>ROOM: {selectedTagForPrint.location}</p>
                  </div>

                  <div className="bg-slate-950 text-white text-center py-1 rounded text-[8px] font-mono font-bold tracking-widest">
                    SECURITY ASSET TAG • REMOVAL IS A LEGAL OFFENSE
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BULK PRINT SHEET */}
      <AnimatePresence>
        {showBulkPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-300 text-slate-900"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="font-mono text-xs font-bold text-amber-400">
                  PRINT ASSET TAG SHEET (A4 THERMAL / ADHESIVE STICKERS)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print All Tags (Page Setup A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkPrintModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border-2 border-slate-900 rounded-xl p-3 bg-white space-y-2 text-slate-900"
                  >
                    <div className="flex items-center space-x-1.5 border-b border-slate-900 pb-1">
                      <UniversitySeal className="w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-[9px] block truncate">MEKDELA AMBA UNIVERSITY</span>
                        <span className="text-[7px] font-mono text-slate-500 block">PROPERTY OF MAU</span>
                      </div>
                    </div>
                    <div className="text-center py-0.5">
                      <div className="flex justify-center items-center h-8 space-x-0.5 px-2">
                        {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((w, i) => (
                          <span
                            key={i}
                            className="bg-slate-900 h-6 inline-block"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono font-black text-[11px] block tracking-wider mt-0.5">
                        {asset.assetTag}
                      </span>
                    </div>
                    <div className="border-t border-slate-900 pt-1 text-[8px] font-mono space-y-0.5">
                      <p className="font-bold truncate">{asset.name}</p>
                      <p className="truncate">SN: {asset.serialNumber}</p>
                      <p className="truncate">{asset.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
