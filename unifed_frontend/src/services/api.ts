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
  AttendanceSession,
  AttendanceCheckIn,
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
  // ===== CLINIC TYPES (ADDED) =====
  StudentClinicProfile,
  ClinicAppointment,
  ClinicPrescription,
  ClinicLabTest,
  ClinicSickLeaveCertificate,
  AmbulanceEmergencyCall,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// ✅ FIX: Export the axios instance so other files can use it
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

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
  const hasUser = !!localStorage.getItem('uscms_current_user');
  if (!hasUser) {
    console.warn('[auth] forceLogout skipped — no user session');
    return;
  }
  clearTokens();
  window.dispatchEvent(new CustomEvent('uscms:auth-expired'));
};

// ---------- REQUEST INTERCEPTOR ----------
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  console.log('[api→]', config.method?.toUpperCase(), config.url, '| token:', token ? token.slice(0, 20) + '…' : 'NULL');
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
    if (error?.response?.status === 401) {
      console.warn('[api←] 401 on', originalRequest?.method?.toUpperCase(), originalRequest?.url, '| had Authorization header:', !!originalRequest?.headers?.Authorization);
    }
    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/token/refresh/')
    ) {
      originalRequest._retry = true;
      const refresh = getRefreshToken();
      if (!refresh) {
        const hasUser = !!localStorage.getItem('uscms_current_user');
        if (hasUser) {
          console.warn('[auth] No refresh token but user was logged in — forcing logout');
          forceLogout();
        } else {
          console.warn('[auth] No refresh token and no user — ignoring (probably login page)');
        }
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
        setTokens(data.access, data.refresh);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshErr: any) {
        console.warn('[auth] Refresh failed:', refreshErr?.response?.status, refreshErr?.response?.data || refreshErr?.message);
        const hasUser = !!localStorage.getItem('uscms_current_user');
        if (hasUser) {
          forceLogout();
        } else {
          console.warn('[auth] Ignoring refresh failure — no user session');
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

// Helper: unwrap DRF pagination envelope
const unwrapList = <T>(raw: any): T[] =>
  Array.isArray(raw) ? raw : (raw?.results ?? []);

// Helper: strip "U_", "PAY_", "LIB_" etc. prefixes so we get a numeric pk
const numericId = (id: string | number, prefix?: string): string => {
  const s = String(id);
  return prefix ? s.replace(new RegExp(`^${prefix}`), '') : s.replace(/^[A-Z]+_/, '');
};

// Helper: coerce any ID to a plain integer
const toPk = (id: string | number | null | undefined): number | null => {
  if (id == null || id === '') return null;
  if (typeof id === 'number') return Number.isFinite(id) ? id : null;
  const digits = String(id).replace(/\D/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
};

// ---------- MAPPERS ----------
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
  totalGrade: Number(g.total_grade ?? g.totalGrade ?? g.total_marks ?? g.totalMarks ?? g.score ?? 0),
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

const mapAttendanceCheckIn = (c: any): AttendanceCheckIn => ({
  id: String(c.id),
  sessionId: String(c.session ?? c.sessionId ?? ''),
  studentId: String(c.student ?? c.studentId ?? ''),
  studentName: c.student_name ?? c.studentName ?? '',
  status: c.status ?? 'PRESENT',
  method: c.method ?? 'CODE',
  checkedInAt: c.checked_in_at ?? c.checkedInAt ?? '',
  ipAddress: c.ip_address ?? c.ipAddress ?? undefined,
} as AttendanceCheckIn);

const mapAttendanceSession = (s: any): AttendanceSession => ({
  id: String(s.id),
  courseId: String(s.course ?? s.courseId ?? ''),
  courseCode: s.course_code ?? s.courseCode ?? '',
  courseTitle: s.course_title ?? s.courseTitle ?? '',
  instructorId: String(s.instructor ?? s.instructorId ?? ''),
  instructorName: s.instructor_name ?? s.instructorName ?? '',
  title: s.title ?? 'Class Session',
  topic: s.topic ?? undefined,
  location: s.location ?? undefined,
  sessionDate: s.session_date ?? s.sessionDate ?? '',
  startedAt: s.started_at ?? s.startedAt ?? '',
  expiresAt: s.expires_at ?? s.expiresAt ?? '',
  endedAt: s.ended_at ?? s.endedAt ?? undefined,
  checkInCode: s.check_in_code ?? s.checkInCode ?? null,
  status: s.status ?? 'CLOSED',
  lateAfterMinutes: s.late_after_minutes ?? s.lateAfterMinutes ?? 10,
  totalsApplied: s.totals_applied ?? s.totalsApplied ?? false,
  checkIns: Array.isArray(s.check_ins) ? s.check_ins.map(mapAttendanceCheckIn) : Array.isArray(s.checkIns) ? s.checkIns.map(mapAttendanceCheckIn) : [],
  checkedInCount: s.checked_in_count ?? s.checkedInCount ?? 0,
  secondsRemaining: s.seconds_remaining ?? s.secondsRemaining ?? 0,
  isExpired: s.is_expired ?? s.isExpired ?? false,
} as AttendanceSession);

// ---------- USERS ----------
export const getUsers = (): Promise<User[]> => api.get('/users/').then(r => unwrapList<any>(r.data).filter(u => u && typeof u === 'object').map(mapUser));
export const saveUsers = (users: User[]): Promise<User[]> => api.put('/users/', users).then(r => r.data);
export const updateUser = (user: User): Promise<User> => api.put(`/users/${numericId(user.id, 'U_')}/`, user).then(r => r.data);
export const addUser = (payload: any): Promise<User> => api.post('/users/', payload).then(r => mapUser(r.data));
export const patchUser = (id: string, patch: any): Promise<User> => api.patch(`/users/${numericId(id, 'U_')}/`, patch).then(r => mapUser(r.data));
export const deleteUser = (id: string): Promise<void> => api.delete(`/users/${numericId(id, 'U_')}/`).then(() => undefined);
export const login = async (username: string, password: string) => {
  const { data } = await api.post('/token/', { username, password });
  const token = data.access ?? data.token;
  if (token) localStorage.setItem('access_token', token);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data;
};
export const logout = () => { clearTokens(); };
export const requestPasswordReset = (email: string): Promise<any> => api.post('/users/request_password_reset/', { email }).then(r => r.data);
export const confirmPasswordReset = (email: string, otp: string, newPassword: string): Promise<any> => api.post('/users/confirm_password_reset/', { email, otp, new_password: newPassword }).then(r => r.data);
export const uploadAvatar = (userId: string, base64Image: string): Promise<any> => api.post(`/users/${numericId(userId, 'U_')}/upload_avatar/`, { image: base64Image }).then(r => r.data);

// ---------- COURSES ----------
export const getCourses = (): Promise<Course[]> => api.get('/courses/').then(r => unwrapList<any>(r.data).map(mapCourse));
export const saveCourses = (courses: Course[]): Promise<Course[]> => api.put('/courses/', courses).then(r => r.data);
export const updateCourse = (id: string, course: any): Promise<Course> => api.patch(`/courses/${numericId(id)}/`, course).then(r => r.data);
export const addCourse = (course: any): Promise<Course> => api.post('/courses/', course).then(r => mapCourse(r.data));
export const deleteCourse = (id: string): Promise<void> => api.delete(`/courses/${numericId(id)}/`).then(() => undefined);

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> => api.get('/materials/').then(r => unwrapList<any>(r.data).map(mapMaterial));
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> => api.put('/materials/', materials).then(r => r.data);
export const addMaterial = (material: any): Promise<CourseMaterial> => api.post('/materials/', material).then(r => mapMaterial(r.data));
export const updateMaterial = (id: string, material: any): Promise<CourseMaterial> => api.patch(`/materials/${numericId(id)}/`, material).then(r => mapMaterial(r.data));
export const deleteMaterial = (id: string): Promise<void> => api.delete(`/materials/${numericId(id)}/`).then(() => undefined);

// ---------- ANNOUNCEMENTS ----------
export const getAnnouncements = (): Promise<Announcement[]> => api.get('/announcements/').then(r => unwrapList<any>(r.data).map(mapAnnouncement));
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
  return api.put(`/announcements/${numericId(id)}/`, payload).then(r => r.data);
};
export const patchAnnouncement = (id: string, patch: any): Promise<any> => api.patch(`/announcements/${numericId(id)}/`, patch).then(r => r.data);
export const deleteAnnouncement = (id: string): Promise<void> => api.delete(`/announcements/${numericId(id)}/`).then(() => undefined);

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> => api.get('/assignments/').then(r => unwrapList<any>(r.data).map(mapAssignment));
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> => api.put('/assignments/', assignments).then(r => r.data);
export const addAssignment = (assignment: any): Promise<Assignment> => api.post('/assignments/', assignment).then(r => mapAssignment(r.data));
export const updateAssignment = (id: string, patch: any): Promise<Assignment> => api.patch(`/assignments/${numericId(id)}/`, patch).then(r => mapAssignment(r.data));
export const deleteAssignment = (id: string): Promise<void> => api.delete(`/assignments/${numericId(id)}/`).then(() => undefined);

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> => api.get('/submissions/').then(r => unwrapList<any>(r.data).map(mapSubmission));
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> => api.put('/submissions/', submissions).then(r => r.data);
export const addSubmission = (submission: any): Promise<Submission> => api.post('/submissions/', submission).then(r => mapSubmission(r.data));
export const updateSubmission = (id: string, submission: any): Promise<Submission> => api.patch(`/submissions/${numericId(id)}/`, submission).then(r => mapSubmission(r.data));
export const deleteSubmission = (id: string): Promise<void> => api.delete(`/submissions/${numericId(id)}/`).then(() => undefined);

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> => api.get('/exams/').then(r => unwrapList<any>(r.data).map(mapExam));
export const addQuestion = (question: any): Promise<any> => api.post('/questions/', question).then(r => r.data);
export const createExam = (exam: any): Promise<Exam> => api.post('/exams/', exam).then(r => mapExam(r.data));
export const updateExam = (id: string, exam: any): Promise<Exam> => api.patch(`/exams/${numericId(id)}/`, exam).then(r => mapExam(r.data));
export const pushExam = (examId: string, isPushed: boolean): Promise<Exam> => api.post(`/exams/${numericId(examId)}/push/`, { is_pushed: isPushed }).then(r => mapExam(r.data));
export const deleteExam = (id: string): Promise<void> => api.delete(`/exams/${numericId(id)}/`).then(() => undefined);
export const saveExams = (exams: Exam[]): Promise<Exam[]> => api.put('/exams/', exams).then(r => r.data);

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> => api.get('/exam-attempts/').then(r => unwrapList<any>(r.data).map(mapExamAttempt));
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> => api.put('/exam-attempts/', attempts).then(r => r.data);
export const createExamAttempt = (attempt: any): Promise<ExamAttempt> => {
  const examPk = toPk(attempt.exam);
  const studentPk = toPk(attempt.student);
  if (examPk == null || studentPk == null) {
    const msg = `createExamAttempt: invalid IDs — exam=${JSON.stringify(attempt.exam)} student=${JSON.stringify(attempt.student)}`;
    console.error(msg);
    return Promise.reject(new Error(msg));
  }
  return api.post('/exam-attempts/', { ...attempt, exam: examPk, student: studentPk }).then(r => mapExamAttempt(r.data));
};
export const updateExamAttempt = async (id: string, patch: any): Promise<ExamAttempt> => {
  const attemptPk = numericId(id);
  try {
    const res = await api.patch(`/exam-attempts/${attemptPk}/`, patch);
    return mapExamAttempt(res.data);
  } catch (patchErr: any) {
    if (patchErr?.response?.status !== 404) throw patchErr;
    const fallbackPayload: any = {
      exam: toPk(patch.exam),
      student: toPk(patch.student),
      student_name: patch.student_name || patch.studentName || '',
      exam_title: patch.exam_title || patch.examTitle || '',
      answers: patch.answers ?? {},
      score: patch.score ?? 0,
      status: patch.status ?? 'SUBMITTED',
      submitted_at: patch.submitted_at ?? new Date().toISOString(),
    };
    if (fallbackPayload.exam == null || fallbackPayload.student == null) {
      throw new Error(`Cannot recreate attempt — exam/student IDs missing. exam=${patch.exam}, student=${patch.student}`);
    }
    const created = await api.post('/exam-attempts/', fallbackPayload);
    return mapExamAttempt(created.data);
  }
};
export const deleteExamAttempt = (id: string): Promise<void> => api.delete(`/exam-attempts/${numericId(id)}/`).then(() => undefined);

// ---------- MONITORING EVENTS ----------
export const logMonitoringEvent = (data: { attempt: number | string; event_type: string; details: string }): Promise<any> => {
  const attemptPk = toPk(data.attempt);
  if (attemptPk == null) {
    console.warn('[logMonitoringEvent] invalid attempt id:', data.attempt);
    return Promise.resolve(null);
  }
  return api.post('/monitoring-events/', { ...data, attempt: attemptPk }).then(r => r.data);
};
export const getMonitoringEvents = (): Promise<any[]> => api.get('/monitoring-events/').then(r => unwrapList<any>(r.data));

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> => api.get('/grades/').then(r => unwrapList<any>(r.data).map(mapGrade));
export const saveGrades = (grades: Grade[]): Promise<Grade[]> => api.put('/grades/', grades).then(r => r.data);
export const addGrade = (payload: any): Promise<Grade> => api.post('/grades/', payload).then(r => mapGrade(r.data));
export const updateGrade = (id: string, grade: any): Promise<Grade> => api.patch(`/grades/${numericId(id)}/`, grade).then(r => mapGrade(r.data));
export const deleteGrade = (id: string): Promise<void> => api.delete(`/grades/${numericId(id)}/`).then(() => undefined);

// ---------- TRANSCRIPTS ----------
export const getTranscripts = (): Promise<Transcript[]> => api.get('/transcripts/').then(r => unwrapList<Transcript>(r.data));
export const saveTranscripts = (transcripts: Transcript[]): Promise<Transcript[]> => api.put('/transcripts/', transcripts).then(r => r.data);
export const addTranscript = (payload: any): Promise<Transcript> => api.post('/transcripts/', payload).then(r => r.data);
export const updateTranscript = (id: string, patch: any): Promise<Transcript> => api.patch(`/transcripts/${numericId(id)}/`, patch).then(r => r.data);
export const deleteTranscript = (id: string): Promise<void> => api.delete(`/transcripts/${numericId(id)}/`).then(() => undefined);

// ---------- ATTENDANCE ----------
export const getAttendance = (): Promise<AttendanceRecord[]> => api.get('/attendance/').then(r => unwrapList<any>(r.data).map(mapAttendance));
export const saveAttendance = (records: AttendanceRecord[]): Promise<AttendanceRecord[]> => api.put('/attendance/', records).then(r => r.data);
export const addAttendance = (payload: any): Promise<AttendanceRecord> => api.post('/attendance/', payload).then(r => mapAttendance(r.data));
export const updateAttendance = (id: string, data: any): Promise<any> => api.patch(`/attendance/${numericId(id)}/`, data).then(r => r.data);
export const deleteAttendance = (id: string): Promise<void> => api.delete(`/attendance/${numericId(id)}/`).then(() => undefined);

// ---------- LIVE ATTENDANCE SESSIONS ----------
export const getAttendanceSessions = (): Promise<AttendanceSession[]> => api.get('/attendance-sessions/').then(r => unwrapList<any>(r.data).map(mapAttendanceSession));
export const getAttendanceSession = (id: string): Promise<AttendanceSession> => api.get(`/attendance-sessions/${numericId(id)}/live/`).then(r => mapAttendanceSession(r.data));
export const getActiveAttendanceSessions = (): Promise<AttendanceSession[]> => api.get('/attendance-sessions/active/').then(r => unwrapList<any>(r.data).map(mapAttendanceSession));
export const openAttendanceSession = (payload: { course: string | number; title?: string; topic?: string; location?: string; duration_minutes?: number; late_after_minutes?: number; }): Promise<AttendanceSession> => api.post('/attendance-sessions/open/', { ...payload, course: toPk(payload.course) }).then(r => mapAttendanceSession(r.data));
export const closeAttendanceSession = (id: string): Promise<AttendanceSession> => api.post(`/attendance-sessions/${numericId(id)}/close/`).then(r => mapAttendanceSession(r.data));
export const checkInAttendance = (code: string): Promise<{ message: string; check_in: AttendanceCheckIn; session: any; attendance: AttendanceRecord; }> => api.post('/attendance-sessions/check-in/', { code: code.trim().toUpperCase() }).then(r => ({ ...r.data, check_in: mapAttendanceCheckIn(r.data?.check_in ?? {}), attendance: mapAttendance(r.data?.attendance ?? {}) }));

// ---------- LIBRARY RESOURCES ----------
export const getLibraryResources = (): Promise<LibraryResource[]> => api.get('/library-resources/').then(r => unwrapList<LibraryResource>(r.data));
export const saveLibraryResources = (resources: LibraryResource[]): Promise<LibraryResource[]> => api.put('/library-resources/', resources).then(r => r.data);
export const addLibraryResource = (payload: any): Promise<LibraryResource> => api.post('/library-resources/', payload).then(r => r.data);
export const updateLibraryResource = (id: string, patch: any): Promise<LibraryResource> => api.patch(`/library-resources/${numericId(id, 'LIB_')}/`, patch).then(r => r.data);
export const deleteLibraryResource = (id: string): Promise<void> => api.delete(`/library-resources/${numericId(id, 'LIB_')}/`).then(() => undefined);

// ---------- PAYMENTS ----------
export const getPayments = (): Promise<PaymentTransaction[]> => api.get('/payments/').then(r => unwrapList<PaymentTransaction>(r.data));
export const savePayments = (payments: PaymentTransaction[]): Promise<PaymentTransaction[]> => api.put('/payments/', payments).then(r => r.data);
export const addPayment = (payload: any): Promise<PaymentTransaction> => api.post('/payments/', payload).then(r => r.data);
export const updatePayment = (id: string, patch: any): Promise<PaymentTransaction> => api.patch(`/payments/${numericId(id, 'PAY_')}/`, patch).then(r => r.data);
export const deletePayment = (id: string): Promise<void> => api.delete(`/payments/${numericId(id, 'PAY_')}/`).then(() => undefined);

// ---------- SCHOLARSHIPS ----------
export const getScholarships = (): Promise<Scholarship[]> => api.get('/scholarships/').then(r => unwrapList<Scholarship>(r.data));
export const saveScholarships = (scholarships: Scholarship[]): Promise<Scholarship[]> => api.put('/scholarships/', scholarships).then(r => r.data);
export const addScholarship = (payload: any): Promise<Scholarship> => api.post('/scholarships/', payload).then(r => r.data);
export const updateScholarship = (id: string, patch: any): Promise<Scholarship> => api.patch(`/scholarships/${numericId(id, 'SCH_')}/`, patch).then(r => r.data);
export const deleteScholarship = (id: string): Promise<void> => api.delete(`/scholarships/${numericId(id, 'SCH_')}/`).then(() => undefined);

// ---------- COURSE OUTLINES ----------
export const getCourseOutlines = (): Promise<CourseOutlineForm[]> => api.get('/course-outlines/').then(r => unwrapList<CourseOutlineForm>(r.data));
export const saveCourseOutlines = (outlines: CourseOutlineForm[]): Promise<CourseOutlineForm[]> => api.put('/course-outlines/', outlines).then(r => r.data);
export const addCourseOutline = (payload: any): Promise<CourseOutlineForm> => api.post('/course-outlines/', payload).then(r => r.data);
export const updateCourseOutline = (id: string, patch: any): Promise<CourseOutlineForm> => api.patch(`/course-outlines/${numericId(id)}/`, patch).then(r => r.data);
export const deleteCourseOutline = (id: string): Promise<void> => api.delete(`/course-outlines/${numericId(id)}/`).then(() => undefined);

// ---------- EVALUATIONS ----------
const mapEvaluation = (e: any): InstructorEvaluation => {
  const rawRatings = e.ratings && typeof e.ratings === 'object' ? e.ratings : {};
  return {
    id: String(e.id),
    studentId: String(e.student ?? e.student_id ?? e.studentId ?? ''),
    instructorId: String(e.instructor ?? e.instructor_id ?? e.instructorId ?? ''),
    instructorName: e.instructor_name ?? e.instructorName ?? '',
    courseId: String(e.course ?? e.course_id ?? e.courseId ?? ''),
    courseCode: e.course_code ?? e.courseCode ?? '',
    ratings: {
      clarity: Number(rawRatings.clarity ?? e.clarity ?? 0),
      punctuality: Number(rawRatings.punctuality ?? e.punctuality ?? 0),
      helpfulness: Number(rawRatings.helpfulness ?? e.helpfulness ?? 0),
      assessmentFairness: Number(rawRatings.assessmentFairness ?? rawRatings.assessment_fairness ?? e.assessment_fairness ?? 0),
      overallRating: Number(rawRatings.overallRating ?? rawRatings.overall_rating ?? e.overall_rating ?? e.overallRating ?? 0),
    } as any,
    comments: e.comments ?? '',
    semester: e.semester ?? '',
    submittedAt: e.submitted_at ?? e.submittedAt ?? new Date().toISOString(),
  };
};
export const getEvaluations = (): Promise<InstructorEvaluation[]> => api.get('/evaluations/').then(r => unwrapList<any>(r.data).filter(e => e && typeof e === 'object').map(mapEvaluation));
export const saveEvaluations = (evaluations: InstructorEvaluation[]): Promise<InstructorEvaluation[]> => api.put('/evaluations/', evaluations).then(r => r.data);
export const addEvaluation = (evaluation: any): Promise<any> => {
  const payload: any = {
    student: toPk(evaluation.studentId),
    student_name: evaluation.studentName || '',
    instructor: toPk(evaluation.instructorId),
    instructor_name: evaluation.instructorName || '',
    course: evaluation.courseId ? toPk(evaluation.courseId) : null,
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
export const updateEvaluation = (id: string, patch: any): Promise<any> => api.patch(`/evaluations/${numericId(id)}/`, patch).then(r => r.data);
export const deleteEvaluation = (id: string): Promise<void> => api.delete(`/evaluations/${numericId(id)}/`).then(() => undefined);

// ---------- MOE ADMISSIONS ----------
export const getMoEAdmissions = (): Promise<MoEAdmissionRecord[]> => api.get('/moe-admissions/').then(r => unwrapList<MoEAdmissionRecord>(r.data));
export const saveMoEAdmissions = (admissions: MoEAdmissionRecord[]): Promise<MoEAdmissionRecord[]> => api.put('/moe-admissions/', admissions).then(r => r.data);
export const addMoEAdmission = (payload: any): Promise<MoEAdmissionRecord> => api.post('/moe-admissions/', payload).then(r => r.data);
export const updateMoEAdmission = (id: string, patch: any): Promise<MoEAdmissionRecord> => api.patch(`/moe-admissions/${numericId(id)}/`, patch).then(r => r.data);
export const deleteMoEAdmission = (id: string): Promise<void> => api.delete(`/moe-admissions/${numericId(id)}/`).then(() => undefined);

// ---------- CERTIFICATES ----------
export const getCertificates = (): Promise<CertificateRecord[]> => api.get('/certificates/').then(r => unwrapList<CertificateRecord>(r.data));
export const saveCertificates = (certificates: CertificateRecord[]): Promise<CertificateRecord[]> => api.put('/certificates/', certificates).then(r => r.data);
export const addCertificate = (payload: any): Promise<CertificateRecord> => api.post('/certificates/', payload).then(r => r.data);
export const updateCertificate = (id: string, patch: any): Promise<CertificateRecord> => api.patch(`/certificates/${numericId(id)}/`, patch).then(r => r.data);
export const deleteCertificate = (id: string): Promise<void> => api.delete(`/certificates/${numericId(id)}/`).then(() => undefined);

// ---------- AUDIT LOGS ----------
export const getAuditLogs = (): Promise<AuditLog[]> => api.get('/audit-logs/').then(r => unwrapList<AuditLog>(r.data));
export const saveAuditLogs = (logs: AuditLog[]): Promise<AuditLog[]> => api.put('/audit-logs/', logs).then(r => r.data);

// ---------- SETTINGS ----------
export const getSettings = (): Promise<SystemSettings> => api.get('/settings/').then(r => {
  const raw = r.data;
  if (raw && Array.isArray(raw.results)) return raw.results[0] ?? raw;
  return raw;
});
export const saveSettings = (settings: SystemSettings): Promise<SystemSettings> => api.put('/settings/', settings).then(r => r.data);
export const updateSettings = (id: string, patch: any): Promise<SystemSettings> => api.patch(`/settings/${numericId(id)}/`, patch).then(r => r.data);

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
export const generateExamQuestions = (params: { courseId: string; topic: string; numberOfQuestions: number; difficulty: string; }): Promise<{ success: boolean; questions: any[]; error?: string; }> => api.post('/ai/generate-exam/', params).then(r => r.data);
export const getCourseAdvisor = (data: { studentId?: string; interests: string; program: string; currentSemester?: string; completedCourses?: string[]; }): Promise<{ summary: string; recommendations: any[]; }> => api.post('/ai/course-advisor/', data).then(r => r.data);
export const sendChatMessage = (payload: { message: string; history?: { role: 'user' | 'assistant'; content: string; }[]; }): Promise<{ reply: string; }> => api.post('/ai/chat/', payload).then(r => r.data);

// ---------- AUDIT LOG HELPER (non-fatal) ----------
export const addAuditLog = async (userId: string, userName: string, userRole: string, action: string, entityType: string, entityId: string, description: string): Promise<AuditLog | null> => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const res = await axios.post(`${API_BASE}/audit-logs/`, {
      user: numericId(userId, 'U_'),
      user_id: numericId(userId, 'U_'),
      user_name: userName,
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return res.data;
  } catch (err: any) {
    console.warn('[audit-log] write failed (non-fatal):', err?.response?.status, err?.response?.data || err?.message);
    return null;
  }
};

// ---------- CLEARANCES ----------
export const getClearances = (): Promise<StudentClearance[]> => api.get('/clearances/').then(r => unwrapList<StudentClearance>(r.data));
export const saveClearances = (clearances: StudentClearance[]): Promise<StudentClearance[]> => api.put('/clearances/', clearances).then(r => r.data);
export const addClearance = (payload: any): Promise<StudentClearance> => api.post('/clearances/', payload).then(r => r.data);
export const updateClearance = (id: string, patch: any): Promise<StudentClearance> => api.patch(`/clearances/${numericId(id)}/`, patch).then(r => r.data);
export const deleteClearance = (id: string): Promise<void> => api.delete(`/clearances/${numericId(id)}/`).then(() => undefined);
export const updateClearanceStage = (clearanceId: string, dept: 'LIBRARY' | 'FINANCE' | 'DORMITORY' | 'DEPARTMENT_LAB' | 'REGISTRAR', status: 'CLEARED' | 'REJECTED' | 'PENDING', officerName: string, remarks?: string): Promise<StudentClearance> => api.patch(`/clearances/${numericId(clearanceId)}/stage/`, { department: dept, status, officerName, remarks }).then(r => r.data);

// ---------- FACILITY BOOKINGS ----------
export const getFacilityBookings = (): Promise<FacilityBooking[]> => api.get('/facility-bookings/').then(r => unwrapList<FacilityBooking>(r.data));
export const saveFacilityBookings = (bookings: FacilityBooking[]): Promise<FacilityBooking[]> => api.put('/facility-bookings/', bookings).then(r => r.data);
export const addFacilityBooking = (booking: Omit<FacilityBooking, 'id'>): Promise<FacilityBooking> => api.post('/facility-bookings/', booking).then(r => r.data);
export const updateFacilityBooking = (id: string, patch: any): Promise<FacilityBooking> => api.patch(`/facility-bookings/${numericId(id)}/`, patch).then(r => r.data);
export const deleteFacilityBooking = (id: string): Promise<void> => api.delete(`/facility-bookings/${numericId(id)}/`).then(() => undefined);
export const getFacilities = (): Promise<any[]> => api.get('/facilities/').then(r => unwrapList<any>(r.data));
export const approveFacilityBooking = (id: string): Promise<any> => api.post(`/facility-bookings/${numericId(id)}/approve/`).then(r => r.data);
export const rejectFacilityBooking = (id: string, reason: string): Promise<any> => api.post(`/facility-bookings/${numericId(id)}/reject/`, { reason }).then(r => r.data);
export const cancelFacilityBooking = (id: string): Promise<any> => api.post(`/facility-bookings/${numericId(id)}/cancel/`).then(r => r.data);

// ---------- CAMPUS ALERTS ----------
export const getCampusAlerts = (): Promise<CampusAlert[]> => api.get('/campus-alerts/').then(r => unwrapList<CampusAlert>(r.data));
export const saveCampusAlerts = (alerts: CampusAlert[]): Promise<CampusAlert[]> => api.put('/campus-alerts/', alerts).then(r => r.data);
export const addCampusAlert = (alert: Omit<CampusAlert, 'id' | 'timestamp'>): Promise<CampusAlert> => api.post('/campus-alerts/', alert).then(r => r.data);
export const updateCampusAlert = (id: string, patch: any): Promise<CampusAlert> => api.patch(`/campus-alerts/${numericId(id)}/`, patch).then(r => r.data);
export const deleteCampusAlert = (id: string): Promise<void> => api.delete(`/campus-alerts/${numericId(id)}/`).then(() => undefined);

// ---------- CAMPUS MEDIA POSTS ----------
export const getMediaPosts = (): Promise<CampusMediaPost[]> => api.get('/media-posts/').then(r => unwrapList<CampusMediaPost>(r.data));
export const saveMediaPosts = (posts: CampusMediaPost[]): Promise<CampusMediaPost[]> => api.put('/media-posts/', posts).then(r => r.data);
export const addMediaPost = (post: Omit<CampusMediaPost, 'id' | 'postedAt' | 'viewsCount' | 'likesCount'>): Promise<CampusMediaPost> => api.post('/media-posts/', post).then(r => r.data);
export const uploadMediaPost = (formData: FormData): Promise<CampusMediaPost> => api.post('/media-posts/', formData).then(r => r.data);
export const updateMediaPost = (id: string, patch: any): Promise<CampusMediaPost> => api.patch(`/media-posts/${numericId(id)}/`, patch).then(r => r.data);
export const deleteMediaPost = (id: string): Promise<{ success: boolean }> => api.delete(`/media-posts/${numericId(id)}/`).then(r => r.data);
export const incrementMediaViews = (id: string): Promise<void> => api.post(`/media-posts/${numericId(id)}/view/`).then(r => r.data);
export const toggleMediaLike = (id: string): Promise<{ likesCount: number }> => api.post(`/media-posts/${numericId(id)}/like/`).then(r => r.data);

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
export const getZoomSessions = (): Promise<any[]> => api.get('/zoom-sessions/').then(r => unwrapList<any>(r.data).map(fromZoomSnakeCase));
export const addZoomSession = (data: any): Promise<any> => api.post('/zoom-sessions/', toZoomSnakeCase(data)).then(r => fromZoomSnakeCase(r.data));
export const updateZoomSession = (id: string, data: any): Promise<any> => api.patch(`/zoom-sessions/${numericId(id)}/`, toZoomSnakeCase(data)).then(r => fromZoomSnakeCase(r.data));
export const deleteZoomSession = (id: string): Promise<void> => api.delete(`/zoom-sessions/${numericId(id)}/`).then(() => undefined);


// =====================================================================
// ✅ REAL API CALLS FOR MMS (Material Management System)
// =====================================================================
export const getInventoryItems = (): Promise<any[]> => api.get('/mms/inventory/').then(r => unwrapList(r.data));
export const addInventoryItem = (item: any): Promise<any> => api.post('/mms/inventory/', item).then(r => r.data);

// ✅ FIXED: Now points to the custom action endpoint to trigger the bin-card ledger
export const adjustStock = (id: string, delta: number, reason: string, by: string): Promise<any> => {
  return api.post(`/mms/inventory/${id}/adjust-stock/`, {
    delta,
    reason,
    performed_by: by
  }).then(r => r.data);
};

export const getMaterialRequisitions = (): Promise<any[]> => api.get('/mms/requisitions/').then(r => unwrapList(r.data));
export const addMaterialRequisition = (req: any): Promise<any> => api.post('/mms/requisitions/', req).then(r => r.data);
export const updateMaterialRequisitionStatus = (id: string, status: string, note: string, by: string): Promise<any> => api.patch(`/mms/requisitions/${id}/`, { status, approvedBy: by, remarks: note }).then(r => r.data);
export const getGoodsReceivingRecords = (): Promise<any[]> => api.get('/mms/receiving/').then(r => unwrapList(r.data));
export const addGoodsReceivingRecord = (grn: any): Promise<any> => api.post('/mms/receiving/', grn).then(r => r.data);
export const getFixedAssets = (): Promise<any[]> => api.get('/mms/assets/').then(r => unwrapList(r.data));
export const addFixedAsset = (asset: any): Promise<any> => api.post('/mms/assets/', asset).then(r => r.data);
export const getInterStoreTransfers = (): Promise<any[]> => api.get('/mms/transfers/').then(r => unwrapList(r.data));
export const addInterStoreTransfer = (t: any): Promise<any> => api.post('/mms/transfers/', t).then(r => r.data);
export const updateInterStoreTransferStatus = (id: string, status: string, by: string): Promise<any> => api.patch(`/mms/transfers/${id}/`, { status, receivedBy: by }).then(r => r.data);
export const getPropertyReturns = (): Promise<any[]> => api.get('/mms/returns/').then(r => unwrapList(r.data));
export const addPropertyReturn = (r: any): Promise<any> => api.post('/mms/returns/', r).then(r => r.data);
export const getCampusGatePasses = (): Promise<any[]> => api.get('/mms/gate-passes/').then(r => unwrapList(r.data));
export const addCampusGatePass = (g: any): Promise<any> => api.post('/mms/gate-passes/', g).then(r => r.data);
export const updateGatePassStatus = (id: string, status: string, guard: string): Promise<any> => api.patch(`/mms/gate-passes/${id}/`, { status, guardName: guard }).then(r => r.data);
export const getMaintenanceOrders = (): Promise<any[]> => api.get('/mms/maintenance/').then(r => unwrapList(r.data));
export const addMaintenanceOrder = (w: any): Promise<any> => api.post('/mms/maintenance/', w).then(r => r.data);
export const updateMaintenanceOrderStatus = (id: string, s: string, n: string, c?: number): Promise<any> => api.patch(`/mms/maintenance/${id}/`, { status: s, technicianNotes: n, actualCostETB: c }).then(r => r.data);
export const getPhysicalAudits = (): Promise<any[]> => api.get('/mms/audits/').then(r => unwrapList(r.data));
export const updatePhysicalAuditEntry = (e: any): Promise<any> => api.patch(`/mms/audits/${e.itemId}/`, e).then(r => r.data);
export const getPurchaseOrders = (): Promise<any[]> => api.get('/mms/purchase-orders/').then(r => unwrapList(r.data));
export const addPurchaseOrder = (p: any): Promise<any> => api.post('/mms/purchase-orders/', p).then(r => r.data);
export const updatePurchaseOrderStatus = (id: string, s: string, b: string): Promise<any> => api.patch(`/mms/purchase-orders/${id}/`, { status: s, approvedBy: b }).then(r => r.data);
export const getVendors = (): Promise<any[]> => api.get('/mms/vendors/').then(r => unwrapList(r.data));
export const addVendor = (v: any): Promise<any> => api.post('/mms/vendors/', v).then(r => r.data);
export const getAssetDisposals = (): Promise<any[]> => api.get('/mms/disposals/').then(r => unwrapList(r.data));
export const addAssetDisposal = (d: any): Promise<any> => api.post('/mms/disposals/', d).then(r => r.data);
export const updateDisposalStatus = (id: string, s: string, data?: any): Promise<any> => api.patch(`/mms/disposals/${id}/`, { status: s, ...data }).then(r => r.data);
export const getHazardousMaterials = (): Promise<any[]> => api.get('/mms/hazardous-materials/').then(r => unwrapList(r.data));
export const addHazardousMaterial = (h: any): Promise<any> => api.post('/mms/hazardous-materials/', h).then(r => r.data);
export const getStockBinCards = (): Promise<any[]> => api.get('/mms/bin-cards/').then(r => unwrapList(r.data));
export const getDepartmentBudgets = (): Promise<any[]> => api.get('/mms/budgets/').then(r => unwrapList(r.data));
export const updateDepartmentBudget = (dept: string, b: number, y: string): Promise<any> => api.post('/mms/budgets/', { departmentName: dept, allocatedBudgetETB: b, fiscalYear: y }).then(r => r.data);
export const getDonationGrantAssets = (): Promise<any[]> => api.get('/mms/donations/').then(r => unwrapList(r.data));
export const addDonationGrantAsset = (a: any): Promise<any> => api.post('/mms/donations/', a).then(r => r.data);

// =====================================================================
// ✅ REAL API CALLS FOR HARDWARE & IOT
// =====================================================================
export const getCameraFeeds = (): Promise<any[]> => api.get('/iot/cameras/').then(r => unwrapList(r.data));
export const getIoTDevices = (): Promise<any[]> => api.get('/iot/devices/').then(r => unwrapList(r.data));
export const getBiometricEvents = (): Promise<any[]> => api.get('/iot/biometrics/').then(r => unwrapList(r.data));
export const getHardwareAlerts = (): Promise<any[]> => api.get('/iot/alerts/').then(r => unwrapList(r.data));
export const updateDeviceRelay = (id: string, state: string): Promise<any> => api.post(`/iot/devices/${id}/toggle_relay/`, { relayState: state }).then(r => r.data);
export const acknowledgeHardwareAlert = (id: string, name: string): Promise<any> => api.post(`/iot/alerts/${id}/acknowledge/`, { acknowledgedBy: name }).then(r => r.data);
export const addBiometricEvent = (ev: any): Promise<any> => api.post('/iot/biometrics/', ev).then(r => r.data);

// =====================================================================


// =====================================================================
// ✅ STUDENT CLINIC — localStorage-backed (swap to API later)  [ADDED]
// =====================================================================
const CLINIC_PROFILES_KEY = 'uscms_clinic_profiles';
const CLINIC_APPOINTMENTS_KEY = 'uscms_clinic_appointments';
const CLINIC_PRESCRIPTIONS_KEY = 'uscms_clinic_prescriptions';
const CLINIC_LAB_TESTS_KEY = 'uscms_clinic_lab_tests';
const CLINIC_SICK_LEAVES_KEY = 'uscms_clinic_sick_leaves';
const CLINIC_AMBULANCE_KEY = 'uscms_ambulance_calls';

const clinicRead = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const clinicWrite = <T>(key: string, value: T): void => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
};

const clinicEmit = (event: string) => {
  try { window.dispatchEvent(new CustomEvent(event)); } catch { /* SSR */ }
};

const clinicRandomSuffix = (len = 4) =>
  Math.floor(Math.random() * Math.pow(10, len)).toString().padStart(len, '0');

// ---- PROFILES ----
export const getClinicProfile = (studentId: string): StudentClinicProfile => {
  const all = clinicRead<StudentClinicProfile[]>(CLINIC_PROFILES_KEY, []);
  const found = all.find((p) => p.studentId === studentId);
  if (found) return found;

  const defaultProfile: StudentClinicProfile = {
    studentId,
    patientRecordNumber: 'MAU-MRN-2026-' + clinicRandomSuffix(4),
    bloodGroup: 'O+',
    rhFactor: 'Positive',
    allergies: ['Penicillin G (Mild rash)', 'Seasonal Grass Pollen'],
    chronicConditions: ['None reported'],
    emergencyContactName: 'Ato Mersha Tadesse',
    emergencyContactPhone: '+251 91 145 8920',
    emergencyContactRelation: 'Father / Legal Guardian',
    dormLocation: 'Block 06 (Tulu Awulia Main Campus), Room 304',
    heightCm: 176,
    weightKg: 69,
    bmi: 22.3,
    lastCheckupDate: '2026-09-12',
    covidVaccinated: true,
    hepatitisVaccinated: true,
    tetanusVaccinated: true,
  };
  clinicWrite(CLINIC_PROFILES_KEY, [...all, defaultProfile]);
  return defaultProfile;
};

export const saveClinicProfiles = (profiles: StudentClinicProfile[]): void => {
  clinicWrite(CLINIC_PROFILES_KEY, profiles);
  clinicEmit('uscms_clinic_profile_changed');
};

export const updateClinicProfile = (profile: StudentClinicProfile): StudentClinicProfile => {
  const all = clinicRead<StudentClinicProfile[]>(CLINIC_PROFILES_KEY, []);
  const idx = all.findIndex((p) => p.studentId === profile.studentId);
  if (idx >= 0) all[idx] = profile;
  else all.push(profile);
  saveClinicProfiles(all);
  return profile;
};

// ---- APPOINTMENTS ----
export const getClinicAppointments = (studentId?: string): ClinicAppointment[] => {
  const all = clinicRead<ClinicAppointment[]>(CLINIC_APPOINTMENTS_KEY, []);
  return studentId ? all.filter((a) => a.studentId === studentId) : all;
};

export const saveClinicAppointments = (appointments: ClinicAppointment[]): void => {
  clinicWrite(CLINIC_APPOINTMENTS_KEY, appointments);
  clinicEmit('uscms_clinic_appointments_changed');
};

export const bookClinicAppointment = (
  input: Omit<ClinicAppointment, 'id' | 'appointmentNumber' | 'createdAt' | 'status'>
): ClinicAppointment => {
  const all = clinicRead<ClinicAppointment[]>(CLINIC_APPOINTMENTS_KEY, []);
  const created: ClinicAppointment = {
    ...input,
    id: 'APT_' + Date.now(),
    appointmentNumber: 'APT-MAU-2026-' + clinicRandomSuffix(3),
    createdAt: new Date().toISOString(),
    status: 'SCHEDULED',
  };
  all.unshift(created);
  saveClinicAppointments(all);
  return created;
};

export const cancelClinicAppointment = (appointmentId: string): boolean => {
  const all = clinicRead<ClinicAppointment[]>(CLINIC_APPOINTMENTS_KEY, []);
  const target = all.find((a) => a.id === appointmentId);
  if (!target) return false;
  target.status = 'CANCELLED';
  saveClinicAppointments(all);
  return true;
};

// ---- PRESCRIPTIONS ----
export const getClinicPrescriptions = (studentId?: string): ClinicPrescription[] => {
  const all = clinicRead<ClinicPrescription[]>(CLINIC_PRESCRIPTIONS_KEY, []);
  return studentId ? all.filter((p) => p.studentId === studentId) : all;
};

export const saveClinicPrescriptions = (prescriptions: ClinicPrescription[]): void => {
  clinicWrite(CLINIC_PRESCRIPTIONS_KEY, prescriptions);
  clinicEmit('uscms_clinic_prescriptions_changed');
};

// ---- LAB TESTS ----
export const getClinicLabTests = (studentId?: string): ClinicLabTest[] => {
  const all = clinicRead<ClinicLabTest[]>(CLINIC_LAB_TESTS_KEY, []);
  return studentId ? all.filter((t) => t.studentId === studentId) : all;
};

export const saveClinicLabTests = (tests: ClinicLabTest[]): void => {
  clinicWrite(CLINIC_LAB_TESTS_KEY, tests);
  clinicEmit('uscms_clinic_lab_tests_changed');
};

// ---- SICK LEAVE CERTIFICATES ----
export const getSickLeaveCertificates = (studentId?: string): ClinicSickLeaveCertificate[] => {
  const all = clinicRead<ClinicSickLeaveCertificate[]>(CLINIC_SICK_LEAVES_KEY, []);
  return studentId ? all.filter((c) => c.studentId === studentId) : all;
};

export const saveSickLeaveCertificates = (certs: ClinicSickLeaveCertificate[]): void => {
  clinicWrite(CLINIC_SICK_LEAVES_KEY, certs);
  clinicEmit('uscms_clinic_sick_leaves_changed');
};

export const requestSickLeaveCertificate = (
  input: Omit<ClinicSickLeaveCertificate, 'id' | 'certificateNumber' | 'issuedDate' | 'sentToRegistrar' | 'status'>
): ClinicSickLeaveCertificate => {
  const all = clinicRead<ClinicSickLeaveCertificate[]>(CLINIC_SICK_LEAVES_KEY, []);
  const created: ClinicSickLeaveCertificate = {
    ...input,
    id: 'MED_CERT_' + Date.now(),
    certificateNumber: 'MAU-MED-CERT-2026-' + clinicRandomSuffix(3),
    issuedDate: new Date().toISOString().split('T')[0],
    sentToRegistrar: true,
    status: 'ISSUED_VALID',
  };
  all.unshift(created);
  saveSickLeaveCertificates(all);
  return created;
};

// ---- AMBULANCE ----
export const getAmbulanceCalls = (studentId?: string): AmbulanceEmergencyCall[] => {
  const all = clinicRead<AmbulanceEmergencyCall[]>(CLINIC_AMBULANCE_KEY, []);
  return studentId ? all.filter((c) => c.studentId === studentId) : all;
};

export const saveAmbulanceCalls = (calls: AmbulanceEmergencyCall[]): void => {
  clinicWrite(CLINIC_AMBULANCE_KEY, calls);
  clinicEmit('uscms_ambulance_calls_changed');
};

export const dispatchEmergencyAmbulance = (
  input: Omit<AmbulanceEmergencyCall, 'id' | 'callNumber' | 'timestamp' | 'assignedAmbulance' | 'paramedicTeam' | 'status'>
): AmbulanceEmergencyCall => {
  const all = clinicRead<AmbulanceEmergencyCall[]>(CLINIC_AMBULANCE_KEY, []);
  const created: AmbulanceEmergencyCall = {
    ...input,
    id: 'AMB_CALL_' + Date.now(),
    callNumber: 'EMERGENCY-MAU-' + clinicRandomSuffix(4),
    timestamp: new Date().toISOString(),
    assignedAmbulance: 'Ambulance MAU-AMB-01 (Toyota LandCruiser 4WD Mobile ICU)',
    paramedicTeam: 'Paramedic Yonas B. & Nurse Selamawit T.',
    status: 'DISPATCHED',
  };
  all.unshift(created);
  saveAmbulanceCalls(all);
  return created;
};

// =====================================================================


// ---------- EXPORT ----------
export const CampusDatabase = {
  // Users
  getUsers, saveUsers, updateUser, addUser, patchUser, deleteUser, login, logout, uploadAvatar, requestPasswordReset, confirmPasswordReset,

  // Courses
  getCourses, saveCourses, updateCourse, addCourse, deleteCourse,

  // Materials
  getMaterials, saveMaterials, addMaterial, updateMaterial, deleteMaterial,

  // Announcements
  getAnnouncements, createAnnouncement, updateAnnouncement, patchAnnouncement, deleteAnnouncement,

  // Assignments
  getAssignments, saveAssignments, addAssignment, updateAssignment, deleteAssignment,

  // Submissions
  getSubmissions, saveSubmissions, addSubmission, updateSubmission, deleteSubmission,

  // Exams
  getExams, addQuestion, createExam, updateExam, pushExam, deleteExam, saveExams,

  // Exam Attempts
  getExamAttempts, saveExamAttempts, createExamAttempt, updateExamAttempt, deleteExamAttempt,

  // Monitoring
  logMonitoringEvent, getMonitoringEvents,

  // Grades
  getGrades, saveGrades, addGrade, updateGrade, deleteGrade,

  // Transcripts
  getTranscripts, saveTranscripts, addTranscript, updateTranscript, deleteTranscript,

  // Attendance
  getAttendance, saveAttendance, addAttendance, updateAttendance, deleteAttendance,

  // Live Attendance Sessions
  getAttendanceSessions, getAttendanceSession, getActiveAttendanceSessions, openAttendanceSession, closeAttendanceSession, checkInAttendance,

  // Library Resources
  getLibraryResources, saveLibraryResources, addLibraryResource, updateLibraryResource, deleteLibraryResource,

  // Payments
  getPayments, savePayments, addPayment, updatePayment, deletePayment,

  // Scholarships
  getScholarships, saveScholarships, addScholarship, updateScholarship, deleteScholarship,

  // Course Outlines
  getCourseOutlines, saveCourseOutlines, addCourseOutline, updateCourseOutline, deleteCourseOutline,

  // Evaluations
  getEvaluations, saveEvaluations, addEvaluation, updateEvaluation, deleteEvaluation,

  // MoE Admissions
  getMoEAdmissions, saveMoEAdmissions, addMoEAdmission, updateMoEAdmission, deleteMoEAdmission,

  // Certificates
  getCertificates, saveCertificates, addCertificate, updateCertificate, deleteCertificate,

  // Audit Logs
  getAuditLogs, saveAuditLogs,

  // Settings
  getSettings, saveSettings, updateSettings,

  // AI
  predictStudentRisk, generateExamQuestions, getCourseAdvisor, sendChatMessage,

  // Audit helper
  addAuditLog,

  // Clearances
  getClearances, saveClearances, addClearance, updateClearance, deleteClearance, updateClearanceStage,

  // Facility Bookings
  getFacilityBookings, saveFacilityBookings, addFacilityBooking, updateFacilityBooking, deleteFacilityBooking, getFacilities, approveFacilityBooking, rejectFacilityBooking, cancelFacilityBooking,

  // Campus Alerts
  getCampusAlerts, saveCampusAlerts, addCampusAlert, updateCampusAlert, deleteCampusAlert,

  // Media Posts
  getMediaPosts, saveMediaPosts, addMediaPost, updateMediaPost, uploadMediaPost, deleteMediaPost, incrementMediaViews, toggleMediaLike,

  // Zoom
  getZoomSessions, addZoomSession, updateZoomSession, deleteZoomSession,

  // 👇 MMS (Now using real Django API) 👇
  getInventoryItems, addInventoryItem, adjustStock, getMaterialRequisitions, addMaterialRequisition, updateMaterialRequisitionStatus, getGoodsReceivingRecords, addGoodsReceivingRecord, getFixedAssets, addFixedAsset, getInterStoreTransfers, addInterStoreTransfer, updateInterStoreTransferStatus, getPropertyReturns, addPropertyReturn, getCampusGatePasses, addCampusGatePass, updateGatePassStatus, getMaintenanceOrders, addMaintenanceOrder, updateMaintenanceOrderStatus, getPhysicalAudits, updatePhysicalAuditEntry, getPurchaseOrders, addPurchaseOrder, updatePurchaseOrderStatus, getVendors, addVendor, getAssetDisposals, addAssetDisposal, updateDisposalStatus, getHazardousMaterials, addHazardousMaterial, getStockBinCards, getDepartmentBudgets, updateDepartmentBudget, getDonationGrantAssets, addDonationGrantAsset,

  // 👇 HARDWARE & IOT (Now using real Django API) 👇
  getCameraFeeds, getIoTDevices, getBiometricEvents, getHardwareAlerts, updateDeviceRelay, acknowledgeHardwareAlert, addBiometricEvent,

  // 👇 STUDENT CLINIC (localStorage-backed, swap to API later) 👇
  getClinicProfile, saveClinicProfiles, updateClinicProfile,
  getClinicAppointments, saveClinicAppointments, bookClinicAppointment, cancelClinicAppointment,
  getClinicPrescriptions, saveClinicPrescriptions,
  getClinicLabTests, saveClinicLabTests,
  getSickLeaveCertificates, saveSickLeaveCertificates, requestSickLeaveCertificate,
  getAmbulanceCalls, saveAmbulanceCalls, dispatchEmergencyAmbulance,
};

const UCS_API_KEY = "ucs_18840f9b7c82.rtGk8SzsghvmSkZFCbHmi0P8l7HU5dXcCPmPse6Kmk8";
const UCS_BASE_URL = "https://university-clearance-system-ikpx.onrender.com/api";

// Create a dedicated Axios instance for the Clearance System
export const ucsApi = axios.create({
  baseURL: UCS_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': UCS_API_KEY
  },
});

// Interceptor for UCS API
ucsApi.interceptors.request.use((config) => {
  console.log('[UCS API→]', config.method?.toUpperCase(), config.url);
  return config;
});

ucsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[UCS API Error]', error?.response?.status, error?.response?.data);
    return Promise.reject(error);
  }
);

// --- UCS Specific API Calls ---

export interface UCSForm {
  id: number;
  full_name: string;
  id_number: string;
  status: string;
  department_name: string;
  created_at: string;
}

// 1. Fetch student profile
export const getUCSUserProfile = async (): Promise<any> => {
  const { data } = await ucsApi.get('/me');
  return data;
};

// 2. Fetch student's clearance forms
export const getUCSStudentForms = async (): Promise<UCSForm[]> => {
  const { data } = await ucsApi.get('/student/forms');
  return data;
};

// 3. Submit a new clearance form
export const submitUCSForm = async (formData: any): Promise<any> => {
  const { data } = await ucsApi.post('/forms/submit', formData);
  return data;
};

// 4. Fetch payment methods
export const getUCSPaymentMethods = async (): Promise<any[]> => {
  const { data } = await ucsApi.get('/payment/methods');
  return data;
};
