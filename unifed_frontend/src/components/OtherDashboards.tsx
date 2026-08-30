import { useState, useEffect } from "react";
import type { User, Course, Grade, Transcript, AuditLog, SystemSettings } from "../types";
import { CampusDatabase } from "./services/api"
import { UniversityTopBar, AcademicFooter, UniversitySeal, EthiopianFlag } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusFacilities } from "./SmartCampusFacilities";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import CampusMediaBroadcast from "./CampusMediaBroadcast";
import { ShieldAlert, Calendar, FileText, CheckCircle2, AlertCircle, Shield, List, Settings, Search, Edit3, Check, X, RefreshCw, BarChart2, Plus, Users, HeartPulse, Activity, Award, TrendingUp, Sparkles, Coins, CheckSquare, Database, ShieldCheck, Radio, Cpu, Video, Tv } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ---------------------------------------------------- */
/* 1. REGISTRAR DASHBOARD                               */
/* ---------------------------------------------------- */
export function RegistrarDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"records" | "grades" | "calendar" | "clearance" | "alerts">("records");
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit record state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(CampusDatabase.getUsers().filter((u) => u.role === "STUDENT"));
    setGrades(CampusDatabase.getGrades());
    setSettings(CampusDatabase.getSettings());
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;
    const allUsers = CampusDatabase.getUsers().map((u) => {
      if (u.id === editingStudent.id) return editingStudent;
      return u;
    });
    CampusDatabase.saveUsers(allUsers);
    CampusDatabase.addAuditLog(
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
    loadData();
  };

  const handleApproveGrade = (gradeId: string) => {
    const updatedGrades = grades.map((g) => {
      if (g.id === gradeId) {
        return { ...g, status: "APPROVED" as const };
      }
      return g;
    });
    CampusDatabase.saveGrades(updatedGrades);
    setGrades(updatedGrades);
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "REGISTRAR",
      "Approve Semester Grade",
      "Grade",
      gradeId,
      "Officially approved student score to be stamped on transcripts."
    );
    alert("Grade verified and approved for transcript posting.");
    loadData();
  };

  const handleRejectGrade = (gradeId: string) => {
    const updatedGrades = grades.map((g) => {
      if (g.id === gradeId) {
        return { ...g, status: "RETURNED" as const };
      }
      return g;
    });
    CampusDatabase.saveGrades(updatedGrades);
    setGrades(updatedGrades);
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "REGISTRAR",
      "Reject Semester Grade",
      "Grade",
      gradeId,
      "Returned grades to subject instructor for revision."
    );
    alert("Grades returned to instructor for revision.");
    loadData();
  };

  const filteredStudents = students.filter(
    (st) =>
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.studentId && st.studentId.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="registrar_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Office of the University Registrar"
        portalSubtitle="Directorate of Academic Records, Enrollment & Grade Certification"
        badgeText="REGISTRAR GENERAL"
        badgeType="admin"
      />

      <div className="flex-1 flex">
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
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

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "records" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-slate-900">Academic Records Management</h3>
                <div className="relative w-72 text-xs">
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
                <table className="w-full text-left text-xs md:text-sm">
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

              {editingStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
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
                      <div className="grid grid-cols-2 gap-3">
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
              <h3 className="text-xl font-display font-bold text-slate-900">Verify Instructor Submissions</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
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
                        <td className="p-4 text-right space-x-2">
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
          )}

          {activeTab === "calendar" && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">Academic Semester Calendar</h3>
              {settings && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
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
                      onChange={(e) => {
                        const s = { ...settings, registrationDeadline: e.target.value };
                        CampusDatabase.saveSettings(s);
                        setSettings(s);
                      }}
                    />
                  </div>
                  <button onClick={() => alert("Academic parameters successfully saved and synchronized across university portals.")} className="university-gradient hover:opacity-95 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md border border-amber-400/20">
                    Publish Calendar Updates
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: DIGITAL CLEARANCE CERTIFICATION */}
          {activeTab === "clearance" && (
            <div className="space-y-6">
              <SmartClearancePortal user={user} isOfficerMode={true} />
            </div>
          )}

          {/* TAB: CAMPUS BROADCAST CIRCULARS */}
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

/* ---------------------------------------------------- */
/* 2. DEPARTMENT HEAD DASHBOARD                         */
/* ---------------------------------------------------- */
export function DepartmentHeadDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    setCourses(CampusDatabase.getCourses());
    setGrades(CampusDatabase.getGrades());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dept_head_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Department Chair & Academic Curriculum Council"
        portalSubtitle="College of Informatics • Department of Software Engineering"
        badgeText="DEPARTMENT HEAD"
        badgeType="faculty"
      />

      <main className="flex-1 p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Department Performance & Faculty Load</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Review course catalogs, assign faculty workloads, and monitor aggregate student progress.</p>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs">
              TERM II • AY 2025/2026
            </span>
          </div>
        </div>

        {/* CSS Metrics visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs border-t-4 border-t-primary">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">Active Faculty Members</h4>
            <span className="block text-3xl font-serif font-bold text-slate-900 mt-2">15 Instructors</span>
            <p className="text-xs text-slate-500 mt-1">Average load: 3.2 courses per semester</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs border-t-4 border-t-emerald-600">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">Department Pass Rate</h4>
            <span className="block text-3xl font-serif font-bold text-emerald-700 mt-2">91.4% Passed</span>
            <p className="text-xs text-slate-500 mt-1">Calculated from verified registrar grade registry</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs border-t-4 border-t-amber-500">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">At-Risk Dropout Rate</h4>
            <span className="block text-3xl font-serif font-bold text-amber-700 mt-2">8.6% Flagged</span>
            <p className="text-xs text-slate-500 mt-1">Predicted via AI Academic Early-Warning Engine</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-slate-900 text-base">Course Offerings & Assigned Instructors</h3>
          <div className="divide-y divide-slate-100">
            {courses.map((c) => (
              <div key={c.id} className="py-4 first:pt-0 flex justify-between items-center text-xs sm:text-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg mr-2">
                    {c.courseCode}
                  </span>
                  <strong className="text-slate-900">{c.courseTitle}</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned Lecturer: <span className="font-medium text-slate-700">{c.instructorName}</span> • ({c.creditHours} Credit Hrs)</p>
                </div>
                <button
                  onClick={() => alert(`Simulating advisor reassignment context for: ${c.courseCode}`)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition border border-slate-200/60"
                >
                  Reassign Faculty
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}

/* ---------------------------------------------------- */
/* 3. COLLEGE DEAN DASHBOARD                            */
/* ---------------------------------------------------- */
export function DeanDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dean_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="College Dean & Academic Senate Executive"
        portalSubtitle="College of Informatics & Mathematical Sciences • University Senate"
        badgeText="COLLEGE DEAN"
        badgeType="admin"
      />

      <main className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">College Academic Standing & Pass Thresholds</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Comprehensive college metrics, retention indices, and departmental accreditation logs.</p>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-primary-900 border border-blue-200">
            COLLEGE DEAN CONSOLE
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="font-serif font-bold text-slate-900 text-base">Departmental Progression & Student Pass Statistics</h3>
          <div className="space-y-5 text-xs sm:text-sm">
            {[
              { dept: "Department of Software Engineering", pass: 92, count: 180, color: "bg-primary" },
              { dept: "Department of Computer Science", pass: 88, count: 240, color: "bg-emerald-600" },
              { dept: "Department of Information Technology", pass: 85, count: 195, color: "bg-amber-600" }
            ].map((d, idx) => (
              <div key={idx} className="space-y-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200/50">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-900 font-semibold">{d.dept}</span>
                  <span className="text-slate-600 font-mono text-xs">{d.pass}% Pass Rate ({d.count} Enrolled)</span>
                </div>
                <div className="w-full bg-slate-200/70 h-3 rounded-full overflow-hidden">
                  <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${d.pass}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => alert("Simulating download of the Official College Annual Report (Signed PDF)...")}
            className="university-gradient hover:opacity-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md border border-amber-400/20 flex items-center space-x-2 transition"
          >
            <span>Download Official College Annual Report (PDF)</span>
          </button>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}

/* ---------------------------------------------------- */
/* 4. SYSTEM ADMINISTRATOR DASHBOARD                    */
/* ---------------------------------------------------- */
export function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"users" | "audit" | "health" | "facilities" | "alerts" | "clearance" | "media">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<any>("STUDENT");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(CampusDatabase.getUsers());
    setAuditLogs(CampusDatabase.getAuditLogs());
  };

  const handleAddUser = () => {
    if (!newUserFullName || !newUserEmail) {
      alert("Please fill in all user profile details.");
      return;
    }

    const newUserObj: User = {
      id: "U_NEW_" + Date.now(),
      username: newUserEmail.split("@")[0],
      fullName: newUserFullName,
      email: newUserEmail,
      role: newUserRole,
      isActive: true,
      studentId: newUserRole === "STUDENT" ? "MAU140" + Math.floor(Math.random() * 9000 + 1000) : undefined,
      instructorId: newUserRole === "INSTRUCTOR" ? "INST" + Math.floor(Math.random() * 900 + 100) : undefined,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };

    const updatedUsers = [...users, newUserObj];
    CampusDatabase.saveUsers(updatedUsers);
    setUsers(updatedUsers);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "ADMIN",
      "Create User Account",
      "User",
      newUserObj.id,
      `Provisioned new user account: ${newUserFullName} with role ${newUserRole}`
    );

    alert(`Successfully created user: ${newUserFullName}`);
    setNewUserFullName("");
    setNewUserEmail("");
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    CampusDatabase.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    alert("User status updated successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="admin_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Central ICT & System Administration Directorate"
        portalSubtitle="Infrastructure Security, RBAC Provisioning & Server Telemetry"
        badgeText="SYSTEMS ADMIN"
        badgeType="admin"
      />

      <div className="flex-1 flex">
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              ICT Administration
            </span>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "users"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>User Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "audit"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <List className="w-4 h-4 text-amber-400" />
              <span>Audit Trail Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "health"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Telemetry & Health</span>
            </button>

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Operations
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
              <span>Clearance Overseer</span>
            </button>

            <button
              onClick={() => setActiveTab("facilities")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "facilities"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Campus Facilities</span>
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
              <span>Broadcast Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "media"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>Video & Media Screen</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Admin Root: <span className="text-amber-400">ICT-MAU-01</span></p>
            <p>SSL Mode: TLS 1.3 Strict</p>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Provision Form */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                  <h3 className="font-display font-bold text-slate-800 text-base">Provision New Account</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium">User Full Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-semibold"
                        placeholder="e.g. Martha Kebede"
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium">University Email Address</label>
                      <input
                        type="email"
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-mono"
                        placeholder="martha@mau.edu.et"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium">Assigned System Role</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 bg-white font-medium"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="INSTRUCTOR">Instructor Faculty</option>
                        <option value="REGISTRAR">Registrar Staff</option>
                        <option value="DEPARTMENT_HEAD">Department Head</option>
                        <option value="DEAN">College Dean</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </div>
                    <button onClick={handleAddUser} className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold transition mt-2">
                      Create User Account
                    </button>
                  </div>
                </div>

                {/* Directory list */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-base">Active Directory</h3>
                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2 space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="py-2.5 first:pt-0 flex justify-between items-center text-xs md:text-sm">
                        <div>
                          <strong className="text-slate-800 text-sm">{u.fullName}</strong>
                          <p className="text-xs text-slate-500 font-mono">{u.email} • Role: {u.role}</p>
                        </div>
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            u.isActive ? "bg-emerald-50 text-success hover:bg-emerald-100" : "bg-red-50 text-danger hover:bg-red-100"
                          }`}
                        >
                          {u.isActive ? "Active" : "Disabled"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">Infrastructure Audit Trail</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 font-semibold text-slate-800">{log.userName}</td>
                        <td className="p-4">{log.userRole}</td>
                        <td className="p-4 text-primary font-bold">{log.action}</td>
                        <td className="p-4 text-slate-500">{log.ipAddress}</td>
                        <td className="p-4 text-slate-600 font-sans">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">Virtual Infrastructure Telemetry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Node Processor Load</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">14.2%</strong>
                    <span className="text-xs text-success font-mono font-bold">● Nominal</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Memory Pool Allocation</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">3.4 GB / 8 GB</strong>
                    <span className="text-xs text-success font-mono font-bold">● Healthy</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">API Ingress Frequency</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">22 req/m</strong>
                    <span className="text-xs text-success font-mono font-bold">● Nominal</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Service Ingress Routing</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">Nginx port 3000</strong>
                    <span className="text-xs text-success font-mono font-bold">● Bound</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DIGITAL CLEARANCE OVERSEER */}
          {activeTab === "clearance" && (
            <div className="space-y-6">
              <SmartClearancePortal user={user} isOfficerMode={true} />
            </div>
          )}

          {/* TAB: CAMPUS FACILITIES */}
          {activeTab === "facilities" && (
            <div className="space-y-6">
              <SmartCampusFacilities user={user} />
            </div>
          )}

          {/* TAB: BROADCAST ALERTS */}
          {activeTab === "alerts" && (
            <div className="space-y-6">
              <SmartCampusAlerts user={user} />
            </div>
          )}

          {/* TAB: CAMPUS VIDEO & MEDIA SCREEN BROADCAST */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <CampusMediaBroadcast />
              </div>
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}

/* ---------------------------------------------------- */
/* 5. GOVERNMENT / MoE AUDITOR DASHBOARD               */
/* ---------------------------------------------------- */
export function AuditorDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"hemis" | "exit-exams" | "grading-audit" | "grants" | "reports">("hemis");
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("2026-06-28T10:15:22Z");

  // States for Fayda & Exit Exam interactive tools
  const [faydaStatus, setFaydaStatus] = useState<{ [id: string]: "VERIFIED" | "PENDING" | "FLAGGED" }>({
    "U_ST01": "VERIFIED",
    "U_ST02": "VERIFIED",
    "U_ST03": "PENDING"
  });

  const [exitExamStatus, setExitExamStatus] = useState<{ [id: string]: "PENDING" | "APPROVED" | "FLAGGED" }>({
    "U_ST01": "PENDING",
    "U_ST02": "APPROVED",
    "U_ST03": "PENDING"
  });

  const [releasingGrant, setReleasingGrant] = useState(false);
  const [grantHash, setGrantHash] = useState<string>("");
  const [grantReleased, setGrantReleased] = useState(false);
  const [reportSemester, setReportSemester] = useState("2026_Semester_II");
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(CampusDatabase.getUsers().filter(u => u.role === "STUDENT"));
    setGrades(CampusDatabase.getGrades());
    setAuditLogs(CampusDatabase.getAuditLogs().slice(0, 30));
  };

  const triggerHEMISSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "GOVERNMENT_AUDITOR",
        "HEMIS Master Sync",
        "System",
        "CentralHEMIS",
        "Triggered fully encrypted full-ledger synchronization with Ministry of Education HEMIS servers (SSLv3 SHA-512)."
      );
      showToast("HEMIS master database synchronization completed successfully!");
      loadData();
    }, 1800);
  };

  const verifyFaydaID = (studentId: string, name: string) => {
    setFaydaStatus(prev => ({
      ...prev,
      [studentId]: "VERIFIED"
    }));
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "GOVERNMENT_AUDITOR",
      "Verify National Fayda ID",
      "User",
      studentId,
      `Verified national biometric ID 'Fayda' registration status for ${name}.`
    );
    showToast(`National Fayda ID verified for ${name}!`);
  };

  const approveExitExamTicket = (studentId: string, name: string) => {
    setExitExamStatus(prev => ({
      ...prev,
      [studentId]: "APPROVED"
    }));
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "GOVERNMENT_AUDITOR",
      "Issue Exit Exam Hall Ticket",
      "User",
      studentId,
      `Officially issued MoE National Exit Examination Hall Ticket for graduating senior: ${name}.`
    );
    showToast(`National Exit Exam Ticket issued for ${name}!`);
  };

  const flagExitExamTicket = (studentId: string, name: string) => {
    setExitExamStatus(prev => ({
      ...prev,
      [studentId]: "FLAGGED"
    }));
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "GOVERNMENT_AUDITOR",
      "Flag Exit Exam Eligibility",
      "User",
      studentId,
      `Flagged graduating senior: ${name} from exit exam due to outstanding institutional reviews.`
    );
    showToast(`Flagged exit exam ticket for ${name}.`);
  };

  const handleReleaseGrant = () => {
    setReleasingGrant(true);
    setTimeout(() => {
      setReleasingGrant(false);
      setGrantReleased(true);
      const mockHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join("");
      setGrantHash(mockHash);
      CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "GOVERNMENT_AUDITOR",
        "Release Capital Operational Grant",
        "Finance",
        "GRANT_2026_Q2",
        `Authorized Federal Ministry capital operational grant of 25,000,000 ETB for campus laboratory scaling. Hash: ${mockHash}`
      );
      showToast("MoE Semester Grant of 25,000,000 ETB released successfully!");
    }, 1500);
  };

  const showToast = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => {
      setActiveNotification(null);
    }, 4000);
  };

  // Basic stats for Quality Audit
  const totalStudentsCount = students.length;
  const averageGpa = students.length > 0 ? (students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / students.length).toFixed(2) : "0.00";

  // Grade Distribution count
  const letterGradeCounts = grades.reduce((acc, g) => {
    acc[g.letterGrade] = (acc[g.letterGrade] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Interactive notification toaster */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500/30 px-6 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs md:text-sm font-semibold max-w-lg"
          >
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 font-bold">Federal Monitor:</span>
            <span>{activeNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Government Header */}
      <header className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-500/20 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-500/15 border border-emerald-400/30 p-1.5 rounded-xl flex items-center justify-center shadow-inner">
            <EthiopianFlag className="w-10 h-6.5 rounded-sm shadow-md" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold tracking-widest border border-emerald-500/10">
                FDRE Government Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">• Active Clearance</span>
            </div>
            <h1 className="text-lg md:text-xl font-display font-extrabold text-slate-100 tracking-tight leading-tight">
              Higher Education Management Information System (HEMIS)
            </h1>
            <p className="text-xs text-emerald-400/80 font-medium">
              Ministry of Education • National Quality Assurance & Audit Directorate
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="block text-sm font-semibold text-slate-100">{user.fullName}</span>
            <span className="block text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wider">
              Senior Federal Inspector
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-200 hover:text-red-300 rounded-lg text-xs font-bold transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80">
          {/* Quick Stats Summary Card */}
          <div className="p-5 border-b border-slate-800/50 bg-slate-950/20">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
              Audited Institution
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-8 bg-emerald-500 rounded" />
              <div>
                <h4 className="font-display font-extrabold text-slate-200 text-sm">Mekdela Amba University</h4>
                <p className="text-xs text-slate-500 font-mono">ID: MAU-GOV-90112</p>
              </div>
            </div>
          </div>

          <nav className="p-4 flex-1 space-y-1.5">
            <button
              onClick={() => setActiveTab("hemis")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "hemis"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>HEMIS Integration Portal</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab("exit-exams")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "exit-exams"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Exit Exam Compliance</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                National
              </span>
            </button>

            <button
              onClick={() => setActiveTab("grading-audit")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "grading-audit"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Academic Grade Audit</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("grants")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "grants"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Federal Operational Grants</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-150 ${
                activeTab === "reports"
                  ? "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border border-emerald-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Executive Quality Report</span>
              </div>
            </button>
          </nav>

          {/* Secure Audit Badge */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/30 space-y-2 mt-auto">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-bold font-mono">COMPLIANCE ASSURED</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              All inspections logged instantly in the national ledger for transparency under Higher Education Proclamation No. 1152/2019.
            </p>
          </div>
        </aside>

        {/* Right Side Auditing Canvas */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: HEMIS MASTER INTEGRATION */}
          {activeTab === "hemis" && (
            <div className="space-y-6">
              {/* Intro Title Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                    National HEMIS Interface & Sync Core
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">
                    Manage secure administrative bridges, audit biometric National Fayda records, and trace data health indicators.
                  </p>
                </div>
                <button
                  onClick={triggerHEMISSync}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2.5 shadow-md shadow-emerald-600/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing Entire Ledger..." : "Trigger Master HEMIS Sync"}</span>
                </button>
              </div>

              {/* Server Connection Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      HEMIS Bridge Status
                    </span>
                    <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">CONNECTED</strong>
                    <span className="text-xs text-emerald-600 font-bold font-mono">SSL Secure</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p>Endpoint: <span className="font-mono">https://hemis.moe.gov.et/api/v4</span></p>
                    <p>Last Audited Handshake: <span className="font-mono">{new Date(lastSyncTime).toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      Biometric Fayda Alignment
                    </span>
                    <span className="text-xs text-slate-500 font-semibold font-mono">MAU Directory</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">
                      {Object.values(faydaStatus).filter(s => s === "VERIFIED").length} / {students.length}
                    </strong>
                    <span className="text-xs bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-500/10">
                      {Object.values(faydaStatus).filter(s => s === "PENDING").length} Pending
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Ensuring all engineering cohorts align with the National Registry database.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      Data Portability Health
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">100% Valid</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <strong className="text-2xl font-display font-black text-slate-800">99.8%</strong>
                    <span className="text-[10px] text-slate-400 font-mono">0 Sync Dropped</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Institutional ledger matches Ministry standardization rules perfectly.
                  </p>
                </div>
              </div>

              {/* Fayda ID Auditing Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-base">
                    Federal Biometric Fayda ID Audit
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Align student records with biometric ID tokens to prevent duplicate identity registry or credential forging.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student ID</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">College Program</th>
                        <th className="p-4">National Entrance Exam Score</th>
                        <th className="p-4">Biometric Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students.map((st) => {
                        const status = faydaStatus[st.id] || "PENDING";
                        // Entrance Exam mock scores
                        const mockEntranceScores: { [id: string]: number } = {
                          "U_ST01": 568,
                          "U_ST02": 591,
                          "U_ST03": 512
                        };
                        const score = mockEntranceScores[st.id] || 480;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/30 transition">
                            <td className="p-4 font-mono font-bold text-slate-900">{st.studentId}</td>
                            <td className="p-4 font-semibold text-slate-800">{st.fullName}</td>
                            <td className="p-4 text-xs font-mono">{st.program}</td>
                            <td className="p-4 font-mono font-bold text-slate-700">
                              {score} <span className="text-[10px] text-slate-400">/ 700</span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                                status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-500/10"
                                  : "bg-amber-50 text-amber-700 border-amber-500/10"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {status === "PENDING" ? (
                                <button
                                  onClick={() => verifyFaydaID(st.id, st.fullName)}
                                  className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Verify Biometric token
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono font-medium">✓ Verified Systemwide</span>
                              )}
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

          {/* TAB 2: EXIT EXAM COMPLIANCE */}
          {activeTab === "exit-exams" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 flex items-center space-x-2">
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                  <span>National Graduation Exit Examination Clearance Desk</span>
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Enforcing MoE Directive 2023 on mandatory exit testing for final year engineering modules. Graduating seniors cannot obtain transcripts until exit exam tickets are issued and verified.
                </p>
              </div>

              {/* Senior Exit Exam Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow border border-emerald-500/10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Exit Exam Enrollees
                  </span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-3xl font-display font-black">3</span>
                    <span className="text-xs text-slate-300 font-mono">Software Eng.</span>
                  </div>
                  <div className="h-1 bg-emerald-950 rounded-full mt-3 overflow-hidden">
                    <div className="w-2/3 h-full bg-emerald-400 rounded-full" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Tickets Approved
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-display font-black text-slate-800">
                      {Object.values(exitExamStatus).filter(s => s === "APPROVED").length}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">Passed MoE Clearance</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Hall entrance tickets dispatched to student profiles.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Min Attendance Target
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-display font-black text-slate-800">80%</span>
                    <span className="text-xs text-slate-400">MoE Directive UC-I-07</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Continuous attendance tracking audited.</p>
                </div>
              </div>

              {/* Student exit lists */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-base">Graduating Student Clearance Desk</h4>
                  <p className="text-slate-500 text-xs">Verify study hours, continuous grading status, outstanding fees, and dispatch examination hall tickets.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student</th>
                        <th className="p-4">CGPA Track</th>
                        <th className="p-4">Institutional Attendance</th>
                        <th className="p-4">Finances Status</th>
                        <th className="p-4">National Exit Exam Clearance</th>
                        <th className="p-4 text-right">Clearance Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students.map((st) => {
                        const status = exitExamStatus[st.id] || "PENDING";
                        // Attendance rate estimation
                        const attendances: { [id: string]: number } = {
                          "U_ST01": 92,
                          "U_ST02": 96,
                          "U_ST03": 74 // Under minimum 80%!
                        };
                        const att = attendances[st.id] || 85;
                        const fees = st.outstandingFees || 0;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/30 transition">
                            <td className="p-4">
                              <span className="block font-semibold text-slate-900">{st.fullName}</span>
                              <span className="block text-[10px] font-mono text-slate-400">{st.studentId}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-800">{st.cgpa?.toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-bold ${att < 80 ? "text-danger" : "text-emerald-700"}`}>
                                  {att}%
                                </span>
                                {att < 80 && (
                                  <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold border border-red-200">
                                    Low Attendance
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono font-semibold">
                              {fees > 0 ? (
                                <span className="text-red-600">{fees} ETB Overdue</span>
                              ) : (
                                <span className="text-emerald-700">✓ Fully Paid</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                                status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-500/10"
                                  : status === "FLAGGED"
                                  ? "bg-red-50 text-danger border-red-500/10"
                                  : "bg-amber-50 text-amber-700 border-amber-500/10"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => approveExitExamTicket(st.id, st.fullName)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                                  >
                                    Approve Entrance Ticket
                                  </button>
                                  <button
                                    onClick={() => flagExitExamTicket(st.id, st.fullName)}
                                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                  >
                                    Flag Student
                                  </button>
                                </>
                              ) : status === "FLAGGED" ? (
                                <button
                                  onClick={() => approveExitExamTicket(st.id, st.fullName)}
                                  className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Reinstate & Clear
                                </button>
                              ) : (
                                <div className="text-xs text-emerald-600 font-semibold font-mono flex items-center justify-end space-x-1">
                                  <Check className="w-4 h-4" />
                                  <span>Ticket Cleared</span>
                                </div>
                              )}
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

          {/* TAB 3: ACADEMIC GRADE AUDIT */}
          {activeTab === "grading-audit" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                  Academic Standardizations & Grade Curve Compliance
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Enforcing grade distribution policies under Higher Education Quality Assurance guidelines. Standard MoE policy recommends A-grade distribution should fall between 10% - 20% to prevent grade inflation.
                </p>
              </div>

              {/* Custom High-Fidelity CSS Charts showing Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">Grading Curve Distribution</h4>
                    <p className="text-slate-500 text-xs mt-0.5">MAU vs MoE National Benchmark Curve</p>
                  </div>

                  <div className="space-y-4 my-6">
                    {/* Beautiful manual CSS Bar charts for grades A, B, C, D, F */}
                    {[
                      { grade: "A Grade", count: letterGradeCounts["A"] || 0, pct: 25, benchmark: "15%" },
                      { grade: "B Grade", count: letterGradeCounts["B"] || 0, pct: 40, benchmark: "30%" },
                      { grade: "C Grade", count: letterGradeCounts["C"] || 0, pct: 25, benchmark: "40%" },
                      { grade: "D/F Grade", count: (letterGradeCounts["D"] || 0) + (letterGradeCounts["F"] || 0), pct: 10, benchmark: "15%" }
                    ].map((g, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-semibold">{g.grade} <span className="text-slate-400 font-normal">({g.count} records)</span></span>
                          <span className="font-mono text-slate-500">Benchmark: {g.benchmark}</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center relative">
                          <div
                            style={{ width: `${g.pct}%` }}
                            className="bg-emerald-600 h-full rounded-r transition-all duration-500"
                          />
                          <span className="absolute left-3 text-[10px] text-slate-950 font-bold drop-shadow-sm font-mono">
                            {g.pct}% (MAU Cohort)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs space-y-1.5 text-slate-600 leading-normal">
                    <p className="flex items-center space-x-1.5 font-semibold text-slate-800">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      <span>QA Council Conclusion:</span>
                    </p>
                    <p>MAU exhibits exceptional grade distribution adherence. The software engineering department remains aligned with the official standard deviation guidelines.</p>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="font-display font-bold text-slate-800 text-base">Grading Ledgers Verification Queue</h4>
                  <p className="text-slate-500 text-xs">Verify continuous assessments vs final exams weight distribution (50/20/30 MoE policy).</p>

                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs sticky top-0 bg-white">
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Course Code</th>
                          <th className="p-3">Continuous (50)</th>
                          <th className="p-3">Mid Exam (20)</th>
                          <th className="p-3">Final Exam (30)</th>
                          <th className="p-3">Total (100)</th>
                          <th className="p-3">Assigned Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-sans text-xs md:text-sm">
                        {grades.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/20">
                            <td className="p-3 font-semibold text-slate-800">{g.studentName}</td>
                            <td className="p-3 font-mono font-bold text-primary">{g.courseCode}</td>
                            <td className="p-3 font-mono">{g.continuousAssessmentScore}</td>
                            <td className="p-3 font-mono">{g.midExamScore}</td>
                            <td className="p-3 font-mono">{g.finalExamScore}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{g.totalGrade}%</td>
                            <td className="p-3">
                              <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-500/10">
                                {g.letterGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAPITAL OPERATIONS GRANTS */}
          {activeTab === "grants" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 flex items-center space-x-2">
                  <Coins className="w-6 h-6 text-emerald-600" />
                  <span>Federal Capacity Building & Capital Grants Allocation</span>
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Manage MoE special infrastructure development funds, distribute operational grants to Mekdela Amba University laboratories, and view central bank cryptographic ledger hashes.
                </p>
              </div>

              {/* Fund Allocations Visualizer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-base">Federal Lab Scaling Grant</h4>
                    <p className="text-slate-500 text-xs">Authorize and sign off on semester infrastructure grants for research labs.</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Fund Target:</span>
                      <strong className="text-slate-800">Advanced Systems Lab (Engineering Block C)</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Allocation Amount:</span>
                      <strong className="text-slate-900 font-mono text-base text-emerald-700 font-bold">25,000,000 ETB</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Status:</span>
                      {grantReleased ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center space-x-1 font-mono">
                          <Check className="w-4 h-4" />
                          <span>RELEASED TO CENTRAL BANK</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold text-xs font-mono">PENDING RELEASE AUTHORIZATION</span>
                      )}
                    </div>
                  </div>

                  {grantReleased && (
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-1.5 font-mono text-[10px] text-slate-500">
                      <p className="font-semibold text-slate-700">Cryptographic Central Bank Hash Token:</p>
                      <p className="text-slate-800 break-all select-all border border-slate-200 bg-white p-2 rounded leading-normal font-bold">
                        {grantHash}
                      </p>
                      <p className="text-emerald-600 text-[9px] font-bold">✓ Transaction confirmed on National Higher Education Blockchain Ledger (FDRE-Ledger-Core-V2)</p>
                    </div>
                  )}

                  {!grantReleased ? (
                    <button
                      onClick={handleReleaseGrant}
                      disabled={releasingGrant}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 disabled:opacity-75"
                    >
                      {releasingGrant ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing Transaction Ledger...</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          <span>Release & Cryptographically Sign Grant</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full bg-emerald-50 text-emerald-800 py-3 rounded-xl font-bold text-center border border-emerald-200 text-xs">
                      Grant Funds Dispatched & Ledger Finalized
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-base">Gender Inclusivity & Support Support Fund</h4>
                    <p className="text-slate-500 text-xs">Under Federal Directive 41/2012, 10% of institutional grant allocations must directly support special programs for female engineering candidates.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Cohort Support Allocation Ratio</span>
                        <strong className="text-emerald-700">12.5% Audited (Exceeds Target)</strong>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-emerald-600 rounded-full" />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs font-sans">
                      <div className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 block text-sm">Female SE Study Grants</strong>
                          <span className="text-[10px] text-slate-400">MAU Engineering Block</span>
                        </div>
                        <span className="font-mono text-slate-700 font-bold">1,250,000 ETB</span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 block text-sm">Biometric Laptop Distribution Program</strong>
                          <span className="text-[10px] text-slate-400">Special Ministry support package</span>
                        </div>
                        <span className="font-mono text-emerald-600 font-bold">Allocated & Received</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLIANCE REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900">
                  Institutional Compliance & Quality Assurance Report
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Compile verified academic, financial, and national integration metrics into an official Federal compliance dossier suitable for cabinet presentation.
                </p>
              </div>

              {/* PDF Document Simulation */}
              <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-2xl p-8 shadow-xl space-y-8 relative">
                {/* Government Coat of Arms placeholder representation */}
                <div className="text-center space-y-2 border-b border-double border-slate-300 pb-6">
                  <span className="text-3xl">🇪🇹</span>
                  <h4 className="text-base font-display font-extrabold tracking-tight text-slate-900 uppercase">
                    Federal Democratic Republic of Ethiopia
                  </h4>
                  <h5 className="text-sm font-display font-bold text-slate-700 uppercase">
                    Ministry of Education
                  </h5>
                  <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                    National Higher Education Quality & Audit Commission
                  </p>
                </div>

                {/* Report Meta Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p>REPORT SERIAL: <span className="font-bold text-slate-800">MOE-QA-2026-MAU-SE</span></p>
                    <p>AUDITOR IN CHARGE: <span className="font-bold text-slate-800">{user.fullName}</span></p>
                  </div>
                  <div className="text-right">
                    <p>DATE COMPILED: <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span></p>
                    <p>COMPLIANCE RATING: <span className="font-bold text-emerald-600">CLASS A • CERTIFIED</span></p>
                  </div>
                </div>

                {/* Core Finding Body */}
                <div className="space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed font-sans">
                  <h5 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">
                    Executive Findings & Audited Ledgers
                  </h5>

                  <p>
                    This evaluation document certifies that <strong>Mekdela Amba University (College of Engineering and Technology)</strong>, having completed systemic review on software engineering cohorts, remains fully compliant with high-level federal directives under Article 14 of Higher Education proclamation:
                  </p>

                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li>
                      <strong>Enrollment Synchronization:</strong> Core student databases are completely synchronized with the central MoE HEMIS API database with an active registry rate of 100%.
                    </li>
                    <li>
                      <strong>National ID Biometric Compliance:</strong> Student national IDs (Fayda tokens) are validated across primary rosters, ensuring absolute identity safety.
                    </li>
                    <li>
                      <strong>National Senior Graduation Exit Exams:</strong> Out of graduating software engineering seniors, {Object.values(exitExamStatus).filter(s => s === "APPROVED").length} of 3 eligible candidates have been issued examination tickets for immediate entry.
                    </li>
                    <li>
                      <strong>Standard Grading Adherence:</strong> No grade inflation has been detected. Average CGPA stands at <strong>{averageGpa}</strong>, compliant with quality standards.
                    </li>
                  </ul>
                </div>

                {/* Signatures */}
                <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                  <div className="space-y-1 text-center text-xs">
                    <div className="font-bold font-mono text-slate-800">Dr. Tolossa Seme</div>
                    <div className="text-[10px] text-slate-400 font-mono">Senior Director, Quality Assurance MoE</div>
                    <div className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold uppercase mt-1">
                      ✓ Biometric Signed
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <p>Document SHA-256 Token Checksum:</p>
                    <p className="font-bold text-slate-600 select-all font-mono text-[9px]">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>
                </div>

                {/* Print simulator overlay */}
                <div className="absolute bottom-4 right-4 print:hidden">
                  <button
                    onClick={() => {
                      window.print();
                      CampusDatabase.addAuditLog(
                        user.id,
                        user.fullName,
                        "GOVERNMENT_AUDITOR",
                        "Print Quality Dossier",
                        "Report",
                        "QA_REPORT_2026",
                        "Generated and printed official PDF compliance report dossier."
                      );
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print/Export Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}
