"use client";

import { ChevronLeft, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";
import { DIFFICULTY_LABELS } from "@/lib/sudoku";
import { ThemeToggle } from "@/components/theme-toggle";

export function GameHeader() {
  const difficulty = useSudokuStore((s) => s.difficulty);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const maxMistakes = useSudokuStore((s) => s.maxMistakes);
  const score = useSudokuStore((s) => s.score);
  const elapsedSec = useSudokuStore((s) => s.elapsedSec);
  const status = useSudokuStore((s) => s.status);
  const pause = useSudokuStore((s) => s.pause);
  const resume = useSudokuStore((s) => s.resume);
  const goHome = useSudokuStore((s) => s.goHome);

  const paused = status === "paused";

  return (
    <header className="w-full">
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          onClick={goHome}
          whileTap={{ scale: 0.9 }}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--sudoku-text)] hover:bg-[var(--sudoku-surface-muted)]"
          aria-label="Back to home (game is saved)"
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <h1 className="text-lg font-bold tracking-tight text-[var(--sudoku-num-given)]">Sudoku</h1>
        <ThemeToggle />
      </div>

      <div className="mt-2 grid grid-cols-4 items-end px-1 text-center">
        <Stat label="Difficulty" align="left">
          {DIFFICULTY_LABELS[difficulty]}
        </Stat>
        <Stat label="Mistakes">
          <span className={cn(mistakes >= maxMistakes - 1 && mistakes > 0 && "text-[var(--sudoku-wrong-text)]")}>
            {mistakes}/{maxMistakes}
          </span>
        </Stat>
        <Stat label="Score">{score}</Stat>
        <div className="flex items-end justify-end gap-1.5">
          <Stat label="Time" align="right">
            <span className="tabular-nums">{formatTime(elapsedSec)}</span>
          </Stat>
          <motion.button
            type="button"
            onClick={paused ? resume : pause}
            disabled={status !== "playing" && !paused}
            whileTap={{ scale: 0.9 }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sudoku-surface-muted)] text-[var(--sudoku-label)] disabled:opacity-40"
            aria-label={paused ? "Resume game" : "Pause game"}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            ) : (
              <Pause className="h-3.5 w-3.5" fill="currentColor" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function Stat({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center",
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--sudoku-text-muted)]">
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-[var(--sudoku-text)]">{children}</span>
    </div>
  );
}
