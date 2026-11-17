"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSudokuStore } from "@/store/sudoku-store";

export function NumberPad() {
  const board = useSudokuStore((s) => s.board);
  const solution = useSudokuStore((s) => s.solution);
  const notesMode = useSudokuStore((s) => s.notesMode);
  const inputNumber = useSudokuStore((s) => s.inputNumber);
  const status = useSudokuStore((s) => s.status);
  const disabled = status !== "playing";

  // Count only CORRECT placements: a wrong entry must not use up a digit.
  const placed = new Array(10).fill(0);
  for (let i = 0; i < 81; i++) if (board[i] !== 0 && board[i] === solution[i]) placed[board[i]]++;

  return (
    <div className="grid w-full grid-cols-9">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
        const remaining = 9 - placed[n];
        const done = remaining <= 0;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={disabled || done}
            whileTap={{ scale: 0.85 }}
            onClick={() => inputNumber(n)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl py-1",
              "transition-colors active:bg-[var(--sudoku-peer-bg)]",
              done && "invisible",
            )}
            aria-label={notesMode ? `Toggle note ${n}` : `Enter ${n}, ${remaining} left`}
          >
            <span
              className={cn(
                "font-normal leading-none text-[length:var(--pad-font)] transition-colors",
                notesMode ? "text-[var(--sudoku-label)]" : "text-[var(--sudoku-num-accent)]",
              )}
            >
              {n}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-[var(--sudoku-text-muted)]">{remaining}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
