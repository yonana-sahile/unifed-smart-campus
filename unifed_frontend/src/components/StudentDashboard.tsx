import { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import type { User, Course, CourseMaterial, Announcement, Assignment, Submission, Exam, ExamAttempt, Grade, LibraryResource } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter, UniversitySeal } from "./UniversityHeader";
import { SmartAICopilot } from "./SmartAICopilot";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusFacilities } from "./SmartCampusFacilities";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import { ExamResultsModal } from "./ExamResultsModal";
import {
  BookOpen, Calendar, FileText, CheckCircle2, AlertCircle, Play, Clock, Upload,
  Download, CreditCard, Star, Check, Award, Sparkles, Cpu, ShieldCheck, Radio, Video, X, Search, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudentZoomLearningHub } from "./StudentZoomLearningHub";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "courses" | "materials" | "library" | "exams" | "zoom" | "grades" |
    "transcript" | "fees" | "copilot" | "clearance" | "facilities" | "alerts"
  >("dashboard");

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // ✅ NEW: Library resources
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryType, setLibraryType] = useState<string>("ALL");

  const [instructors, setInstructors] = useState<User[]>([]);
  const [evaluationCourseId, setEvaluationCourseId] = useState<string>("");

  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examAnswers, setExamAnswers] = useState<{ [index: number]: string }>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [viewingAttempt, setViewingAttempt] = useState<ExamAttempt | null>(null);

  const [evaluatorInstructorId, setEvaluatorInstructorId] = useState<string | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState("");
  const [evaluationRating, setEvaluationRating] = useState(5);

  const [payAmount, setPayAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);

  const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [assignmentId: string]: string }>({});

  const [courseSearch, setCourseSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: number }>({});

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState<"code" | "title" | "credits" | "enrollment">("code");
  const [catalogDept, setCatalogDept] = useState("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        coursesData,
        materialsData,
        announcementsData,
        assignmentsData,
        submissionsData,
        examsData,
        examAttemptsData,
        gradesData,
        settingsData,
        usersData,
        libraryResourcesData,   // ✅ NEW
      ] = await Promise.all([
        CampusDatabase.getCourses(),
        CampusDatabase.getMaterials(),
        CampusDatabase.getAnnouncements(),
        CampusDatabase.getAssignments(),
        CampusDatabase.getSubmissions(),
        CampusDatabase.getExams(),
        CampusDatabase.getExamAttempts(),
        CampusDatabase.getGrades(),
        CampusDatabase.getSettings(),
        CampusDatabase.getUsers(),
        (CampusDatabase as any).getLibraryResources(),   // ✅ NEW
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setExams(Array.isArray(examsData) ? examsData : []);
      setExamAttempts(Array.isArray(examAttemptsData) ? examAttemptsData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setSettings(settingsData || null);
      setLibraryResources(Array.isArray(libraryResourcesData) ? libraryResourcesData : []);  // ✅ NEW

      const allUsers: User[] = Array.isArray(usersData) ? usersData : [];
      setInstructors(
        allUsers.filter(
          (u) =>
            u.role === "INSTRUCTOR" ||
            u.role === "DEPARTMENT_HEAD" ||
            u.role === "DEAN"
        )
      );
    } catch (error) {
      console.error("Failed to load student data:", error);
      setCourses([]);
      setMaterials([]);
      setAnnouncements([]);
      setAssignments([]);
      setSubmissions([]);
      setExams([]);
      setExamAttempts([]);
      setGrades([]);
      setSettings(null);
      setInstructors([]);
      setLibraryResources([]);   // ✅ NEW
    }
  };

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

  const isAlreadyRegistered = (courseId: string) =>
    grades.some((g) => g.studentId === user.id && g.courseId === courseId);

  const checkPrerequisites = (course: Course): { ok: boolean; missing: string[] } => {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return { ok: true, missing: [] };
    }
    const missing: string[] = [];
    course.prerequisites.forEach((p) => {
      const prereqCode = p.split(" ")[0];
      const passed = grades.some(
        (g) => g.studentId === user.id && g.courseCode === prereqCode && g.totalGrade >= 50
      );
      if (!passed) missing.push(p);
    });
    return { ok: missing.length === 0, missing };
  };

  const handleEnroll = async (course: Course, force = false) => {
    if (isAlreadyRegistered(course.id)) {
      alert(`You are already registered for ${course.courseCode}.`);
      return;
    }

    if (!force) {
      const prereqCheck = checkPrerequisites(course);
      if (!prereqCheck.ok) {
        const proceed = window.confirm(
          `Enrollment Denied (BR-01): You have not completed the required prerequisite: ${prereqCheck.missing.join(", ")}.\n\n` +
          `Do you want to override (DEV ONLY) and enroll anyway?`
        );
        if (!proceed) return;
        force = true;
      }

      if (user.outstandingFees && user.outstandingFees > 1000) {
        alert(`Enrollment Blocked: You must clear outstanding fee balances exceeding 1000 ETB. Current balance: ${user.outstandingFees} ETB.`);
        return;
      }

      if (course.enrolledStudentsCount >= course.capacity) {
        alert("Course is full. Adding to waitlist.");
        return;
      }
    }

    try {
      const updated: any = await CampusDatabase.updateCourse(course.id, {
        enrolled_students_count: course.enrolledStudentsCount + 1,
      });
      const normalized: Course = {
        ...course,
        enrolledStudentsCount:
          updated?.enrolled_students_count ?? updated?.enrolledStudentsCount ?? course.enrolledStudentsCount + 1,
      };
      setCourses((prev) => prev.map((c) => (c.id === course.id ? normalized : c)));

      const newGrade: Grade = {
        id: "G_" + Date.now(),
        studentId: user.id,
        studentName: user.fullName,
        courseId: course.id,
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        creditHours: course.creditHours,
        continuousAssessmentScore: 0,
        midExamScore: 0,
        finalExamScore: 0,
        totalGrade: 0,
        letterGrade: "-",
        gradePoint: 0,
        semester: course.semester,
        status: "CALCULATED",
      };
      setGrades((prev) => [...prev, newGrade]);

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "STUDENT", "Enroll Course", "Course", course.id,
        `Student registered for course: ${course.courseCode} - ${course.courseTitle}${force ? " (dev override)" : ""}`
      );

      alert(`Successfully registered for ${course.courseCode}!`);
    } catch (err: any) {
      console.error(err);
      alert("Enrollment failed: " + (err?.message || "Unknown error"));
    }
  };

  const handleDragOver = (e: DragEvent, assignmentId: string) => {
    e.preventDefault();
    setDraggingAssignmentId(assignmentId);
  };

  const handleDragLeave = () => setDraggingAssignmentId(null);

  const handleDrop = (e: DragEvent, assignmentId: string) => {
    e.preventDefault();
    setDraggingAssignmentId(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadedFiles((prev) => ({ ...prev, [assignmentId]: files[0].name }));
      triggerAssignmentSubmit(assignmentId, files[0].name);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles((prev) => ({ ...prev, [assignmentId]: files[0].name }));
      triggerAssignmentSubmit(assignmentId, files[0].name);
    }
  };

  const triggerAssignmentSubmit = async (assignmentId: string, fileName: string) => {
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

    try {
      const matchedAssignment = assignments.find(
        (a) => String(a.id) === String(assignmentId)
      );

      const created: any = await CampusDatabase.addSubmission({
        assignment:
          parseInt(String(assignmentId).replace(/\D/g, "")) || assignmentId,
        assignment_title:
          matchedAssignment?.title || newSubmission.assignmentTitle || "Assignment",
        course:
          matchedAssignment?.courseId || newSubmission.courseId || 1,
        student:
          parseInt(String(user.id).replace(/\D/g, "")) || user.id,
        student_name: user.fullName,
        file_name: fileName,
        status: "PENDING",
      });
      const normalized: Submission = {
        ...newSubmission,
        id: String(created?.id ?? newSubmission.id),
      };
      setSubmissions((prev) => [normalized, ...prev]);

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "STUDENT", "Submit Assignment", "Submission", normalized.id,
        `Submitted assignment file: ${fileName}`
      );

      alert(`Successfully uploaded and submitted ${fileName}!`);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      alert("Submission failed: " + detail);
    }
  };

  const startExam = async (exam: Exam) => {
    setCurrentExam(exam);
    setExamAnswers({});
    setExamTimeRemaining(exam.durationMinutes * 60);
    await CampusDatabase.addAuditLog(
      user.id, user.fullName, "STUDENT", "Start Exam", "Exam", exam.id,
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

  const completeExamSubmission = async () => {
    if (!currentExam) return;

    let calculatedScore = 0;
    currentExam.questions.forEach((q, idx) => {
      const studentAns = examAnswers[idx];
      if (studentAns && studentAns === q.correctAnswer) {
        calculatedScore += q.marks;
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

    try {
      const created: any = await CampusDatabase.createExamAttempt({
        exam: currentExam.id,
        student: user.id,
        student_name: user.fullName,
        answers: examAnswers,
        score: calculatedScore,
        status: "SUBMITTED",
        started_at: newAttempt.startedAt,
        submitted_at: newAttempt.submittedAt,
      });
      const normalizedAttempt: ExamAttempt = {
        ...newAttempt,
        id: String(created?.id ?? newAttempt.id),
      };
      setExamAttempts((prev) => [...prev, normalizedAttempt]);

      const allGrades = await CampusDatabase.getGrades();
      const gradeList = Array.isArray(allGrades) ? allGrades : [];
      const existingGrade = gradeList.find(
        (g) => g.studentId === user.id && g.courseId === currentExam.courseId
      );

      if (existingGrade) {
        const updatedGrade: any = await CampusDatabase.updateGrade(existingGrade.id, {
          mid_exam_score: calculatedScore,
        });
        const normalizedGrade: Grade = {
          ...existingGrade,
          midExamScore: updatedGrade?.mid_exam_score ?? calculatedScore,
          totalGrade:
            updatedGrade?.total_grade ??
            (existingGrade.continuousAssessmentScore +
              calculatedScore +
              existingGrade.finalExamScore),
        };
        setGrades((prev) => prev.map((g) => (g.id === normalizedGrade.id ? normalizedGrade : g)));
      }

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "STUDENT", "Submit Exam", "ExamAttempt", normalizedAttempt.id,
        `Submitted attempt for ${currentExam.examTitle}. Scored ${calculatedScore}/${currentExam.totalMarks}`
      );

      setViewingAttempt(normalizedAttempt);
      setCurrentExam(null);
    } catch (err: any) {
      console.error(err);
      alert("Exam submission failed: " + (err?.message || "Unknown error"));
    }
  };

  const submitInstructorEvaluation = async () => {
    if (!evaluatorInstructorId) {
      alert("Please select an instructor.");
      return;
    }
    if (!evaluationCourseId) {
      alert("Please select a course.");
      return;
    }
    if (!evaluationFeedback.trim()) {
      alert("Please write your feedback.");
      return;
    }

    const instructor = instructors.find((i) => i.id === evaluatorInstructorId);
    const course = courses.find((c) => String(c.id) === String(evaluationCourseId));

    try {
      await CampusDatabase.addEvaluation({
        studentId: user.id,
        studentName: user.fullName,
        instructorId: evaluatorInstructorId,
        instructorName: instructor?.fullName || "Unknown",
        courseId: evaluationCourseId,
        courseCode: course?.courseCode || "",
        clarity: evaluationRating,
        punctuality: evaluationRating,
        helpfulness: evaluationRating,
        assessmentFairness: evaluationRating,
        overallRating: evaluationRating,
        comments: evaluationFeedback,
        semester: course?.semester || "1",
      });

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "STUDENT", "Submit Evaluation", "InstructorEvaluation", evaluatorInstructorId,
        `Submitted evaluation for ${instructor?.fullName || "instructor"} — ${evaluationRating}/5`
      );

      alert(
        `Thank you for submitting your evaluation of ${instructor?.fullName || "the instructor"}! Rating: ${evaluationRating}/5. Your feedback has been stored anonymously for department head review.`
      );
      setEvaluatorInstructorId(null);
      setEvaluationCourseId("");
      setEvaluationFeedback("");
      setEvaluationRating(5);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      alert("Evaluation submission failed: " + detail);
    }
  };

  const handlePayment = async () => {
    if (!cardNumber || payAmount <= 0) {
      alert("Please enter a valid amount and credit card number.");
      return;
    }

    try {
      const updatedUser: any = await CampusDatabase.updateUser({
        ...user,
        outstandingFees: Math.max(0, (user.outstandingFees || 0) - payAmount),
      } as any);
      user.outstandingFees =
        updatedUser?.outstandingFees ?? Math.max(0, (user.outstandingFees || 0) - payAmount);

      await CampusDatabase.addAuditLog(
        user.id, user.fullName, "STUDENT", "Pay Fees", "User", user.id,
        `Paid ${payAmount} ETB online. Card digits: ****${cardNumber.slice(-4)}`
      );

      alert(`Successfully processed payment of ${payAmount} ETB! Balance updated.`);
      setPayAmount(0);
      setCardNumber("");
      setShowPayModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert("Payment failed: " + (err?.message || "Unknown error"));
    }
  };

  const getMyGrades = () => grades.filter((g) => g.studentId === user.id);

  const getCourseProgress = (courseId: string) => {
    const courseAssignments = assignments.filter((a) => a.courseId === courseId);
    if (courseAssignments.length === 0) return 100;
    const submittedCount = courseAssignments.filter((a) =>
      submissions.some((s) => s.assignmentId === a.id && s.studentId === user.id)
    ).length;
    return Math.round((submittedCount / courseAssignments.length) * 100);
  };

  const handleRealDownload = async (material: CourseMaterial) => {
    const materialId = material.id;
    setDownloadProgress((prev) => ({ ...prev, [materialId]: 0 }));

    try {
      if (material.fileData && material.fileData.startsWith("data:")) {
        let progress = 0;
        const timer = setInterval(() => {
          progress += 20;
          setDownloadProgress((prev) => ({ ...prev, [materialId]: Math.min(progress, 100) }));
          if (progress >= 100) clearInterval(timer);
        }, 80);

        await new Promise((r) => setTimeout(r, 500));

        const a = document.createElement("a");
        a.href = material.fileData;
        a.download = material.fileName || material.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (material.fileData) {
        const response = await fetch(material.fileData);
        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (!response.body || !response.ok) {
          throw new Error("No file data available");
        }

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setDownloadProgress((prev) => ({
              ...prev,
              [materialId]: Math.round((received / total) * 100),
            }));
          }
        }

        const blob = new Blob(chunks as BlobPart[]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = material.fileName || material.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(`No file data attached to "${material.title}". Contact your instructor.`);
        setDownloadProgress((prev) => {
          const copy = { ...prev };
          delete copy[materialId];
          return copy;
        });
        return;
      }

      setDownloadProgress((prev) => ({ ...prev, [materialId]: 100 }));
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const copy = { ...prev };
          delete copy[materialId];
          return copy;
        });
      }, 1500);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Download failed: " + (err?.message || "Unknown error"));
      setDownloadProgress((prev) => {
        const copy = { ...prev };
        delete copy[materialId];
        return copy;
      });
    }
  };

  const filteredCourses = courses.filter((c) =>
    courseSearch === "" ||
    c.courseCode?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.courseTitle?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.instructorName?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredMaterials = materials.filter((m) =>
    materialSearch === "" ||
    m.title?.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.description?.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.fileType?.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const filteredAssignments = assignments.filter((a) =>
    assignmentSearch === "" ||
    a.title?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
    a.description?.toLowerCase().includes(assignmentSearch.toLowerCase())
  );

  const catalogDepartments = ["ALL", ...Array.from(new Set(courses.map((c) => c.department).filter(Boolean)))];

  const catalogCourses = courses
    .filter((c) => catalogDept === "ALL" || c.department === catalogDept)
    .filter((c) =>
      catalogSearch === "" ||
      c.courseCode?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.courseTitle?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.instructorName?.toLowerCase().includes(catalogSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (catalogSort === "code") return (a.courseCode || "").localeCompare(b.courseCode || "");
      if (catalogSort === "title") return (a.courseTitle || "").localeCompare(b.courseTitle || "");
      if (catalogSort === "credits") return (b.creditHours || 0) - (a.creditHours || 0);
      if (catalogSort === "enrollment")
        return (b.enrolledStudentsCount / b.capacity) - (a.enrolledStudentsCount / a.capacity);
      return 0;
    });

  const totalCreditsRequired = 180;
  const creditsEarned = getMyGrades()
    .filter((g) => g.totalGrade >= 50)
    .reduce((sum, g) => sum + (g.creditHours || 0), 0);
  const degreeProgressPercent = Math.min(100, Math.round((creditsEarned / totalCreditsRequired) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ✅ NEW: Library filtering + download
  const visibleLibraryResources = libraryResources
    .filter((r) => r.accessLevel !== "FACULTY_ONLY")
    .filter((r) => libraryType === "ALL" || r.resourceType === libraryType)
    .filter(
      (r) =>
        librarySearch === "" ||
        r.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        r.author.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (r.isbn && r.isbn.includes(librarySearch))
    );

  const handleLibraryDownload = async (res: LibraryResource) => {
    try {
      const nextCount = (res.downloadsCount ?? 0) + 1;
      const numericId = String(res.id).replace(/^LIB_/, "");
      await (CampusDatabase as any).updateLibraryResource(numericId, {
        downloads_count: nextCount,
      });
      setLibraryResources((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, downloadsCount: nextCount } : r))
      );
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "STUDENT",
        "Download Library Resource",
        "LibraryResource",
        res.id,
        `Downloaded "${res.title}" by ${res.author}`
      );
      alert(`Download started: "${res.title}" (${res.fileSize})`);
    } catch (err: any) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      alert("Download failed: " + detail);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Academic Dashboard", shortLabel: "Dashboard", Icon: BookOpen },
    { id: "courses", label: "Browse & Register", shortLabel: "Courses", Icon: Calendar },
    { id: "materials", label: "Course Materials", shortLabel: "Materials", Icon: FileText },
    { id: "library", label: "Digital Library", shortLabel: "Library", Icon: BookOpen },
    { id: "zoom", label: "Zoom Classroom", shortLabel: "Zoom", Icon: Video, isZoom: true },
    { id: "exams", label: "Online Examinations", shortLabel: "Exams", Icon: Play },
    { id: "grades", label: "Grades & Assessments", shortLabel: "Grades", Icon: CheckCircle2 },
    { id: "transcript", label: "Official Transcript", shortLabel: "Transcript", Icon: Award },
    { id: "fees", label: "Finance & Tuition", shortLabel: "Tuition", Icon: CreditCard, isFees: true },
  ] as const;

  const smartItems = [
    { id: "copilot", label: "Smart AI Copilot", shortLabel: "AI Copilot", Icon: Sparkles, isCopilot: true },
    { id: "clearance", label: "Digital Clearance", shortLabel: "Clearance", Icon: ShieldCheck },
    { id: "facilities", label: "Smart Labs & Facilities", shortLabel: "Facilities", Icon: Cpu },
    { id: "alerts", label: "Campus Alerts", shortLabel: "Alerts", Icon: Radio },
  ] as const;

  const goToTab = (id: string) => {
    setActiveTab(id as any);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="student_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Student Information System (SIS)"
        portalSubtitle="College of Informatics & Technology • Software Engineering"
        badgeText={user.studentId ? `STUDENT • ${user.studentId}` : "STUDENT"}
        badgeType="student"
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
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">{user.studentId || "STUDENT"}</p>
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
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      activeTab === id
                        ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${id === "zoom" ? "text-blue-400" : "text-amber-400"}`} />
                    <span>{label}</span>
                  </button>
                ))}

                <div className="pt-3 pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Smart Campus Hub
                  </span>
                </div>

                {smartItems.map(({ id, label, Icon }) => (
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
              </nav>

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">CGPA</span>
                  <span className="text-amber-400 font-bold">{user.cgpa?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] mt-1">
                  <span className="text-slate-500">STANDING</span>
                  <span className="text-emerald-400 font-bold">Good Standing</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE HORIZONTAL QUICK-NAV */}
      <div className="md:hidden sticky top-[48px] sm:top-[57px] z-30 bg-[#071526] border-b border-slate-800/90 px-2 py-1.5 overflow-x-auto flex items-center space-x-1.5 shadow-md shrink-0 scrollbar-none">
        {[...navItems, ...smartItems].map(({ id, shortLabel, Icon }) => (
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

      <div className="flex-1 flex min-w-0" id="student_workspace_inner">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <nav className="p-3.5 flex-1 space-y-1">
            {navItems.map(({ id, label, Icon, isZoom, isFees }: any) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isZoom ? "text-blue-400" : "text-amber-400"}`} />
                  <span>{label}</span>
                </div>
                {isZoom && (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                )}
                {isFees && user.outstandingFees && user.outstandingFees > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">!</span>
                )}
              </button>
            ))}

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Campus Hub
              </span>
            </div>

            {smartItems.map(({ id, label, Icon, isCopilot }: any) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? isCopilot
                      ? "bg-gradient-to-r from-cyan-700 to-blue-700 text-white border border-cyan-400/30 shadow-xs"
                      : "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCopilot ? "text-cyan-400" : "text-amber-400"}`} />
                <span>{label}</span>
                {isCopilot && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">AI</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Degree Progress
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {creditsEarned}/{totalCreditsRequired} CH
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                style={{ width: `${degreeProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500">COMPLETED</span>
              <span className="text-amber-300 font-bold">{degreeProgressPercent}%</span>
            </div>
          </div>

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

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="student-dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                      Welcome Back, {user.fullName}!
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Here is a quick overview of your courses, announcements, and upcoming deadlines.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-2.5 sm:py-3 rounded-xl shadow-sm text-left sm:text-center w-fit">
                    <span className="block text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Cumulative GPA
                    </span>
                    <span className="text-xl sm:text-2xl font-display font-bold text-primary">
                      {user.cgpa?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      <Video className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          MAU LIVE DISTANCE LEARNING
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        Interactive Zoom Classrooms & Recorded Archives
                      </h3>
                      <p className="text-xs text-blue-200">
                        Join real-time video lectures, raise hand for questions, and access past lecture recordings.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("zoom")}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Zoom Classroom</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg font-display font-bold text-slate-800 flex items-center space-x-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <span>Registered Courses</span>
                        </h3>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCourses.map((c) => {
                          const progress = getCourseProgress(c.id);
                          return (
                            <div key={c.id} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">
                                  {c.courseCode}
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  progress === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {progress === 100 ? "✓ Complete" : `${progress}%`}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-800 mt-2 line-clamp-1">{c.courseTitle}</h4>
                              <p className="text-xs text-slate-500 mt-1">Instructor: {c.instructorName}</p>
                              <p className="text-xs text-slate-400 mt-1">{c.creditHours} Credit Hours</p>

                              <div className="mt-3 space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                  <span>Course Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      progress === 100
                                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                        : "bg-gradient-to-r from-blue-400 to-blue-600"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {filteredCourses.length === 0 && (
                          <div className="col-span-full text-center py-8 text-slate-400 text-xs">
                            No courses match "{courseSearch}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg font-display font-bold text-slate-800 flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span>Upcoming Assignments & File Upload</span>
                        </h3>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search assignments..."
                            value={assignmentSearch}
                            onChange={(e) => setAssignmentSearch(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {filteredAssignments.map((as) => {
                          const isSubmitted = submissions.some(
                            (sub) => sub.assignmentId === as.id && sub.studentId === user.id
                          );
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
                                  <h4 className="font-semibold text-slate-800 text-sm md:text-base">
                                    {as.title}
                                  </h4>
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
                                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-primary transition">
                                        <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                        <p className="text-[10px] text-slate-500">
                                          Drag file here or click to upload
                                        </p>
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
                        {filteredAssignments.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            No assignments match "{assignmentSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
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
                            <h4 className="font-semibold text-slate-800 text-xs md:text-sm line-clamp-1">
                              {an.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{an.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {user.outstandingFees && user.outstandingFees > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 text-red-950 space-y-3">
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

            {activeTab === "courses" && (
              <motion.div
                key="student-courses-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Academic Course Catalog</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Browse and register for courses available in the current academic semester.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-50 via-white to-emerald-50 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-slate-800 text-sm">Degree Progress</h4>
                        <p className="text-xs text-slate-500">
                          {creditsEarned} of {totalCreditsRequired} credit hours completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-amber-700">{degreeProgressPercent}%</span>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Complete</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-white border border-amber-100 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                      style={{ width: `${degreeProgressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative md:col-span-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by code, title, or instructor..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <select
                        value={catalogDept}
                        onChange={(e) => setCatalogDept(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary"
                      >
                        {catalogDepartments.map((d) => (
                          <option key={d} value={d}>
                            {d === "ALL" ? "All Departments" : d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={catalogSort}
                        onChange={(e) => setCatalogSort(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary"
                      >
                        <option value="code">Sort by Course Code</option>
                        <option value="title">Sort by Title</option>
                        <option value="credits">Sort by Credit Hours (high to low)</option>
                        <option value="enrollment">Sort by Popularity</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3">
                    <span>{catalogCourses.length} course{catalogCourses.length !== 1 ? "s" : ""} found</span>
                    <span>Total credits available: {catalogCourses.reduce((s, c) => s + c.creditHours, 0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalogCourses.map((c) => {
                    const isFull = c.enrolledStudentsCount >= c.capacity;
                    const alreadyIn = isAlreadyRegistered(c.id);
                    const prereqCheck = checkPrerequisites(c);
                    const enrollPercent = Math.round((c.enrolledStudentsCount / c.capacity) * 100);

                    return (
                      <div key={c.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-full ${
                        alreadyIn ? "border-emerald-300" : "border-slate-200"
                      }`}>
                        <div className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-bold bg-blue-50 text-primary px-2.5 py-1 rounded">
                              {c.courseCode}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{c.creditHours} CH</span>
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg text-slate-800 line-clamp-1">
                              {c.courseTitle}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Instructor: {c.instructorName}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{c.description}</p>
                          {c.prerequisites && c.prerequisites.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                Prerequisites
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {c.prerequisites.map((p, pIdx) => {
                                  const met = !prereqCheck.missing.includes(p);
                                  return (
                                    <span key={pIdx} className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center space-x-1 ${
                                      met ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                                    }`}>
                                      {met ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                      <span>{p}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Enrollment</span>
                              <span>{c.enrolledStudentsCount}/{c.capacity}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  enrollPercent >= 90 ? "bg-red-500" : enrollPercent >= 60 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${enrollPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-500">
                            Enrolled: {c.enrolledStudentsCount}/{c.capacity}
                          </span>
                          {alreadyIn ? (
                            <span className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Registered</span>
                            </span>
                          ) : (
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
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {catalogCourses.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                      No courses match your filters.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "materials" && (
              <motion.div
                key="student-materials-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                      Learning Materials & Handouts
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Access lecture syllabus slides, digital books, and stream video content shared by instructors.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by title, type, or description..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {filteredMaterials.map((m) => {
                      const associatedCourse = courses.find((c) => c.id === m.courseId);
                      const progress = downloadProgress[m.id];
                      const isDownloading = progress !== undefined && progress < 100;
                      return (
                        <div
                          key={m.id}
                          className="p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition"
                        >
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
                            {isDownloading && (
                              <div className="w-full max-w-[200px] h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0 w-full md:w-auto">
                            <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 text-slate-600 font-mono">
                              {m.fileType}
                            </span>
                            <button
                              onClick={() => handleRealDownload(m)}
                              disabled={isDownloading}
                              className="bg-primary hover:bg-primary-600 disabled:opacity-70 text-white p-2.5 rounded-lg flex items-center justify-center transition shadow-sm min-w-[44px] relative overflow-hidden"
                            >
                              {progress !== undefined ? (
                                <span className="text-[10px] font-mono font-bold relative z-10">
                                  {progress < 100 ? `${progress}%` : "✓"}
                                </span>
                              ) : (
                                <Download className="w-4 h-4 relative z-10" />
                              )}
                              {isDownloading && (
                                <div
                                  className="absolute inset-0 bg-emerald-500/60 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMaterials.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        {materials.length === 0
                          ? "No materials available yet."
                          : `No materials match "${materialSearch}"`}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ NEW: Digital Library tab */}
            {activeTab === "library" && (
              <motion.div
                key="student-library-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                      Digital Library & E-Resources
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Browse textbooks, lecture videos, research articles, and curriculum
                      materials published by the University Library Directorate.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by title, author, or ISBN..."
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={libraryType}
                    onChange={(e) => setLibraryType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">All Media Types</option>
                    <option value="BOOK">Digital Books (PDF / ePub)</option>
                    <option value="VIDEO">Video Lectures (MP4)</option>
                    <option value="ARTICLE">Articles & Papers</option>
                    <option value="LECTURE_NOTE">Lecture Slides</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleLibraryResources.map((res) => (
                    <div
                      key={res.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              res.resourceType === "BOOK"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : res.resourceType === "VIDEO"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {res.resourceType} • {res.fileSize}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center space-x-1">
                            <Download className="w-3 h-3" />
                            <span>{res.downloadsCount}</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                            {res.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            By <span className="font-medium text-slate-700">{res.author}</span>
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {res.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {res.category}
                          </span>
                          {res.isbn && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                              ISBN: {res.isbn}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {res.accessLevel === "PUBLIC" ? "🌐 Public" : "🎓 Students Only"}
                        </span>
                        <button
                          onClick={() => handleLibraryDownload(res)}
                          className="bg-primary hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {visibleLibraryResources.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                      {libraryResources.length === 0
                        ? "No library resources have been published yet. Check back soon."
                        : `No resources match your filters.`}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "exams" && (
              <motion.div
                key="student-exams-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Secure Online Examinations
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Participate in scheduled course mid-exams or quizzes. Each examination has a strict active timer.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams
                    .filter((e) => e.status !== "DRAFT" && (e.isPushed || e.status === "ACTIVE" || e.status === "SCHEDULED"))
                    .map((exam) => {
                      const attempt = examAttempts.find(
                        (att) => att.examId === exam.id && att.studentId === user.id
                      );
                      const isAttempted = !!attempt;
                      return (
                        <div key={exam.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                          <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono font-bold bg-amber-50 text-warning px-2.5 py-1 rounded">
                                {exam.courseTitle}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                {exam.isPushed && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>🔥 LIVE PUSHED</span>
                                  </span>
                                )}
                                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{exam.durationMinutes} Mins</span>
                                </div>
                              </div>
                            </div>
                            <h3 className="font-display font-bold text-lg text-slate-800">{exam.examTitle}</h3>
                            <p className="text-xs text-slate-500">
                              Scheduled Date: {new Date(exam.examDate).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-100 line-clamp-3 leading-relaxed">
                              {exam.instructions}
                            </p>
                          </div>
                          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-mono font-bold">
                              Total Marks: {exam.totalMarks}
                            </span>
                            {isAttempted ? (
                              <button
                                onClick={() => setViewingAttempt(attempt)}
                                className="text-xs font-mono font-bold text-primary hover:underline flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>View Results ({attempt?.score}/{exam.totalMarks})</span>
                              </button>
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

            {activeTab === "zoom" && (
              <motion.div
                key="student-zoom-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <StudentZoomLearningHub student={user} enrolledCourses={courses} />
              </motion.div>
            )}

            {activeTab === "grades" && (
              <motion.div
                key="student-grades-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Continuous Assessment & Grades
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    View your academic score sheets, continuous assessment component breakdowns, and verified letter grades.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-display font-bold text-slate-800 text-base">
                        Semester Score Sheet
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {getMyGrades().map((g) => (
                        <div key={g.id} className="p-4 sm:p-6 space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <div>
                              <span className="text-xs font-mono font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">
                                {g.courseCode}
                              </span>
                              <h4 className="font-display font-bold text-slate-800 mt-1.5 text-base md:text-lg">
                                {g.courseTitle}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Credit Hours: {g.creditHours} • Status: {g.status}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex-shrink-0">
                              <div className="text-center border-r border-slate-200 pr-4">
                                <span className="block text-[10px] text-slate-400 font-mono font-bold">GRADE</span>
                                <span className="text-2xl font-display font-bold text-slate-800">
                                  {g.letterGrade}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="block text-[10px] text-slate-400 font-mono font-bold">TOTAL</span>
                                <span className="text-lg font-mono font-bold text-slate-700">
                                  {g.totalGrade}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs font-mono">
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                              <span className="block text-[10px] text-slate-400 uppercase">Assessment (50%)</span>
                              <span className="font-bold text-slate-700">
                                {g.continuousAssessmentScore} / 50
                              </span>
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

                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 text-primary">
                        <Star className="w-5 h-5 fill-current" />
                        <h3 className="font-display font-bold text-slate-800 text-base">
                          Evaluate Instructor Efficiency
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Submit feedback regarding course teaching quality. Your feedback assists the department in quality auditing.
                      </p>
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Select Instructor{" "}
                          {instructors.length > 0 && (
                            <span className="text-slate-400 font-normal">
                              ({instructors.length} available)
                            </span>
                          )}
                        </label>
                        <select
                          value={evaluatorInstructorId || ""}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-primary"
                          onChange={(e) => {
                            setEvaluatorInstructorId(e.target.value);
                            setEvaluationCourseId("");
                          }}
                        >
                          <option value="">-- Choose Instructor --</option>
                          {instructors.length === 0 ? (
                            <option value="" disabled>
                              No instructors available
                            </option>
                          ) : (
                            instructors.map((inst) => (
                              <option key={inst.id} value={inst.id}>
                                {inst.fullName}
                                {inst.department ? ` (${inst.department})` : ""}
                                {inst.role === "DEPARTMENT_HEAD"
                                  ? " — Dept. Head"
                                  : inst.role === "DEAN"
                                  ? " — Dean"
                                  : ""}
                              </option>
                            ))
                          )}
                        </select>
                        {instructors.length === 0 && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            No instructors found in the system. Contact ICT if this is unexpected.
                          </p>
                        )}

                        {evaluatorInstructorId && (
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 mt-2">
                              Select Course
                            </label>
                            <select
                              value={evaluationCourseId}
                              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-primary"
                              onChange={(e) => setEvaluationCourseId(e.target.value)}
                            >
                              <option value="">-- Choose Course --</option>
                              {courses
                                .filter((c) =>
                                  String(c.instructorId) ===
                                  String(evaluatorInstructorId).replace(/\D/g, "")
                                )
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.courseCode} — {c.courseTitle}
                                  </option>
                                ))}
                              {courses.filter(
                                (c) =>
                                  String(c.instructorId) ===
                                  String(evaluatorInstructorId).replace(/\D/g, "")
                              ).length === 0 &&
                                courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.courseCode} — {c.courseTitle}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">
                            Rating: {evaluationRating}/5
                          </label>
                          <div className="flex space-x-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
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
                          disabled={
                            !evaluatorInstructorId ||
                            !evaluationCourseId ||
                            !evaluationFeedback
                          }
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

            {activeTab === "transcript" && (
              <motion.div
                key="student-transcript-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Official Academic Transcript
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Download your generated digital transcript verified with a QR-verification signature.
                  </p>
                </div>

                {user.outstandingFees && user.outstandingFees > 0 ? (
                  <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-xl flex items-start space-x-4 max-w-2xl">
                    <AlertCircle className="w-6 h-6 text-danger mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-display font-bold text-danger text-base">
                        Transcript Locked (UC-S-13 / BR-05)
                      </h4>
                      <p className="text-xs md:text-sm">
                        Academic regulations state that transcripts cannot be generated or released for students with outstanding financial balances. Your current outstanding fee balance is{" "}
                        <strong>{user.outstandingFees} ETB</strong>.
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
                    <div
                      className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-8 max-w-3xl shadow-xl border-t-8 border-t-amber-500 relative overflow-hidden"
                      id="printable-transcript-view"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <UniversitySeal className="w-96 h-96 text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-center border-b-2 border-slate-200/80 pb-6 space-y-2">
                          <div className="flex justify-center mb-2">
                            <UniversitySeal className="w-16 h-16 sm:w-18 sm:h-18 drop-shadow-md" />
                          </div>
                          <h3 className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-slate-950 uppercase">
                            Mekdela Amba University
                          </h3>
                          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-600 font-mono font-bold">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 text-xs border-b border-slate-100 font-sans">
                          <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                            <p>
                              <span className="text-slate-500">Student Name:</span>{" "}
                              <strong className="text-slate-900 font-serif text-sm">{user.fullName}</strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Student ID / Matr.:</span>{" "}
                              <strong className="text-slate-900 font-mono font-bold">{user.studentId}</strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Academic College:</span>{" "}
                              <strong className="text-slate-800">{user.department}</strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Major Program:</span>{" "}
                              <strong className="text-slate-800">{user.program}</strong>
                            </p>
                          </div>
                          <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 md:text-right">
                            <p>
                              <span className="text-slate-500">Issue Date:</span>{" "}
                              <strong className="text-slate-800">
                                {new Date().toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Academic Standing:</span>{" "}
                              <strong className="text-emerald-700 font-bold">Good Standing (Dean's Honor)</strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Cumulative GPA:</span>{" "}
                              <strong className="text-primary-700 font-serif text-base font-bold">
                                {user.cgpa?.toFixed(2)} / 4.00
                              </strong>
                            </p>
                            <p>
                              <span className="text-slate-500">Graduation Status:</span>{" "}
                              <strong className="text-slate-800">In Progress (Year 4, Term II)</strong>
                            </p>
                          </div>
                        </div>

                        <div className="py-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <h4 className="font-serif font-bold text-slate-900 text-sm tracking-wide uppercase">
                              Course Credits & Verified Grade Ledger
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500">
                              Curriculum Code: B.Sc.-SE-2023
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
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
                                    <td className="py-3 px-3 text-center font-mono">
                                      {g.creditHours} ({Math.round(g.creditHours * 1.6)} ECTS)
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <span className="inline-block font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-primary-800 border border-blue-100">
                                        {g.letterGrade}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono font-bold">
                                      {g.gradePoint.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="border-t-2 border-slate-200 pt-6 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                          <div className="text-center space-y-1">
                            <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1">
                              <span className="font-serif italic text-xs text-slate-600">
                                Dr. Befekadu Mengistu
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">
                              Head, Dept. of Software Eng.
                            </p>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/80 bg-amber-50/40 flex flex-col items-center justify-center p-1 shadow-inner">
                              <span className="text-[8px] font-mono font-bold text-amber-800 leading-tight text-center">
                                MAU OFFICIAL REGISTRAR SEAL
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 mt-1">
                              Doc Ref: MAU-TR-{Date.now().toString().slice(-6)}
                            </span>
                          </div>
                          <div className="text-center space-y-1">
                            <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1">
                              <span className="font-serif italic text-xs text-slate-600">
                                Abebech Tadesse, M.Sc.
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">
                              University Registrar Director
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 mt-6 pt-4 flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-[10px] font-mono text-slate-400">
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

            {activeTab === "fees" && (
              <motion.div
                key="student-fees-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Outstanding Semester Fees
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Review your tuition balance and verify online card payments directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <span className="text-xs uppercase text-slate-400 font-mono tracking-widest font-bold">
                      Tuition Fee Due
                    </span>
                    <h3 className="text-3xl font-display font-bold text-slate-900">
                      {user.outstandingFees ? `${user.outstandingFees} ETB` : "0.00 ETB"}
                    </h3>
                    {user.outstandingFees && user.outstandingFees > 0 ? (
                      <div className="bg-red-50 text-danger border border-red-100 p-3.5 rounded-lg text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Outstanding tuition balance blocks course enrollment and transcript download.
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-success border border-emerald-100 p-3.5 rounded-lg text-xs flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>All fees cleared! You have no outstanding balance.</span>
                      </div>
                    )}
                    {user.outstandingFees && user.outstandingFees > 0 && (
                      <button
                        onClick={() => {
                          setPayAmount(user.outstandingFees || 0);
                          setShowPayModal(true);
                        }}
                        className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg text-xs font-semibold transition"
                      >
                        Clear Fees
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 md:col-span-2 text-xs">
                    <h4 className="font-display font-bold text-slate-800 text-sm">
                      Payment Methods & Instructions
                    </h4>
                    <p className="text-slate-500 leading-relaxed">
                      You can pay your tuition online safely using credit card or Telebirr integrations. Verification of payments is completed instantly.
                    </p>
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Bank</span>
                        <strong className="text-slate-800">Commercial Bank of Ethiopia</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Name</span>
                        <strong className="text-slate-800">Mekdela Amba University</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Routing Number (ABA)</span>
                        <strong className="text-slate-800 font-mono">CBETETAA</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-mono">Account Number</span>
                        <strong className="text-slate-800 font-mono">1000-2345-6789-01</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {showPayModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
                      <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">
                        Secure Card Payment
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-medium">
                            Payment Amount (ETB)
                          </label>
                          <input
                            type="number"
                            className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                            value={payAmount}
                            onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-medium">
                            Credit Card Number
                          </label>
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

            {activeTab === "copilot" && (
              <motion.div
                key="student-copilot-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <SmartAICopilot user={user} />
              </motion.div>
            )}

            {activeTab === "clearance" && (
              <motion.div
                key="student-clearance-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <SmartClearancePortal user={user} />
              </motion.div>
            )}

            {activeTab === "facilities" && (
              <motion.div
                key="student-facilities-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <SmartCampusFacilities user={user} />
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div
                key="student-alerts-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <SmartCampusAlerts user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ACTIVE EXAM OVERLAY */}
      {currentExam && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-slate-200">
            <div className="university-gradient text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-amber-500/20">
              <div className="flex items-center space-x-3 min-w-0">
                <UniversitySeal className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-mono text-amber-300 tracking-widest uppercase font-bold truncate">{currentExam.courseTitle}</p>
                  <h3 className="text-base sm:text-xl font-display font-bold mt-0.5 text-slate-100 truncate">{currentExam.examTitle}</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-amber-500/30 self-start sm:self-auto shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="font-mono text-base sm:text-lg font-bold text-amber-400">{formatTime(examTimeRemaining)}</span>
              </div>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto space-y-5 sm:space-y-8 flex-1">
              <div className="bg-amber-50/80 border border-amber-200 text-amber-950 p-3 sm:p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs sm:text-sm">
                  <strong>Academic Testing Instructions:</strong>{" "}
                  {currentExam.instructions || "Do not refresh the page. The exam will submit automatically upon expiration."}
                </p>
              </div>

              {(currentExam.questions || []).map((q, qIdx) => (
                <div key={qIdx} className="border-b border-slate-100 pb-5 sm:pb-6 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-800 flex-1">
                      Question {qIdx + 1}: <span className="font-normal text-slate-700">{q.questionText}</span>
                    </h4>
                    <span className="text-[10px] sm:text-xs font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-bold border border-slate-200 shrink-0">
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
                      {(q.options || []).map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(qIdx, opt)}
                          className={`flex items-center space-x-3 p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition ${
                            examAnswers[qIdx] === opt
                              ? "bg-blue-50 border-primary-600 text-primary-700 shadow-xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              examAnswers[qIdx] === opt ? "border-primary bg-primary text-white" : "border-slate-300"
                            }`}
                          >
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

            <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                Answered <strong className="text-slate-800">{Object.keys(examAnswers).length}</strong> of{" "}
                {currentExam.questions.length} questions
              </span>
              <button
                onClick={submitExamManual}
                className="university-gradient hover:opacity-95 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-md border border-amber-400/20 w-full sm:w-auto"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <ExamResultsModal
        exam={exams.find((e) => e.id === viewingAttempt?.examId) ?? null}
        attempt={viewingAttempt}
        onClose={() => setViewingAttempt(null)}
      />

      <AcademicFooter />
    </div>
  );
}