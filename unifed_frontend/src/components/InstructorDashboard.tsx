import { useState, useEffect, ChangeEvent } from "react";
import { User, Course, CourseMaterial, Announcement, Assignment, Submission, Exam, ExamAttempt, Grade, Question } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter, UniversitySeal } from "./UniversityHeader";
import { SmartCampusFacilities } from "./SmartCampusFacilities";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import { CourseMaterialModal } from "./CourseMaterialModal";
import { ExamSubmissionsModal } from "./ExamSubmissionsModal";
import { downloadCourseMaterial } from "../utils/fileDownloader";
import {
  BookOpen, FileText, PlusCircle, Award, AlertTriangle, Users, Volume2, Calendar, CheckCircle2,
  ChevronRight, Activity, BrainCircuit, Sparkles, Send, Trash, Layout, Check, Shield, Cpu,
  Radio, Video, Clock, Upload, Eye, Download, Play, Pause, HelpCircle, CheckCircle, FileUp,
  FilePlus, Copy, Rocket, CheckSquare, Layers, Search, Filter, Plus, ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InstructorZoomManager } from "./InstructorZoomManager";

interface InstructorDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function InstructorDashboard({ user, onLogout }: InstructorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "assignments" | "exams" | "grades" | "attendance" | "analytics" | "facilities" | "alerts" | "zoom">("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);

  // Selected course context (defaults to SOFT401)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("C_SOFT401");

  // Material Creation State (Enhanced with PDF/DOCX file attachments)
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialType, setNewMaterialType] = useState<"PDF" | "Video" | "Document" | "Slide">("PDF");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");
  const [newMaterialFileName, setNewMaterialFileName] = useState("");
  const [newMaterialFileSize, setNewMaterialFileSize] = useState("");
  const [newMaterialFileData, setNewMaterialFileData] = useState("");
  const [newMaterialChapter, setNewMaterialChapter] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<CourseMaterial | null>(null);
  const [materialFilterFormat, setMaterialFilterFormat] = useState<string>("ALL");

  // Announcement State
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceContent, setNewAnnounceContent] = useState("");

  // Assignment State
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignDueDate, setNewAssignDueDate] = useState("2026-07-15T23:59");
  const [newAssignDesc, setNewAssignDesc] = useState("");

  // Exam Authoring & Push Center State
  const [examSubTab, setExamSubTab] = useState<"author" | "manage" | "ai">("author");
  const [authorExamTitle, setAuthorExamTitle] = useState("");
  const [authorExamCategory, setAuthorExamCategory] = useState<"MID_EXAM" | "FINAL_EXAM" | "QUIZ" | "PRACTICE">("MID_EXAM");
  const [authorExamDuration, setAuthorExamDuration] = useState<number>(30);
  const [authorExamInstructions, setAuthorExamInstructions] = useState("Answer all questions carefully. The countdown timer runs in real-time. Continuous auto-save is enabled.");
  const [authorQuestions, setAuthorQuestions] = useState<Question[]>([
    {
      questionText: "What is the primary architectural purpose of an API Gateway in distributed university platforms?",
      questionType: "MCQ",
      options: [
        "Unified request routing, SSL termination, and rate limiting",
        "Disabling all client credentials and authentication",
        "Storing monolithic frontend HTML directly in database",
        "Bypassing network security firewalls without SSL"
      ],
      correctAnswer: "Unified request routing, SSL termination, and rate limiting",
      marks: 5
    },
    {
      questionText: "True or False: In Mekdela Amba University grading policy, continuous assessment accounts for 50% of the course grade.",
      questionType: "TF",
      options: ["True", "False"],
      correctAnswer: "True",
      marks: 5
    },
    {
      questionText: "Which database index structure provides logarithmic time complexity O(log N) for equality and range queries?",
      questionType: "MCQ",
      options: [
        "B-Tree Index",
        "Linear Linked List",
        "Unsorted Heap Array",
        "Random Shuffle Buffer"
      ],
      correctAnswer: "B-Tree Index",
      marks: 5
    },
    {
      questionText: "Which HTTP status code signifies that an asynchronous transaction or batch job has been accepted for processing but is not yet completed?",
      questionType: "MCQ",
      options: [
        "202 Accepted",
        "200 OK",
        "301 Moved Permanently",
        "400 Bad Request"
      ],
      correctAnswer: "202 Accepted",
      marks: 5
    }
  ]);
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<Exam | null>(null);

  // Manual Exam Creation State (legacy fallback)
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamInstructions, setNewExamInstructions] = useState("");

  // Smart Exam Generator State
  const [smartTopic, setSmartTopic] = useState("");
  const [smartQty, setSmartQty] = useState(4);
  const [smartDifficulty, setSmartDifficulty] = useState("Medium");
  const [generatingExam, setGeneratingExam] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Attendance Ledger
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
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string>("U_ST03");
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [calculatingPredictor, setCalculatingPredictor] = useState(false);

  useEffect(() => {
    loadData();

    const handleMaterialsChange = async () => {
      const data = await CampusDatabase.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    };
    const handleExamsChange = async () => {
      const data = await CampusDatabase.getExams();
      setExams(Array.isArray(data) ? data : []);
    };
    const handleAttemptsChange = async () => {
      const data = await CampusDatabase.getExamAttempts();
      setExamAttempts(Array.isArray(data) ? data : []);
    };

    window.addEventListener("uscms_materials_changed", handleMaterialsChange);
    window.addEventListener("uscms_exams_changed", handleExamsChange);
    window.addEventListener("uscms_exam_attempts_changed", handleAttemptsChange);

    return () => {
      window.removeEventListener("uscms_materials_changed", handleMaterialsChange);
      window.removeEventListener("uscms_exams_changed", handleExamsChange);
      window.removeEventListener("uscms_exam_attempts_changed", handleAttemptsChange);
    };
  }, []);

  const loadData = async () => {
    try {
      const [
        coursesData, materialsData, announcementsData, assignmentsData,
        submissionsData, examsData, gradesData, attemptsData,
      ] = await Promise.all([
        CampusDatabase.getCourses(),
        CampusDatabase.getMaterials(),
        CampusDatabase.getAnnouncements(),
        CampusDatabase.getAssignments(),
        CampusDatabase.getSubmissions(),
        CampusDatabase.getExams(),
        CampusDatabase.getGrades(),
        CampusDatabase.getExamAttempts(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData.filter((c) => c.instructorId === user.id) : []);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setExams(Array.isArray(examsData) ? examsData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setExamAttempts(Array.isArray(attemptsData) ? attemptsData : []);
    } catch (err) {
      console.error("Failed to load instructor data:", err);
    }
  };

  const getActiveCourse = () => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  };

  // Add Announcement
  const handlePostAnnouncement = async () => {
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
    await CampusDatabase.saveAnnouncements(updatedAnn);
    setAnnouncements(updatedAnn);

    await CampusDatabase.addAuditLog(
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

  // File selection for course materials
  const handleMaterialFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const formattedSize = file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

    setNewMaterialFileName(file.name);
    setNewMaterialFileSize(formattedSize);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      setNewMaterialType("PDF");
    } else if (ext === "docx" || ext === "doc") {
      setNewMaterialType("Document");
    } else if (ext === "pptx" || ext === "ppt") {
      setNewMaterialType("Slide");
    }

    if (!newMaterialTitle) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setNewMaterialTitle(cleanTitle);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewMaterialFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertSamplePdf = () => {
    setNewMaterialTitle("Chapter 3: Object-Oriented System Architecture & Design Patterns");
    setNewMaterialType("PDF");
    setNewMaterialFileName("SWE401_Chapter3_OOA_Architecture.pdf");
    setNewMaterialFileSize("2.8 MB");
    setNewMaterialChapter("Week 3 • Architectural Patterns");
    setNewMaterialDesc("Comprehensive PDF slides and class notes detailing GoF structural patterns, sequence diagrams, and microservice boundary contexts.");
  };

  const handleInsertSampleDocx = () => {
    setNewMaterialTitle("Microservices & Distributed Transactions Comprehensive Guide");
    setNewMaterialType("Document");
    setNewMaterialFileName("SWE401_Microservices_Transactions_Guide.docx");
    setNewMaterialFileSize("1.6 MB");
    setNewMaterialChapter("Week 5 • Distributed Systems");
    setNewMaterialDesc("Microsoft Word (.docx) laboratory study manual covering saga patterns, two-phase commits, idempotency tokens, and Kafka message brokers.");
  };

  // Add Materials
  const handleAddMaterial = async () => {
    if (!newMaterialTitle.trim()) {
      alert("Please provide a material title.");
      return;
    }
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const ext = newMaterialType === "PDF" ? "pdf" : newMaterialType === "Document" ? "docx" : "pptx";
    const generatedFileName = newMaterialFileName || `${newMaterialTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;

    const newMat: CourseMaterial = {
      id: "MAT_" + Date.now(),
      courseId: activeCourse.id,
      title: newMaterialTitle,
      fileType: newMaterialType,
      fileName: generatedFileName,
      fileSize: newMaterialFileSize || (newMaterialType === "PDF" ? "2.4 MB" : newMaterialType === "Document" ? "1.8 MB" : "3.1 MB"),
      fileData: newMaterialFileData || undefined,
      chapterWeek: newMaterialChapter || "Chapter Resource",
      instructorName: user.fullName,
      uploadedAt: new Date().toISOString(),
      description: newMaterialDesc || `Official instructional material for ${activeCourse.courseTitle}. Review prior to scheduled assessments.`
    };

    const updatedMats = await CampusDatabase.addMaterial(newMat);
    setMaterials(Array.isArray(updatedMats) ? updatedMats : [newMat, ...materials]);

    await CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      "Upload Material",
      "CourseMaterial",
      newMat.id,
      `Uploaded course handout (${newMaterialType}): ${newMaterialTitle}`
    );

    setNewMaterialTitle("");
    setNewMaterialDesc("");
    setNewMaterialFileName("");
    setNewMaterialFileSize("");
    setNewMaterialFileData("");
    setNewMaterialChapter("");
    alert(`Resource "${newMat.title}" (${newMat.fileType}) uploaded successfully! Students can now download or preview this file.`);
  };

  // Exam Authoring Helpers
  const handleAddQuestion = () => {
    const newQ: Question = {
      questionText: "",
      questionType: "MCQ",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      marks: 5
    };
    setAuthorQuestions([...authorQuestions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const updatedQuestions = [...authorQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updated };
    setAuthorQuestions(updatedQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    if (authorQuestions.length <= 1) {
      alert("An exam must contain at least one question.");
      return;
    }
    setAuthorQuestions(authorQuestions.filter((_, i) => i !== index));
  };

  const handleLoadSampleExam = () => {
    setAuthorExamTitle("Distributed Systems & Cloud Architecture Midterm Exam");
    setAuthorExamDuration(30);
    setAuthorExamCategory("MID_EXAM");
    setAuthorExamInstructions("Answer all questions. Strict 30-minute timer. Auto-saves continuously. Preliminary scores are evaluated immediately upon submission.");
    setAuthorQuestions([
      {
        questionText: "What is the primary architectural purpose of an API Gateway in distributed university platforms?",
        questionType: "MCQ",
        options: [
          "Unified request routing, SSL termination, and rate limiting",
          "Disabling all client credentials and authentication",
          "Storing monolithic frontend HTML directly in database",
          "Bypassing network security firewalls without SSL"
        ],
        correctAnswer: "Unified request routing, SSL termination, and rate limiting",
        marks: 5
      },
      {
        questionText: "True or False: In Mekdela Amba University grading policy, continuous assessment accounts for 50% of the course grade.",
        questionType: "TF",
        options: ["True", "False"],
        correctAnswer: "True",
        marks: 5
      },
      {
        questionText: "Which database index structure provides logarithmic time complexity O(log N) for equality and range queries?",
        questionType: "MCQ",
        options: [
          "B-Tree Index",
          "Linear Linked List",
          "Unsorted Heap Array",
          "Random Shuffle Buffer"
        ],
        correctAnswer: "B-Tree Index",
        marks: 5
      },
      {
        questionText: "Which HTTP status code signifies that an asynchronous transaction or batch job has been accepted for processing but is not yet completed?",
        questionType: "MCQ",
        options: [
          "202 Accepted",
          "200 OK",
          "301 Moved Permanently",
          "400 Bad Request"
        ],
        correctAnswer: "202 Accepted",
        marks: 5
      }
    ]);
  };

  const handlePushExam = async (publishImmediately: boolean = true) => {
    if (!authorExamTitle.trim()) {
      alert("Please enter an Exam Title.");
      return;
    }
    if (authorQuestions.length === 0) {
      alert("Please add at least one question.");
      return;
    }
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const totalMarks = authorQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);

    const newExam: Exam = {
      id: "EX_" + Date.now(),
      courseId: activeCourse.id,
      courseTitle: activeCourse.courseTitle,
      examTitle: authorExamTitle,
      examDate: new Date().toISOString(),
      durationMinutes: authorExamDuration,
      totalMarks: totalMarks,
      instructions: authorExamInstructions,
      questions: authorQuestions,
      status: publishImmediately ? "ACTIVE" : "DRAFT",
      isPushed: publishImmediately,
      pushedAt: publishImmediately ? new Date().toISOString() : undefined,
      createdBy: user.fullName,
      category: authorExamCategory
    };

    const currentExams = await CampusDatabase.getExams();
    const updated = [newExam, ...(Array.isArray(currentExams) ? currentExams : [])];
    await CampusDatabase.saveExams(updated);
    setExams(updated);

    await CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      publishImmediately ? "Push Exam" : "Create Exam Draft",
      "Exam",
      newExam.id,
      `${publishImmediately ? "Pushed live exam to students" : "Saved draft exam"}: ${authorExamTitle} (${authorExamDuration} mins) in ${activeCourse.courseCode}`
    );

    alert(
      publishImmediately
        ? `🚀 Exam "${authorExamTitle}" has been pushed LIVE to students!\nDuration: ${authorExamDuration} ደቂቃ (Minutes).\nStudents can now take it immediately in their Online Examination portal!`
        : `Exam draft saved successfully!`
    );

    setAuthorExamTitle("");
    setExamSubTab("manage");
  };

  const handleTogglePush = async (exam: Exam) => {
    const nextPushed = !exam.isPushed;
    const updated = await CampusDatabase.pushExam(exam.id, nextPushed);
    setExams(Array.isArray(updated) ? updated : exams);

    await CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      "INSTRUCTOR",
      nextPushed ? "Push Exam" : "Unpublish Exam",
      "Exam",
      exam.id,
      `${nextPushed ? "Pushed" : "Unpublished"} exam: ${exam.examTitle}`
    );
  };

  const handleCopyAiQuestionsToBuilder = () => {
    if (generatedQuestions.length === 0) return;
    setAuthorExamTitle(`Smart Assessment: ${smartTopic || "Course Exam"} (${smartDifficulty})`);
    setAuthorQuestions(generatedQuestions);
    setExamSubTab("author");
    alert("AI questions loaded into Exam Builder! You can now adjust the duration in minutes (ደቂቃ), review questions, and click 'Push Live to Students'.");
  };

  // Add Assignment
  const handleAddAssignment = async () => {
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
    await CampusDatabase.saveAssignments(updatedAs);
    setAssignments(updatedAs);

    await CampusDatabase.addAuditLog(
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
  const handleGradeSubmission = async () => {
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

    await CampusDatabase.saveSubmissions(updatedSubmissions);
    setSubmissions(updatedSubmissions);

    const currentGrades = await CampusDatabase.getGrades();
    const gradeList = Array.isArray(currentGrades) ? currentGrades : [];
    const studentGrade = gradeList.find(
      (g) => g.studentId === selectedSubmission.studentId && g.courseId === selectedSubmission.courseId
    );

    if (studentGrade) {
      studentGrade.continuousAssessmentScore = parseFloat(((gradingScore / 100) * 50).toFixed(1));
      studentGrade.totalGrade = studentGrade.continuousAssessmentScore + studentGrade.midExamScore + studentGrade.finalExamScore;
      await CampusDatabase.saveGrades(gradeList);
      setGrades(gradeList);
    }

    await CampusDatabase.addAuditLog(
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
    await loadData();
  };

  // Submit Final Grade
  const handleSubmitFinalGrade = async (gradeId: string) => {
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const gradeObj = grades.find((g) => g.id === gradeId);
    if (!gradeObj) return;

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

    await CampusDatabase.saveGrades(updatedGrades);
    setGrades(updatedGrades);

    await CampusDatabase.addAuditLog(
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

  // Smart Exam Generator via real API
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
      alert("Error generating questions: " + (err?.message || "Unknown error"));
    } finally {
      setGeneratingExam(false);
    }
  };

  // Save the generated exam
  const handleSaveGeneratedExam = async () => {
    if (generatedQuestions.length === 0) return;
    const activeCourse = getActiveCourse();
    if (!activeCourse) return;

    const totalMarks = generatedQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);

    const newExam: Exam = {
      id: "EX_" + Date.now(),
      courseId: activeCourse.id,
      courseTitle: activeCourse.courseTitle,
      examTitle: `Smart Exam: ${smartTopic} (${smartDifficulty})`,
      examDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 60,
      totalMarks: totalMarks,
      instructions: "This exam was dynamically modeled and audited using the server-side Gemini AI engine. All standard testing regulations apply.",
      status: "SCHEDULED",
      questions: generatedQuestions
    };

    const currentExams = await CampusDatabase.getExams();
    const updated = [newExam, ...(Array.isArray(currentExams) ? currentExams : [])];
    await CampusDatabase.saveExams(updated);
    setExams(updated);

    await CampusDatabase.addAuditLog(
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

  // Run AI Dropout Risk Predictor via real API
  const handlePredictDropoutRisk = async () => {
    setCalculatingPredictor(true);
    setAnalyticsResult(null);

    try {
      const result: any = await CampusDatabase.predictStudentRisk(analyzingStudentId);

      const mapped = {
        status: result.classification === "HIGH_RISK" ? "At-Risk"
              : result.classification === "MODERATE_RISK" ? "At-Risk"
              : "Not At-Risk",
        riskProbability: ((result.dropoutProbability || 0) * 100).toFixed(1),
        metrics: {
          attendance: result.attendancePercentage ?? 0,
          grade: result.continuousAssessmentAvg ?? 0,
          submissions: result.continuousAssessmentAvg ?? 0,
          library: "N/A",
        },
        feedback: result.recommendedAction || "No further action.",
        interventions: result.keyRiskFactors || [],
      };
      setAnalyticsResult(mapped);
    } catch (err) {
      console.error(err);
      alert("Failed to compute risk prediction. Check the console.");
    } finally {
      setCalculatingPredictor(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="instructor_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Faculty Academic Management Console"
        portalSubtitle="Department of Software Engineering • Academic Staff Directorate"
        badgeText={user.department ? `${user.department} FACULTY` : "FACULTY"}
        badgeType="faculty"
      />

      <div className="flex-1 flex" id="instructor_workspace_inner">
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
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
              onClick={() => setActiveTab("zoom")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "zoom"
                  ? "bg-primary text-white border border-blue-400/30 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Video className="w-4 h-4 text-blue-400" />
                <span>Zoom Live Teaching</span>
              </div>
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </span>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "exams"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>Exams & Push Portal</span>
              </div>
              {exams.filter((e) => e.isPushed || e.status === "ACTIVE").length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  {exams.filter((e) => e.isPushed || e.status === "ACTIVE").length} Live
                </span>
              )}
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

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Operations
              </span>
            </div>

            <button
              onClick={() => setActiveTab("facilities")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "facilities"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Lab & Hall Bookings</span>
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
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Faculty ID: <span className="text-amber-400">INST001</span></p>
            <p>Dept Chair: Dr. Befekadu</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">Status: Teaching Active</p>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
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

                <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      <Video className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">MAU VIRTUAL CLASSROOM</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Online Zoom Teaching & Virtual Lectures</h3>
                      <p className="text-xs text-blue-200">Start instant live classes, share slides, manage student chat & take attendance.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("zoom")}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Open Zoom Teaching Hub</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {activeTab === "materials" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-materials-tab"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-6 h-6 text-primary" />
                      <span>Course Materials & Syllabus Handouts</span>
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Upload and publish lecture slides (.pdf), Word study guides (.docx), and handouts for {getActiveCourse()?.courseCode}: {getActiveCourse()?.courseTitle}.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInsertSamplePdf}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Quick Sample PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertSampleDocx}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Quick Sample DOCX</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-primary" />
                        <span>Upload Course Handout</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                        PDF & DOCX Ready
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700">Material Title *</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          placeholder="e.g. Chapter 4: Microservices & Domain Events"
                          value={newMaterialTitle}
                          onChange={(e) => setNewMaterialTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-semibold text-slate-700">
                          Attach Document File (.pdf, .docx, .doc, .pptx)
                        </label>
                        <label className="border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/80 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                            onChange={handleMaterialFileUpload}
                            className="hidden"
                          />
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary transition mb-1" />
                          {newMaterialFileName ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 text-xs block truncate max-w-[200px]">
                                {newMaterialFileName}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-600 font-semibold block">
                                {newMaterialFileSize} • Ready to upload
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-slate-700 block">
                                Click or drag file to attach
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                PDF, Microsoft Word (DOCX), Slides
                              </span>
                            </div>
                          )}
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700">Format</label>
                          <select
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-xs font-medium"
                            value={newMaterialType}
                            onChange={(e) => setNewMaterialType(e.target.value as any)}
                          >
                            <option value="PDF">PDF Presentation</option>
                            <option value="Document">Word Document (.docx)</option>
                            <option value="Slide">Lecture Slides (.pptx)</option>
                            <option value="Video">Video Lecture URL</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700">Chapter / Week</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                            placeholder="e.g. Week 4"
                            value={newMaterialChapter}
                            onChange={(e) => setNewMaterialChapter(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700">Description & Syllabus Targets</label>
                        <textarea
                          rows={3}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          placeholder="Specify chapter concepts, prerequisites, or reading goals..."
                          value={newMaterialDesc}
                          onChange={(e) => setNewMaterialDesc(e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer text-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Publish Handout to Students</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-display font-bold text-slate-800 text-base">Published Resources</h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {materials.filter((m) => m.courseId === selectedCourseId).length} Resources active in {getActiveCourse()?.courseCode}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-[11px] font-medium">
                        {["ALL", "PDF", "Document", "Slide"].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setMaterialFilterFormat(fmt)}
                            className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${
                              materialFilterFormat === fmt
                                ? "bg-white text-slate-900 shadow-2xs font-bold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {fmt === "ALL" ? "All Formats" : fmt === "Document" ? "DOCX" : fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto pr-1 space-y-2">
                      {materials
                        .filter((m) => m.courseId === selectedCourseId)
                        .filter((m) => (materialFilterFormat === "ALL" ? true : m.fileType === materialFilterFormat))
                        .map((m) => {
                          const isPdf = m.fileType === "PDF" || m.fileName?.endsWith(".pdf");
                          const isDocx = m.fileType === "Document" || m.fileName?.endsWith(".docx");

                          return (
                            <div
                              key={m.id}
                              className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span
                                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                                      isPdf
                                        ? "bg-red-100 text-red-700 border border-red-200"
                                        : isDocx
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-amber-100 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {isPdf ? "PDF" : isDocx ? "DOCX" : m.fileType}
                                  </span>

                                  {m.chapterWeek && (
                                    <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      {m.chapterWeek}
                                    </span>
                                  )}

                                  <span className="text-[10px] font-mono text-slate-400">
                                    {m.fileSize || "1.8 MB"}
                                  </span>

                                  <span className="text-[10px] font-mono text-slate-400">
                                    • {new Date(m.uploadedAt).toLocaleDateString()}
                                  </span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.description}</p>
                              </div>

                              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewMaterial(m)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="w-3.5 h-3.5 text-primary" />
                                  <span>Preview</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => downloadCourseMaterial(m.title, m.fileName, m.fileType, m.fileData, m.description)}
                                  className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to remove "${m.title}"?`)) {
                                      const updated = materials.filter((x) => x.id !== m.id);
                                      await CampusDatabase.saveMaterials(updated);
                                      setMaterials(updated);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                  title="Delete Resource"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {materials.filter((m) => m.courseId === selectedCourseId).length === 0 && (
                        <div className="text-center py-12 text-slate-400 space-y-2">
                          <FileText className="w-10 h-10 mx-auto text-slate-200" />
                          <p className="text-xs">No materials uploaded yet for this course. Use the form on the left or the sample buttons above to add PDF or DOCX handouts.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

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

            {activeTab === "exams" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="instructor-exams-tab"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                      <CheckSquare className="w-6 h-6 text-primary" />
                      <span>Exam Preparation & Live Push Portal</span>
                    </h2>
                    <p className="text-slate-500 text-sm">
                      ፈተና አዘጋጅቶ ደቂቃውን ሞልቶ Push ማድረጊያ — Create exams, configure duration in minutes (ደቂቃ), and push live to enrolled students.
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setExamSubTab("manage")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        examSubTab === "manage"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ListChecks className="w-3.5 h-3.5 text-primary" />
                      <span>Pushed Exams ({exams.filter((e) => e.courseId === selectedCourseId).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamSubTab("author")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        examSubTab === "author"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exam Builder (ደቂቃ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamSubTab("ai")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        examSubTab === "ai"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gemini AI Modeler</span>
                    </button>
                  </div>
                </div>

                {examSubTab === "manage" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                      <div>
                        <h3 className="font-display font-bold text-slate-800 text-sm">
                          Course Assessments for {getActiveCourse()?.courseCode}: {getActiveCourse()?.courseTitle}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Click "Push to Students" to broadcast an assessment live into the student Online Examination console.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadSampleExam();
                            setExamSubTab("author");
                          }}
                          className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Load Midterm Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamSubTab("author")}
                          className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create New Exam</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {exams
                        .filter((ex) => ex.courseId === selectedCourseId)
                        .map((ex) => {
                          const isPushed = ex.isPushed || ex.status === "ACTIVE";
                          const attemptsForThisExam = examAttempts.filter((a) => a.examId === ex.id);

                          return (
                            <div
                              key={ex.id}
                              className={`p-5 rounded-2xl border transition bg-white shadow-xs ${
                                isPushed ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200"
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span
                                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                        isPushed
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isPushed ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                        }`}
                                      />
                                      <span>{isPushed ? "LIVE / PUSHED TO STUDENTS" : "DRAFT / UNPUSHED"}</span>
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono font-bold uppercase">
                                      {ex.category || "EXAM"}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-mono font-bold flex items-center space-x-1">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>{ex.durationMinutes} ደቂቃ (Mins)</span>
                                    </span>

                                    <span className="text-xs text-slate-500 font-mono">
                                      {ex.questions?.length || 0} Questions • Total {ex.totalMarks} Marks
                                    </span>
                                  </div>

                                  <h4 className="text-base font-display font-bold text-slate-900">{ex.examTitle}</h4>
                                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{ex.instructions}</p>

                                  {ex.pushedAt && (
                                    <p className="text-[10px] font-mono text-emerald-700 font-medium">
                                      🚀 Pushed to students on: {new Date(ex.pushedAt).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedExamForSubmissions(ex)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-primary" />
                                    <span>Submissions ({attemptsForThisExam.length})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePush(ex)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs ${
                                      isPushed
                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    }`}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{isPushed ? "Unpublish / Recall" : "Push Live to Students"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Delete exam "${ex.examTitle}"?`)) {
                                        const updated = exams.filter((x) => x.id !== ex.id);
                                        await CampusDatabase.saveExams(updated);
                                        setExams(updated);
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    title="Delete Exam"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {exams.filter((ex) => ex.courseId === selectedCourseId).length === 0 && (
                        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400 space-y-3">
                          <CheckSquare className="w-12 h-12 mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">No exams authored for this course yet</p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Use the Exam Builder to prepare questions, specify the timer in minutes (ደቂቃ), and push directly to students.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadSampleExam();
                              setExamSubTab("author");
                            }}
                            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                          >
                            Load Sample Midterm & Push
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {examSubTab === "author" && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="font-display font-bold text-slate-800 text-lg">
                            Exam Authoring Studio (ፈተና አዘጋጅቶ ደቂቃውን ሞልቶ Push ማድረጊያ)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Configure assessment parameters, timer duration in minutes (ደቂቃ), question marks, and push live.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleLoadSampleExam}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>Fill with Standard Midterm</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="md:col-span-2 space-y-1">
                          <label className="block font-semibold text-slate-700">Exam Title *</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="e.g. Distributed Systems & Cloud Midterm Examination"
                            value={authorExamTitle}
                            onChange={(e) => setAuthorExamTitle(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700">Assessment Category</label>
                          <select
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-xs font-medium"
                            value={authorExamCategory}
                            onChange={(e) => setAuthorExamCategory(e.target.value as any)}
                          >
                            <option value="MID_EXAM">Midterm Exam (50%)</option>
                            <option value="FINAL_EXAM">Final Exam (50%)</option>
                            <option value="QUIZ">Quiz Assessment</option>
                            <option value="TEST">Laboratory Test</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="block font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>የፈተናው የጊዜ ርዝማኔ በደቂቃ (Exam Duration in Minutes) *</span>
                          </label>
                          <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {authorExamDuration} ደቂቃ (Minutes)
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={5}
                            max={240}
                            step={5}
                            className="w-28 border border-amber-300 bg-white rounded-xl p-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
                            value={authorExamDuration}
                            onChange={(e) => setAuthorExamDuration(Math.max(5, parseInt(e.target.value) || 10))}
                          />
                          <span className="text-xs font-medium text-amber-900">ደቂቃ</span>

                          <div className="flex items-center space-x-1.5 ml-auto flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-amber-700 mr-1">Presets:</span>
                            {[15, 20, 30, 45, 60, 90, 120].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setAuthorExamDuration(mins)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                                  authorExamDuration === mins
                                    ? "bg-amber-600 text-white shadow-2xs"
                                    : "bg-white/80 hover:bg-white text-amber-900 border border-amber-200"
                                }`}
                              >
                                {mins} ደቂቃ
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="block font-semibold text-slate-700">Instructions to Candidates</label>
                        <textarea
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                          placeholder="Instructions, academic integrity policy, continuous auto-saving details..."
                          value={authorExamInstructions}
                          onChange={(e) => setAuthorExamInstructions(e.target.value)}
                        />
                      </div>

                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
                            <span>Questions Pool</span>
                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              {authorQuestions.length} Questions • Total {authorQuestions.reduce((sum, q) => sum + (q.marks || 5), 0)} Marks
                            </span>
                          </h4>

                          <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Question</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {authorQuestions.map((q, qIndex) => (
                            <div key={qIndex} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                                    {qIndex + 1}
                                  </span>
                                  <span>Question {qIndex + 1}</span>
                                </span>

                                <div className="flex items-center space-x-2">
                                  <select
                                    className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-medium"
                                    value={q.questionType}
                                    onChange={(e) => {
                                      const nextType = e.target.value as "MCQ" | "TF";
                                      handleUpdateQuestion(qIndex, {
                                        questionType: nextType,
                                        options: nextType === "TF" ? ["True", "False"] : ["Option A", "Option B", "Option C", "Option D"],
                                        correctAnswer: nextType === "TF" ? "True" : "Option A"
                                      });
                                    }}
                                  >
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="TF">True / False</option>
                                  </select>

                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={50}
                                      className="w-14 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-mono font-bold text-center"
                                      value={q.marks || 5}
                                      onChange={(e) =>
                                        handleUpdateQuestion(qIndex, { marks: Math.max(1, parseInt(e.target.value) || 5) })
                                      }
                                    />
                                    <span className="text-[10px] font-semibold text-slate-500">Marks</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(qIndex)}
                                    className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                                    title="Remove Question"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-xs font-medium focus:ring-2 focus:ring-primary/20"
                                placeholder="Enter question stem here..."
                                value={q.questionText}
                                onChange={(e) => handleUpdateQuestion(qIndex, { questionText: e.target.value })}
                              />

                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] uppercase font-bold text-slate-500">
                                  Options (Select radio button for the correct key answer):
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {q.options?.map((opt, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                                        q.correctAnswer === opt
                                          ? "bg-emerald-50/80 border-emerald-300"
                                          : "bg-white border-slate-200"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`correct_${qIndex}`}
                                        checked={q.correctAnswer === opt}
                                        onChange={() => handleUpdateQuestion(qIndex, { correctAnswer: opt })}
                                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        disabled={q.questionType === "TF"}
                                        className="w-full border-none p-0 text-xs font-medium bg-transparent focus:ring-0"
                                        value={opt}
                                        onChange={(e) => {
                                          const newOpts = [...(q.options || [])];
                                          const oldVal = newOpts[optIndex];
                                          newOpts[optIndex] = e.target.value;
                                          const updatedCorrect = q.correctAnswer === oldVal ? e.target.value : q.correctAnswer;
                                          handleUpdateQuestion(qIndex, { options: newOpts, correctAnswer: updatedCorrect });
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handlePushExam(false)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Save as Draft (Unpushed)
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePushExam(true)}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          <span>🚀 Push Live to Students ({authorExamDuration} ደቂቃ)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {examSubTab === "ai" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
                      <h3 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>AI Question Parameters</span>
                      </h3>
                      <div className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label className="block font-medium text-slate-600">Topic Outline / Learning Objective</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                            placeholder="e.g. Unified Modeling Language Diagrams"
                            value={smartTopic}
                            onChange={(e) => setSmartTopic(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-medium text-slate-600">Quantity of Questions</label>
                          <select
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-mono"
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
                                type="button"
                                onClick={() => setSmartDifficulty(lvl)}
                                className={`py-2 rounded-xl font-semibold text-center transition cursor-pointer ${
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
                          type="button"
                          onClick={handleGenerateSmartExam}
                          disabled={generatingExam}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition disabled:bg-slate-200 disabled:text-slate-400 shadow-xs cursor-pointer"
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

                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <h3 className="font-display font-bold text-slate-800 text-base">Generated Questions Output</h3>
                        {generatedQuestions.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={handleCopyAiQuestionsToBuilder}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center space-x-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Load into Builder & Set ደቂቃ</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveGeneratedExam}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center space-x-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Publish Direct</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {generatedQuestions.length > 0 ? (
                          generatedQuestions.map((q, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
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
                                      className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                        opt === q.correctAnswer
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                                          : "bg-white border-slate-200"
                                      }`}
                                    >
                                      <div
                                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                                          opt === q.correctAnswer
                                            ? "bg-emerald-600 text-white border-emerald-300"
                                            : "border-slate-300"
                                        }`}
                                      >
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
                              Define your topic and click generate. Our server-side Gemini auditor will generate high-fidelity examination pools.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

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
                    onClick={async () => {
                      alert(`Attendance saved successfully for ${attendanceDate}! Audit ledger updated.`);
                      await CampusDatabase.addAuditLog(
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
                    Classify students as at-risk or not at-risk based on attendance rate, assessment trends, and engagement metrics via server-side prediction models.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                              analyticsResult.status === "At-Risk" ? "text-danger" : "text-success"
                            }`}>
                              {analyticsResult.status}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Dropout Probability</span>
                            <span className="block text-2xl font-display font-bold text-slate-800">
                              {analyticsResult.riskProbability}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">ATTENDANCE</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.metrics?.attendance}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">AVG GRADE</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.metrics?.grade}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">SUBMISSIONS</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.metrics?.submissions}%</strong>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <span className="block text-[10px] text-slate-400 font-mono">LIBRARY LOGINS</span>
                            <strong className="block text-base mt-1 text-slate-800">{analyticsResult.metrics?.library}</strong>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Advisor Evaluation & Justification</span>
                          <p className="bg-blue-50/30 text-slate-700 p-4 rounded-xl border border-blue-50 text-xs md:text-sm leading-relaxed">
                            {analyticsResult.feedback}
                          </p>
                        </div>

                        {analyticsResult.interventions && analyticsResult.interventions.length > 0 && (
                          <div className="space-y-2">
                            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Intervention Protocols</span>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                              {analyticsResult.interventions.map((item: string, idx: number) => (
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

            {activeTab === "facilities" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="instructor-facilities-tab"
              >
                <SmartCampusFacilities user={user} />
              </motion.div>
            )}

            {activeTab === "zoom" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="instructor-zoom-tab"
              >
                <InstructorZoomManager
                  instructor={user}
                  courses={courses}
                  selectedCourseId={selectedCourseId}
                />
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="instructor-alerts-tab"
              >
                <SmartCampusAlerts user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CourseMaterialModal
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />

      {/* FIXED: pass attempts so the modal can filter and render */}
      <ExamSubmissionsModal
        exam={selectedExamForSubmissions}
        attempts={examAttempts}
        onClose={() => setSelectedExamForSubmissions(null)}
      />

      <AcademicFooter />
    </div>
  );
}
