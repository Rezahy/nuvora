/**
 * Zustand store for the Sudoku game.
 */

import { create } from "zustand";
import {
  type Board,
  type Difficulty,
  type Hint,
  generatePuzzle,
  findHint,
  isBoardComplete,
  completionWave,
  fullBoardWave,
  rowOf,
  colOf,
  PEERS,
  EMPTY_BOARD,
} from "@/lib/sudoku";
import {
  saveGame,
  loadSavedGame,
  clearSavedGame,
  toPreview,
  type SavedGamePreview,
} from "@/lib/sudoku-persist";
import { recordGame } from "@/lib/sudoku-stats";

export type CellNotes = Set<number>;

export type GameStatus = "idle" | "playing" | "paused" | "won" | "lost";

export interface HistoryEntry {
  index: number;
  prevValue: number;
  nextValue: number;
  prevNotes?: CellNotes;
  nextNotes?: CellNotes;
  /** Peers whose note for `nextValue` was auto-removed by this move (restored on undo). */
  peerNotesRemoved?: number[];
  wasGiven: boolean;
}

/** A ripple animation over the cells of newly completed rows / columns / boxes. */
export interface CompletionAnim {
  at: number; // 0 = none yet
  delays: number[]; // per cell: -1 = not animated, otherwise ripple step
}

export interface SudokuState {
  status: GameStatus;
  difficulty: Difficulty;

  /** The puzzle as given to the player (never changes during a game). */
  puzzle: Board;
  /** The fully solved board (for hints & win check). */
  solution: Board;
  /** The current board state (includes user input). */
  board: Board;
  /** Per-cell pencil marks. */
  notes: CellNotes[];

  selected: number | null;
  notesMode: boolean;
  hintsLeft: number;
  mistakes: number;
  maxMistakes: number;
  score: number;
  elapsedSec: number;

  /** Cell + timestamp of the latest mistake (drives the shake). */
  lastMistakeIndex: number | null;
  lastMistakeAt: number;
  /** Cell + timestamp of the latest hint (drives the flash). */
  lastHintIndex: number | null;
  lastHintAt: number;
  /** Explanation shown after a hint. */
  hintMessage: string | null;
  /** Row / column / box completion ripple. */
  completion: CompletionAnim;
  /** Set when a win beats the best time for this difficulty. */
  newBest: boolean;

  history: HistoryEntry[];

  /** Preview of a saved game (for the Continue button on the home screen). */
  savedGamePreview: SavedGamePreview | null;

  // Actions
  startGame: (difficulty: Difficulty) => void;
  selectCell: (index: number | null) => void;
  toggleNotesMode: () => void;
  inputNumber: (value: number) => void;
  erase: () => void;
  undo: () => void;
  useHint: () => void;
  dismissHintMessage: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  /** Abandon the current game and return home (clears the save). */
  reset: () => void;
  /** Return home, keeping an unfinished game saved for "Continue". */
  goHome: () => void;
  /** After losing: forgive the last mistake and keep playing. */
  secondChance: () => void;
  loadSavedGame: () => void;
  resumeSavedGame: () => void;
}

const MAX_HINTS = 3;
const MAX_MISTAKES = 3;
const NO_COMPLETION: CompletionAnim = { at: 0, delays: new Array(81).fill(-1) };

function emptyNotes(): CellNotes[] {
  return Array.from({ length: 81 }, () => new Set<number>());
}

function cloneNotes(notes: CellNotes[]): CellNotes[] {
  return notes.map((n) => new Set(n));
}

/** A cell the player can no longer change: a given, or a correctly solved cell. */
export function isLockedCell(s: Pick<SudokuState, "puzzle" | "board" | "solution">, i: number): boolean {
  return s.puzzle[i] !== 0 || (s.board[i] !== 0 && s.board[i] === s.solution[i]);
}

/** Remove `value` from the notes of every peer of `index`; returns the peers changed. */
function clearPeerNotes(notes: CellNotes[], index: number, value: number): number[] {
  const changed: number[] = [];
  for (const p of PEERS[index]) {
    if (notes[p].has(value)) {
      notes[p].delete(value);
      changed.push(p);
    }
  }
  return changed;
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // unsupported
  }
}

