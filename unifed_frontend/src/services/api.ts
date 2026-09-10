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

// ---------- API BASE ----------
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

  // ✅ FIX: don't let the instance-level 'application/json' header leak
  // into multipart/form-data (file upload) requests. Axios would normally
  // let the browser auto-set 'multipart/form-data; boundary=...' for a
  // FormData body, but an explicitly-set Content-Type header takes
  // priority and blocks that from happening.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  }
);

// ✅ Helper: DRF's PageNumberPagination (settings.py PAGE_SIZE=100) wraps
// every list response in { count, next, previous, results }. Returning
// the raw object makes the frontend's `data.length` / `data.map()`
// checks fail silently and fall back to mock data. This helper unwraps
// the envelope so every list-based screen sees a plain array.
const unwrapList = <T>(raw: any): T[] =>
  Array.isArray(raw) ? raw : (raw?.results ?? []);

// ---------- USERS ----------
export const getUsers = (): Promise<User[]> =>
  api.get('/users/').then(r => unwrapList<User>(r.data));
export const saveUsers = (users: User[]): Promise<User[]> =>
  api.put('/users/', users).then(r => r.data);
export const updateUser = (user: User): Promise<User> =>
  api.put(`/users/${user.id}/`, user).then(r => r.data);

// ---------- COURSES ----------
export const getCourses = (): Promise<Course[]> =>
  api.get('/courses/').then(r => unwrapList<Course>(r.data));
export const saveCourses = (courses: Course[]): Promise<Course[]> =>
  api.put('/courses/', courses).then(r => r.data);

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> =>
  api.get('/materials/').then(r => unwrapList<CourseMaterial>(r.data));
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> =>
  api.put('/materials/', materials).then(r => r.data);

// ---------- ANNOUNCEMENTS ----------
// ✅ FIXED: unwrap DRF pagination envelope so the news components
// (CampusNewsTopBar / CampusNewsAdminModal) receive a real array and
// don't silently fall back to their mock DEFAULT_NEWS lists.
export const getAnnouncements = (): Promise<Announcement[]> =>
  api.get('/announcements/').then(r => unwrapList<Announcement>(r.data));
export const saveAnnouncements = (announcements: Announcement[]): Promise<Announcement[]> =>
  api.put('/announcements/', announcements).then(r => r.data);

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> =>
  api.get('/assignments/').then(r => unwrapList<Assignment>(r.data));
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> =>
  api.put('/assignments/', assignments).then(r => r.data);

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> =>
  api.get('/submissions/').then(r => unwrapList<Submission>(r.data));
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> =>
  api.put('/submissions/', submissions).then(r => r.data);

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> =>
  api.get('/exams/').then(r => unwrapList<Exam>(r.data));
export const saveExams = (exams: Exam[]): Promise<Exam[]> =>
  api.put('/exams/', exams).then(r => r.data);

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> =>
  api.get('/exam-attempts/').then(r => unwrapList<ExamAttempt>(r.data));
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> =>
  api.put('/exam-attempts/', attempts).then(r => r.data);

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> =>
  api.get('/grades/').then(r => unwrapList<Grade>(r.data));
export const saveGrades = (grades: Grade[]): Promise<Grade[]> =>
  api.put('/grades/', grades).then(r => r.data);

// ---------- TRANSCRIPTS ----------
export const getTranscripts = (): Promise<Transcript[]> =>
  api.get('/transcripts/').then(r => unwrapList<Transcript>(r.data));
export const saveTranscripts = (transcripts: Transcript[]): Promise<Transcript[]> =>
  api.put('/transcripts/', transcripts).then(r => r.data);

// ---------- ATTENDANCE ----------
export const getAttendance = (): Promise<AttendanceRecord[]> =>
  api.get('/attendance/').then(r => unwrapList<AttendanceRecord>(r.data));
export const saveAttendance = (records: AttendanceRecord[]): Promise<AttendanceRecord[]> =>
  api.put('/attendance/', records).then(r => r.data);

// ---------- LIBRARY RESOURCES ----------
export const getLibraryResources = (): Promise<LibraryResource[]> =>
  api.get('/library-resources/').then(r => unwrapList<LibraryResource>(r.data));
export const saveLibraryResources = (resources: LibraryResource[]): Promise<LibraryResource[]> =>
  api.put('/library-resources/', resources).then(r => r.data);

// ---------- PAYMENTS ----------
export const getPayments = (): Promise<PaymentTransaction[]> =>
  api.get('/payments/').then(r => unwrapList<PaymentTransaction>(r.data));
export const savePayments = (payments: PaymentTransaction[]): Promise<PaymentTransaction[]> =>
  api.put('/payments/', payments).then(r => r.data);

// ---------- SCHOLARSHIPS ----------
export const getScholarships = (): Promise<Scholarship[]> =>
  api.get('/scholarships/').then(r => unwrapList<Scholarship>(r.data));
export const saveScholarships = (scholarships: Scholarship[]): Promise<Scholarship[]> =>
  api.put('/scholarships/', scholarships).then(r => r.data);

// ---------- COURSE OUTLINES ----------
export const getCourseOutlines = (): Promise<CourseOutlineForm[]> =>
  api.get('/course-outlines/').then(r => unwrapList<CourseOutlineForm>(r.data));
