import { useState } from "react";
import type { User, StudentClearance, ClearanceDepartmentStatus } from "../types";
import { CampusDatabase } from "../services/api"
import { UniversitySeal } from "./UniversityHeader";
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Building,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Home,
  Cpu,
  GraduationCap,
  Sparkles,
  QrCode,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

interface SmartClearancePortalProps {
  user: User;
  isOfficerMode?: boolean;
}

export function SmartClearancePortal({ user, isOfficerMode = false }: SmartClearancePortalProps) {
  const [clearances, setClearances] = useState<StudentClearance[]>(CampusDatabase.getClearances());
  const [selectedClearanceId, setSelectedClearanceId] = useState<string>(clearances[0]?.id || "CLR_01");
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [officerRemarks, setOfficerRemarks] = useState<string>("");

  const refreshClearances = () => {
    setClearances(CampusDatabase.getClearances());
  };

  // Find clearance for active student or selected in officer mode
  const activeClearance = isOfficerMode
    ? clearances.find((c) => c.id === selectedClearanceId) || clearances[0]
    : clearances.find((c) => c.studentId === user.id) || clearances[0];

  const getStageIcon = (dept: string) => {
    switch (dept) {
      case "LIBRARY":
        return <BookOpen className="w-5 h-5 text-cyan-600" />;
      case "DORMITORY":
        return <Home className="w-5 h-5 text-amber-600" />;
      case "DEPARTMENT_LAB":
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case "FINANCE":
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case "REGISTRAR":
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      default:
        return <Building className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleOfficerSignoff = (dept: "LIBRARY" | "FINANCE" | "DORMITORY" | "DEPARTMENT_LAB" | "REGISTRAR") => {
    if (!activeClearance) return;
    CampusDatabase.updateClearanceStage(
      activeClearance.id,
      dept,
      "CLEARED",
      `${user.fullName} (${user.role})`,
      officerRemarks || `Digitally signed & cleared by ${user.fullName} on behalf of ${dept} Directorate.`
    );
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      user.role,
      "CLEARANCE_SIGN_OFF",
      "STUDENT_CLEARANCE",
      activeClearance.id,
      `Authorized digital clearance stage ${dept} for student ${activeClearance.studentName}.`
    );
    setOfficerRemarks("");
    refreshClearances();
  };

  const getStageStatusBadge = (status: string) => {
    switch (status) {
      case "CLEARED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cleared & Signed</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hold / Action Required</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const totalStages = activeClearance?.stages.length || 5;
  const clearedCount = activeClearance?.stages.filter((s) => s.status === "CLEARED").length || 0;
  const progressPercent = Math.round((clearedCount / totalStages) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-primary to-blue-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl tracking-tight">
              National Digital Clearance & Graduation Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Automated multi-department institutional clearance system compliant with Ethiopian Ministry of Education & Mekdela Amba University Senate Directives.
          </p>
        </div>

        {activeClearance?.overallStatus === "APPROVED" && (
          <button
            onClick={() => setShowCertificateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Clearance Certificate</span>
          </button>
        )}
      </div>

      {/* Progress & Overview Card */}
      {activeClearance && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Candidate</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeClearance.studentId}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                {activeClearance.studentName}
              </h3>
              <p className="text-xs text-slate-500">
                {activeClearance.program} • 4th Year Cohort • Reason: {activeClearance.reason}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Overall Status</span>
              {activeClearance.overallStatus === "APPROVED" ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ALL DEPARTMENTS CLEARED</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-4 h-4" />
                  <span>{clearedCount} OF {totalStages} STAGES CLEARED ({progressPercent}%)</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Institutional Verification Track</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-cyan-500 to-primary"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clearance Department Stages List */}
      <div className="space-y-3">
        <h4 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <FileCheck2 className="w-5 h-5 text-primary" />
          <span>Institutional Department Sign-Offs</span>
        </h4>

        <div className="grid grid-cols-1 gap-3">
          {activeClearance?.stages.map((stage, idx) => (
            <div
              key={stage.department}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getStageIcon(stage.department)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {stage.departmentName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stage.remarks || "Standard clearance review in progress."}
                  </p>
                  {stage.officerName && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      Signed by: <span className="font-bold text-slate-900 dark:text-slate-200">{stage.officerName}</span> • {stage.clearedAt}
                    </div>
                  )}
                  {stage.duesAmount !== undefined && stage.duesAmount > 0 && (
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Outstanding Fee: {stage.duesAmount} ETB
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-center">
                {getStageStatusBadge(stage.status)}

                {/* Officer Direct Sign-Off Button */}
                {isOfficerMode && stage.status !== "CLEARED" && (
                  <button
                    onClick={() => handleOfficerSignoff(stage.department)}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Authorize Sign-Off
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && activeClearance && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border-4 border-amber-600/30 space-y-6 relative"
          >
            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-4">
              <div className="flex justify-center mb-1">
                <UniversitySeal className="w-16 h-16" />
              </div>
              <h2 className="font-serif font-black text-2xl uppercase tracking-wider text-slate-950">
                Mekdela Amba University
              </h2>
              <p className="text-xs font-serif italic text-slate-600">Office of the University Registrar • Tulu Awulia Campus</p>
              <div className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-widest mt-2">
                Official Student Clearance Certificate
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-sm leading-relaxed text-slate-800">
              <p>
                This is to officially certify that <span className="font-bold underline text-slate-950">{activeClearance.studentName}</span> (ID: <span className="font-mono font-bold">{activeClearance.studentId}</span>), enrolled in the <span className="font-bold">{activeClearance.program}</span> program, has fulfilled all institutional responsibilities and is hereby cleared of all liabilities across the University Library, Student Dormitories, Academic Laboratories, and Finance Directorate.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block">Clearance Reason:</span>
                  <span className="font-bold text-slate-900">{activeClearance.reason}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Final Certification:</span>
                  <span className="font-bold text-slate-900">{new Date().toISOString().split("T")[0]}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Cryptographic Hash Verification:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.digitalStampHash || "MAU-CLR-2026-AUTHENTIC"}</span>
                </div>
              </div>
            </div>

            {/* Seal & Signatures */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-200">
              <div className="text-center space-y-1">
                <div className="w-28 border-b-2 border-slate-900 mx-auto" />
                <span className="text-[11px] font-bold text-slate-700 block">University Registrar</span>
                <span className="text-[10px] text-slate-500 font-mono">Mekonnen Haile</span>
              </div>

              <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center p-1 rotate-12">
                <div className="text-center">
                  <span className="text-[8px] font-bold text-red-600 block uppercase">MAU REGISTRAR</span>
                  <span className="text-[10px] font-black text-red-700 block">CERTIFIED</span>
                  <span className="text-[7px] text-red-600 font-mono">2026 G.C.</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="w-28 border-b-2 border-slate-900 mx-auto" />
                <span className="text-[11px] font-bold text-slate-700 block">Finance Director</span>
                <span className="text-[10px] text-slate-500 font-mono">Meron Desta</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs cursor-pointer transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
