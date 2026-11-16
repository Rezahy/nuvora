"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Home } from "lucide-react";
import { useSudokuStore } from "@/store/sudoku-store";

export function PauseOverlay() {
  const status = useSudokuStore((s) => s.status);
  const resume = useSudokuStore((s) => s.resume);
  const startGame = useSudokuStore((s) => s.startGame);
  const goHome = useSudokuStore((s) => s.goHome);
  const difficulty = useSudokuStore((s) => s.difficulty);

  return (
    <AnimatePresence>
      {status === "paused" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--sudoku-surface)]/80 backdrop-blur-sm rounded-xl"
        >
          <div className="flex flex-col items-center gap-5">
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-2xl font-bold text-[var(--sudoku-text)]"
            >
              Paused
            </motion.h2>

            <motion.button
              type="button"
              onClick={resume}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--sudoku-primary-btn)] text-white font-semibold shadow-md shadow-blue-500/20"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Resume
            </motion.button>

            <div className="flex items-center gap-2 mt-1">
              <motion.button
                type="button"
                onClick={() => startGame(difficulty)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--sudoku-text)] hover:bg-[var(--sudoku-surface-muted)] font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                New game
              </motion.button>

              <motion.button
                type="button"
                onClick={goHome}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--sudoku-text)] hover:bg-[var(--sudoku-surface-muted)] font-medium"
              >
                <Home className="w-4 h-4" />
                Home
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
