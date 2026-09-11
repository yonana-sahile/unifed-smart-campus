import React from "react";
import { CourseMaterial } from "../types";
import { X, Download, FileText, File, BookOpen, Calendar, User, CheckCircle2, Layers } from "lucide-react";
import { downloadCourseMaterial } from "../utils/fileDownloader";

interface CourseMaterialModalProps {
  material: CourseMaterial | null;
  onClose: () => void;
  courseCode?: string;
}

export const CourseMaterialModal: React.FC<CourseMaterialModalProps> = ({
  material,
  onClose,
  courseCode
}) => {
  if (!material) return null;

  const handleDownload = () => {
    downloadCourseMaterial(
      material.title,
      material.fileName,
      material.fileType,
      material.fileData,
      material.description
    );
  };

  const isPdf = material.fileType === "PDF" || material.fileName?.endsWith(".pdf");
  const isDocx = material.fileType === "Document" || material.fileName?.endsWith(".docx") || material.fileName?.endsWith(".doc");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/40">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md ${
                  isPdf
                    ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                    : isDocx
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                }`}
              >
                {isPdf ? "PDF Document" : isDocx ? "Microsoft Word (DOCX)" : material.fileType}
              </span>
              {material.chapterWeek && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                  {material.chapterWeek}
                </span>
              )}
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100 mt-1">
              {material.title}
            </h3>
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
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase">Course</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{courseCode || material.courseId}</span>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase">File Name</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                {material.fileName || "handout_document"}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase">File Size</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{material.fileSize || "1.8 MB"}</span>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase">Uploaded On</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {new Date(material.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Description & Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Handout Overview & Target Objectives
            </h4>
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed">
              {material.description}
            </div>
          </div>

          {/* Document Preview Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Document Reader Preview</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Syllabus Material</span>
              </span>
            </h4>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 font-mono text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center text-[11px] text-slate-400">
                <span>FORMAT: {material.fileType}</span>
                <span>MAU SMART E-LEARNING ARCHIVE</span>
              </div>
              <p>
                <strong>Title:</strong> {material.title}
              </p>
              <p>
                <strong>Instructor:</strong> {material.instructorName || "Department Faculty"}
              </p>
              <p className="text-slate-500 dark:text-slate-400 italic">
                {isPdf
                  ? "This PDF includes complete slide deck presentations, lecture charts, activity models, and laboratory references."
                  : isDocx
                  ? "This Word document contains the complete chapter study notes, assignment problem sets, and review questions."
                  : "Lecture handout and curriculum notes."}
              </p>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                <strong>Study Guideline:</strong> Review Sections 1.1 through 1.4 before attending the live practical session. You may download the complete file to your computer or mobile device for offline study.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Official Mekdela Amba University Course Resource
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {isPdf ? "PDF" : isDocx ? "DOCX" : "File"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
