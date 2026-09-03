import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { User } from "../types";
import { CampusDatabase } from "../mockData";
import { EthiopianFlag, UniversitySeal } from "./UniversityHeader";
import {
  X,
  User as UserIcon,
  Lock,
  Camera,
  Upload,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Shield,
  Trash2,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

// Curated high-fidelity academic avatars
const PRESET_AVATARS = [
  {
    label: "Engineering Student",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
  },
  {
    label: "Software Scholar",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
  },
  {
    label: "Senior Student",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"
  },
  {
    label: "Faculty Professor",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
  },
  {
    label: "Academic Researcher",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200"
  },
  {
    label: "Registrar Officer",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200"
  },
  {
    label: "College Dean",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200"
  },
  {
    label: "Government Inspector",
    url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200"
  },
  {
    label: "Finance Director",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200"
  },
  {
    label: "Library Specialist",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"
  }
];

export function UpdateProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}: UpdateProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "photo" | "security">("general");

  // General fields
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [customUrlInput, setCustomUrlInput] = useState("");

  // Password fields
  const [wantPasswordChange, setWantPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Status & validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-300" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: "Weak • ደካማ", color: "bg-red-500", width: "25%" };
    if (score === 3) return { score: 2, text: "Fair • መካከለኛ", color: "bg-amber-500", width: "50%" };
    if (score === 4) return { score: 3, text: "Good • ጥሩ", color: "bg-blue-500", width: "75%" };
    return { score: 4, text: "Strong • አስተማማኝ", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  // File Upload Handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage("Image file size exceeds 4MB limit. Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setErrorMessage("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    setCustomUrlInput("");
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter a valid full name (ቢያንስ 2 ፊደላት).");
      setActiveTab("general");
      return;
    }

    // Password validation if requested
    let updatedPassword = user.password || "password";
    if (wantPasswordChange) {
      const expectedPassword = user.password || "password";
      if (!currentPassword) {
        setErrorMessage("Please enter your current university password.");
        setActiveTab("security");
        return;
      }
      if (currentPassword !== expectedPassword) {
        setErrorMessage("Current password does not match institutional records. (የአሁኑ የይለፍ ቃል ትክክል አይደለም)");
        setActiveTab("security");
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage("New password must be at least 6 characters long.");
        setActiveTab("security");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirm password do not match. (የይለፍ ቃሎች አይመሳሰሉም)");
        setActiveTab("security");
        return;
      }
      updatedPassword = newPassword;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        password: updatedPassword
      };

      // 1. Update in CampusDatabase
      CampusDatabase.updateUser(updatedUser);

      // 2. Update in current user session
      localStorage.setItem("uscms_current_user", JSON.stringify(updatedUser));

      // 3. Dispatch system-wide broadcast event
      window.dispatchEvent(new CustomEvent("uscms_user_updated", { detail: updatedUser }));

      // 4. Log in institutional audit trail
      CampusDatabase.addAuditLog(
        user.id,
        updatedUser.fullName,
        user.role,
        "Update User Profile & Security Credentials",
        "User",
        user.id,
        `User successfully updated profile credentials (Name: ${updatedUser.fullName}${wantPasswordChange ? ", Password Changed" : ""}${avatarUrl !== user.avatarUrl ? ", Avatar Updated" : ""}).`
      );

      // 5. Notify parent component
      onProfileUpdated(updatedUser);

      setIsSubmitting(false);
      setSuccessMessage("Your profile and credentials have been updated successfully! • መገለጫዎ በተሳካ ሁኔታ ተዘምኗል!");

      setTimeout(() => {
        onClose();
      }, 1200);
    }, 600);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "Student • ተማሪ";
      case "INSTRUCTOR":
        return "Faculty Member • መምህር";
      case "REGISTRAR":
        return "University Registrar • ሬጅስትራር";
      case "DEPARTMENT_HEAD":
        return "Department Head • የትምህርት ክፍል ኃላፊ";
      case "DEAN":
        return "College Dean • የኮሌጅ ዲን";
      case "ADMIN":
        return "System Administrator • ሲስተም አስተዳዳሪ";
      case "AUDITOR":
        return "Federal Quality Auditor • የመንግስት ኦዲተር";
      case "LIBRARY_STAFF":
        return "Library Officer • ቤተ-መጽሐፍት ኃላፊ";
      case "FINANCE_OFFICER":
        return "Finance Officer • የፋይናንስ ኃላፊ";
      default:
        return role;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="university-gradient text-white p-5 sm:p-6 flex items-center justify-between border-b border-amber-500/20 relative">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <UniversitySeal className="w-11 h-11 drop-shadow-md" />
              <div className="absolute -bottom-1 -right-1">
                <EthiopianFlag className="w-4 h-3 rounded-xs shadow-xs" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-display font-extrabold text-white tracking-tight">
                  Update Profile • መገለጫ አዘምን
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                {getRoleDisplayName(user.role)} — Mekdela Amba University
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 pt-2 text-xs font-semibold gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 transition-all duration-150 ${
              activeTab === "general"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-slate-900 rounded-t-lg shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Personal Info • ስም እና መረጃ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 transition-all duration-150 ${
              activeTab === "photo"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-slate-900 rounded-t-lg shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Profile Photo • ፎቶ</span>
            {avatarUrl && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 transition-all duration-150 ${
              activeTab === "security"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-slate-900 rounded-t-lg shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password • የይለፍ ቃል</span>
            {wantPasswordChange && (
              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">
                EDIT
              </span>
            )}
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Notifications / Alerts */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: GENERAL INFO */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Profile Card Header Preview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-display font-black text-2xl flex items-center justify-center border-2 border-amber-500/30">
                      {fullName.charAt(0) || "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("photo")}
                    className="absolute -bottom-1.5 -right-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 p-1.5 rounded-lg shadow-md transition-colors"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {fullName || user.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      ID: {user.studentId || user.instructorId || user.staffId || user.officerId || user.username}
                    </span>
                    {user.department && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        • {user.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name • ሙሉ ስም <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tadesse Mersha"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  This official academic name appears on graduation rosters, transcripts, and official university communications.
                </p>
              </div>

              {/* Institutional Email (Read-only / verified) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Institutional Email • የዩኒቨርሲቲ ኢሜይል
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Institutional email address is managed directly by the MAU ICT Directorate.
                </p>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number • የስልክ ቁጥር
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+251 911 223344"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Used for automated SMS alerts on exam schedules, grades, and emergency campus broadcasts.
                </p>
              </div>

              {/* Short Bio / Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Academic Status / Bio • አጭር ማስታወሻ
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 4th Year Software Engineering Student interested in AI and Cloud Infrastructure."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE PHOTO */}
          {activeTab === "photo" && (
            <div className="space-y-5">
              {/* Photo Preview & Control Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-amber-500/80 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-display font-bold text-3xl border-4 border-slate-300 dark:border-slate-600">
                      {fullName.charAt(0) || "U"}
                    </div>
                  )}
                  {avatarUrl && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Official Profile Image • የመገለጫ ፎቶ
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload your own photo or pick one of the verified institutional avatars below.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device • ፎቶ ይጫኑ</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Option A: Preset Institutional Avatars */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Institutional Avatar Gallery • የተመረጡ የአቫታር ምርጫዎች
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Select</span>
                </div>

                <div className="grid grid-cols-5 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  {PRESET_AVATARS.map((preset, index) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        title={preset.label}
                        className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/50 scale-105 shadow-md"
                            : "border-slate-200 dark:border-slate-700 hover:border-amber-400/80 hover:scale-102"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <div className="bg-amber-500 text-slate-950 p-1 rounded-full shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-white py-0.5 px-1 truncate font-mono text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option B: Direct Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Or Paste Custom Image URL • ወይም የምስል ሊንክ ያስገቡ
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    disabled={!customUrlInput.trim()}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASSWORD & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-4">
              {/* Checkbox toggle to change password */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="want_password_change"
                  checked={wantPasswordChange}
                  onChange={(e) => setWantPasswordChange(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="want_password_change" className="flex-1 cursor-pointer">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    I want to change my university password • የይለፍ ቃሌን መቀየር እፈልጋለሁ
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Check this box to set a new secure password for your institutional account.
                  </span>
                </label>
              </div>

              {wantPasswordChange && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-2"
                >
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Current Password • የአሁኑ የይለፍ ቃል <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        required={wantPasswordChange}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password (demo: password)"
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      New Password • አዲስ የይለፍ ቃል <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPw ? "text" : "password"}
                        required={wantPasswordChange}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Strength:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{strength.text}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: strength.width }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Confirm New Password • አዲሱን የይለፍ ቃል ያረጋግጡ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        required={wantPasswordChange}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword && confirmPassword !== newPassword && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Passwords do not match • የይለፍ ቃሎቹ አይመሳሰሉም</span>
                      </p>
                    )}
                    {confirmPassword && newPassword && confirmPassword === newPassword && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Passwords match • የይለፍ ቃሎቹ ይገናኛሉ</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Security advice note */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Institutional Security Protocol (FDRE Higher Education)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  All credential updates are cryptographically logged in the university audit ledger with IP and timestamp verification under MoE directive.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel • ሰርዝ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center space-x-2 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes... • በማስቀመጥ ላይ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes • ለውጦችን አስቀምጥ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
