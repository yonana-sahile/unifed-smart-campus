import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Newspaper,
  Flame,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  Tag,
  ExternalLink,
  Radio,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Building2,
  Share2,
  Check
} from "lucide-react";
import { EthiopianFlag } from "./UniversityHeader";

export interface NewsItem {
  id: string;
  title: string;
  amharicTitle: string;
  category: "ACADEMIC" | "EXIT_EXAM" | "RESEARCH" | "CAMPUS_LIFE" | "ANNOUNCEMENT";
  categoryLabel: string;
  date: string;
  ethiopianDate: string;
  summary: string;
  fullContent: string;
  author: string;
  isBreaking?: boolean;
}

export const campusNewsList: NewsItem[] = [
  {
    id: "news-1",
    title: "MoE National Exit Exam Simulation Portal Officially Opens for 2018 E.C. Candidates",
    amharicTitle: "የ2018 ዓ.ም. የትምህርት ሚኒስቴር የብሔራዊ መውጫ ፈተና (Exit Exam) የሙከራ ፖርታል በይፋ ተከፈተ",
    category: "EXIT_EXAM",
    categoryLabel: "Exit Exam • መውጫ ፈተና",
    date: "Feb 28, 2026",
    ethiopianDate: "የካቲት 21/2018 ዓ.ም.",
    summary: "Final year students across all 7 faculties can now take 100-question timed mock trials aligned with national blueprints.",
    fullContent: "The Ministry of Education in collaboration with Mekdela Amba University Academic Vice President Office has officially inaugurated the 2018 E.C. National Exit Exam Mock Simulation Portal.\n\nAll prospective graduating candidates in Computer Science, Software Engineering, Agricultural Sciences, Law, and Public Health are strongly advised to complete the simulated mock exams in the Central ICT e-Testing Centers at Tulu Awliya and Masha campuses. Timed practice runs are open 24/7.",
    author: "MAU Registrar & MoE Testing Center",
    isBreaking: true
  },
  {
    id: "news-2",
    title: "Tulu Awliya Main Campus Launches 10Gbps High-Speed Fiber Backbone & AI Research Lab",
    amharicTitle: "የቱሉ አውሊያ ዋና ካምፓስ የ10Gbps ከፍተኛ ፍጥነት የፋይበር ኔትወርክ እና የኤአይ ምርምር ማዕከል አስመረቀ",
    category: "CAMPUS_LIFE",
    categoryLabel: "ICT & Tech • ቴክኖሎጂ",
    date: "Feb 26, 2026",
    ethiopianDate: "የካቲት 19/2018 ዓ.ም.",
    summary: "The newly expanded campus data center brings ultra-fast Wi-Fi to all student dormitories, digital library carrels, and laboratories.",
    fullContent: "Mekdela Amba University ICT Directorate has concluded the installation of the high-resilience Optical Fiber Network across the Tulu Awliya Main Campus.\n\nThe project connects academic blocks, student lounges, dormitories 1-12, and the Digital Library with uninterrupted high-bandwidth connectivity and introduces an AI-assisted cloud computing lab for senior thesis projects.",
    author: "ICT Directorate",
    isBreaking: false
  },
  {
    id: "news-3",
    title: "Masha Campus Agriculture Institute Publishes Breakthrough Highland Organic Coffee Study",
    amharicTitle: "የማሻ ካምፓስ የግብርና ተቋም የከፍተኛ ቦታ ኦርጋኒክ ቡና አዲስ የምርምር ውጤት ይፋ አደረገ",
    category: "RESEARCH",
    categoryLabel: "Research • ምርምር",
    date: "Feb 23, 2026",
    ethiopianDate: "የካቲት 16/2018 ዓ.ም.",
    summary: "Scientific trials in Sheka biosphere showcase 28% higher climate resilience and exceptional cup quality scores.",
    fullContent: "Researchers at the Masha Campus College of Agriculture & Natural Resources have published a comprehensive peer-reviewed journal paper on sustainable agroforestry in the high-altitude cloud forests of Sheka.\n\nThe innovation provides farmers in the region with disease-resistant, climate-resilient coffee saplings and organic soil enrichment protocols.",
    author: "Directorate of Research & Community Service",
    isBreaking: false
  },
  {
    id: "news-4",
    title: "Semester II Add/Drop Period and Digital Clearance Window Announced for 2025/2026",
    amharicTitle: "የሁለተኛ ሴሚስተር የኮርስ ማስተካከያ (Add/Drop) እና የዲጂታል ክሊራንስ መርሃ-ግብር ይፋ ሆነ",
    category: "ACADEMIC",
    categoryLabel: "Academic • አካዳሚክ",
    date: "Feb 20, 2026",
    ethiopianDate: "የካቲት 13/2018 ዓ.ም.",
    summary: "Students can adjust semester schedules online via the Student Information Portal before the strict deadline.",
    fullContent: "Office of the University Registrar reminds all undergraduate regular and extension students that the Course Add/Drop window for Semester II is strictly accessible through the digital SIS portal.\n\nStudents requiring departmental approval should liaise with their assigned academic advisors through the portal messaging interface.",
    author: "Office of the Registrar",
    isBreaking: false
  }
];

