"use client";

import { useEffect } from "react";
import { useSudokuStore } from "@/store/sudoku-store";

/**
 * On mount, check localStorage for a saved game and populate
 * savedGamePreview (for the Continue button on the home screen).
 */
export function useLoadSavedGame() {
  const loadSavedGame = useSudokuStore((s) => s.loadSavedGame);

  useEffect(() => {
    loadSavedGame();
  }, [loadSavedGame]);
}
