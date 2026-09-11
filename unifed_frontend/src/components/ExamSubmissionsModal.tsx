import React from "react";
import { Exam, ExamAttempt } from "../types";
import { X, Award, CheckCircle, Users, Clock, Check, Download } from "lucide-react";

interface ExamSubmissionsModalProps {
  exam: Exam | null;
  attempts: ExamAttempt[];
  onClose: () => void;
}

export const ExamSubmissionsModal: React.FC<ExamSubmissionsModalProps> = ({
  exam,
  attempts,
  onClose
}) => {
  if (!exam) return null;

  const examAttempts = attempts.filter((a) => a.examId === exam.id);
  const totalMarks = exam.totalMarks || 20;

  const averageScore =
    examAttempts.length > 0
      ? (examAttempts.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / examAttempts.length).toFixed(1)
      : "0.0";

  const highestScore =
    examAttempts.length > 0
      ? Math.max(...examAttempts.map((a) => a.score ?? 0))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                Student Examination Submissions Roster
              </span>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                {exam.examTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Submissions</span>
              <span className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">
                {examAttempts.length} Students
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Average Score</span>
              <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                {averageScore} <span className="text-xs text-slate-400 font-normal">/ {totalMarks}</span>
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Highest Score</span>
              <span className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400">
                {highestScore} <span className="text-xs text-slate-400 font-normal">/ {totalMarks}</span>
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Duration Limit</span>
              <span className="text-2xl font-display font-bold text-amber-500">
                {exam.durationMinutes} <span className="text-xs text-slate-400 font-normal">ደቂቃ</span>
              </span>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex justify-between items-center">
              <span>Submitted Attempts</span>
              <span className="text-slate-400 font-normal">{examAttempts.length} Records</span>
            </h4>

            {examAttempts.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Candidate ID</th>
                      <th className="p-3">Score & Accuracy</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Submitted Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {examAttempts.map((attempt) => {
                      const score = attempt.score ?? 0;
                      const percentage = Math.round((score / totalMarks) * 100);

                      return (
                        <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {attempt.studentName}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {attempt.studentId}
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {score} / {totalMarks}
                            </span>{" "}
                            <span className="text-slate-400 text-[11px]">({percentage}%)</span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                              <Check className="w-3 h-3" />
                              <span>Evaluated</span>
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Recent"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium text-xs">
                  No students have completed this exam yet. Once students take this exam in their portal, their scores will automatically appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mekdela Amba University • Department of Software Engineering
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