export function CampusNewsTopBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showAllNewsModal, setShowAllNewsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll news ticker every 5 seconds
  useEffect(() => {
    if (isPaused || selectedNews || showAllNewsModal) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campusNewsList.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, selectedNews, showAllNewsModal]);

  const activeNews = campusNewsList[currentIndex];

  const handleCopyLink = (id: string) => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Sleek Top Breaking News Bar / Ticker */}
      <nav
        aria-label="Campus News Bar"
        className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-amber-500/30 px-3 sm:px-6 py-1.5 z-40 relative text-xs shadow-md font-sans select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: News Badge + Flag */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] uppercase font-mono tracking-wider shadow-sm border border-white/20">
              <Flame className="w-3 h-3 text-yellow-300 animate-pulse" />
              <span>CAMPUS NEWS</span>
            </div>
            <span className="hidden md:inline-block text-[10px] text-amber-400/90 font-mono font-semibold">
              የካምፓስ ዜና
            </span>
          </div>

          {/* Center: Animated News Headline Ticker */}
          <div className="flex-1 overflow-hidden relative h-6 flex items-center px-1 sm:px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNews.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="flex items-center space-x-2 truncate cursor-pointer group"
                onClick={() => setSelectedNews(activeNews)}
              >
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[9px] font-mono font-bold shrink-0">
                  {activeNews.categoryLabel.split("•")[0].trim()}
                </span>

                <span className="text-xs sm:text-xs font-medium text-slate-200 group-hover:text-amber-300 transition-colors truncate">
                  {activeNews.title}
                </span>

                <span className="hidden lg:inline text-[10px] text-slate-400 font-mono shrink-0">
                  • {activeNews.date}
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Read</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Controls + "View All News" Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Ticker Next / Prev */}
            <div className="flex items-center space-x-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev - 1 + campusNewsList.length) % campusNewsList.length)
                }
                className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Headline"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[9px] font-mono text-amber-400 px-1 font-bold">
                {currentIndex + 1}/{campusNewsList.length}
              </span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % campusNewsList.length)}
                className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Headline"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* "All News" Modal Trigger */}
            <button
              onClick={() => setShowAllNewsModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[10px] sm:text-xs font-semibold transition cursor-pointer"
            >
              <Newspaper className="w-3 h-3" />
              <span className="hidden sm:inline">All Bulletins</span>
              <span className="sm:hidden">News</span>
            </button>
          </div>
        </div>
      </nav>

      {/* SINGLE ARTICLE DETAIL MODAL */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-primary to-slate-950 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30 uppercase">
                      {selectedNews.categoryLabel}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">
                      {selectedNews.date} • {selectedNews.ethiopianDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNews(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-950 dark:text-white leading-snug">
                    {selectedNews.title}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-serif text-amber-700 dark:text-amber-400 mt-1 font-semibold">
                    {selectedNews.amharicTitle}
                  </h3>
                </div>

                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 dark:text-amber-200 font-medium">
                  {selectedNews.summary}
                </div>

                <div className="space-y-3 whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
                  {selectedNews.fullContent}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued by: <strong>{selectedNews.author}</strong></span>
                  </div>

                  <button
                    onClick={() => handleCopyLink(selectedNews.id)}
                    className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    {copiedId === selectedNews.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share News</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  Close Bulletin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALL NEWS BULLETINS DIRECTORY MODAL */}
      <AnimatePresence>
        {showAllNewsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-primary to-slate-950 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-display font-bold text-white flex items-center space-x-2">
                      <span>Mekdela Amba University News & Bulletins</span>
                    </h2>
                    <p className="text-xs text-amber-300 font-mono">
                      የመቅደላ አምባ ዩኒቨርሲቲ ይፋዊ ዜናዎችና ማስታወቂያዎች
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAllNewsModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* News Items Grid */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campusNewsList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowAllNewsModal(false);
                        setSelectedNews(item);
                      }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-slate-800 transition cursor-pointer flex flex-col justify-between space-y-2.5 shadow-xs group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-mono font-bold">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                        </div>

                        <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[150px]">{item.author}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Showing {campusNewsList.length} verified university publications
                </span>
                <button
                  onClick={() => setShowAllNewsModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export default CampusNewsTopBar;
