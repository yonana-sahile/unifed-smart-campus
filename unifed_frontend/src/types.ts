export type UserRole =
  | "STUDENT"
  | "INSTRUCTOR"
  | "REGISTRAR"
  | "DEPARTMENT_HEAD"
  | "ADMIN"
  | "DEAN"
  | "AUDITOR"
  | "LIBRARY_STAFF"
  | "FINANCE_OFFICER";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  // Role-specific fields
  studentId?: string;
  academicYear?: number;
  semester?: number;
  program?: string;
  gpa?: number;
  cgpa?: number;
  outstandingFees?: number;
  costSharingBalance?: number;
  instructorId?: string;
  department?: string;
  specialization?: string;
  officeHours?: string;
  staffId?: string;
  librarySection?: string;
  officerId?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  description: string;
  department: string;
  instructorId: string;
  instructorName: string;
  semester: string;
  academicYear: number;
  capacity: number;
  enrolledStudentsCount: number;
  prerequisites: string[];
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  fileType: "PDF" | "Video" | "Document" | "Slide";
  fileUrl?: string;
  uploadedAt: string;
  description: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  content: string;
  postedBy: string;
  postedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  maxScore: number;
  description: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
  score?: number;
  feedback?: string;
  status: "PENDING" | "GRADED";
}

export interface Question {
  questionText: string;
  questionType: "MCQ" | "TF" | "short_answer";
  options: string[];
  correctAnswer: string;
  marks: number;
}

export interface Exam {
  id: string;
  courseId: string;
  courseTitle: string;
  examTitle: string;
  examDate: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string;
  questions: Question[];
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "CLOSED" | "GRADED" | "ARCHIVED";
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  answers: { [questionIndex: number]: string };
  score?: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: string;
  submittedAt?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  creditHours: number;
  continuousAssessmentScore: number; // Max 50
  midExamScore: number; // Max 20
  finalExamScore: number; // Max 30
  totalGrade: number; // Max 100
  letterGrade: string; // A, B, C, D, F
  gradePoint: number; // Scale 4.0
  semester: string;
  status: "CALCULATED" | "SUBMITTED" | "APPROVED" | "RETURNED";
  comments?: string;
}

export interface Transcript {
  id: string;
  studentId: string;
  studentName: string;
  generatedDate: string;
  cgpa: number;
  totalCredits: number;
  verificationCode: string;
  grades: Grade[];
  isApproved: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  lastUpdated: string;
  meetsMinimum: boolean; // 80% threshold required for exam & grading
}

export interface InstructorEvaluation {
  id: string;
  studentId: string;
  instructorId: string;
  instructorName: string;
  courseId: string;
  courseCode: string;
  ratings: {
    clarity: number;
    punctuality: number;
    helpfulness: number;
    assessmentFairness: number;
    overallRating: number;
  };
  comments: string;
  semester: string;
  submittedAt: string;
}

export interface CourseOutlineForm {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  department: string;
  syllabus: string;
  learningObjectives: string[];
  weeklySchedule: {
    week: number;
    topic: string;
    deliverables: string;
  }[];
  assessmentPolicy: {
    continuousAssessment: number; // 50
    midExam: number; // 20
    finalExam: number; // 30
  };
  approvedByDeptHead: boolean;
  updatedAt: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: "Computer Science" | "Software Engineering" | "Mathematics" | "General Engineering" | "National Curriculum";
  resourceType: "BOOK" | "VIDEO" | "ARTICLE" | "LECTURE_NOTE";
  fileUrl?: string;
  fileSize: string;
  downloadsCount: number;
  accessLevel: "PUBLIC" | "STUDENTS_ONLY" | "FACULTY_ONLY";
  uploadedBy: string;
  uploadedAt: string;
  description: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: "TELEBIRR" | "CBE_BIRR" | "AWASH_BANK" | "DIRECT_DEPOSIT";
  paymentType: "TUITION" | "COST_SHARING" | "DORMITORY" | "ID_CARD" | "REGISTRATION";
  referenceNumber: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  receiptNumber: string;
  timestamp: string;
  verifiedBy?: string;
}

export interface Scholarship {
  id: string;
  studentId: string;
  studentName: string;
  scholarshipType: "MERIT_BASED" | "NEED_BASED" | "MOE_SPECIAL_GRANT" | "FEMALE_ENGINEERING_INCENTIVE";
  amount: number;
  semester: string;
  academicYear: number;
  status: "ISSUED" | "APPLIED";
  issuedDate: string;
}

export interface MoEAdmissionRecord {
  id: string;
  nationalExamRoll: string;
  fullName: string;
  gender: "M" | "F";
  departmentAssigned: string;
  nationalExamScore: number;
  status: "ADMITTED" | "VERIFIED" | "REGISTERED";
  batchYear: number;
  faydaNationalId: string;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  studentName: string;
  certificateType: "COMPLETION" | "ENROLLMENT" | "DEAN_HONOR_ROLL" | "DEGREE_ATTESTATION";
  issueDate: string;
  verificationCode: string;
  program: string;
  isIssued: boolean;
}

export interface AIRiskPrediction {
  studentId: string;
  studentName: string;
  program: string;
  cgpa: number;
  attendancePercentage: number;
  continuousAssessmentAvg: number;
  dropoutProbability: number; // 0.00 to 1.00 via Logistic Regression
  classification: "NOT_AT_RISK" | "MODERATE_RISK" | "HIGH_RISK";
  keyRiskFactors: string[];
  recommendedAction: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  description: string;
}

export interface SystemSettings {
  semesterDates: {
    start: string;
    end: string;
  };
  registrationDeadline: string;
  examPeriod: {
    start: string;
    end: string;
  };
  gradingScale: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  academicYearFrozen: boolean;
}
