/**
 * Sudoku engine — puzzle generation, solving, validation, hints.
 * Pure functions, no React / state.
 */

export type CellValue = number; // 0 = empty, 1-9 = value
export type Board = CellValue[]; // length 81, row-major (row * 9 + col)

export type Difficulty = "easy" | "medium" | "hard" | "expert";

/** Target number of givens. Generation never goes below what keeps the solution unique. */
export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 28,
  expert: 24,
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

export const EMPTY_BOARD: Board = Array(81).fill(0);

/* ----------------------------- geometry ----------------------------- */

export const idx = (r: number, c: number) => r * 9 + c;
export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** All 27 units: 9 rows, 9 columns, 9 boxes. */
export const UNITS: number[][] = (() => {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, c) => idx(r, c)));
  for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, r) => idx(r, c)));
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    units.push(Array.from({ length: 9 }, (_, k) => idx(br + Math.floor(k / 3), bc + (k % 3))));
  }
  return units;
})();

/** Peer indices (same row, column or box), excluding the cell itself. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>();
  for (const u of UNITS) if (u.includes(i)) for (const p of u) if (p !== i) set.add(p);
  return [...set];
});

export const PEER_SETS: Set<number>[] = PEERS.map((p) => new Set(p));

export function isPeer(a: number, b: number): boolean {
  return PEER_SETS[a].has(b);
}

/** Check if `value` is valid at `index` given the current board. */
export function isValidPlacement(board: Board, index: number, value: CellValue): boolean {
  if (value === 0) return true;
  return PEERS[index].every((p) => board[p] !== value);
}

/** Candidates for an empty cell, based only on the values in `board`. */
export function getCandidates(board: Board, index: number): number[] {
  if (board[index] !== 0) return [];
  const used = new Set<number>();
  for (const p of PEERS[index]) used.add(board[p]);
  const out: number[] = [];
  for (let v = 1; v <= 9; v++) if (!used.has(v)) out.push(v);
  return out;
}

/* ----------------------------- solver ----------------------------- */

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BIT = (v: number) => 1 << v;
function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

/**
 * Bitmask backtracking solver that always branches on the cell with the
 * fewest candidates. Calls `onSolution` for each solution; stop by returning true.
 */
function search(board: Board, onSolution: (b: Board) => boolean): void {
  const work = [...board];
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = work[i];
    if (!v) continue;
    const r = rowOf(i), c = colOf(i), b = boxOf(i);
    if ((rows[r] | cols[c] | boxes[b]) & BIT(v)) return; // invalid givens → no solutions
    rows[r] |= BIT(v);
    cols[c] |= BIT(v);
    boxes[b] |= BIT(v);
  }
  const FULL = 0b1111111110;

  const rec = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (work[i]) continue;
      const mask = FULL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = popcount(mask);
      if (n === 0) return false;
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n === 1) break;
      }
    }
    if (best === -1) return onSolution(work);
    const r = rowOf(best), c = colOf(best), b = boxOf(best);
    for (let v = 1; v <= 9; v++) {
      if (!(bestMask & BIT(v))) continue;
      work[best] = v;
      rows[r] |= BIT(v);
      cols[c] |= BIT(v);
      boxes[b] |= BIT(v);
      if (rec()) return true;
      work[best] = 0;
      rows[r] &= ~BIT(v);
      cols[c] &= ~BIT(v);
      boxes[b] &= ~BIT(v);
    }
    return false;
  };
  rec();
}

/** Count the number of solutions (up to `limit`). */
export function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  search(board, () => ++count >= limit);
  return count;
}

/** Solve a board; returns the solved board or null if unsolvable. */
export function solveBoard(board: Board): Board | null {
  let result: Board | null = null;
  search(board, (b) => {
    result = [...b];
    return true;
  });
  return result;
}

/* ----------------------------- generator ----------------------------- */

/** Generate a fully solved board via randomized backtracking. */
export function generateSolvedBoard(): Board {
  const board: Board = [...EMPTY_BOARD];
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (isValidPlacement(board, pos, v)) {
        board[pos] = v;
        if (fill(pos + 1)) return true;
        board[pos] = 0;
      }
    }
    return false;
  };
  fill(0);
  return board;
}

