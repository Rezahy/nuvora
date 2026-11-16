/**
 * Persistence layer for the Sudoku game.
 * Saves/restores an in-progress game to localStorage so the user can
 * continue after a page refresh.
 */

import type { Board, Difficulty } from "./sudoku";
import type { CellNotes, GameStatus, HistoryEntry } from "./sudoku-store";

const STORAGE_KEY = "sudoku-game-save-v1";

/** Lightweight preview for the Continue button — enough to render the card. */
export interface SavedGamePreview {
  difficulty: Difficulty;
  elapsedSec: number;
  mistakes: number;
}

/** Full serialized game state — everything needed to resume play. */
export interface SavedGame {
  status: GameStatus;
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  board: Board;
  notes: number[][]; // Set<number> -> number[]
  selected: number | null;
  notesMode: boolean;
  hintsLeft: number;
  mistakes: number;
  maxMistakes: number;
  score: number;
  elapsedSec: number;
  history: SerializedHistoryEntry[];
}

interface SerializedHistoryEntry {
  index: number;
  prevValue: number;
  nextValue: number;
  prevNotes: number[];
  nextNotes: number[];
  wasGiven: boolean;
}

/** The slice of store state needed to serialize. */
export interface PersistableState {
  status: GameStatus;
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  board: Board;
  notes: CellNotes[];
  selected: number | null;
  notesMode: boolean;
  hintsLeft: number;
  mistakes: number;
  maxMistakes: number;
  score: number;
  elapsedSec: number;
  history: HistoryEntry[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Save the current game to localStorage. Only persists playing/paused games. */
export function saveGame(state: PersistableState): void {
  if (!isBrowser()) return;

  // Don't save finished or idle games.
  if (state.status !== "playing" && state.status !== "paused") {
    clearSavedGame();
    return;
  }

  const saved: SavedGame = {
    status: state.status,
    difficulty: state.difficulty,
    puzzle: [...state.puzzle],
    solution: [...state.solution],
    board: [...state.board],
    notes: state.notes.map((n) => Array.from(n)),
    selected: state.selected,
    notesMode: state.notesMode,
    hintsLeft: state.hintsLeft,
    mistakes: state.mistakes,
    maxMistakes: state.maxMistakes,
    score: state.score,
    elapsedSec: state.elapsedSec,
    history: state.history.map((h) => ({
      index: h.index,
      prevValue: h.prevValue,
      nextValue: h.nextValue,
      prevNotes: Array.from(h.prevNotes ?? []),
      nextNotes: Array.from(h.nextNotes ?? []),
      wasGiven: h.wasGiven,
    })),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // localStorage might be full or disabled — fail silently.
  }
}

/** Load the saved game from localStorage. Returns null if none or invalid. */
export function loadSavedGame(): SavedGame | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    // Basic validation.
    if (
      !parsed ||
      typeof parsed.status !== "string" ||
      !Array.isArray(parsed.puzzle) ||
      parsed.puzzle.length !== 81
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Remove the saved game from localStorage. */
export function clearSavedGame(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/** Extract a lightweight preview for the Continue button. */
export function toPreview(saved: SavedGame): SavedGamePreview {
  return {
    difficulty: saved.difficulty,
    elapsedSec: saved.elapsedSec,
    mistakes: saved.mistakes,
  };
}
