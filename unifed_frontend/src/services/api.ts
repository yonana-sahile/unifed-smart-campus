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

// Helper: unwrap DRF pagination envelope { count, next, previous, results }
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
// per-item update (DRF-405 safe)
export const updateCourse = (id: string, course: any): Promise<Course> =>
  api.patch(`/courses/${id}/`, course).then(r => r.data);

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> =>
  api.get('/materials/').then(r => unwrapList<CourseMaterial>(r.data));
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> =>
  api.put('/materials/', materials).then(r => r.data);

// create one material via POST (matches DRF ModelViewSet)
export const addMaterial = (material: any): Promise<CourseMaterial> =>
  api.post('/materials/', material).then(r => r.data);

export const updateMaterial = (id: string, material: any): Promise<CourseMaterial> =>
  api.patch(`/materials/${id}/`, material).then(r => r.data);

export const deleteMaterial = (id: string): Promise<void> =>
  api.delete(`/materials/${id}/`).then(() => undefined);

// ---------- ANNOUNCEMENTS ----------
export const getAnnouncements = (): Promise<Announcement[]> =>
  api.get('/announcements/').then(r => unwrapList<Announcement>(r.data));

export const createAnnouncement = (announcement: any): Promise<any> => {
  const payload: any = {
    course: announcement.course ?? null,
    course_title:
      announcement.courseTitle ??
      announcement.course_title ??
      "Campus News & Announcements",
    title: announcement.title,
    content: announcement.content,
    posted_by:
      announcement.postedBy ??
      announcement.posted_by ??
      "University Media Directorate",
    posted_at:
      announcement.postedAt ??
      announcement.posted_at ??
      new Date().toISOString(),
  };
  return api.post('/announcements/', payload).then(r => r.data);
};

export const updateAnnouncement = (id: string, announcement: any): Promise<any> => {
  const payload: any = {
    course: announcement.course ?? null,
    course_title:
      announcement.courseTitle ??
      announcement.course_title ??
      "Campus News & Announcements",
    title: announcement.title,
    content: announcement.content,
    posted_by:
      announcement.postedBy ??
      announcement.posted_by ??
      "University Media Directorate",
    posted_at:
      announcement.postedAt ??
      announcement.posted_at ??
      new Date().toISOString(),
  };
  return api.put(`/announcements/${id}/`, payload).then(r => r.data);
};

export const deleteAnnouncement = (id: string): Promise<void> =>
  api.delete(`/announcements/${id}/`).then(() => undefined);

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> =>
  api.get('/assignments/').then(r => unwrapList<Assignment>(r.data));
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> =>
  api.put('/assignments/', assignments).then(r => r.data);
export const addAssignment = (assignment: any): Promise<Assignment> =>
  api.post('/assignments/', assignment).then(r => r.data);
export const deleteAssignment = (id: string): Promise<void> =>
  api.delete(`/assignments/${id}/`).then(() => undefined);

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> =>
  api.get('/submissions/').then(r => unwrapList<Submission>(r.data));
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> =>
  api.put('/submissions/', submissions).then(r => r.data);
export const addSubmission = (submission: any): Promise<Submission> =>
  api.post('/submissions/', submission).then(r => r.data);
export const updateSubmission = (id: string, submission: any): Promise<Submission> =>
  api.patch(`/submissions/${id}/`, submission).then(r => r.data);

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> =>
  api.get('/exams/').then(r => unwrapList<Exam>(r.data));

export const createExam = (exam: any): Promise<Exam> =>
  api.post('/exams/', exam).then(r => r.data);

export const updateExam = (id: string, exam: any): Promise<Exam> =>
  api.patch(`/exams/${id}/`, exam).then(r => r.data);

export const pushExam = (examId: string, isPushed: boolean): Promise<Exam> =>
  api.post(`/exams/${examId}/push/`, { is_pushed: isPushed }).then(r => r.data);

export const deleteExam = (id: string): Promise<void> =>
  api.delete(`/exams/${id}/`).then(() => undefined);

// Legacy compatibility — DRF disallows bulk PUT on /exams/ (405).
export const saveExams = (exams: Exam[]): Promise<Exam[]> =>
  api.put('/exams/', exams).then(r => r.data);

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> =>
  api.get('/exam-attempts/').then(r => unwrapList<ExamAttempt>(r.data));
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> =>
  api.put('/exam-attempts/', attempts).then(r => r.data);

