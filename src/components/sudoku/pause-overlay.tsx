"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Home } from "lucide-react";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";

export function PauseOverlay() {
  const status = useSudokuStore((s) => s.status);
  const resume = useSudokuStore((s) => s.resume);
  const startGame = useSudokuStore((s) => s.startGame);
  const goHome = useSudokuStore((s) => s.goHome);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const elapsedSec = useSudokuStore((s) => s.elapsedSec);

  return (
    <AnimatePresence>
      {status === "paused" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[var(--sudoku-surface)]/90 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-[var(--sudoku-text)]">Paused</h2>
            <p className="-mt-2 text-sm tabular-nums text-[var(--sudoku-label)]">{formatTime(elapsedSec)}</p>
            <motion.button
              type="button"
              onClick={resume}
              whileTap={{ scale: 0.92 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sudoku-primary-btn)] text-white shadow-lg shadow-blue-500/30"
              aria-label="Resume"
              autoFocus
            >
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </motion.button>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => startGame(difficulty)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-[var(--sudoku-text)] hover:bg-[var(--sudoku-surface-muted)]"
              >
                <RotateCcw className="h-4 w-4" />
                New game
              </button>
              <button
                type="button"
                onClick={goHome}
                className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-[var(--sudoku-text)] hover:bg-[var(--sudoku-surface-muted)]"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
