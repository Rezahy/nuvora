"use client";

import { useEffect } from "react";
import { useSudokuStore } from "@/store/sudoku-store";

/** Drives the timer tick — should be mounted once near the root. */
export function useGameTimer() {
  const tick = useSudokuStore((s) => s.tick);
  const status = useSudokuStore((s) => s.status);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [status, tick]);
}
