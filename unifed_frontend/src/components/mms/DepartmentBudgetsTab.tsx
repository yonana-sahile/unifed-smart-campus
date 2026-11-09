import { useState, FormEvent } from "react";
import {
  DepartmentStoreBudget,
  DonationGrantAsset,
  User
} from "../../types";
import { CampusDatabase } from "../../mockData";
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  PieChart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Building,
  Gift,
  Coins,
  TrendingUp,
  Landmark,
  BadgePercent,
  Check,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DepartmentBudgetsTabProps {
  user: User;
  budgets: DepartmentStoreBudget[];
  donations: DonationGrantAsset[];
  onRefresh: () => void;
}

export function DepartmentBudgetsTab({
  user,
  budgets,
  donations,
  onRefresh
}: DepartmentBudgetsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"BUDGETS" | "DONATIONS">("BUDGETS");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // New Budget Form State
  const [bDept, setBDept] = useState("Civil & Environmental Engineering");
  const [bCollege, setBCollege] = useState("Institute of Technology");
  const [bFiscalYear, setBFiscalYear] = useState("2025/2026 (2018 E.C.)");
  const [bAllocated, setBAllocated] = useState<number>(300000);
  const [bHod, setBHod] = useState("Dr. Solomon Desta");

  // New Donation Form State
  const [grantCode, setGrantCode] = useState("WB-ACEII-2026");
  const [donorOrg, setDonorOrg] = useState("World Bank ACEII Project");
  const [projectName, setProjectName] = useState("Smart Campus IoT & Environmental Sensors");
  const [assetTag, setAssetTag] = useState("MAU-DNT-WB-0092");
  const [itemName, setItemName] = useState("Weather Station & Atmospheric Sensor Cluster");
  const [itemValue, setItemValue] = useState<number>(680000);
  const [projectPI, setProjectPI] = useState(user.fullName);
  const [projectEnd, setProjectEnd] = useState("2028-12-31");
  const [custodianLab, setCustodianLab] = useState("Masha Research Field Station");

  const filteredBudgets = budgets.filter((b) => {
    return (
      b.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.hodApprover.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredDonations = donations.filter((d) => {
    return (
      d.grantCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assetTag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateBudget = (e: FormEvent) => {
    e.preventDefault();
    CampusDatabase.updateDepartmentBudget(bDept, bAllocated, bFiscalYear);
    setShowBudgetModal(false);
    onRefresh();
  };

  const handleCreateDonation = (e: FormEvent) => {
    e.preventDefault();
    if (!grantCode.trim() || !itemName.trim()) return;

    const newDonation: DonationGrantAsset = {
      id: `DNT-${Date.now()}`,
      grantCode: grantCode.trim(),
      donorOrganization: donorOrg.trim(),
      projectName: projectName.trim(),
      assetTag: assetTag.trim(),
      itemName: itemName.trim(),
      valueETB: itemValue,
      projectPI: projectPI.trim(),
      projectEndDate: projectEnd,
      handoverStatus: "IN_PROJECT_USE",
      custodianLab: custodianLab.trim()
    };

    CampusDatabase.addDonationGrantAsset(newDonation);
    setShowDonationModal(false);
    onRefresh();
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedBudgetETB, 0);
  const totalUtilized = budgets.reduce((acc, b) => acc + b.utilizedBudgetETB, 0);
  const totalDonationVal = donations.reduce((acc, d) => acc + d.valueETB, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Subtab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Department Store Budgets & Partner Grant Assets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental spending quotas, real-time encumbrance checks, and World Bank/UNDP/JICA research grants asset registry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-900">
            <button
              onClick={() => setActiveSubTab("BUDGETS")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === "BUDGETS"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Department Quotas ({budgets.length})
            </button>
            <button
              onClick={() => setActiveSubTab("DONATIONS")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === "DONATIONS"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Donations & Grants ({donations.length})
            </button>
          </div>

          {activeSubTab === "BUDGETS" ? (
            <button
              onClick={() => setShowBudgetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adjust Department Quota
            </button>
          ) : (
            <button
              onClick={() => setShowDonationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Grant Asset
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Allocated Quota</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalAllocated.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">FY 2025/2026 Store Pool</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Consumed Budget</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {totalUtilized.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {Math.round((totalUtilized / (totalAllocated || 1)) * 100)}% university burn rate
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Remaining Spending Power</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {(totalAllocated - totalUtilized).toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Available for Model 20 requisitions</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Donation & Grant Assets</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {totalDonationVal.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {donations.length} items from World Bank, JICA & UN
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === "BUDGETS"
                ? "Search department, college, approver..."
                : "Search grant code, donor, equipment..."
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === "BUDGETS" ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Department & College</th>
                  <th className="py-3 px-4">Fiscal Year</th>
                  <th className="py-3 px-4 text-right">Allocated Quota</th>
                  <th className="py-3 px-4 text-right">Consumed</th>
                  <th className="py-3 px-4 text-right">Remaining Capacity</th>
                  <th className="py-3 px-4">Utilization Gauge</th>
                  <th className="py-3 px-4">HOD Approver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredBudgets.map((b, i) => {
                  const pct = Math.min(
                    100,
                    Math.round((b.utilizedBudgetETB / (b.allocatedBudgetETB || 1)) * 100)
                  );
                  return (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 dark:text-white block font-medium">
                          {b.departmentName}
                        </strong>
                        <span className="text-[11px] text-slate-400">{b.college}</span>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-slate-500">
                        {b.fiscalYear}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {b.allocatedBudgetETB.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400">ETB</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                        {b.utilizedBudgetETB.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400">ETB</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {b.remainingBudgetETB.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400">ETB</span>
                      </td>

                      <td className="py-3 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                pct > 85 ? "bg-red-500" : pct > 65 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                        {b.hodApprover}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DONATIONS AND GRANT ASSETS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {item.grantCode}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mt-2">
                      {item.itemName}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{item.assetTag}</span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Donor & Project:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {item.donorOrganization}
                    </strong>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {item.projectName}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Project PI:</span>
                      <span className="font-medium">{item.projectPI}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Custody Lab:</span>
                      <span className="font-medium truncate block">{item.custodianLab}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Valuation:</span>
                  <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                    {item.valueETB.toLocaleString()} ETB
                  </strong>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {item.handoverStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADJUST BUDGET MODAL */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Update Department Store Quota
                </h3>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBudget} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={bDept}
                    onChange={(e) => setBDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="text"
                    value={bFiscalYear}
                    onChange={(e) => setBFiscalYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Allocated Store Budget (ETB)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={bAllocated}
                    onChange={(e) => setBAllocated(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Save Allocation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW DONATION MODAL */}
      <AnimatePresence>
        {showDonationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Register Partner Grant / Donation Asset
                </h3>
                <button
                  onClick={() => setShowDonationModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDonation} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Grant Code
                    </label>
                    <input
                      type="text"
                      value={grantCode}
                      onChange={(e) => setGrantCode(e.target.value)}
                      placeholder="e.g. WB-ACEII-2026"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Donor Organization
                    </label>
                    <input
                      type="text"
                      value={donorOrg}
                      onChange={(e) => setDonorOrg(e.target.value)}
                      placeholder="World Bank, UNDP, JICA, etc."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Equipment / Asset Name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Drone Multispectral LiDAR Mapping System"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Asset Tag
                    </label>
                    <input
                      type="text"
                      value={assetTag}
                      onChange={(e) => setAssetTag(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Value (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemValue}
                      onChange={(e) => setItemValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Principal Investigator (PI)
                    </label>
                    <input
                      type="text"
                      value={projectPI}
                      onChange={(e) => setProjectPI(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Custody Lab / Facility
                    </label>
                    <input
                      type="text"
                      value={custodianLab}
                      onChange={(e) => setCustodianLab(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowDonationModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Register Grant Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
