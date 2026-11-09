import { useState, FormEvent } from "react";
import {
  AssetDisposalRecord,
  FixedAssetItem,
  User,
  MaterialCategory
} from "../../types";
import { CampusDatabase } from "../../services/api"; // 👈 UPDATED THIS LINE
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Gavel,
  AlertTriangle,
  Building2,
  BadgeCheck,
  FileText,
  DollarSign,
  TrendingDown,
  Building,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AssetDisposalTabProps {
  user: User;
  fixedAssets: FixedAssetItem[];
  disposals: AssetDisposalRecord[];
  onRefresh: () => void;
}

export function AssetDisposalTab({
  user,
  fixedAssets,
  disposals,
  onRefresh
}: AssetDisposalTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [activePrintTender, setActivePrintTender] = useState<AssetDisposalRecord | null>(null);

  // New Disposal Form State
  const [selectedAssetId, setSelectedAssetId] = useState<string>(fixedAssets[0]?.id || "");
  const [equipmentName, setEquipmentName] = useState(fixedAssets[0]?.name || "");
  const [assetTag, setAssetTag] = useState(fixedAssets[0]?.assetTag || "");
  const [initialCost, setInitialCost] = useState<number>(fixedAssets[0]?.purchaseCostETB || 40000);
  const [bookValue, setBookValue] = useState<number>(fixedAssets[0]?.currentValueETB || 5000);
  const [disposalMethod, setDisposalMethod] = useState<AssetDisposalRecord["disposalMethod"]>("PUBLIC_AUCTION");
  const [reservePrice, setReservePrice] = useState<number>(15000);
  const [technicalJustification, setTechnicalJustification] = useState("");
  const [category, setCategory] = useState<MaterialCategory>(fixedAssets[0]?.category || "ICT_ELECTRONICS");

  // Auction Award state
  const [auctionModalRecord, setAuctionModalRecord] = useState<AssetDisposalRecord | null>(null);
  const [winningBid, setWinningBid] = useState<number>(0);
  const [buyerName, setBuyerName] = useState("");
  const [buyerReceipt, setBuyerReceipt] = useState("");

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = fixedAssets.find((a) => a.id === assetId);
    if (asset) {
      setEquipmentName(asset.name);
      setAssetTag(asset.assetTag);
      setInitialCost(asset.purchaseCostETB);
      setBookValue(asset.currentValueETB);
      setCategory(asset.category);
      setReservePrice(Math.round(asset.currentValueETB * 0.7));
    }
  };

  const filteredDisposals = disposals.filter((d) => {
    const matchesQuery =
      d.disposalRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.buyerName && d.buyerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleCreateDisposal = (e: FormEvent) => {
    e.preventDefault();
    const count = disposals.length + 1;
    const refNum = `DSP-2026-${String(count).padStart(3, "0")}`;

    const newRecord: AssetDisposalRecord = {
      id: `DSP-${Date.now()}`,
      disposalRef: refNum,
      assetId: selectedAssetId,
      assetTag: assetTag || "MAU-FA-DECOM",
      equipmentName,
      category,
      initialPurchaseCostETB: initialCost,
      bookValueETB: bookValue,
      disposalMethod,
      committeeApprovedDate: new Date().toISOString().split("T")[0],
      committeeChairman: `${user.fullName} (Property Officer)`,
      reservePriceETB: reservePrice,
      status: "APPRAISAL",
      technicalJustification:
        technicalJustification ||
        "Beyond economic repair; recommended for write-off and disposal per FPPAA Directive."
    };

    CampusDatabase.addAssetDisposal(newRecord);
    setShowNewModal(false);
    onRefresh();
  };

  const handlePublishTender = (id: string) => {
    CampusDatabase.updateDisposalStatus(id, "TENDER_PUBLISHED");
    onRefresh();
  };

  const handleAwardAuction = (e: FormEvent) => {
    e.preventDefault();
    if (!auctionModalRecord) return;

    CampusDatabase.updateDisposalStatus(auctionModalRecord.id, "AUCTIONED", {
      winningBidETB: winningBid,
      buyerName: buyerName.trim(),
      buyerReceiptNo: buyerReceipt.trim() || `RC-MAU-2026-${Date.now().toString().slice(-4)}`
    });

    setAuctionModalRecord(null);
    onRefresh();
  };

  const handleRemitToTreasury = (id: string) => {
    CampusDatabase.updateDisposalStatus(id, "REMITTED_TO_TREASURY");
    onRefresh();
  };

  const totalAuctionProceeds = disposals
    .filter((d) => d.status === "AUCTIONED" || d.status === "REMITTED_TO_TREASURY")
    .reduce((acc, d) => acc + (d.winningBidETB || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Asset Decommissioning, Disposal & Public Auction Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            የአገልግሎት ጊዜ ያለፈባቸው ንብረቶች ማስወገጃ እና ጨረታ · FDRE FPPAA Directive Compliance & Treasury Remittance.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Initiate Asset Write-off
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Decommissioned</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {disposals.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Inspected by Property Board</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Active Public Tenders</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {disposals.filter((d) => d.status === "TENDER_PUBLISHED").length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Listed on university noticeboard</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Recovered Auction Funds</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {totalAuctionProceeds.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Salvaged value to Treasury</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Remitted to MoF Treasury</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1">
            {disposals.filter((d) => d.status === "REMITTED_TO_TREASURY").length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Full audit closure confirmed</span>
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
            placeholder="Search disposal ref, asset tag, buyer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "APPRAISAL", "TENDER_PUBLISHED", "AUCTIONED", "REMITTED_TO_TREASURY"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  statusFilter === st
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Disposals Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Disposal Ref & Tag</th>
                <th className="py-3 px-4">Equipment Description</th>
                <th className="py-3 px-4">Method & Date</th>
                <th className="py-3 px-4 text-right">Book Value</th>
                <th className="py-3 px-4 text-right">Reserve Price</th>
                <th className="py-3 px-4 text-right">Auction Bid</th>
                <th className="py-3 px-4">Disposal Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDisposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No disposal records found.
                  </td>
                </tr>
              ) : (
                filteredDisposals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white block">
                        {item.disposalRef}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.assetTag}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block">
                        {item.equipmentName}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {item.technicalJustification}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium block">
                        {item.disposalMethod.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.committeeApprovedDate}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {item.bookValueETB.toLocaleString()} ETB
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {item.reservePriceETB.toLocaleString()} ETB
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {item.winningBidETB ? (
                        <div>
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {item.winningBidETB.toLocaleString()} ETB
                          </strong>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                            {item.buyerName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Bid</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.status === "REMITTED_TO_TREASURY" && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium text-[11px] flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Remitted to Treasury
                          </span>
                        )}
                        {item.status === "AUCTIONED" && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Auction Awarded
                          </span>
                        )}
                        {item.status === "TENDER_PUBLISHED" && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Public Tender Live
                          </span>
                        )}
                        {item.status === "APPRAISAL" && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Committee Appraisal
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {item.status === "APPRAISAL" && (
                          <button
                            onClick={() => handlePublishTender(item.id)}
                            className="px-2 py-1 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 transition-colors"
                            title="Publish Public Tender"
                          >
                            Publish Tender
                          </button>
                        )}

                        {item.status === "TENDER_PUBLISHED" && (
                          <button
                            onClick={() => {
                              setAuctionModalRecord(item);
                              setWinningBid(item.reservePriceETB + 2000);
                            }}
                            className="px-2 py-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-100 transition-colors"
                            title="Record Winning Bidder"
                          >
                            Award Auction
                          </button>
                        )}

                        {item.status === "AUCTIONED" && (
                          <button
                            onClick={() => handleRemitToTreasury(item.id)}
                            className="px-2 py-1 text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 transition-colors"
                            title="Close and Remit Funds to Ministry of Finance Treasury"
                          >
                            Remit Treasury
                          </button>
                        )}

                        <button
                          onClick={() => setActivePrintTender(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Official Tender Dossier"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* NEW DISPOSAL MODAL */}
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
                    Initiate Asset Decommissioning & Disposal (ንብረት ማስወገጃ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official appraisal and write-off proposal per Ethiopian FPPAA directives.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDisposal} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select University Fixed Asset to Write-Off
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {fixedAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        [{asset.assetTag}] {asset.name} (Val: {asset.currentValueETB.toLocaleString()} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Disposal Method
                    </label>
                    <select
                      value={disposalMethod}
                      onChange={(e) =>
                        setDisposalMethod(e.target.value as AssetDisposalRecord["disposalMethod"])
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="PUBLIC_AUCTION">Public Auction (በግልፅ ጨረታ)</option>
                      <option value="SCRAP_METAL">Scrap Metal Salvage (የብረታ ብረት ቆሻሻ ሽያጭ)</option>
                      <option value="COMMUNITY_DONATION">Community / School Donation (ድጋፍ)</option>
                      <option value="HAZARDOUS_DESTRUCTION">Controlled Destruction (አወጋገድ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Reserve Minimum Price (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block">Initial Purchase Cost</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {initialCost.toLocaleString()} ETB
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Depreciated Book Value</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {bookValue.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Technical Inspection & Condemnation Justification
                  </label>
                  <textarea
                    rows={3}
                    value={technicalJustification}
                    onChange={(e) => setTechnicalJustification(e.target.value)}
                    placeholder="Describe mechanical/electronic failure, lack of spare parts, or obsolescence..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
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
                    className="px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Submit for Board Appraisal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD AUCTION WINNER MODAL */}
      <AnimatePresence>
        {auctionModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Award Public Auction Bid (የጨረታ አሸናፊ ማረጋገጫ)
                </h3>
                <button
                  onClick={() => setAuctionModalRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAwardAuction} className="p-6 space-y-4">
                <div className="text-xs text-slate-500">
                  Awarding: <strong>{auctionModalRecord.equipmentName}</strong> (Ref:{" "}
                  {auctionModalRecord.disposalRef})
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Winning Bid Offer (ETB)
                  </label>
                  <input
                    type="number"
                    min={auctionModalRecord.reservePriceETB}
                    value={winningBid}
                    onChange={(e) => setWinningBid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must meet or exceed reserve price:{" "}
                    {auctionModalRecord.reservePriceETB.toLocaleString()} ETB
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Winning Bidder / Purchaser Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Tadesse Metal Recycling PLC"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Cash Deposit Slip / CBE Receipt Ref
                  </label>
                  <input
                    type="text"
                    value={buyerReceipt}
                    onChange={(e) => setBuyerReceipt(e.target.value)}
                    placeholder="e.g. CBE-DEP-8849201"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAuctionModalRecord(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Confirm Auction Award
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT OFFICIAL TENDER ADVERTISEMENT DOSSIER */}
      <AnimatePresence>
        {activePrintTender && (
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
                      የመቅደላ አምባ ዩኒቨርሲቲ · Directorate of Property Administration & Disposal
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ref: {activePrintTender.disposalRef} · Ethiopian Fiscal Year 2018 E.C.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                    PUBLIC TENDER
                  </span>
                </div>
              </div>

              <div className="text-center my-6 py-2 bg-slate-100 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  Public Auction Tender Notice / የንብረት ሽያጭ ግልፅ ጨረታ ማስታወቂያ
                </h2>
                <p className="text-[11px] text-slate-600">
                  Issued under FDRE Public Property Administration Directive No. 42/2010
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <p>
                  Mekdela Amba University invites interested and eligible bidders for the disposal
                  of decommissioned university property under public auction lot:
                </p>

                <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asset Tag & Category:</span>
                    <strong className="font-mono">
                      {activePrintTender.assetTag} ({activePrintTender.category})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item Description:</span>
                    <strong>{activePrintTender.equipmentName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Disposal Method:</span>
                    <span>{activePrintTender.disposalMethod.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Starting Minimum Reserve Price:</span>
                    <strong className="font-mono text-sm text-amber-900">
                      {activePrintTender.reservePriceETB.toLocaleString()} ETB
                    </strong>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <p>
                    1. Bidders must present a renewed Business License, TIN Certificate, and a CPO
                    equal to 10% of their offer.
                  </p>
                  <p>
                    2. Physical inspection of items is available at Central Warehouse (Tulu Awulia)
                    during working hours.
                  </p>
                  <p>
                    3. The university reserves the right to accept or reject any or all bids per
                    FPPAA guidelines.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-xs text-center">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold block">{activePrintTender.committeeChairman}</span>
                  <span className="text-[10px] text-slate-500">Property Inspection Committee Chair</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold block">Office of the Managing VP</span>
                  <span className="text-[10px] text-slate-500">Approved for Public Tender Publication</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between print:hidden">
                <span className="text-xs text-slate-500">
                  Ready to print for campus noticeboard and newspaper submission.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePrintTender(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Tender Notice
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
