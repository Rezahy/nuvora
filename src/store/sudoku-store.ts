/**
 * Zustand store for the Sudoku game.
 */

import { create } from "zustand";
import {
  type Board,
  type Difficulty,
  generatePuzzle,
  getHint,
  isBoardComplete,
  computeAllConflicts,
  getCompletedUnitCells,
  EMPTY_BOARD,
} from "@/lib/sudoku";
import {
  saveGame,
  loadSavedGame,
  clearSavedGame,
  toPreview,
  type SavedGamePreview,
} from "@/lib/sudoku-persist";

export type CellNotes = Set<number>;

export type GameStatus = "idle" | "playing" | "paused" | "won" | "lost";

export interface HistoryEntry {
  index: number;
  prevValue: number;
  nextValue: number;
  prevNotes?: CellNotes;
  nextNotes?: CellNotes;
  wasGiven: boolean; // whether the affected cell was previously given (shouldn't happen)
}

export interface SudokuState {
  status: GameStatus;
  difficulty: Difficulty;

  // The puzzle as given to the player (immutable — for "isGiven" checks).
  puzzle: Board;
  // The fully solved board (for hints & win check).
  solution: Board;
  // The current board state (includes user input).
  board: Board;
  // Per-cell notes (only meaningful for non-given, empty cells).
  notes: CellNotes[];

  // Index of the currently selected cell, or null.
  selected: number | null;
  // Whether notes mode is on.
  notesMode: boolean;
  // How many hints remain.
  hintsLeft: number;
  // How many mistakes the player has made (out of `maxMistakes`).
  mistakes: number;
  maxMistakes: number;
  // Score.
  score: number;
  // Elapsed seconds (only counts when status === "playing").
  elapsedSec: number;
  // Whether a mistake just happened (for cell-shake animation).
  lastMistakeIndex: number | null;
  lastMistakeAt: number; // Date.now() of last mistake
  // Hint flash — cell that was just filled by a hint.
  lastHintIndex: number | null;
  lastHintAt: number;
  // Completion celebration — cells that just became part of a newly-completed
  // row / column / 3x3 box. Drives a celebratory animation.
  completedAnimCells: Set<number>;
  completedAnimAt: number;

  history: HistoryEntry[];

  // Preview of a saved game (for the Continue button on the home screen).
  // Populated on mount by loadSavedGame(); cleared when the game ends or is reset.
  savedGamePreview: SavedGamePreview | null;

  // Actions
  startGame: (difficulty: Difficulty) => void;
  selectCell: (index: number | null) => void;
  toggleNotesMode: () => void;
  inputNumber: (value: number) => void;
  erase: () => void;
  undo: () => void;
  useHint: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
  goHome: () => void;
  // Load a saved game from localStorage (sets savedGamePreview, does NOT auto-resume).
  loadSavedGame: () => void;
  // Restore the full saved game and resume play.
  resumeSavedGame: () => void;
}

const MAX_HINTS = 3;
const MAX_MISTAKES = 3;

function emptyNotes(): CellNotes[] {
  return Array.from({ length: 81 }, () => new Set<number>());
}

function cloneNotes(notes: CellNotes[]): CellNotes[] {
  return notes.map((n) => new Set(n));
}

/**
 * Given the board before and after a move, return the set of cells that are
 * part of a row / column / 3x3 box which became fully-correct as a result of
 * the move (i.e. was not complete before, is complete now).
 */
function newlyCompletedCells(
  boardBefore: Board,
  boardAfter: Board,
  solution: Board,
): Set<number> {
  const before = getCompletedUnitCells(boardBefore, solution);
  const after = getCompletedUnitCells(boardAfter, solution);
  const result = new Set<number>();
  for (const i of after) {
    if (!before.has(i)) result.add(i);
  }
  return result;
}

