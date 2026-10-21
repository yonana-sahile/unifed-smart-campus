// src/utils/notifications.ts
import type {
  User,
  Grade,
  Assignment,
  Exam,
  CourseMaterial,
  Announcement,
} from "../types";

export type NotificationType =
  | "grade"
  | "assignment"
  | "exam"
  | "material"
  | "announcement"
  | "fee";

export type NotificationTab =
  | "dashboard"
  | "grades"
  | "exams"
  | "materials"
  | "fees"
  | "dashboard";

export interface DerivedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetTab: NotificationTab;
  timestamp: string;
}

const STORAGE_KEY = "uscms_read_notifications_v1";

// ---------- READ STATE ----------
export const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const saveReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore quota / private mode
  }
};

export const markRead = (id: string): Set<string> => {
  const read = getReadIds();
  read.add(id);
  saveReadIds(read);
  return read;
};

export const markAllRead = (ids: string[]): Set<string> => {
  const read = getReadIds();
  ids.forEach((id) => read.add(id));
  saveReadIds(read);
  return read;
};

// ---------- DERIVATION ----------
interface DeriveParams {
  user: User;
  grades: Grade[];
  assignments: Assignment[];
  exams: Exam[];
  materials: CourseMaterial[];
  announcements: Announcement[];
  courses: { id: string; courseCode: string }[];
}

const stripPrefix = (v: any) => String(v ?? "").replace(/^U_/, "");

const sameId = (a: any, b: any) => stripPrefix(a) === stripPrefix(b);

const daysAgo = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = Math.max(0, now - d.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  } catch {
    return "";
  }
};

export function deriveNotifications({
  user,
  grades,
  assignments,
  exams,
  materials,
  announcements,
  courses,
}: DeriveParams): DerivedNotification[] {
  const result: DerivedNotification[] = [];
  const courseById = new Map(courses.map((c) => [String(c.id), c.courseCode]));

  // 1. Outstanding fees
  if ((user.outstandingFees ?? 0) > 0) {
    result.push({
      id: `fee-${user.id}`,
      type: "fee",
      title: "Outstanding Tuition Balance",
      message: `You have ${user.outstandingFees?.toLocaleString()} ETB unpaid. Transcript access is blocked until cleared.`,
      targetTab: "fees",
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Grades
  grades
    .filter((g) => sameId(g.studentId, user.id))
    .forEach((g) => {
      const code = g.courseCode || courseById.get(String(g.courseId)) || "Course";
      result.push({
        id: `grade-${g.id}`,
        type: "grade",
        title: `Grade posted — ${code}`,
        message: `${g.letterGrade || "—"} (${g.totalGrade ?? 0}%) • Status: ${g.status || "—"}`,
        targetTab: "grades",
        timestamp: new Date().toISOString(),
      });
    });

  // 3. Assignments (only ones due in the future OR recently past)
  assignments.forEach((a) => {
    const code = courseById.get(String(a.courseId)) || "";
    result.push({
      id: `assignment-${a.id}`,
      type: "assignment",
      title: `Assignment — ${a.title}`,
      message: `${code ? code + " • " : ""}Due ${new Date(a.dueDate).toLocaleDateString()}`,
      targetTab: "dashboard",
      timestamp: a.dueDate,
    });
  });

  // 4. Exams (only pushed / active ones)
  exams
    .filter((e) => e.isPushed || e.status === "ACTIVE")
    .forEach((e) => {
      result.push({
        id: `exam-${e.id}`,
        type: "exam",
        title: `Exam live — ${e.examTitle}`,
        message: `${e.courseTitle || courseById.get(String(e.courseId)) || ""} • ${e.durationMinutes} mins • ${e.totalMarks} marks`,
        targetTab: "exams",
        timestamp: e.pushedAt || new Date().toISOString(),
      });
    });

  // 5. Materials (newest 5 only to avoid flooding)
  materials
    .slice()
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    .slice(0, 5)
    .forEach((m) => {
      const code = courseById.get(String(m.courseId)) || "";
      result.push({
        id: `material-${m.id}`,
        type: "material",
        title: `New material — ${m.title}`,
        message: `${code ? code + " • " : ""}${m.fileType || "File"}`,
        targetTab: "materials",
        timestamp: m.uploadedAt,
      });
    });

  // 6. Announcements (newest 5 only)
  announcements
    .slice()
    .sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    )
    .slice(0, 5)
    .forEach((an) => {
      result.push({
        id: `announcement-${an.id}`,
        type: "announcement",
        title: `Bulletin — ${an.title}`,
        message: an.content?.slice(0, 100) || "",
        targetTab: "dashboard",
        timestamp: an.postedAt,
      });
    });

  // Sort by newest first
  result.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return result;
}

export { daysAgo };