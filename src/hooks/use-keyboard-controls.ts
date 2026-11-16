"use client";

import { useEffect } from "react";
import { useSudokuStore } from "@/store/sudoku-store";

/**
 * Global keyboard handler for the Sudoku board.
 *  - Arrow keys: move selection
 *  - 1-9: place number (or toggle note in notes mode)
 *  - 0 / Delete / Backspace: erase
 *  - N: toggle notes mode
 *  - H: use hint
 *  - U / Cmd+Z / Ctrl+Z: undo
 *  - Space / P: pause
 */
export function useKeyboardControls() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = useSudokuStore.getState();
      // Only act when actively playing.
      if (state.status !== "playing") {
        // Allow space to resume from pause.
        if (e.code === "Space" && state.status === "paused") {
          e.preventDefault();
          state.resume();
        }
        return;
      }

      // Movement
      if (state.selected !== null) {
        const r = Math.floor(state.selected / 9);
        const c = state.selected % 9;
        let nr = r;
        let nc = c;
        let moved = false;
        if (e.key === "ArrowUp") {
          nr = (r + 8) % 9;
          moved = true;
        }
        if (e.key === "ArrowDown") {
          nr = (r + 1) % 9;
          moved = true;
        }
        if (e.key === "ArrowLeft") {
          nc = (c + 8) % 9;
          moved = true;
        }
        if (e.key === "ArrowRight") {
          nc = (c + 1) % 9;
          moved = true;
        }
        if (moved) {
          e.preventDefault();
          state.selectCell(nr * 9 + nc);
          return;
        }
      } else {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          state.selectCell(40); // center
          e.preventDefault();
          return;
        }
      }

      // Number input
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        state.inputNumber(parseInt(e.key, 10));
        return;
      }

      // Erase
      if (e.key === "0" || e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.erase();
        return;
      }

      // Notes toggle
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        state.toggleNotesMode();
        return;
      }

      // Hint
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        state.useHint();
        return;
      }

      // Undo
      if (
        e.key === "u" ||
        e.key === "U" ||
        ((e.metaKey || e.ctrlKey) && e.key === "z")
      ) {
        e.preventDefault();
        state.undo();
        return;
      }

      // Pause
      if (e.key === " " || e.key === "p" || e.key === "P") {
        e.preventDefault();
        state.pause();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
