"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";
import { DIFFICULTY_LABELS, type Difficulty } from "@/lib/sudoku";
import { loadStats, type Stats } from "@/lib/sudoku-stats";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

const DIFFICULTY_DOTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

export function DifficultySelector() {
  const startGame = useSudokuStore((s) => s.startGame);
  const resumeSavedGame = useSudokuStore((s) => s.resumeSavedGame);
  const savedGamePreview = useSudokuStore((s) => s.savedGamePreview);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // localStorage is only available after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(loadStats());
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="flex items-center justify-between">
        <InstallButton />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 mt-6 flex flex-col items-center gap-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={72} height={72} className="h-[72px] w-[72px] drop-shadow-lg" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--sudoku-num-given)]">Sudoku</h1>
        <p className="max-w-xs text-center text-sm text-[var(--sudoku-label)]">Train your logic, beat your time.</p>
      </motion.div>

      {savedGamePreview && (
        <motion.button
          type="button"
          onClick={resumeSavedGame}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--sudoku-primary-btn)] to-[var(--sudoku-primary-btn-hover)] p-4 text-white shadow-lg shadow-blue-500/25"
          aria-label={`Continue ${DIFFICULTY_LABELS[savedGamePreview.difficulty]} game at ${formatTime(savedGamePreview.elapsedSec)}`}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start text-left">
            <span className="text-base font-bold leading-tight">Continue game</span>
            <span className="mt-0.5 text-sm leading-tight text-white/80 tabular-nums">
              {DIFFICULTY_LABELS[savedGamePreview.difficulty]} · {formatTime(savedGamePreview.elapsedSec)}
              {savedGamePreview.mistakes > 0 && ` · ${savedGamePreview.mistakes} mistakes`}
            </span>
          </div>
        </motion.button>
      )}

      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--sudoku-text-muted)]">
        New game
      </p>
      <div className="flex w-full flex-col gap-2.5">
        {DIFFICULTIES.map((d, i) => {
          const s = stats?.[d];
          return (
            <motion.button
              key={d}
              type="button"
              onClick={() => startGame(d)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-2xl p-4",
                "border border-[var(--sudoku-border-thin)] bg-[var(--sudoku-surface)] shadow-sm",
                "transition-colors hover:border-[var(--sudoku-num-accent)]",
              )}
            >
              <div className="flex flex-col items-start text-left">
                <span className="flex items-center gap-2 text-lg font-semibold text-[var(--sudoku-text)]">
                  {DIFFICULTY_LABELS[d]}
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          n <= DIFFICULTY_DOTS[d] ? "bg-[var(--sudoku-num-accent)]" : "bg-[var(--sudoku-border-thin)]",
                        )}
                      />
                    ))}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--sudoku-label)]">
                  {s && s.won > 0 ? (
                    <>
                      <Trophy className="h-3 w-3" />
                      Best {formatTime(s.bestSec ?? 0)} · {s.won} won
                    </>
                  ) : (
                    "Not solved yet"
                  )}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--sudoku-text-muted)] transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          );
        })}
      </div>

      <p className="mt-auto pt-8 text-center text-xs text-[var(--sudoku-text-muted)]">
        Keyboard: arrows move · 1–9 enter · N notes · H hint · U undo
      </p>
    </div>
  );
}
