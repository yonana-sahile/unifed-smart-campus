import { UniversitySeal } from "./UniversityHeader";
import {
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  Lock,
  Globe,
  Award,
  HelpCircle,
  Server,
  Radio,
  ChevronRight
} from "lucide-react";

export function UniversityLandingFooter({
  onOpenSecurityModal,
  onOpenHelpModal
}: {
  onOpenSecurityModal?: () => void;
  onOpenHelpModal?: () => void;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="mau_institutional_landing_footer" className="w-full bg-slate-950 text-slate-400 border-t border-slate-800/80 font-sans relative z-20 overflow-hidden">
      {/* Top Accent Gradient Border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500" />

      {/* Security & System Trust Bar (Compact) */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white text-[11px] sm:text-xs">System Status:</span>
            <span className="font-mono text-emerald-400 font-bold text-[11px] sm:text-xs">All Microservices Active (99.98% SLA)</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline font-mono text-[11px]">Academic Year 2025/2026</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="flex items-center space-x-1 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>INSA Cyber-Defense</span>
            </span>
            <span className="hidden sm:flex items-center space-x-1 text-slate-300 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>TLS 1.3 256-Bit</span>
            </span>
          </div>
        </div>
      </div>

      {/* Compact Main 4-Column Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 items-start">

        {/* Column 1: University Identity (Span 4) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center space-x-3">
            <UniversitySeal className="w-10 h-10 shrink-0 drop-shadow-sm" />
            <div>
              <h3 className="font-display font-black text-slate-100 text-sm sm:text-base tracking-wide uppercase leading-tight">
                Mekdela Amba University
              </h3>
              <p className="text-amber-400 font-serif text-[11px] font-semibold leading-tight">
                መቅደላ አምባ ዩኒቨርሲቲ
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
            Ethiopian public university accredited by FDRE MoE & HEIRA. Advancing academic excellence, research, and technology in South Wollo.
          </p>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-slate-300">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>HEIRA Certified</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-300">
              <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>HEMIS Cloud</span>
            </span>
          </div>
        </div>

        {/* Column 2: Campuses (Span 3) */}
        <div className="lg:col-span-3 space-y-2">
          <h4 className="font-display font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Campuses & Location</span>
          </h4>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <strong className="text-slate-200 font-semibold flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Tulu Awliya Main Campus</span>
              </strong>
              <p className="text-slate-400 text-[10.5px] pl-4">
                P.O. Box 32, South Wollo, Amhara Region
              </p>
            </div>

            <div>
              <strong className="text-slate-200 font-semibold flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Masha Agriculture & Tech</span>
              </strong>
              <p className="text-slate-400 text-[10.5px] pl-4">
                South Wollo Zone, Ethiopia
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Helplines (Span 3) */}
        <div className="lg:col-span-3 space-y-2">
          <h4 className="font-display font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>Direct Inquiries</span>
          </h4>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono text-[10.5px]">Registrar:</span>
              <span className="font-semibold font-mono text-slate-200">+251 33 222 0120</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono text-[10.5px]">ICT Helpdesk:</span>
              <span className="font-semibold font-mono text-slate-200">+251 33 222 0100</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-red-400 font-medium text-[10.5px] flex items-center space-x-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Security:</span>
              </span>
              <span className="font-mono text-red-300 font-bold">+251 33 222 0911</span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono pt-0.5">
              Email: <span className="text-amber-400">registrar@mau.edu.et</span>
            </p>
          </div>
        </div>

        {/* Column 4: Quick Actions & Version (Span 2) */}
        <div className="lg:col-span-2 space-y-2">
          <h4 className="font-display font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Verification</span>
          </h4>

          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="w-full text-left flex items-center justify-between py-0.5 text-slate-400 hover:text-amber-300 text-[11px] transition group cursor-pointer"
            >
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Security Audit</span>
              </span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={onOpenHelpModal}
              className="w-full text-left flex items-center justify-between py-0.5 text-slate-400 hover:text-blue-300 text-[11px] transition group cursor-pointer"
            >
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-3 h-3 text-blue-400" />
                <span>Login Guide</span>
              </span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          <div className="pt-1">
            <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Portal Edition</span>
              <strong className="text-[11px] font-mono text-amber-300">USCMS v4.9.2 PRO</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Legal & Copyright Bottom Strip (Compact) */}
      <div className="border-t border-slate-900 bg-slate-950 px-4 sm:px-6 py-3 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-slate-400">
            © {currentYear} <strong className="text-slate-200">Mekdela Amba University (መቅደላ አምባ ዩኒቨርሲቲ)</strong>. FDRE MoE Accredited.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[10.5px] font-mono text-slate-400">
            <span className="hover:text-slate-300 transition">Privacy & Security</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition">ISO 9001:2015</span>
            <span>•</span>
            <span className="text-amber-500 font-bold">Tulu Awliya, Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
