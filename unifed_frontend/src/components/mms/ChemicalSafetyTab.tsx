import { useState, FormEvent } from "react";
import {
  HazardousMaterialRecord,
  MaterialInventoryItem,
  User
} from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  Flame,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  ShieldAlert,
  Thermometer,
  Shield,
  FileWarning,
  Biohazard,
  LifeBuoy,
  FileText,
  Eye,
  AlertCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChemicalSafetyTabProps {
  user: User;
  inventory: MaterialInventoryItem[];
  hazardousMaterials: HazardousMaterialRecord[];
  onRefresh: () => void;
}

const UN_CLASS_CONFIG: Record<
  HazardousMaterialRecord["unClass"],
  { label: string; badge: string; color: string }
> = {
  FLAMMABLE_LIQUID_3: {
    label: "Class 3: Flammable Liquid (ተቀጣጣይ ፈሳሽ)",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
    color: "text-red-600 dark:text-red-400"
  },
  CORROSIVE_8: {
    label: "Class 8: Corrosive Substance (አመንጪ/አሲድ)",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    color: "text-amber-600 dark:text-amber-400"
  },
  TOXIC_6_1: {
    label: "Class 6.1: Toxic Substance (መርዛማ ኬሚካል)",
    badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    color: "text-purple-600 dark:text-purple-400"
  },
  OXIDIZER_5_1: {
    label: "Class 5.1: Oxidizing Agent (አቃጣይ)",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    color: "text-orange-600 dark:text-orange-400"
  },
  HAZARDOUS_COMPOUND: {
    label: "Hazardous Chemical Compound (አጠቃላይ አደገኛ)",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    color: "text-slate-600 dark:text-slate-400"
  }
};

