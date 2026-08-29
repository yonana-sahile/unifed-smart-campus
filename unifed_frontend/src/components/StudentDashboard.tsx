import { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import type { User, Course, CourseMaterial, Announcement, Assignment, Submission, Exam, ExamAttempt, Grade, Transcript } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter, UniversitySeal } from "./UniversityHeader";
import { BookOpen, Calendar, FileText, CheckCircle2, AlertCircle, Play, Clock, Upload, ArrowRight, Download, CreditCard, Star, Check, HelpCircle, Shield, Award, Sparkles, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "materials" | "exams" | "grades" | "transcript" | "fees">("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Active exam state
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examAnswers, setExamAnswers] = useState<{ [index: number]: string }>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive feedback/evaluation
  const [evaluatorInstructorId, setEvaluatorInstructorId] = useState<string | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState("");
  const [evaluationRating, setEvaluationRating] = useState(5);

  // Payment portal state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);

  // Drag and drop assignment upload
  const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [assignmentId: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCourses(CampusDatabase.getCourses());
    setMaterials(CampusDatabase.getMaterials());
    setAnnouncements(CampusDatabase.getAnnouncements());
    setAssignments(CampusDatabase.getAssignments());
    setSubmissions(CampusDatabase.getSubmissions());
    setExams(CampusDatabase.getExams());
    setExamAttempts(CampusDatabase.getExamAttempts());
    setGrades(CampusDatabase.getGrades());
    setSettings(CampusDatabase.getSettings());
  };

  // Start exam timer
  useEffect(() => {
    if (currentExam && examTimeRemaining > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(examTimerRef.current!);
            handleExamAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [currentExam, examTimeRemaining]);

  const handleEnroll = (course: Course) => {
    // BR-01 Check: Prerequisites check
    if (course.prerequisites && course.prerequisites.length > 0) {
      const missingPrereqs: string[] = [];
      course.prerequisites.forEach((p) => {
        const prereqCode = p.split(" ")[0];
        // Check if student completed it with D or higher (>= 50 grade)
        const passedPrereq = grades.some(
          (g) => g.studentId === user.id && g.courseCode === prereqCode && g.totalGrade >= 50
        );
        if (!passedPrereq) {
          missingPrereqs.push(p);
        }
      });

      if (missingPrereqs.length > 0) {
        alert(`Enrollment Denied (BR-01): You have not completed the required prerequisite: ${missingPrereqs.join(", ")}`);
        return;
      }
    }

    // Fee payment check
    if (user.outstandingFees && user.outstandingFees > 1000) {
      alert(`Enrollment Blocked: You must clear outstanding fee balances exceeding 1000 ETB. Current balance: ${user.outstandingFees} ETB.`);
      return;
    }

    // Capacity Check
    if (course.enrolledStudentsCount >= course.capacity) {
      alert("Course is full. Adding to waitlist.");
      return;
    }

    // Enroll
    const updatedCourses = courses.map((c) => {
      if (c.id === course.id) {
        return { ...c, enrolledStudentsCount: c.enrolledStudentsCount + 1 };
      }
      return c;
    });

    CampusDatabase.saveCourses(updatedCourses);
    setCourses(updatedCourses);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Enroll Course",
      "Course",
      course.id,
      `Student registered for course: ${course.courseCode} - ${course.courseTitle}`
    );

    alert(`Successfully registered for ${course.courseCode}!`);
  };

  // Drag and Drop simulation
  const handleDragOver = (e: DragEvent, assignmentId: string) => {
    e.preventDefault();
    setDraggingAssignmentId(assignmentId);
  };

  const handleDragLeave = () => {
    setDraggingAssignmentId(null);
  };

  const handleDrop = (e: DragEvent, assignmentId: string) => {
    e.preventDefault();
    setDraggingAssignmentId(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => ({ ...prev, [assignmentId]: files[0].name }));
      triggerAssignmentSubmit(assignmentId, files[0].name);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => ({ ...prev, [assignmentId]: files[0].name }));
      triggerAssignmentSubmit(assignmentId, files[0].name);
    }
  };

  const triggerAssignmentSubmit = (assignmentId: string, fileName: string) => {
    const newSubmission: Submission = {
      id: "SUB_" + Date.now(),
      assignmentId,
      assignmentTitle: assignments.find((a) => a.id === assignmentId)?.title || "Assignment",
      courseId: assignments.find((a) => a.id === assignmentId)?.courseId || "",
      studentId: user.id,
      studentName: user.fullName,
      submittedAt: new Date().toISOString(),
      fileName,
      status: "PENDING"
    };

    const currentSubmissions = CampusDatabase.getSubmissions();
    const updatedSubmissions = [newSubmission, ...currentSubmissions];
    CampusDatabase.saveSubmissions(updatedSubmissions);
    setSubmissions(updatedSubmissions);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Submit Assignment",
      "Submission",
      newSubmission.id,
      `Submitted assignment file: ${fileName}`
    );

    alert(`Successfully uploaded and submitted ${fileName}!`);
  };

  // Exam Workflow
  const startExam = (exam: Exam) => {
    setCurrentExam(exam);
    setExamAnswers({});
    setExamTimeRemaining(exam.durationMinutes * 60);
    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Start Exam",
      "Exam",
      exam.id,
      `Started online exam: ${exam.examTitle}`
    );
  };

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setExamAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const submitExamManual = () => {
    if (window.confirm("Are you sure you want to submit your exam answers?")) {
      completeExamSubmission();
    }
  };

  const handleExamAutoSubmit = () => {
    alert("Exam time limit reached! Your answers will be submitted automatically.");
    completeExamSubmission();
  };

  const completeExamSubmission = () => {
    if (!currentExam) return;

    // Calculate score for objective questions
    let calculatedScore = 0;
    currentExam.questions.forEach((q, idx) => {
      const studentAns = examAnswers[idx];
      if (q.questionType !== "short_answer" && studentAns === q.correctAnswer) {
        calculatedScore += q.marks;
      } else if (q.questionType === "short_answer") {
        // Mock default score for subjective short answers
        calculatedScore += Math.floor(q.marks * 0.7);
      }
    });

    const newAttempt: ExamAttempt = {
      id: "ATT_" + Date.now(),
      examId: currentExam.id,
      examTitle: currentExam.examTitle,
      studentId: user.id,
      studentName: user.fullName,
      answers: examAnswers,
      score: calculatedScore,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - currentExam.durationMinutes * 60000).toISOString(),
      submittedAt: new Date().toISOString()
    };

    const currentAttempts = CampusDatabase.getExamAttempts();
    CampusDatabase.saveExamAttempts([...currentAttempts, newAttempt]);
    setExamAttempts([...currentAttempts, newAttempt]);

    // Create a new Grade or update continuous assessment
    const currentGrades = CampusDatabase.getGrades();
    const existingGrade = currentGrades.find(g => g.studentId === user.id && g.courseId === currentExam.courseId);

    if (existingGrade) {
      existingGrade.midExamScore = calculatedScore;
      existingGrade.totalGrade = existingGrade.continuousAssessmentScore + existingGrade.midExamScore + existingGrade.finalExamScore;
      CampusDatabase.saveGrades(currentGrades);
      setGrades(currentGrades);
    }

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Submit Exam",
      "ExamAttempt",
      newAttempt.id,
      `Submitted attempt for ${currentExam.examTitle}. Scored ${calculatedScore}/${currentExam.totalMarks}`
    );

    setCurrentExam(null);
    alert(`Exam submitted successfully! Your preliminary score: ${calculatedScore}/${currentExam.totalMarks}`);
  };

  // Evaluate Instructor
  const submitInstructorEvaluation = () => {
    if (!evaluatorInstructorId) return;
    alert(`Thank you for submitting your evaluation! Rating: ${evaluationRating}/5. Your feedback has been stored anonymously for department head review.`);
    setEvaluatorInstructorId(null);
    setEvaluationFeedback("");
  };

  // Clear outstanding fees
  const handlePayment = () => {
    if (!cardNumber || payAmount <= 0) {
      alert("Please enter a valid amount and credit card number.");
      return;
    }

    const updatedUsers = CampusDatabase.getUsers().map(u => {
      if (u.id === user.id) {
        return { ...u, outstandingFees: Math.max(0, (u.outstandingFees || 0) - payAmount) };
      }
      return u;
    });

    CampusDatabase.saveUsers(updatedUsers);
    user.outstandingFees = Math.max(0, (user.outstandingFees || 0) - payAmount);

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "STUDENT",
      "Pay Fees",
      "User",
      user.id,
      `Paid ${payAmount} ETB online. Card digits: ****${cardNumber.slice(-4)}`
    );

    alert(`Successfully processed payment of ${payAmount} ETB! Balance updated.`);
    setPayAmount(0);
    setCardNumber("");
    setShowPayModal(false);
    loadData();
  };

  const getMyGrades = () => {
    return grades.filter((g) => g.studentId === user.id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="student_dashboard_main">
      {/* UNIVERSITY INSTITUTIONAL HEADER */}
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Student Information System (SIS)"
        portalSubtitle="College of Informatics & Technology • Software Engineering"
        badgeText={user.studentId ? `STUDENT • ${user.studentId}` : "STUDENT"}
        badgeType="student"
      />

      {/* ACTIVE EXAM OVERLAY CONTAINER */}
      {currentExam && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="university-gradient text-white p-6 flex justify-between items-center border-b border-amber-500/20">
              <div className="flex items-center space-x-3">
                <UniversitySeal className="w-10 h-10" />
                <div>
                  <p className="text-xs font-mono text-amber-300 tracking-widest uppercase font-bold">{currentExam.courseTitle}</p>
                  <h3 className="text-xl font-display font-bold mt-0.5 text-slate-100">{currentExam.examTitle}</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-amber-500/30">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="font-mono text-lg font-bold text-amber-400">{formatTime(examTimeRemaining)}</span>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              <div className="bg-amber-50/80 border border-amber-200 text-amber-950 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs sm:text-sm">
                  <strong>Academic Testing Instructions:</strong> {currentExam.instructions || "Do not refresh the page. The exam will submit automatically upon expiration."}
                </p>
              </div>

              {currentExam.questions.map((q, qIdx) => (
                <div key={qIdx} className="border-b border-slate-100 pb-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-800">
                      Question {qIdx + 1}: <span className="font-normal text-slate-700">{q.questionText}</span>
                    </h4>
                    <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-bold border border-slate-200">
                      {q.marks} Marks
                    </span>
                  </div>

                  {q.questionType === "short_answer" ? (
                    <textarea
                      rows={3}
                      className="w-full border border-slate-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 rounded-xl p-3 text-xs sm:text-sm"
                      placeholder="Type your academic response and justification here..."
                      value={examAnswers[qIdx] || ""}
                      onChange={(e) => handleSelectAnswer(qIdx, e.target.value)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(qIdx, opt)}
                          className={`flex items-center space-x-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition ${
                            examAnswers[qIdx] === opt
                              ? "bg-blue-50 border-primary-600 text-primary-700 shadow-xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            examAnswers[qIdx] === opt ? "border-primary bg-primary text-white" : "border-slate-300"
                          }`}>
                            {examAnswers[qIdx] === opt && <Check className="w-3 h-3" />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border-t border-slate-200/80 px-8 py-4 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">
                Answered <strong className="text-slate-800">{Object.keys(examAnswers).length}</strong> of {currentExam.questions.length} questions
              </span>
              <button
                onClick={submitExamManual}
                className="university-gradient hover:opacity-95 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-md border border-amber-400/20"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex" id="student_workspace_inner">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Academic Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "courses"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Browse & Register</span>
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
              onClick={() => setActiveTab("exams")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "exams"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Play className="w-4 h-4 text-amber-400" />
              <span>Online Examinations</span>
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "grades"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Grades & Assessments</span>
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "transcript"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Official Transcript</span>
            </button>
            <button
              onClick={() => setActiveTab("fees")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "fees"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Finance & Tuition</span>
              {user.outstandingFees && user.outstandingFees > 0 ? (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                  !
                </span>
              ) : null}
            </button>
          </nav>

          {/* Quick info / status */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">CURRICULUM</span>
              <span className="text-amber-400 font-bold">MoE Harm. v3</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">ACADEMIC STANDING</span>
              <span className="text-emerald-400 font-bold">Good Standing</span>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800/50">
              <span className="text-slate-500">CAMPUS NODE</span>
              <span className="text-slate-300">Tulu Awlia (Main)</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-dashboard-tab"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Welcome Back, {user.fullName}!</h2>
                    <p className="text-slate-500 text-sm">Here is a quick overview of your courses, announcements, and upcoming deadlines.</p>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm text-center">
                    <span className="block text-xs font-mono text-slate-500 uppercase tracking-widest">Cumulative GPA</span>
                    <span className="text-2xl font-display font-bold text-primary">{user.cgpa?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: My Courses & Deadlines */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Courses Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-display font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span>Registered Courses</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((c) => (
                          <div key={c.id} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition">
                            <span className="text-xs font-mono font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">
                              {c.courseCode}
                            </span>
                            <h4 className="font-semibold text-slate-800 mt-2 line-clamp-1">{c.courseTitle}</h4>
                            <p className="text-xs text-slate-500 mt-1">Instructor: {c.instructorName}</p>
                            <p className="text-xs text-slate-400 mt-2">{c.creditHours} Credit Hours</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Assignments */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-display font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>Upcoming Assignments & File Upload</span>
                      </h3>
                      <div className="space-y-4">
                        {assignments.map((as) => {
                          const isSubmitted = submissions.some((sub) => sub.assignmentId === as.id && sub.studentId === user.id);
                          return (
                            <div
                              key={as.id}
                              onDragOver={(e) => handleDragOver(e, as.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, as.id)}
                              className={`border rounded-xl p-5 transition ${
                                draggingAssignmentId === as.id
                                  ? "border-primary bg-blue-50/50"
                                  : isSubmitted
                                  ? "border-emerald-100 bg-emerald-50/10"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <h4 className="font-semibold text-slate-800 text-sm md:text-base">{as.title}</h4>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{as.description}</p>
                                  <span className="inline-block text-xs font-mono text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded">
                                    Due: {new Date(as.dueDate).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="w-full md:w-auto text-right flex flex-col items-end gap-2 flex-shrink-0">
                                  {isSubmitted ? (
                                    <div className="flex items-center space-x-1.5 text-success">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-xs font-bold font-mono">Submitted</span>
                                    </div>
                                  ) : (
                                    <div className="w-full">
                                      {/* Drag and Drop Zone */}
                                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-primary transition">
                                        <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                        <p className="text-[10px] text-slate-500">Drag file here or click to upload</p>
                                        <input
                                          type="file"
                                          className="hidden"
                                          id={`file-${as.id}`}
                                          onChange={(e) => handleFileSelect(e, as.id)}
                                        />
                                        <button
                                          onClick={() => document.getElementById(`file-${as.id}`)?.click()}
                                          className="mt-2 text-xs font-semibold text-primary hover:underline"
                                        >
                                          Select File
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Announcements & System Updates */}
                  <div className="space-y-6">
                    {/* Announcements list */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-display font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        <span>Bulletin Board</span>
                      </h3>
                      <div className="space-y-4">
                        {announcements.map((an) => (
                          <div key={an.id} className="border-l-4 border-primary pl-4 py-2 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(an.postedAt).toLocaleDateString()} • {an.postedBy}
                            </span>
                            <h4 className="font-semibold text-slate-800 text-xs md:text-sm line-clamp-1">{an.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{an.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outstanding fees warning panel */}
                    {user.outstandingFees && user.outstandingFees > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-950 space-y-3">
                        <div className="flex items-center space-x-2 text-danger">
                          <AlertCircle className="w-5 h-5" />
                          <h4 className="font-display font-bold">Outstanding Fees Warning</h4>
                        </div>
                        <p className="text-xs">
                          You have an unpaid balance of <strong>{user.outstandingFees} ETB</strong>. Per university academic regulation (BR-05), your transcript generation is currently locked until balance is cleared.
                        </p>
                        <button
                          onClick={() => setActiveTab("fees")}
                          className="bg-danger hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          Clear Fees Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: BROWSE COURSES */}
            {activeTab === "courses" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-courses-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Academic Course Catalog</h2>
                  <p className="text-slate-500 text-sm">Browse and register for courses available in the current academic semester.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((c) => {
                    const isFull = c.enrolledStudentsCount >= c.capacity;
                    return (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                        <div className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-bold bg-blue-50 text-primary px-2.5 py-1 rounded">
                              {c.courseCode}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {c.creditHours} CH
                            </span>
                          </div>

                          <div>
                            <h3 className="font-display font-bold text-lg text-slate-800 line-clamp-1">{c.courseTitle}</h3>
                            <p className="text-xs text-slate-400 mt-1">Instructor: {c.instructorName}</p>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{c.description}</p>

                          {c.prerequisites.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Prerequisites</span>
                              <div className="flex flex-wrap gap-1.5">
                                {c.prerequisites.map((p, pIdx) => (
                                  <span key={pIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-500">
                            Enrolled: {c.enrolledStudentsCount}/{c.capacity}
                          </span>
                          <button
                            onClick={() => handleEnroll(c)}
                            disabled={isFull}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                              isFull
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-primary hover:bg-primary-600 text-white shadow-sm"
                            }`}
                          >
                            {isFull ? "Course Full" : "Register / Enroll"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: LEARNING MATERIALS */}
            {activeTab === "materials" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-materials-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Learning Materials & Handouts</h2>
                  <p className="text-slate-500 text-sm">Access lecture syllabus slides, digital books, and stream video content shared by instructors.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {materials.map((m) => {
                      const associatedCourse = courses.find((c) => c.id === m.courseId);
                      return (
                        <div key={m.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 rounded">
                                {associatedCourse?.courseCode || "General"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Uploaded: {new Date(m.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm md:text-base">{m.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{m.description}</p>
                          </div>

                          <div className="flex items-center space-x-3 flex-shrink-0 w-full md:w-auto">
                            <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 text-slate-600 font-mono">
                              {m.fileType}
                            </span>
                            <button
                              onClick={() => alert(`Simulating file download of: ${m.title}`)}
                              className="bg-primary hover:bg-primary-600 text-white p-2.5 rounded-lg flex items-center justify-center transition shadow-sm"
                              title="Download Material"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: TAKE EXAMS */}
            {activeTab === "exams" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-exams-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Secure Online Examinations</h2>
                  <p className="text-slate-500 text-sm">Participate in scheduled course mid-exams or quizzes. Each examination has a strict active timer.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams.filter(e => e.status !== "DRAFT").map((exam) => {
                    const isAttempted = examAttempts.some((att) => att.examId === exam.id && att.studentId === user.id);
                    return (
                      <div key={exam.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-bold bg-amber-50 text-warning px-2.5 py-1 rounded">
                              {exam.courseTitle}
                            </span>
                            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{exam.durationMinutes} Mins</span>
                            </div>
                          </div>

                          <h3 className="font-display font-bold text-lg text-slate-800">{exam.examTitle}</h3>
                          <p className="text-xs text-slate-500">Scheduled Date: {new Date(exam.examDate).toLocaleString()}</p>
                          <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-100 line-clamp-3 leading-relaxed">
                            {exam.instructions}
                          </p>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-mono font-bold">
                            Total Marks: {exam.totalMarks}
                          </span>

                          {isAttempted ? (
                            <span className="text-xs font-mono font-bold text-success flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Exam Completed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => startExam(exam)}
                              className="bg-primary hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start Examination</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: GRADES */}
            {activeTab === "grades" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-grades-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Continuous Assessment & Grades</h2>
                  <p className="text-slate-500 text-sm">View your academic score sheets, continuous assessment component breakdowns, and verified letter grades.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left panel: Grades breakdowns */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-display font-bold text-slate-800 text-base">Semester Score Sheet</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {getMyGrades().map((g) => (
                        <div key={g.id} className="p-6 space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <div>
                              <span className="text-xs font-mono font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">
                                {g.courseCode}
                              </span>
                              <h4 className="font-display font-bold text-slate-800 mt-1.5 text-base md:text-lg">{g.courseTitle}</h4>
                              <p className="text-xs text-slate-400">Credit Hours: {g.creditHours} • Status: {g.status}</p>
                            </div>

                            <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex-shrink-0">
                              <div className="text-center border-r border-slate-200 pr-4">
                                <span className="block text-[10px] text-slate-400 font-mono font-bold">GRADE</span>
                                <span className="text-2xl font-display font-bold text-slate-800">{g.letterGrade}</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-[10px] text-slate-400 font-mono font-bold">TOTAL</span>
                                <span className="text-lg font-mono font-bold text-slate-700">{g.totalGrade}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Breakdown bar */}
                          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-mono">
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                              <span className="block text-[10px] text-slate-400 uppercase">Assessment (50%)</span>
                              <span className="font-bold text-slate-700">{g.continuousAssessmentScore} / 50</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                              <span className="block text-[10px] text-slate-400 uppercase">Mid-Exam (20%)</span>
                              <span className="font-bold text-slate-700">{g.midExamScore} / 20</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                              <span className="block text-[10px] text-slate-400 uppercase">Final Exam (30%)</span>
                              <span className="font-bold text-slate-700">{g.finalExamScore} / 30</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right panel: evaluate instructor */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 text-primary">
                        <Star className="w-5 h-5 fill-current" />
                        <h3 className="font-display font-bold text-slate-800 text-base">Evaluate Instructor Efficiency</h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Submit feedback regarding course teaching quality. Your feedback assists the department in quality auditing.
                      </p>

                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-medium text-slate-700">Select Instructor</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white"
                          onChange={(e) => setEvaluatorInstructorId(e.target.value)}
                        >
                          <option value="">-- Choose Instructor --</option>
                          <option value="U_IN01">Chalachew M (Software Engineering)</option>
                        </select>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">Rating: {evaluationRating}/5</label>
                          <div className="flex space-x-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                onClick={() => setEvaluationRating(num)}
                                className="p-1 text-warning focus:outline-none"
                              >
                                <Star className={`w-5 h-5 ${evaluationRating >= num ? "fill-current" : ""}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={3}
                          value={evaluationFeedback}
                          onChange={(e) => setEvaluationFeedback(e.target.value)}
                          placeholder="Your anonymous comments here..."
                          className="w-full border border-slate-200 rounded-lg p-3 text-xs"
                        />

                        <button
                          onClick={submitInstructorEvaluation}
                          disabled={!evaluatorInstructorId || !evaluationFeedback}
                          className="w-full bg-primary hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-lg text-xs font-semibold transition"
                        >
                          Submit Anonymous Evaluation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: TRANSCRIPT */}
            {activeTab === "transcript" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-transcript-tab"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Official Academic Transcript</h2>
                    <p className="text-slate-500 text-sm">Download your generated digital transcript verified with a QR-verification signature.</p>
                  </div>
                </div>

                {user.outstandingFees && user.outstandingFees > 0 ? (
                  <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-xl flex items-start space-x-4 max-w-2xl">
                    <AlertCircle className="w-6 h-6 text-danger mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-display font-bold text-danger text-base">Transcript Locked (UC-S-13 / BR-05)</h4>
                      <p className="text-xs md:text-sm">
                        Academic regulations state that transcripts cannot be generated or released for students with outstanding financial balances. Your current outstanding fee balance is <strong>{user.outstandingFees} ETB</strong>.
                      </p>
                      <button
                        onClick={() => setActiveTab("fees")}
                        className="bg-danger hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition mt-2"
                      >
                        Clear Fees to Unlock
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 max-w-3xl shadow-xl border-t-8 border-t-amber-500 relative overflow-hidden" id="printable-transcript-view">
                      {/* Background Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <UniversitySeal className="w-96 h-96 text-primary" />
                      </div>

                      <div className="relative z-10">
                        <div className="text-center border-b-2 border-slate-200/80 pb-6 space-y-2">
                          <div className="flex justify-center mb-2">
                            <UniversitySeal className="w-18 h-18 drop-shadow-md" />
                          </div>
                          <h3 className="font-serif font-bold text-2xl tracking-tight text-slate-950 uppercase">
                            Mekdela Amba University
                          </h3>
                          <p className="text-xs uppercase tracking-widest text-slate-600 font-mono font-bold">
                            Office of the University Registrar • የሬጅስትራር ጽሕፈት ቤት
                          </p>
                          <p className="text-[11px] text-slate-500 italic font-serif">
                            "Veritas, Scientia et Virtus" • South Wollo, Amhara Region, Ethiopia
                          </p>
                          <div className="pt-1 flex items-center justify-center gap-2">
                            <span className="inline-block text-[10px] bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full font-mono font-bold border border-emerald-200 shadow-2xs">
                              OFFICIAL DIGITAL RECORD • CRYPTOGRAPHICALLY VERIFIED
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-5 text-xs border-b border-slate-100 font-sans">
                          <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                            <p><span className="text-slate-500">Student Name:</span> <strong className="text-slate-900 font-serif text-sm">{user.fullName}</strong></p>
                            <p><span className="text-slate-500">Student ID / Matr.:</span> <strong className="text-slate-900 font-mono font-bold">{user.studentId}</strong></p>
                            <p><span className="text-slate-500">Academic College:</span> <strong className="text-slate-800">{user.department}</strong></p>
                            <p><span className="text-slate-500">Major Program:</span> <strong className="text-slate-800">{user.program}</strong></p>
                          </div>
                          <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 text-right">
                            <p><span className="text-slate-500">Issue Date:</span> <strong className="text-slate-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                            <p><span className="text-slate-500">Academic Standing:</span> <strong className="text-emerald-700 font-bold">Good Standing (Dean's Honor)</strong></p>
                            <p><span className="text-slate-500">Cumulative GPA:</span> <strong className="text-primary-700 font-serif text-base font-bold">{user.cgpa?.toFixed(2)} / 4.00</strong></p>
                            <p><span className="text-slate-500">Graduation Status:</span> <strong className="text-slate-800">In Progress (Year 4, Term II)</strong></p>
                          </div>
                        </div>

                        <div className="py-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-serif font-bold text-slate-900 text-sm tracking-wide uppercase">Course Credits & Verified Grade Ledger</h4>
                            <span className="text-[10px] font-mono text-slate-500">Curriculum Code: B.Sc.-SE-2023</span>
                          </div>

                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b-2 border-slate-200 bg-slate-100/70 text-slate-600 font-mono text-[11px]">
                                <th className="py-2.5 px-3">Course Code</th>
                                <th className="py-2.5 px-3">Course Title</th>
                                <th className="py-2.5 px-3 text-center">Credit Hours (ECTS)</th>
                                <th className="py-2.5 px-3 text-center">Letter Grade</th>
                                <th className="py-2.5 px-3 text-center">Grade Point</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                              {getMyGrades().map((g) => (
                                <tr key={g.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-3 font-mono font-bold text-primary-900">{g.courseCode}</td>
                                  <td className="py-3 px-3 font-medium">{g.courseTitle}</td>
                                  <td className="py-3 px-3 text-center font-mono">{g.creditHours} ({Math.round(g.creditHours * 1.6)} ECTS)</td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="inline-block font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-primary-800 border border-blue-100">
                                      {g.letterGrade}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono font-bold">{g.gradePoint.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Signatures & Seal Verification */}
                        <div className="border-t-2 border-slate-200 pt-6 mt-4 grid grid-cols-3 gap-4 items-center">
                          <div className="text-center space-y-1">
                            <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1">
                              <span className="font-serif italic text-xs text-slate-600">Dr. Befekadu Mengistu</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">Head, Dept. of Software Eng.</p>
                          </div>

                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/80 bg-amber-50/40 flex flex-col items-center justify-center p-1 shadow-inner">
                              <span className="text-[8px] font-mono font-bold text-amber-800 leading-tight text-center">MAU OFFICIAL REGISTRAR SEAL</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 mt-1">Doc Ref: MAU-TR-{Date.now().toString().slice(-6)}</span>
                          </div>

                          <div className="text-center space-y-1">
                            <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1">
                              <span className="font-serif italic text-xs text-slate-600">Abebech Tadesse, M.Sc.</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">University Registrar Director</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <p>© Mekdela Amba University Registrar's Directorate • All Rights Reserved</p>
                          <p>Verification Code: VERIFY-MAU-771 • Tulu Awlia, Ethiopia</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => window.print()}
                        className="university-gradient hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 shadow-md border border-amber-400/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>Print Official Certificate PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: OUTSTANDING FEES */}
            {activeTab === "fees" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="student-fees-tab"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Outstanding Semester Fees</h2>
                  <p className="text-slate-500 text-sm">Review your tuition balance and verify online card payments directly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <span className="text-xs uppercase text-slate-400 font-mono tracking-widest font-bold">Tuition Fee Due</span>
                    <h3 className="text-3xl font-display font-bold text-slate-900">
                      {user.outstandingFees ? `${user.outstandingFees} ETB` : "0.00 ETB"}
                    </h3>
                    {user.outstandingFees && user.outstandingFees > 0 ? (
                      <div className="bg-red-50 text-danger border border-red-100 p-3.5 rounded-lg text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                        <span>Outstanding tuition balance blocks course enrollment and transcript download.</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-success border border-emerald-100 p-3.5 rounded-lg text-xs flex items-start space-x-2">
                        <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                        <span>All fees cleared! You have no outstanding balance.</span>
                      </div>
                    )}

                    {user.outstandingFees && user.outstandingFees > 0 ? (
                      <button
                        onClick={() => {
                          setPayAmount(user.outstandingFees || 0);
                          setShowPayModal(true);
                        }}
                        className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg text-xs font-semibold transition"
                      >
                        Clear Fees
                      </button>
                    ) : null}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 col-span-2 text-xs">
                    <h4 className="font-display font-bold text-slate-800 text-sm">Payment Methods & Instructions</h4>
                    <p className="text-slate-500 leading-relaxed">
                      You can pay your tuition online safely using credit card or Telebirr integrations. Verification of payments is completed instantly.
                    </p>
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Bank</span>
                        <strong className="text-slate-800">Pinnacle National Bank, N.A.</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Name</span>
                        <strong className="text-slate-800">Thornfield Capital Partners IV, L.P.</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Routing Number (ABA)</span>
                        <strong className="text-slate-800 font-mono">021000322</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Number</span>
                        <strong className="text-slate-800 font-mono">8834-5521-0076</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Credit Card Modal */}
                {showPayModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
                      <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">
                        Secure Card Payment
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-medium">Payment Amount (ETB)</label>
                          <input
                            type="number"
                            className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                            value={payAmount}
                            onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-600 font-medium">Credit Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            maxLength={19}
                            className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-slate-600 font-medium">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full border border-slate-200 rounded-lg p-2.5 text-center font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-600 font-medium">CVV</label>
                            <input
                              type="password"
                              placeholder="***"
                              maxLength={3}
                              className="w-full border border-slate-200 rounded-lg p-2.5 text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => setShowPayModal(false)}
                          className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePayment}
                          className="flex-1 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Process Payment
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
