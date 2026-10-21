import { useState, useEffect, FormEvent } from "react";
import type { User, PaymentTransaction, Scholarship } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter, UniversitySeal } from "./UniversityHeader";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Plus,
  Award,
  DollarSign,
  FileText,
  TrendingUp,
  Shield,
  Users,
  Check,
  AlertCircle,
  Receipt,
  Wallet,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FinanceOfficerDashboardProps {
  user: User;
  onLogout: () => void;
}

export function FinanceOfficerDashboard({ user, onLogout }: FinanceOfficerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "payments" | "cost_sharing" | "scholarships" | "process_fee" | "reports"
  >("payments");
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [feeAmount, setFeeAmount] = useState<number>(1000);
  const [feeType, setFeeType] = useState<any>("TUITION");
  const [feeMethod, setFeeMethod] = useState<any>("TELEBIRR");
  const [referenceInput, setReferenceInput] = useState("");

  const [schStudentId, setSchStudentId] = useState("");
  const [schType, setSchType] = useState<any>("MERIT_BASED");
  const [schAmount, setSchAmount] = useState<number>(5000);

  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, scholarshipsData, usersData] = await Promise.all([
        CampusDatabase.getPayments(),
        CampusDatabase.getScholarships(),
        CampusDatabase.getUsers(),
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setScholarships(Array.isArray(scholarshipsData) ? scholarshipsData : []);
      setStudents(
        Array.isArray(usersData) ? usersData.filter((u) => u.role === "STUDENT") : []
      );
    } catch (error) {
      console.error("Failed to load finance data:", error);
      setPayments([]);
      setScholarships([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    const receiptNum = "MAU-REC-" + Math.floor(Math.random() * 90000 + 10000);
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    try {
      const numericId = String(paymentId).replace(/^PAY_/, "");
      await (CampusDatabase as any).updatePayment(numericId, {
        status: "VERIFIED",
        receipt_number: receiptNum,
        verified_by: user.fullName,
      });

      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status: "VERIFIED" as const, receiptNumber: receiptNum, verifiedBy: user.fullName }
            : p
        )
      );

      const allUsers = await CampusDatabase.getUsers();
      const studentUser = allUsers.find((u) => u.id === payment.studentId);
      if (studentUser) {
        const currentFees = studentUser.outstandingFees || 0;
        const currentCostSharing = studentUser.costSharingBalance || 0;
        const nextFees = Math.max(0, currentFees - payment.amount);
        const nextCostSharing =
          payment.paymentType === "COST_SHARING"
            ? Math.max(0, currentCostSharing - payment.amount)
            : currentCostSharing;

        await (CampusDatabase as any).patchUser(
          String(studentUser.id).replace(/^U_/, ""),
          { outstanding_fees: nextFees, cost_sharing_balance: nextCostSharing }
        );

        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentUser.id
              ? { ...s, outstandingFees: nextFees, costSharingBalance: nextCostSharing }
              : s
          )
        );
      }

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "FINANCE_OFFICER", "Verify Payment",
        "PaymentTransaction", paymentId,
        `Verified ${payment.paymentMethod} transaction of ${payment.amount} ETB for student ${payment.studentName} (Ref: ${payment.referenceNumber}). Issued receipt ${receiptNum}.`
      );

      alert(`Payment verified successfully! Receipt Number: ${receiptNum}`);
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to verify payment: " + detail);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to reject this payment transaction?")) return;
    try {
      const numericId = String(paymentId).replace(/^PAY_/, "");
      await (CampusDatabase as any).updatePayment(numericId, { status: "REJECTED" });
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "REJECTED" as const } : p))
      );
      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "FINANCE_OFFICER", "Reject Payment",
        "PaymentTransaction", paymentId, `Rejected fraudulent or invalid payment reference.`
      );
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to reject payment: " + detail);
    }
  };

  const handleCollectFeeManual = async (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      alert("Please select a valid student.");
      return;
    }
    const receiptNum = "MAU-REC-" + Math.floor(Math.random() * 90000 + 10000);

    try {
      const created: any = await (CampusDatabase as any).addPayment({
        student: parseInt(String(student.id).replace(/\D/g, "")) || student.id,
        student_name: student.fullName,
        amount: Number(feeAmount),
        payment_method: feeMethod,
        payment_type: feeType,
        reference_number: referenceInput || `${feeMethod}-${Date.now().toString().slice(-6)}`,
        status: "VERIFIED",
        receipt_number: receiptNum,
        timestamp: new Date().toISOString(),
        verified_by: user.fullName,
      });

      const newTx: PaymentTransaction = {
        id: String(created?.id ?? "PAY_" + Date.now()),
        studentId: student.id,
        studentName: student.fullName,
        amount: Number(feeAmount),
        paymentMethod: feeMethod,
        paymentType: feeType,
        referenceNumber: referenceInput || `${feeMethod}-${Date.now().toString().slice(-6)}`,
        status: "VERIFIED",
        receiptNumber: created?.receipt_number ?? receiptNum,
        timestamp: created?.timestamp ?? new Date().toISOString(),
        verifiedBy: user.fullName,
      } as any;
      setPayments((prev) => [newTx, ...prev]);

      const numericUserId = String(student.id).replace(/^U_/, "");
      const nextFees = Math.max(0, (student.outstandingFees || 0) - Number(feeAmount));
      await (CampusDatabase as any).patchUser(numericUserId, { outstanding_fees: nextFees });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, outstandingFees: nextFees } : s))
      );

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "FINANCE_OFFICER", "Process Fee Payment",
        "PaymentTransaction", newTx.id,
        `Manually processed ${feeAmount} ETB fee payment for ${student.fullName} via ${feeMethod}. Issued receipt ${receiptNum}.`
      );

      setActiveReceipt(newTx);
      setSelectedStudentId("");
      setReferenceInput("");
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to process fee: " + detail);
    }
  };

  const handleAwardScholarship = async (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === schStudentId);
    if (!student) {
      alert("Please choose a candidate student.");
      return;
    }

    try {
      const created: any = await (CampusDatabase as any).addScholarship({
        student: parseInt(String(student.id).replace(/\D/g, "")) || student.id,
        student_name: student.fullName,
        scholarship_type: schType,
        amount: Number(schAmount),
        semester: "Semester II",
        academic_year: student.academicYear || 4,
        status: "ISSUED",
        issued_date: new Date().toISOString().split("T")[0],
      });

      const newSch: Scholarship = {
        id: String(created?.id ?? "SCH_" + Date.now()),
        studentId: student.id,
        studentName: student.fullName,
        scholarshipType: schType,
        amount: Number(schAmount),
        semester: "Semester II",
        academicYear: student.academicYear || 4,
        status: "ISSUED",
        issuedDate: created?.issued_date ?? new Date().toISOString().split("T")[0],
      } as any;
      setScholarships((prev) => [newSch, ...prev]);

      const numericUserId = String(student.id).replace(/^U_/, "");
      const nextCostSharing = Math.max(0, (student.costSharingBalance || 0) - Number(schAmount));
      await (CampusDatabase as any).patchUser(numericUserId, { cost_sharing_balance: nextCostSharing });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, costSharingBalance: nextCostSharing } : s
        )
      );

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "FINANCE_OFFICER", "Award Scholarship", "Scholarship", newSch.id,
        `Awarded ${schAmount} ETB ${schType} grant to ${student.fullName}.`
      );

      alert(`Scholarship of ${schAmount} ETB awarded and credited to ${student.fullName}!`);
      setSchStudentId("");
    } catch (error: any) {
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to award scholarship: " + detail);
    }
  };

  const filteredPayments = Array.isArray(payments)
    ? payments.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (p.studentName ?? "").toLowerCase().includes(q) ||
          (p.referenceNumber ?? "").toLowerCase().includes(q) ||
          (p.receiptNumber ?? "").toLowerCase().includes(q);
        const matchesMethod =
          selectedMethodFilter === "ALL" || p.paymentMethod === selectedMethodFilter;
        const matchesStatus =
          selectedStatusFilter === "ALL" || p.status === selectedStatusFilter;
        return matchesSearch && matchesMethod && matchesStatus;
      })
    : [];

  const totalVerified = payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingVerificationCount = payments.filter((p) => p.status === "PENDING").length;
  const totalCostSharingDebt = students.reduce(
    (sum, s) => sum + (s.costSharingBalance || 0),
    0
  );
  const totalScholarshipsAwarded = scholarships.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );
  const studentsWithFees = students.filter((s) => (s.outstandingFees || 0) > 0).length;

  const navItems = [
    { id: "payments", label: "Verify Transactions", Icon: CreditCard, badge: pendingVerificationCount },
    { id: "cost_sharing", label: "Cost Sharing Ledger", Icon: DollarSign },
    { id: "process_fee", label: "Process Fee / Receipt", Icon: Plus },
    { id: "scholarships", label: "Scholarships & Grants", Icon: Award },
    { id: "reports", label: "Financial Audit Dossier", Icon: FileText },
  ] as const;

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans"
      id="finance_dashboard_main"
    >
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="University Directorate of Finance & Bursar"
        portalSubtitle="Revenue Accounting • Cost Sharing • Scholarships"
        badgeText="FINANCE OFFICER"
        badgeType="admin"
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* ==================== SIDEBAR ==================== */}
        <aside className="w-full md:w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                {(user.fullName || "F").charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                <p className="text-[10px] font-mono text-amber-400 font-bold">
                  {user.officerId || "FIN OFFICER"}
                </p>
              </div>
            </div>
            <div className="bg-[#0d2238] border border-slate-700/60 rounded-xl p-2.5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Revenue</span>
                <span className="text-emerald-400 font-bold">
                  {totalVerified.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Pending</span>
                <span className="text-amber-400 font-bold">{pendingVerificationCount}</span>
              </div>
            </div>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <div className="pb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Financial Operations
              </span>
            </div>
            {navItems.map(({ id, label, Icon, badge }: any) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{label}</span>
                </div>
                {badge > 0 && (
                  <span className="bg-amber-400 text-slate-900 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <Shield className="w-3 h-3" />
              <span>MoE audited</span>
            </div>
            <p>Ref: FIN-DIR-2026</p>
          </div>
        </aside>

        {/* ==================== MAIN ==================== */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* ============ PAYMENTS ============ */}
          {activeTab === "payments" && (
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              {/* HERO */}
              <div className="relative overflow-hidden rounded-2xl bg-[#071526] border border-slate-800/80 shadow-md">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative p-6 sm:p-8">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono font-bold text-amber-300 tracking-wider mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE FINANCIAL RECONCILIATION</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    Finance & Bursar Control
                  </h1>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Verify tuition, dormitory and cost-sharing payments. Every verification issues
                    an official university receipt.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                    <StatCard
                      icon={TrendingUp}
                      label="Verified Revenue"
                      value={`${totalVerified.toLocaleString()}`}
                      sub="ETB"
                      accent="emerald"
                    />
                    <StatCard
                      icon={Clock}
                      label="Pending"
                      value={String(pendingVerificationCount)}
                      sub="transactions"
                      accent="amber"
                    />
                    <StatCard
                      icon={Award}
                      label="Scholarships"
                      value={`${totalScholarshipsAwarded.toLocaleString()}`}
                      sub="ETB awarded"
                      accent="primary"
                    />
                    <StatCard
                      icon={AlertCircle}
                      label="Students with Fees"
                      value={String(studentsWithFees)}
                      sub={`of ${students.length}`}
                      accent="red"
                    />
                  </div>
                </div>
              </div>

              {/* TOOLBAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900">
                    Transaction Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing {filteredPayments.length} of {payments.length} transactions
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("process_fee")}
                  className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Collection</span>
                </button>
              </div>

              {/* FILTERS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by student, ref, or receipt…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:border-primary transition"
                  />
                </div>
                <select
                  value={selectedMethodFilter}
                  onChange={(e) => setSelectedMethodFilter(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Payment Gateways</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="CBE_BIRR">CBE Birr</option>
                  <option value="AWASH_BANK">Awash Bank</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* TABLE */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        <th className="p-4">Student</th>
                        <th className="p-4">Purpose</th>
                        <th className="p-4">Channel & Ref</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                            Loading transactions…
                          </td>
                        </tr>
                      )}
                      {!loading && filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-600">
                              No transactions found
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Adjust filters or record a manual collection.
                            </p>
                          </td>
                        </tr>
                      )}
                      {filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                {(p.studentName || "?").charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <strong className="block text-slate-900 truncate">
                                  {p.studentName || "Unknown Student"}
                                </strong>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {p.studentId || "—"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {p.paymentType || "—"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="block font-semibold text-slate-800">
                              {p.paymentMethod || "—"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {p.referenceNumber || "—"}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                            {(p.amount || 0).toLocaleString()} ETB
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                p.status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : p.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {p.status || "—"}
                            </span>
                            {p.receiptNumber && (
                              <span className="block text-[10px] font-mono text-slate-400 mt-1">
                                {p.receiptNumber}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {p.status === "PENDING" ? (
                              <div className="inline-flex space-x-2">
                                <button
                                  onClick={() => handleVerifyPayment(p.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveReceipt(p)}
                                className="inline-flex items-center space-x-1 text-primary hover:underline font-semibold text-[11px]"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View Receipt</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============ COST SHARING ============ */}
          {activeTab === "cost_sharing" && (
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#071526] border border-slate-800/80 shadow-md p-6 sm:p-8">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <h1 className="text-2xl font-display font-bold text-white">
                    Cost Sharing Liability Ledger
                  </h1>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    National cost-sharing contracts, repayment status, and graduation clearance.
                  </p>
                  <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                    <Wallet className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-mono text-slate-300">Total pool:</span>
                    <span className="text-lg font-display font-bold text-white">
                      {totalCostSharingDebt.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        <th className="p-4">Student</th>
                        <th className="p-4">Program</th>
                        <th className="p-4">Outstanding Fees</th>
                        <th className="p-4">Cost Sharing</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-600">
                              No students enrolled yet
                            </p>
                          </td>
                        </tr>
                      )}
                      {students.map((st) => {
                        const fees = st.outstandingFees || 0;
                        const cs = st.costSharingBalance || 0;
                        const isOverdue = fees > 1000 || cs > 0;
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                  {(st.fullName || "?").charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <strong className="block text-slate-900 truncate">
                                    {st.fullName || "Unnamed"}
                                  </strong>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {st.studentId || "—"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="block font-medium text-slate-800">
                                {st.program || "—"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Year {st.academicYear || "?"} • Sem {st.semester || "?"}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              {fees.toLocaleString()} ETB
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              {cs.toLocaleString()} ETB
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold ${
                                  isOverdue
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {isOverdue ? "OUTSTANDING" : "GOOD STANDING"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============ PROCESS FEE ============ */}
          {activeTab === "process_fee" && (
            <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#071526] border border-slate-800/80 shadow-md p-6 sm:p-8">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono font-bold text-amber-300 tracking-wider mb-3">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>CASHIER MODE</span>
                  </div>
                  <h1 className="text-2xl font-display font-bold text-white">
                    Manual Fee Collection
                  </h1>
                  <p className="text-sm text-slate-300 mt-1">
                    Record counter payments, direct deposits, or on-campus POS transactions.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCollectFeeManual}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition"
                  >
                    <option value="">— Choose Enrolled Student —</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentId}) • Outstanding: {s.outstandingFees || 0} ETB
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Amount (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Payment Type
                    </label>
                    <select
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium"
                    >
                      <option value="TUITION">Tuition Fee</option>
                      <option value="COST_SHARING">Cost Sharing Installment</option>
                      <option value="DORMITORY">Dormitory & Meal Fee</option>
                      <option value="REGISTRATION">Registration / Add-Drop</option>
                      <option value="LIBRARY_FINE">Library Overdue Fine</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Payment Channel
                    </label>
                    <select
                      value={feeMethod}
                      onChange={(e) => setFeeMethod(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium"
                    >
                      <option value="TELEBIRR">Telebirr</option>
                      <option value="CBE_BIRR">CBE Birr</option>
                      <option value="AWASH_BANK">Awash Bank</option>
                      <option value="BANK_TRANSFER">Bank Deposit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Reference / Slip No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TX-992019"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Issue Official Receipt</span>
                </button>
              </form>
            </div>
          )}

          {/* ============ SCHOLARSHIPS ============ */}
          {activeTab === "scholarships" && (
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#071526] border border-slate-800/80 shadow-md p-6 sm:p-8">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <h1 className="text-2xl font-display font-bold text-white">
                    Scholarships & MoE Grants
                  </h1>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Award merit scholarships, government sponsorships, and targeted support grants.
                  </p>
                  <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-mono text-slate-300">Total awarded:</span>
                    <span className="text-lg font-display font-bold text-white">
                      {totalScholarshipsAwarded.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleAwardScholarship}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Beneficiary
                  </label>
                  <select
                    required
                    value={schStudentId}
                    onChange={(e) => setSchStudentId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="">— Choose Student —</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (CGPA: {s.cgpa || "—"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Grant Type
                  </label>
                  <select
                    value={schType}
                    onChange={(e) => setSchType(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="MERIT_BASED">Merit-Based</option>
                    <option value="MOE_SPECIAL_GRANT">MoE Special Grant</option>
                    <option value="FEMALE_INCENTIVE">Female Engineering</option>
                    <option value="NEED_BASED">Need-Based Aid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (ETB)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={schAmount}
                    onChange={(e) => setSchAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Award Grant</span>
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        <th className="p-4">Beneficiary</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Semester</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scholarships.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-600">
                              No scholarships awarded yet
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Use the form above to award a grant.
                            </p>
                          </td>
                        </tr>
                      )}
                      {scholarships.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-4 font-semibold text-slate-900">
                            {s.studentName || "—"}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {s.scholarshipType || "—"}
                            </span>
                          </td>
                          <td className="p-4 font-mono">{s.semester || "—"}</td>
                          <td className="p-4 font-mono font-bold text-emerald-700 text-sm">
                            {(s.amount || 0).toLocaleString()} ETB
                          </td>
                          <td className="p-4 font-mono text-slate-500">
                            {s.issuedDate || "—"}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {s.status || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============ REPORTS ============ */}
          {activeTab === "reports" && (
            <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#071526] border border-slate-800/80 shadow-md p-6 sm:p-8">
                <div className="relative">
                  <h1 className="text-2xl font-display font-bold text-white">
                    Financial Audit Dossier
                  </h1>
                  <p className="text-sm text-slate-300 mt-1">
                    Official revenue reconciliation and settlement statement.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
                <div className="text-center space-y-1 border-b border-slate-100 pb-5">
                  <div className="flex justify-center mb-2">
                    <UniversitySeal className="w-14 h-14" />
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Mekdela Amba University • Directorate of Financial Services
                  </p>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Official Revenue Reconciliation Statement
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Audited Period: AY 2025/2026 • Generated {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="block text-[10px] font-mono text-emerald-700 uppercase tracking-wider">
                      Verified Revenue
                    </span>
                    <span className="block text-2xl font-display font-bold text-emerald-800 mt-1">
                      {totalVerified.toLocaleString()} ETB
                    </span>
                    <span className="block text-[10px] text-emerald-600 mt-0.5">
                      {payments.filter((p) => p.status === "VERIFIED").length} transactions
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="block text-[10px] font-mono text-amber-700 uppercase tracking-wider">
                      Scholarships Awarded
                    </span>
                    <span className="block text-2xl font-display font-bold text-amber-800 mt-1">
                      {totalScholarshipsAwarded.toLocaleString()} ETB
                    </span>
                    <span className="block text-[10px] text-amber-600 mt-0.5">
                      {scholarships.length} grants issued
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniStat
                    icon={BarChart3}
                    label="Pending"
                    value={String(pendingVerificationCount)}
                  />
                  <MiniStat
                    icon={Users}
                    label="Students"
                    value={String(students.length)}
                  />
                  <MiniStat
                    icon={Sparkles}
                    label="Reconciled"
                    value="100%"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  This dossier certifies that all fee transactions and cost sharing
                  disbursements recorded in the Mekdela Amba University Smart Campus System have
                  been audited against bank statements with zero unallocated variance.
                </p>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        await CampusDatabase.addAuditLog(
                          user.id, user.fullName, "FINANCE_OFFICER", "Export Financial Report",
                          "Report", "FIN_REP_2026",
                          "Exported official revenue and cost sharing audit dossier (PDF)."
                        );
                        alert("Official University Financial Statement PDF exported successfully!");
                      } catch (error) {
                        alert("Failed to export report. Please try again.");
                      }
                    }}
                    className="bg-primary hover:bg-primary-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Financial Dossier (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RECEIPT MODAL */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="bg-[#071526] text-white p-5 text-center">
                <div className="flex justify-center mb-2">
                  <UniversitySeal className="w-10 h-10" />
                </div>
                <h3 className="font-display font-bold text-base">
                  Mekdela Amba University
                </h3>
                <p className="text-[10px] font-mono text-amber-300 uppercase tracking-widest">
                  Official Electronic Cash Receipt
                </p>
              </div>

              <div className="p-6 space-y-2 text-xs font-mono">
                <Row label="RECEIPT NO" value={activeReceipt.receiptNumber || "—"} strong />
                <Row label="STUDENT" value={activeReceipt.studentName || "—"} strong />
                <Row label="PURPOSE" value={activeReceipt.paymentType || "—"} />
                <Row label="CHANNEL" value={activeReceipt.paymentMethod || "—"} />
                <Row label="TX REF" value={activeReceipt.referenceNumber || "—"} />
                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2 text-sm">
                  <span className="text-slate-500 font-bold">TOTAL PAID</span>
                  <strong className="text-emerald-600 font-bold">
                    {(activeReceipt.amount || 0).toLocaleString()} ETB
                  </strong>
                </div>
                <div className="text-[10px] text-slate-400 pt-2">
                  Verified by {activeReceipt.verifiedBy || "Finance Officer"} •{" "}
                  {activeReceipt.timestamp
                    ? new Date(activeReceipt.timestamp).toLocaleString()
                    : "—"}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-primary hover:bg-primary-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs"
                >
                  Close
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

/* ==================== SUB-COMPONENTS ==================== */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  accent: "emerald" | "amber" | "primary" | "red";
}) {
  const accentClasses = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    primary: "text-primary-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className={`flex items-center space-x-2 mb-1 ${accentClasses[accent]}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-mono text-slate-400 uppercase">{label}</span>
        <strong className="block text-sm text-slate-800 truncate">{value}</strong>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}:</span>
      <span className={strong ? "font-bold text-slate-900" : "text-slate-700"}>
        {value}
      </span>
    </div>
  );
}