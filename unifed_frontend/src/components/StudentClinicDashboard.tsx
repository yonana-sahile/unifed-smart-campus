import { useState, useEffect, FormEvent } from "react";
import {
  User,
  StudentClinicProfile,
  ClinicAppointment,
  ClinicPrescription,
  ClinicLabTest,
  ClinicSickLeaveCertificate,
  AmbulanceEmergencyCall,
  ClinicSpecialty
} from "../types";
import { CampusDatabase } from "../services/api";
import { EthiopianFlag, UniversitySeal } from "./UniversityHeader";
import {
  HeartPulse,
  Stethoscope,
  Ambulance,
  Pill,
  Thermometer,
  Droplets,
  Calendar,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileText,
  Printer,
  X,
  Search,
  Filter,
  Activity,
  User as UserIcon,
  Sparkles,
  Download,
  Flame,
  ChevronRight,
  ShieldAlert,
  Send,
  Eye,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentClinicDashboardProps {
  user: User;
}

export function StudentClinicDashboard({ user }: StudentClinicDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "prescriptions" | "lab_results" | "sick_leave" | "emergency"
  >("overview");

  // Core Data
  const [profile, setProfile] = useState<StudentClinicProfile>(CampusDatabase.getClinicProfile(user.id));
  const [appointments, setAppointments] = useState<ClinicAppointment[]>(
    CampusDatabase.getClinicAppointments(user.id)
  );
  const [prescriptions, setPrescriptions] = useState<ClinicPrescription[]>(
    CampusDatabase.getClinicPrescriptions(user.id)
  );
  const [labTests, setLabTests] = useState<ClinicLabTest[]>(
    CampusDatabase.getClinicLabTests(user.id)
  );
  const [sickLeaves, setSickLeaves] = useState<ClinicSickLeaveCertificate[]>(
    CampusDatabase.getSickLeaveCertificates(user.id)
  );
  const [ambulanceCalls, setAmbulanceCalls] = useState<AmbulanceEmergencyCall[]>(
    CampusDatabase.getAmbulanceCalls(user.id)
  );

  // Modals
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSickLeaveModal, setShowSickLeaveModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [activePrescriptionModal, setActivePrescriptionModal] = useState<ClinicPrescription | null>(null);
  const [activeCertPreview, setActiveCertPreview] = useState<ClinicSickLeaveCertificate | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Form State: Book Appointment
  const [bookCampus, setBookCampus] = useState<"Tulu Awulia (Main Health Center)" | "Masha Sub-Campus Clinic">(
    "Tulu Awulia (Main Health Center)"
  );
  const [bookSpecialty, setBookSpecialty] = useState<ClinicSpecialty>("GENERAL_OUTPATIENT");
  const [bookDoctor, setBookDoctor] = useState("Dr. Birhanu Tadesse (MD, CMO)");
  const [bookDate, setBookDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookTime, setBookTime] = useState("09:30 AM");
  const [bookReason, setBookReason] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Form State: Sick Leave Request
  const [certDiagnosis, setCertDiagnosis] = useState("");
  const [certStartDate, setCertStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [certDays, setCertDays] = useState(3);
  const [certReasonDetails, setCertReasonDetails] = useState("");

  // Form State: Emergency Ambulance
  const [ambDormLocation, setAmbDormLocation] = useState(profile.dormLocation || "Block 06, Room 304");
  const [ambEmergencyNature, setAmbEmergencyNature] = useState("");
  const [ambPhone, setAmbPhone] = useState("+251 91 145 8920");

  // Form State: Edit Health Profile
  const [editAllergies, setEditAllergies] = useState(profile.allergies.join(", "));
  const [editConditions, setEditConditions] = useState(profile.chronicConditions.join(", "));
  const [editContactName, setEditContactName] = useState(profile.emergencyContactName);
  const [editContactPhone, setEditContactPhone] = useState(profile.emergencyContactPhone);
  const [editDorm, setEditDorm] = useState(profile.dormLocation);

  const symptomOptions = [
    "High Fever / ብርድና ትኩሳት",
    "Persistent Headache / ራስ ምታት",
    "Severe Cough / ደረቅ ወይም አክታ ያለው ሳል",
    "Abdominal Cramps / የሆድ ቁርጠት",
    "Nausea & Vomiting / ማቅለሽለሽና ማስመለስ",
    "Physical Injury / ስብራት ወይም ቁስለት",
    "Dental Toothache / የጥርስ ሕመም",
    "Visual Strain / የዓይን ድካምና ማቃጠል",
    "Severe Anxiety / ውጥረትና ጭንቀት"
  ];

  const specialtyDoctorMap: Record<ClinicSpecialty, string[]> = {
    GENERAL_OUTPATIENT: [
      "Dr. Birhanu Tadesse (MD, Chief Medical Officer)",
      "Sister Martha Getachew (Senior Clinical Health Officer)",
      "Dr. Dawit Assefa (General Practitioner)"
    ],
    EMERGENCY_TRIAGE: [
      "Dr. Birhanu Tadesse (Emergency Unit Lead)",
      "Sister Martha Getachew (Emergency Triage Nurse)"
    ],
    DENTAL: ["Dr. Henok Belay (DDS, University Dental Surgeon)"],
    OPHTHALMOLOGY: ["Dr. Solomon Kassa (Optometry & Vision Specialist)"],
    MENTAL_HEALTH_COUNSELING: [
      "Dr. Eden Alemu (Clinical Psychologist & Student Counselor)",
      "W/ro Tigist Haile (Counseling Psychologist)"
    ],
    REPRODUCTIVE_HEALTH: [
      "Sister Martha Getachew (Senior Midwifery & Reproductive Health Officer)"
    ],
    PHARMACY_CONSULTATION: [
      "Sister Martha (Chief Dispensary Pharmacist)",
      "Pharmacist Yonas Tesfaye (Clinical Pharmacist)"
    ]
  };

  useEffect(() => {
    const handleSync = () => {
      setProfile(CampusDatabase.getClinicProfile(user.id));
      setAppointments(CampusDatabase.getClinicAppointments(user.id));
      setPrescriptions(CampusDatabase.getClinicPrescriptions(user.id));
      setLabTests(CampusDatabase.getClinicLabTests(user.id));
      setSickLeaves(CampusDatabase.getSickLeaveCertificates(user.id));
      setAmbulanceCalls(CampusDatabase.getAmbulanceCalls(user.id));
    };

    window.addEventListener("uscms_clinic_profile_changed", handleSync);
    window.addEventListener("uscms_clinic_appointments_changed", handleSync);
    window.addEventListener("uscms_clinic_prescriptions_changed", handleSync);
    window.addEventListener("uscms_clinic_lab_tests_changed", handleSync);
    window.addEventListener("uscms_clinic_sick_leaves_changed", handleSync);
    window.addEventListener("uscms_ambulance_calls_changed", handleSync);

    return () => {
      window.removeEventListener("uscms_clinic_profile_changed", handleSync);
      window.removeEventListener("uscms_clinic_appointments_changed", handleSync);
      window.removeEventListener("uscms_clinic_prescriptions_changed", handleSync);
      window.removeEventListener("uscms_clinic_lab_tests_changed", handleSync);
      window.removeEventListener("uscms_clinic_sick_leaves_changed", handleSync);
      window.removeEventListener("uscms_ambulance_calls_changed", handleSync);
    };
  }, [user.id]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleBookAppointment = (e: FormEvent) => {
    e.preventDefault();
    if (!bookReason.trim()) {
      alert("Please provide the primary reason for your consultation.");
      return;
    }

    const newApt = CampusDatabase.bookClinicAppointment({
      studentId: user.id,
      studentName: user.fullName,
      campus: bookCampus,
      specialty: bookSpecialty,
      doctorOrOfficer: bookDoctor,
      appointmentDate: bookDate,
      appointmentTime: bookTime,
      reason: bookReason.trim(),
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ["Routine Clinical Review"],
      triagePriority: selectedSymptoms.length >= 3 ? "URGENT" : "ROUTINE",
      doctorNotes: "Pending triage vital check by Clinic Nurse."
    });

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Book Clinic Appointment",
      "ClinicAppointment",
      newApt.id,
      `Booked clinic appointment with ${bookDoctor} for ${bookSpecialty} on ${bookDate}`
    );

    alert(`Clinic Appointment #${newApt.appointmentNumber} confirmed for ${bookDate} at ${bookTime}!`);
    setShowAppointmentModal(false);
    setBookReason("");
    setSelectedSymptoms([]);
    setActiveTab("appointments");
  };

  const handleRequestSickLeave = (e: FormEvent) => {
    e.preventDefault();
    if (!certDiagnosis.trim()) {
      alert("Please provide your medical diagnosis or condition description.");
      return;
    }

    const start = new Date(certStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + certDays);

    const newCert = CampusDatabase.requestSickLeaveCertificate({
      studentId: user.id,
      studentName: user.fullName,
      department: user.department || "College of Informatics & Engineering",
      academicYear: user.academicYear ? `Year ${user.academicYear}` : "Year 4, Semester I",
      diagnosisCategory: certDiagnosis.trim(),
      excuseStartDate: certStartDate,
      excuseEndDate: end.toISOString().split("T")[0],
      totalDays: certDays,
      approvedByDoctor: "Dr. Birhanu Tadesse (MD, CMO)",
      doctorLicenseNo: "ETH-MED-84912",
      recommendations: certReasonDetails.trim() || "Excused from campus academic lectures, lab experiments, and mid-term evaluations."
    });

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Issue Medical Sick Leave",
      "ClinicSickLeaveCertificate",
      newCert.id,
      `Issued official medical certificate #${newCert.certificateNumber} for ${certDays} days`
    );

    alert(`Official Medical Sick Leave Certificate #${newCert.certificateNumber} generated and electronically transmitted to the University Registrar!`);
    setShowSickLeaveModal(false);
    setCertDiagnosis("");
    setCertReasonDetails("");
    setActiveCertPreview(newCert);
    setActiveTab("sick_leave");
  };

  const handleDispatchAmbulance = (e: FormEvent) => {
    e.preventDefault();
    if (!ambEmergencyNature.trim()) {
      alert("Please specify the medical emergency nature.");
      return;
    }

    const call = CampusDatabase.dispatchEmergencyAmbulance({
      callerStudentName: user.fullName,
      studentId: user.id,
      phone: ambPhone.trim() || "+251 91 145 8920",
      dormitoryOrLocation: ambDormLocation.trim() || "Main Campus Dormitory",
      emergencyNature: ambEmergencyNature.trim(),
      urgencyLevel: "CRITICAL"
    });

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Emergency Ambulance Call",
      "AmbulanceEmergencyCall",
      call.id,
      `Triggered emergency ambulance dispatch to ${call.dormitoryOrLocation} for ${call.emergencyNature}`
    );

    alert(`EMERGENCY: Ambulance dispatched! Unit MAU-AMB-01 is en route to ${call.dormitoryOrLocation}. Paramedic team notified.`);
    setShowAmbulanceModal(false);
    setAmbEmergencyNature("");
    setActiveTab("emergency");
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const updated: StudentClinicProfile = {
      ...profile,
      allergies: editAllergies.split(",").map((s) => s.trim()).filter(Boolean),
      chronicConditions: editConditions.split(",").map((s) => s.trim()).filter(Boolean),
      emergencyContactName: editContactName.trim(),
      emergencyContactPhone: editContactPhone.trim(),
      dormLocation: editDorm.trim()
    };
    CampusDatabase.updateClinicProfile(updated);
    setProfile(updated);
    setShowEditProfileModal(false);
    alert("Emergency health records and contact details updated successfully!");
  };

  return (
    <div className="space-y-6" id="student_clinic_dashboard_root">
      {/* ------------------------------------------------------------- */}
      {/* 1. OFFICIAL UNIVERSITY CLINIC HEADER BANNER                   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-[#071526] text-white rounded-3xl p-6 sm:p-8 border border-red-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <HeartPulse className="w-72 h-72 text-red-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <EthiopianFlag className="w-6 h-4 rounded-xs shadow-xs" />
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>24/7 University Health Services • የተማሪዎች ክሊኒክ</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shrink-0 border border-red-400/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                  Mekdela Amba University Health Center
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-serif">
                  የተማሪዎች እና ሠራተኞች ጤና ጥበቃ ዳይሬክቶሬት • Comprehensive Primary Health Care, Clinical Triage, Pharmacy Dispensary, and Emergency Medical Response.
                </p>
              </div>
            </div>

            {/* Student Medical Record Identity strip */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-300">
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center space-x-2">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Patient MRN: <strong className="text-amber-300">{profile.patientRecordNumber}</strong></span>
              </div>
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center space-x-2">
                <Droplets className="w-3.5 h-3.5 text-red-400" />
                <span>Blood Type: <strong className="text-red-300 font-bold">{profile.bloodGroup} ({profile.rhFactor})</strong></span>
              </div>
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dorm: <strong className="text-emerald-300">{profile.dormLocation}</strong></span>
              </div>
            </div>
          </div>

          {/* Emergency Ambulance Hotline Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg shadow-red-900/40 border border-red-400/40 cursor-pointer active:scale-98"
            >
              <Ambulance className="w-5 h-5 animate-bounce" />
              <div className="text-left">
                <div className="text-xs font-black tracking-wide uppercase">24/7 Campus Ambulance</div>
                <div className="text-[10px] font-mono text-red-200">Dispatch Emergency ICU</div>
              </div>
            </button>

            <button
              onClick={() => setShowAppointmentModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Book Doctor Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-NAVIGATION TABS BAR                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1">
          {[
            { id: "overview", label: "Health Record & Vitals", icon: Activity },
            { id: "appointments", label: "Consultations & OPD", icon: Calendar, count: appointments.filter((a) => a.status === "SCHEDULED").length },
            { id: "prescriptions", label: "Pharmacy & Dispensary", icon: Pill, count: prescriptions.filter((p) => p.dispenseStatus === "READY_FOR_PICKUP").length },
            { id: "lab_results", label: "Laboratory Tests", icon: Droplets, count: labTests.length },
            { id: "sick_leave", label: "Medical Certificates", icon: FileText, count: sickLeaves.length },
            { id: "emergency", label: "Emergency & Ambulance", icon: Ambulance, count: ambulanceCalls.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-red-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-red-500 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center space-x-2 pr-2">
          <button
            onClick={() => setShowSickLeaveModal(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Request Sick Leave</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: HEALTH PROFILE & VITALS OVERVIEW                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics: Vitals Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Blood Pressure</span>
                <HeartPulse className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                118/76 <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">● Optimal Reading</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Heart Rate</span>
                <Activity className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                72 <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">● Resting Sinus Normal</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Body Temperature</span>
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                36.7 <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">● Normothermic</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Body Mass Index (BMI)</span>
                <UserIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {profile.bmi} <span className="text-xs font-normal text-slate-400">kg/m²</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">● Healthy Weight</span>
            </div>
          </div>

          {/* Profile Details & Allergies Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Comprehensive Medical Ledger */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Verified Student Clinical Records
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Official Directorate of Health Services Ledger
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                  >
                    Update Info
                  </button>
                </div>

                {/* Patient Information Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">Full Patient Name:</span>
                    <strong className="block text-slate-900 text-sm font-serif">{user.fullName}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">University Student ID:</span>
                    <strong className="block text-slate-900 text-sm font-mono font-bold">{user.studentId || "MAU-14088"}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">Academic Department:</span>
                    <strong className="block text-slate-900">{user.department || "Software Engineering"}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">Campus Dormitory:</span>
                    <strong className="block text-slate-900">{profile.dormLocation}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">Height & Weight:</span>
                    <strong className="block text-slate-900 font-mono">
                      {profile.heightCm} cm · {profile.weightKg} kg (BMI: {profile.bmi})
                    </strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <span className="text-slate-400 font-mono">Last Comprehensive Checkup:</span>
                    <strong className="block text-slate-900 font-mono">{profile.lastCheckupDate}</strong>
                  </div>
                </div>

                {/* Clinical Allergies & Critical Safety Tags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    <span>Known Drug & Substance Allergies (የመድኃኒት አለርጂ)</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((alg, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-center space-x-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span>{alg}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Chronic Medical Conditions
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.chronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Emergency Contacts & Immunizations */}
            <div className="space-y-6">
              {/* Emergency Contacts Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono">
                    Next of Kin & Emergency Contact
                  </h4>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Contact Name:</span>
                    <strong className="block text-slate-900 text-sm font-serif">
                      {profile.emergencyContactName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Relationship:</span>
                    <strong className="block text-slate-800">{profile.emergencyContactRelation}</strong>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500">Telephone Hotline:</span>
                    <strong className="block text-emerald-800 font-mono text-sm font-bold">
                      {profile.emergencyContactPhone}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  In case of severe acute trauma or hospitalization, the university medical superintendent coordinates directly with this contact.
                </div>
              </div>

              {/* Verified Immunization Ledger */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono">
                    Immunization & Vaccine Ledger
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="font-medium text-slate-800">COVID-19 Full Primary Series</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="font-medium text-slate-800">Hepatitis B Vaccination</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="font-medium text-slate-800">Tetanus Toxoid Booster</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: APPOINTMENTS & DOCTOR CONSULTATIONS                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-red-600" />
                <span>Doctor Appointments & Outpatient Consultations (የክሊኒክ ቀጠሮ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Schedule consultations with university physicians, clinical psychologists, and dentist specialists at Tulu Awulia Main Health Center or Masha Clinic.
              </p>
            </div>

            <button
              onClick={() => setShowAppointmentModal(true)}
              className="bg-primary hover:bg-primary-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Consultation</span>
            </button>
          </div>

          {/* Appointments List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {apt.appointmentNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          apt.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : apt.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm pt-1">{apt.reason}</h4>
                    <p className="text-xs text-slate-500 font-mono">{apt.campus}</p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-red-50 text-red-600 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Attending Officer:</span>
                    <strong className="text-slate-800 font-serif">{apt.doctorOrOfficer}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <strong className="text-slate-900 font-mono">{apt.appointmentDate} at {apt.appointmentTime}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Specialty Department:</span>
                    <span className="font-semibold text-slate-700">{apt.specialty.replace(/_/g, " ")}</span>
                  </div>
                  {apt.doctorNotes && (
                    <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
                      " {apt.doctorNotes} "
                    </div>
                  )}
                </div>

                {apt.status === "SCHEDULED" && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed by Clinic Reception</span>
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel this clinic consultation?")) {
                          CampusDatabase.cancelClinicAppointment(apt.id);
                          setAppointments(CampusDatabase.getClinicAppointments(user.id));
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-semibold text-xs cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: DIGITAL PRESCRIPTIONS & PHARMACY DISPENSARY            */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <span>Active Prescriptions & Pharmacy Dispensary (የመድኃኒት ማዘዣ እና ፋርማሲ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Official prescriptions issued by campus doctors. Present the digital QR verification code at the University Central Clinic Pharmacy window to collect medications.
              </p>
            </div>
            <div className="text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
              DISPENSARY HOURS: 08:00 AM - 08:00 PM (24/7 ON CALL)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {rx.rxNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          rx.dispenseStatus === "READY_FOR_PICKUP"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {rx.dispenseStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Prescribed by {rx.prescribingDoctor} on {rx.datePrescribed}</p>
                  </div>

                  <button
                    onClick={() => setActivePrescriptionModal(rx)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Voucher</span>
                  </button>
                </div>

                {/* Medication Items List */}
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                  {rx.medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/70 space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 font-semibold">{med.medicationName}</strong>
                        <span className="font-mono text-slate-600 font-bold">
                          {med.quantityPrescribed} {med.unit}
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[11px]">
                        <span>Dosage: {med.dosage} · {med.frequency}</span>
                        <span>{med.durationDays} Days Course</span>
                      </div>
                      <div className="text-[11px] text-slate-600 italic">
                        Directions: {med.instructions}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Pickup Counter:</span>
                  <strong className="text-slate-800">{rx.pharmacyLocation}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: LABORATORY & DIAGNOSTIC TEST RESULTS                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "lab_results" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-red-600" />
                <span>Laboratory Diagnostic Ledger (የላቦራቶሪ ምርመራ ውጤቶች)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Diagnostic hematology, parasitology, urinalysis, and rapid screening test reports authenticated by campus laboratory technologists.
              </p>
            </div>
            <div className="text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
              CLINICAL PATHOLOGY LAB • ACCREDITED
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {labTests.map((test) => (
                <div key={test.id} className="p-6 space-y-3 hover:bg-slate-50/60 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {test.labOrderNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">• Ordered {test.orderDate}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {test.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base pt-1">{test.testName}</h4>
                      <p className="text-xs text-slate-500">
                        Specimen: <strong>{test.specimen}</strong> • Technician: {test.technicianName}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {test.interpretation}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs font-mono">
                    <div className="text-slate-500">Clinical Quantitative Findings:</div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{test.findings}</div>
                    {test.referenceRange && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        Biological Reference Interval: {test.referenceRange}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: OFFICIAL MEDICAL SICK LEAVE CERTIFICATES               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "sick_leave" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Official Medical Sick Leave Certificates (የህመም ፈቃድ ማረጋገጫ ወረቀት)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Certified Model Med-04 medical absence certificates excused from university lectures, laboratory sessions, and examinations. Auto-synced with the University Registrar and Academic Department Head.
              </p>
            </div>

            <button
              onClick={() => setShowSickLeaveModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Request Medical Excuse</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sickLeaves.map((cert) => (
              <div
                key={cert.id}
                className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {cert.certificateNumber}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {cert.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm pt-1">{cert.diagnosisCategory}</h4>
                    <p className="text-xs text-slate-500">
                      Approved by {cert.approvedByDoctor} ({cert.doctorLicenseNo})
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveCertPreview(cert)}
                    className="p-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-2xl transition cursor-pointer"
                    title="Print Official Voucher"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Excuse Duration:</span>
                    <strong className="text-slate-900 font-mono">
                      {cert.excuseStartDate} to {cert.excuseEndDate} ({cert.totalDays} Days)
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Department Status:</span>
                    <span className="text-emerald-700 font-semibold font-mono">Transmitted to Registrar ✓</span>
                  </div>
                  <p className="text-slate-600 italic pt-1 border-t border-slate-200">
                    "{cert.recommendations}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-mono text-[11px]">Issued on {cert.issuedDate}</span>
                  <button
                    onClick={() => setActiveCertPreview(cert)}
                    className="text-primary font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View & Print Official PDF</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: 24/7 CAMPUS EMERGENCY AMBULANCE DISPATCH               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-mono font-bold">
                <Ambulance className="w-4 h-4 animate-pulse" />
                <span>24/7 Rapid Emergency Response Unit</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display">
                Mekdela Amba University Emergency Medical Hotline
              </h3>
              <p className="text-xs sm:text-sm text-red-100 max-w-xl">
                For immediate life-threatening injuries, acute collapse, respiratory distress, or severe trauma anywhere in student dormitories, laboratories, or sports grounds.
              </p>
            </div>

            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl shadow-2xl transition flex items-center space-x-2 cursor-pointer shrink-0 uppercase tracking-wide active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Trigger Urgent Ambulance</span>
            </button>
          </div>

          {/* Active Calls & Dispatch Ledger */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono">
              Campus Emergency Medical Dispatch Ledger
            </h4>

            <div className="divide-y divide-slate-100">
              {ambulanceCalls.map((call) => (
                <div key={call.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                          {call.callNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(call.timestamp).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {call.status}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm pt-1">{call.emergencyNature}</h5>
                      <p className="text-xs text-slate-500">
                        Location: <strong>{call.dormitoryOrLocation}</strong> • Caller: {call.callerStudentName} ({call.phone})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                        {call.urgencyLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono flex flex-col sm:flex-row justify-between text-slate-600 gap-2">
                    <div>
                      Assigned Vehicle: <strong className="text-slate-900">{call.assignedAmbulance}</strong>
                    </div>
                    <div>
                      Paramedic Crew: <strong className="text-slate-900">{call.paramedicTeam}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: BOOK DOCTOR APPOINTMENT                              */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              <div className="bg-gradient-to-r from-red-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-red-800">
                <div className="flex items-center space-x-2.5">
                  <Stethoscope className="w-6 h-6 text-red-400" />
                  <div>
                    <h3 className="font-bold text-base">Schedule Doctor Consultation</h3>
                    <p className="text-[11px] text-red-200 font-mono">የተማሪዎች ክሊኒክ ቀጠሮ መያዣ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBookAppointment} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Campus Clinic *</label>
                    <select
                      value={bookCampus}
                      onChange={(e) => setBookCampus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    >
                      <option value="Tulu Awulia (Main Health Center)">Tulu Awulia (Main Health Center)</option>
                      <option value="Masha Sub-Campus Clinic">Masha Sub-Campus Clinic</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Specialty Department *</label>
                    <select
                      value={bookSpecialty}
                      onChange={(e) => {
                        const spec = e.target.value as ClinicSpecialty;
                        setBookSpecialty(spec);
                        setBookDoctor(specialtyDoctorMap[spec][0] || "Dr. Birhanu Tadesse");
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    >
                      <option value="GENERAL_OUTPATIENT">General Outpatient (OPD)</option>
                      <option value="EMERGENCY_TRIAGE">Emergency Triage</option>
                      <option value="DENTAL">Dental Surgery & Oral Care</option>
                      <option value="OPHTHALMOLOGY">Ophthalmology & Eye Clinic</option>
                      <option value="MENTAL_HEALTH_COUNSELING">Mental Health & Psychological Counseling</option>
                      <option value="REPRODUCTIVE_HEALTH">Reproductive & Maternal Health</option>
                      <option value="PHARMACY_CONSULTATION">Pharmacy & Dispensary Advice</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Assigned Medical Officer / Doctor *</label>
                  <select
                    value={bookDoctor}
                    onChange={(e) => setBookDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  >
                    {specialtyDoctorMap[bookSpecialty].map((doc, idx) => (
                      <option key={idx} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    >
                    </input>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Time Slot *</label>
                    <select
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    >
                      <option value="08:30 AM">08:30 AM (Morning Session)</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM (Afternoon Session)</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Primary Complaint / Reason for Visit *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe your current symptoms, duration, and any self-medications..."
                    value={bookReason}
                    onChange={(e) => setBookReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

                {/* Symptom Checklist */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Select Experienced Symptoms (Optional):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {symptomOptions.map((sym, idx) => {
                      const isSelected = selectedSymptoms.includes(sym);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleSymptom(sym)}
                          className={`p-2 rounded-xl border text-[11px] text-left transition cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? "bg-red-50 border-red-300 text-red-800 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${isSelected ? "bg-red-600 border-red-600 text-white" : "border-slate-300"}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{sym.split("/")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAppointmentModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: REQUEST SICK LEAVE CERTIFICATE                       */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showSickLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-emerald-800">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-base">Request Official Medical Certificate</h3>
                    <p className="text-[11px] text-emerald-200 font-mono">የህመም ፈቃድ ማረጋገጫ (Model Med-04)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSickLeaveModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestSickLeave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Medical Diagnosis / Condition *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Gastroenteritis, Severe Migraine with Dehydration..."
                    value={certDiagnosis}
                    onChange={(e) => setCertDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Start Date of Illness *</label>
                    <input
                      type="date"
                      required
                      value={certStartDate}
                      onChange={(e) => setCertStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Bed Rest Excused (Days) *</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      required
                      value={certDays}
                      onChange={(e) => setCertDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Academic Sessions / Exams Affected *</label>
                  <textarea
                    rows={2}
                    placeholder="Specify courses, mid-term tests, or lab practicals missed..."
                    value={certReasonDetails}
                    onChange={(e) => setCertReasonDetails(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                  ✓ Certified electronic transmission: Upon physician validation, this certificate is immediately mirrored in the University Registrar's examination registry.
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSickLeaveModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    Generate Certificate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: EMERGENCY AMBULANCE DISPATCH TRIGGER                 */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAmbulanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans border-2 border-red-500"
            >
              <div className="bg-red-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Ambulance className="w-7 h-7 animate-bounce" />
                  <div>
                    <h3 className="font-bold text-base uppercase tracking-wider">Campus Emergency Ambulance Hotline</h3>
                    <p className="text-[11px] text-red-200 font-mono">24/7 Mobile ICU Dispatch</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAmbulanceModal(false)}
                  className="p-1 rounded-lg text-red-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchAmbulance} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Immediate Dispatch Protocol:</span>
                  </div>
                  <p className="text-[11px]">
                    Submitting this form immediately radios the on-duty paramedics and mobilizes the 4WD Mobile ICU Ambulance. Estimated on-campus response: 3 to 5 minutes.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Current Campus Location (Dorm / Lab / Field) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block 06, Room 304 (Tulu Awulia Main Campus)"
                    value={ambDormLocation}
                    onChange={(e) => setAmbDormLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Direct Telephone / Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={ambPhone}
                    onChange={(e) => setAmbPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Nature of Emergency / Symptoms *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Severe bleeding, unconsciousness, acute asthma attack, sudden high fever with convulsions..."
                    value={ambEmergencyNature}
                    onChange={(e) => setAmbEmergencyNature(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAmbulanceModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-lg cursor-pointer uppercase tracking-wider"
                  >
                    Dispatch Ambulance Now
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: OFFICIAL PRINTABLE MEDICAL CERTIFICATE (MODEL MED-04)*/}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeCertPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              {/* Toolbar */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm">Official University Medical Certificate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    onClick={() => setActiveCertPreview(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-serif" id="printable-medical-cert">
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <EthiopianFlag className="w-7 h-4.5 rounded-xs" />
                    <UniversitySeal className="w-14 h-14" />
                  </div>
                  <h2 className="font-bold text-sm tracking-wide uppercase">Federal Democratic Republic of Ethiopia</h2>
                  <h3 className="font-bold text-base text-slate-900">MEKDELA AMBA UNIVERSITY</h3>
                  <p className="text-[11px] font-mono uppercase text-slate-600">
                    Directorate of Student Health & Medical Services • የተማሪዎች ጤና ጣቢያ
                  </p>
                  <div className="inline-block border border-slate-900 px-3 py-1 rounded mt-2 font-mono font-bold text-xs bg-emerald-50">
                    OFFICIAL MEDICAL SICK LEAVE CERTIFICATE (MODEL MED-04)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <div><strong>Certificate No:</strong> <span className="font-mono font-bold">{activeCertPreview.certificateNumber}</span></div>
                    <div><strong>Student Patient:</strong> <span className="font-bold">{activeCertPreview.studentName}</span></div>
                    <div><strong>Student ID:</strong> <span className="font-mono">{user.studentId || "MAU-14088"}</span></div>
                    <div><strong>College / Dept:</strong> {activeCertPreview.department}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><strong>Date Issued:</strong> <span className="font-mono">{activeCertPreview.issuedDate}</span></div>
                    <div><strong>Excused Period:</strong> <span className="font-mono font-bold text-emerald-800">{activeCertPreview.excuseStartDate} to {activeCertPreview.excuseEndDate}</span></div>
                    <div><strong>Total Rest Days:</strong> <span className="font-mono">{activeCertPreview.totalDays} Days</span></div>
                    <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">{activeCertPreview.status}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-2 font-sans">
                  <div>
                    <strong>Medical Diagnosis & Clinical Evaluation:</strong>
                    <p className="text-slate-800 text-xs mt-1 font-semibold">{activeCertPreview.diagnosisCategory}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <strong>Medical Officer Directive & Recommendations:</strong>
                    <p className="text-slate-700 text-xs mt-1 italic">
                      "{activeCertPreview.recommendations}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] font-sans text-center border-t border-slate-200">
                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Attending University Medical Officer:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">{activeCertPreview.approvedByDoctor}</p>
                      <p className="text-[10px] text-slate-500 font-mono">License: {activeCertPreview.doctorLicenseNo}</p>
                      <p className="text-[9px] text-emerald-700 font-mono">DIGITALLY SIGNED & VERIFIED ✓</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="font-semibold text-slate-700">Office of the University Registrar:</p>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold">Ato Yohannes G. (Academic Registrar)</p>
                      <p className="text-[10px] text-slate-500">Excused Absence Registered in HEMIS</p>
                      <p className="text-[9px] text-emerald-700 font-mono">SEAL & CRYPTOGRAPHIC STAMP</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveCertPreview(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Certificate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: DIGITAL PHARMACY DISPENSE VOUCHER PREVIEW            */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activePrescriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-emerald-800">
                <div className="flex items-center space-x-2.5">
                  <Pill className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-base">Digital Pharmacy Dispense Voucher</h3>
                    <p className="text-[11px] text-emerald-200 font-mono">{activePrescriptionModal.rxNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePrescriptionModal(null)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Simulated Pharmacist Barcode Scan Banner */}
                <div className="p-4 bg-slate-950 text-white rounded-2xl text-center space-y-2 border border-slate-800 font-mono">
                  <div className="text-[11px] text-amber-400 font-bold uppercase tracking-widest">
                    Dispensary Barcode & Scanner Hash
                  </div>
                  <div className="text-2xl font-black tracking-widest text-slate-200 py-1">
                    ||| | |||| | ||||| || ||| ||||
                  </div>
                  <div className="text-[10px] text-slate-400">
                    HASH: MAU-RX-{activePrescriptionModal.rxNumber}-VERIFIED
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Name:</span>
                    <strong className="text-slate-900">{activePrescriptionModal.studentName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prescribing Doctor:</span>
                    <strong className="text-slate-900">{activePrescriptionModal.prescribingDoctor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date Prescribed:</span>
                    <span className="font-mono text-slate-800">{activePrescriptionModal.datePrescribed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup Counter:</span>
                    <span className="font-semibold text-emerald-700">{activePrescriptionModal.pharmacyLocation}</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {activePrescriptionModal.medications.map((m, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{m.medicationName}</span>
                        <span>{m.quantityPrescribed} {m.unit}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Dosage: {m.dosage} • {m.frequency} • {m.durationDays} Days
                      </div>
                      <div className="text-slate-600 italic text-[11px]">
                        "{m.instructions}"
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActivePrescriptionModal(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: EDIT EMERGENCY HEALTH PROFILE & DORM                 */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans border border-slate-200"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-base">Update Emergency Health Info</h3>
                    <p className="text-[11px] text-slate-400">Emergency Contacts & Dorm Location</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Current Dormitory Location *</label>
                  <input
                    type="text"
                    required
                    value={editDorm}
                    onChange={(e) => setEditDorm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    placeholder="e.g. Block 06, Room 304 (Tulu Awulia)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Known Allergies (Comma separated)</label>
                  <input
                    type="text"
                    value={editAllergies}
                    onChange={(e) => setEditAllergies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    placeholder="e.g. Penicillin, Pollen, Peanuts..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Chronic Conditions (Comma separated)</label>
                  <input
                    type="text"
                    value={editConditions}
                    onChange={(e) => setEditConditions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    placeholder="e.g. Mild Asthma, Migraine, None reported..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Next of Kin Name *</label>
                    <input
                      type="text"
                      required
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Contact Telephone *</label>
                    <input
                      type="text"
                      required
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
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