/**
 * Generate a puzzle with a UNIQUE solution, at every difficulty.
 * (A puzzle with several solutions would mark a logically valid entry as a
 * "mistake", because entries are checked against one stored solution.)
 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution = generateSolvedBoard();
  const puzzle = [...solution];
  const cellsToRemove = 81 - DIFFICULTY_CLUES[difficulty];

  let removed = 0;
  for (const cell of shuffled(Array.from({ length: 81 }, (_, i) => i))) {
    if (removed >= cellsToRemove) break;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[cell] = backup;
      continue;
    }
    removed++;
  }
  return { puzzle, solution };
}

/** Returns true if the board is fully filled and matches the solution. */
export function isBoardComplete(board: Board, solution: Board): boolean {
  for (let i = 0; i < 81; i++) if (board[i] !== solution[i]) return false;
  return true;
}

/** Cells whose value clashes with a peer holding the same value. */
export function computeAllConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) continue;
    for (const p of PEERS[i]) {
      if (board[p] === board[i]) {
        conflicts.add(i);
        conflicts.add(p);
      }
    }
  }
  return conflicts;
}

/* ----------------------------- hints ----------------------------- */

export type HintReason = "selected" | "mistake" | "naked-single" | "hidden-single" | "fallback";

export interface Hint {
  index: number;
  value: number;
  reason: HintReason;
  /** For a hidden single: the unit kind in which the value has only one place. */
  unit?: "row" | "column" | "box";
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Pick the most useful cell to reveal, like a mobile Sudoku app does:
 *  1. the selected cell, if it is empty or wrong
 *  2. a cell holding a wrong value
 *  3. a cell that has only one possible candidate (naked single)
 *  4. a value that has only one possible place in a row/column/box (hidden single)
 *  5. any unsolved cell
 * Logic is computed on the board with wrong entries removed, so mistakes never
 * mislead the hint.
 */
export function findHint(board: Board, solution: Board, selected: number | null): Hint | null {
  const unsolved: number[] = [];
  for (let i = 0; i < 81; i++) if (board[i] !== solution[i]) unsolved.push(i);
  if (unsolved.length === 0) return null;

  if (selected !== null && board[selected] !== solution[selected]) {
    return { index: selected, value: solution[selected], reason: "selected" };
  }

  const wrong = unsolved.filter((i) => board[i] !== 0);
  if (wrong.length > 0) {
    const i = pick(wrong);
    return { index: i, value: solution[i], reason: "mistake" };
  }

  const clean = board.map((v, i) => (v === solution[i] ? v : 0));

  const nakedSingles = unsolved.filter((i) => getCandidates(clean, i).length === 1);
  if (nakedSingles.length > 0) {
    const i = pick(nakedSingles);
    return { index: i, value: solution[i], reason: "naked-single" };
  }

  const hidden: Hint[] = [];
  UNITS.forEach((unit, u) => {
    const kind = u < 9 ? "row" : u < 18 ? "column" : "box";
    for (let v = 1; v <= 9; v++) {
      if (unit.some((i) => clean[i] === v)) continue;
      const spots = unit.filter((i) => clean[i] === 0 && getCandidates(clean, i).includes(v));
      if (spots.length === 1) hidden.push({ index: spots[0], value: v, reason: "hidden-single", unit: kind });
    }
  });
  if (hidden.length > 0) return pick(hidden);

  const i = pick(unsolved);
  return { index: i, value: solution[i], reason: "fallback" };
}

/* ----------------------------- completion ----------------------------- */

/** Indices of units (into UNITS) that are fully filled and correct. */
export function getCompletedUnits(board: Board, solution: Board): Set<number> {
  const done = new Set<number>();
  UNITS.forEach((unit, u) => {
    if (unit.every((i) => board[i] !== 0 && board[i] === solution[i])) done.add(u);
  });
  return done;
}

/**
 * For a move at `origin`, return a per-cell delay index (-1 = not animated)
 * for every cell in a row/column/box that the move just completed. The delay
 * grows with distance from `origin`, so the highlight ripples outward.
 */
export function completionWave(
  before: Board,
  after: Board,
  solution: Board,
  origin: number,
): number[] | null {
  const prev = getCompletedUnits(before, solution);
  const next = getCompletedUnits(after, solution);
  const delays = new Array(81).fill(-1);
  let any = false;
  const r0 = rowOf(origin), c0 = colOf(origin);
  for (const u of next) {
    if (prev.has(u)) continue;
    any = true;
    for (const i of UNITS[u]) {
      delays[i] = Math.max(Math.abs(rowOf(i) - r0), Math.abs(colOf(i) - c0));
    }
  }
  return any ? delays : null;
}

/** Whole-board ripple, used when the puzzle is solved. */
export function fullBoardWave(origin: number): number[] {
  const r0 = rowOf(origin), c0 = colOf(origin);
  return Array.from({ length: 81 }, (_, i) =>
    Math.max(Math.abs(rowOf(i) - r0), Math.abs(colOf(i) - c0)),
  );
}