export const createExamAttempt = (attempt: any): Promise<ExamAttempt> =>
  api.post('/exam-attempts/', attempt).then(r => r.data);

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> =>
  api.get('/grades/').then(r => unwrapList<Grade>(r.data));
export const saveGrades = (grades: Grade[]): Promise<Grade[]> =>
  api.put('/grades/', grades).then(r => r.data);
export const updateGrade = (id: string, grade: any): Promise<Grade> =>
  api.patch(`/grades/${id}/`, grade).then(r => r.data);

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

// ---------- AI ----------
// Backend returns snake_case; remap to camelCase for the dashboards.
export const predictStudentRisk = async (studentId: string): Promise<AIRiskPrediction> => {
  const raw: any = await api.post('/ai/predict-risk/', { studentId }).then(r => r.data);
  return {
    classification: raw.classification,
    dropoutProbability: raw.dropout_probability ?? raw.dropoutProbability ?? 0,
    attendancePercentage: raw.attendance_percentage ?? raw.attendancePercentage ?? 0,
    continuousAssessmentAvg:
      raw.continuous_assessment_avg ?? raw.continuousAssessmentAvg ?? 0,
    cgpa: raw.cgpa ?? 0,
    keyRiskFactors: raw.key_risk_factors ?? raw.keyRiskFactors ?? [],
    recommendedAction: raw.recommended_action ?? raw.recommendedAction ?? '',
  } as any;
};

export const generateExamQuestions = (params: {
  courseId: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: string;
}): Promise<{ success: boolean; questions: any[]; error?: string }> =>
  api.post('/ai/generate-exam/', params).then(r => r.data);

export const getCourseAdvisor = (data: {
  studentId?: string;
  interests: string;
  program: string;
  currentSemester?: string;
  completedCourses?: string[];
}): Promise<{ summary: string; recommendations: any[] }> =>
  api.post('/ai/course-advisor/', data).then(r => r.data);

