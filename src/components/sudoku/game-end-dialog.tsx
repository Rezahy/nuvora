"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, HeartCrack, RotateCcw, Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSudokuStore, formatTime } from "@/store/sudoku-store";
import { DIFFICULTY_LABELS } from "@/lib/sudoku";

/** Let the full-board ripple play before the win dialog covers the board. */
const WIN_DIALOG_DELAY_MS = 1300;

export function GameEndDialog() {
  const status = useSudokuStore((s) => s.status);
  const score = useSudokuStore((s) => s.score);
  const elapsedSec = useSudokuStore((s) => s.elapsedSec);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const newBest = useSudokuStore((s) => s.newBest);
  const startGame = useSudokuStore((s) => s.startGame);
  const reset = useSudokuStore((s) => s.reset);
  const secondChance = useSudokuStore((s) => s.secondChance);

  const ended = status === "won" || status === "lost";
  const won = status === "won";

  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ended) return;
    const t = setTimeout(() => setShown(true), won ? WIN_DIALOG_DELAY_MS : 450);
    return () => {
      clearTimeout(t);
      setShown(false);
    };
  }, [ended, won]);

  return (
    <Dialog
      open={ended && shown}
      onOpenChange={(o) => {
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl p-0" showCloseButton={false}>
        <div
          className={
            won
              ? "bg-gradient-to-br from-[var(--sudoku-primary-btn)] to-[var(--sudoku-primary-btn-hover)]"
              : "bg-gradient-to-br from-rose-500 to-orange-500"
          }
        >
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-white">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
            >
              {won ? <Trophy className="h-9 w-9" /> : <HeartCrack className="h-9 w-9" />}
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-white">{won ? "Excellent!" : "Game over"}</DialogTitle>
            <DialogDescription className="mt-1 text-white/85">
              {won
                ? newBest
                  ? "New best time for this difficulty!"
                  : "You solved the puzzle."
                : `You made ${mistakes} mistakes.`}
            </DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4">
          <Stat label="Difficulty" value={DIFFICULTY_LABELS[difficulty]} />
          <Stat label="Time" value={formatTime(elapsedSec)} />
          <Stat label="Score" value={String(score)} />
          <Stat label="Mistakes" value={String(mistakes)} />
        </div>

        <div className="flex flex-col gap-2 px-6 pb-6">
          {!won && (
            <Button
              className="h-11 rounded-xl bg-[var(--sudoku-primary-btn)] text-white hover:bg-[var(--sudoku-primary-btn-hover)]"
              onClick={secondChance}
            >
              <Heart className="mr-1 h-4 w-4" />
              Second chance
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={reset}>
              <Home className="mr-1 h-4 w-4" />
              Home
            </Button>
            <Button
              variant={won ? "default" : "outline"}
              className={
                won
                  ? "h-11 flex-1 rounded-xl bg-[var(--sudoku-primary-btn)] text-white hover:bg-[var(--sudoku-primary-btn-hover)]"
                  : "h-11 flex-1 rounded-xl"
              }
              onClick={() => startGame(difficulty)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--sudoku-border-thin)] bg-[var(--sudoku-surface-hover)] p-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--sudoku-text-muted)]">{label}</span>
      <span className="text-base font-semibold tabular-nums text-[var(--sudoku-text)]">{value}</span>
    </div>
  );
}
