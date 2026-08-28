import { useState, useEffect } from "react";
import { User } from "../types";
import { useTheme } from "../context/ThemeContext";
import { Clock, Shield, Award, Calendar, Bell, Globe, CheckCircle2, ChevronDown, BookOpen, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import mauLogoImg from "../assets/images/mau_university_logo_1787955234858.jpg";

export function DigitalClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours24 = time.getHours();
  const hours12 = hours24 % 12 || 12;
  const hours = is24Hour ? String(hours24).padStart(2, "0") : String(hours12).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={() => setIs24Hour(!is24Hour)}
      title="Click to toggle 12h / 24h • Ethiopian Standard Time (EAT • UTC+3)"
      id="university_digital_clock"
      className={`group cursor-pointer select-none flex items-center space-x-2.5 bg-slate-900/90 dark:bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-xs transition-all duration-200 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <Clock className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
      </div>

      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-baseline space-x-0.5 font-mono">
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-wide">
            {hours}
          </span>
          <span className="text-amber-400 font-bold animate-pulse text-xs sm:text-sm">:</span>
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-wide">
            {minutes}
          </span>
          <span className="text-amber-400 font-bold animate-pulse text-xs sm:text-sm">:</span>
          <span className="text-[11px] sm:text-xs font-bold text-amber-400/90 tracking-wider">
            {seconds}
          </span>
          {!is24Hour && (
            <span className="text-[9px] font-bold text-amber-200/90 bg-amber-500/25 px-1.5 py-0.5 rounded ml-1">
              {ampm}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5">
          <span className="hidden sm:inline">{dateStr}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-400 font-semibold">EAT (UTC+3)</span>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      id="theme_toggle_button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "Dark Mode (ጨለማ ገጽ)" : "Light Mode (የብርሃን ገጽታ)"}`}
      className={`relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all duration-300 border shadow-xs ${
        theme === "dark"
          ? "bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20"
          : "bg-white/90 hover:bg-white text-slate-800 border-slate-300/90 ring-1 ring-slate-200/50 shadow-xs"
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center space-x-1.5"
      >
        {theme === "dark" ? (
          <>
            <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-tight text-amber-300">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-amber-600 fill-amber-500/20" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-tight text-slate-800">Light</span>
          </>
        )}
      </motion.div>
    </button>
  );
}

export function UniversitySeal({
  className = "w-10 h-10",
  alt = "Mekdela Amba University Logo"
}: {
  className?: string;
  alt?: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative flex-shrink-0 flex items-center justify-center ${className}`}>
      {!hasError ? (
        <img
          src={mauLogoImg}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-contain select-none drop-shadow-sm transition-transform duration-200"
        />
      ) : (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          {/* Cyan/Sky Blue Background Gradient */}
          <linearGradient id="mauSkyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1cd0ff" />
            <stop offset="50%" stopColor="#00bdf7" />
            <stop offset="100%" stopColor="#00a3e0" />
          </linearGradient>

          {/* Golden Wheat Gradient */}
          <linearGradient id="mauWheatGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Gear / Mechanical Gradient */}
          <linearGradient id="mauGearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Flame Gradient */}
          <linearGradient id="mauFlameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="35%" stopColor="#dc2626" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          {/* Mountain / Amba Terrain Gradient */}
          <linearGradient id="mauMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="40%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>

          {/* Diamond Clip Path */}
          <clipPath id="mauDiamondClip">
            <polygon points="100,6 194,100 100,194 6,100" />
          </clipPath>

          {/* Text Paths along the diagonal diamond borders */}
          <path id="mauAmharicPath" d="M 28,95 L 94,29" />
          <path id="mauEnglishPath" d="M 106,29 L 174,97" />
        </defs>

        {/* Outer Diamond Rhombus Background */}
        <polygon
          points="100,6 194,100 100,194 6,100"
          fill="url(#mauSkyGradient)"
          stroke="#008cb8"
          strokeWidth="1.5"
        />

        {/* Inner Diamond Border Accent */}
        <polygon
          points="100,10 190,100 100,190 10,100"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        {/* 1. Top Scientific Atomic Orbitals Symbol */}
        <g transform="translate(100, 36)" stroke="#0284c7" strokeWidth="1.8" fill="none">
          {/* Vertical Ellipse */}
          <ellipse cx="0" cy="0" rx="6.5" ry="15" />
          {/* Diagonal Ellipses */}
          <ellipse cx="0" cy="0" rx="6.5" ry="15" transform="rotate(60)" />
          <ellipse cx="0" cy="0" rx="6.5" ry="15" transform="rotate(-60)" />
          {/* Central Nucleus Dot */}
          <circle cx="0" cy="0" r="2.2" fill="#0284c7" />
        </g>

        {/* 2. Curved Institution Names (Bilingual) */}
        {/* Left Side: Amharic - መቅደላ አምባ ዩኒቨርሲቲ */}
        <text
          fill="#dc2626"
          fontSize="11"
          fontWeight="900"
          letterSpacing="0.4"
          style={{ textShadow: "0 0 1px #ffffff" }}
        >
          <textPath href="#mauAmharicPath" startOffset="50%" textAnchor="middle">
            መቅደላ አምባ ዩኒቨርሲቲ
          </textPath>
        </text>

        {/* Right Side: English - Mekdela Amba University */}
        <text
          fill="#dc2626"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="sans-serif"
          letterSpacing="0.2"
          style={{ textShadow: "0 0 1px #ffffff" }}
        >
          <textPath href="#mauEnglishPath" startOffset="50%" textAnchor="middle">
            Mekdela Amba University
          </textPath>
        </text>

        {/* 3. Mountain Landscape of Mekdela Amba Plateau & Historical Fortress */}
        <g clipPath="url(#mauDiamondClip)">
          {/* Mountain Silhouette at bottom corner */}
          <path
            d="M 50,150 L 75,130 L 100,122 L 125,130 L 150,150 L 100,194 Z"
            fill="url(#mauMountainGradient)"
          />
          {/* Sevastopol / Fortress Landmark Silhouette in background */}
          <path
            d="M 85,132 C 85,115 92,102 100,102 C 108,102 115,115 115,132 Z"
            fill="#0284c7"
            fillOpacity="0.35"
          />
          <circle cx="100" cy="120" r="14" fill="#0369a1" fillOpacity="0.25" />
        </g>

        {/* 4. Left Arch: Golden Wheat / Barley Ear (Agriculture & Growth) */}
        <g>
          {/* Wheat Stem */}
          <path
            d="M 80,146 C 72,130 68,110 74,90 C 78,82 86,76 96,74"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.8"
          />
          {/* Wheat Grains */}
          {[
            { cx: 80, cy: 142, rx: 4, ry: 7, rot: -25 },
            { cx: 75, cy: 132, rx: 4.5, ry: 7.5, rot: -35 },
            { cx: 72, cy: 121, rx: 4.5, ry: 7.5, rot: -45 },
            { cx: 71, cy: 110, rx: 4.5, ry: 7.5, rot: -55 },
            { cx: 72, cy: 99, rx: 4.5, ry: 7.5, rot: -65 },
            { cx: 76, cy: 89, rx: 4, ry: 7, rot: -75 },
            { cx: 83, cy: 81, rx: 3.5, ry: 6.5, rot: -85 },
            { cx: 92, cy: 76, rx: 3, ry: 6, rot: -95 },
          ].map((grain, idx) => (
            <ellipse
              key={idx}
              cx={grain.cx}
              cy={grain.cy}
              rx={grain.rx}
              ry={grain.ry}
              transform={`rotate(${grain.rot} ${grain.cx} ${grain.cy})`}
              fill="url(#mauWheatGradient)"
              stroke="#b45309"
              strokeWidth="0.6"
            />
          ))}
          {/* Wheat awns / whiskers */}
          <path
            d="M 72,100 L 60,92 M 76,90 L 66,80 M 83,82 L 76,70 M 92,76 L 90,64"
            stroke="#d97706"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>

        {/* 5. Right Arch: Industrial Mechanical Gear / Cogwheel (Technology & Engineering) */}
        <g>
          {/* Main Curved Gear Ring */}
          <path
            d="M 124,146 C 132,130 136,110 130,90 C 126,82 118,76 108,74"
            fill="none"
            stroke="#475569"
            strokeWidth="3.5"
          />
          <path
            d="M 124,146 C 132,130 136,110 130,90 C 126,82 118,76 108,74"
            fill="none"
            stroke="url(#mauGearGradient)"
            strokeWidth="2.5"
          />
          {/* Outer Gear Teeth */}
          {[
            { x: 126, y: 142, angle: 25 },
            { x: 131, y: 132, angle: 35 },
            { x: 134, y: 121, angle: 45 },
            { x: 135, y: 110, angle: 55 },
            { x: 133, y: 99, angle: 65 },
            { x: 129, y: 89, angle: 75 },
            { x: 122, y: 80, angle: 85 },
            { x: 112, y: 75, angle: 95 },
          ].map((tooth, idx) => (
            <rect
              key={idx}
              x={tooth.x - 2.5}
              y={tooth.y - 2}
              width="5"
              height="4"
              rx="0.8"
              transform={`rotate(${tooth.angle} ${tooth.x} ${tooth.y})`}
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="0.7"
            />
          ))}
        </g>

        {/* 6. Central Flaming Torch of Enlightenment */}
        <g>
          {/* Torch Cup / Chalice */}
          <path
            d="M 92,126 L 108,126 L 105,142 L 95,142 Z"
            fill="#0369a1"
            stroke="#075985"
            strokeWidth="0.8"
          />
          {/* Torch Stem */}
          <line x1="100" y1="142" x2="100" y2="152" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />

          {/* Torch Flames */}
          {/* Outer Red Flame */}
          <path
            d="M 100,78 C 94,92 90,106 94,124 C 98,126 102,126 106,124 C 110,106 106,92 100,78 Z"
            fill="url(#mauFlameGradient)"
          />
          {/* Inner Flame Tongue 1 (Left) */}
          <path
            d="M 97,88 C 93,98 92,108 96,122 C 98,114 96,104 97,88 Z"
            fill="#ef4444"
          />
          {/* Inner Flame Tongue 2 (Right) */}
          <path
            d="M 103,88 C 107,98 108,108 104,122 C 102,114 104,104 103,88 Z"
            fill="#ea580c"
          />
          {/* Center Golden Core */}
          <path
            d="M 100,94 C 97,104 97,112 100,123 C 103,112 103,104 100,94 Z"
            fill="#fde047"
          />
        </g>

        {/* 7. Foreground Open Book of Knowledge */}
        <g transform="translate(100, 146)">
          {/* Outer Cover Backing */}
          <path
            d="M -32,0 C -18,-5 -6,-2 0,2 C 6,-2 18,-5 32,0 L 32,16 C 18,11 6,14 0,18 C -6,14 -18,11 -32,16 Z"
            fill="#0f172a"
          />
          {/* White Open Pages */}
          <path
            d="M -30,-1 C -16,-6 -5,-3 0,1 C 5,-3 16,-6 30,-1 L 30,14 C 16,9 5,12 0,16 C -5,12 -16,9 -30,14 Z"
            fill="#ffffff"
            stroke="#334155"
            strokeWidth="0.8"
          />
          {/* Center Spine Line */}
          <line x1="0" y1="1" x2="0" y2="16" stroke="#0f172a" strokeWidth="1.2" />

          {/* Inscribed Page Lines / Text Mockup */}
          {/* Left Page Text */}
          <line x1="-24" y1="3" x2="-6" y2="1" stroke="#64748b" strokeWidth="0.8" />
          <line x1="-24" y1="6" x2="-6" y2="4" stroke="#64748b" strokeWidth="0.8" />
          <line x1="-24" y1="9" x2="-8" y2="7" stroke="#64748b" strokeWidth="0.8" />
          {/* Right Page Text */}
          <line x1="6" y1="1" x2="24" y2="3" stroke="#64748b" strokeWidth="0.8" />
          <line x1="6" y1="4" x2="24" y2="6" stroke="#64748b" strokeWidth="0.8" />
          <line x1="8" y1="7" x2="24" y2="9" stroke="#64748b" strokeWidth="0.8" />
        </g>

        {/* 8. Bottom "MAU" Acronym Banner with Yellow/Red Contrast */}
        <g transform="translate(100, 175)">
          {/* Yellow Shadow / Glow Outline */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#facc15"
            stroke="#facc15"
            strokeWidth="3.5"
            strokeLinejoin="round"
            fontSize="15"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="1"
          >
            MAU
          </text>
          {/* Bold Red Forefront Text */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#dc2626"
            fontSize="15"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="1"
          >
            MAU
          </text>
        </g>
      </svg>
      )}
    </div>
  );
}

interface UniversityTopBarProps {
  user: User;
  onLogout: () => void;
  portalTitle: string;
  portalSubtitle?: string;
  badgeText?: string;
  badgeType?: "student" | "instructor" | "admin" | "federal" | "faculty";
}

export function UniversityTopBar({
  user,
  onLogout,
  portalTitle,
  portalSubtitle = "Mekdela Amba University • መቅደላ አምባ ዩኒቨርሲቲ",
  badgeText,
  badgeType = "student"
}: UniversityTopBarProps) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "federal":
        return "bg-emerald-900/60 text-emerald-300 border-emerald-500/30";
      case "instructor":
      case "faculty":
        return "bg-amber-900/40 text-amber-300 border-amber-500/30";
      case "admin":
        return "bg-purple-900/40 text-purple-300 border-purple-500/30";
      default:
        return "bg-blue-900/40 text-blue-300 border-blue-500/30";
    }
  };

  return (
    <header className="university-gradient text-white border-b border-slate-700/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5 sm:py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: University Seal + Bilingual Title */}
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <UniversitySeal className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 drop-shadow-md" />
          <div className="border-l border-slate-700/80 pl-3.5 sm:pl-4 space-y-0.5">
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <span className="font-display tracking-wider font-extrabold text-sm sm:text-base md:text-lg text-slate-100 uppercase">
                Mekdela Amba University
              </span>
              <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                መቅደላ አምባ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center space-x-2">
              <span className="text-amber-400 font-semibold">{portalTitle}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 text-xs hidden sm:inline">{portalSubtitle}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Digital Clock + Theme Toggle + Academic Year + User Profile + Logout */}
        <div className="flex items-center justify-between md:justify-end space-x-2.5 sm:space-x-4">
          {/* Live Digital Clock */}
          <DigitalClock />

          {/* Official Academic Calendar Pill */}
          <div className="hidden lg:flex flex-col items-end text-right border-r border-slate-700/80 pr-3.5 sm:pr-4 leading-snug">
            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-200 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>AY 2025/2026 • Sem II</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">የካቲት 2018 ዓ.ም. (EC)</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Profile Info */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 pl-1">
            <div className="text-right leading-tight">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-100">{user.fullName}</span>
              </div>
              <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle()}`}>
                  {badgeText || user.role}
                </span>
                {user.studentId && (
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 font-medium">{user.studentId}</span>
                )}
              </div>
            </div>

            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-amber-500/50 object-cover shadow-md"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-display font-bold text-sm shadow-md">
                {user.fullName.charAt(0)}
              </div>
            )}
          </div>

          <div className="h-7 w-px bg-slate-700 hidden sm:block" />

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="px-3.5 sm:px-4 py-2 bg-slate-800/90 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 text-slate-200 hover:text-red-200 rounded-xl text-xs sm:text-sm font-semibold transition duration-150 shadow-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export function AcademicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 px-6 text-xs mt-auto font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <UniversitySeal className="w-6 h-6 opacity-75" />
          <div>
            <p className="text-slate-300 font-semibold">Mekdela Amba University (መቅደላ አምባ ዩኒቨርሲቲ)</p>
            <p className="text-[10px] text-slate-500">Ministry of Education (MoE) • South Wollo, Amhara Region, Ethiopia</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
          <span>FDRE HEIRA Certified</span>
          <span>•</span>
          <span>ISO 9001:2015</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">USCMS Portal v4.8</span>
        </div>
      </div>
    </footer>
  );
}

