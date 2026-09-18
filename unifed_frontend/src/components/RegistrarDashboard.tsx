import { useState, useEffect } from "react";
import type { User, Grade, SystemSettings } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import {
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  Radio,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function RegistrarDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"records" | "grades" | "calendar" | "clearance" | "alerts">("records");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, gradesData, settingsData] = await Promise.all([
        CampusDatabase.getUsers(),
        CampusDatabase.getGrades(),
        CampusDatabase.getSettings(),
      ]);

      setStudents(Array.isArray(usersData) ? usersData.filter((u) => u.role === "STUDENT") : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setSettings(settingsData || null);
    } catch (error) {
      console.error("Failed to load registrar data:", error);
      setStudents([]);
      setGrades([]);
      setSettings(null);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
      const allUsers = await CampusDatabase.getUsers();
      const updatedUsers = allUsers.map((u) => {
        if (u.id === editingStudent.id) return editingStudent;
        return u;
      });
      await CampusDatabase.saveUsers(updatedUsers);
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Update Student Record",
        "User",
        editingStudent.id,
        `Updated record details for student: ${editingStudent.fullName}`
      );
      alert("Student record updated successfully!");
      setEditingStudent(null);
      await loadData();
    } catch (error) {
      console.error("Failed to update student:", error);
      alert("Failed to update student record. Please try again.");
    }
  };

  const handleApproveGrade = async (gradeId: string) => {
    try {
      const updatedGrades = grades.map((g) => {
        if (g.id === gradeId) {
          return { ...g, status: "APPROVED" as const };
        }
        return g;
      });
      await CampusDatabase.saveGrades(updatedGrades);
      setGrades(updatedGrades);
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Approve Semester Grade",
        "Grade",
        gradeId,
        "Officially approved student score to be stamped on transcripts."
      );
      alert("Grade verified and approved for transcript posting.");
      await loadData();
    } catch (error) {
      console.error("Failed to approve grade:", error);
      alert("Failed to approve grade. Please try again.");
    }
  };

  const handleRejectGrade = async (gradeId: string) => {
    try {
      const updatedGrades = grades.map((g) => {
        if (g.id === gradeId) {
          return { ...g, status: "RETURNED" as const };
        }
        return g;
      });
      await CampusDatabase.saveGrades(updatedGrades);
      setGrades(updatedGrades);
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "REGISTRAR",
        "Reject Semester Grade",
        "Grade",
        gradeId,
        "Returned grades to subject instructor for revision."
      );
      alert("Grades returned to instructor for revision.");
      await loadData();
    } catch (error) {
      console.error("Failed to reject grade:", error);
      alert("Failed to reject grade. Please try again.");
    }
  };

  const filteredStudents = Array.isArray(students) ? students.filter(
    (st) =>
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.studentId && st.studentId.includes(searchQuery))
  ) : [];

  const navItems = [
    { id: "records", label: "Student Records", shortLabel: "Records", Icon: Users },
    { id: "grades", label: "Verify Instructor Grades", shortLabel: "Grades", Icon: FileText },
    { id: "calendar", label: "Academic Calendar", shortLabel: "Calendar", Icon: Calendar },
    { id: "clearance", label: "Digital Clearance Certification", shortLabel: "Clearance", Icon: ShieldCheck },
    { id: "alerts", label: "Broadcast Circulars", shortLabel: "Alerts", Icon: Radio },
  ] as const;

  const goToTab = (id: string) => {
    setActiveTab(id as any);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="registrar_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Office of the University Registrar"
        portalSubtitle="Directorate of Academic Records, Enrollment & Grade Certification"
        badgeText="REGISTRAR GENERAL"
        badgeType="admin"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE SLIDE-OUT DRAWER */}
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
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">REGISTRAR GENERAL</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 flex-1 overflow-y-auto space-y-1">
                <div className="pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Registrar Management
                  </span>
                </div>

                {navItems.slice(0, 3).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      activeTab === id
                        ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{label}</span>
                  </button>
                ))}

                <div className="pt-2 pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Institutional Portals
                  </span>
                </div>

                {navItems.slice(3).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      activeTab === id
                        ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${id === "alerts" ? "text-red-400" : "text-amber-400"}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <p>Registrar Code: <span className="text-amber-400">REG-DIR-01</span></p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">Verification: Cryptographic</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE HORIZONTAL QUICK-NAV */}
      <div className="md:hidden sticky top-[48px] sm:top-[57px] z-30 bg-[#071526] border-b border-slate-800/90 px-2 py-1.5 overflow-x-auto flex items-center space-x-1.5 shadow-md shrink-0 scrollbar-none">
        {navItems.map(({ id, shortLabel, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 active:scale-95 ${
              activeTab === id
                ? "bg-primary text-white border border-amber-400/40 shadow-xs"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeTab === id ? "text-amber-300" : "text-amber-400/80"}`} />
            <span>{shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              Registrar Management
            </span>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("records")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "records"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Student Records</span>
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "grades"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Verify Instructor Grades</span>
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "calendar"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Academic Calendar</span>
            </button>

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Institutional Portals
              </span>
            </div>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "clearance"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Digital Clearance Certification</span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "alerts"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>Broadcast Circulars</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Registrar Code: <span className="text-amber-400">REG-DIR-01</span></p>
            <p>Verification: Cryptographic</p>
          </div>
        </aside>

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto min-w-0">
          {activeTab === "records" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">Academic Records Management</h3>
                <div className="relative w-full sm:w-72 text-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm min-w-[820px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student ID</th>
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Program</th>
                        <th className="p-4">Semester</th>
                        <th className="p-4">CGPA</th>
                        <th className="p-4">Outstanding Fees</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.map((st) => (
                        <tr key={st.id}>
                          <td className="p-4 font-mono font-bold">{st.studentId}</td>
                          <td className="p-4 font-semibold">{st.fullName}</td>
                          <td className="p-4">{st.program}</td>
                          <td className="p-4 font-mono">Yr {st.academicYear} Sem {st.semester}</td>
                          <td className="p-4 font-mono">{st.cgpa?.toFixed(2)}</td>
                          <td className="p-4 font-mono">
                            <span className={st.outstandingFees && st.outstandingFees > 0 ? "text-danger font-bold" : "text-emerald-700"}>
                              {st.outstandingFees} ETB
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setEditingStudent(st)}
                              className="text-primary hover:underline text-xs font-semibold"
                            >
                              Edit Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                    <h4 className="font-display font-bold text-slate-800 text-base border-b pb-3">Edit Academic Profile</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium">Student Full Name</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-semibold"
                          value={editingStudent.fullName}
                          onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium">CGPA</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-mono"
                            value={editingStudent.cgpa || 0}
                            onChange={(e) => setEditingStudent({ ...editingStudent, cgpa: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium">Outstanding Fees</label>
                          <input
                            type="number"
                            className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-mono"
                            value={editingStudent.outstandingFees || 0}
                            onChange={(e) => setEditingStudent({ ...editingStudent, outstandingFees: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button onClick={() => setEditingStudent(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-semibold">Cancel</button>
                      <button onClick={handleUpdateStudent} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-semibold">Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "grades" && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">Verify Instructor Submissions</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm min-w-[880px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">Continuous (50)</th>
                        <th className="p-4">Final (30)</th>
                        <th className="p-4">Total Marks</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {grades.map((g) => (
                        <tr key={g.id}>
                          <td className="p-4 font-semibold">{g.studentName}</td>
                          <td className="p-4">{g.courseCode}</td>
                          <td className="p-4 font-mono">{g.continuousAssessmentScore}</td>
                          <td className="p-4 font-mono">{g.finalExamScore}</td>
                          <td className="p-4 font-mono font-bold">{g.totalGrade}%</td>
                          <td className="p-4 font-bold">{g.letterGrade}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              g.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : g.status === "SUBMITTED"
                                ? "bg-blue-50 text-primary"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            {g.status === "SUBMITTED" ? (
                              <>
                                <button onClick={() => handleApproveGrade(g.id)} className="bg-success text-white px-2.5 py-1 rounded text-xs font-semibold">
                                  Approve
                                </button>
                                <button onClick={() => handleRejectGrade(g.id)} className="bg-danger text-white px-2.5 py-1 rounded text-xs font-semibold">
                                  Return
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Locked</span>
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

          {activeTab === "calendar" && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">Academic Semester Calendar</h3>
              {settings && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm max-w-xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <span className="block text-slate-400">SEMESTER START</span>
                      <strong className="block text-sm mt-1">{settings.semesterDates.start}</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <span className="block text-slate-400">SEMESTER END</span>
                      <strong className="block text-sm mt-1">{settings.semesterDates.end}</strong>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <label className="block text-xs font-medium text-slate-600">Course Registration Add/Drop Deadline</label>
                    <input
                      type="date"
                      className="border border-slate-200 rounded-lg p-2.5 mt-1 text-xs font-mono w-full"
                      value={settings.registrationDeadline}
                      onChange={async (e) => {
                        const s = { ...settings, registrationDeadline: e.target.value };
                        await CampusDatabase.saveSettings(s);
                        setSettings(s);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => alert("Academic parameters successfully saved and synchronized across university portals.")}
                    className="university-gradient hover:opacity-95 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md border border-amber-400/20 w-full sm:w-auto"
                  >
                    Publish Calendar Updates
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "clearance" && (
            <div className="space-y-6">
              <SmartClearancePortal user={user} isOfficerMode={true} />
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-6">
              <SmartCampusAlerts user={user} />
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}
