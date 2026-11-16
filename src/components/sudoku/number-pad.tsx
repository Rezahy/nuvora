"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSudokuStore } from "@/store/sudoku-store";

export function NumberPad() {
  const board = useSudokuStore((s) => s.board);
  const inputNumber = useSudokuStore((s) => s.inputNumber);
  const status = useSudokuStore((s) => s.status);
  const disabled = status !== "playing";

  // Count how many of each number are already on the board (1-9 only).
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const v of board) {
    if (v >= 1 && v <= 9) counts[v]++;
  }

  return (
    <div className="w-full max-w-[min(92vw,30rem)] mx-auto">
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const remaining = 9 - counts[n];
          const exhausted = remaining <= 0;
          return (
            <motion.button
              key={n}
              type="button"
              disabled={disabled || exhausted}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: disabled || exhausted ? 1 : 1.05 }}
              onClick={() => inputNumber(n)}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "aspect-[3/4] rounded-lg sm:rounded-xl",
                "bg-[var(--sudoku-surface-hover)] hover:bg-[var(--sudoku-peer-bg)] active:bg-[var(--sudoku-same-value-bg)]",
                "border border-[var(--sudoku-border-thin)]",
                "transition-colors duration-100",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--sudoku-surface-hover)]",
              )}
              aria-label={`Enter number ${n}`}
            >
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-bold leading-none",
                  "text-[var(--sudoku-num-accent)]",
                )}
              >
                {n}
              </span>
              <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-medium text-[var(--sudoku-text-muted)]">
                {remaining}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
