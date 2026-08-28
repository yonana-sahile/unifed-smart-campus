import { useState, useEffect } from "react";
import { User, Course, CourseMaterial, Announcement, Assignment, Submission, Exam, ExamAttempt, Grade } from "../types";
import { CampusDatabase } from "../services/api"; // ✅ changed from ../mockData
import { UniversityTopBar, AcademicFooter, UniversitySeal } from "./UniversityHeader";
import {
  BookOpen,
  FileText,
  PlusCircle,
  Award,
  AlertTriangle,
  Users,
  Volume2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Activity,
  BrainCircuit,
  Sparkles,
  Send,
  Trash,
  Layout,
  Check,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InstructorDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function InstructorDashboard({ user, onLogout }: InstructorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "assignments" | "exams" | "grades" | "attendance" | "analytics">("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Selected course context (defaults to SOFT401)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("C_SOFT401");

  // Material Creation State
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialType, setNewMaterialType] = useState<"PDF" | "Video" | "Document" | "Slide">("PDF");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");

  // Announcement State
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceContent, setNewAnnounceContent] = useState("");

  // Assignment State
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignDueDate, setNewAssignDueDate] = useState("2026-07-15T23:59");
  const [newAssignDesc, setNewAssignDesc] = useState("");

  // Manual Exam Creation State
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamInstructions, setNewExamInstructions] = useState("");

  // Smart Exam Generator State
  const [smartTopic, setSmartTopic] = useState("");
  const [smartQty, setSmartQty] = useState(4);
  const [smartDifficulty, setSmartDifficulty] = useState("Medium");
  const [generatingExam, setGeneratingExam] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Attendance Ledger (student ID -> status: present or absent)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: boolean }>({
    "U_ST01": true,
    "U_ST02": true,
    "U_ST03": false
  });

  // Assignment Grading state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState("");

  // Student AI Analytics & Dropout Predictor state
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string>("U_ST03"); // Default to Tarekegn Abebe who has outstanding fees and issues
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [calculatingPredictor, setCalculatingPredictor] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCourses(CampusDatabase.getCourses().filter((c) => c.instructorId === user.id));
    setMaterials(CampusDatabase.getMaterials());
    setAnnouncements(CampusDatabase.getAnnouncements());
    setAssignments(CampusDatabase.getAssignments());
    setSubmissions(CampusDatabase.getSubmissions());
    setExams(CampusDatabase.getExams());
    setGrades(CampusDatabase.getGrades());
  };

  const getActiveCourse = () => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  };

  // Add Announcement
  const handlePostAnnouncement = () => {
    if (!newAnnounceTitle || !newAnnounceContent) return;
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const newAnn: Announcement = {
      id: "AN_" + Date.now(),
      courseId: activeCourse.id,
      courseTitle: activeCourse.courseTitle,
      title: newAnnounceTitle,
      content: newAnnounceContent,
      postedBy: user.fullName,
      postedAt: new Date().toISOString()
    };

    const updatedAnn = [newAnn, ...announcements];
    CampusDatabase.saveAnnouncements(updatedAnn);
    setAnnouncements(updatedAnn);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Post Announcement",
      "Announcement",
      newAnn.id,
      `Posted bulletin in ${activeCourse.courseCode}: ${newAnnounceTitle}`
    );

    setNewAnnounceTitle("");
    setNewAnnounceContent("");
    alert("Announcement broadcasted successfully!");
  };

  // Add Materials
  const handleAddMaterial = () => {
    if (!newMaterialTitle || !newMaterialDesc) return;
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const newMat: CourseMaterial = {
      id: "MAT_" + Date.now(),
      courseId: activeCourse.id,
      title: newMaterialTitle,
      fileType: newMaterialType,
      uploadedAt: new Date().toISOString(),
      description: newMaterialDesc
    };

    const updatedMats = [newMat, ...materials];
    CampusDatabase.saveMaterials(updatedMats);
    setMaterials(updatedMats);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Upload Material",
      "CourseMaterial",
      newMat.id,
      `Uploaded course handout: ${newMaterialTitle}`
    );

    setNewMaterialTitle("");
    setNewMaterialDesc("");
    alert("Course material uploaded and published successfully!");
  };

  // Add Assignment
  const handleAddAssignment = () => {
    if (!newAssignTitle || !newAssignDesc) return;
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const newAs: Assignment = {
      id: "ASG_" + Date.now(),
      courseId: activeCourse.id,
      title: newAssignTitle,
      dueDate: new Date(newAssignDueDate).toISOString(),
      maxScore: 100,
      description: newAssignDesc
    };

    const updatedAs = [newAs, ...assignments];
    CampusDatabase.saveAssignments(updatedAs);
    setAssignments(updatedAs);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Create Assignment",
      "Assignment",
      newAs.id,
      `Created assignment outline in ${activeCourse.courseCode}: ${newAssignTitle}`
    );

    setNewAssignTitle("");
    setNewAssignDesc("");
    alert("Assignment publication complete!");
  };

  // Grade Submission
  const handleGradeSubmission = () => {
    if (!selectedSubmission) return;

    const updatedSubmissions = submissions.map((s) => {
      if (s.id === selectedSubmission.id) {
        return {
          ...s,
          score: gradingScore,
          feedback: gradingFeedback,
          status: "GRADED" as const
        };
      }
      return s;
    });

    CampusDatabase.saveSubmissions(updatedSubmissions);
    setSubmissions(updatedSubmissions);

    // Update continuous assessment score in grade object
    const currentGrades = CampusDatabase.getGrades();
    const studentGrade = currentGrades.find(
      (g) => g.studentId === selectedSubmission.studentId && g.courseId === selectedSubmission.courseId
    );

    if (studentGrade) {
      // Map score out of 100 to continuous assessment weight (max 50)
      studentGrade.continuousAssessmentScore = parseFloat(((gradingScore / 100) * 50).toFixed(1));
      studentGrade.totalGrade = studentGrade.continuousAssessmentScore + studentGrade.midExamScore + studentGrade.finalExamScore;
      CampusDatabase.saveGrades(currentGrades);
      setGrades(currentGrades);
    }

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Grade Assessment",
      "Submission",
      selectedSubmission.id,
      `Graded student submission for ${selectedSubmission.studentName}. Score: ${gradingScore}/100`
    );

    alert(`Successfully graded ${selectedSubmission.studentName}'s assignment!`);
    setSelectedSubmission(null);
    setGradingFeedback("");
    setGradingScore(0);
    loadData();
  };

  // Submit Final Grade (Verification Gate)
  const handleSubmitFinalGrade = (gradeId: string) => {
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    // UC-I-09 Check: Verify student attendance minimum before final grade submission
    const gradeObj = grades.find((g) => g.id === gradeId);
    if (!gradeObj) return;

    // Simulated attendance tracking check
    // If student is Tarekegn Abebe, his attendance is low (e.g. 70%), so warn instructor
    if (gradeObj.studentName.includes("Tarekegn") || gradeObj.studentId === "U_ST03") {
      const confirmProceed = window.confirm(
        `Attendance WARNING (UC-I-09): Student ${gradeObj.studentName} has only met 70% attendance. Current policies require 80% minimum. Do you have official clearance to proceed with grade submission?`
      );
      if (!confirmProceed) return;
    }

    const updatedGrades = grades.map((g) => {
      if (g.id === gradeId) {
        return { ...g, status: "SUBMITTED" as const };
      }
      return g;
    });

    CampusDatabase.saveGrades(updatedGrades);
    setGrades(updatedGrades);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Submit Final Grade",
      "Grade",
      gradeId,
      `Submitted final calculated grade for student ${gradeObj.studentName} to Registrar.`
    );

    alert("Final grade submitted to Registrar directory successfully!");
  };

  // ✅ UPDATED: Smart Exam Generator using Django API
  const handleGenerateSmartExam = async () => {
    if (!smartTopic) {
      alert("Please provide a topic for smart question generation.");
      return;
    }

    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    setGeneratingExam(true);
    setGeneratedQuestions([]);

    try {
      const data = await CampusDatabase.generateExamQuestions({
        courseId: activeCourse.id,
        topic: smartTopic,
        numberOfQuestions: smartQty,
        difficulty: smartDifficulty
      });

      if (data.success && data.questions) {
        setGeneratedQuestions(data.questions);
      } else {
        throw new Error(data.error || "Failed to parse API questions.");
      }
    } catch (err: any) {
      alert("Error generating questions: " + err.message);
    } finally {
      setGeneratingExam(false);
    }
  };

  // Save the generated exam
  const handleSaveGeneratedExam = () => {
    if (generatedQuestions.length === 0) return;
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const totalMarks = generatedQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);

    const newExam: Exam = {
      id: "EX_" + Date.now(),
      courseId: activeCourse.id,
      courseTitle: activeCourse.courseTitle,
      examTitle: `Smart Exam: ${smartTopic} (${smartDifficulty})`,
      examDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
      durationMinutes: 60,
      totalMarks: totalMarks,
      instructions: "This exam was dynamically modeled and audited using the server-side AI engine. All standard testing regulations apply.",
      status: "SCHEDULED",
      questions: generatedQuestions
    };

    const currentExams = CampusDatabase.getExams();
    CampusDatabase.saveExams([newExam, ...currentExams]);
    setExams([newExam, ...currentExams]);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Publish AI Exam",
      "Exam",
      newExam.id,
      `Published AI-generated exam on ${smartTopic} inside ${activeCourse.courseCode}`
    );

    alert(`AI-generated exam published successfully! Total questions: ${generatedQuestions.length}.`);
    setGeneratedQuestions([]);
    setSmartTopic("");
    setActiveTab("exams");
  };

  // ✅ UPDATED: AI Dropout Risk Predictor using Django API
  const handlePredictDropoutRisk = async () => {
    setCalculatingPredictor(true);
    setAnalyticsResult(null);

    try {
      const result = await CampusDatabase.predictStudentRisk(analyzingStudentId);
      setAnalyticsResult(result);
    } catch (err) {
      console.error(err);
      alert("Failed to predict risk. Please ensure backend is running.");
    } finally {
      setCalculatingPredictor(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="instructor_dashboard_main">
      {/* UNIVERSITY INSTITUTIONAL HEADER */}
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Faculty Academic Management Console"
        portalSubtitle="Department of Software Engineering • Academic Staff Directorate"
        badgeText={user.department ? `${user.department} FACULTY` : "FACULTY"}
        badgeType="faculty"
      />

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex" id="instructor_workspace_inner">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
          {/* Course select picker */}
          <div className="p-3.5 border-b border-slate-800/80 space-y-1.5 bg-slate-950/40">
            <label className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest font-bold">Active Course Context</label>
            <select
              className="w-full bg-[#0d2238] text-slate-100 rounded-xl p-2.5 text-xs border border-slate-700/80 font-medium focus:border-amber-400 focus:outline-none"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="C_SOFT401">SOFT401: Advanced Software Eng</option>
              <option value="C_CSCI402">CSCI402: Distributed Database</option>
              <option value="C_MATH301">MATH301: Discrete Math & Graph</option>
            </select>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Layout className="w-4 h-4 text-amber-400" />
              <span>Bulletin & Syllabus</span>
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "materials"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Course Materials</span>
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "assignments"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Grade Submissions</span>
            </button>
            <button
              onClick={() => setActiveTab("exams")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "exams"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Exam Modeler</span>
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "grades"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Submit Final Grades</span>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "attendance"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Student Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "analytics"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span>AI Student Analytics</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Faculty ID: <span className="text-amber-400">INST001</span></p>
            <p>Dept Chair: Dr. Befekadu</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">Status: Teaching Active</p>
          </div>
        </aside>

        {/* CONTENT CONTEXT VIEW */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* TAB: BULLETIN & SYLLABUS */}
            {activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-dashboard-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">
                    Syllabus Outline & Bulletin Control
                  </h2>
                  <p className="text-slate-500 text-sm">Post announcements and configure syllabi details for {getActiveCourse()?.courseTitle}.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Broadcaster form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <span>Broadcast Bulletin / Announcement</span>
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Announcement Title"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                        value={newAnnounceTitle}
                        onChange={(e) => setNewAnnounceTitle(e.target.value)}
                      />
                      <textarea
                        rows={4}
                        placeholder="Write detailed announcements and notices here..."
                        className="w-full border border-slate-200 rounded-lg p-3 text-xs"
                        value={newAnnounceContent}
                        onChange={(e) => setNewAnnounceContent(e.target.value)}
                      />
                      <button
                        onClick={handlePostAnnouncement}
                        className="bg-primary hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Broadcast Bulletin</span>
                      </button>
                    </div>
                  </div>

                  {/* Existing announcements view */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-slate-800 text-base">Active Course Announcements</h3>
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-3 pr-2">
                      {announcements
                        .filter((an) => an.courseId === selectedCourseId)
                        .map((an) => (
                          <div key={an.id} className="pt-3 first:pt-0 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(an.postedAt).toLocaleDateString()}
                            </span>
                            <h4 className="font-semibold text-slate-800 text-xs md:text-sm">{an.title}</h4>
                            <p className="text-xs text-slate-500">{an.content}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: MANAGE MATERIALS */}
            {activeTab === "materials" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-materials-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Manage Course Materials</h2>
                  <p className="text-slate-500 text-sm">Upload, categorize and publish lecture materials and slides.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upload Material form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                    <h3 className="font-display font-bold text-slate-800 text-base">Upload Handout</h3>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Material Title</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5"
                          placeholder="e.g. Chapter 3: Dynamic Activity modeling"
                          value={newMaterialTitle}
                          onChange={(e) => setNewMaterialTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Format Category</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                          value={newMaterialType}
                          onChange={(e) => setNewMaterialType(e.target.value as any)}
                        >
                          <option value="PDF">PDF Presentation</option>
                          <option value="Video">Video Lecture URL</option>
                          <option value="Document">Word/Text Document</option>
                          <option value="Slide">Syllabus Slides</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Description</label>
                        <textarea
                          rows={3}
                          className="w-full border border-slate-200 rounded-lg p-2.5"
                          placeholder="Specify chapter details or learning targets..."
                          value={newMaterialDesc}
                          onChange={(e) => setNewMaterialDesc(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={handleAddMaterial}
                        className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold transition"
                      >
                        Publish Handout
                      </button>
                    </div>
                  </div>

                  {/* Handouts list */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-slate-800 text-base">Published Course Resources</h3>
                    <div className="divide-y divide-slate-100">
                      {materials
                        .filter((m) => m.courseId === selectedCourseId)
                        .map((m) => (
                          <div key={m.id} className="py-4 first:py-0 flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{m.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1">{m.description}</p>
                              <span className="text-[10px] font-mono text-slate-400">
                                Format: {m.fileType} • Published: {new Date(m.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updated = materials.filter((x) => x.id !== m.id);
                                CampusDatabase.saveMaterials(updated);
                                setMaterials(updated);
                              }}
                              className="text-slate-400 hover:text-danger p-2 transition"
                              title="Delete Resource"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: GRADE ASSIGNMENTS */}
            {activeTab === "assignments" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-assignments-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Grade Student Submissions</h2>
                  <p className="text-slate-500 text-sm">Review uploaded files from students, evaluate continuous assessment points, and record feedback.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Submissions List */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-slate-800 text-base">Student Submissions</h3>
                    <div className="divide-y divide-slate-100">
                      {submissions
                        .filter((sub) => sub.courseId === selectedCourseId)
                        .map((sub) => (
                          <div
                            key={sub.id}
                            className={`py-4 first:py-0 flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50/50 p-2 rounded transition ${
                              selectedSubmission?.id === sub.id ? "bg-blue-50/60" : ""
                            }`}
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setGradingScore(sub.score || 0);
                              setGradingFeedback(sub.feedback || "");
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-slate-800 text-sm">{sub.studentName}</h4>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  sub.status === "GRADED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-warning"
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{sub.assignmentTitle}</p>
                              <p className="text-[10px] font-mono text-slate-400">File: {sub.fileName || "None"}</p>
                            </div>

                            <div className="text-right flex items-center space-x-2">
                              {sub.status === "GRADED" && (
                                <span className="font-mono text-sm font-bold text-slate-800">{sub.score} / 100</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Grading details panel */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                    <h3 className="font-display font-bold text-slate-800 text-base">Grading Console</h3>
                    {selectedSubmission ? (
                      <div className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                          <p className="text-[10px] uppercase text-slate-400 font-mono font-bold">Student</p>
                          <p className="font-semibold text-slate-800 text-sm">{selectedSubmission.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-medium text-slate-600">Assign Score (0 - 100)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-base font-bold text-slate-800"
                            value={gradingScore}
                            onChange={(e) => setGradingScore(parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-medium text-slate-600">Feedback Comments</label>
                          <textarea
                            rows={4}
                            className="w-full border border-slate-200 rounded-lg p-2.5"
                            placeholder="Write constructive evaluation notes here..."
                            value={gradingFeedback}
                            onChange={(e) => setGradingFeedback(e.target.value)}
                          />
                        </div>

                        <button
                          onClick={handleGradeSubmission}
                          className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold transition"
                        >
                          Submit Score & Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <AlertTriangle className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs">Select a submission from the list to begin grading.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: SMART EXAM GENERATOR */}
            {activeTab === "exams" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-exams-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span>AI Smart Exam Generator</span>
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Generate objective questions (MCQs & True/False) tailored to your syllabus using the Django backend AI engine.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Parameter builder form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                    <h3 className="font-display font-bold text-slate-800 text-base">Generation Parameters</h3>
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Topic Outline / Learning Objective</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 font-medium"
                          placeholder="e.g. Unified Modeling Language Diagrams"
                          value={smartTopic}
                          onChange={(e) => setSmartTopic(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Quantity of Questions</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                          value={smartQty}
                          onChange={(e) => setSmartQty(parseInt(e.target.value))}
                        >
                          <option value={3}>3 Questions</option>
                          <option value={4}>4 Questions</option>
                          <option value={5}>5 Questions</option>
                          <option value={8}>8 Questions</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-600">Difficulty Grade</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Easy", "Medium", "Hard"].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setSmartDifficulty(lvl)}
                              className={`py-2 rounded-lg font-semibold text-center transition ${
                                smartDifficulty === lvl
                                  ? "bg-primary text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateSmartExam}
                        disabled={generatingExam}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition disabled:bg-slate-200 disabled:text-slate-400 shadow"
                      >
                        {generatingExam ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                            <span>Modeling Exam Patterns...</span>
                          </>
                        ) : (
                          <>
                            <BrainCircuit className="w-4 h-4 text-primary" />
                            <span>Generate Questions via AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Generated Questions results output */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-display font-bold text-slate-800 text-base">Generated Questions Output</h3>
                      {generatedQuestions.length > 0 && (
                        <button
                          onClick={handleSaveGeneratedExam}
                          className="bg-success hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition"
                        >
                          Publish to Examination Portal
                        </button>
                      )}
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                      {generatedQuestions.length > 0 ? (
                        generatedQuestions.map((q, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-slate-800 text-sm">
                                Question {idx + 1}: <span className="font-normal text-slate-700">{q.questionText}</span>
                              </h4>
                              <span className="text-[10px] font-mono bg-blue-50 text-primary px-2.5 py-0.5 rounded font-bold uppercase">
                                {q.questionType} • {q.marks || 5} Marks
                              </span>
                            </div>

                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt: string, optIdx: number) => (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
                                      opt === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                                      opt === q.correctAnswer ? "bg-success text-white border-emerald-300" : "border-slate-300"
                                    }`}>
                                      {opt === q.correctAnswer && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-xs font-mono text-emerald-700">
                              <strong>Key Answer:</strong> {q.correctAnswer}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 text-slate-400 space-y-3">
                          <Sparkles className="w-12 h-12 mx-auto text-slate-200 animate-pulse" />
                          <p className="text-xs">
                            Define your topic and click generate. The Django backend AI will generate high-fidelity examination pools.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: SUBMIT FINAL GRADES */}
            {activeTab === "grades" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-grades-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Calculate & Submit Final Grades</h2>
                  <p className="text-slate-500 text-sm">
                    Submit evaluated scores to the Registrar. Final grade submission automatically validates student attendance metrics (UC-I-09).
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Assessment (50)</th>
                        <th className="p-4">Mid-Exam (20)</th>
                        <th className="p-4">Final Exam (30)</th>
                        <th className="p-4">Total (100)</th>
                        <th className="p-4">Grade Point</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {grades
                        .filter((g) => g.courseId === selectedCourseId)
                        .map((g) => (
                          <tr key={g.id}>
                            <td className="p-4 font-semibold text-slate-800">{g.studentName}</td>
                            <td className="p-4 font-mono">{g.continuousAssessmentScore}</td>
                            <td className="p-4 font-mono">{g.midExamScore}</td>
                            <td className="p-4 font-mono">{g.finalExamScore}</td>
                            <td className="p-4 font-mono font-bold text-slate-950">{g.totalGrade}%</td>
                            <td className="p-4 font-mono text-slate-800 font-bold">{g.letterGrade} ({g.gradePoint.toFixed(2)})</td>
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
                            <td className="p-4 text-right">
                              {g.status === "CALCULATED" ? (
                                <button
                                  onClick={() => handleSubmitFinalGrade(g.id)}
                                  className="bg-primary hover:bg-primary-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                                >
                                  Submit Final Grade
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Ready</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: TRACK ATTENDANCE */}
            {activeTab === "attendance" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-attendance-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Course Attendance Ledger</h2>
                  <p className="text-slate-500 text-sm">Monitor student course logs and manage attendance minimum warnings (UC-I-07).</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-display font-bold text-slate-800 text-base">Attendance Roster</h3>
                    <input
                      type="date"
                      className="border border-slate-200 rounded-lg p-2 text-xs font-mono"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      { id: "U_ST01", name: "Tadesse Mersha", studentId: "MAU1402271" },
                      { id: "U_ST02", name: "Yonas Sahle", studentId: "MAU1402530" },
                      { id: "U_ST03", name: "Tarekegn Abebe", studentId: "MAU1402284" }
                    ].map((st) => {
                      const isPresent = attendanceMap[st.id] !== false;
                      return (
                        <div key={st.id} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{st.name}</h4>
                            <p className="text-[10px] font-mono text-slate-400">ID: {st.studentId}</p>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => setAttendanceMap(prev => ({ ...prev, [st.id]: true }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition ${
                                isPresent
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => setAttendanceMap(prev => ({ ...prev, [st.id]: false }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition ${
                                !isPresent
                                  ? "bg-red-500 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      alert(`Attendance saved successfully for ${attendanceDate}! Audit ledger updated.`);
                      CampusDatabase.addAuditLog(
                        user.id,
                        user.fullName,
                        "INSTRUCTOR",
                        "Save Attendance",
                        "Course",
                        selectedCourseId,
                        `Recorded class attendance roster for date: ${attendanceDate}`
                      );
                    }}
                    className="bg-primary hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-xs font-semibold transition mt-4"
                  >
                    Save Attendance Ledger
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: STUDENT AI ANALYTICS & DROPOUT PREDICTOR */}
            {activeTab === "analytics" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-analytics-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-6 h-6 text-primary" />
                    <span>Predictive Student Analytics (Logistic Regression)</span>
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Classify students as at-risk or not at-risk based on attendance rate, assessment trends, and engagement metrics via the Django backend prediction model.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Select Student Selector */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                    <h3 className="font-display font-bold text-slate-800 text-base">Select Student</h3>
                    <div className="space-y-3 text-xs">
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                        value={analyzingStudentId}
                        onChange={(e) => setAnalyzingStudentId(e.target.value)}
                      >
                        <option value="U_ST01">Tadesse Mersha (Active, Good Profile)</option>
                        <option value="U_ST02">Yonas Sahle (High Performer)</option>
                        <option value="U_ST03">Tarekegn Abebe (Lower Attendance / Overdue Balance)</option>
                      </select>

                      <button
                        onClick={handlePredictDropoutRisk}
                        disabled={calculatingPredictor}
                        className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center space-x-2 transition disabled:bg-slate-100 disabled:text-slate-400 shadow"
                      >
                        {calculatingPredictor ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                            <span>Computing risk logit...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-warning" />
                            <span>Run AI Risk Prediction</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prediction Output Results */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                    <h3 className="font-display font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                      Risk Prediction Report
                    </h3>

                    {analyticsResult ? (
                      <div className="space-y-6 text-xs md:text-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Classification Status</span>
                            <h4 className={`text-xl font-display font-bold mt-1 ${
                              analyticsResult.classification === "HIGH_RISK" || analyticsResult.classification === "At-Risk"
                                ? "text-danger"
                                : "text-success"
                            }`}>
                              {analyticsResult.classification || analyticsResult.status || "Not At-Risk"}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Dropout Probability</span>
                            <span className="block text-2xl font-display font-bold text-slate-800">
                              {analyticsResult.dropoutProbability ? (analyticsResult.dropoutProbability * 100).toFixed(1) + "%" : analyticsResult.riskProbability + "%"}
                            </span>
                          </div>
                        </div>

                        {/* Metrics summary list */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">ATTENDANCE</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.attendancePercentage || analyticsResult.metrics?.attendance || 0}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">AVG GRADE</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.cgpa || analyticsResult.metrics?.grade || 0}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">SUBMISSIONS</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.continuousAssessmentAvg || analyticsResult.metrics?.submissions || 0}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">LIBRARY LOGINS</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.metrics?.library || "N/A"}</strong>
                          </div>
                        </div>

                        {/* Summary / Feedback */}
                        <div className="space-y-2">
                          <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Advisor Evaluation & Justification</span>
                          <p className="bg-blue-50/30 text-slate-700 p-4 rounded-xl border border-blue-50 text-xs md:text-sm leading-relaxed">
                            {analyticsResult.feedback || analyticsResult.recommendedAction || "No additional feedback available."}
                          </p>
                        </div>

                        {/* Recommendations / Interventions */}
                        {(analyticsResult.interventions || analyticsResult.keyRiskFactors) && (
                          <div className="space-y-2">
                            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Intervention Protocols</span>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                              {(analyticsResult.interventions || analyticsResult.keyRiskFactors || []).map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-400 space-y-2">
                        <Sparkles className="w-12 h-12 mx-auto text-slate-200" />
                        <p className="text-xs">Select a student and trigger risk analysis to compute regression status.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* INSTITUTIONAL FOOTER */}
      <AcademicFooter />
    </div>
  );
}
