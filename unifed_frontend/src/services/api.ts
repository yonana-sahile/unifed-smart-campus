import axios from 'axios';
import type {
  User,
  Course,
  CourseMaterial,
  Announcement,
  Assignment,
  Submission,
  Exam,
  ExamAttempt,
  Grade,
  Transcript,
  AttendanceRecord,
  LibraryResource,
  PaymentTransaction,
  Scholarship,
  CourseOutlineForm,
  InstructorEvaluation,
  MoEAdmissionRecord,
  CertificateRecord,
  AuditLog,
  SystemSettings,
  AIRiskPrediction,
  StudentClearance,
  ClearanceDepartmentStatus,
  FacilityBooking,
  CampusAlert,
  CampusMediaPost,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- USERS ----------
export const getUsers = (): Promise<User[]> => api.get('/users/').then(r => r.data);
export const saveUsers = (users: User[]): Promise<User[]> => api.put('/users/', users).then(r => r.data);

// ---------- COURSES ----------
export const getCourses = (): Promise<Course[]> => api.get('/courses/').then(r => r.data);
export const saveCourses = (courses: Course[]): Promise<Course[]> => api.put('/courses/', courses).then(r => r.data);

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> => api.get('/materials/').then(r => r.data);
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> => api.put('/materials/', materials).then(r => r.data);

// ---------- ANNOUNCEMENTS ----------
export const getAnnouncements = (): Promise<Announcement[]> => api.get('/announcements/').then(r => r.data);
export const saveAnnouncements = (announcements: Announcement[]): Promise<Announcement[]> => api.put('/announcements/', announcements).then(r => r.data);

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> => api.get('/assignments/').then(r => r.data);
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> => api.put('/assignments/', assignments).then(r => r.data);

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> => api.get('/submissions/').then(r => r.data);
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> => api.put('/submissions/', submissions).then(r => r.data);

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> => api.get('/exams/').then(r => r.data);
export const saveExams = (exams: Exam[]): Promise<Exam[]> => api.put('/exams/', exams).then(r => r.data);

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> => api.get('/exam-attempts/').then(r => r.data);
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> => api.put('/exam-attempts/', attempts).then(r => r.data);

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> => api.get('/grades/').then(r => r.data);
export const saveGrades = (grades: Grade[]): Promise<Grade[]> => api.put('/grades/', grades).then(r => r.data);

// ---------- TRANSCRIPTS ----------
export const getTranscripts = (): Promise<Transcript[]> => api.get('/transcripts/').then(r => r.data);
export const saveTranscripts = (transcripts: Transcript[]): Promise<Transcript[]> => api.put('/transcripts/', transcripts).then(r => r.data);

// ---------- ATTENDANCE ----------
export const getAttendance = (): Promise<AttendanceRecord[]> => api.get('/attendance/').then(r => r.data);
export const saveAttendance = (records: AttendanceRecord[]): Promise<AttendanceRecord[]> => api.put('/attendance/', records).then(r => r.data);

// ---------- LIBRARY RESOURCES ----------
export const getLibraryResources = (): Promise<LibraryResource[]> => api.get('/library-resources/').then(r => r.data);
export const saveLibraryResources = (resources: LibraryResource[]): Promise<LibraryResource[]> => api.put('/library-resources/', resources).then(r => r.data);

// ---------- PAYMENTS ----------
export const getPayments = (): Promise<PaymentTransaction[]> => api.get('/payments/').then(r => r.data);
export const savePayments = (payments: PaymentTransaction[]): Promise<PaymentTransaction[]> => api.put('/payments/', payments).then(r => r.data);

// ---------- SCHOLARSHIPS ----------
export const getScholarships = (): Promise<Scholarship[]> => api.get('/scholarships/').then(r => r.data);
export const saveScholarships = (scholarships: Scholarship[]): Promise<Scholarship[]> => api.put('/scholarships/', scholarships).then(r => r.data);

// ---------- COURSE OUTLINES ----------
export const getCourseOutlines = (): Promise<CourseOutlineForm[]> => api.get('/course-outlines/').then(r => r.data);
export const saveCourseOutlines = (outlines: CourseOutlineForm[]): Promise<CourseOutlineForm[]> => api.put('/course-outlines/', outlines).then(r => r.data);

// ---------- EVALUATIONS ----------
export const getEvaluations = (): Promise<InstructorEvaluation[]> => api.get('/evaluations/').then(r => r.data);
export const saveEvaluations = (evaluations: InstructorEvaluation[]): Promise<InstructorEvaluation[]> => api.put('/evaluations/', evaluations).then(r => r.data);

// ---------- MOE ADMISSIONS ----------
export const getMoEAdmissions = (): Promise<MoEAdmissionRecord[]> => api.get('/moe-admissions/').then(r => r.data);
export const saveMoEAdmissions = (admissions: MoEAdmissionRecord[]): Promise<MoEAdmissionRecord[]> => api.put('/moe-admissions/', admissions).then(r => r.data);

// ---------- CERTIFICATES ----------
export const getCertificates = (): Promise<CertificateRecord[]> => api.get('/certificates/').then(r => r.data);
export const saveCertificates = (certificates: CertificateRecord[]): Promise<CertificateRecord[]> => api.put('/certificates/', certificates).then(r => r.data);

// ---------- AUDIT LOGS ----------
export const getAuditLogs = (): Promise<AuditLog[]> => api.get('/audit-logs/').then(r => r.data);
export const saveAuditLogs = (logs: AuditLog[]): Promise<AuditLog[]> => api.put('/audit-logs/', logs).then(r => r.data);

// ---------- SETTINGS ----------
export const getSettings = (): Promise<SystemSettings> => api.get('/settings/').then(r => r.data);
export const saveSettings = (settings: SystemSettings): Promise<SystemSettings> => api.put('/settings/', settings).then(r => r.data);

// ---------- AI: RISK PREDICTION ----------
export const predictStudentRisk = (studentId: string): Promise<AIRiskPrediction> =>
  api.post('/ai/predict-risk/', { studentId }).then(r => r.data);

// ---------- AI: EXAM GENERATION ----------
export const generateExamQuestions = (params: {
  courseId: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: string;
}): Promise<{ success: boolean; questions: any[]; error?: string }> =>
  api.post('/ai/generate-exam/', params).then(r => r.data);

// ---------- AI: COURSE ADVISOR ----------
export const getCourseAdvisor = (data: {
  studentId?: string;
  interests: string;
  program: string;
  currentSemester?: string;
  completedCourses?: string[];
}): Promise<{ summary: string; recommendations: any[] }> =>
  api.post('/ai/course-advisor/', data).then(r => r.data);

// ---------- AUDIT LOG HELPER ----------
export const addAuditLog = (
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<AuditLog> =>
  api.post('/audit-logs/', {
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    description,
    ipAddress: 'unknown',
  }).then(r => r.data);

// ---------- DIGITAL CLEARANCE ----------
export const getClearances = (): Promise<StudentClearance[]> =>
  api.get('/clearances/').then(r => r.data);

export const saveClearances = (clearances: StudentClearance[]): Promise<StudentClearance[]> =>
  api.put('/clearances/', clearances).then(r => r.data);

export const updateClearanceStage = (
  clearanceId: string,
  dept: "LIBRARY" | "FINANCE" | "DORMITORY" | "DEPARTMENT_LAB" | "REGISTRAR",
  status: "CLEARED" | "REJECTED" | "PENDING",
  officerName: string,
  remarks?: string
): Promise<StudentClearance> =>
  api.patch(`/clearances/${clearanceId}/stage/`, {
    department: dept,
    status,
    officerName,
    remarks,
  }).then(r => r.data);

// ---------- FACILITY BOOKINGS ----------
export const getFacilityBookings = (): Promise<FacilityBooking[]> =>
  api.get('/facility-bookings/').then(r => r.data);

export const saveFacilityBookings = (bookings: FacilityBooking[]): Promise<FacilityBooking[]> =>
  api.put('/facility-bookings/', bookings).then(r => r.data);

export const addFacilityBooking = (
  booking: Omit<FacilityBooking, 'id'>
): Promise<FacilityBooking> =>
  api.post('/facility-bookings/', booking).then(r => r.data);

// ---------- CAMPUS ALERTS ----------
export const getCampusAlerts = (): Promise<CampusAlert[]> =>
  api.get('/campus-alerts/').then(r => r.data);

export const saveCampusAlerts = (alerts: CampusAlert[]): Promise<CampusAlert[]> =>
  api.put('/campus-alerts/', alerts).then(r => r.data);

export const addCampusAlert = (
  alert: Omit<CampusAlert, 'id' | 'timestamp'>
): Promise<CampusAlert> =>
  api.post('/campus-alerts/', alert).then(r => r.data);

// ---------- CAMPUS MEDIA POSTS ----------
export const getMediaPosts = (): Promise<CampusMediaPost[]> =>
  api.get('/media-posts/').then(r => r.data);

export const saveMediaPosts = (posts: CampusMediaPost[]): Promise<CampusMediaPost[]> =>
  api.put('/media-posts/', posts).then(r => r.data);

export const addMediaPost = (
  post: Omit<CampusMediaPost, 'id' | 'postedAt' | 'viewsCount' | 'likesCount'>
): Promise<CampusMediaPost> =>
  api.post('/media-posts/', post).then(r => r.data);

export const deleteMediaPost = (id: string): Promise<{ success: boolean }> =>
  api.delete(`/media-posts/${id}/`).then(r => r.data);

export const incrementMediaViews = (id: string): Promise<void> =>
  api.post(`/media-posts/${id}/view/`).then(r => r.data);

export const toggleMediaLike = (id: string): Promise<{ likesCount: number }> =>
  api.post(`/media-posts/${id}/like/`).then(r => r.data);

// ---------- EXPORT AS CAMPUS DATABASE OBJECT ----------
export const CampusDatabase = {
  getUsers,
  saveUsers,
  getCourses,
  saveCourses,
  getMaterials,
  saveMaterials,
  getAnnouncements,
  saveAnnouncements,
  getAssignments,
  saveAssignments,
  getSubmissions,
  saveSubmissions,
  getExams,
  saveExams,
  getExamAttempts,
  saveExamAttempts,
  getGrades,
  saveGrades,
  getTranscripts,
  saveTranscripts,
  getAttendance,
  saveAttendance,
  getLibraryResources,
  saveLibraryResources,
  getPayments,
  savePayments,
  getScholarships,
  saveScholarships,
  getCourseOutlines,
  saveCourseOutlines,
  getEvaluations,
  saveEvaluations,
  getMoEAdmissions,
  saveMoEAdmissions,
  getCertificates,
  saveCertificates,
  getAuditLogs,
  saveAuditLogs,
  getSettings,
  saveSettings,
  predictStudentRisk,
  generateExamQuestions,
  getCourseAdvisor,
  addAuditLog,
  // NEW: Clearance
  getClearances,
  saveClearances,
  updateClearanceStage,
  // NEW: Facilities
  getFacilityBookings,
  saveFacilityBookings,
  addFacilityBooking,
  // NEW: Alerts
  getCampusAlerts,
  saveCampusAlerts,
  addCampusAlert,
  // NEW: Media
  getMediaPosts,
  saveMediaPosts,
  addMediaPost,
  deleteMediaPost,
  incrementMediaViews,
  toggleMediaLike,
};
