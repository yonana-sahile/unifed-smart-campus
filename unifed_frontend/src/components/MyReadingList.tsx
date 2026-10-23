// src/components/MyReadingList.tsx
import { useState } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Trash2,
  Play,
  Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { LibraryResource } from "../types";
import type { UseReadingListReturn } from "../hooks/useReadingList";

interface MyReadingListProps {
  readingList: UseReadingListReturn;
  resources: LibraryResource[];
  onOpen: (res: LibraryResource) => void;
  onGoToCatalog: () => void;
}

type Filter = "ALL" | "READING" | "SAVED" | "FINISHED";

export function MyReadingList({
  readingList,
  resources,
  onOpen,
  onGoToCatalog,
}: MyReadingListProps) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = {
    ALL: readingList.items.length,
    READING: readingList.readingNow.length,
    SAVED: readingList.savedForLater.length,
    FINISHED: readingList.finished.length,
  };

  const filteredItems =
    filter === "ALL"
      ? [
          ...readingList.readingNow,
          ...readingList.savedForLater,
          ...readingList.finished,
        ]
      : filter === "READING"
      ? readingList.readingNow
      : filter === "SAVED"
      ? readingList.savedForLater
      : readingList.finished;

  const resourceOf = (id: string) => resources.find((r) => r.id === id);

  // ── Empty state ────────────────────────────────────────
  if (readingList.items.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-amber-500" />
        </div>
        <h4 className="font-display font-bold text-slate-800 text-sm">
          Your reading list is empty
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Click the 🔖 bookmark on any resource in the Catalog to save it here
          and track your reading progress.
        </p>
        <button
          onClick={onGoToCatalog}
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white text-xs font-semibold transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Browse Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs with live counts */}
      <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm w-fit flex-wrap">
        {(
          [
            ["ALL", "All", counts.ALL],
            ["READING", "Reading", counts.READING],
            ["SAVED", "Saved", counts.SAVED],
            ["FINISHED", "Finished", counts.FINISHED],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === key
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtered list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const res = resourceOf(item.resourceId);
            if (!res) return null;

            const statusIcon =
              item.status === "FINISHED" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : item.status === "READING" ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              );

            const statusColor =
              item.status === "FINISHED"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : item.status === "READING"
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-slate-100 text-slate-500 border-slate-200";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition"
              >
                {/* Status icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${statusColor}`}
                >
                  {statusIcon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm truncate">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {res.author} • {res.resourceType}
                    {res.fileSize ? ` • ${res.fileSize}` : ""}
                  </p>

                  {item.progressPercent > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.status === "FINISHED"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">
                        {item.progressPercent}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpen(res)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {item.progressPercent > 0 && item.progressPercent < 100
                      ? "Continue"
                      : item.status === "FINISHED"
                      ? "Re-read"
                      : "Open"}
                  </button>
                  <button
                    onClick={() => readingList.remove(item.resourceId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Remove from list"
                    aria-label="Remove from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500">No items in this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}