export const useSudokuStore = create<SudokuState>((set, get) => ({
  status: "idle",
  difficulty: "easy",
  puzzle: [...EMPTY_BOARD],
  solution: [...EMPTY_BOARD],
  board: [...EMPTY_BOARD],
  notes: emptyNotes(),
  selected: null,
  notesMode: false,
  hintsLeft: MAX_HINTS,
  mistakes: 0,
  maxMistakes: MAX_MISTAKES,
  score: 0,
  elapsedSec: 0,
  lastMistakeIndex: null,
  lastMistakeAt: 0,
  lastHintIndex: null,
  lastHintAt: 0,
  completedAnimCells: new Set<number>(),
  completedAnimAt: 0,
  history: [],
  savedGamePreview: null,

  startGame: (difficulty) => {
    const { puzzle, solution } = generatePuzzle(difficulty);
    set({
      status: "playing",
      difficulty,
      puzzle,
      solution,
      board: [...puzzle],
      notes: emptyNotes(),
      selected: null,
      notesMode: false,
      hintsLeft: MAX_HINTS,
      mistakes: 0,
      maxMistakes: MAX_MISTAKES,
      score: 0,
      elapsedSec: 0,
      lastMistakeIndex: null,
      lastMistakeAt: 0,
      lastHintIndex: null,
      lastHintAt: 0,
      completedAnimCells: new Set<number>(),
      completedAnimAt: 0,
      history: [],
      savedGamePreview: null,
    });
    saveGame(get());
  },

  selectCell: (index) => {
    if (get().status !== "playing") return;
    set({ selected: index });
  },

  toggleNotesMode: () => {
    if (get().status !== "playing") return;
    set((s) => ({ notesMode: !s.notesMode }));
  },

  inputNumber: (value) => {
    const state = get();
    if (state.status !== "playing") return;
    const sel = state.selected;
    if (sel === null) return;
    // Can't edit a given cell.
    if (state.puzzle[sel] !== 0) return;

    const prevValue = state.board[sel];
    const prevNotes = state.notes[sel];

    if (state.notesMode) {
      // Can't add notes to a cell that already has a value.
      if (state.board[sel] !== 0) return;
      // Toggle the note.
      const nextNotes = new Set(prevNotes);
      if (nextNotes.has(value)) nextNotes.delete(value);
      else nextNotes.add(value);
      const newNotes = cloneNotes(state.notes);
      newNotes[sel] = nextNotes;
      const history: HistoryEntry[] = [
        ...state.history,
        {
          index: sel,
          prevValue: 0,
          nextValue: 0,
          prevNotes: new Set(prevNotes),
          nextNotes: new Set(nextNotes),
          wasGiven: false,
        },
      ];
      set({ notes: newNotes, history });
      saveGame(get());
      return;
    }

    // Normal mode: setting a value.
    // If the value is the same as current, treat as no-op (or clear).
    if (prevValue === value) {
      // Erase the value.
      const newBoard = [...state.board];
      newBoard[sel] = 0;
      const history: HistoryEntry[] = [
        ...state.history,
        {
          index: sel,
          prevValue,
          nextValue: 0,
          prevNotes: new Set(prevNotes),
          nextNotes: new Set(),
          wasGiven: false,
        },
      ];
      set({ board: newBoard, history });
      saveGame(get());
      return;
    }

    const newBoard = [...state.board];
    newBoard[sel] = value;
    // Clear notes on this cell.
    const newNotes = cloneNotes(state.notes);
    newNotes[sel] = new Set();
    // Also clear this number from notes of peers (sudoku convention).
    const peersOfSel = peerIndicesFor(sel);
    for (const p of peersOfSel) {
      if (newNotes[p].has(value)) {
        newNotes[p] = new Set(newNotes[p]);
        newNotes[p].delete(value);
      }
    }

    // Score: +10 for placing the right value.
    const correct = value === state.solution[sel];
    const isMistake = !correct;

    const newScore = correct ? state.score + 10 : state.score;
    const newMistakes = isMistake ? state.mistakes + 1 : state.mistakes;
    const newLastMistake = isMistake ? sel : state.lastMistakeIndex;
    const newLastMistakeAt = isMistake ? Date.now() : state.lastMistakeAt;

    const history: HistoryEntry[] = [
      ...state.history,
      {
        index: sel,
        prevValue,
        nextValue: value,
        prevNotes: new Set(prevNotes),
        nextNotes: new Set(),
        wasGiven: false,
      },
    ];

    // Determine new status: win, lose, or still playing.
    let newStatus: GameStatus = "playing";
    if (newMistakes >= state.maxMistakes) {
      newStatus = "lost";
    } else if (isBoardComplete(newBoard, state.solution)) {
      newStatus = "won";
    }

    // Detect newly-completed row / column / 3x3 box for celebration animation.
    // Only trigger on a CORRECT placement (wrong placements can't complete a unit).
    const newCompleted = correct
      ? newlyCompletedCells(state.board, newBoard, state.solution)
      : new Set<number>();

    set({
      board: newBoard,
      notes: newNotes,
      score: newScore,
      mistakes: newMistakes,
      lastMistakeIndex: newLastMistake,
      lastMistakeAt: newLastMistakeAt,
      history,
      status: newStatus,
      completedAnimCells: newCompleted,
      completedAnimAt: newCompleted.size > 0 ? Date.now() : state.completedAnimAt,
    });
    // Persist or clear depending on whether the game ended.
    if (newStatus === "won" || newStatus === "lost") {
      clearSavedGame();
      set({ savedGamePreview: null });
    } else {
      saveGame(get());
    }
  },

  erase: () => {
    const state = get();
    if (state.status !== "playing") return;
    const sel = state.selected;
    if (sel === null) return;
    if (state.puzzle[sel] !== 0) return;
    const prevValue = state.board[sel];
    const prevNotes = state.notes[sel];
    if (prevValue === 0 && prevNotes.size === 0) return;

    const newBoard = [...state.board];
    newBoard[sel] = 0;
    const newNotes = cloneNotes(state.notes);
    newNotes[sel] = new Set();
    const history: HistoryEntry[] = [
      ...state.history,
      {
        index: sel,
        prevValue,
        nextValue: 0,
        prevNotes: new Set(prevNotes),
        nextNotes: new Set(),
        wasGiven: false,
      },
    ];
    set({ board: newBoard, notes: newNotes, history });
    saveGame(get());
  },

  undo: () => {
    const state = get();
    if (state.status !== "playing") return;
    if (state.history.length === 0) return;
    const history = [...state.history];
    const last = history.pop()!;
    const newBoard = [...state.board];
    newBoard[last.index] = last.prevValue;
    const newNotes = cloneNotes(state.notes);
    newNotes[last.index] = new Set(last.prevNotes ?? []);
    set({ board: newBoard, notes: newNotes, history });
    saveGame(get());
  },

  useHint: () => {
    const state = get();
    if (state.status !== "playing") return;
    if (state.hintsLeft <= 0) return;

    // Prefer the currently selected cell if it's empty; otherwise pick a random empty cell.
    let index: number;
    if (
      state.selected !== null &&
      state.board[state.selected] === 0 &&
      state.puzzle[state.selected] === 0 // not already a given/hinted cell
    ) {
      index = state.selected;
    } else {
      const hint = getHint(state.board, state.solution);
      if (!hint) return;
      index = hint.index;
    }
    const value = state.solution[index];

    const newBoard = [...state.board];
    newBoard[index] = value;
    // Mark this cell as a "given" by adding it to the puzzle array.
    // This makes it: black text, non-editable, and excluded from undo history.
    const newPuzzle = [...state.puzzle];
    newPuzzle[index] = value;
    const newNotes = cloneNotes(state.notes);
    newNotes[index] = new Set();
    // No history entry — hinted cells are permanent and cannot be undone.

    const newScore = state.score + 5; // smaller bonus for hints
    let newStatus: GameStatus = "playing";
    if (isBoardComplete(newBoard, state.solution)) newStatus = "won";

    // Detect newly-completed row / column / 3x3 box for celebration animation.
    const newCompleted = newlyCompletedCells(state.board, newBoard, state.solution);

    set({
      board: newBoard,
      puzzle: newPuzzle,
      notes: newNotes,
      hintsLeft: state.hintsLeft - 1,
      score: newScore,
      lastHintIndex: index,
      lastHintAt: Date.now(),
      selected: index,
      status: newStatus,
      completedAnimCells: newCompleted,
      completedAnimAt: newCompleted.size > 0 ? Date.now() : state.completedAnimAt,
    });
    if (newStatus === "won") {
      clearSavedGame();
      set({ savedGamePreview: null });
    } else {
      saveGame(get());
    }
  },

  pause: () => {
    if (get().status === "playing") {
      set({ status: "paused" });
      saveGame(get());
    }
  },
  resume: () => {
    if (get().status === "paused") {
      set({ status: "playing" });
      saveGame(get());
    }
  },
  tick: () => {
    if (get().status === "playing") {
      set((s) => ({ elapsedSec: s.elapsedSec + 1 }));
      saveGame(get());
    }
  },
  reset: () => {
    clearSavedGame();
    set({
      status: "idle",
      puzzle: [...EMPTY_BOARD],
      solution: [...EMPTY_BOARD],
      board: [...EMPTY_BOARD],
      notes: emptyNotes(),
      selected: null,
      notesMode: false,
      hintsLeft: MAX_HINTS,
      mistakes: 0,
      score: 0,
      elapsedSec: 0,
      lastMistakeIndex: null,
      lastMistakeAt: 0,
      lastHintIndex: null,
      lastHintAt: 0,
      completedAnimCells: new Set<number>(),
      completedAnimAt: 0,
      history: [],
      savedGamePreview: null,
    });
  },

  // Alias for reset — returns to the home screen.
  goHome: () => {
    get().reset();
  },

  // Load a saved game from localStorage and populate savedGamePreview
  // (for the Continue button). Does NOT auto-resume the game.
  loadSavedGame: () => {
    const saved = loadSavedGame();
    if (saved && (saved.status === "playing" || saved.status === "paused")) {
      set({ savedGamePreview: toPreview(saved) });
    } else {
      set({ savedGamePreview: null });
    }
  },

  // Restore the full saved game and resume play.
  resumeSavedGame: () => {
    const saved = loadSavedGame();
    if (!saved) {
      set({ savedGamePreview: null });
      return;
    }
    // Reconstruct notes from arrays.
    const notes: CellNotes[] = saved.notes.map((arr) => new Set<number>(arr));
    // Reconstruct history from arrays.
    const history: HistoryEntry[] = saved.history.map((h) => ({
      index: h.index,
      prevValue: h.prevValue,
      nextValue: h.nextValue,
      prevNotes: new Set<number>(h.prevNotes ?? []),
      nextNotes: new Set<number>(h.nextNotes ?? []),
      wasGiven: h.wasGiven,
    }));
    set({
      status: "playing", // always resume in playing state
      difficulty: saved.difficulty,
      puzzle: [...saved.puzzle],
      solution: [...saved.solution],
      board: [...saved.board],
      notes,
      selected: saved.selected,
      notesMode: saved.notesMode,
      hintsLeft: saved.hintsLeft,
      mistakes: saved.mistakes,
      maxMistakes: saved.maxMistakes,
      score: saved.score,
      elapsedSec: saved.elapsedSec,
      lastMistakeIndex: null,
      lastMistakeAt: 0,
      lastHintIndex: null,
      lastHintAt: 0,
      completedAnimCells: new Set<number>(),
      completedAnimAt: 0,
      history,
      savedGamePreview: null,
    });
    saveGame(get());
  },
}));

/* ----------------------------- selectors ----------------------------- */

function peerIndicesFor(index: number): number[] {
  // Import here to avoid circular import issues at module load time.
  // (PEERS is a const export from sudoku.ts.)
  // We use a local copy to avoid the import.
  const r = Math.floor(index / 9);
  const c = index % 9;
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  const peers: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (i !== c) peers.push(r * 9 + i);
    if (i !== r) peers.push(i * 9 + c);
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const pi = (boxR + i) * 9 + (boxC + j);
      if (pi !== index && !peers.includes(pi)) peers.push(pi);
    }
  }
  return peers;
}

/** Selector hook: compute the conflict set for the current board. */
export function useConflicts(): Set<number> {
  const board = useSudokuStore((s) => s.board);
  return computeAllConflicts(board);
}

/** Format seconds as MM:SS. */
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
