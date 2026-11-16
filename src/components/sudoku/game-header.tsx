"use client";

import { Pause } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useSudokuStore,
  formatTime,
} from "@/store/sudoku-store";
import { DIFFICULTY_LABELS } from "@/lib/sudoku";

export function GameHeader() {
  const difficulty = useSudokuStore((s) => s.difficulty);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const maxMistakes = useSudokuStore((s) => s.maxMistakes);
  const score = useSudokuStore((s) => s.score);
  const elapsedSec = useSudokuStore((s) => s.elapsedSec);
  const pause = useSudokuStore((s) => s.pause);
  const status = useSudokuStore((s) => s.status);

  return (
    <div className="w-full max-w-[min(92vw,30rem)] mx-auto">
      <div className="flex items-start justify-between gap-2 px-1">
        {/* Left: difficulty + mistakes */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--sudoku-text-muted)] font-medium">
              Difficulty
            </span>
          </div>
          <span className="text-sm sm:text-base font-semibold text-[var(--sudoku-text)]">
            {DIFFICULTY_LABELS[difficulty]}
          </span>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--sudoku-text-muted)] font-medium">
              Mistakes
            </span>
            <span
              className={cn(
                "text-sm sm:text-base font-semibold",
                mistakes >= maxMistakes - 1 ? "text-[var(--sudoku-wrong-text)]" : "text-[var(--sudoku-text)]",
              )}
            >
              {mistakes}
              <span className="text-[var(--sudoku-text-muted)] font-normal">/{maxMistakes}</span>
            </span>
          </div>
        </div>

        {/* Right: score + time + pause */}
        <div className="flex flex-col items-end gap-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--sudoku-text-muted)] font-medium">
              Score
            </span>
          </div>
          <span className="text-sm sm:text-base font-semibold text-[var(--sudoku-text)]">
            {score}
          </span>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--sudoku-text-muted)] font-medium">
              Time
            </span>
            <motion.span
              key={elapsedSec}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm sm:text-base font-semibold text-[var(--sudoku-text)] tabular-nums"
            >
              {formatTime(elapsedSec)}
            </motion.span>
            <motion.button
              type="button"
              onClick={pause}
              disabled={status !== "playing"}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: status === "playing" ? 1.1 : 1 }}
              className={cn(
                "ml-1 flex items-center justify-center w-8 h-8 rounded-full",
                "bg-[var(--sudoku-surface-muted)] hover:bg-[var(--sudoku-border-thin)]",
                "transition-colors duration-100",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
              aria-label="Pause game"
            >
              <Pause className="w-4 h-4 text-[var(--sudoku-text)]" fill="currentColor" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
