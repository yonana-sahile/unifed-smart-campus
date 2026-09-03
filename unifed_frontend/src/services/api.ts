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

// ✅ SET THIS TO true TO USE MOCK DATA (no backend needed)
const USE_MOCK = true;

// ---------- INLINE MOCK DATA ----------
const mockUsers: User[] = [
  {
    id: 'U_ST01',
    username: 'tadesse',
    fullName: 'Tadesse G.',
    email: 'tadesse@mau.edu.et',
    role: 'STUDENT',
    isActive: true,
    studentId: 'MAU1402271',
    academicYear: 4,
    semester: 2,
    program: 'Software Engineering',
    cgpa: 3.67,
    outstandingFees: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
  {
    id: 'U_ST02',
    username: 'yonas',
    fullName: 'Yonas Sahile',
    email: 'yonas@mau.edu.et',
    role: 'STUDENT',
    isActive: true,
    studentId: 'MAU1402530',
    academicYear: 4,
    semester: 2,
    program: 'Software Engineering',
    cgpa: 3.85,
    outstandingFees: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 'U_ST03',
    username: 'tarekegn',
    fullName: 'Tarekegn Abebe',
    email: 'tarekegn@mau.edu.et',
    role: 'STUDENT',
    isActive: true,
    studentId: 'MAU1402284',
    academicYear: 4,
    semester: 2,
    program: 'Software Engineering',
    cgpa: 2.45,
    outstandingFees: 3500,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  },
  {
    id: 'U_IN01',
    username: 'chalachew',
    fullName: 'Dr. Chalachew',
    email: 'chalachew@mau.edu.et',
    role: 'INSTRUCTOR',
    isActive: true,
    instructorId: 'INST101',
    department: 'Software Engineering',
    specialization: 'AI & ML',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 'U_REG01',
    username: 'almaz',
    fullName: 'Almaz Kebede',
    email: 'registrar@mau.edu.et',
    role: 'REGISTRAR',
    isActive: true,
    staffId: 'REG001',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  },
  {
    id: 'U_DEPT01',
    username: 'befekadu',
    fullName: 'Dr. Befekadu',
    email: 'dephead@mau.edu.et',
    role: 'DEPARTMENT_HEAD',
    isActive: true,
    staffId: 'DH101',
    department: 'Software Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  },
  {
    id: 'U_DEAN01',
    username: 'getachew',
    fullName: 'Prof. Getachew',
    email: 'dean@mau.edu.et',
    role: 'DEAN',
    isActive: true,
    staffId: 'DEAN001',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  {
    id: 'U_ADMIN01',
    username: 'selamawit',
    fullName: 'Selamawit T.',
    email: 'admin@mau.edu.et',
    role: 'ADMIN',
    isActive: true,
    staffId: 'ADMIN001',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'U_LIB01',
    username: 'alemayehu',
    fullName: 'Alemayehu B.',
    email: 'library@mau.edu.et',
    role: 'LIBRARY_STAFF',
    isActive: true,
    staffId: 'LIB001',
    librarySection: 'Digital Resources',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    id: 'U_FIN01',
    username: 'meron',
    fullName: 'Meron Desta',
    email: 'finance@mau.edu.et',
    role: 'FINANCE_OFFICER',
    isActive: true,
    officerId: 'FIN001',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
  },
  {
    id: 'U_AUD01',
    username: 'tolossa',
    fullName: 'Dr. Tolossa Seme',
    email: 'tolossa.seme@moe.gov.et',
    role: 'AUDITOR',
    isActive: true,
    staffId: 'MOE001',
    department: 'Ministry of Education',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150',
  },
];

const mockCourses: Course[] = [
  {
    id: 'C_SOFT401',
    courseCode: 'SOFT401',
    courseTitle: 'Advanced Software Engineering',
    creditHours: 3,
    description: 'Advanced principles of software engineering, including agile methodologies, system architecture, and quality assurance.',
    department: 'Software Engineering',
    instructorId: 'U_IN01',
    instructorName: 'Dr. Chalachew',
    semester: 'II',
    academicYear: 2026,
    capacity: 40,
    enrolledStudentsCount: 35,
    prerequisites: ['SOFT301'],
  },
  {
    id: 'C_CSCI402',
    courseCode: 'CSCI402',
    courseTitle: 'Distributed Database Systems',
    creditHours: 3,
    description: 'Design and implementation of distributed databases, data replication, and consistency models.',
    department: 'Computer Science',
    instructorId: 'U_IN01',
    instructorName: 'Dr. Chalachew',
    semester: 'II',
    academicYear: 2026,
    capacity: 45,
    enrolledStudentsCount: 30,
    prerequisites: ['CSCI302'],
  },
  {
    id: 'C_MATH301',
    courseCode: 'MATH301',
    courseTitle: 'Discrete Mathematics & Graph Theory',
    creditHours: 3,
    description: 'Mathematical foundations for computing, including logic, sets, combinatorics, and graph algorithms.',
    department: 'Mathematics',
    instructorId: 'U_IN01',
    instructorName: 'Dr. Chalachew',
    semester: 'II',
    academicYear: 2026,
    capacity: 50,
    enrolledStudentsCount: 42,
    prerequisites: ['MATH201'],
  },
];

const mockAnnouncements: Announcement[] = [
  {
    id: 'AN_1',
    courseId: 'C_SOFT401',
    courseTitle: 'Advanced Software Engineering',
    title: 'Midterm Exam Schedule Announced',
    content: 'The midterm exam for SOFT401 will be held on March 15, 2026, from 2:00 PM to 5:00 PM in Room 301. Please review chapters 5-9.',
    postedBy: 'Dr. Chalachew',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'AN_2',
    courseId: 'C_SOFT401',
    courseTitle: 'Advanced Software Engineering',
    title: 'Guest Lecture: Industry Best Practices',
    content: 'We will have a guest lecture from a senior software architect at Google on April 5, 2026. Attendance is mandatory.',
    postedBy: 'Dr. Chalachew',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockGrades: Grade[] = [
  {
    id: 'GR_1',
    studentId: 'U_ST01',
    studentName: 'Tadesse G.',
    courseId: 'C_SOFT401',
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'SOFT401',
    creditHours: 3,
    continuousAssessmentScore: 42,
    midExamScore: 16,
    finalExamScore: 25,
    totalGrade: 83,
    letterGrade: 'B',
    gradePoint: 3.0,
    semester: 'II',
    status: 'APPROVED',
  },
  {
    id: 'GR_2',
    studentId: 'U_ST02',
    studentName: 'Yonas Sahile',
    courseId: 'C_SOFT401',
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'SOFT401',
    creditHours: 3,
    continuousAssessmentScore: 48,
    midExamScore: 18,
    finalExamScore: 28,
    totalGrade: 94,
    letterGrade: 'A',
    gradePoint: 4.0,
    semester: 'II',
    status: 'APPROVED',
  },
  {
    id: 'GR_3',
    studentId: 'U_ST03',
    studentName: 'Tarekegn Abebe',
    courseId: 'C_SOFT401',
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'SOFT401',
    creditHours: 3,
    continuousAssessmentScore: 30,
    midExamScore: 10,
    finalExamScore: 15,
    totalGrade: 55,
    letterGrade: 'D',
    gradePoint: 1.0,
    semester: 'II',
    status: 'CALCULATED',
  },
];

const mockSettings: SystemSettings = {
  semesterDates: {
    start: '2026-02-10',
    end: '2026-06-25',
  },
  registrationDeadline: '2026-02-28',
  examPeriod: {
    start: '2026-06-01',
    end: '2026-06-20',
  },
  gradingScale: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
  },
  academicYearFrozen: false,
};

const mockMediaPosts: CampusMediaPost[] = [
  {
    id: 'media_1',
    title: 'Welcome to Mekdela Amba University – Smart Campus Tour',
    description: 'Take a virtual tour of the Tulu Awlia main campus, featuring state‑of‑the‑art laboratories, libraries, and student hubs.',
    category: 'CAMPUS_NEWS',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
    postedBy: 'MAU ICT Directorate',
    authorRole: 'ADMIN',
    postedAt: new Date().toISOString(),
    duration: '04:20',
    viewsCount: 1200,
    likesCount: 85,
    featured: true,
    tags: ['CampusTour', 'MAU', 'SmartCampus'],
  },
  {
    id: 'media_2',
    title: '2026 Graduation Ceremony – Highlights',
    description: 'A recap of the 25th commencement ceremony, with speeches from the university president and distinguished guests.',
    category: 'GRADUATION_CEREMONY',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80',
    postedBy: 'University Media Directorate',
    authorRole: 'ADMIN',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '12:30',
    viewsCount: 3400,
    likesCount: 210,
    featured: false,
    tags: ['Graduation2026', 'MAU', 'Ceremony'],
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    userId: 'U_ADMIN01',
    userName: 'Selamawit T.',
    userRole: 'ADMIN',
    action: 'Institutional Login',
    entityType: 'User',
    entityId: 'U_ADMIN01',
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    description: 'User logged in successfully through the University Credentials Gateway.',
  },
  {
    id: 'log_2',
    userId: 'U_ST01',
    userName: 'Tadesse G.',
    userRole: 'STUDENT',
    action: 'Enroll Course',
    entityType: 'Course',
    entityId: 'C_SOFT401',
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    description: 'Student registered for course: SOFT401 - Advanced Software Engineering',
  },
];

// ... other empty mock arrays
const mockMaterials: CourseMaterial[] = [];
const mockAssignments: Assignment[] = [];
const mockSubmissions: Submission[] = [];
const mockExams: Exam[] = [];
const mockExamAttempts: ExamAttempt[] = [];
const mockTranscripts: Transcript[] = [];
const mockAttendance: AttendanceRecord[] = [];
const mockLibraryResources: LibraryResource[] = [];
const mockPayments: PaymentTransaction[] = [];
const mockScholarships: Scholarship[] = [];
const mockCourseOutlines: CourseOutlineForm[] = [];
const mockEvaluations: InstructorEvaluation[] = [];
const mockMoEAdmissions: MoEAdmissionRecord[] = [];
const mockCertificates: CertificateRecord[] = [];
const mockClearances: StudentClearance[] = [];
const mockFacilityBookings: FacilityBooking[] = [];
const mockCampusAlerts: CampusAlert[] = [];

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
  return config;
});

// ---------- Helper to wrap API calls with mock fallback ----------
const withMock = <T,>(mockData: T, apiCall: () => Promise<T>): Promise<T> => {
  if (USE_MOCK) {
    return Promise.resolve(mockData);
  }
  return apiCall().catch((error) => {
    console.warn('API call failed, using mock data:', error);
    return mockData;
  });
};

// ---------- USERS ----------
export const getUsers = (): Promise<User[]> =>
  withMock(mockUsers, () => api.get('/users/').then(r => r.data));
export const saveUsers = (users: User[]): Promise<User[]> =>
  withMock(users, () => api.put('/users/', users).then(r => r.data));

// ✅ NEW: Update a single user
export const updateUser = (user: User): Promise<User> =>
  withMock(user, () => api.put(`/users/${user.id}/`, user).then(r => r.data));

// ---------- COURSES ----------
export const getCourses = (): Promise<Course[]> =>
  withMock(mockCourses, () => api.get('/courses/').then(r => r.data));
export const saveCourses = (courses: Course[]): Promise<Course[]> =>
  withMock(courses, () => api.put('/courses/', courses).then(r => r.data));

// ---------- MATERIALS ----------
export const getMaterials = (): Promise<CourseMaterial[]> =>
  withMock(mockMaterials, () => api.get('/materials/').then(r => r.data));
export const saveMaterials = (materials: CourseMaterial[]): Promise<CourseMaterial[]> =>
  withMock(materials, () => api.put('/materials/', materials).then(r => r.data));

// ---------- ANNOUNCEMENTS ----------
export const getAnnouncements = (): Promise<Announcement[]> =>
  withMock(mockAnnouncements, () => api.get('/announcements/').then(r => r.data));
export const saveAnnouncements = (announcements: Announcement[]): Promise<Announcement[]> =>
  withMock(announcements, () => api.put('/announcements/', announcements).then(r => r.data));

// ---------- ASSIGNMENTS ----------
export const getAssignments = (): Promise<Assignment[]> =>
  withMock(mockAssignments, () => api.get('/assignments/').then(r => r.data));
export const saveAssignments = (assignments: Assignment[]): Promise<Assignment[]> =>
  withMock(assignments, () => api.put('/assignments/', assignments).then(r => r.data));

// ---------- SUBMISSIONS ----------
export const getSubmissions = (): Promise<Submission[]> =>
  withMock(mockSubmissions, () => api.get('/submissions/').then(r => r.data));
export const saveSubmissions = (submissions: Submission[]): Promise<Submission[]> =>
  withMock(submissions, () => api.put('/submissions/', submissions).then(r => r.data));

// ---------- EXAMS ----------
export const getExams = (): Promise<Exam[]> =>
  withMock(mockExams, () => api.get('/exams/').then(r => r.data));
export const saveExams = (exams: Exam[]): Promise<Exam[]> =>
  withMock(exams, () => api.put('/exams/', exams).then(r => r.data));

// ---------- EXAM ATTEMPTS ----------
export const getExamAttempts = (): Promise<ExamAttempt[]> =>
  withMock(mockExamAttempts, () => api.get('/exam-attempts/').then(r => r.data));
export const saveExamAttempts = (attempts: ExamAttempt[]): Promise<ExamAttempt[]> =>
  withMock(attempts, () => api.put('/exam-attempts/', attempts).then(r => r.data));

// ---------- GRADES ----------
export const getGrades = (): Promise<Grade[]> =>
  withMock(mockGrades, () => api.get('/grades/').then(r => r.data));
export const saveGrades = (grades: Grade[]): Promise<Grade[]> =>
  withMock(grades, () => api.put('/grades/', grades).then(r => r.data));

// ---------- TRANSCRIPTS ----------
export const getTranscripts = (): Promise<Transcript[]> =>
  withMock(mockTranscripts, () => api.get('/transcripts/').then(r => r.data));
export const saveTranscripts = (transcripts: Transcript[]): Promise<Transcript[]> =>
  withMock(transcripts, () => api.put('/transcripts/', transcripts).then(r => r.data));

// ---------- ATTENDANCE ----------
export const getAttendance = (): Promise<AttendanceRecord[]> =>
  withMock(mockAttendance, () => api.get('/attendance/').then(r => r.data));
export const saveAttendance = (records: AttendanceRecord[]): Promise<AttendanceRecord[]> =>
  withMock(records, () => api.put('/attendance/', records).then(r => r.data));

// ---------- LIBRARY RESOURCES ----------
export const getLibraryResources = (): Promise<LibraryResource[]> =>
  withMock(mockLibraryResources, () => api.get('/library-resources/').then(r => r.data));
export const saveLibraryResources = (resources: LibraryResource[]): Promise<LibraryResource[]> =>
  withMock(resources, () => api.put('/library-resources/', resources).then(r => r.data));

// ---------- PAYMENTS ----------
export const getPayments = (): Promise<PaymentTransaction[]> =>
  withMock(mockPayments, () => api.get('/payments/').then(r => r.data));
export const savePayments = (payments: PaymentTransaction[]): Promise<PaymentTransaction[]> =>
  withMock(payments, () => api.put('/payments/', payments).then(r => r.data));

// ---------- SCHOLARSHIPS ----------
export const getScholarships = (): Promise<Scholarship[]> =>
  withMock(mockScholarships, () => api.get('/scholarships/').then(r => r.data));
export const saveScholarships = (scholarships: Scholarship[]): Promise<Scholarship[]> =>
  withMock(scholarships, () => api.put('/scholarships/', scholarships).then(r => r.data));

// ---------- COURSE OUTLINES ----------
export const getCourseOutlines = (): Promise<CourseOutlineForm[]> =>
  withMock(mockCourseOutlines, () => api.get('/course-outlines/').then(r => r.data));
export const saveCourseOutlines = (outlines: CourseOutlineForm[]): Promise<CourseOutlineForm[]> =>
  withMock(outlines, () => api.put('/course-outlines/', outlines).then(r => r.data));

// ---------- EVALUATIONS ----------
export const getEvaluations = (): Promise<InstructorEvaluation[]> =>
  withMock(mockEvaluations, () => api.get('/evaluations/').then(r => r.data));
export const saveEvaluations = (evaluations: InstructorEvaluation[]): Promise<InstructorEvaluation[]> =>
  withMock(evaluations, () => api.put('/evaluations/', evaluations).then(r => r.data));

// ---------- MOE ADMISSIONS ----------
export const getMoEAdmissions = (): Promise<MoEAdmissionRecord[]> =>
  withMock(mockMoEAdmissions, () => api.get('/moe-admissions/').then(r => r.data));
export const saveMoEAdmissions = (admissions: MoEAdmissionRecord[]): Promise<MoEAdmissionRecord[]> =>
  withMock(admissions, () => api.put('/moe-admissions/', admissions).then(r => r.data));

// ---------- CERTIFICATES ----------
export const getCertificates = (): Promise<CertificateRecord[]> =>
  withMock(mockCertificates, () => api.get('/certificates/').then(r => r.data));
export const saveCertificates = (certificates: CertificateRecord[]): Promise<CertificateRecord[]> =>
  withMock(certificates, () => api.put('/certificates/', certificates).then(r => r.data));

// ---------- AUDIT LOGS ----------
export const getAuditLogs = (): Promise<AuditLog[]> =>
  withMock(mockAuditLogs, () => api.get('/audit-logs/').then(r => r.data));
export const saveAuditLogs = (logs: AuditLog[]): Promise<AuditLog[]> =>
  withMock(logs, () => api.put('/audit-logs/', logs).then(r => r.data));

// ---------- SETTINGS ----------
export const getSettings = (): Promise<SystemSettings> =>
  withMock(mockSettings, () => api.get('/settings/').then(r => r.data));
export const saveSettings = (settings: SystemSettings): Promise<SystemSettings> =>
  withMock(settings, () => api.put('/settings/', settings).then(r => r.data));

// ---------- AI: RISK PREDICTION ----------
export const predictStudentRisk = (studentId: string): Promise<AIRiskPrediction> =>
  withMock(
    { studentId, classification: 'NOT_AT_RISK', dropoutProbability: 0.05 } as any,
    () => api.post('/ai/predict-risk/', { studentId }).then(r => r.data)
  );

// ---------- AI: EXAM GENERATION ----------
export const generateExamQuestions = (params: {
  courseId: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: string;
}): Promise<{ success: boolean; questions: any[]; error?: string }> =>
  withMock(
    { success: true, questions: [{ questionText: 'Sample Q', options: ['A','B'], correctAnswer: 'A', marks: 5 }] },
    () => api.post('/ai/generate-exam/', params).then(r => r.data)
  );

// ---------- AI: COURSE ADVISOR ----------
export const getCourseAdvisor = (data: {
  studentId?: string;
  interests: string;
  program: string;
  currentSemester?: string;
  completedCourses?: string[];
}): Promise<{ summary: string; recommendations: any[] }> =>
  withMock(
    { summary: 'Mock recommendation', recommendations: [{ courseId: 'C123', reason: 'Fits your interests' }] },
    () => api.post('/ai/course-advisor/', data).then(r => r.data)
  );

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
  withMock(
    { id: 'log_' + Date.now(), userId, userName, userRole, action, entityType, entityId, timestamp: new Date().toISOString(), ipAddress: '127.0.0.1', description } as any,
    () =>
      api.post('/audit-logs/', {
        userId,
        userName,
        userRole,
        action,
        entityType,
        entityId,
        description,
        ipAddress: 'unknown',
      }).then(r => r.data)
  );

// ---------- CLEARANCES ----------
export const getClearances = (): Promise<StudentClearance[]> =>
  withMock(mockClearances, () => api.get('/clearances/').then(r => r.data));
export const saveClearances = (clearances: StudentClearance[]): Promise<StudentClearance[]> =>
  withMock(clearances, () => api.put('/clearances/', clearances).then(r => r.data));

export const updateClearanceStage = (
  clearanceId: string,
  dept: "LIBRARY" | "FINANCE" | "DORMITORY" | "DEPARTMENT_LAB" | "REGISTRAR",
  status: "CLEARED" | "REJECTED" | "PENDING",
  officerName: string,
  remarks?: string
): Promise<StudentClearance> =>
  withMock(
    { id: clearanceId, overallStatus: 'APPROVED' } as any,
    () =>
      api.patch(`/clearances/${clearanceId}/stage/`, {
        department: dept,
        status,
        officerName,
        remarks,
      }).then(r => r.data)
  );

// ---------- FACILITY BOOKINGS ----------
export const getFacilityBookings = (): Promise<FacilityBooking[]> =>
  withMock(mockFacilityBookings, () => api.get('/facility-bookings/').then(r => r.data));
export const saveFacilityBookings = (bookings: FacilityBooking[]): Promise<FacilityBooking[]> =>
  withMock(bookings, () => api.put('/facility-bookings/', bookings).then(r => r.data));

export const addFacilityBooking = (booking: Omit<FacilityBooking, 'id'>): Promise<FacilityBooking> =>
  withMock(
    { ...booking, id: 'fb_' + Date.now() } as any,
    () => api.post('/facility-bookings/', booking).then(r => r.data)
  );

// ---------- CAMPUS ALERTS ----------
export const getCampusAlerts = (): Promise<CampusAlert[]> =>
  withMock(mockCampusAlerts, () => api.get('/campus-alerts/').then(r => r.data));
export const saveCampusAlerts = (alerts: CampusAlert[]): Promise<CampusAlert[]> =>
  withMock(alerts, () => api.put('/campus-alerts/', alerts).then(r => r.data));

export const addCampusAlert = (alert: Omit<CampusAlert, 'id' | 'timestamp'>): Promise<CampusAlert> =>
  withMock(
    { ...alert, id: 'alert_' + Date.now(), timestamp: new Date().toISOString() } as any,
    () => api.post('/campus-alerts/', alert).then(r => r.data)
  );

// ---------- CAMPUS MEDIA POSTS ----------
export const getMediaPosts = (): Promise<CampusMediaPost[]> =>
  withMock(mockMediaPosts, () => api.get('/media-posts/').then(r => r.data));
export const saveMediaPosts = (posts: CampusMediaPost[]): Promise<CampusMediaPost[]> =>
  withMock(posts, () => api.put('/media-posts/', posts).then(r => r.data));

export const addMediaPost = (post: Omit<CampusMediaPost, 'id' | 'postedAt' | 'viewsCount' | 'likesCount'>): Promise<CampusMediaPost> =>
  withMock(
    {
      ...post,
      id: 'media_' + Date.now(),
      postedAt: new Date().toISOString(),
      viewsCount: 0,
      likesCount: 0,
    } as any,
    () => api.post('/media-posts/', post).then(r => r.data)
  );

export const deleteMediaPost = (id: string): Promise<{ success: boolean }> =>
  withMock(
    { success: true },
    () => api.delete(`/media-posts/${id}/`).then(r => r.data)
  );

export const incrementMediaViews = (id: string): Promise<void> =>
  withMock(
    undefined,
    () => api.post(`/media-posts/${id}/view/`).then(r => r.data)
  );

export const toggleMediaLike = (id: string): Promise<{ likesCount: number }> =>
  withMock(
    { likesCount: 0 },
    () => api.post(`/media-posts/${id}/like/`).then(r => r.data)
  );

// ---------- EXPORT ----------
export const CampusDatabase = {
  getUsers,
  saveUsers,
  updateUser, // ✅ NEW
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
  deleteMediaPost,
  incrementMediaViews,
  toggleMediaLike,
};
