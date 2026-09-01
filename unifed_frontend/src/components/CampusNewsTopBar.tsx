import React, { useState, useEffect, useCallback } from "react";
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
  Check,
  Bell,
  Volume2,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Info,
  Plus,
  ShieldCheck,
  Lock
} from "lucide-react";
import { EthiopianFlag } from "./UniversityHeader";
import { CampusDatabase, initialCampusNews } from "../mockData";
import type { User, UserRole } from "./types";
import { CampusDatabase } from "./services/api";

export type NewsItem = CampusNewsItem;
export const campusNewsList = initialCampusNews;

interface CampusNewsTopBarProps {
  currentUser?: User | null;
}

export function CampusNewsTopBar({ currentUser }: CampusNewsTopBarProps) {
  const [news, setNews] = useState<CampusNewsItem[]>(() => CampusDatabase.getCampusNews());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNews, setSelectedNews] = useState<CampusNewsItem | null>(null);
  const [showAllNewsModal, setShowAllNewsModal] = useState(false);
  const [showAdminNewsModal, setShowAdminNewsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshNews = useCallback(() => {
    const updated = CampusDatabase.getCampusNews();
    setNews(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  // Auto-scroll news ticker
  useEffect(() => {
    if (isPaused || selectedNews || showAllNewsModal || showAdminNewsModal || news.length === 0) return;

    const rotationTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5500);

    return () => clearInterval(rotationTimer);
  }, [isPaused, selectedNews, showAllNewsModal, showAdminNewsModal, news.length]);

  const activeNews = news[currentIndex] || news[0] || initialCampusNews[0];

  const handleCopyLink = (id: string) => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ATTRACTIVE TOP LIVE NEWS TICKER BAR */}
      <nav
        aria-label="Campus Live News Bar"
        className="w-full relative z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-amber-500/40 shadow-lg select-none font-sans overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle Ambient Glow Background */}
        <div className="absolute top-0 left-1/4 w-96 h-full bg-amber-500/10 blur-xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-full bg-red-500/10 blur-xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2.5 sm:gap-4 relative">
          {/* LEFT: Eye-Catching Pulsing Breaking News Beacon */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowAllNewsModal(true)}
              className="relative flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-black text-[10px] uppercase font-mono tracking-wider shadow-md hover:shadow-red-500/40 border border-white/30 cursor-pointer group transition-transform active:scale-95"
              title="Click to view all university bulletins"
            >
              {/* Radar Ping Ripple Effect */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
              </span>

              <Flame className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
              <span className="tracking-widest">CAMPUS LIVE</span>

              {/* Counter Badge */}
              <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-black/40 text-yellow-300 border border-yellow-400/30">
                {news.length}
              </span>
            </button>

            <span className="hidden xl:inline-flex items-center text-[10px] font-semibold text-amber-400 font-mono tracking-tight">
              የመቅደላ አምባ ዩኒቨርሲቲ ይፋዊ ዜና
            </span>
          </div>

          {/* CENTER: Animated Smooth Ticker Headline */}
          <div className="flex-1 overflow-hidden relative h-7 flex items-center px-1 sm:px-2">
            <AnimatePresence mode="wait">
              {activeNews && (
                <motion.div
                  key={activeNews.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex items-center space-x-2.5 truncate cursor-pointer group w-full"
                  onClick={() => setSelectedNews(activeNews)}
                >
                  {/* Category Pill Tag with distinct gradient */}
                  <span
                    className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs border bg-gradient-to-r ${activeNews.badgeColor} shrink-0`}
                  >
                    <Zap className="w-2.5 h-2.5 mr-1" />
                    {activeNews.categoryLabel}
                  </span>

                  {/* News Headline with Glow on Hover */}
                  <span className="text-xs sm:text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors truncate tracking-wide">
                    {activeNews.title}
                  </span>

                  {/* Date & Read time */}
                  <span className="hidden lg:inline-flex items-center text-[10px] text-slate-400 font-mono shrink-0 space-x-1">
                    <span>•</span>
                    <Clock className="w-3 h-3 text-amber-400/80" />
                    <span>{activeNews.readTime}</span>
                  </span>

                  {/* Interactive Click Indicator */}
                  <span className="hidden md:inline-flex items-center text-[10px] text-amber-400 font-bold group-hover:translate-x-1 transition-transform shrink-0 ml-auto bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-400/30">
                    <span>ዝርዝር ይመልከቱ</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Modern Sleek Controls & All News Trigger */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Ticker Navigator Buttons */}
            {news.length > 1 && (
              <div className="flex items-center space-x-0.5 bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 shadow-xs">
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length)
                  }
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer active:scale-90"
                  title="Previous Headline"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono text-amber-400 px-1 font-bold min-w-[28px] text-center">
                  {currentIndex + 1}/{news.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % news.length)}
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer active:scale-90"
                  title="Next Headline"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* "All News Bulletins" Modal Trigger */}
            <button
              onClick={() => setShowAllNewsModal(true)}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/30 text-amber-300 hover:text-amber-100 border border-amber-500/50 text-[10px] sm:text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">All Bulletins</span>
              <span className="sm:hidden">News</span>
            </button>

            {/* "+ Add News (Admin Gate)" Trigger */}
            <button
              onClick={() => setShowAdminNewsModal(true)}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600/30 via-red-600/30 to-amber-600/30 hover:from-amber-600/50 hover:to-red-600/50 text-amber-200 hover:text-white border border-amber-400/40 text-[10px] sm:text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 group"
              title="Admin Authentication & News Dashboard"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-90 transition-transform" />
              <span className="hidden md:inline">+ Add News</span>
              <span className="md:hidden">Add</span>
            </button>
          </div>
        </div>
      </nav>

      {/* SINGLE ARTICLE DETAIL MODAL */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header with Vibrant Ethiopian Gold & Royal Slate */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-primary to-slate-950 text-white flex items-center justify-between border-b border-amber-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-full bg-amber-500/10 blur-xl pointer-events-none" />

                <div className="flex items-center space-x-3 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
                    <Newspaper className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border bg-gradient-to-r ${selectedNews.badgeColor} uppercase tracking-wider`}>
                        {selectedNews.categoryLabel}
                      </span>
                      <span className="text-[10px] text-amber-300/90 font-mono">
                        {selectedNews.categoryAmharic}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono flex items-center space-x-1.5">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{selectedNews.date}</span>
                      <span>•</span>
                      <span className="text-amber-300">{selectedNews.ethiopianDate}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNews(null)}
                  className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-mono font-bold mb-2">
                    {selectedNews.highlightTag}
                  </div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-950 dark:text-white leading-snug">
                    {selectedNews.title}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-serif text-amber-700 dark:text-amber-400 mt-1.5 font-semibold leading-relaxed">
                    {selectedNews.amharicTitle}
                  </h3>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/10 border-l-4 border-amber-500 rounded-r-2xl text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium">
                  {selectedNews.summary}
                </div>

                <div className="space-y-3 whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  {selectedNews.fullContent}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Issued by: <strong className="text-slate-800 dark:text-slate-200">{selectedNews.author}</strong></span>
                  </div>

                  <button
                    onClick={() => handleCopyLink(selectedNews.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold transition cursor-pointer"
                  >
                    {copiedId === selectedNews.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Bulletin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:shadow-lg hover:shadow-amber-500/30 transition cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-primary to-slate-950 text-white flex items-center justify-between border-b border-amber-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Newspaper className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-display font-bold text-white flex items-center space-x-2">
                      <span>Mekdela Amba University News & Bulletins</span>
                    </h2>
                    <p className="text-xs text-amber-300 font-mono">
                      የመቅደላ አምባ ዩኒቨርሲቲ ይፋዊ ዜናዎችና ማስታወቂያዎች ማዕከል
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowAllNewsModal(false);
                      setShowAdminNewsModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Publish Announcement (Admin)</span>
                  </button>

                  <button
                    onClick={() => setShowAllNewsModal(false)}
                    className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* News Items Grid */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowAllNewsModal(false);
                        setSelectedNews(item);
                      }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-slate-800 transition cursor-pointer flex flex-col justify-between space-y-3 shadow-xs group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shadow-2xs border bg-gradient-to-r ${item.badgeColor}`}
                          >
                            {item.categoryLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                        </div>

                        <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[150px] font-medium">{item.author}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                          <span>Read Full</span>
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
                  Showing {news.length} verified publications
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowAllNewsModal(false);
                      setShowAdminNewsModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    Admin Portal
                  </button>
                  <button
                    onClick={() => setShowAllNewsModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN NEWS CREATION & MANAGEMENT MODAL */}
      <CampusNewsAdminModal
        isOpen={showAdminNewsModal}
        onClose={() => setShowAdminNewsModal(false)}
        onNewsUpdated={refreshNews}
        currentUser={currentUser}
      />
    </>
  );
}
export default CampusNewsTopBar;