export function ChemicalSafetyTab({
  user,
  inventory,
  hazardousMaterials,
  onRefresh
}: ChemicalSafetyTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeMsdsRecord, setActiveMsdsRecord] = useState<HazardousMaterialRecord | null>(null);

  // New Chemical Form State
  const [chemicalName, setChemicalName] = useState("");
  const [amharicName, setAmharicName] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [unClass, setUnClass] = useState<HazardousMaterialRecord["unClass"]>("FLAMMABLE_LIQUID_3");
  const [storageLocation, setStorageLocation] = useState("Chemical Store Bay 2, Fireproof Cabinet 01");
  const [volume, setVolume] = useState<number>(10);
  const [unit, setUnit] = useState("Liters");
  const [maxThreshold, setMaxThreshold] = useState<number>(50);
  const [storageTemp, setStorageTemp] = useState("15°C - 22°C");
  const [emergencyNeutralizer, setEmergencyNeutralizer] = useState("Dry chemical powder or sand buffer.");
  const [ppeRequired, setPpeRequired] = useState("Chemical Splash Goggles, Nitrile Gloves, Fume Hood");
  const [expirationDate, setExpirationDate] = useState("2027-12-31");

  const chemicalInventoryItems = inventory.filter(
    (i) => i.category === "CHEMICALS_REAGENTS" || i.category === "LAB_APPARATUS"
  );

  const filteredRecords = hazardousMaterials.filter((m) => {
    const matchesQuery =
      m.chemicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.casNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.amharicName && m.amharicName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || m.inspectionStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleCreateHazmat = (e: FormEvent) => {
    e.preventDefault();
    if (!chemicalName.trim() || !casNumber.trim()) return;

    const newRecord: HazardousMaterialRecord = {
      id: `HAZ-${Date.now()}`,
      itemCode: `MMS-CHM-${String(hazardousMaterials.length + 1).padStart(3, "0")}`,
      chemicalName: chemicalName.trim(),
      amharicName: amharicName.trim() || chemicalName.trim(),
      casNumber: casNumber.trim(),
      unClass,
      storageLocation: storageLocation.trim(),
      currentVolume: volume,
      unit,
      maxAllowableThreshold: maxThreshold,
      storageTempCelsius: storageTemp.trim(),
      msdsUrl: "https://example.com/msds-standard.pdf",
      ppeRequired: ppeRequired.split(",").map((s) => s.trim()),
      emergencyNeutralizer: emergencyNeutralizer.trim(),
      expirationDate,
      inspectionStatus: volume > maxThreshold ? "CRITICAL_ACTION_REQUIRED" : "SAFE"
    };

    CampusDatabase.addHazardousMaterial(newRecord);
    setShowNewModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Biohazard className="w-5 h-5 text-red-600 dark:text-red-400" />
            Hazardous Materials & Chemical Safety / MSDS Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            አደገኛ ኬሚካሎች እና የደህንነት መቆጣጠሪያ · CAS Registry, UN Hazard Classes, PPE Protocols & Storage Thresholds.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Register Hazardous Chemical
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Tracked Reagents</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {hazardousMaterials.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">With validated CAS numbers</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Flammable / Corrosive</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-1">
            {
              hazardousMaterials.filter(
                (h) => h.unClass === "FLAMMABLE_LIQUID_3" || h.unClass === "CORROSIVE_8"
              ).length
            }
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">In dedicated fireproof cabinets</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Critical Threshold Breaches</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {
              hazardousMaterials.filter((h) => h.inspectionStatus === "CRITICAL_ACTION_REQUIRED")
                .length
            }
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Exceeds safety storage limit</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Active Storage Bunkers</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            3
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Tulu Awulia & Masha Campuses</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chemical name, CAS number, bunker..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "SAFE", "EXPIRING_SOON", "CRITICAL_ACTION_REQUIRED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Hazmat Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((item) => {
          const unInfo = UN_CLASS_CONFIG[item.unClass];
          const isOverThreshold = item.currentVolume > item.maxAllowableThreshold;

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.chemicalName}
                    </h3>
                    <p className="text-xs text-slate-400">{item.amharicName}</p>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    CAS: {item.casNumber}
                  </span>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${unInfo.badge}`}
                  >
                    {unInfo.label}
                  </span>
                </div>

                {/* Storage & Volume */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Storage Volume:</span>
                    <strong
                      className={`font-mono tabular-nums ${
                        isOverThreshold ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.currentVolume} / {item.maxAllowableThreshold} {item.unit}
                    </strong>
                  </div>

                  {/* Volume Gauge */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        isOverThreshold
                          ? "bg-red-500"
                          : item.currentVolume / item.maxAllowableThreshold > 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (item.currentVolume / item.maxAllowableThreshold) * 100)}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                    <Thermometer className="w-3.5 h-3.5 shrink-0" />
                    <span>Safe Temp: {item.storageTempCelsius}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Bunker: {item.storageLocation}
                  </div>
                </div>

                {/* PPE Badges */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1.5">Mandatory PPE Protocol:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.ppeRequired.map((ppe, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                      >
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  {item.inspectionStatus === "SAFE" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Safe
                    </span>
                  )}
                  {item.inspectionStatus === "EXPIRING_SOON" && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Expiring {item.expirationDate}
                    </span>
                  )}
                  {item.inspectionStatus === "CRITICAL_ACTION_REQUIRED" && (
                    <span className="text-red-600 dark:text-red-400 font-medium text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Threshold Alert
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveMsdsRecord(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View MSDS Sheet
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW HAZMAT MODAL */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Register Hazardous Chemical & Safety MSDS (አደገኛ ኬሚካል ምዝገባ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Campus environmental health and chemical containment registry.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHazmat} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chemical Name (English)
                    </label>
                    <input
                      type="text"
                      value={chemicalName}
                      onChange={(e) => setChemicalName(e.target.value)}
                      placeholder="e.g. Sulfuric Acid 98% AR"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chemical Name (Amharic)
                    </label>
                    <input
                      type="text"
                      value={amharicName}
                      onChange={(e) => setAmharicName(e.target.value)}
                      placeholder="e.g. ሰልፈሪክ አሲድ"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      CAS Registry Number
                    </label>
                    <input
                      type="text"
                      value={casNumber}
                      onChange={(e) => setCasNumber(e.target.value)}
                      placeholder="e.g. 7664-93-9"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      UN Hazard Classification
                    </label>
                    <select
                      value={unClass}
                      onChange={(e) =>
                        setUnClass(e.target.value as HazardousMaterialRecord["unClass"])
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="FLAMMABLE_LIQUID_3">Class 3: Flammable Liquid</option>
                      <option value="CORROSIVE_8">Class 8: Corrosive Substance</option>
                      <option value="TOXIC_6_1">Class 6.1: Toxic Substance</option>
                      <option value="OXIDIZER_5_1">Class 5.1: Oxidizer</option>
                      <option value="HAZARDOUS_COMPOUND">Hazardous Chemical Compound</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Current Volume
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Liters, kg"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Safety Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxThreshold}
                      onChange={(e) => setMaxThreshold(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Storage Bunker / Cabinet
                    </label>
                    <input
                      type="text"
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Safe Storage Temperature
                    </label>
                    <input
                      type="text"
                      value={storageTemp}
                      onChange={(e) => setStorageTemp(e.target.value)}
                      placeholder="e.g. 15°C - 20°C"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Spill Neutralizer / Extinguishing Agent
                  </label>
                  <input
                    type="text"
                    value={emergencyNeutralizer}
                    onChange={(e) => setEmergencyNeutralizer(e.target.value)}
                    placeholder="e.g. Sodium Bicarbonate powder, lime slurry, or sand"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mandatory PPE (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={ppeRequired}
                    onChange={(e) => setPpeRequired(e.target.value)}
                    placeholder="Chemical Splash Goggles, Nitrile Gloves, Full Face Shield"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Save to Safety Registry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MSDS DOSSIER SHEET MODAL */}
      <AnimatePresence>
        {activeMsdsRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-8 my-8 print:border-none print:shadow-none print:p-0"
            >
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <UniversitySeal className="w-12 h-12" />
                  <div>
                    <h1 className="text-lg font-bold uppercase tracking-wider">
                      Mekdela Amba University
                    </h1>
                    <p className="text-xs text-slate-600">
                      College of Natural Sciences & Chemistry Directorate
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Campus Chemical Safety & MSDS Data Dossier
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded">
                    MSDS SAFETY DATA
                  </span>
                </div>
              </div>

              <div className="text-center my-6 py-2 bg-slate-100 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  Material Safety Data Sheet (MSDS) / የደህንነት መረጃ ወረቀት
                </h2>
                <p className="text-[11px] text-slate-600">
                  CAS Registry: <strong>{activeMsdsRecord.casNumber}</strong> · UN Class:{" "}
                  {activeMsdsRecord.unClass}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg border-slate-200 bg-slate-50">
                  <div>
                    <span className="text-slate-500 block">Chemical Substance:</span>
                    <strong className="text-sm block">{activeMsdsRecord.chemicalName}</strong>
                    <span className="text-slate-600">{activeMsdsRecord.amharicName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Authorized Bunker Location:</span>
                    <strong className="block">{activeMsdsRecord.storageLocation}</strong>
                    <span className="text-slate-600">
                      Safe Storage Temp: {activeMsdsRecord.storageTempCelsius}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    Emergency First Aid & Spill Neutralization
                  </h3>
                  <p className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                    {activeMsdsRecord.emergencyNeutralizer}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    Personal Protective Equipment (PPE) Mandate
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMsdsRecord.ppeRequired.map((ppe, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-200 text-slate-800 rounded font-medium text-xs"
                      >
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-slate-600 pt-2">
                  <div>
                    <span>Current Inventory:</span>{" "}
                    <strong>
                      {activeMsdsRecord.currentVolume} {activeMsdsRecord.unit}
                    </strong>
                  </div>
                  <div>
                    <span>Threshold Limit:</span>{" "}
                    <strong>
                      {activeMsdsRecord.maxAllowableThreshold} {activeMsdsRecord.unit}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between print:hidden">
                <span className="text-xs text-slate-500">
                  Post laminated copy at entrance of Chemical Storage Bunker.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMsdsRecord(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print MSDS Card
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
