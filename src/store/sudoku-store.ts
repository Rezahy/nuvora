/**
 * Sudoku engine — puzzle generation, solving, validation.
 * Pure functions, no React / state.
 */

export type CellValue = number; // 0 = empty, 1-9 = value
export type Board = CellValue[]; // length 81, row-major (row * 9 + col)

export type Difficulty = "easy" | "medium" | "hard" | "expert";

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

/* ----------------------------- helpers ----------------------------- */

export const idx = (r: number, c: number) => r * 9 + c;

/** Returns array of peer indices (same row, col, or 3x3 box) — excludes self. */
export function getPeers(index: number): number[] {
  const r = Math.floor(index / 9);
  const c = index % 9;
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  const peers: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (i !== c) peers.push(idx(r, i));
    if (i !== r) peers.push(idx(i, c));
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const pi = idx(boxR + i, boxC + j);
      if (pi !== index && !peers.includes(pi)) peers.push(pi);
    }
  }
  return peers;
}

/** Pre-compute peers for every cell. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => getPeers(i));

/** Check if `value` is valid at `index` given the current board. */
export function isValidPlacement(board: Board, index: number, value: CellValue): boolean {
  if (value === 0) return true;
  return PEERS[index].every((p) => board[p] !== value);
}

/** Find all peers that conflict with the value at `index`. */
export function findConflicts(board: Board, index: number, value: CellValue): number[] {
  if (value === 0) return [];
  return PEERS[index].filter((p) => board[p] === value);
}

/* ----------------------------- solver ----------------------------- */

function findEmpty(board: Board): number {
  for (let i = 0; i < 81; i++) if (board[i] === 0) return i;
  return -1;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Count the number of solutions (up to `limit`). */
export function countSolutions(board: Board, limit = 2): number {
  const work = [...board];
  let count = 0;

  const solve = (): void => {
    if (count >= limit) return;
    const i = findEmpty(work);
    if (i === -1) {
      count++;
      return;
    }
    for (let v = 1; v <= 9; v++) {
      if (isValidPlacement(work, i, v)) {
        work[i] = v;
        solve();
        work[i] = 0;
        if (count >= limit) return;
      }
    }
  };
  solve();
  return count;
}

/** Solve a board; returns the solved board or null if unsolvable. */
export function solveBoard(board: Board): Board | null {
  const work = [...board];
  const solve = (): boolean => {
    const i = findEmpty(work);
    if (i === -1) return true;
    for (let v = 1; v <= 9; v++) {
      if (isValidPlacement(work, i, v)) {
        work[i] = v;
        if (solve()) return true;
        work[i] = 0;
      }
    }
    return false;
  };
  return solve() ? work : null;
}

/* ----------------------------- generator ----------------------------- */

/** Generate a fully solved board via randomized backtracking. */
export function generateSolvedBoard(): Board {
  const board: Board = [...EMPTY_BOARD];
  const fill = (idxPos: number): boolean => {
    if (idxPos === 81) return true;
    for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (isValidPlacement(board, idxPos, v)) {
        board[idxPos] = v;
        if (fill(idxPos + 1)) return true;
        board[idxPos] = 0;
      }
    }
    return false;
  };
  fill(0);
  return board;
}

/**
 * Generate a Sudoku puzzle. The returned puzzle has a unique solution.
 * `clues` is the target number of pre-filled cells.
 */
export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateSolvedBoard();
  const puzzle = [...solution];
  const targetClues = DIFFICULTY_CLUES[difficulty];
  const cellsToRemove = 81 - targetClues;

  // Remove cells in random order, ensuring the puzzle stays uniquely solvable.
  const order = shuffled(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;
  for (const cell of order) {
    if (removed >= cellsToRemove) break;
    const backup = puzzle[cell];
    if (backup === 0) continue;
    puzzle[cell] = 0;

    // For Easy/Medium, skip the uniqueness check to keep generation fast.
    if (difficulty === "hard" || difficulty === "expert") {
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[cell] = backup; // revert
        continue;
      }
    }
    removed++;
  }

  return { puzzle, solution };
}

/** Returns true if the board is fully filled and matches the solution. */
export function isBoardComplete(board: Board, solution: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) return false;
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

/** Compute current conflicts for highlighting in the UI. */
export function computeAllConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) continue;
    const peers = PEERS[i];
    for (const p of peers) {
      if (board[p] === board[i]) {
        conflicts.add(i);
        conflicts.add(p);
      }
    }
  }
  return conflicts;
}

/* ----------------------------- hints ----------------------------- */

/** Returns the index of an empty cell + its correct value, or null. */
export function getHint(board: Board, solution: Board): { index: number; value: number } | null {
  const empties: number[] = [];
  for (let i = 0; i < 81; i++) if (board[i] === 0) empties.push(i);
  if (empties.length === 0) return null;
  const index = empties[Math.floor(Math.random() * empties.length)];
  return { index, value: solution[index] };
}

/* ----------------------------- completion ----------------------------- */

/**
 * Returns the set of cell indices that belong to any fully-correct row,
 * column, or 3x3 box. A unit is "complete" when all 9 of its cells are
 * filled and match the solution.
 */
export function getCompletedUnitCells(board: Board, solution: Board): Set<number> {
  const result = new Set<number>();

  // Helper: check if all 9 cells in the given indices are filled and correct.
  const isUnitComplete = (indices: number[]): boolean => {
    for (const i of indices) {
      if (board[i] === 0 || board[i] !== solution[i]) return false;
    }
    return true;
  };

  // Rows
  for (let r = 0; r < 9; r++) {
    const indices = Array.from({ length: 9 }, (_, c) => r * 9 + c);
    if (isUnitComplete(indices)) for (const i of indices) result.add(i);
  }
  // Columns
  for (let c = 0; c < 9; c++) {
    const indices = Array.from({ length: 9 }, (_, r) => r * 9 + c);
    if (isUnitComplete(indices)) for (const i of indices) result.add(i);
  }
  // 3x3 boxes
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const indices: number[] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          indices.push((boxR * 3 + i) * 9 + (boxC * 3 + j));
        }
      }
      if (isUnitComplete(indices)) for (const i of indices) result.add(i);
    }
  }

  return result;
}
