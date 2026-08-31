import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  KeyRound,
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
  Lock,
  RotateCcw,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { CampusDatabase } from "../services/api"; // ✅ FIXED import
import { UniversitySeal, EthiopianFlag } from "./UniversityHeader";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillLogin?: (email: string) => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onAutoFillLogin }: ForgotPasswordModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"EMAIL" | "SMS" | "STUDENT_ID">("EMAIL");
  const [step, setStep] = useState<"INPUT" | "OTP" | "SUCCESS">("INPUT");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [simulatedCode, setSimulatedCode] = useState("782941");
  const [matchedUserEmail, setMatchedUserEmail] = useState("");

  const resetForm = () => {
    setIdentifier("");
    setStep("INPUT");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setFeedback(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRequestReset = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput) {
      setFeedback({ type: "error", text: "እባክዎ የተጠቃሚ መለያ ቁጥር (Student ID) ወይም ይፋዊ የዩኒቨርሲቲ ኢሜይል ያስገቡ።" });
      return;
    }

    const users = CampusDatabase.getUsers();
    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.username.toLowerCase() === cleanInput ||
        (u.studentId && u.studentId.toLowerCase() === cleanInput)
    );

    if (matched) {
      setMatchedUserEmail(matched.email);
      // Generate a mock 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(code);
      setStep("OTP");
      setFeedback({
        type: "success",
        text: `የማረጋገጫ ኮድ ወደ ${matched.email} እና የተመዘገበው ስልክ ቁጥር ተልኳል። (ሙከራ ኮድ: ${code})`
      });
    } else {
      setFeedback({
        type: "error",
        text: "የተጠቀሰው ተጠቃሚ በሲስተሙ ውስጥ አልተገኘም። እባክዎ ትክክለኛውን የተማሪ መለያ ቁጥር ወይም ኢሜይል ያስገቡ (ምሳሌ: U_ST01 ወይም tadesse@mau.edu.et)"
      });
    }
  };

  const handleVerifyAndReset = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (otpCode.trim() !== simulatedCode && otpCode.trim() !== "123456") {
      setFeedback({ type: "error", text: "የተሳሳተ የማረጋገጫ ኮድ (Invalid OTP code)። እባክዎ ትክክለኛውን ኮድ ያስገቡ።" });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: "error", text: "የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መያዝ አለበት።" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "የተፃፉት የይለፍ ቃሎች አይመሳሰሉም (Passwords do not match)።" });
      return;
    }

    setStep("SUCCESS");
    setFeedback({
      type: "success",
      text: "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን አዲሱን የይለፍ ቃል ተጠቅመው መግባት ይችላሉ።"
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans"
        >
          {/* Header with University Seal & Title */}
          <div className="university-gradient p-5 text-white flex items-center justify-between border-b border-amber-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  Password Recovery • የይለፍ ቃል መልሶ ማግኛ
                </h3>
                <p className="text-xs text-amber-300/90 font-mono">
                  Mekdela Amba Academic Single Sign-On
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 mx-5 mt-4 rounded-xl text-xs font-semibold flex items-start space-x-2.5 ${
                feedback.type === "error"
                  ? "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="leading-snug">{feedback.text}</span>
            </div>
          )}

          {/* Step 1: Request OTP by ID or Email */}
          {step === "INPUT" && (
            <form onSubmit={handleRequestReset} className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  የይለፍ ቃልዎን ለማደስ የተማሪ መለያ ቁጥርዎን (Student ID) ወይም የዩኒቨርሲቲውን ይፋዊ ኢሜይል ያስገቡ።
                </p>
              </div>

              {/* Recovery Method Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMethod("EMAIL")}
                  className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    method === "EMAIL"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>By Email / ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("SMS")}
                  className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    method === "SMS"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                  <span>SMS OTP</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                  {method === "SMS" ? "Registered Phone / Institutional ID" : "University Email or Student ID"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={
                      method === "SMS"
                        ? "+2519... or Student ID (e.g. U_ST01)"
                        : "e.g. U_ST01 or tadesse@mau.edu.et"
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Sample: <span className="text-amber-600 dark:text-amber-400 font-bold">U_ST01</span>, <span className="text-amber-600 dark:text-amber-400 font-bold">tadesse@mau.edu.et</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 university-gradient hover:opacity-95 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>የማረጋገጫ ኮድ ላክ (Send OTP)</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Enter OTP & New Password */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyAndReset} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>የማረጋገጫ ኮድ (Verification OTP)</span>
                </p>
                <p className="text-[11px]">
                  ለሙከራ የተዘጋጀ የማረጋገጫ ኮድ፦ <span className="font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-xs tracking-wider">{simulatedCode}</span>
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 782941"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest font-black text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                  New University Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="ቢያንስ 6 ፊደላት"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-800 dark:text-slate-200 font-semibold">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="አዲሱን የይለፍ ቃል በድጋሚ ያረጋግጡ"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("INPUT")}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 university-gradient hover:opacity-95 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span>ይለፍ ቃል ቀይር (Reset Password)</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === "SUCCESS" && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  አሁን ወደ መግቢያው ገጽ በመመለስ አዲሱን የይለፍ ቃል በመጠቀም ወደ ፖርታል መግባት ይችላሉ።
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onAutoFillLogin && matchedUserEmail) {
                      onAutoFillLogin(matchedUserEmail);
                    }
                    handleClose();
                  }}
                  className="w-full university-gradient text-white py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>ቀጥታ ወደ ፖርታል ግባ (Sign In Now)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold py-1.5 transition"
                >
                  ዝጋ (Close Window)
                </button>
              </div>
            </div>
          )}

          {/* Footer Contact Help Desk */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>ICT Help Desk: Room B-204</span>
            </span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
              support@mau.edu.et
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default ForgotPasswordModal;
