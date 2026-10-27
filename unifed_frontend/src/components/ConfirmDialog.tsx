// src/components/ConfirmDialog.tsx
import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Bold headline — short, action-oriented ("Delete this material?") */
  title: string;
  /** Optional body — context, consequences, policy text */
  description?: ReactNode;
  /** Text on the confirm button. Default: "Confirm" */
  confirmLabel?: string;
  /** Text on the cancel button. Default: "Cancel" */
  cancelLabel?: string;
  /**
   * Visual + semantic tone:
   * - "danger"  → red   (irreversible: delete)
   * - "warning" → amber (policy override, caution)
   * - "primary" → blue  (publish, reversible actions)
   */
  variant?: "danger" | "warning" | "primary";
  /** Disables both buttons and shows "Working…" on confirm */
  loading?: boolean;
  /** Fired when the confirm button is clicked */
  onConfirm: () => void;
  /** Fired on cancel button, X button, or backdrop click (ignored while loading) */
  onCancel: () => void;
  /**
   * If true, clicking the backdrop does NOT close the dialog.
   * Recommended for destructive actions. Default: false (backdrop closes).
   */
  disableBackdropClose?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
  disableBackdropClose = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      iconBg: "bg-red-100 text-red-600",
      buttonClass: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      iconBg: "bg-amber-100 text-amber-600",
      buttonClass: "bg-amber-600 hover:bg-amber-700",
    },
    primary: {
      iconBg: "bg-blue-100 text-blue-600",
      buttonClass: "bg-primary hover:bg-primary-600",
    },
  }[variant];

  const handleBackdropClick = () => {
    if (loading) return;
    if (disableBackdropClose) return;
    onCancel();
  };

  const handleCancelClick = () => {
    if (loading) return;
    onCancel();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Dialog card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
          >
            {/* Close (X) button */}
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={loading}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + Title + Description */}
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${variantConfig.iconBg}`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3
                  id="confirm-dialog-title"
                  className="font-display font-bold text-slate-900 text-base leading-snug"
                >
                  {title}
                </h3>
                {description && (
                  <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={loading}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${variantConfig.buttonClass}`}
              >
                {loading ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}