export const saveCourseOutlines = (outlines: CourseOutlineForm[]): Promise<CourseOutlineForm[]> =>
  api.put('/course-outlines/', outlines).then(r => r.data);

// ---------- EVALUATIONS ----------
export const getEvaluations = (): Promise<InstructorEvaluation[]> =>
  api.get('/evaluations/').then(r => unwrapList<InstructorEvaluation>(r.data));
export const saveEvaluations = (evaluations: InstructorEvaluation[]): Promise<InstructorEvaluation[]> =>
  api.put('/evaluations/', evaluations).then(r => r.data);

// ---------- MOE ADMISSIONS ----------
export const getMoEAdmissions = (): Promise<MoEAdmissionRecord[]> =>
  api.get('/moe-admissions/').then(r => unwrapList<MoEAdmissionRecord>(r.data));
export const saveMoEAdmissions = (admissions: MoEAdmissionRecord[]): Promise<MoEAdmissionRecord[]> =>
  api.put('/moe-admissions/', admissions).then(r => r.data);

// ---------- CERTIFICATES ----------
export const getCertificates = (): Promise<CertificateRecord[]> =>
  api.get('/certificates/').then(r => unwrapList<CertificateRecord>(r.data));
export const saveCertificates = (certificates: CertificateRecord[]): Promise<CertificateRecord[]> =>
  api.put('/certificates/', certificates).then(r => r.data);

// ---------- AUDIT LOGS ----------
export const getAuditLogs = (): Promise<AuditLog[]> =>
  api.get('/audit-logs/').then(r => unwrapList<AuditLog>(r.data));
export const saveAuditLogs = (logs: AuditLog[]): Promise<AuditLog[]> =>
  api.put('/audit-logs/', logs).then(r => r.data);

// ---------- SETTINGS ----------
export const getSettings = (): Promise<SystemSettings> =>
  api.get('/settings/').then(r => r.data);
export const saveSettings = (settings: SystemSettings): Promise<SystemSettings> =>
  api.put('/settings/', settings).then(r => r.data);

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

// ---------- CLEARANCES ----------
export const getClearances = (): Promise<StudentClearance[]> =>
  api.get('/clearances/').then(r => unwrapList<StudentClearance>(r.data));
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
  api.get('/facility-bookings/').then(r => unwrapList<FacilityBooking>(r.data));
export const saveFacilityBookings = (bookings: FacilityBooking[]): Promise<FacilityBooking[]> =>
  api.put('/facility-bookings/', bookings).then(r => r.data);

export const addFacilityBooking = (booking: Omit<FacilityBooking, 'id'>): Promise<FacilityBooking> =>
  api.post('/facility-bookings/', booking).then(r => r.data);

// ---------- CAMPUS ALERTS ----------
export const getCampusAlerts = (): Promise<CampusAlert[]> =>
  api.get('/campus-alerts/').then(r => unwrapList<CampusAlert>(r.data));
export const saveCampusAlerts = (alerts: CampusAlert[]): Promise<CampusAlert[]> =>
  api.put('/campus-alerts/', alerts).then(r => r.data);

export const addCampusAlert = (alert: Omit<CampusAlert, 'id' | 'timestamp'>): Promise<CampusAlert> =>
  api.post('/campus-alerts/', alert).then(r => r.data);

// ---------- CAMPUS MEDIA POSTS ----------
// ✅ DRF pagination unwrap — keeps the rest of the app pagination-agnostic.
export const getMediaPosts = (): Promise<CampusMediaPost[]> =>
  api.get('/media-posts/').then(r => unwrapList<CampusMediaPost>(r.data));

export const saveMediaPosts = (posts: CampusMediaPost[]): Promise<CampusMediaPost[]> =>
  api.put('/media-posts/', posts).then(r => r.data);

export const addMediaPost = (post: Omit<CampusMediaPost, 'id' | 'postedAt' | 'viewsCount' | 'likesCount'>): Promise<CampusMediaPost> =>
  api.post('/media-posts/', post).then(r => r.data);

// ✅ File upload media post (multipart/form-data).
// The request interceptor above strips the instance's default
// 'Content-Type: application/json' header whenever the body is a
// FormData instance, so the browser/axios can generate the correct
// 'multipart/form-data; boundary=...' header itself.
export const uploadMediaPost = (formData: FormData): Promise<CampusMediaPost> => {
  return api.post('/media-posts/', formData).then(r => r.data);
};

export const deleteMediaPost = (id: string): Promise<{ success: boolean }> =>
  api.delete(`/media-posts/${id}/`).then(r => r.data);

export const incrementMediaViews = (id: string): Promise<void> =>
  api.post(`/media-posts/${id}/view/`).then(r => r.data);

export const toggleMediaLike = (id: string): Promise<{ likesCount: number }> =>
  api.post(`/media-posts/${id}/like/`).then(r => r.data);

// ---------- EXPORT ----------
export const CampusDatabase = {
  getUsers,
  saveUsers,
  updateUser,
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
  getClearances,
  saveClearances,
  updateClearanceStage,
  getFacilityBookings,
  saveFacilityBookings,
  addFacilityBooking,
  getCampusAlerts,
  saveCampusAlerts,
  addCampusAlert,
  getMediaPosts,
  saveMediaPosts,
  addMediaPost,
  uploadMediaPost,
  deleteMediaPost,
  incrementMediaViews,
  toggleMediaLike,
};
