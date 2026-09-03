import type { User } from "../types";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";

export function DeanDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dean_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="College Dean & Academic Senate Executive"
        portalSubtitle="College of Informatics & Mathematical Sciences • University Senate"
        badgeText="COLLEGE DEAN"
        badgeType="admin"
      />

      <main className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">College Academic Standing & Pass Thresholds</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Comprehensive college metrics, retention indices, and departmental accreditation logs.</p>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-primary-900 border border-blue-200">
            COLLEGE DEAN CONSOLE
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="font-serif font-bold text-slate-900 text-base">Departmental Progression & Student Pass Statistics</h3>
          <div className="space-y-5 text-xs sm:text-sm">
            {[
              { dept: "Department of Software Engineering", pass: 92, count: 180, color: "bg-primary" },
              { dept: "Department of Computer Science", pass: 88, count: 240, color: "bg-emerald-600" },
              { dept: "Department of Information Technology", pass: 85, count: 195, color: "bg-amber-600" }
            ].map((d, idx) => (
              <div key={idx} className="space-y-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200/50">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-900 font-semibold">{d.dept}</span>
                  <span className="text-slate-600 font-mono text-xs">{d.pass}% Pass Rate ({d.count} Enrolled)</span>
                </div>
                <div className="w-full bg-slate-200/70 h-3 rounded-full overflow-hidden">
                  <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${d.pass}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => alert("Simulating download of the Official College Annual Report (Signed PDF)...")}
            className="university-gradient hover:opacity-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md border border-amber-400/20 flex items-center space-x-2 transition"
          >
            <span>Download Official College Annual Report (PDF)</span>
          </button>
        </div>
      </main>

      <AcademicFooter />
    </div>
  );
}
