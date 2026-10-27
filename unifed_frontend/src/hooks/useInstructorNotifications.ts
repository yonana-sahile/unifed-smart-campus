// src/hooks/useInstructorNotifications.ts
import { useState, useCallback, useEffect } from "react";
import type { Submission, Grade, Exam, ExamAttempt } from "../types";

export interface NotificationItem {
  id: string;
  type: "grade" | "assignment" | "exam" | "material" | "announcement" | "fee";
  title: string;
  message: string;
  targetTab: string;
  timestamp: string;
  read: boolean;
}

interface UseInstructorNotificationsParams {
  userId: string;
  submissions: Submission[];
  grades: Grade[];
  exams: Exam[];
  examAttempts: ExamAttempt[];
  attendanceRecords: any[];
}

export function useInstructorNotifications({
  userId,
  submissions,
  grades,
  exams,
  examAttempts,
  attendanceRecords,
}: UseInstructorNotificationsParams) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`notifications_read_${userId}`);
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, [userId]);

  // Persist read state
  const persistReadIds = useCallback((newSet: Set<string>) => {
    try {
      localStorage.setItem(
        `notifications_read_${userId}`,
        JSON.stringify(Array.from(newSet))
      );
    } catch { /* ignore */ }
  }, [userId]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev).add(id);
      persistReadIds(next);
      return next;
    });
  }, [persistReadIds]);

  const markAllAsRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set([...Array.from(prev), ...ids]);
      persistReadIds(next);
      return next;
    });
  }, [persistReadIds]);

  // Build notification list from real data
  const notifications: NotificationItem[] = [];

  // 1. Submissions awaiting grading
  const ungraded = submissions.filter((s) => s.status !== "GRADED");
  if (ungraded.length > 0) {
    notifications.push({
      id: "notif_ungraded_submissions",
      type: "assignment",
      title: `${ungraded.length} submission${ungraded.length > 1 ? "s" : ""} to grade`,
      message: ungraded
        .slice(0, 3)
        .map((s) => `${s.studentName}: ${s.assignmentTitle}`)
        .join(" · "),
      targetTab: "assignments",
      timestamp: ungraded[0].submittedAt || new Date().toISOString(),
      read: readIds.has("notif_ungraded_submissions"),
    });
  }

  // 2. Grades ready to submit
  const pendingGrades = grades.filter((g) => g.status === "CALCULATED");
  if (pendingGrades.length > 0) {
    notifications.push({
      id: "notif_pending_grades",
      type: "grade",
      title: `${pendingGrades.length} grade${pendingGrades.length > 1 ? "s" : ""} to submit`,
      message: "Ready to send to the Registrar",
      targetTab: "grades",
      timestamp: new Date().toISOString(),
      read: readIds.has("notif_pending_grades"),
    });
  }

  // 3. Grades returned for correction
  const returnedGrades = grades.filter((g) => g.status === "RETURNED");
  if (returnedGrades.length > 0) {
    notifications.push({
      id: "notif_returned_grades",
      type: "grade",
      title: `${returnedGrades.length} grade${returnedGrades.length > 1 ? "s" : ""} returned`,
      message: "Registrar requested correction",
      targetTab: "grades",
      timestamp: new Date().toISOString(),
      read: readIds.has("notif_returned_grades"),
    });
  }

  // 4. Live exams
  const liveExams = exams.filter((e) => e.isPushed || e.status === "ACTIVE");
  if (liveExams.length > 0) {
    notifications.push({
      id: "notif_live_exams",
      type: "exam",
      title: `${liveExams.length} live exam${liveExams.length > 1 ? "s" : ""}`,
      message: liveExams.slice(0, 2).map((e) => e.examTitle).join(" · "),
      targetTab: "exams",
      timestamp: liveExams[0].pushedAt || new Date().toISOString(),
      read: readIds.has("notif_live_exams"),
    });
  }

  // 5. Students taking exams now
  const activeAttempts = examAttempts.filter((a) => a.status === "IN_PROGRESS");
  if (activeAttempts.length > 0) {
    notifications.push({
      id: "notif_active_attempts",
      type: "exam",
      title: `${activeAttempts.length} student${activeAttempts.length > 1 ? "s" : ""} in exam`,
      message: "Attempts are in progress",
      targetTab: "exams",
      timestamp: new Date().toISOString(),
      read: readIds.has("notif_active_attempts"),
    });
  }

  // 6. Low attendance
  const belowMin = attendanceRecords.filter((a) => a.attendancePercentage < 80);
  if (belowMin.length > 0) {
    notifications.push({
      id: "notif_low_attendance",
      type: "grade",
      title: `${belowMin.length} student${belowMin.length > 1 ? "s" : ""} below 80%`,
      message: belowMin.slice(0, 2).map((a) => a.studentName).join(" · "),
      targetTab: "attendance",
      timestamp: new Date().toISOString(),
      read: readIds.has("notif_low_attendance"),
    });
  }

  return {
    notifications,
    markAsRead,
    markAllAsRead,
  };
}