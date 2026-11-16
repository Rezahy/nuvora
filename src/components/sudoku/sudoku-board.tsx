/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
"use client";

import { motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSudokuStore } from "@/store/sudoku-store";
import { computeAllConflicts } from "@/lib/sudoku";

interface SudokuCellProps {
  index: number;
  isConflict: boolean;
}

function SudokuCellImpl({ index }: SudokuCellProps) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  const value = useSudokuStore((s) => s.board[index]);
  const givenValue = useSudokuStore((s) => s.puzzle[index]);
  const solutionValue = useSudokuStore((s) => s.solution[index]);
  const notes = useSudokuStore((s) => s.notes[index]);
  const selected = useSudokuStore((s) => s.selected);
  const selectCell = useSudokuStore((s) => s.selectCell);
  const lastMistakeIndex = useSudokuStore((s) => s.lastMistakeIndex);
  const lastMistakeAt = useSudokuStore((s) => s.lastMistakeAt);
  const lastHintIndex = useSudokuStore((s) => s.lastHintIndex);
  const lastHintAt = useSudokuStore((s) => s.lastHintAt);
  const completedAnimCells = useSudokuStore((s) => s.completedAnimCells);
  const completedAnimAt = useSudokuStore((s) => s.completedAnimAt);

  const isGiven = givenValue !== 0;
  const isSelected = selected === index;

  // Persistent wrong-entry check: user-entered value that doesn't match the solution.
  // Stays red until the user erases or corrects it.
  const isWrong = !isGiven && value !== 0 && value !== solutionValue;

  // Same row / col / box as selected.
  const inSameUnit =
    selected !== null &&
    selected !== index &&
    (Math.floor(selected / 9) === row ||
      selected % 9 === col ||
      (Math.floor(Math.floor(selected / 9) / 3) === Math.floor(row / 3) &&
        Math.floor(Math.floor(selected % 9) / 3) === Math.floor(col / 3)));

  // Same value as selected.
  const board = useSudokuStore.getState().board;
  const selectedValue = selected !== null ? board[selected] : 0;
  const sameValueAsSelected =
    selected !== null && value !== 0 && selectedValue !== 0 && value === selectedValue;

  // Recent mistake (within last 1s) — drives the shake animation only.
  const isRecentMistake =
    lastMistakeIndex === index && Date.now() - lastMistakeAt < 1000;
  const isRecentHint = lastHintIndex === index && Date.now() - lastHintAt < 1200;

  // Completion celebration: when `completedAnimAt` changes and this cell is in
  // the completed set, briefly enter a "celebrating" state for ~900ms.
  const [isCelebrating, setIsCelebrating] = useState(false);
  useEffect(() => {
    if (completedAnimCells.has(index) && completedAnimAt > 0) {
      setIsCelebrating(true);
      const t = setTimeout(() => setIsCelebrating(false), 900);
      return () => clearTimeout(t);
    }
  }, [completedAnimAt, completedAnimCells, index]);

  // Borders: thick on the right & bottom of every 3rd column/row.
  const borderClasses = cn(
    "border-r border-b border-[var(--sudoku-border-thin)]",
    col === 0 && "border-l-2 border-l-[var(--sudoku-border-thick)]",
    (col + 1) % 3 === 0 && col !== 8 && "border-r-2 border-r-[var(--sudoku-border-thick)]",
    row === 0 && "border-t-2 border-t-[var(--sudoku-border-thick)]",
    (row + 1) % 3 === 0 && row !== 8 && "border-b-2 border-b-[var(--sudoku-border-thick)]",
    col === 8 && "border-r-2 border-r-[var(--sudoku-border-thick)]",
    row === 8 && "border-b-2 border-b-[var(--sudoku-border-thick)]",
  );

  // Background state — wrong entries get a persistent red tint (overrides peer/value highlights, but not selection).
  // Celebration takes priority (green pulse) for the ~900ms it's active.
  const bg = cn(
    isCelebrating
      ? "bg-[var(--sudoku-complete-bg)]"
      : isSelected
        ? isWrong
          ? "bg-[var(--sudoku-wrong-bg-selected)]"
          : "bg-[var(--sudoku-selected-bg)]"
        : isRecentMistake
          ? "bg-[var(--sudoku-wrong-bg-selected)]"
          : isRecentHint
            ? "bg-[var(--sudoku-hint-bg)]"
            : isWrong
              ? "bg-[var(--sudoku-wrong-bg)]"
              : sameValueAsSelected
                ? "bg-[var(--sudoku-same-value-bg)]"
                : inSameUnit
                  ? "bg-[var(--sudoku-peer-bg)]"
                  : isGiven
                    ? "bg-[var(--sudoku-surface-muted)]"
                    : "bg-[var(--sudoku-surface)]",
  );

  const handleClick = () => selectCell(index);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      animate={
        isCelebrating
          ? { scale: [1, 1.12, 1] }
          : { scale: 1 }
      }
      transition={
        isCelebrating
          ? { duration: 0.6, ease: "easeInOut", times: [0, 0.5, 1] }
          : { duration: 0.1 }
      }
      className={cn(
        "relative flex aspect-square items-center justify-center select-none",
        "transition-colors duration-100",
        borderClasses,
        bg,
        isRecentMistake && "animate-shake",
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`Cell row ${row + 1}, column ${col + 1}${
        value ? `, value ${value}` : ", empty"
      }`}
    >
      {value !== 0 ? (
        <motion.span
          key={`v-${value}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "text-2xl sm:text-3xl font-bold leading-none",
            isGiven
              ? "text-[var(--sudoku-num-given)]"
              : isWrong
                ? "text-[var(--sudoku-wrong-text)]"
                : "text-[var(--sudoku-num-user)]",
          )}
        >
          {value}
        </motion.span>
      ) : notes.size > 0 ? (
        <div className="grid w-full h-full grid-cols-3 grid-rows-3 p-0.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className={cn(
                "flex items-center justify-center text-[9px] sm:text-[11px] leading-none text-[var(--sudoku-label)]",
                notes.has(n) ? "opacity-100" : "opacity-0",
              )}
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}
    </motion.button>
  );
}

const SudokuCell = memo(SudokuCellImpl);
SudokuCell.displayName = "SudokuCell";

export function SudokuBoard() {
  const board = useSudokuStore((s) => s.board);
  const status = useSudokuStore((s) => s.status);

  // Recompute conflicts whenever board changes.
  const conflicts = computeAllConflicts(board);

  // If game is not playing, disable interactions visually.
  const interactive = status === "playing";

  return (
    <div
      className={cn(
        "w-full max-w-[min(92vw,30rem)] mx-auto rounded-lg overflow-hidden bg-[var(--sudoku-surface)]",
        "shadow-[0_4px_24px_-8px_rgba(15,23,42,0.15)]",
        !interactive && "pointer-events-none",
      )}
      role="grid"
      aria-label="Sudoku board"
    >
      <div className="grid grid-cols-9 grid-rows-9">
        {Array.from({ length: 81 }, (_, i) => (
          <SudokuCell
            key={i}
            index={i}
            isConflict={conflicts.has(i)}
          />
        ))}
      </div>
    </div>
  );
}
