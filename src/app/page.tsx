"use client";

import { MotionConfig } from "framer-motion";
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
import { HintBanner } from "@/components/sudoku/hint-banner";
import { GameEndDialog } from "@/components/sudoku/game-end-dialog";
import { DifficultySelector } from "@/components/sudoku/difficulty-selector";

export default function Home() {
  const status = useSudokuStore((s) => s.status);

  // Always mounted; each short-circuits when not playing.
  useGameTimer();
  useKeyboardControls();
  useLoadSavedGame();
  useTabPause();

  return (
    <MotionConfig reducedMotion="user">
      <main className="app-shell flex flex-col items-center bg-[var(--sudoku-page-bg)]">
        {status === "idle" ? (
          <DifficultySelector />
        ) : (
          <div className="game-layout mx-auto flex w-full max-w-[30rem] flex-1 flex-col">
            <GameHeader />
            <div className="flex flex-1 items-center justify-center py-3">
              <div className="board-frame relative">
                <SudokuBoard />
                <PauseOverlay />
                <HintBanner />
              </div>
            </div>
            <div className="flex flex-col gap-3 pb-2">
              <ActionBar />
              <NumberPad />
            </div>
          </div>
        )}
        <GameEndDialog />
      </main>
    </MotionConfig>
  );
}