function hintText(h: Hint): string {
  const where = `row ${rowOf(h.index) + 1}, column ${colOf(h.index) + 1}`;
  switch (h.reason) {
    case "mistake":
      return `That cell had a mistake. The correct number is ${h.value}.`;
    case "naked-single":
      return `Only ${h.value} fits in ${where}: every other number is already in its row, column or box.`;
    case "hidden-single":
      return `${h.value} has only one possible place in this ${h.unit}.`;
    default:
      return `The number in ${where} is ${h.value}.`;
  }
}

const freshGameFields = {
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
  hintMessage: null,
  completion: NO_COMPLETION,
  newBest: false,
  history: [],
} satisfies Partial<SudokuState>;

export const useSudokuStore = create<SudokuState>((set, get) => {
  /** Persist, or record stats and clear the save when the game just ended. */
  const afterMove = () => {
    const s = get();
    if (s.status === "won" || s.status === "lost") {
      clearSavedGame();
      const newBest = recordGame(s.difficulty, s.status === "won", s.elapsedSec);
      set({ savedGamePreview: null, newBest });
    } else {
      saveGame(s);
    }
  };

  return {
    status: "idle",
    difficulty: "easy",
    puzzle: [...EMPTY_BOARD],
    solution: [...EMPTY_BOARD],
    board: [...EMPTY_BOARD],
    ...freshGameFields,
    savedGamePreview: null,

    startGame: (difficulty) => {
      const { puzzle, solution } = generatePuzzle(difficulty);
      set({
        ...freshGameFields,
        notes: emptyNotes(),
        status: "playing",
        difficulty,
        puzzle,
        solution,
        board: [...puzzle],
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
      const s = get();
      if (s.status !== "playing" || s.selected === null) return;
      const sel = s.selected;
      if (isLockedCell(s, sel)) return;

      const prevValue = s.board[sel];
      const prevNotes = s.notes[sel];

      if (s.notesMode) {
        if (prevValue !== 0) return; // a cell holding a value has no notes
        const nextNotes = new Set(prevNotes);
        if (nextNotes.has(value)) nextNotes.delete(value);
        else nextNotes.add(value);
        const notes = cloneNotes(s.notes);
        notes[sel] = nextNotes;
        set({
          notes,
          history: [
            ...s.history,
            { index: sel, prevValue: 0, nextValue: 0, prevNotes: new Set(prevNotes), nextNotes: new Set(nextNotes), wasGiven: false },
          ],
        });
        saveGame(get());
        return;
      }

      if (prevValue === value) return; // same wrong number again: nothing to do

      const board = [...s.board];
      board[sel] = value;
      const notes = cloneNotes(s.notes);
      notes[sel] = new Set();

      const correct = value === s.solution[sel];
      // Only a correct number clears peer notes, so a mistake can't wipe pencil marks.
      const peerNotesRemoved = correct ? clearPeerNotes(notes, sel, value) : [];
      const mistakes = correct ? s.mistakes : s.mistakes + 1;

      let status: GameStatus = "playing";
      if (mistakes >= s.maxMistakes) status = "lost";
      else if (isBoardComplete(board, s.solution)) status = "won";

      const now = Date.now();
      const delays =
        status === "won" ? fullBoardWave(sel) : correct ? completionWave(s.board, board, s.solution, sel) : null;

      if (!correct) vibrate(80);

      set({
        board,
        notes,
        score: correct ? s.score + 10 : s.score,
        mistakes,
        lastMistakeIndex: correct ? s.lastMistakeIndex : sel,
        lastMistakeAt: correct ? s.lastMistakeAt : now,
        hintMessage: null,
        status,
        // Only replace the ripple when a new one starts, so a quick next move
        // never cuts off an animation that is still playing.
        completion: delays ? { at: now, delays } : s.completion,
        history: [
          ...s.history,
          {
            index: sel,
            prevValue,
            nextValue: value,
            prevNotes: new Set(prevNotes),
            nextNotes: new Set(),
            peerNotesRemoved,
            wasGiven: false,
          },
        ],
      });
      afterMove();
    },

    erase: () => {
      const s = get();
      if (s.status !== "playing" || s.selected === null) return;
      const sel = s.selected;
      if (isLockedCell(s, sel)) return;
      const prevValue = s.board[sel];
      const prevNotes = s.notes[sel];
      if (prevValue === 0 && prevNotes.size === 0) return;

      const board = [...s.board];
      board[sel] = 0;
      const notes = cloneNotes(s.notes);
      notes[sel] = new Set();
      set({
        board,
        notes,
        history: [
          ...s.history,
          { index: sel, prevValue, nextValue: 0, prevNotes: new Set(prevNotes), nextNotes: new Set(), wasGiven: false },
        ],
      });
      saveGame(get());
    },

    undo: () => {
      const s = get();
      if (s.status !== "playing" || s.history.length === 0) return;
      const history = [...s.history];
      const last = history.pop()!;
      const board = [...s.board];
      board[last.index] = last.prevValue;
      const notes = cloneNotes(s.notes);
      notes[last.index] = new Set(last.prevNotes ?? []);
      for (const p of last.peerNotesRemoved ?? []) notes[p].add(last.nextValue);
      set({ board, notes, history, selected: last.index, hintMessage: null });
      saveGame(get());
    },

    useHint: () => {
      const s = get();
      if (s.status !== "playing" || s.hintsLeft <= 0) return;
      const hint = findHint(s.board, s.solution, s.selected);
      if (!hint) return;
      const { index, value } = hint;

      const board = [...s.board];
      board[index] = value;
      const notes = cloneNotes(s.notes);
      notes[index] = new Set();
      clearPeerNotes(notes, index, value);

      const status: GameStatus = isBoardComplete(board, s.solution) ? "won" : "playing";
      const now = Date.now();
      const delays = status === "won" ? fullBoardWave(index) : completionWave(s.board, board, s.solution, index);

      set({
        board,
        notes,
        hintsLeft: s.hintsLeft - 1,
        lastHintIndex: index,
        lastHintAt: now,
        hintMessage: hintText(hint),
        selected: index,
        status,
        completion: delays ? { at: now, delays } : s.completion,
        // A revealed cell is final: drop older moves on it so undo can't overwrite it.
        history: s.history.filter((h) => h.index !== index),
      });
      afterMove();
    },

    dismissHintMessage: () => set({ hintMessage: null }),

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
        ...freshGameFields,
        notes: emptyNotes(),
        status: "idle",
        puzzle: [...EMPTY_BOARD],
        solution: [...EMPTY_BOARD],
        board: [...EMPTY_BOARD],
        savedGamePreview: null,
      });
    },

    goHome: () => {
      const s = get();
      if (s.status === "playing" || s.status === "paused") {
        saveGame({ ...s, status: "paused" });
        set({ status: "idle", hintMessage: null, savedGamePreview: { difficulty: s.difficulty, elapsedSec: s.elapsedSec, mistakes: s.mistakes } });
      } else {
        get().reset();
      }
    },

    secondChance: () => {
      const s = get();
      if (s.status !== "lost") return;
      const board = [...s.board];
      const i = s.lastMistakeIndex;
      if (i !== null && board[i] !== s.solution[i]) board[i] = 0;
      set({ status: "playing", board, mistakes: s.maxMistakes - 1, selected: i });
      saveGame(get());
    },

    loadSavedGame: () => {
      const saved = loadSavedGame();
      set({
        savedGamePreview:
          saved && (saved.status === "playing" || saved.status === "paused") ? toPreview(saved) : null,
      });
    },

    resumeSavedGame: () => {
      const saved = loadSavedGame();
      if (!saved) {
        set({ savedGamePreview: null });
        return;
      }
      set({
        ...freshGameFields,
        status: "playing",
        difficulty: saved.difficulty,
        puzzle: [...saved.puzzle],
        solution: [...saved.solution],
        board: [...saved.board],
        notes: saved.notes.map((arr) => new Set<number>(arr)),
        selected: saved.selected,
        notesMode: saved.notesMode,
        hintsLeft: saved.hintsLeft,
        mistakes: saved.mistakes,
        maxMistakes: saved.maxMistakes,
        score: saved.score,
        elapsedSec: saved.elapsedSec,
        history: saved.history.map((h) => ({
          index: h.index,
          prevValue: h.prevValue,
          nextValue: h.nextValue,
          prevNotes: new Set<number>(h.prevNotes ?? []),
          nextNotes: new Set<number>(h.nextNotes ?? []),
          peerNotesRemoved: h.peerNotesRemoved ?? [],
          wasGiven: h.wasGiven,
        })),
        savedGamePreview: null,
      });
      saveGame(get());
    },
  };
});

/** Format seconds as MM:SS (or H:MM:SS past an hour). */
export function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}
