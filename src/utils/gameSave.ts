import { GameId, GameRecord, MultiGameStats } from '../types';

/**
 * Local persistence for the multi-game hub: in-progress game saves
 * (the #1 app-store request — never lose a game to an app restart)
 * and per-game lifetime stats. Everything lives in localStorage so the
 * app is fully offline.
 */

const SAVE_PREFIX = 'cardsave_';
const STATS_KEY = 'multigame_stats';

export function saveInProgress<T>(game: GameId, state: T): void {
  try {
    localStorage.setItem(SAVE_PREFIX + game, JSON.stringify({ savedAt: Date.now(), state }));
  } catch {
    // Storage full/unavailable — playing without saves is fine.
  }
}

export function loadInProgress<T>(game: GameId): T | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + game);
    if (!raw) return null;
    return (JSON.parse(raw) as { state: T }).state;
  } catch {
    return null;
  }
}

export function clearInProgress(game: GameId): void {
  localStorage.removeItem(SAVE_PREFIX + game);
}

export function hasInProgress(game: GameId): boolean {
  return localStorage.getItem(SAVE_PREFIX + game) !== null;
}

const EMPTY_RECORD: GameRecord = { games: 0, wins: 0, bestScore: 0, bestTime: 0, special: 0 };

export function loadMultiGameStats(): MultiGameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as MultiGameStats) : {};
  } catch {
    return {};
  }
}

export function recordGameResult(
  game: GameId,
  result: { won: boolean; score?: number; time?: number; special?: boolean },
): MultiGameStats {
  const stats = loadMultiGameStats();
  const rec: GameRecord = { ...EMPTY_RECORD, ...stats[game] };
  rec.games += 1;
  if (result.won) {
    rec.wins += 1;
    if (result.score !== undefined) rec.bestScore = Math.max(rec.bestScore, result.score);
    if (result.time !== undefined) rec.bestTime = rec.bestTime === 0 ? result.time : Math.min(rec.bestTime, result.time);
    if (result.special) rec.special += 1;
  }
  const next = { ...stats, [game]: rec };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
