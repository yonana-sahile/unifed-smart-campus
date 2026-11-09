import { useState, FormEvent } from "react";
import {
  PurchaseOrder,
  UniversityVendor,
  MaterialInventoryItem,
  User,
  PurchaseOrderItem,
  MaterialCategory
} from "../../types";
import { CampusDatabase } from "../../services/api"; // 👈 UPDATED THIS LINE
import { EthiopianFlag, UniversitySeal } from "../UniversityHeader";
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Building2,
  FileText,
  Eye,
  ShieldCheck,
  Send,
  PackageCheck,
  Star,
  Phone,
  Mail,
  MapPin,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProcurementOrdersTabProps {
  user: User;
  inventory: MaterialInventoryItem[];
  purchaseOrders: PurchaseOrder[];
  vendors: UniversityVendor[];
  onRefresh: () => void;
}

export function ProcurementOrdersTab({
  user,
  inventory,
  purchaseOrders,
  vendors,
  onRefresh
}: ProcurementOrdersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"POS" | "VENDORS">("POS");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [activePrintPo, setActivePrintPo] = useState<PurchaseOrder | null>(null);

  // New PO form state
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || "");
  const [poDepartment, setPoDepartment] = useState("Software Engineering");
  const [poDeliveryDate, setPoDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState("30 Days Net upon Inspection");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    {
      itemId: inventory[0]?.id || "ITEM-1",
      itemCode: inventory[0]?.itemCode || "MMS-ICT-001",
      itemName: inventory[0]?.name || "Desktop Workstation",
      unit: inventory[0]?.unit || "units",
      quantityOrdered: 5,
      unitPriceETB: inventory[0]?.unitCostETB || 45000,
      lineTotalETB: (inventory[0]?.unitCostETB || 45000) * 5
    }
  ]);

  // New Vendor Form State
  const [vName, setVName] = useState("");
  const [vAmharic, setVAmharic] = useState("");
  const [vTin, setVTin] = useState("");
  const [vVat, setVVat] = useState("");
  const [vCategory, setVCategory] = useState<MaterialCategory>("ICT_ELECTRONICS");
  const [vContactPerson, setVContactPerson] = useState("");
  const [vPhone, setVPhone] = useState("+251 9");
  const [vEmail, setVEmail] = useState("");
  const [vAddress, setVAddress] = useState("Addis Ababa, Ethiopia");
  const [vBank, setVBank] = useState("Commercial Bank of Ethiopia (CBE)");
  const [vAccount, setVAccount] = useState("1000");

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesQuery =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some((i) => i.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredVendors = vendors.filter((v) => {
    return (
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAddItemRow = () => {
    const first = inventory[0];
    setPoItems([
      ...poItems,
      {
        itemId: first?.id || "ITEM-N",
        itemCode: first?.itemCode || "MMS-GEN",
        itemName: first?.name || "Inventory Item",
        unit: first?.unit || "units",
        quantityOrdered: 1,
        unitPriceETB: first?.unitCostETB || 1000,
        lineTotalETB: first?.unitCostETB || 1000
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = (idx: number, invId: string) => {
    const inv = inventory.find((i) => i.id === invId);
    if (!inv) return;
    const updated = [...poItems];
    updated[idx] = {
      ...updated[idx],
      itemId: inv.id,
      itemCode: inv.itemCode,
      itemName: inv.name,
      unit: inv.unit,
      unitPriceETB: inv.unitCostETB,
      lineTotalETB: inv.unitCostETB * updated[idx].quantityOrdered
    };
    setPoItems(updated);
  };

  const handleQtyChange = (idx: number, qty: number) => {
    const validQty = Math.max(1, qty);
    const updated = [...poItems];
    updated[idx] = {
      ...updated[idx],
      quantityOrdered: validQty,
      lineTotalETB: validQty * updated[idx].unitPriceETB
    };
    setPoItems(updated);
  };

  const handlePriceChange = (idx: number, price: number) => {
    const validPrice = Math.max(0, price);
    const updated = [...poItems];
    updated[idx] = {
      ...updated[idx],
      unitPriceETB: validPrice,
      lineTotalETB: updated[idx].quantityOrdered * validPrice
    };
    setPoItems(updated);
  };

  const totalPoAmount = poItems.reduce((acc, it) => acc + it.lineTotalETB, 0);

  const handleCreatePO = (e: FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
    const poCount = purchaseOrders.length + 1;
    const poNum = `PO-MAU-2026-${String(poCount).padStart(4, "0")}`;

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber: poNum,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorTIN: vendor.tinNumber,
      department: poDepartment,
      budgetCode: `BG-${poDepartment.toUpperCase().replace(/\s+/g, "_")}-2026`,
      issueDate: new Date().toISOString().split("T")[0],
      deliveryDeadline: poDeliveryDate,
      items: poItems,
      subtotalETB: totalPoAmount,
      vatAmountETB: Math.round(totalPoAmount * 0.15),
      grandTotalETB: Math.round(totalPoAmount * 1.15),
      status: "DRAFT",
      paymentTerms,
      notes: poNotes || "Procurement compliant with FPPAA federal guidelines."
    };

    CampusDatabase.addPurchaseOrder(newPO);
    setShowNewPoModal(false);
    onRefresh();
  };

  const handleCreateVendor = (e: FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vTin.trim()) return;

    const newVendor: UniversityVendor = {
      id: `VEND-${Date.now()}`,
      vendorCode: `VND-ETH-${String(vendors.length + 1).padStart(3, "0")}`,
      name: vName.trim(),
      tradeName: vAmharic.trim() || vName.trim(),
      tinNumber: vTin.trim(),
      vatNumber: vVat.trim() || "VAT-PENDING",
      category: vCategory as any,
      contactPerson: vContactPerson.trim(),
      phone: vPhone.trim(),
      email: vEmail.trim() || "procurement@supplier.et",
      address: vAddress.trim(),
      city: "Addis Ababa",
      bankAccountDetails: `${vBank.trim()} · ${vAccount.trim()}`,
      status: "ACTIVE",
      ratingScore: 4.8,
      activeContractsCount: 1,
      totalSuppliedValueETB: 0
    };

    CampusDatabase.addVendor(newVendor);
    setShowNewVendorModal(false);
    onRefresh();
  };

  const handleApprovePO = (poId: string) => {
    CampusDatabase.updatePurchaseOrderStatus(poId, "FINANCE_APPROVED", user.fullName);
    onRefresh();
  };

  const handleIssueToVendor = (poId: string) => {
    CampusDatabase.updatePurchaseOrderStatus(poId, "ISSUED_TO_VENDOR", user.fullName);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Procurement Lifecycle & Vendor Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Federal FPPAA standard Purchase Orders (PO), Model 19 integration, and evaluated suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-900">
            <button
              onClick={() => setActiveSubTab("POS")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === "POS"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveSubTab("VENDORS")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === "VENDORS"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Registered Vendors ({vendors.length})
            </button>
          </div>

          {activeSubTab === "POS" ? (
            <button
              onClick={() => setShowNewPoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Purchase Order
            </button>
          ) : (
            <button
              onClick={() => setShowNewVendorModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Register New Vendor
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Active POs</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {purchaseOrders.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {purchaseOrders.filter((p) => p.status === "COMPLETED_M19").length} Fulfilled to M19
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Committed PO Value</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {purchaseOrders
              .reduce((acc, p) => acc + (p.grandTotalETB || p.subtotalETB), 0)
              .toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">University procurement pipeline</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Pending Finance Review</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {purchaseOrders.filter((p) => p.status === "DRAFT").length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting budget encumbrance</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400">Verified Vendors</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {vendors.filter((v) => v.status === "ACTIVE").length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">With compliant TIN & VAT</span>
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
            placeholder={
              activeSubTab === "POS"
                ? "Search PO number, vendor, item..."
                : "Search vendor name, TIN, category..."
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {activeSubTab === "POS" && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "DRAFT", "FINANCE_APPROVED", "ISSUED_TO_VENDOR", "COMPLETED_M19"].map(
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
        )}
      </div>

      {/* Content Area */}
      {activeSubTab === "POS" ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">PO Number & Date</th>
                  <th className="py-3 px-4">Vendor & TIN</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white block">
                          {po.poNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {po.issueDate} · Due {po.deliveryDeadline}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 dark:text-slate-100 block">
                          {po.vendorName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          TIN: {po.vendorTIN}
                        </span>
                      </td>

                      <td className="py-3 px-4">{po.department}</td>

                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {po.items.length} line {po.items.length === 1 ? "item" : "items"}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                          {po.items.map((i) => `${i.quantityOrdered}x ${i.itemName}`).join(", ")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {po.grandTotalETB.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400">ETB</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {po.status === "COMPLETED_M19" && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Fulfilled (M19: {po.grnReference || "Verified"})
                            </span>
                          )}
                          {po.status === "FINANCE_APPROVED" && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Finance Approved
                            </span>
                          )}
                          {po.status === "ISSUED_TO_VENDOR" && (
                            <span className="text-purple-600 dark:text-purple-400 font-medium text-[11px] flex items-center gap-1">
                              <Send className="w-3.5 h-3.5" />
                              Issued to Vendor
                            </span>
                          )}
                          {po.status === "DRAFT" && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Draft / Pending Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {po.status === "DRAFT" && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="px-2 py-1 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 transition-colors"
                              title="Finance Pre-Approval"
                            >
                              Approve
                            </button>
                          )}

                          {po.status === "FINANCE_APPROVED" && (
                            <button
                              onClick={() => handleIssueToVendor(po.id)}
                              className="px-2 py-1 text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 transition-colors"
                              title="Transmit Purchase Order"
                            >
                              Issue PO
                            </button>
                          )}

                          <button
                            onClick={() => setActivePrintPo(po)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Print Federal PO Dossier"
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
      ) : (
        /* VENDORS DIRECTORY GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {vendor.name}
                    </h3>
                    <p className="text-xs text-slate-400">{vendor.tradeName || vendor.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{vendor.ratingScore?.toFixed(1) || "4.8"}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{vendor.category.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">TIN Number</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {vendor.tinNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Bank Account</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white truncate block">
                      {vendor.bankAccountDetails || "CBE Enterprise Account"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Orders:{" "}
                  <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                    {(vendor.totalSuppliedValueETB || 0).toLocaleString()} ETB
                  </strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {vendor.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      <AnimatePresence>
        {showNewPoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Generate Official Purchase Order (የግዥ ትዕዛዝ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized Ethiopian Federal Public Procurement Agency standard template.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewPoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePO} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Vendor / Supplier
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (TIN: {v.tinNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Department / College
                    </label>
                    <input
                      type="text"
                      value={poDepartment}
                      onChange={(e) => setPoDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={poDeliveryDate}
                      onChange={(e) => setPoDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Line Items to Purchase
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/20 max-h-56 overflow-y-auto">
                    {poItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="col-span-5">
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemChange(idx, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                          >
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                [{inv.itemCode}] {inv.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantityOrdered} // 👈 FIXED
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                            placeholder="Qty"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPriceETB}
                            onChange={(e) =>
                              handlePriceChange(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                            placeholder="Unit Price"
                          />
                        </div>

                        <div className="col-span-2 font-mono font-medium text-right tabular-nums text-slate-900 dark:text-white">
                          {item.lineTotalETB.toLocaleString()} ETB {/* 👈 FIXED */}
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-2 text-xs font-mono">
                    <span className="text-slate-500 mr-2">Grand Total:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {totalPoAmount.toLocaleString()} ETB
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payment Terms & Retention
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Procurement Notes & Delivery Location
                    </label>
                    <input
                      type="text"
                      value={poNotes}
                      onChange={(e) => setPoNotes(e.target.value)}
                      placeholder="e.g. Deliver to Central Store (Tulu Awulia Campus)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewPoModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Submit Purchase Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE VENDOR MODAL */}
      <AnimatePresence>
        {showNewVendorModal && (
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
                    Register University Vendor (አቅራቢ ድርጅት ምዝገባ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official supplier pre-qualification for government procurement.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewVendorModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVendor} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Company Name (English)
                    </label>
                    <input
                      type="text"
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="e.g. Abyssinia Office Solutions PLC"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Company Name (Amharic)
                    </label>
                    <input
                      type="text"
                      value={vAmharic}
                      onChange={(e) => setVAmharic(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="e.g. አቢሲኒያ የቢሮ እቃዎች ኃ/የተ/የግ/ማ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      value={vTin}
                      onChange={(e) => setVTin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="0018924102"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      VAT Number
                    </label>
                    <input
                      type="text"
                      value={vVat}
                      onChange={(e) => setVVat(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="VAT-98214"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Supply Category
                    </label>
                    <select
                      value={vCategory}
                      onChange={(e) =>
                        setVCategory(e.target.value as UniversityVendor["category"])
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="ICT_HARDWARE">ICT Hardware</option>
                      <option value="CHEMICALS_REAGENTS">Chemicals & Reagents</option>
                      <option value="STATIONERY_PRINTING">Stationery & Printing</option>
                      <option value="FURNITURE">Furniture</option>
                      <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
                      <option value="BUILDING_MAINTENANCE">Building Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={vContactPerson}
                      onChange={(e) => setVContactPerson(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Sales Manager"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={vPhone}
                      onChange={(e) => setVPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={vEmail}
                      onChange={(e) => setVEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="sales@company.et"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={vBank}
                      onChange={(e) => setVBank(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={vAccount}
                      onChange={(e) => setVAccount(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewVendorModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Complete Vendor Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PURCHASE ORDER OFFICIAL PRINT DOSSIER */}
      <AnimatePresence>
        {activePrintPo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-8 my-8 print:border-none print:shadow-none print:p-0"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <UniversitySeal className="w-12 h-12" />
                  <div>
                    <h1 className="text-lg font-bold uppercase tracking-wider">
                      Mekdela Amba University
                    </h1>
                    <p className="text-xs text-slate-600">
                      የመቅደላ አምባ ዩኒቨርሲቲ · Procurement & Property Administration Directorate
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Tulu Awulia & Masha Campuses, Ethiopia
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-bold font-mono tracking-wider border border-slate-300">
                    {activePrintPo.poNumber}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: <strong>{activePrintPo.issueDate}</strong>
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-4 py-2 bg-slate-100 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  Official Purchase Order / የግዥ ማዘዣ
                </h2>
                <p className="text-[11px] text-slate-600">
                  Federal Public Procurement & Property Administration Directive (FPPAA Compliance)
                </p>
              </div>

              {/* Order Info Details */}
              <div className="grid grid-cols-2 gap-4 text-xs my-4 border p-3 rounded-lg border-slate-200">
                <div>
                  <span className="text-slate-500 block">Vendor / አቅራቢ ድርጅት:</span>
                  <strong className="text-sm block">{activePrintPo.vendorName}</strong>
                  <span className="font-mono text-slate-600">
                    TIN: {activePrintPo.vendorTIN}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Requesting Unit / ጠያቂ ክፍል:</span>
                  <strong className="text-sm block">{activePrintPo.department}</strong>
                  <span className="text-slate-600">
                    Delivery Expected: {activePrintPo.deliveryDeadline}
                  </span>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full text-xs text-left border border-slate-200 my-4">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2 border-r">#</th>
                    <th className="p-2 border-r">Item Description / የዕቃው ዝርዝር</th>
                    <th className="p-2 border-r text-center">Unit</th>
                    <th className="p-2 border-r text-right">Qty</th>
                    <th className="p-2 border-r text-right">Unit Price (ETB)</th>
                    <th className="p-2 text-right">Total Price (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activePrintPo.items.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 border-r text-center font-mono">{i + 1}</td>
                      <td className="p-2 border-r font-medium">
                        [{item.itemCode}] {item.itemName}
                      </td>
                      <td className="p-2 border-r text-center">{item.unit}</td>
                      <td className="p-2 border-r text-right font-mono tabular-nums">
                        {item.quantityOrdered}
                      </td>
                      <td className="p-2 border-r text-right font-mono tabular-nums">
                        {item.unitPriceETB.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums font-semibold">
                        {item.lineTotalETB.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t">
                    <td colSpan={5} className="p-2 text-right">
                      Grand Total (ETB):
                    </td>
                    <td className="p-2 text-right font-mono tabular-nums text-sm">
                      {activePrintPo.grandTotalETB.toLocaleString()} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Payment & Terms */}
              <div className="text-[11px] text-slate-600 space-y-1 mb-8">
                <p>
                  <strong>Payment & Delivery Terms:</strong> {activePrintPo.paymentTerms}
                </p>
                <p>
                  <strong>Instructions:</strong> Delivery must be accompanied by an official Tax
                  Invoice and Certificate of Analysis or Conformity. Final acceptance subject to
                  Technical Inspection Committee Model 19 issuance.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs text-center">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold block">{activePrintPo.preparedBy || "Procurement Officer"}</span>
                  <span className="text-[10px] text-slate-500">Prepared By (Procurement Officer)</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold block">
                    {activePrintPo.approvedBy || "Finance Directorate"}
                  </span>
                  <span className="text-[10px] text-slate-500">Budget Encumbrance (Finance)</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold block">Authorized Signature</span>
                  <span className="text-[10px] text-slate-500">Managing Vice President</span>
                </div>
              </div>

              {/* Print Modal Buttons */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between print:hidden">
                <span className="text-xs text-slate-500">
                  Ready to print or save as PDF for vendor transmission.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePrintPo(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Purchase Order
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
