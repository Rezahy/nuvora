"use client";

import { motion } from "framer-motion";
import { Trophy, AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";
import { DIFFICULTY_LABELS } from "@/lib/sudoku";

export function GameEndDialog() {
  const status = useSudokuStore((s) => s.status);
  const score = useSudokuStore((s) => s.score);
  const elapsedSec = useSudokuStore((s) => s.elapsedSec);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const startGame = useSudokuStore((s) => s.startGame);
  const reset = useSudokuStore((s) => s.reset);

  const open = status === "won" || status === "lost";
  const won = status === "won";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); }}>
      <DialogContent className="max-w-sm rounded-2xl overflow-hidden p-0">
        <div
          className={
            won
              ? "bg-gradient-to-br from-[var(--sudoku-primary-btn)] to-[var(--sudoku-primary-btn-hover)]"
              : "bg-gradient-to-br from-amber-500 to-orange-500"
          }
        >
          <div className="flex flex-col items-center pt-8 pb-6 px-6 text-white">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3"
            >
              {won ? (
                <Trophy className="w-9 h-9 text-white" />
              ) : (
                <AlertTriangle className="w-9 h-9 text-white" />
              )}
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-white">
              {won ? "Solved!" : "Game Over"}
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              {won
                ? "Great work — you completed the puzzle."
                : "You've reached the mistake limit."}
            </DialogDescription>
          </div>
        </div>

        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="sr-only">Game summary</DialogTitle>
          <DialogDescription className="sr-only">
            Your stats for this round.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Difficulty" value={DIFFICULTY_LABELS[difficulty]} />
            <Stat label="Time" value={formatTime(elapsedSec)} />
            <Stat label="Score" value={String(score)} />
            <Stat label="Mistakes" value={`${mistakes}`} />
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2 flex-row">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => reset()}
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Button>
          <Button
            className="flex-1 rounded-xl bg-[var(--sudoku-primary-btn)] hover:bg-[var(--sudoku-primary-btn-hover)]"
            onClick={() => startGame(difficulty)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            New game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-[var(--sudoku-surface-hover)] border border-[var(--sudoku-border-thin)]">
      <span className="text-[10px] uppercase tracking-wider text-[var(--sudoku-text-muted)] font-medium">
        {label}
      </span>
      <span className="text-base font-semibold text-[var(--sudoku-text)]">{value}</span>
    </div>
  );
}
