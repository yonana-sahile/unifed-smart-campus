import React from "react";
import { Exam, ExamAttempt } from "../types";
import { X, CheckCircle, XCircle, Award, Clock, FileCheck, Printer, Check } from "lucide-react";

interface ExamResultsModalProps {
  exam: Exam | null;
  attempt: ExamAttempt | null;
  onClose: () => void;
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({
  exam,
  attempt,
  onClose
}) => {
  if (!exam || !attempt) return null;

  const totalMarks = exam.totalMarks || 20;
  const score = attempt.score ?? 0;
  const percentage = Math.round((score / totalMarks) * 100);

  let letterGrade = "F";
  let gradeColor = "text-red-500 bg-red-500/10 border-red-500/30";
  if (percentage >= 90) {
    letterGrade = "A";
    gradeColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  } else if (percentage >= 80) {
    letterGrade = "B+";
    gradeColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  } else if (percentage >= 70) {
    letterGrade = "B";
    gradeColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
  } else if (percentage >= 60) {
    letterGrade = "C";
    gradeColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Official Examination Score Report
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
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="sm:col-span-2 flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center ${gradeColor}`}>
                <span className="text-2xl font-display font-extrabold">{letterGrade}</span>
                <span className="text-[10px] font-mono uppercase font-bold">Grade</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono">Exam Score Result</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                    {score}
                  </span>
                  <span className="text-slate-400 font-medium">/ {totalMarks} Marks</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {percentage}% Accuracy • {percentage >= 60 ? "Exam Passed (ማለፊያ ተገኝቷል)" : "Academic Retake Suggested"}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4 pt-3 sm:pt-0">
              <div>
                <span className="block text-slate-400 font-mono text-[10px] uppercase">Candidate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {attempt.studentName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{attempt.studentId}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-mono text-[10px] uppercase">Duration & Timer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {exam.durationMinutes} ደቂቃ (Mins)
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-mono text-[10px] uppercase">Submitted At</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-mono text-[10px] uppercase">Grade Book Sync</span>
                <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Synced</span>
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Question-by-Question Diagnostic Review</span>
              <span className="text-slate-400 font-normal">
                {exam.questions.length} Questions Evaluated
              </span>
            </h4>

            <div className="space-y-3">
              {exam.questions.map((q, idx) => {
                const studentAns = attempt.answers[idx];
                const isCorrect = studentAns === q.correctAnswer;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition ${
                      isCorrect
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                        : "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                            Question #{idx + 1}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({q.marks} Marks)
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              isCorrect
                                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {isCorrect ? "Correct (+5)" : "Incorrect (0)"}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                          {q.questionText}
                        </p>
                      </div>

                      <div className="shrink-0 mt-1">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                        <span className="block text-[10px] font-mono text-slate-400 uppercase">Your Answer:</span>
                        <span className={`font-semibold ${isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          {studentAns || "No answer submitted"}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                            Correct Answer:
                          </span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {q.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Recorded in MAU Automated Assessment Ledger
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
