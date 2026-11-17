/** Per-difficulty statistics, stored in localStorage. */

import type { Difficulty } from "./sudoku";

const STATS_KEY = "sudoku-stats-v1";

export interface DifficultyStats {
  played: number;
  won: number;
  bestSec: number | null;
}

export type Stats = Record<Difficulty, DifficultyStats>;

const empty = (): DifficultyStats => ({ played: 0, won: 0, bestSec: null });

export function loadStats(): Stats {
  const base: Stats = { easy: empty(), medium: empty(), hard: empty(), expert: empty() };
  if (typeof localStorage === "undefined") return base;
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) ?? "null") as Partial<Stats> | null;
    if (parsed) for (const d of Object.keys(base) as Difficulty[]) base[d] = { ...base[d], ...parsed[d] };
  } catch {
    // ignore corrupt stats
  }
  return base;
}

/** Record a finished game. Returns whether it set a new best time. */
export function recordGame(difficulty: Difficulty, won: boolean, sec: number): boolean {
  const stats = loadStats();
  const s = stats[difficulty];
  s.played++;
  let newBest = false;
  if (won) {
    s.won++;
    if (s.bestSec === null || sec < s.bestSec) {
      newBest = true;
      s.bestSec = sec;
    }
  }
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
  return newBest;
}
