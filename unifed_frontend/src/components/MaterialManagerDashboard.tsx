import { useState, useEffect, FormEvent } from "react";
import {
  User,
  MaterialInventoryItem,
  MaterialRequisition,
  GoodsReceivingRecord,
  FixedAssetItem,
  MaterialCategory,
  InterStoreTransferRecord,
  PropertyReturnRecord,
  CampusGatePassRecord,
  MaintenanceWorkOrder,
  PhysicalAuditEntry,
  UniversityVendor,
  PurchaseOrder,
  AssetDisposalRecord,
  HazardousMaterialRecord,
  StockBinCardEntry,
  DepartmentStoreBudget,
  DonationGrantAsset
} from "../types";
import { CampusDatabase } from "../services/api"; // 👈 UPDATED THIS LINE
import { UniversityTopBar, AcademicFooter, EthiopianFlag, UniversitySeal } from "./UniversityHeader";
// 👇 COMMENTED OUT THESE TWO MISSING COMPONENTS
// import { SmartCampusAlerts } from "./SmartCampusAlerts";
// import { SmartCampusHardwareHub } from "./SmartCampusHardwareHub";
import { InterStoreTransfersTab } from "./mms/InterStoreTransfersTab";
import { PropertyReturnsTab } from "./mms/PropertyReturnsTab";
import { CampusGatePassTab } from "./mms/CampusGatePassTab";
import { MaintenanceOrdersTab } from "./mms/MaintenanceOrdersTab";
import { PhysicalAuditTab } from "./mms/PhysicalAuditTab";
import { BarcodeTagPrintingTab } from "./mms/BarcodeTagPrintingTab";
import { ProcurementOrdersTab } from "./mms/ProcurementOrdersTab";
import { AssetDisposalTab } from "./mms/AssetDisposalTab";
import { ChemicalSafetyTab } from "./mms/ChemicalSafetyTab";
import { StockBinCardTab } from "./mms/StockBinCardTab";
import { DepartmentBudgetsTab } from "./mms/DepartmentBudgetsTab";
import {
  Package,
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  Warehouse,
  ShieldCheck,
  TrendingUp,
  Download,
  X,
  Send,
  Eye,
  Check,
  Building,
  RotateCcw,
  Tag,
  Barcode,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Wrench,
  ClipboardCheck,
  QrCode,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Info,
  ShoppingCart,
  Gavel,
  Biohazard,
  FileSpreadsheet,
  Coins,
  Cctv
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MaterialManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

export function MaterialManagerDashboard({ user, onLogout }: MaterialManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "catalog"
    | "requisitions"
    | "receiving"
    | "procurement"
    | "disposals"
    | "chemicals"
    | "bin_card"
    | "budgets"
    | "transfers"
    | "returns"
    | "gate_pass"
    | "fixed_assets"
    | "maintenance"
    | "audit"
    | "asset_tags"
    | "warehouses"
    | "alerts"
    | "hardware_iot"
  >("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Core Data
  const [inventory, setInventory] = useState<MaterialInventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [receivingRecords, setReceivingRecords] = useState<GoodsReceivingRecord[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAssetItem[]>([]);
  const [transfers, setTransfers] = useState<InterStoreTransferRecord[]>([]);
  const [propertyReturns, setPropertyReturns] = useState<PropertyReturnRecord[]>([]);
  const [gatePasses, setGatePasses] = useState<CampusGatePassRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [physicalAudits, setPhysicalAudits] = useState<PhysicalAuditEntry[]>([]);
  // Enterprise MMS Suite State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<UniversityVendor[]>([]);
  const [disposals, setDisposals] = useState<AssetDisposalRecord[]>([]);
  const [hazardousMaterials, setHazardousMaterials] = useState<HazardousMaterialRecord[]>([]);
  const [binCardEntries, setBinCardEntries] = useState<StockBinCardEntry[]>([]);
  const [departmentBudgets, setDepartmentBudgets] = useState<DepartmentStoreBudget[]>([]);
  const [donationGrantAssets, setDonationGrantAssets] = useState<DonationGrantAsset[]>([]);

  // Search and Filter States
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("ALL");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");

  const [requisitionSearch, setRequisitionSearch] = useState("");
  const [selectedReqStatus, setSelectedReqStatus] = useState<string>("ALL");

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<MaterialInventoryItem | null>(null);
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState<number>(1);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<"ADD" | "DEDUCT">("ADD");
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");

  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [activeVoucherRequisition, setActiveVoucherRequisition] = useState<MaterialRequisition | null>(null);
  const [activeGRNPreview, setActiveGRNPreview] = useState<GoodsReceivingRecord | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // New Item Form State
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmharic, setNewItemAmharic] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<MaterialCategory>("ICT_ELECTRONICS");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemThreshold, setNewItemThreshold] = useState<number>(5);
  const [newItemCost, setNewItemCost] = useState<number>(1500);
  const [newItemWarehouse, setNewItemWarehouse] = useState("Central Store (Tulu Awulia)");
  const [newItemBin, setNewItemBin] = useState("Shelf A-01");
  const [newItemSupplier, setNewItemSupplier] = useState("");

  // New Goods Receiving Form (Model 19)
  const [grnPo, setGrnPo] = useState("");
  const [grnInvoice, setGrnInvoice] = useState("");
  const [grnSupplier, setGrnSupplier] = useState("");
  const [grnSupplierTIN, setGrnSupplierTIN] = useState("");
  const [grnWarehouse, setGrnWarehouse] = useState("Central Store (Tulu Awulia)");
  const [grnSelectedItemId, setGrnSelectedItemId] = useState("");
  const [grnItemQty, setGrnItemQty] = useState<number>(10);
  const [grnItemCost, setGrnItemCost] = useState<number>(1000);
  const [grnNotes, setGrnNotes] = useState("");

  // New Fixed Asset Form
  const [newAssetTag, setNewAssetTag] = useState(`MAU-FA-2026-${Math.floor(Math.random() * 900 + 100)}`);
  const [newAssetSerial, setNewAssetSerial] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState<MaterialCategory>("ICT_ELECTRONICS");
  const [newAssetModel, setNewAssetModel] = useState("");
  const [newAssetCost, setNewAssetCost] = useState<number>(25000);
  const [newAssetCustodian, setNewAssetCustodian] = useState("");
  const [newAssetDept, setNewAssetDept] = useState("Software Engineering");
  const [newAssetLocation, setNewAssetLocation] = useState("Block B, Lab 1");
  const [newAssetCondition, setNewAssetCondition] = useState<FixedAssetItem["condition"]>("EXCELLENT");

  useEffect(() => {
    void loadData();

    const handleInventoryUpdate = () => void loadData();
    window.addEventListener("uscms_inventory_changed", handleInventoryUpdate);
    window.addEventListener("uscms_requisitions_changed", handleInventoryUpdate);
    window.addEventListener("uscms_goods_receiving_changed", handleInventoryUpdate);
    window.addEventListener("uscms_fixed_assets_changed", handleInventoryUpdate);
    window.addEventListener("uscms_transfers_changed", handleInventoryUpdate);
    window.addEventListener("uscms_returns_changed", handleInventoryUpdate);
    window.addEventListener("uscms_gatepasses_changed", handleInventoryUpdate);
    window.addEventListener("uscms_maintenance_changed", handleInventoryUpdate);
    window.addEventListener("uscms_audits_changed", handleInventoryUpdate);
    window.addEventListener("uscms_vendors_changed", handleInventoryUpdate);
    window.addEventListener("uscms_pos_changed", handleInventoryUpdate);
    window.addEventListener("uscms_disposals_changed", handleInventoryUpdate);
    window.addEventListener("uscms_hazmat_changed", handleInventoryUpdate);
    window.addEventListener("uscms_bincards_changed", handleInventoryUpdate);
    window.addEventListener("uscms_budgets_changed", handleInventoryUpdate);
    window.addEventListener("uscms_donations_changed", handleInventoryUpdate);

    return () => {
      window.removeEventListener("uscms_inventory_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_requisitions_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_goods_receiving_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_fixed_assets_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_transfers_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_returns_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_gatepasses_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_maintenance_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_audits_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_vendors_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_pos_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_disposals_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_hazmat_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_bincards_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_budgets_changed", handleInventoryUpdate);
      window.removeEventListener("uscms_donations_changed", handleInventoryUpdate);
    };
  }, []);

  // ✅ FIXED: Async loadData to correctly resolve Promises
  const loadData = async () => {
    try {
      const [
        inv, reqs, rec, fas, trfs, rets, gps, wos, audits,
        pos, vnds, disps, haz, bins, budgets, grants
      ] = await Promise.all([
        CampusDatabase.getInventoryItems().catch(() => []),
        CampusDatabase.getMaterialRequisitions().catch(() => []),
        CampusDatabase.getGoodsReceivingRecords().catch(() => []),
        CampusDatabase.getFixedAssets().catch(() => []),
        CampusDatabase.getInterStoreTransfers().catch(() => []),
        CampusDatabase.getPropertyReturns().catch(() => []),
        CampusDatabase.getCampusGatePasses().catch(() => []),
        CampusDatabase.getMaintenanceOrders().catch(() => []),
        CampusDatabase.getPhysicalAudits().catch(() => []),
        CampusDatabase.getPurchaseOrders().catch(() => []),
        CampusDatabase.getVendors().catch(() => []),
        CampusDatabase.getAssetDisposals().catch(() => []),
        CampusDatabase.getHazardousMaterials().catch(() => []),
        CampusDatabase.getStockBinCards().catch(() => []),
        CampusDatabase.getDepartmentBudgets().catch(() => []),
        CampusDatabase.getDonationGrantAssets().catch(() => []),
      ]);

      setInventory(Array.isArray(inv) ? inv : []);
      setRequisitions(Array.isArray(reqs) ? reqs : []);
      setReceivingRecords(Array.isArray(rec) ? rec : []);
      setFixedAssets(Array.isArray(fas) ? fas : []);
      setTransfers(Array.isArray(trfs) ? trfs : []);
      setPropertyReturns(Array.isArray(rets) ? rets : []);
      setGatePasses(Array.isArray(gps) ? gps : []);
      setWorkOrders(Array.isArray(wos) ? wos : []);
      setPhysicalAudits(Array.isArray(audits) ? audits : []);
      setPurchaseOrders(Array.isArray(pos) ? pos : []);
      setVendors(Array.isArray(vnds) ? vnds : []);
      setDisposals(Array.isArray(disps) ? disps : []);
      setHazardousMaterials(Array.isArray(haz) ? haz : []);
      setBinCardEntries(Array.isArray(bins) ? bins : []);
      setDepartmentBudgets(Array.isArray(budgets) ? budgets : []);
      setDonationGrantAssets(Array.isArray(grants) ? grants : []);
    } catch (err) {
      console.error("[MMS] loadData failed:", err);
    }
  };

  // Calculations & KPIs
  const totalValuation = inventory.reduce((sum, item) => sum + (item.totalValueETB || item.quantityInStock * item.unitCostETB), 0);
  const totalCatalogSKUs = inventory.length;
  const lowStockItems = inventory.filter((item) => item.status === "LOW_STOCK" || item.quantityInStock <= item.minThreshold);
  const outOfStockItems = inventory.filter((item) => item.status === "OUT_OF_STOCK" || item.quantityInStock === 0);
  const pendingRequisitions = requisitions.filter((r) => r.status === "PENDING_APPROVAL");
  const approvedRequisitions = requisitions.filter((r) => r.status === "APPROVED" || r.status === "DISPATCHED");

  // Handlers
  const handleCreateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCode.trim()) {
      alert("Please provide the Item Code and Description.");
      return;
    }

    const calculatedTotal = Number(newItemQty) * Number(newItemCost);
    const newItem: MaterialInventoryItem = {
      id: "MMS-ITEM-" + Date.now(),
      itemCode: newItemCode.trim().toUpperCase(),
      name: newItemName.trim(),
      amharicName: newItemAmharic.trim() || undefined,
      category: newItemCategory,
      description: newItemDesc.trim() || newItemName.trim(),
      quantityInStock: Number(newItemQty),
      unit: newItemUnit,
      minThreshold: Number(newItemThreshold),
      unitCostETB: Number(newItemCost),
      totalValueETB: calculatedTotal,
      warehouseLocation: newItemWarehouse,
      shelfBin: newItemBin.trim() || "Unassigned",
      status: Number(newItemQty) === 0 ? "OUT_OF_STOCK" : Number(newItemQty) <= Number(newItemThreshold) ? "LOW_STOCK" : "IN_STOCK",
      lastRestocked: new Date().toISOString().split("T")[0],
      supplier: newItemSupplier.trim() || undefined
    };

    try {
      await CampusDatabase.addInventoryItem(newItem);
      await loadData();
      setShowAddItemModal(false);

      // Reset Form
      setNewItemCode("");
      setNewItemName("");
      setNewItemAmharic("");
      setNewItemDesc("");
      setNewItemSupplier("");

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "MATERIAL_MANAGER",
        "Create Catalog Item",
        "MaterialInventoryItem",
        newItem.id,
        `Registered new inventory catalog item: ${newItem.name} (${newItem.itemCode}) with initial stock of ${newItem.quantityInStock} ${newItem.unit}.`
      );

      alert(`Item ${newItem.itemCode} successfully cataloged and stored in ${newItem.warehouseLocation}!`);
    } catch (error) {
      console.error(error);
      alert("Failed to create item.");
    }
  };

  const handleStockAdjustmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    const delta = stockAdjustmentType === "ADD" ? Math.abs(stockAdjustmentQty) : -Math.abs(stockAdjustmentQty);

    try {
      await CampusDatabase.adjustStock(
        selectedItemForAdjust.id,
        delta,
        stockAdjustmentReason || "Manual inventory reconciliation",
        user.fullName
      );

      await loadData();

      setShowAdjustStockModal(false);
      setSelectedItemForAdjust(null);
      setStockAdjustmentQty(1);
      setStockAdjustmentReason("");

      alert(`Stock adjusted successfully!`);
    } catch (error) {
      console.error(error);
      alert("Failed to adjust stock.");
    }
  };

  const handleApproveRequisition = async (reqId: string) => {
    const approver = user.fullName || "Solomon Kassa (Store Officer)";

    try {
      await CampusDatabase.updateMaterialRequisitionStatus(reqId, "APPROVED", "Approved for issue from campus store.", approver);
      await loadData();

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "MATERIAL_MANAGER",
        "Approve Material Requisition",
        "MaterialRequisition",
        reqId,
        `Approved requisition.`
      );

      alert(`Requisition APPROVED!`);
    } catch (error) {
      console.error(error);
      alert("Failed to approve requisition.");
    }
  };

  const handleDispatchRequisition = async (reqId: string) => {
    const approver = user.fullName || "Solomon Kassa (Store Officer)";

    try {
      await CampusDatabase.updateMaterialRequisitionStatus(reqId, "DISPATCHED", "Materials handed over and signed by receiver.", approver);
      await loadData();
      alert(`Requisition marked as DISPATCHED!`);
    } catch (error) {
      console.error(error);
      alert("Failed to dispatch requisition.");
    }
  };

  const handleRejectRequisition = async (reqId: string) => {
    const reason = prompt("Enter the reason for rejecting this material requisition:", "Insufficient stock or unverified course allocation.");
    if (reason !== null) {
      try {
        await CampusDatabase.updateMaterialRequisitionStatus(reqId, "REJECTED", reason, user.fullName);
        await loadData();
        alert(`Requisition has been rejected.`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSaveGoodsReceiving = async (e: FormEvent) => {
    e.preventDefault();
    if (!grnSupplier.trim() || !grnSelectedItemId) {
      alert("Please select an item and provide supplier details.");
      return;
    }

    const itemObj = inventory.find((it) => it.id === grnSelectedItemId);
    if (!itemObj) return;

    const totalCost = Number(grnItemQty) * Number(grnItemCost);
    const newGRN: GoodsReceivingRecord = {
      id: "GRN_" + Date.now(),
      grnNumber: `GRN-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      poNumber: grnPo.trim() || `PO-MAU-2026-${Math.floor(Math.random() * 900 + 100)}`,
      invoiceNumber: grnInvoice.trim() || `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
      supplierName: grnSupplier.trim(),
      supplierTIN: grnSupplierTIN.trim() || undefined,
      receivedDate: new Date().toISOString().split("T")[0],
      receivedBy: user.fullName || "Solomon Kassa",
      warehouseLocation: grnWarehouse,
      items: [
        {
          itemId: itemObj.id,
          itemCode: itemObj.itemCode,
          itemName: itemObj.name,
          quantityReceived: Number(grnItemQty),
          unitCostETB: Number(grnItemCost),
          totalCostETB: totalCost
        }
      ],
      totalAmountETB: totalCost,
      status: "VERIFIED_STOCKED",
      notes: grnNotes.trim() || "Technical inspection completed. Stored in designated warehouse shelf."
    };

    try {
      await CampusDatabase.addGoodsReceivingRecord(newGRN);
      await loadData();
      setShowReceivingModal(false);

      setGrnPo("");
      setGrnInvoice("");
      setGrnSupplier("");
      setGrnSupplierTIN("");
      setGrnNotes("");

      alert(`Model 19 (Goods Receiving Note) ${newGRN.grnNumber} registered!`);
    } catch (error) {
      console.error(error);
      alert("Failed to save GRN.");
    }
  };

  const handleSaveFixedAsset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetTag.trim()) {
      alert("Please fill in the Asset Tag and Name.");
      return;
    }

    const newAsset: FixedAssetItem = {
      id: "FA_" + Date.now(),
      assetTag: newAssetTag.trim().toUpperCase(),
      serialNumber: newAssetSerial.trim() || `SN-${Math.floor(Math.random() * 900000 + 100000)}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      model: newAssetModel.trim() || "Standard Enterprise Spec",
      purchaseDate: new Date().toISOString().split("T")[0],
      purchaseCostETB: Number(newAssetCost),
      currentValueETB: Number(newAssetCost),
      custodianName: newAssetCustodian.trim() || "Unassigned",
      custodianDepartment: newAssetDept.trim(),
      location: newAssetLocation.trim(),
      condition: newAssetCondition
    };

    try {
      await CampusDatabase.addFixedAsset(newAsset);
      await loadData();
      setShowAssetModal(false);

      setNewAssetTag(`MAU-FA-2026-${Math.floor(Math.random() * 900 + 100)}`);
      setNewAssetSerial("");
      setNewAssetName("");
      setNewAssetCustodian("");

      alert(`Fixed Asset Tag ${newAsset.assetTag} registered to ${newAsset.custodianName}!`);
    } catch (error) {
      console.error(error);
      alert("Failed to register asset.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Item Code", "Name", "Category", "Quantity In Stock", "Unit", "Unit Cost (ETB)", "Total Value (ETB)", "Warehouse", "Status"];
    const rows = inventory.map((it) => [
      it.itemCode,
      `"${it.name.replace(/"/g, '""')}"`,
      it.category,
      it.quantityInStock,
      it.unit,
      it.unitCostETB,
      it.totalValueETB,
      `"${it.warehouseLocation}"`,
      it.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MAU_Material_Inventory_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered views
  const filteredCatalog = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesStock =
      selectedStockFilter === "ALL" ||
      (selectedStockFilter === "LOW_STOCK" && (item.status === "LOW_STOCK" || item.quantityInStock <= item.minThreshold)) ||
      (selectedStockFilter === "OUT_OF_STOCK" && (item.status === "OUT_OF_STOCK" || item.quantityInStock === 0)) ||
      (selectedStockFilter === "IN_STOCK" && item.status === "IN_STOCK" && item.quantityInStock > item.minThreshold);
    const matchesWarehouse = selectedWarehouseFilter === "ALL" || item.warehouseLocation === selectedWarehouseFilter;
    return matchesSearch && matchesCategory && matchesStock && matchesWarehouse;
  });

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch =
      req.requisitionNumber.toLowerCase().includes(requisitionSearch.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(requisitionSearch.toLowerCase()) ||
      req.department.toLowerCase().includes(requisitionSearch.toLowerCase()) ||
      req.purpose.toLowerCase().includes(requisitionSearch.toLowerCase());
    const matchesStatus = selectedReqStatus === "ALL" || req.status === selectedReqStatus;
    return matchesSearch && matchesStatus;
  });

  const navigationItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "catalog", label: "Catalog & Stock", icon: Boxes, count: lowStockItems.length },
    { id: "requisitions", label: "Requisitions (M20/22)", icon: Package, count: pendingRequisitions.length },
    { id: "receiving", label: "Receiving (M19)", icon: ArrowDownRight },
    { id: "procurement", label: "Procurement & POs", icon: ShoppingCart, count: purchaseOrders.filter((p) => p.status === "DRAFT").length },
    { id: "bin_card", label: "Stock Bin Card (ቢን ካርድ)", icon: FileSpreadsheet },
    { id: "disposals", label: "Disposal & Auction Board", icon: Gavel, count: disposals.filter((d) => d.status === "TENDER_PUBLISHED").length },
    { id: "chemicals", label: "Chemical Safety / MSDS", icon: Biohazard, count: hazardousMaterials.filter((h) => h.inspectionStatus === "CRITICAL_ACTION_REQUIRED").length },
    { id: "budgets", label: "Store Budgets & Grants", icon: Coins },
    { id: "transfers", label: "Transfers (M21)", icon: ArrowRightLeft, count: transfers.filter((t) => t.status === "IN_TRANSIT").length },
    { id: "returns", label: "Returns (M23)", icon: RotateCcw },
    { id: "gate_pass", label: "Security Gate Pass", icon: ShieldCheck, count: gatePasses.filter((g) => g.status === "AUTHORIZED").length },
    { id: "fixed_assets", label: "Fixed Assets & Depreciation", icon: Barcode },
    { id: "maintenance", label: "Maintenance Orders", icon: Wrench, count: workOrders.filter((w) => w.status !== "REPAIRED").length },
    { id: "audit", label: "Physical Audit", icon: ClipboardCheck },
    { id: "asset_tags", label: "Barcode Asset Tags", icon: QrCode },
    { id: "hardware_iot", label: "Physical Hardware & IoT", icon: Cctv },
    { id: "warehouses", label: "Warehouses", icon: Warehouse },
    { id: "alerts", label: "Campus Alerts", icon: Radio }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#071322] flex flex-col font-sans transition-colors duration-200">
      {/* Official Top Bar */}
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Material Management System"
        portalSubtitle="Property Administration & Store Directorate • የንብረት እና ዕቃ አስተዳደር ዳይሬክቶሬት"
        badgeText="PROPERTY & STORE MANAGER"
        badgeType="faculty"
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#071526] text-slate-300 shadow-2xl flex flex-col border-r border-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">STORE OFFICER</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 flex-1 overflow-y-auto space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.count && item.count > 0 ? (
                        <span className="bg-amber-400 text-slate-900 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                <button
                  onClick={onLogout}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Layout Body */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Desktop Quick Horizontal Sub-Navigation Tab Bar */}
        <div className="hidden md:flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 dark:text-slate-900" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.count && item.count > 0 ? (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-amber-400 text-slate-900 dark:bg-slate-950 dark:text-amber-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 pl-2">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catalog New Item</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: EXECUTIVE OVERVIEW & STOCK TELEMETRY                   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Total Inventory Value</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {totalValuation.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">ETB</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <span className="font-semibold text-emerald-600">Audited</span>
                  <span>· Across 4 Central Warehouses</span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Catalog SKUs</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {totalCatalogSKUs} <span className="text-xs font-sans font-normal text-slate-400">Items</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <span>Active Stock Items</span>
                  <span>· ICT, Labs & Offices</span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Low Stock & Reorders</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {lowStockItems.length + outOfStockItems.length} <span className="text-xs font-sans font-normal text-slate-400">Alerts</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <span>Below safety threshold</span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Pending Requisitions</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
                  {pendingRequisitions.length} <span className="text-xs font-sans font-normal text-slate-400">Model 20</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <span>From Instructors & Staff</span>
                </div>
              </div>
            </div>

            {/* University-Wide Operational Control Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("procurement")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Procurement (POs)</span>
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {purchaseOrders.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Active Orders</span>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block">Vendor PO Pipeline →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bin_card")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Stock Bin Card</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {binCardEntries.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Transactions</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">Digital Ledger Timeline →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("disposals")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Disposal & Auction</span>
                  <Gavel className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {disposals.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Condemned</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">FPPAA Public Tender →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("chemicals")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Chemical Safety</span>
                  <Biohazard className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {hazardousMaterials.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Reagents</span>
                </div>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5 block">MSDS & Safety Bunkers →</span>
              </button>
            </div>

            {/* University Logistics & Store Operations Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("transfers")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Model 21 Transfers</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {transfers.filter((t) => t.status === "IN_TRANSIT").length} <span className="text-[10px] font-sans text-slate-400 font-normal">In Transit</span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 block">Inter-Store Logistics →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("gate_pass")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Security Gate Passes</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {gatePasses.filter((g) => g.status === "AUTHORIZED").length} <span className="text-[10px] font-sans text-slate-400 font-normal">Authorized</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">Campus Exit Verification →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("budgets")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">Store Quotas & Grants</span>
                  <Coins className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {departmentBudgets.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Colleges</span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 block">Department Spending Quotas →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className="text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-mono text-[10px] uppercase">MoE Stock Audit</span>
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {physicalAudits.filter((a) => a.reconciliationStatus === "RECONCILED").length}/{physicalAudits.length} <span className="text-[10px] font-sans text-slate-400 font-normal">Reconciled</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">Physical Count Sheet →</span>
              </button>
            </div>

            {/* Warehouse Distribution Cards & Requisition Action Board */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Low Stock Urgent Action Board */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Stock Depletion & Reorder Queue (ማንቂያ)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Items that reached critical safety limits requiring purchase order replenishment.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReceivingModal(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inward Delivery (M19)</span>
                  </button>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All inventory levels are nominal.</p>
                    <p className="text-[11px] text-slate-500">No items are below minimum safety thresholds.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              {item.itemCode}
                            </span>
                            <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold px-1.5 py-0.2 rounded font-mono">
                              LOW STOCK
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {item.name}
                          </h4>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                            <span>Remaining: <strong className="font-mono text-red-600 dark:text-red-400">{item.quantityInStock} {item.unit}</strong></span>
                            <span>·</span>
                            <span>Min Safety: <strong className="font-mono">{item.minThreshold} {item.unit}</strong></span>
                            <span>·</span>
                            <span className="truncate">{item.warehouseLocation}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedItemForAdjust(item);
                            setStockAdjustmentType("ADD");
                            setStockAdjustmentQty(10);
                            setStockAdjustmentReason("Replenishment restock");
                            setShowAdjustStockModal(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                        >
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Store Warehouse Capacities */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
                    <Warehouse className="w-4 h-4 text-primary" />
                    <span>Campus Warehouses (መጋዘኖች)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Storage facilities across Tulu Awulia and Masha campuses.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Central Store (Tulu Awulia)", type: "General Supplies & Paper", itemsCount: 4, manager: "Solomon Kassa" },
                    { name: "ICT & Electronics Store (Main)", type: "Workstations, Switches & Projectors", itemsCount: 3, manager: "Teklu A." },
                    { name: "Science & Engineering Lab Store", type: "Microcontrollers, Sensors & Test Equipment", itemsCount: 4, manager: "Girma W." },
                    { name: "Chemical & Hazardous Material Store", type: "Acids, Solvents & Reagents", itemsCount: 2, manager: "Dr. Aster T." }
                  ].map((wh, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{wh.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{wh.type}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Keeper: {wh.manager}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {wh.itemsCount} SKUs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Export Store Data:</span>
                  <button
                    onClick={handleExportCSV}
                    className="text-primary hover:underline font-bold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Ledger (CSV)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Requisition Submissions Stream */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>Recent Material Requisitions (የዕቃ መጠየቂያዎች)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Faculty, Department, and Registrar requests awaiting review or dispatch.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("requisitions")}
                  className="text-xs font-bold text-purple-600 hover:underline flex items-center space-x-1"
                >
                  <span>View All ({requisitions.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono text-[11px] uppercase border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Req Number</th>
                      <th className="py-2.5 px-3">Requester & Dept</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requisitions.slice(0, 4).map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {req.requisitionNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{req.requesterName}</div>
                          <div className="text-[11px] text-slate-400">{req.department}</div>
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-slate-400">
                          {req.purpose}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono">{req.items.length} items</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {req.requestedDate}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              req.status === "PENDING_APPROVAL"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : req.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : req.status === "DISPATCHED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveVoucherRequisition(req)}
                            className="text-primary hover:underline font-bold inline-flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: INVENTORY CATALOG & STOCK CONTROL                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "catalog" && (
          <div className="space-y-5">
            {/* Control Strip: Search, Filters, Add Item, Export */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search by code (e.g. MMS-ICT-001), item name, or specs..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catalog Item</span>
                  </button>
                </div>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold mr-1">Categories:</span>
                {[
                  { key: "ALL", label: "All Items" },
                  { key: "ICT_ELECTRONICS", label: "ICT & Hardware" },
                  { key: "LAB_APPARATUS", label: "Lab Equipment" },
                  { key: "CHEMICALS_REAGENTS", label: "Chemicals & Reagents" },
                  { key: "OFFICE_STATIONERY", label: "Stationery" },
                  { key: "ENGINEERING_TOOLS", label: "Tools" },
                  { key: "FURNITURE", label: "Furniture" },
                  { key: "DORMITORY_SUPPLIES", label: "Dorm Supplies" },
                  { key: "CLINICAL_MEDICAL", label: "Clinic & Med" }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedCategory === cat.key
                        ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}

                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold ml-auto mr-1">Health:</span>
                {[
                  { key: "ALL", label: "All Stock" },
                  { key: "LOW_STOCK", label: "Low Stock" },
                  { key: "IN_STOCK", label: "Adequate" }
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setSelectedStockFilter(st.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedStockFilter === st.key
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Description / Specs</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Warehouse & Bin</th>
                      <th className="py-3 px-4 text-right">In Stock</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Total Value</th>
                      <th className="py-3 px-4 text-center">Health</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                          No inventory items match the current search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.itemCode}
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.name}
                            </div>
                            {item.amharicName && (
                              <div className="text-[11px] text-amber-700 dark:text-amber-400/90 font-serif">
                                {item.amharicName}
                              </div>
                            )}
                            {item.specs && (
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.specs}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <span className="font-mono text-[11px]">
                              {item.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">
                              {item.warehouseLocation}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Bin: {item.shelfBin}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                            <span className={item.quantityInStock <= item.minThreshold ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}>
                              {item.quantityInStock}
                            </span>{" "}
                            <span className="text-[11px] text-slate-400 font-sans">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {item.unitCostETB.toLocaleString()} ETB
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            {(item.totalValueETB || item.quantityInStock * item.unitCostETB).toLocaleString()} ETB
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                item.quantityInStock === 0
                                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                  : item.quantityInStock <= item.minThreshold
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {item.quantityInStock === 0 ? "DEPLETED" : item.quantityInStock <= item.minThreshold ? "LOW STOCK" : "IN STOCK"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItemForAdjust(item);
                                setStockAdjustmentType("ADD");
                                setStockAdjustmentQty(1);
                                setStockAdjustmentReason("");
                                setShowAdjustStockModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer shadow-2xs"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MATERIAL REQUISITIONS (MODEL 20 & 22)                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "requisitions" && (
          <div className="space-y-5">
            {/* Header info & Filter toolbar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={requisitionSearch}
                    onChange={(e) => setRequisitionSearch(e.target.value)}
                    placeholder="Search requisitions by number, requester, department, or purpose..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-mono">Status:</span>
                  {["ALL", "PENDING_APPROVAL", "APPROVED", "DISPATCHED", "REJECTED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedReqStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedReqStatus === st
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Requisitions List */}
            <div className="space-y-3">
              {filteredRequisitions.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No material requisitions found.</p>
                  <p className="text-[11px]">When instructors or departments submit requests, they will appear here for store approval.</p>
                </div>
              ) : (
                filteredRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                            {req.requisitionNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              req.urgency === "CRITICAL"
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                : req.urgency === "URGENT"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {req.urgency}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              req.status === "PENDING_APPROVAL"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : req.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : req.status === "DISPATCHED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          Purpose: {req.purpose}
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{req.requesterName}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{req.department} · {req.requestedDate}</div>
                        {req.dispatchVoucherNumber && (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            Issue Note: {req.dispatchVoucherNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requested Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-slate-50/60 dark:bg-slate-800/40 rounded-xl overflow-hidden">
                        <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2 px-3">Item Code</th>
                            <th className="py-2 px-3">Item Name</th>
                            <th className="py-2 px-3 text-right">Requested Qty</th>
                            <th className="py-2 px-3 text-right">Current Stock In Store</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                          {req.items.map((item, idx) => {
                            const invObj = inventory.find((i) => i.id === item.itemId || i.itemCode === item.itemCode);
                            const stockAvailable = invObj ? invObj.quantityInStock : "Unknown";
                            const isEnough = invObj ? invObj.quantityInStock >= item.quantityRequested : true;

                            return (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {item.itemCode}
                                </td>
                                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                  {item.itemName}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {item.quantityRequested} {item.unit}
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  <span className={!isEnough ? "text-red-500 font-bold" : "text-emerald-600 font-medium"}>
                                    {stockAvailable} {item.unit}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {req.remarks && (
                      <p className="text-[11px] text-slate-500 italic">
                        Remarks: {req.remarks}
                      </p>
                    )}

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setActiveVoucherRequisition(req)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print Model 20 & 22 Voucher</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {req.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => handleRejectRequisition(req.id)}
                              className="px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-xs font-bold transition cursor-pointer"
                            >
                              Reject Request
                            </button>
                            <button
                              onClick={() => handleApproveRequisition(req.id)}
                              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Issue (Model 22)</span>
                            </button>
                          </>
                        )}

                        {req.status === "APPROVED" && (
                          <button
                            onClick={() => handleDispatchRequisition(req.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Dispatched & Handed Over</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: INWARD GOODS RECEIVING (MODEL 19 - GRN)               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "receiving" && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center space-x-2">
                  <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                  <span>Model 19 (Goods Receiving Notes - ዕቃ መቀበያ ደረሰኝ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Official registry of newly procured materials and supplies delivered by vendors, verified by the technical inspection committee and received into university storage.
                </p>
              </div>

              <button
                onClick={() => setShowReceivingModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Receive New Delivery (M19)</span>
              </button>
            </div>

            {/* GRN Records Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">GRN Number</th>
                      <th className="py-3 px-4">PO & Invoice Ref</th>
                      <th className="py-3 px-4">Supplier / Vendor</th>
                      <th className="py-3 px-4">Date Received</th>
                      <th className="py-3 px-4">Warehouse</th>
                      <th className="py-3 px-4">Items Received</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receivingRecords.map((grn) => (
                      <tr key={grn.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {grn.grnNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{grn.poNumber}</div>
                          <div className="text-[11px] text-slate-400">{grn.invoiceNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{grn.supplierName}</div>
                          {grn.supplierTIN && <div className="text-[10px] font-mono text-slate-400">TIN: {grn.supplierTIN}</div>}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {grn.receivedDate}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {grn.warehouseLocation}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono">{grn.items.reduce((s, it) => s + it.quantityReceived, 0)} units</span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {grn.items.map((i) => i.itemName).join(", ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {grn.totalAmountETB.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {grn.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveGRNPreview(grn)}
                            className="text-primary hover:underline font-bold inline-flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ENTERPRISE TAB: PROCUREMENT & PURCHASE ORDERS (PO)            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "procurement" && (
          <ProcurementOrdersTab
            user={user}
            inventory={inventory}
            purchaseOrders={purchaseOrders}
            vendors={vendors}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* ENTERPRISE TAB: DIGITAL STOCK BIN CARD (ቢን ካርድ) LEDGER       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "bin_card" && (
          <StockBinCardTab
            user={user}
            inventory={inventory}
            binCardEntries={binCardEntries}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* ENTERPRISE TAB: ASSET DECOMMISSIONING & AUCTION BOARD         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "disposals" && (
          <AssetDisposalTab
            user={user}
            fixedAssets={fixedAssets}
            disposals={disposals}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* ENTERPRISE TAB: CHEMICAL SAFETY & MSDS REGISTRY               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "chemicals" && (
          <ChemicalSafetyTab
            user={user}
            inventory={inventory}
            hazardousMaterials={hazardousMaterials}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* ENTERPRISE TAB: DEPARTMENT STORE BUDGETS & GRANT ASSETS       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "budgets" && (
          <DepartmentBudgetsTab
            user={user}
            budgets={departmentBudgets}
            donations={donationGrantAssets}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4.1: MODEL 21 INTER-STORE TRANSFERS                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "transfers" && (
          <InterStoreTransfersTab
            user={user}
            inventory={inventory}
            transfers={transfers}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4.2: MODEL 23 PROPERTY RETURNS & CLEARANCE RECOVERY       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "returns" && (
          <PropertyReturnsTab
            user={user}
            inventory={inventory}
            returns={propertyReturns}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4.3: CAMPUS SECURITY GATE PASSES                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "gate_pass" && (
          <CampusGatePassTab
            user={user}
            gatePasses={gatePasses}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: FIXED ASSET REGISTRY & DEPRECIATION                    */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "fixed_assets" && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center space-x-2">
                  <Barcode className="w-5 h-5 text-blue-600" />
                  <span>Fixed Asset Registry & Depreciation (ቋሚ ንብረት መዝገብ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Capitalized institutional assets with straight-line depreciation, useful life, accumulated amortization, and room locations.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("asset_tags")}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Barcode Tag Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssetModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Fixed Asset</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {asset.assetTag}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        asset.condition === "EXCELLENT"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : asset.condition === "GOOD"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {asset.condition}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {asset.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      SN: {asset.serialNumber} · {asset.model}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Custodian:</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{asset.custodianName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dept:</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{asset.custodianDepartment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{asset.location}</span>
                    </div>
                    {asset.buildingBlock && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Block / Room:</span>
                        <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">{asset.buildingBlock} • {asset.roomNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-400">Purchase / NBV:</span>
                      <div className="text-right">
                        <span className="text-slate-500 line-through text-[10px] mr-1">{asset.purchaseCostETB.toLocaleString()}</span>
                        <strong className="text-slate-900 dark:text-slate-100">{asset.currentValueETB.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                    {asset.accumulatedDepreciationETB && (
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Depreciation (Straight-Line):</span>
                        <span>-{asset.accumulatedDepreciationETB.toLocaleString()} ETB ({asset.usefulLifeYears || 5}y life)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5.1: EQUIPMENT MAINTENANCE & REPAIR ORDERS                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "maintenance" && (
          <MaintenanceOrdersTab
            user={user}
            fixedAssets={fixedAssets}
            workOrders={workOrders}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5.2: PHYSICAL INVENTORY & AUDIT RECONCILIATION            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "audit" && (
          <PhysicalAuditTab
            user={user}
            audits={physicalAudits}
            onRefresh={loadData}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5.3: BARCODE & ASSET TAG PRINTING SUITE                   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "asset_tags" && (
          <BarcodeTagPrintingTab assets={fixedAssets} />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: WAREHOUSES & LOCATIONS                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "warehouses" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center space-x-2">
                <Warehouse className="w-5 h-5 text-primary" />
                <span>University Store Facilities & Storage Depots (መጋዘኖች)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Real-time tracking of storeroom bin racks, safety compliance, inventory segregation, and authorized storekeepers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  name: "Central Store (Tulu Awulia Main Campus)",
                  code: "WH-MAU-01",
                  location: "Block H, Ground Floor",
                  keeper: "Solomon Kassa (Lead Store Manager)",
                  itemsCount: inventory.filter((i) => i.warehouseLocation.includes("Central Store")).length,
                  capacity: "85% Utilized",
                  type: "General Stationery, Office Furniture, Paper & Transcripts",
                  safety: "Fire suppression system certified, 24/7 CCTV active"
                },
                {
                  name: "ICT & Electronics Store (Main)",
                  code: "WH-MAU-02",
                  location: "Block B, Technology Complex",
                  keeper: "Teklu Assefa (Hardware Specialist)",
                  itemsCount: inventory.filter((i) => i.warehouseLocation.includes("ICT")).length,
                  capacity: "62% Utilized",
                  type: "Desktops, Managed Switches, Fiber Cables, Projectors",
                  safety: "Anti-static ESD flooring, humidity & temperature regulated"
                },
                {
                  name: "Science & Engineering Lab Store",
                  code: "WH-MAU-03",
                  location: "Block C, Engineering Workshop Wings",
                  keeper: "Girma Worku (Lab Technician)",
                  itemsCount: inventory.filter((i) => i.warehouseLocation.includes("Engineering")).length,
                  capacity: "74% Utilized",
                  type: "Microcontrollers, Oscilloscopes, Multimeters, Soldering Units",
                  safety: "Lockers with barcode bin access control"
                },
                {
                  name: "Chemical & Hazardous Material Store",
                  code: "WH-MAU-04",
                  location: "Science Complex, Isolated North Bunker",
                  keeper: "Dr. Aster Tadesse (Chemical Safety Officer)",
                  itemsCount: inventory.filter((i) => i.warehouseLocation.includes("Chemical")).length,
                  capacity: "45% Utilized",
                  type: "Organic Solvents, Mineral Acids, Titration Reagents",
                  safety: "Explosion-proof ventilation, chemical spill containment kits"
                }
              ].map((store, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {store.code}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                      {store.capacity}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{store.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{store.location}</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inventory Items:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{store.itemsCount} SKUs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storekeeper:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{store.keeper}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <strong>Stored:</strong> {store.type}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      ✓ {store.safety}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: CAMPUS ALERTS                                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {/* <SmartCampusAlerts user={user} /> */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
              <Radio className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Campus Alerts Module</h3>
              <p className="text-xs text-slate-500 mt-1">This module is currently being integrated.</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: FIXED ASSET HARDWARE & IOT DEVICES TELEMETRY          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "hardware_iot" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <Cctv className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-slate-100">
                    Property Administration · Fixed Asset Physical Hardware & IoT Telemetry
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Unified institutional surveillance cameras, turnstiles, biometric scanners, and IoT environmental micro-sensors registered as capital university property. Real-time RTSP AI video streams, telemetry sensors, and automated safety relays.
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ● ACTIVE HARDWARE ASSETS
                </span>
              </div>
            </div>

            {/* <SmartCampusHardwareHub user={user} /> */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
              <Cctv className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">IoT & Hardware Hub</h3>
              <p className="text-sm text-slate-500 mt-1">This advanced IoT telemetry dashboard is currently being integrated into the MMS.</p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW CATALOG ITEM                                   */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden font-sans"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <Boxes className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Catalog New Store Inventory Item</h3>
                    <p className="text-[11px] text-amber-300 font-mono">University Material Management Registry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Item Code (የዕቃ መለያ ኮድ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MMS-ICT-009"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Category (ምድብ) *</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="ICT_ELECTRONICS">ICT & Electronics</option>
                      <option value="LAB_APPARATUS">Laboratory Apparatus</option>
                      <option value="CHEMICALS_REAGENTS">Chemicals & Reagents</option>
                      <option value="OFFICE_STATIONERY">Office Stationery</option>
                      <option value="ENGINEERING_TOOLS">Engineering Tools</option>
                      <option value="FURNITURE">Campus Furniture</option>
                      <option value="DORMITORY_SUPPLIES">Dormitory & Facilities Supplies</option>
                      <option value="CLINICAL_MEDICAL">Clinical & Medical Supplies</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Item Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cat6 UTP Network Cable Reel (305 Meters)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Amharic Name (የዕቃው ስም በአማርኛ)</label>
                  <input
                    type="text"
                    placeholder="ለምሳሌ፡ የኔትወርክ ኬብል ጥቅል (305 ሜትር)"
                    value={newItemAmharic}
                    onChange={(e) => setNewItemAmharic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-serif"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Initial Qty *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Unit of Measure *</label>
                    <input
                      type="text"
                      required
                      placeholder="units, boxes, reels..."
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Min Threshold</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newItemThreshold}
                      onChange={(e) => setNewItemThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Unit Cost (ETB) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newItemCost}
                      onChange={(e) => setNewItemCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Warehouse Location *</label>
                    <select
                      value={newItemWarehouse}
                      onChange={(e) => setNewItemWarehouse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Central Store (Tulu Awulia)">Central Store (Tulu Awulia)</option>
                      <option value="ICT & Electronics Store (Main)">ICT & Electronics Store (Main)</option>
                      <option value="Science & Engineering Lab Store">Science & Engineering Lab Store</option>
                      <option value="Chemical & Hazardous Material Store">Chemical & Hazardous Material Store</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Shelf / Rack Bin</label>
                    <input
                      type="text"
                      placeholder="e.g. Rack C-03"
                      value={newItemBin}
                      onChange={(e) => setNewItemBin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Supplier / Vendor</label>
                    <input
                      type="text"
                      placeholder="e.g. Ethio-Telecom / Commercial PLC"
                      value={newItemSupplier}
                      onChange={(e) => setNewItemSupplier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Technical Specifications & Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter detailed technical specs, model numbers, warranty terms..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-xs"
                  >
                    Save & Catalog Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: STOCK ADJUSTMENT (+ / -)                                */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAdjustStockModal && selectedItemForAdjust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm">Adjust Inventory Stock Balance</h3>
                    <p className="text-[11px] text-amber-300 font-mono">{selectedItemForAdjust.itemCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdjustStockModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStockAdjustmentSubmit} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{selectedItemForAdjust.name}</div>
                  <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                    <span>Current Stock: <strong>{selectedItemForAdjust.quantityInStock} {selectedItemForAdjust.unit}</strong></span>
                    <span>Safety Min: <strong>{selectedItemForAdjust.minThreshold}</strong></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Adjustment Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStockAdjustmentType("ADD")}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition ${
                        stockAdjustmentType === "ADD"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      <span>Stock In (+ Add)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockAdjustmentType("DEDUCT")}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition ${
                        stockAdjustmentType === "DEDUCT"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Stock Out (- Deduct)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Quantity to Adjust ({selectedItemForAdjust.unit}) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={stockAdjustmentQty}
                    onChange={(e) => setStockAdjustmentQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Reason / Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physical inventory count, damaged item write-off..."
                    value={stockAdjustmentReason}
                    onChange={(e) => setStockAdjustmentReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAdjustStockModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition shadow-xs"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INWARD DELIVERY (MODEL 19 - GRN)                       */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showReceivingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden font-sans"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <ArrowDownRight className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-base">Register Goods Receiving (Model 19)</h3>
                    <p className="text-[11px] text-amber-300 font-mono">የዕቃ መቀበያ ደረሰኝ መመዝገቢያ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceivingModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGoodsReceiving} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Purchase Order (PO Number) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PO-MAU-2026-9041"
                      value={grnPo}
                      onChange={(e) => setGrnPo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Vendor Invoice Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-2026-4491"
                      value={grnInvoice}
                      onChange={(e) => setGrnInvoice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Supplier / Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ethio-Telecom / Berhanena Selam"
                      value={grnSupplier}
                      onChange={(e) => setGrnSupplier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Supplier TIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0019284109"
                      value={grnSupplierTIN}
                      onChange={(e) => setGrnSupplierTIN(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Select Item Being Received *</label>
                  <select
                    required
                    value={grnSelectedItemId}
                    onChange={(e) => {
                      setGrnSelectedItemId(e.target.value);
                      const it = inventory.find((i) => i.id === e.target.value);
                      if (it) {
                        setGrnItemCost(it.unitCostETB);
                        setGrnWarehouse(it.warehouseLocation);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">-- Choose item from inventory catalog --</option>
                    {inventory.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.itemCode} - {it.name} (Current: {it.quantityInStock} {it.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Quantity Received *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={grnItemQty}
                      onChange={(e) => setGrnItemQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Unit Cost (ETB) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={grnItemCost}
                      onChange={(e) => setGrnItemCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Destination Warehouse *</label>
                  <select
                    value={grnWarehouse}
                    onChange={(e) => setGrnWarehouse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Central Store (Tulu Awulia)">Central Store (Tulu Awulia)</option>
                    <option value="ICT & Electronics Store (Main)">ICT & Electronics Store (Main)</option>
                    <option value="Science & Engineering Lab Store">Science & Engineering Lab Store</option>
                    <option value="Chemical & Hazardous Material Store">Chemical & Hazardous Material Store</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Inspection Notes & Quality Verification</label>
                  <textarea
                    rows={2}
                    placeholder="Technical inspection committee sign-off notes..."
                    value={grnNotes}
                    onChange={(e) => setGrnNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReceivingModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
                  >
                    Generate Model 19 GRN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REGISTER FIXED ASSET                                    */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans"
            >
              <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-2.5">
                  <Barcode className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-sm">Register Capital Fixed Asset</h3>
                    <p className="text-[11px] text-amber-300 font-mono">ቋሚ ንብረት መዝገብ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssetModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFixedAsset} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Asset Tag Barcode *</label>
                    <input
                      type="text"
                      required
                      value={newAssetTag}
                      onChange={(e) => setNewAssetTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-892104"
                      value={newAssetSerial}
                      onChange={(e) => setNewAssetSerial(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Asset Name & Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell OptiPlex 7090 Workstation"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Custodian (ባለአደራ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Chalachew M"
                      value={newAssetCustodian}
                      onChange={(e) => setNewAssetCustodian(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Department *</label>
                    <input
                      type="text"
                      required
                      value={newAssetDept}
                      onChange={(e) => setNewAssetDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Location (ህንፃ / ክፍል) *</label>
                    <input
                      type="text"
                      required
                      value={newAssetLocation}
                      onChange={(e) => setNewAssetLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Purchase Cost (ETB) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newAssetCost}
                      onChange={(e) => setNewAssetCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAssetModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-xs"
                  >
                    Register Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: OFFICIAL PRINTABLE MODEL 20 & 22 VOUCHER               */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeVoucherRequisition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              {/* Header Toolbar */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm">Official Model 20 / 22 Material Issue Note</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                  <button
                    onClick={() => setActiveVoucherRequisition(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-serif">
                {/* Ministry & University Official Header */}
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <EthiopianFlag className="w-7 h-4.5 rounded-xs" />
                    <UniversitySeal className="w-12 h-12" />
                  </div>
                  <h2 className="font-bold text-sm tracking-wide uppercase">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <p className="text-xs text-slate-700 italic">Property Administration & Store Directorate (የንብረትና ስቶር አስተዳደር ዳይሬክቶሬት)</p>
                  <div className="inline-block border border-slate-900 px-3 py-1 rounded mt-2 font-mono font-bold text-xs">
                    MODEL 22: STORE ISSUE VOUCHER (የዕቃ መውጫ ደረሰኝ)
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Requisition No:</strong> <span className="font-mono">{activeVoucherRequisition.requisitionNumber}</span></div>
                    <div><strong>Issue Voucher No:</strong> <span className="font-mono text-emerald-700 font-bold">{activeVoucherRequisition.dispatchVoucherNumber || "M22-PENDING"}</span></div>
                    <div><strong>Department:</strong> {activeVoucherRequisition.department}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Requested:</strong> <span className="font-mono">{activeVoucherRequisition.requestedDate}</span></div>
                    <div><strong>Requester:</strong> {activeVoucherRequisition.requesterName}</div>
                    <div><strong>Status:</strong> <span className="font-mono font-bold uppercase">{activeVoucherRequisition.status}</span></div>
                  </div>
                </div>

                {/* Purpose Callout */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans">
                  <strong>Purpose / Justification (የዕቃው አገልግሎት):</strong>
                  <p className="text-slate-700 mt-0.5">{activeVoucherRequisition.purpose}</p>
                </div>

                {/* Items Ledger Table */}
                <table className="w-full text-left text-xs border border-slate-300 font-sans">
                  <thead className="bg-slate-100 font-mono text-[11px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">No.</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Code</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Description</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">Qty Requested</th>
                      <th className="py-2 px-3 text-right">Qty Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeVoucherRequisition.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 border-r border-slate-300 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 border-r border-slate-300 font-mono font-bold">{item.itemCode}</td>
                        <td className="py-2.5 px-3 border-r border-slate-300 font-medium">{item.itemName}</td>
                        <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono">{item.quantityRequested} {item.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {activeVoucherRequisition.status === "APPROVED" || activeVoucherRequisition.status === "DISPATCHED" ? item.quantityRequested : 0} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Official Signatures Row */}
                <div className="grid grid-cols-3 gap-4 pt-8 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Requested By:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucherRequisition.requesterName}</p>
                      <p className="text-[10px] text-slate-400">Department Faculty</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Approved & Issued By:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeVoucherRequisition.approvedBy || "Solomon Kassa"}</p>
                      <p className="text-[10px] text-slate-400">Storekeeper / Property Officer</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Received By:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">____________________</p>
                      <p className="text-[10px] text-slate-400">Receiver Signature & Stamp</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveVoucherRequisition(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: OFFICIAL PRINTABLE MODEL 19 GRN VOUCHER                */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeGRNPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm">Official Model 19 Goods Receiving Note</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print GRN</span>
                  </button>
                  <button
                    onClick={() => setActiveGRNPreview(null)}
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
                  <h2 className="font-bold text-sm tracking-wide uppercase">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <div className="inline-block border border-slate-900 px-3 py-1 rounded mt-2 font-mono font-bold text-xs bg-emerald-50">
                    MODEL 19: GOODS RECEIVING NOTE (ዕቃ መቀበያ ደረሰኝ)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>GRN Number:</strong> <span className="font-mono font-bold">{activeGRNPreview.grnNumber}</span></div>
                    <div><strong>PO Number:</strong> <span className="font-mono">{activeGRNPreview.poNumber}</span></div>
                    <div><strong>Supplier:</strong> {activeGRNPreview.supplierName}</div>
                    {activeGRNPreview.supplierTIN && <div><strong>TIN:</strong> <span className="font-mono">{activeGRNPreview.supplierTIN}</span></div>}
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Received:</strong> <span className="font-mono">{activeGRNPreview.receivedDate}</span></div>
                    <div><strong>Invoice No:</strong> <span className="font-mono">{activeGRNPreview.invoiceNumber}</span></div>
                    <div><strong>Store Location:</strong> {activeGRNPreview.warehouseLocation}</div>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-300 font-sans">
                  <thead className="bg-slate-100 font-mono text-[11px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">Item Code</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Name</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">Quantity</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeGRNPreview.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold">{it.itemCode}</td>
                        <td className="py-2 px-3 border-r border-slate-300">{it.itemName}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">{it.quantityReceived}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">{it.unitCostETB.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{it.totalCostETB.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td colSpan={4} className="py-2 px-3 text-right">Total Delivery Valuation:</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800 font-black">
                        {activeGRNPreview.totalAmountETB.toLocaleString()} ETB
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {activeGRNPreview.notes && (
                  <p className="text-[11px] font-sans text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <strong>Inspection Certification:</strong> {activeGRNPreview.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Delivered By (Vendor Rep):</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeGRNPreview.supplierName}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Received Into Store By:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeGRNPreview.receivedBy}</p>
                      <p className="text-[10px] text-slate-400">Storekeeper / Property Officer</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveGRNPreview(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AcademicFooter />
    </div>
  );
}
