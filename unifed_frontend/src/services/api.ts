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
  FacilityBooking,
  CampusAlert,
  CampusMediaPost,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://unifed-smart-campus.onrender.com/api';

// ---------- AUTH HELPERS ----------
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (access?: string | null, refresh?: string | null) => {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const forceLogout = () => {
  clearTokens();
  // Notify the app so it can redirect to login
  window.dispatchEvent(new CustomEvent('uscms:auth-expired'));
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- REQUEST INTERCEPTOR ----------
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  // Diagnostic (safe — remove in production if noisy)
  console.log(
    '[api→]',
    config.method?.toUpperCase(),
    config.url,
    '| token:',
    token ? token.slice(0, 20) + '…' : 'NULL'
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[api→] No access token in storage — request will likely 401');
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ---------- RESPONSE INTERCEPTOR (auto-refresh on 401) ----------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Diagnostic: log every 401 with the URL and whether a header was sent
    if (error?.response?.status === 401) {
      console.warn(
        '[api←] 401 on',
        originalRequest?.method?.toUpperCase(),
        originalRequest?.url,
        '| had Authorization header:',
        !!originalRequest?.headers?.Authorization
      );
    }

    // If 401 and we haven't retried this request yet
    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/token/refresh/') // don't retry the refresh call itself
    ) {
      originalRequest._retry = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        console.warn('[auth] No refresh token — forcing logout');
        forceLogout();
        return Promise.reject(error);
      }

      try {
        // Use raw axios (not the `api` instance) to avoid interceptor recursion
        const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });

        // Save new access token
        setTokens(data.access, data.refresh); // SimpleJWT may rotate refresh

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshErr: any) {
        console.warn(
          '[auth] Refresh failed:',
          refreshErr?.response?.status,
          refreshErr?.response?.data || refreshErr?.message
        );
        forceLogout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Helper: unwrap DRF pagination envelope { count, next, previous, results }
const unwrapList = <T>(raw: any): T[] =>
  Array.isArray(raw) ? raw : (raw?.results ?? []);

// ---------- MAPPERS (Django snake_case → frontend camelCase) ----------

const mapUser = (u: any): User => ({
  id: `U_${u.id}`,
  username: u.username || '',
  fullName: u.full_name || u.fullName || u.username || 'Unknown User',
  email: u.email || '',
  role: u.role || 'STUDENT',
  isActive: u.is_active ?? true,
  avatarUrl: u.avatar_url ?? undefined,
  phoneNumber: u.phone_number ?? undefined,
  studentId: u.student_id ?? undefined,
  academicYear: u.academic_year ?? undefined,
  semester: u.semester ?? undefined,
  program: u.program || undefined,
  gpa: u.gpa != null ? Number(u.gpa) : undefined,
  cgpa: u.cgpa != null ? Number(u.cgpa) : undefined,
  outstandingFees: u.outstanding_fees != null ? Number(u.outstanding_fees) : 0,
  costSharingBalance: u.cost_sharing_balance != null ? Number(u.cost_sharing_balance) : 0,
  instructorId: u.instructor_id ?? undefined,
  department: u.department || undefined,
  specialization: u.specialization ?? undefined,
  officeHours: u.office_hours ?? undefined,
  staffId: u.staff_id ?? undefined,
  librarySection: u.library_section ?? undefined,
  officerId: u.officer_id ?? undefined,
  bio: u.bio ?? undefined,
} as User);

const mapCourse = (c: any): Course => ({
  id: String(c.id),
  courseCode: c.course_code ?? c.courseCode ?? '',
  courseTitle: c.course_title ?? c.courseTitle ?? '',
  creditHours: c.credit_hours ?? c.creditHours ?? 0,
  description: c.description ?? '',
  department: c.department ?? '',
  instructorId: String(c.instructor ?? c.instructorId ?? ''),
  instructorName: c.instructor_name ?? c.instructorName ?? '',
  semester: c.semester ?? '',
  academicYear: c.academic_year ?? c.academicYear ?? 0,
  capacity: c.capacity ?? 0,
  enrolledStudentsCount: c.enrolled_students_count ?? c.enrolledStudentsCount ?? 0,
  prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
} as Course);

const mapMaterial = (m: any): CourseMaterial => ({
  id: String(m.id),
  courseId: String(m.course ?? m.courseId ?? ''),
  title: m.title ?? '',
  fileType: m.file_type ?? m.fileType ?? 'Document',
  fileName: m.file_name ?? m.fileName ?? '',
  fileSize: m.file_size ?? m.fileSize ?? '',
  fileData: m.file_data ?? m.fileData ?? undefined,
  chapterWeek: m.chapter_week ?? m.chapterWeek ?? '',
  instructorName: m.instructor_name ?? m.instructorName ?? '',
  uploadedAt: m.uploaded_at ?? m.uploadedAt ?? new Date().toISOString(),
  description: m.description ?? '',
} as CourseMaterial);

const mapAnnouncement = (a: any): Announcement => ({
  id: String(a.id),
  courseId: a.course ? String(a.course) : '',
  courseTitle: a.course_title ?? a.courseTitle ?? '',
  title: a.title ?? '',
  content: a.content ?? '',
  postedBy: a.posted_by ?? a.postedBy ?? '',
  postedAt: a.posted_at ?? a.postedAt ?? new Date().toISOString(),
} as Announcement);

const mapAssignment = (a: any): Assignment => ({
  id: String(a.id),
  courseId: String(a.course ?? a.courseId ?? ''),
  title: a.title ?? '',
  dueDate: a.due_date ?? a.dueDate ?? new Date().toISOString(),
  maxScore: a.max_score ?? a.maxScore ?? 100,
  description: a.description ?? '',
} as Assignment);

const mapSubmission = (s: any): Submission => ({
  id: String(s.id),
  assignmentId: String(s.assignment ?? s.assignmentId ?? ''),
  assignmentTitle: s.assignment_title ?? s.assignmentTitle ?? '',
  courseId: String(s.course ?? s.courseId ?? ''),
  studentId: String(s.student ?? s.studentId ?? ''),
  studentName: s.student_name ?? s.studentName ?? '',
  submittedAt: s.submitted_at ?? s.submittedAt ?? new Date().toISOString(),
  fileUrl: s.file_url ?? s.fileUrl ?? undefined,
  fileName: s.file_name ?? s.fileName ?? '',
  score: s.score ?? undefined,
  feedback: s.feedback ?? undefined,
  status: s.status ?? 'PENDING',
} as Submission);

const mapExam = (e: any): Exam => ({
  id: String(e.id),
  courseId: String(e.course ?? e.courseId ?? ''),
  courseTitle: e.course_title ?? e.courseTitle ?? '',
  examTitle: e.exam_title ?? e.examTitle ?? '',
  examDate: e.exam_date ?? e.examDate ?? new Date().toISOString(),
  durationMinutes: e.duration_minutes ?? e.durationMinutes ?? 60,
  totalMarks: e.total_marks ?? e.totalMarks ?? 100,
  instructions: e.instructions ?? '',
  questions: (e.questions || []).map((q: any) => ({
    questionText: q.question_text ?? q.questionText ?? '',
    questionType: q.question_type ?? q.questionType ?? 'MCQ',
    options: q.options ?? [],
    correctAnswer: q.correct_answer ?? q.correctAnswer ?? '',
    marks: q.marks ?? 5,
  })),
  status: e.status ?? 'DRAFT',
  isPushed: e.is_pushed ?? e.isPushed ?? false,
  pushedAt: e.pushed_at ?? e.pushedAt ?? undefined,
  createdBy: e.created_by ?? e.createdBy ?? '',
  category: e.category ?? 'EXAM',
} as Exam);

const mapExamAttempt = (a: any): ExamAttempt => ({
  id: String(a.id),
  examId: String(a.exam ?? a.examId ?? ''),
  examTitle: a.exam_title ?? a.examTitle ?? '',
  studentId: String(a.student ?? a.studentId ?? ''),
  studentName: a.student_name ?? a.studentName ?? '',
  answers: a.answers ?? {},
  score: a.score ?? 0,
  status: a.status ?? 'IN_PROGRESS',
  startedAt: a.started_at ?? a.startedAt ?? new Date().toISOString(),
  submittedAt: a.submitted_at ?? a.submittedAt ?? undefined,
} as ExamAttempt);

const mapGrade = (g: any): Grade => ({
  id: String(g.id),
  studentId: String(g.student ?? g.studentId ?? ''),
  studentName: g.student_name ?? g.studentName ?? '',
  courseId: String(g.course ?? g.courseId ?? ''),
  courseTitle: g.course_title ?? g.courseTitle ?? '',
  courseCode: g.course_code ?? g.courseCode ?? '',
  creditHours: g.credit_hours ?? g.creditHours ?? 0,
  continuousAssessmentScore: g.continuous_assessment_score ?? g.continuousAssessmentScore ?? 0,
  midExamScore: g.mid_exam_score ?? g.midExamScore ?? 0,
  finalExamScore: g.final_exam_score ?? g.finalExamScore ?? 0,
  totalGrade: g.total_grade ?? g.totalGrade ?? 0,
  letterGrade: g.letter_grade ?? g.letterGrade ?? '',
  gradePoint: g.grade_point ?? g.gradePoint ?? 0,
  semester: g.semester ?? '',
  status: g.status ?? 'CALCULATED',
  comments: g.comments ?? undefined,
} as Grade);

const mapAttendance = (a: any): AttendanceRecord => ({
  id: String(a.id),
  studentId: String(a.student ?? a.studentId ?? ''),
  studentName: a.student_name ?? a.studentName ?? '',
  courseId: String(a.course ?? a.courseId ?? ''),
  courseCode: a.course_code ?? a.courseCode ?? '',
  totalSessions: a.total_sessions ?? a.totalSessions ?? 0,
  attendedSessions: a.attended_sessions ?? a.attendedSessions ?? 0,
  attendancePercentage: a.attendance_percentage ?? a.attendancePercentage ?? 0,
  lastUpdated: a.last_updated ?? a.lastUpdated ?? '',
  meetsMinimum: a.meets_minimum ?? a.meetsMinimum ?? false,
} as AttendanceRecord);

// ---------- USERS ----------
export const getUsers = (): Promise<User[]> =>
  api.get('/users/').then(r =>
    unwrapList<any>(r.data).filter(u => u && typeof u === 'object').map(mapUser)
  );
export const saveUsers = (users: User[]): Promise<User[]> =>
  api.put('/users/', users).then(r => r.data);
export const updateUser = (user: User): Promise<User> =>
  api.put(`/users/${user.id}/`, user).then(r => r.data);

export const login = async (username: string, password: string) => {
  const { data } = await api.post('/token/', { username, password });
  const token = data.access ?? data.token;
  if (token) localStorage.setItem('access_token', token);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data;
};

export const logout = () => {
  clearTokens();
};

// ---------- COURSES ----------
export const getCourses = (): Promise<Course[]> =>
  api.get('/courses/').then(r => unwrapList<any>(r.data).map(mapCourse));
export const saveCourses = (courses: Course[]): Promise<Course[]> =>
  api.put('/courses/', courses).then(r => r.data);
export const updateCourse = (id: string, course: any): Promise<Course> =>
  api.patch(`/courses/${id}/`, course).then(r => r.data);
export const addCourse = (course: any): Promise<Course> =>
  api.post('/courses/', course).then(r => mapCourse(r.data));

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> =>
  api.get('/materials/').then(r => unwrapList<any>(r.data).map(mapMaterial));
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> =>
  api.put('/materials/', materials).then(r => r.data);
export const addMaterial = (material: any): Promise<CourseMaterial> =>
  api.post('/materials/', material).then(r => mapMaterial(r.data));
export const updateMaterial = (id: string, material: any): Promise<CourseMaterial> =>
  api.patch(`/materials/${id}/`, material).then(r => mapMaterial(r.data));
export const deleteMaterial = (id: string): Promise<void> =>
  api.delete(`/materials/${id}/`).then(() => undefined);

// ---------- ANNOUNCEMENTS ----------
export const getAnnouncements = (): Promise<Announcement[]> =>
  api.get('/announcements/').then(r => unwrapList<any>(r.data).map(mapAnnouncement));

export const createAnnouncement = (announcement: any): Promise<any> => {
  const payload: any = {
    course: announcement.course ?? null,
    course_title: announcement.courseTitle ?? announcement.course_title ?? 'Campus News & Announcements',
    title: announcement.title,
    content: announcement.content,
    posted_by: announcement.postedBy ?? announcement.posted_by ?? 'University Media Directorate',
    posted_at: announcement.postedAt ?? announcement.posted_at ?? new Date().toISOString(),
  };
  return api.post('/announcements/', payload).then(r => r.data);
};

export const updateAnnouncement = (id: string, announcement: any): Promise<any> => {
  const payload: any = {
    course: announcement.course ?? null,
    course_title: announcement.courseTitle ?? announcement.course_title ?? 'Campus News & Announcements',
    title: announcement.title,
    content: announcement.content,
    posted_by: announcement.postedBy ?? announcement.posted_by ?? 'University Media Directorate',
    posted_at: announcement.postedAt ?? announcement.posted_at ?? new Date().toISOString(),
  };
  return api.put(`/announcements/${id}/`, payload).then(r => r.data);
};

export const deleteAnnouncement = (id: string): Promise<void> =>
  api.delete(`/announcements/${id}/`).then(() => undefined);

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> =>
  api.get('/assignments/').then(r => unwrapList<any>(r.data).map(mapAssignment));
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> =>
  api.put('/assignments/', assignments).then(r => r.data);
export const addAssignment = (assignment: any): Promise<Assignment> =>
  api.post('/assignments/', assignment).then(r => mapAssignment(r.data));
export const deleteAssignment = (id: string): Promise<void> =>
  api.delete(`/assignments/${id}/`).then(() => undefined);

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> =>
  api.get('/submissions/').then(r => unwrapList<any>(r.data).map(mapSubmission));
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> =>
  api.put('/submissions/', submissions).then(r => r.data);
export const addSubmission = (submission: any): Promise<Submission> =>
  api.post('/submissions/', submission).then(r => mapSubmission(r.data));
export const updateSubmission = (id: string, submission: any): Promise<Submission> =>
  api.patch(`/submissions/${id}/`, submission).then(r => mapSubmission(r.data));

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> =>
  api.get('/exams/').then(r => unwrapList<any>(r.data).map(mapExam));
export const addQuestion = (question: any): Promise<any> =>
  api.post('/questions/', question).then(r => r.data);
export const createExam = (exam: any): Promise<Exam> =>
  api.post('/exams/', exam).then(r => mapExam(r.data));
export const updateExam = (id: string, exam: any): Promise<Exam> =>
  api.patch(`/exams/${id}/`, exam).then(r => mapExam(r.data));
export const pushExam = (examId: string, isPushed: boolean): Promise<Exam> =>
  api.post(`/exams/${examId}/push/`, { is_pushed: isPushed }).then(r => mapExam(r.data));
export const deleteExam = (id: string): Promise<void> =>
  api.delete(`/exams/${id}/`).then(() => undefined);
export const saveExams = (exams: Exam[]): Promise<Exam[]> =>
  api.put('/exams/', exams).then(r => r.data);

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> =>
  api.get('/exam-attempts/').then(r => unwrapList<any>(r.data).map(mapExamAttempt));
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> =>
  api.put('/exam-attempts/', attempts).then(r => r.data);
export const createExamAttempt = (attempt: any): Promise<ExamAttempt> =>
  api.post('/exam-attempts/', attempt).then(r => mapExamAttempt(r.data));

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> =>
  api.get('/grades/').then(r => unwrapList<any>(r.data).map(mapGrade));
export const saveGrades = (grades: Grade[]): Promise<Grade[]> =>
  api.put('/grades/', grades).then(r => r.data);
export const updateGrade = (id: string, grade: any): Promise<Grade> =>
  api.patch(`/grades/${id}/`, grade).then(r => mapGrade(r.data));

// ---------- TRANSCRIPTS ----------
export const getTranscripts = (): Promise<Transcript[]> =>
  api.get('/transcripts/').then(r => unwrapList<Transcript>(r.data));
export const saveTranscripts = (transcripts: Transcript[]): Promise<Transcript[]> =>
  api.put('/transcripts/', transcripts).then(r => r.data);

// ---------- ATTENDANCE ----------
export const getAttendance = (): Promise<AttendanceRecord[]> =>
  api.get('/attendance/').then(r => unwrapList<any>(r.data).map(mapAttendance));
export const saveAttendance = (records: AttendanceRecord[]): Promise<AttendanceRecord[]> =>
  api.put('/attendance/', records).then(r => r.data);
export const updateAttendance = (id: string, data: any): Promise<any> =>
  api.patch(`/attendance/${id}/`, data).then(r => r.data);

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

export const addEvaluation = (evaluation: any): Promise<any> => {
  const payload: any = {
    student: parseInt(String(evaluation.studentId).replace(/\D/g, '')) || evaluation.studentId,
    student_name: evaluation.studentName || '',
    instructor: parseInt(String(evaluation.instructorId).replace(/\D/g, '')) || evaluation.instructorId,
    instructor_name: evaluation.instructorName || '',
    course: evaluation.courseId
      ? parseInt(String(evaluation.courseId).replace(/\D/g, '')) || evaluation.courseId
      : null,
    course_code: evaluation.courseCode || '',
    clarity: evaluation.clarity ?? 0,
    punctuality: evaluation.punctuality ?? 0,
    helpfulness: evaluation.helpfulness ?? 0,
    assessment_fairness: evaluation.assessmentFairness ?? 0,
    overall_rating: evaluation.overallRating ?? 0,
    comments: evaluation.comments || '',
    semester: evaluation.semester || '',
  };
  return api.post('/evaluations/', payload).then(r => r.data);
};

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
  api.get('/settings/').then(r => {
    const raw = r.data;
    if (raw && Array.isArray(raw.results)) return raw.results[0] ?? raw;
    return raw;
  });
export const saveSettings = (settings: SystemSettings): Promise<SystemSettings> =>
  api.put('/settings/', settings).then(r => r.data);

// ---------- AI ----------
export const predictStudentRisk = async (studentId: string): Promise<AIRiskPrediction> => {
  const raw: any = await api.post('/ai/predict-risk/', { studentId }).then(r => r.data);
  return {
    classification: raw.classification,
    dropoutProbability: raw.dropout_probability ?? raw.dropoutProbability ?? 0,
    attendancePercentage: raw.attendance_percentage ?? raw.attendancePercentage ?? 0,
    continuousAssessmentAvg: raw.continuous_assessment_avg ?? raw.continuousAssessmentAvg ?? 0,
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

// ---------- AI CHAT (Groq) ----------
export const sendChatMessage = (payload: {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<{ reply: string }> =>
  api.post('/ai/chat/', payload).then(r => r.data);

// ---------- AUDIT LOG HELPER (non-fatal) ----------
export const addAuditLog = async (
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<AuditLog | null> => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const res = await api.post('/audit-logs/', {
      user: userId,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    });
    return res.data;
  } catch (err: any) {
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
  dept: 'LIBRARY' | 'FINANCE' | 'DORMITORY' | 'DEPARTMENT_LAB' | 'REGISTRAR',
  status: 'CLEARED' | 'REJECTED' | 'PENDING',
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
  id: String(raw?.id ?? ''),
  courseId: raw?.course ?? raw?.courseId ?? null,
  courseCode: raw?.course_code ?? raw?.courseCode ?? '',
  courseTitle: raw?.course_title ?? raw?.courseTitle ?? '',
  title: raw?.title ?? '',
  topic: raw?.topic ?? '',
  instructorId: String(raw?.instructor ?? raw?.instructorId ?? ''),
  instructorName: raw?.instructor_name ?? raw?.instructorName ?? '',
  startTime: raw?.start_time ?? raw?.startTime ?? new Date().toISOString(),
  durationMinutes: raw?.duration_minutes ?? raw?.durationMinutes ?? 60,
  meetingId: raw?.meeting_id ?? raw?.meetingId ?? '',
  passcode: raw?.passcode ?? '',
  joinUrl: raw?.join_url ?? raw?.joinUrl ?? '',
  hostUrl: raw?.host_url ?? raw?.hostUrl ?? '',
  status: raw?.status ?? 'UPCOMING',
  lectureNotes: raw?.lecture_notes ?? raw?.lectureNotes ?? '',
  recordingUrl: raw?.recording_url ?? raw?.recordingUrl ?? '',
  recordingDuration: raw?.recording_duration ?? raw?.recordingDuration ?? '',
  activeAttendees: raw?.active_attendees ?? raw?.activeAttendees ?? [],
  chatMessages: raw?.chat_messages ?? raw?.chatMessages ?? [],
});

export const getZoomSessions = (): Promise<any[]> =>
  api.get('/zoom-sessions/').then(r => unwrapList<any>(r.data).map(fromZoomSnakeCase));
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
  login,
  logout,
  getCourses,
  saveCourses,
  updateCourse,
  addCourse,
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
  addQuestion,
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
  updateAttendance,
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
  addEvaluation,
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
  sendChatMessage,
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