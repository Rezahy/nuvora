"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { useSudokuStore } from "@/store/sudoku-store";

/** Short explanation of the last hint, shown over the top of the board. */
export function HintBanner() {
  const message = useSudokuStore((s) => s.hintMessage);
  const at = useSudokuStore((s) => s.lastHintAt);
  const dismiss = useSudokuStore((s) => s.dismissHintMessage);
  // Never cover the revealed cell: sit at the bottom when it is in the top rows.
  const atBottom = useSudokuStore((s) => s.lastHintIndex !== null && s.lastHintIndex < 36);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [message, at, dismiss]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-2 z-10 flex justify-center ${atBottom ? "bottom-2" : "top-2"}`}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={at}
            role="status"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex max-w-full items-start gap-2 rounded-xl bg-[var(--sudoku-num-given)] px-3 py-2 text-[13px] leading-snug text-[var(--sudoku-surface)] shadow-lg"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span>{message}</span>
            <button type="button" onClick={dismiss} aria-label="Dismiss hint" className="-mr-1 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