// ---------- AUDIT LOG HELPER (non-fatal) ----------
// Sends snake_case keys to match Django's AuditLog model fields.
// Wrapped in try/catch so a failed audit write never breaks the
// calling action (announcement post, material upload, exam push, etc.).
export const addAuditLog = async (
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<AuditLog | null> => {
  try {
    const res = await api.post('/audit-logs/', {
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      ip_address: 'unknown',
    });
    return res.data;
  } catch (err: any) {
    // Log to console for debugging, but don't throw — audit logging
    // must never block the primary user action.
    console.warn(
      '[audit-log] write failed (non-fatal):',
      err?.response?.status,
      err?.response?.data || err?.message
    );
    return null;
  }
};

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
export const getMediaPosts = (): Promise<CampusMediaPost[]> =>
  api.get('/media-posts/').then(r => unwrapList<CampusMediaPost>(r.data));
export const saveMediaPosts = (posts: CampusMediaPost[]): Promise<CampusMediaPost[]> =>
  api.put('/media-posts/', posts).then(r => r.data);
export const addMediaPost = (post: Omit<CampusMediaPost, 'id' | 'postedAt' | 'viewsCount' | 'likesCount'>): Promise<CampusMediaPost> =>
  api.post('/media-posts/', post).then(r => r.data);
export const uploadMediaPost = (formData: FormData): Promise<CampusMediaPost> => {
  return api.post('/media-posts/', formData).then(r => r.data);
};
export const deleteMediaPost = (id: string): Promise<{ success: boolean }> =>
  api.delete(`/media-posts/${id}/`).then(r => r.data);
export const incrementMediaViews = (id: string): Promise<void> =>
  api.post(`/media-posts/${id}/view/`).then(r => r.data);
export const toggleMediaLike = (id: string): Promise<{ likesCount: number }> =>
  api.post(`/media-posts/${id}/like/`).then(r => r.data);

// ---------- ZOOM CLASS SESSIONS ----------
const toZoomSnakeCase = (data: any): any => {
  const keyMap: Record<string, string> = {
    courseId: 'course', course: 'course',
    courseCode: 'course_code', course_code: 'course_code',
    courseTitle: 'course_title', course_title: 'course_title',
    title: 'title',
    topic: 'topic',
    instructorId: 'instructor', instructor: 'instructor',
    instructorName: 'instructor_name', instructor_name: 'instructor_name',
    startTime: 'start_time', start_time: 'start_time',
    durationMinutes: 'duration_minutes', duration_minutes: 'duration_minutes',
    meetingId: 'meeting_id', meeting_id: 'meeting_id',
    passcode: 'passcode',
    joinUrl: 'join_url', join_url: 'join_url',
    hostUrl: 'host_url', host_url: 'host_url',
    status: 'status',
    lectureNotes: 'lecture_notes', lecture_notes: 'lecture_notes',
    recordingUrl: 'recording_url', recording_url: 'recording_url',
    recordingDuration: 'recording_duration', recording_duration: 'recording_duration',
    activeAttendees: 'active_attendees', active_attendees: 'active_attendees',
    chatMessages: 'chat_messages', chat_messages: 'chat_messages',
  };
  const result: any = {};
  for (const [k, v] of Object.entries(data)) {
    const snake = keyMap[k];
    if (snake) result[snake] = v;
  }
  return result;
};

const fromZoomSnakeCase = (raw: any) => ({
  id: String(raw?.id ?? ""),
  courseId: raw?.course ?? raw?.courseId ?? null,
  courseCode: raw?.course_code ?? raw?.courseCode ?? "",
  courseTitle: raw?.course_title ?? raw?.courseTitle ?? "",
  title: raw?.title ?? "",
  topic: raw?.topic ?? "",
  instructorId: String(raw?.instructor ?? raw?.instructorId ?? ""),
  instructorName: raw?.instructor_name ?? raw?.instructorName ?? "",
  startTime: raw?.start_time ?? raw?.startTime ?? new Date().toISOString(),
  durationMinutes: raw?.duration_minutes ?? raw?.durationMinutes ?? 60,
  meetingId: raw?.meeting_id ?? raw?.meetingId ?? "",
  passcode: raw?.passcode ?? "",
  joinUrl: raw?.join_url ?? raw?.joinUrl ?? "",
  hostUrl: raw?.host_url ?? raw?.hostUrl ?? "",
  status: raw?.status ?? "UPCOMING",
  lectureNotes: raw?.lecture_notes ?? raw?.lectureNotes ?? "",
  recordingUrl: raw?.recording_url ?? raw?.recordingUrl ?? "",
  recordingDuration: raw?.recording_duration ?? raw?.recordingDuration ?? "",
  activeAttendees: raw?.active_attendees ?? raw?.activeAttendees ?? [],
  chatMessages: raw?.chat_messages ?? raw?.chatMessages ?? [],
});

export const getZoomSessions = (): Promise<any[]> =>
  api.get('/zoom-sessions/').then(r =>
    unwrapList<any>(r.data).map(fromZoomSnakeCase)
  );

export const addZoomSession = (data: any): Promise<any> =>
  api.post('/zoom-sessions/', toZoomSnakeCase(data)).then(r => fromZoomSnakeCase(r.data));

export const updateZoomSession = (id: string, data: any): Promise<any> =>
  api.patch(`/zoom-sessions/${id}/`, toZoomSnakeCase(data)).then(r => fromZoomSnakeCase(r.data));

export const deleteZoomSession = (id: string): Promise<void> =>
  api.delete(`/zoom-sessions/${id}/`).then(() => undefined);

// ---------- EXPORT ----------
export const CampusDatabase = {
  getUsers,
  saveUsers,
  updateUser,
  getCourses,
  saveCourses,
  updateCourse,
  getMaterials,
  saveMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAssignments,
  saveAssignments,
  addAssignment,
  deleteAssignment,
  getSubmissions,
  saveSubmissions,
  addSubmission,
  updateSubmission,
  getExams,
  createExam,
  updateExam,
  pushExam,
  deleteExam,
  saveExams,
  getExamAttempts,
  saveExamAttempts,
  createExamAttempt,
  getGrades,
  saveGrades,
  updateGrade,
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
  getZoomSessions,
  addZoomSession,
  updateZoomSession,
  deleteZoomSession,
};
