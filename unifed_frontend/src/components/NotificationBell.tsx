import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Clock, FileText, Award, X } from "lucide-react";
import type { User, Assignment, Exam, Grade } from "../types";

interface NotificationBellProps {
  user: User;
  assignments: Assignment[];
  exams: Exam[];
  grades: Grade[];
  onNavigate: (tab: string) => void;
}

export function NotificationBell({ user, assignments, exams, grades, onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`notifications_${user.id}`);
    if (saved) {
      setReadIds(new Set(JSON.parse(saved)));
    }
  }, [user.id]);

  // Save read notifications when they change
  useEffect(() => {
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(Array.from(readIds)));
  }, [readIds, user.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build notifications from data
  const notifications: { id: string; title: string; message: string; type: string; targetTab: string; date: Date }[] = [];

  // 1. Assignments due in the next 7 days
  assignments.forEach((a) => {
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) {
      notifications.push({
        id: `assignment-${a.id}`,
        title: "Assignment Due Soon",
        message: `${a.title} is due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
        type: "assignment",
        targetTab: "dashboard",
        date: dueDate,
      });
    }
  });

  // 2. New grades posted
  grades
    .filter((g) => g.status === "SUBMITTED" || g.status === "APPROVED")
    .slice(0, 3)
    .forEach((g) => {
      notifications.push({
        id: `grade-${g.id}`,
        title: "Grade Posted",
        message: `${g.courseCode}: ${g.letterGrade} (${g.totalGrade}%)`,
        type: "grade",
        targetTab: "grades",
        date: new Date(),
      });
    });

  // 3. Upcoming exams in the next 14 days
  exams.forEach((e) => {
    const examDate = new Date(e.examDate);
    const now = new Date();
    const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 14) {
      notifications.push({
        id: `exam-${e.id}`,
        title: "Upcoming Exam",
        message: `${e.examTitle} in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
        type: "exam",
        targetTab: "exams",
        date: examDate,
      });
    }
  });

  // Sort by date (most recent first)
  notifications.sort((a, b) => a.date.getTime() - b.date.getTime());

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleNotificationClick = (n: typeof notifications[0]) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    onNavigate(n.targetTab);
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-800/50 transition"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.has(n.id);
                const Icon =
                  n.type === "assignment" ? FileText : n.type === "grade" ? Award : Clock;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      !isRead ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.type === "assignment"
                          ? "bg-blue-100 text-blue-600"
                          : n.type === "grade"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        {n.date.toLocaleDateString()}
                      </p>
                    </div>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}