"use client";

import { motion } from "framer-motion";
import { Undo2, Eraser, Pencil, Lightbulb, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSudokuStore, isLockedCell } from "@/store/sudoku-store";

interface Action {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled: boolean;
  active?: boolean;
  badge?: React.ReactNode;
}

export function ActionBar() {
  const undo = useSudokuStore((s) => s.undo);
  const erase = useSudokuStore((s) => s.erase);
  const toggleNotesMode = useSudokuStore((s) => s.toggleNotesMode);
  const useHint = useSudokuStore((s) => s.useHint);
  const notesMode = useSudokuStore((s) => s.notesMode);
  const hintsLeft = useSudokuStore((s) => s.hintsLeft);
  const historyLen = useSudokuStore((s) => s.history.length);
  const status = useSudokuStore((s) => s.status);
  const canErase = useSudokuStore(
    (s) =>
      s.selected !== null &&
      !isLockedCell(s, s.selected) &&
      (s.board[s.selected] !== 0 || s.notes[s.selected].size > 0),
  );

  const disabled = status !== "playing";

  const actions: Action[] = [
    { key: "undo", label: "Undo", icon: Undo2, onClick: undo, disabled: disabled || historyLen === 0 },
    { key: "erase", label: "Erase", icon: Eraser, onClick: erase, disabled: disabled || !canErase },
    {
      key: "notes",
      label: "Notes",
      icon: Pencil,
      onClick: toggleNotesMode,
      disabled,
      active: notesMode,
      badge: (
        <span
          className={cn(
            "rounded-full px-1.5 py-[2px] text-[9px] font-bold uppercase leading-none",
            notesMode
              ? "bg-[var(--sudoku-primary-btn)] text-white"
              : "bg-[var(--sudoku-text-muted)] text-[var(--sudoku-surface)]",
          )}
        >
          {notesMode ? "On" : "Off"}
        </span>
      ),
    },
    {
      key: "hint",
      label: "Hint",
      icon: Lightbulb,
      onClick: useHint,
      disabled: disabled || hintsLeft <= 0,
      badge: (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sudoku-primary-btn)] px-1 text-[10px] font-bold leading-none text-white">
          {hintsLeft}
        </span>
      ),
    },
  ];

  return (
    <div className="grid w-full grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.key}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            whileTap={a.disabled ? undefined : { scale: 0.88 }}
            className="group flex flex-col items-center gap-1 py-1 disabled:cursor-not-allowed"
            aria-label={a.key === "hint" ? `Hint, ${hintsLeft} left` : a.label}
            aria-pressed={a.key === "notes" ? notesMode : undefined}
          >
            <span
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                a.active
                  ? "bg-[var(--sudoku-same-value-bg)] text-[var(--sudoku-num-accent)]"
                  : "bg-[var(--sudoku-surface-muted)] text-[var(--sudoku-label)] group-hover:bg-[var(--sudoku-peer-bg)]",
                "group-disabled:opacity-40",
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              {a.badge && <span className="absolute -right-1.5 -top-1">{a.badge}</span>}
            </span>
            <span
              className={cn(
                "text-xs font-medium group-disabled:opacity-40",
                a.active ? "text-[var(--sudoku-num-accent)]" : "text-[var(--sudoku-label)]",
              )}
            >
              {a.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
