"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSudokuStore } from "@/store/sudoku-store";
import { computeAllConflicts, isPeer } from "@/lib/sudoku";

/** Seconds between ripple steps of the completion wave. */
const WAVE_STEP = 0.05;
const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface SudokuCellProps {
  index: number;
  isConflict: boolean;
}

function SudokuCellImpl({ index, isConflict }: SudokuCellProps) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  // Narrow selectors: each cell only re-renders when something it shows changes.
  const value = useSudokuStore((s) => s.board[index]);
  const isGiven = useSudokuStore((s) => s.puzzle[index] !== 0);
  const isWrong = useSudokuStore((s) => s.board[index] !== 0 && s.board[index] !== s.solution[index]);
  const notes = useSudokuStore((s) => s.notes[index]);
  const isSelected = useSudokuStore((s) => s.selected === index);
  const inSameUnit = useSudokuStore((s) => s.selected !== null && s.selected !== index && isPeer(s.selected, index));
  const selectedValue = useSudokuStore((s) => (s.selected === null ? 0 : s.board[s.selected]));
  const mistakeAt = useSudokuStore((s) => (s.lastMistakeIndex === index ? s.lastMistakeAt : 0));
  const hintAt = useSudokuStore((s) => (s.lastHintIndex === index ? s.lastHintAt : 0));
  const waveDelay = useSudokuStore((s) => s.completion.delays[index]);
  const waveAt = useSudokuStore((s) => (s.completion.delays[index] >= 0 ? s.completion.at : 0));
  const selectCell = useSudokuStore((s) => s.selectCell);

  const sameValue = !isSelected && value !== 0 && value === selectedValue;

  const bg = isSelected
    ? isWrong
      ? "bg-[var(--sudoku-wrong-bg-selected)]"
      : "bg-[var(--sudoku-selected-bg)]"
    : isWrong || (isConflict && sameValue)
      ? "bg-[var(--sudoku-wrong-bg)]"
      : sameValue
        ? "bg-[var(--sudoku-same-value-bg)]"
        : inSameUnit
          ? "bg-[var(--sudoku-peer-bg)]"
          : "bg-[var(--sudoku-surface)]";

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        // Select on press (not release) so the board feels instant on touch.
        if (e.button === 0) selectCell(index);
      }}
      onClick={() => selectCell(index)}
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden select-none",
        "transition-colors duration-150 outline-none",
        bg,
      )}
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`Row ${row + 1}, column ${col + 1}, ${value ? value : "empty"}${isWrong ? ", incorrect" : ""}`}
    >
      {/* Completion ripple. Keyed by the event time so every completion replays,
          and it only ever runs once: it can't get stuck on. */}
      {waveAt > 0 && (
        <motion.span
          key={`wave-${waveAt}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[var(--sudoku-complete-bg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: waveDelay * WAVE_STEP, times: [0, 0.3, 1], ease: "easeOut" }}
        />
      )}
      {hintAt > 0 && (
        <motion.span
          key={`hint-${hintAt}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[var(--sudoku-hint-bg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, times: [0, 0.15, 0.6, 1] }}
        />
      )}

      {value !== 0 ? (
        <motion.span
          key={`bounce-${waveAt}`}
          className="relative block"
          animate={waveAt > 0 ? { scale: [1, 1.3, 1] } : undefined}
          transition={{ duration: 0.45, delay: waveDelay * WAVE_STEP + 0.05, ease: "easeOut" }}
        >
          <motion.span
            key={`shake-${mistakeAt}`}
            className="block"
            animate={mistakeAt > 0 ? { x: [0, -5, 5, -4, 4, -2, 0] } : undefined}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              key={`v-${value}`}
              className={cn(
                "block font-normal leading-none tabular-nums text-[length:var(--cell-font)]",
                isGiven
                  ? "text-[var(--sudoku-num-given)]"
                  : isWrong
                    ? "text-[var(--sudoku-wrong-text)]"
                    : "text-[var(--sudoku-num-user)]",
              )}
              initial={isGiven ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              {value}
            </motion.span>
          </motion.span>
        </motion.span>
      ) : notes.size > 0 ? (
        <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[6%]">
          {NOTE_DIGITS.map((n) => (
            <span
              key={n}
              className={cn(
                "flex items-center justify-center leading-none text-[length:var(--note-font)]",
                !notes.has(n) && "invisible",
                n === selectedValue
                  ? "rounded-sm bg-[var(--sudoku-num-accent)] font-bold text-white"
                  : "text-[var(--sudoku-label)]",
              )}
            >
              {n}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

const SudokuCell = memo(SudokuCellImpl);
SudokuCell.displayName = "SudokuCell";

/** Box b, position k inside the box → board index. */
const cellIndex = (b: number, k: number) =>
  (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3);

export function SudokuBoard() {
  const board = useSudokuStore((s) => s.board);
  const status = useSudokuStore((s) => s.status);
  const conflicts = useMemo(() => computeAllConflicts(board), [board]);
  const interactive = status === "playing";

  return (
    <div
      className={cn(
        "sudoku-board w-full aspect-square rounded-lg bg-[var(--sudoku-border-thick)] p-[2px]",
        "shadow-[0_6px_28px_-10px_rgba(15,23,42,0.25)]",
        !interactive && "pointer-events-none",
      )}
      role="grid"
      aria-label="Sudoku board"
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[2px] overflow-hidden rounded-[6px]">
        {Array.from({ length: 9 }, (_, b) => (
          <div key={b} className="grid grid-cols-3 grid-rows-3 gap-px bg-[var(--sudoku-border-thin)]">
            {Array.from({ length: 9 }, (_, k) => {
              const i = cellIndex(b, k);
              return <SudokuCell key={i} index={i} isConflict={conflicts.has(i)} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
