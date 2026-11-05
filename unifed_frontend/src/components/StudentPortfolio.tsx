import { useMemo } from "react";
import { motion } from "motion/react";
import {
  X,
  GraduationCap,
  Mail,
  Phone,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Download,
  FileText,
  User,
  BookOpen,
  Wallet,
  ShieldCheck,
  Clock,
} from "lucide-react";
import type { User as UserType, Grade } from "../types";

type Props = {
  student: UserType;
  allGrades: Grade[];
  onClose: () => void;
  onEdit: (student: UserType) => void;
};

export function StudentPortfolio({ student, allGrades, onClose, onEdit }: Props) {
  // ── Filter grades for this student ──
  const studentGrades = useMemo(() => {
    // Match by studentName (safer since some grades might not have student ID)
    const targetName = (student.fullName || "").toLowerCase().trim();
    const targetId = String(student.id).replace(/^U_/, "");

    return allGrades.filter((g) => {
      // Try matching by name (case-insensitive)
      const gradeName = (g.studentName || "").toLowerCase().trim();
      if (targetName && gradeName === targetName) return true;
      // Or by studentId if Grade has it
      const gradeStudentId = (g as any).studentId || (g as any).student_id;
      if (gradeStudentId && String(gradeStudentId).replace(/^U_/, "") === targetId) return true;
      return false;
    });
  }, [student, allGrades]);

  // ── Compute derived stats ──
  const stats = useMemo(() => {
    const totalCourses = studentGrades.length;
    const approved = studentGrades.filter((g) => g.status === "APPROVED").length;
    const pending = studentGrades.filter((g) => g.status === "SUBMITTED").length;
    const totalCredits = totalCourses * 3; // assume 3 credits per course
    const hasCgpa = (student.cgpa ?? 0) > 0;
    const hasGpa = (student.gpa ?? 0) > 0;
    return { totalCourses, approved, pending, totalCredits, hasCgpa, hasGpa };
  }, [studentGrades, student]);

  // ── Fetch audit trail for this student ──
  // (Optional — only if CampusDatabase has a method for it. We'll guard it.)
  const auditTrail: any[] = []; // placeholder — see Step 5

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl mx-auto my-8 bg-[#FDFCF8] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ============ HEADER ============ */}
        <div className="relative bg-[#071526] text-white px-6 sm:px-8 py-6">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#c59b27]/10 blur-3xl pointer-events-none"
          />

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/20 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-display text-3xl shrink-0">
                  {student.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c59b27]/90 font-semibold">
                  Student Portfolio
                </p>
                <h2 className="font-display text-2xl sm:text-3xl leading-tight truncate mt-1">
                  {student.fullName || "Unnamed Student"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-slate-400">
                  <span>{student.studentId || "No ID"}</span>
                  {student.program && (
                    <>
                      <span>·</span>
                      <span>{student.program}</span>
                    </>
                  )}
                  {(student.academicYear || student.semester) && (
                    <>
                      <span>·</span>
                      <span>
                        Yr {student.academicYear || "?"} · Sem {student.semester || "?"}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                  {student.email && (
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Mail className="w-3 h-3" /> {student.email}
                    </span>
                  )}
                  {student.phoneNumber && (
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3" /> {student.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start">
              <button
                onClick={() => onEdit(student)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Close portfolio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ============ BODY ============ */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* KPI STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile
              label="CGPA"
              value={stats.hasCgpa ? student.cgpa!.toFixed(2) : "—"}
              icon={Award}
              tone="gold"
            />
            <KpiTile
              label="GPA"
              value={stats.hasGpa ? student.gpa!.toFixed(2) : "—"}
              icon={TrendingUp}
              tone="info"
            />
            <KpiTile
              label="Courses"
              value={String(stats.totalCourses)}
              icon={BookOpen}
              tone="success"
            />
            <KpiTile
              label="Fees Owed"
              value={
                (student.outstandingFees ?? 0) > 0
                  ? `${student.outstandingFees?.toLocaleString()} ETB`
                  : "Cleared"
              }
              icon={Wallet}
              tone={(student.outstandingFees ?? 0) > 0 ? "danger" : "success"}
            />
          </div>

          {/* GRADES TABLE */}
          <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Academic Records
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {studentGrades.length} course{studentGrades.length !== 1 ? "s" : ""}
              </span>
            </div>

            {studentGrades.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-900 font-medium">No grades recorded yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Grades submitted by instructors will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FAFAF9] border-b border-slate-200">
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        Course
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        CA
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        Final
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        Total
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        Grade
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentGrades.map((g) => {
                      const isApproved = g.status === "APPROVED";
                      const isPending = g.status === "SUBMITTED";
                      return (
                        <tr key={g.id} className="hover:bg-[#FAFAF9] transition-colors">
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">
                            {g.courseCode || "—"}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">
                            {g.continuousAssessmentScore ?? "—"}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">
                            {g.finalExamScore ?? "—"}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {g.totalGrade != null ? `${g.totalGrade}%` : "—"}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-900">
                            {g.letterGrade || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isApproved
                                    ? "bg-emerald-500"
                                    : isPending
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600">
                                {g.status || "—"}
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KpiTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "gold" | "info" | "success" | "danger";
}) {
  const toneMap = {
    gold: "text-[#a8811f] bg-[#c59b27]/10",
    info: "text-blue-600 bg-blue-50",
    success: "text-emerald-600 bg-emerald-50",
    danger: "text-red-600 bg-red-50",
  };
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="font-display text-xl text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}