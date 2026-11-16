"use client";

import { motion } from "framer-motion";
import { Undo2, Eraser, Pencil, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSudokuStore } from "@/store/sudoku-store";

export function ActionBar() {
  const undo = useSudokuStore((s) => s.undo);
  const erase = useSudokuStore((s) => s.erase);
  const toggleNotesMode = useSudokuStore((s) => s.toggleNotesMode);
  const useHint = useSudokuStore((s) => s.useHint);
  const notesMode = useSudokuStore((s) => s.notesMode);
  const hintsLeft = useSudokuStore((s) => s.hintsLeft);
  const historyLen = useSudokuStore((s) => s.history.length);
  const selected = useSudokuStore((s) => s.selected);
  const board = useSudokuStore((s) => s.board);
  const puzzle = useSudokuStore((s) => s.puzzle);
  const notes = useSudokuStore((s) => s.notes);
  const status = useSudokuStore((s) => s.status);

  const disabled = status !== "playing";

  // Whether erase has anything to do.
  const canErase =
    selected !== null &&
    puzzle[selected] === 0 &&
    (board[selected] !== 0 || notes[selected].size > 0);

  const actions = [
    {
      key: "undo",
      label: "Undo",
      icon: Undo2,
      onClick: undo,
      disabled: disabled || historyLen === 0,
      badge: null as number | null,
      badgeColor: "",
      active: false,
    },
    {
      key: "erase",
      label: "Erase",
      icon: Eraser,
      onClick: erase,
      disabled: disabled || !canErase,
      badge: null,
      badgeColor: "",
      active: false,
    },
    {
      key: "notes",
      label: "Notes",
      icon: Pencil,
      onClick: toggleNotesMode,
      disabled,
      badge: notesMode ? null : null, // we'll render "ON" text instead when active
      badgeColor: "bg-[var(--sudoku-primary-btn)] text-white",
      active: notesMode,
    },
    {
      key: "hint",
      label: "Hint",
      icon: Lightbulb,
      onClick: useHint,
      disabled: disabled || hintsLeft <= 0,
      badge: hintsLeft,
      badgeColor: "bg-[var(--sudoku-primary-btn)] text-white",
      active: false,
    },
  ];

  return (
    <div className="w-full max-w-[min(92vw,30rem)] mx-auto">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.key}
              type="button"
              onClick={a.onClick}
              disabled={a.disabled}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: a.disabled ? 1 : 1.03 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1",
                "py-2.5 sm:py-3 rounded-lg sm:rounded-xl",
                "bg-[var(--sudoku-surface)] border border-[var(--sudoku-border-thin)]",
                "transition-colors duration-100",
                a.active && "bg-[var(--sudoku-peer-bg)] border-[var(--sudoku-num-accent)]",
                "hover:bg-[var(--sudoku-surface-hover)]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--sudoku-surface)]",
              )}
              aria-label={a.label}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6",
                    a.active ? "text-[var(--sudoku-num-accent)]" : "text-[var(--sudoku-text)]",
                  )}
                  strokeWidth={2}
                />
                {a.badge !== null && a.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1",
                      "flex items-center justify-center",
                      "rounded-full text-[10px] font-bold leading-none",
                      a.badgeColor || "bg-[var(--sudoku-text-muted)] text-white",
                    )}
                  >
                    {a.badge}
                  </span>
                )}
                {a.key === "notes" && a.active && (
                  <span
                    className={cn(
                      "absolute -top-2 -right-2 px-1 h-[16px]",
                      "flex items-center justify-center",
                      "rounded-full text-[9px] font-bold leading-none uppercase",
                      "bg-[var(--sudoku-primary-btn)] text-white",
                    )}
                  >
                    ON
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  a.active ? "text-[var(--sudoku-num-accent)]" : "text-[var(--sudoku-text)]",
                )}
              >
                {a.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
