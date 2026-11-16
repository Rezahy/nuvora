"use client";

import { useEffect } from "react";
import { useSudokuStore } from "@/store/sudoku-store";

/**
 * Automatically pause the game when the browser tab becomes hidden
 * (user switches tabs, minimizes the window, etc.).
 * The timer hook already only ticks when status === "playing", so pausing
 * stops the clock until the user manually resumes.
 */
export function useTabPause() {
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        const status = useSudokuStore.getState().status;
        if (status === "playing") {
          useSudokuStore.getState().pause();
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
}
