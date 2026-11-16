"use client";

import { motion } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";
import { DIFFICULTY_LABELS, type Difficulty } from "@/lib/sudoku";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: "40 clues — a relaxed warm-up",
  medium: "32 clues — a steady challenge",
  hard: "28 clues — needs focus",
  expert: "24 clues — for seasoned solvers",
};

export function DifficultySelector() {
  const startGame = useSudokuStore((s) => s.startGame);
  const resumeSavedGame = useSudokuStore((s) => s.resumeSavedGame);
  const savedGamePreview = useSudokuStore((s) => s.savedGamePreview);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-2 mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--sudoku-primary-btn)] to-[var(--sudoku-primary-btn-hover)] flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--sudoku-num-given)] mt-2 tracking-tight">
          Sudoku
        </h1>
        <p className="text-sm text-[var(--sudoku-label)] text-center max-w-xs">
          Choose a difficulty to begin. Train your logic, beat your time.
        </p>
      </motion.div>

      {/* Continue button — only shown if there's a saved game in progress */}
      {savedGamePreview && (
        <motion.button
          type="button"
          onClick={resumeSavedGame}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-2xl mb-4",
            "bg-gradient-to-r from-[var(--sudoku-primary-btn)] to-[var(--sudoku-primary-btn-hover)]",
            "text-white shadow-lg shadow-blue-500/25",
            "transition-all duration-150",
          )}
          aria-label={`Continue ${DIFFICULTY_LABELS[savedGamePreview.difficulty]} game at ${formatTime(savedGamePreview.elapsedSec)}`}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div className="flex flex-col items-start text-left flex-1 min-w-0">
            <span className="text-base font-bold leading-tight">
              Continue
            </span>
            <span className="text-sm text-white/80 leading-tight mt-0.5 tabular-nums">
              {formatTime(savedGamePreview.elapsedSec)} · {DIFFICULTY_LABELS[savedGamePreview.difficulty]}
              {savedGamePreview.mistakes > 0 && ` · ${savedGamePreview.mistakes} mistakes`}
            </span>
          </div>
        </motion.button>
      )}

      <div className="w-full flex flex-col gap-3">
        {DIFFICULTIES.map((d, i) => (
          <motion.button
            key={d}
            type="button"
            onClick={() => startGame(d)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
              "group flex items-center justify-between gap-3 p-4 rounded-2xl",
              "bg-[var(--sudoku-surface)] border border-[var(--sudoku-border-thin)]",
              "hover:border-[var(--sudoku-num-accent)] hover:bg-[var(--sudoku-peer-bg)]",
              "transition-colors duration-150",
              "shadow-sm",
            )}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-lg font-semibold text-[var(--sudoku-text)]">
                {DIFFICULTY_LABELS[d]}
              </span>
              <span className="text-xs text-[var(--sudoku-label)] mt-0.5">
                {DIFFICULTY_DESCRIPTIONS[d]}
              </span>
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-[var(--sudoku-surface-muted)] group-hover:bg-[var(--sudoku-primary-btn)]",
                "transition-colors duration-150",
              )}
            >
              <svg
                className="w-5 h-5 text-[var(--sudoku-label)] group-hover:text-white transition-colors duration-150"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="mt-8 text-xs text-[var(--sudoku-text-muted)] text-center">
        Use the number pad to fill cells. Tap Notes to add pencil marks.
      </p>
    </div>
  );
}
