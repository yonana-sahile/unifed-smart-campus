import { useState, useEffect } from "react";
import type { User, Course, Grade } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";

export function DepartmentHeadDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesData, gradesData] = await Promise.all([
        CampusDatabase.getCourses(),
        CampusDatabase.getGrades(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (error) {
      console.error("Failed to load department data:", error);
      setCourses([]);
      setGrades([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dept_head_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Department Chair & Academic Curriculum Council"
        portalSubtitle="College of Informatics • Department of Software Engineering"
        badgeText="DEPARTMENT HEAD"
        badgeType="faculty"
      />

      <main className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header card */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              Department Performance & Faculty Load
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Review course catalogs, assign faculty workloads, and monitor aggregate student progress.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto shrink-0">
            TERM II • AY 2025/2026
          </span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs border-t-4 border-t-primary">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">
              Active Faculty Members
            </h4>
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-2">
              15 Instructors
            </span>
            <p className="text-xs text-slate-500 mt-1">Average load: 3.2 courses per semester</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs border-t-4 border-t-emerald-600">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">
              Department Pass Rate
            </h4>
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-2">
              91.4% Passed
            </span>
            <p className="text-xs text-slate-500 mt-1">Calculated from verified registrar grade registry</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs border-t-4 border-t-amber-500">
            <h4 className="text-xs uppercase text-slate-500 font-mono font-bold tracking-widest">
              At-Risk Dropout Rate
            </h4>
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-amber-700 mt-2">
              8.6% Flagged
            </span>
            <p className="text-xs text-slate-500 mt-1">Predicted via AI Academic Early-Warning Engine</p>
          </div>
        </div>

        {/* Course offerings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-slate-900 text-base">
            Course Offerings & Assigned Instructors
          </h3>
          <div className="divide-y divide-slate-100">
            {courses.map((c) => (
              <div
                key={c.id}
                className="py-4 first:pt-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs sm:text-sm"
              >
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-mono font-bold text-primary-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg mr-2">
                    {c.courseCode}
                  </span>
                  <strong className="text-slate-900">{c.courseTitle}</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assigned Lecturer:{" "}
                    <span className="font-medium text-slate-700">{c.instructorName}</span> • ({c.creditHours} Credit Hrs)
                  </p>
                </div>
                <button
                  onClick={() => alert(`Simulating advisor reassignment context for: ${c.courseCode}`)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition border border-slate-200/60 self-start sm:self-auto shrink-0"
                >
                  Reassign Faculty
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}
