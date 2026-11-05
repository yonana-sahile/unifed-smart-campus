import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  id: string | null | undefined;
  /** Optional className for the wrapping span */
  className?: string;
  /** Size of the icon: "sm" for table, "md" for headers */
  size?: "sm" | "md";
  /** "default" for light backgrounds, "light" for dark headers */
  variant?: "default" | "light";
};
/**
 * Displays a student ID with a copy-to-clipboard button.
 * Click the ID or the icon → copies to clipboard + toast.
 */
export function CopyableId({ id, className = "", size = "sm", variant = "default" }: Props) {
  const [copied, setCopied] = useState(false);
  if (!id) {
    return (
      <span
        className={`font-mono text-xs ${
          variant === "light" ? "text-slate-500" : "text-slate-300"
        } ${className}`}
      >
        —
      </span>
    );
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success("Student ID copied", {
        description: id,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Couldn't copy", {
        description: "Clipboard access was blocked",
        duration: 3000,
      });
    }
  };

  const iconClass = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  const colorClass =
    variant === "light"
      ? "text-slate-300 hover:text-white hover:underline"
      : "text-slate-600 hover:text-blue-600 hover:underline";
  const iconColor = variant === "light" ? "text-slate-400" : "text-slate-400";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy "${id}"`}
      className={`inline-flex items-center gap-1 font-mono ${textClass} ${colorClass} underline-offset-2 transition-colors group/copy ${className}`}
    >
      <span className="tracking-wide tabular-nums">{id}</span>
      {copied ? (
        <Check className={`${iconClass} text-emerald-500`} />
      ) : (
        <Copy
          className={`${iconClass} ${iconColor} opacity-0 group-hover/copy:opacity-100 transition-opacity`}
        />
      )}
    </button>
  );
}