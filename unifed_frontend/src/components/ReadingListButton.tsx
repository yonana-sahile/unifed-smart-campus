// src/components/ReadingListButton.tsx
import { Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "motion/react";

interface ReadingListButtonProps {
  saved: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}

export function ReadingListButton({
  saved,
  onClick,
  size = "md",
}: ReadingListButtonProps) {
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const pad = size === "sm" ? "p-1.5" : "p-2";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      title={saved ? "Remove from Reading List" : "Save to Reading List"}
      aria-label={saved ? "Remove from Reading List" : "Save to Reading List"}
      className={`${pad} rounded-lg border transition-colors flex items-center justify-center shrink-0 ${
        saved
          ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
          : "bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600"
      }`}
    >
      {saved ? (
        <BookmarkCheck className={`${dim} fill-current`} />
      ) : (
        <Bookmark className={dim} />
      )}
    </motion.button>
  );
}