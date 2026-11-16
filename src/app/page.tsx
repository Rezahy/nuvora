"use client";

import { useSudokuStore } from "@/store/sudoku-store";
import { useGameTimer } from "@/hooks/use-game-timer";
import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { useLoadSavedGame } from "@/hooks/use-load-saved-game";
import { useTabPause } from "@/hooks/use-tab-pause";
import { SudokuBoard } from "@/components/sudoku/sudoku-board";
import { NumberPad } from "@/components/sudoku/number-pad";
import { ActionBar } from "@/components/sudoku/action-bar";
import { GameHeader } from "@/components/sudoku/game-header";
import { PauseOverlay } from "@/components/sudoku/pause-overlay";
import { GameEndDialog } from "@/components/sudoku/game-end-dialog";
import { DifficultySelector } from "@/components/sudoku/difficulty-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const status = useSudokuStore((s) => s.status);

  // Always mount the timer & keyboard handlers (they short-circuit when not playing).
  useGameTimer();
  useKeyboardControls();
  useLoadSavedGame();
  useTabPause();

  return (
    <main className="min-h-screen bg-[var(--sudoku-page-bg)] flex flex-col items-center justify-start py-6 px-4">
      {/* Theme toggle — fixed top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {status === "idle" ? (
        <DifficultySelector />
      ) : (
        <div className="w-full flex flex-col items-center gap-5 sm:gap-6 py-2">
          <GameHeader />

          <div className="relative w-full flex justify-center">
            <SudokuBoard />
            <PauseOverlay />
          </div>

          <ActionBar />
          <NumberPad />
        </div>
      )}

      <GameEndDialog />
    </main>
  );
}
