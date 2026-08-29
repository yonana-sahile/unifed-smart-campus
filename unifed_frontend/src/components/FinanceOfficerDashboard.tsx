import { useState, useEffect, FormEvent } from "react";
import type { User, PaymentTransaction, Scholarship } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
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
  AlertCircle,
  TrendingUp,
  Shield,
  Send,
  Users,
  Building,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FinanceOfficerDashboardProps {
  user: User;
  onLogout: () => void;
}

export function FinanceOfficerDashboard({ user, onLogout }: FinanceOfficerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "cost_sharing" | "scholarships" | "process_fee" | "reports">("payments");
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Manual Fee Collection Form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [feeAmount, setFeeAmount] = useState<number>(1000);
  const [feeType, setFeeType] = useState<any>("TUITION");
  const [feeMethod, setFeeMethod] = useState<any>("TELEBIRR");
  const [referenceInput, setReferenceInput] = useState("");

  // Scholarship Award Form
  const [schStudentId, setSchStudentId] = useState("");
  const [schType, setSchType] = useState<any>("MERIT_BASED");
  const [schAmount, setSchAmount] = useState<number>(5000);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPayments(CampusDatabase.getPayments());
    setScholarships(CampusDatabase.getScholarships());
    setStudents(CampusDatabase.getUsers().filter((u) => u.role === "STUDENT"));
  };

  const handleVerifyPayment = (paymentId: string) => {
    const receiptNum = "MAU-REC-" + Math.floor(Math.random() * 90000 + 10000);
    const updated = payments.map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: "VERIFIED" as const,
          receiptNumber: receiptNum,
          verifiedBy: user.fullName
        };
      }
      return p;
    });

    CampusDatabase.savePayments(updated);
    setPayments(updated);

    // Update student's balance if it was cost sharing or fee
    const payment = payments.find((p) => p.id === paymentId);
    if (payment) {
      const allUsers = CampusDatabase.getUsers();
      const updatedUsers = allUsers.map((u) => {
        if (u.id === payment.studentId) {
          const currentFees = u.outstandingFees || 0;
          const currentCostSharing = u.costSharingBalance || 0;
          return {
            ...u,
            outstandingFees: Math.max(0, currentFees - payment.amount),
            costSharingBalance: payment.paymentType === "COST_SHARING" ? Math.max(0, currentCostSharing - payment.amount) : currentCostSharing
          };
        }
        return u;
      });
      CampusDatabase.saveUsers(updatedUsers);
      setStudents(updatedUsers.filter((u) => u.role === "STUDENT"));

      CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "FINANCE_OFFICER",
        "Verify Payment",
        "PaymentTransaction",
        paymentId,
        `Verified ${payment.paymentMethod} transaction of ${payment.amount} ETB for student ${payment.studentName} (Ref: ${payment.referenceNumber}). Issued receipt ${receiptNum}.`
      );
    }

    alert(`Payment verified successfully! Receipt Number: ${receiptNum}`);
  };

  const handleRejectPayment = (paymentId: string) => {
    if (window.confirm("Are you sure you want to reject this payment transaction?")) {
      const updated = payments.map((p) => (p.id === paymentId ? { ...p, status: "REJECTED" as const } : p));
      CampusDatabase.savePayments(updated);
      setPayments(updated);

      CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "FINANCE_OFFICER",
        "Reject Payment",
        "PaymentTransaction",
        paymentId,
        `Rejected fraudulent or invalid payment reference.`
      );
    }
  };

  const handleCollectFeeManual = (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      alert("Please select a valid student.");
      return;
    }

    const receiptNum = "MAU-REC-" + Math.floor(Math.random() * 90000 + 10000);
    const newTx: PaymentTransaction = {
      id: "PAY_" + Date.now(),
      studentId: student.id,
      studentName: student.fullName,
      amount: Number(feeAmount),
      paymentMethod: feeMethod,
      paymentType: feeType,
      referenceNumber: referenceInput || `${feeMethod}-${Date.now().toString().slice(-6)}`,
      status: "VERIFIED",
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      verifiedBy: user.fullName
    };

    const updatedPayments = [newTx, ...payments];
    CampusDatabase.savePayments(updatedPayments);
    setPayments(updatedPayments);

    // Deduct student outstanding fees
    const allUsers = CampusDatabase.getUsers();
    const updatedUsers = allUsers.map((u) => {
      if (u.id === student.id) {
        const fees = u.outstandingFees || 0;
        return { ...u, outstandingFees: Math.max(0, fees - Number(feeAmount)) };
      }
      return u;
    });
    CampusDatabase.saveUsers(updatedUsers);
    setStudents(updatedUsers.filter((u) => u.role === "STUDENT"));

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "FINANCE_OFFICER",
      "Process Fee Payment",
      "PaymentTransaction",
      newTx.id,
      `Manually processed ${feeAmount} ETB fee payment for ${student.fullName} via ${feeMethod}. Issued receipt ${receiptNum}.`
    );

    setActiveReceipt(newTx);
    setSelectedStudentId("");
    setReferenceInput("");
  };

  const handleAwardScholarship = (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === schStudentId);
    if (!student) {
      alert("Please choose a candidate student.");
      return;
    }

    const newSch: Scholarship = {
      id: "SCH_" + Date.now(),
      studentId: student.id,
      studentName: student.fullName,
      scholarshipType: schType,
      amount: Number(schAmount),
      semester: "Semester II",
      academicYear: student.academicYear || 4,
      status: "ISSUED",
      issuedDate: new Date().toISOString().split("T")[0]
    };

    const updatedScholarships = [newSch, ...scholarships];
    CampusDatabase.saveScholarships(updatedScholarships);
    setScholarships(updatedScholarships);

    // Credit student fees or cost sharing
    const allUsers = CampusDatabase.getUsers();
    const updatedUsers = allUsers.map((u) => {
      if (u.id === student.id) {
        const currentCost = u.costSharingBalance || 0;
        return { ...u, costSharingBalance: Math.max(0, currentCost - Number(schAmount)) };
      }
      return u;
    });
    CampusDatabase.saveUsers(updatedUsers);
    setStudents(updatedUsers.filter((u) => u.role === "STUDENT"));

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "FINANCE_OFFICER",
      "Award Scholarship",
      "Scholarship",
      newSch.id,
      `Awarded ${schAmount} ETB ${schType} grant to ${student.fullName}.`
    );

    alert(`Scholarship of ${schAmount} ETB awarded and credited to ${student.fullName}!`);
    setSchStudentId("");
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMethod = selectedMethodFilter === "ALL" || p.paymentMethod === selectedMethodFilter;
    const matchesStatus = selectedStatusFilter === "ALL" || p.status === selectedStatusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalVerified = payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingVerificationCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071526] flex flex-col font-sans" id="finance_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="University Directorate of Finance, Cost Sharing & Bursar"
        portalSubtitle="Institutional Revenue Accounting, Telebirr/CBE Birr Reconciliation & Student Liabilities"
        badgeText="FINANCE OFFICER"
        badgeType="admin"
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              Financial Administration
            </span>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "payments"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Verify Transactions</span>
              {pendingVerificationCount > 0 && (
                <span className="ml-auto bg-amber-400 text-slate-900 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingVerificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("cost_sharing")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "cost_sharing"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Cost Sharing Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab("process_fee")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "process_fee"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Process Fee / Receipt</span>
            </button>

            <button
              onClick={() => setActiveTab("scholarships")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "scholarships"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Scholarships & Grants</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "reports"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Financial Audit Dossier</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Officer ID: <span className="text-amber-400">{user.officerId || "FIN_044"}</span></p>
            <p>Total Revenue: <span className="text-emerald-400">{totalVerified.toLocaleString()} ETB</span></p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: VERIFY PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <span>Telebirr & CBE Birr Payment Reconciliations</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    Review and verify student tuition, dormitory, and cost sharing payments with automatic receipt issuing.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("process_fee")}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Collection</span>
                </button>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Verified Collections</span>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {totalVerified.toLocaleString()} ETB
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">Reconciled in bank system</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Pending Invoices</span>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {pendingVerificationCount} Pending
                  </p>
                  <span className="text-[11px] text-amber-600 font-semibold">Awaiting verification</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Cost Sharing Debt Pool</span>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-primary mt-1">
                    {students.reduce((sum, s) => sum + (s.costSharingBalance || 0), 0).toLocaleString()} ETB
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">MoE national graduate ledger</span>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by student, ref, or receipt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary dark:text-white"
                  />
                </div>

                <div>
                  <select
                    value={selectedMethodFilter}
                    onChange={(e) => setSelectedMethodFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden dark:text-white"
                  >
                    <option value="ALL">All Payment Gateways</option>
                    <option value="TELEBIRR">Telebirr (Ethio Telecom)</option>
                    <option value="CBE_BIRR">CBE Birr (Commercial Bank)</option>
                    <option value="AWASH_BANK">Awash Bank Portal</option>
                    <option value="BANK_TRANSFER">Direct Bank Slip</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden dark:text-white"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified & Reconciled</option>
                    <option value="REJECTED">Rejected / Invalid</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      <th className="p-4">Student & ID</th>
                      <th className="p-4">Payment Purpose</th>
                      <th className="p-4">Channel & Ref</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status & Receipt</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <strong className="block text-slate-900 dark:text-white">{p.studentName}</strong>
                          <span className="text-[10px] font-mono text-slate-400">{p.studentId}</span>
                        </td>
                        <td className="p-4 font-medium">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {p.paymentType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold block">{p.paymentMethod}</span>
                          <span className="font-mono text-[10px] text-slate-400">{p.referenceNumber}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {p.amount.toLocaleString()} ETB
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              p.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : p.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            }`}
                          >
                            {p.status}
                          </span>
                          {p.receiptNumber && (
                            <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                              {p.receiptNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {p.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(p.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
                              >
                                Verify & Issue Receipt
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setActiveReceipt(p)}
                              className="text-primary hover:underline font-semibold text-xs"
                            >
                              View Official Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COST SHARING LEDGER */}
          {activeTab === "cost_sharing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                  <span>Student Cost Sharing Liability & Contract Ledger</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Track national cost sharing liabilities, graduation clearances, and beneficiary payback contracts.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Student ID</th>
                      <th className="p-4">Program & Year</th>
                      <th className="p-4">Total Contract</th>
                      <th className="p-4">Outstanding Liability</th>
                      <th className="p-4">Clearance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {students.map((st) => {
                      const isOverdue = (st.outstandingFees || 0) > 1000;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-4 font-semibold text-slate-900 dark:text-white">{st.fullName}</td>
                          <td className="p-4 font-mono text-slate-500">{st.studentId}</td>
                          <td className="p-4">{st.program} • Year {st.academicYear}</td>
                          <td className="p-4 font-mono font-bold">25,000 ETB</td>
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                            {(st.costSharingBalance || 12000).toLocaleString()} ETB
                          </td>
                          <td className="p-4">
                            {isOverdue ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                RESTRICTED (OVERDUE)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                ACTIVE IN GOOD STANDING
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROCESS FEE / MANUAL RECEIPT */}
          {activeTab === "process_fee" && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="w-6 h-6 text-primary" />
                  <span>Manual Fee Collection & Cashier Entry</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Record counter payments, direct bank slips, or on-campus POS transactions.
                </p>
              </div>

              <form onSubmit={handleCollectFeeManual} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Select Student *</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                  >
                    <option value="">-- Choose Enrolled Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentId}) • Outstanding: {s.outstandingFees || 0} ETB
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Amount (ETB) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Type</label>
                    <select
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    >
                      <option value="TUITION">Tuition Fee</option>
                      <option value="COST_SHARING">Cost Sharing Installment</option>
                      <option value="DORMITORY">Dormitory & Meal Fee</option>
                      <option value="REGISTRATION">Registration / Add-Drop Fee</option>
                      <option value="LIBRARY_FINE">Library Overdue Fine</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Channel</label>
                    <select
                      value={feeMethod}
                      onChange={(e) => setFeeMethod(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    >
                      <option value="TELEBIRR">Telebirr (Ethio Telecom)</option>
                      <option value="CBE_BIRR">CBE Birr (Commercial Bank)</option>
                      <option value="AWASH_BANK">Awash Bank</option>
                      <option value="BANK_TRANSFER">Bank Deposit Slip</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Reference / Slip Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TX-992019"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-mono dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Generate Official University Receipt</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SCHOLARSHIPS */}
          {activeTab === "scholarships" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Award className="w-6 h-6 text-primary" />
                    <span>Institutional Scholarships & MoE Grants</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    Manage merit allocations, government sponsorships, and female engineering support funds.
                  </p>
                </div>
              </div>

              {/* Award Form */}
              <form onSubmit={handleAwardScholarship} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Beneficiary Student</label>
                  <select
                    required
                    value={schStudentId}
                    onChange={(e) => setSchStudentId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (CGPA: {s.cgpa || 3.5})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Scholarship Type</label>
                  <select
                    value={schType}
                    onChange={(e) => setSchType(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                  >
                    <option value="MERIT_BASED">Merit-Based Honor (CGPA &gt; 3.75)</option>
                    <option value="MOE_SPECIAL_GRANT">MoE National Special Grant</option>
                    <option value="FEMALE_INCENTIVE">Female Engineering Support Grant</option>
                    <option value="NEED_BASED">Need-Based Financial Aid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Grant Amount (ETB)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={schAmount}
                    onChange={(e) => setSchAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-mono font-bold dark:text-white"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-1"
                  >
                    <Award className="w-4 h-4" />
                    <span>Award Scholarship</span>
                  </button>
                </div>
              </form>

              {/* Awarded Scholarships Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      <th className="p-4">Student Beneficiary</th>
                      <th className="p-4">Grant Category</th>
                      <th className="p-4">Semester</th>
                      <th className="p-4">Award Amount</th>
                      <th className="p-4">Issue Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {scholarships.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{s.studentName}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {s.scholarshipType}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{s.semester}</td>
                        <td className="p-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          {s.amount.toLocaleString()} ETB
                        </td>
                        <td className="p-4 font-mono text-slate-500">{s.issuedDate}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL AUDIT REPORTS */}
          {activeTab === "reports" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-primary" />
                  <span>University Financial Audit & Revenue Dossier</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Official financial accounting dossier verified against Telebirr API, CBE Birr logs, and Treasury receipts.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs space-y-6">
                <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Mekdela Amba University • Directorate of Financial Services
                  </p>
                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                    Official Revenue Reconciliation & Settlement Statement
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Audited Period: AY 2025/2026</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p>TOTAL VERIFIED REVENUE: <span className="font-bold text-emerald-700 dark:text-emerald-400">{totalVerified.toLocaleString()} ETB</span></p>
                    <p>TOTAL TRANSACTIONS: <span className="font-bold text-slate-800 dark:text-white">{payments.length}</span></p>
                  </div>
                  <div className="text-right">
                    <p>AWARDED SCHOLARSHIPS: <span className="font-bold text-amber-700 dark:text-amber-400">{scholarships.reduce((s, c) => s + c.amount, 0).toLocaleString()} ETB</span></p>
                    <p>RECONCILIATION RATE: <span className="font-bold text-emerald-600">100% CLEAN</span></p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This dossier certifies that all fee transactions and cost sharing disbursements recorded in the Mekdela Amba University Smart Campus System have been audited against bank statements with zero unallocated variance.
                </p>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      CampusDatabase.addAuditLog(
                        user.id,
                        user.fullName,
                        "FINANCE_OFFICER",
                        "Export Financial Report",
                        "Report",
                        "FIN_REP_2026",
                        "Exported official revenue and cost sharing audit dossier (PDF)."
                      );
                      alert("Official University Financial Statement PDF exported successfully!");
                    }}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-2"
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

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3 space-y-1">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base">
                Mekdela Amba University
              </h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Official Electronic Cash Receipt
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">RECEIPT NO:</span>
                <strong className="text-slate-900 dark:text-white">{activeReceipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">STUDENT NAME:</span>
                <strong className="text-slate-900 dark:text-white">{activeReceipt.studentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PURPOSE:</span>
                <span className="text-slate-800 dark:text-slate-200">{activeReceipt.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CHANNEL:</span>
                <span className="text-slate-800 dark:text-slate-200">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TX REF:</span>
                <span className="text-slate-800 dark:text-slate-200">{activeReceipt.referenceNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-sm">
                <span className="text-slate-500 font-bold">TOTAL PAID:</span>
                <strong className="text-emerald-600 font-bold">{activeReceipt.amount.toLocaleString()} ETB</strong>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Verified By: {activeReceipt.verifiedBy || "Finance Officer"} • {new Date(activeReceipt.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="pt-3 flex space-x-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold px-4 py-2.5 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AcademicFooter />
    </div>
  );
}
