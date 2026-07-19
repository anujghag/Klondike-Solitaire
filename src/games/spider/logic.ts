import { Card, Suit } from '../../types';
import { buildDeck, shuffle } from '../shared/cards';

export type SpiderSuits = 1 | 2 | 4;

export interface SpiderState {
  tableaus: Card[][];       // 10 columns
  stock: Card[];            // 50 cards, dealt 10 at a time
  completedRuns: Suit[];    // suits of the 8 completed K→A runs
  score: number;
  moves: number;
  time: number;
}

const SUIT_SETS: Record<SpiderSuits, Suit[]> = {
  1: ['spades'],
  2: ['spades', 'hearts'],
  4: ['hearts', 'diamonds', 'clubs', 'spades'],
};

export function dealSpider(suitCount: SpiderSuits, seed?: number): SpiderState {
  const deck = shuffle(buildDeck({ decks: 2, suits: SUIT_SETS[suitCount] }), seed);
  const tableaus: Card[][] = Array.from({ length: 10 }, () => []);
  // Columns 0-3 get 6 cards, columns 4-9 get 5 cards (54 total).
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let row = 0; row < count; row++) {
      const card = deck.pop()!;
      card.isFaceUp = row === count - 1;
      tableaus[col].push(card);
    }
  }
  return { tableaus, stock: deck, completedRuns: [], score: 500, moves: 0, time: 0 };
}

/** A run starting at `index` is movable if it's face-up, same suit, descending by 1. */
export function canPickUpRun(tableau: Card[], index: number): boolean {
  if (index < 0 || index >= tableau.length) return false;
  if (!tableau[index].isFaceUp) return false;
  for (let i = index; i < tableau.length - 1; i++) {
    const a = tableau[i], b = tableau[i + 1];
    if (a.suit !== b.suit || a.value !== b.value + 1) return false;
  }
  return true;
}

/** Any descending-by-1 card can land on any suit; empty columns take anything. */
export function canDropOn(movingTop: Card, target: Card[]): boolean {
  if (target.length === 0) return true;
  const top = target[target.length - 1];
  return top.isFaceUp && top.value === movingTop.value + 1;
}

export function canDealFromStock(state: SpiderState): { ok: boolean; reason?: string } {
  if (state.stock.length === 0) return { ok: false, reason: 'Stock is empty' };
  if (state.tableaus.some(t => t.length === 0)) {
    return { ok: false, reason: 'Every column needs at least one card before dealing' };
  }
  return { ok: true };
}

/** Immutably move the run at tableaus[from][index..] onto tableaus[to]. */
export function applySpiderMove(state: SpiderState, from: number, index: number, to: number): SpiderState {
  const tableaus = state.tableaus.map(t => [...t]);
  const moving = tableaus[from].splice(index);
  tableaus[to].push(...moving);
  // Reveal the newly exposed card.
  const src = tableaus[from];
  let revealed = false;
  if (src.length > 0 && !src[src.length - 1].isFaceUp) {
    src[src.length - 1] = { ...src[src.length - 1], isFaceUp: true };
    revealed = true;
  }
  let next: SpiderState = {
    ...state,
    tableaus,
    moves: state.moves + 1,
    score: Math.max(0, state.score - 1) + (revealed ? 5 : 0),
  };
  next = sweepCompletedRuns(next);
  return next;
}

export function applySpiderDeal(state: SpiderState): SpiderState {
  const stock = [...state.stock];
  const tableaus = state.tableaus.map(t => [...t]);
  for (let col = 0; col < 10 && stock.length > 0; col++) {
    const card = { ...stock.pop()!, isFaceUp: true };
    tableaus[col].push(card);
  }
  return sweepCompletedRuns({ ...state, stock, tableaus, moves: state.moves + 1 });
}

/** Remove any full K→A same-suit run from the ends of columns. */
export function sweepCompletedRuns(state: SpiderState): SpiderState {
  const tableaus = state.tableaus.map(t => [...t]);
  const completedRuns = [...state.completedRuns];
  let score = state.score;
  for (let col = 0; col < 10; col++) {
    const t = tableaus[col];
    if (t.length < 13) continue;
    const start = t.length - 13;
    if (t[start].value !== 13) continue;
    if (!canPickUpRun(t, start)) continue;
    // canPickUpRun guarantees same-suit descending; starting at K means it ends at A.
    completedRuns.push(t[start].suit);
    t.splice(start);
    score += 100;
    if (t.length > 0 && !t[t.length - 1].isFaceUp) {
      t[t.length - 1] = { ...t[t.length - 1], isFaceUp: true };
    }
  }
  return { ...state, tableaus, completedRuns, score };
}

export function isSpiderWon(state: SpiderState): boolean {
  return state.completedRuns.length === 8;
}

export interface SpiderHint {
  from: number;
  index: number;
  to: number;
}

/** Prefer same-suit joins (they build removable runs), then reveals, then anything legal. */
export function getSpiderHint(state: SpiderState): SpiderHint | null {
  const candidates: Array<SpiderHint & { priority: number }> = [];
  for (let from = 0; from < 10; from++) {
    const t = state.tableaus[from];
    for (let index = 0; index < t.length; index++) {
      if (!canPickUpRun(t, index)) continue;
      for (let to = 0; to < 10; to++) {
        if (to === from) continue;
        if (!canDropOn(t[index], state.tableaus[to])) continue;
        const target = state.tableaus[to];
        const sameSuit = target.length > 0 && target[target.length - 1].suit === t[index].suit;
        const reveals = index > 0 && !t[index - 1].isFaceUp;
        const toEmpty = target.length === 0;
        // Skip pointless empty→empty king shuffles.
        if (toEmpty && index === 0) continue;
        candidates.push({ from, index, to, priority: (sameSuit ? 4 : 0) + (reveals ? 2 : 0) + (toEmpty ? -1 : 0) });
      }
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.priority - a.priority);
  return { from: candidates[0].from, index: candidates[0].index, to: candidates[0].to };
}

/** Dead when no tableau move exists and the stock can't legally be dealt. */
export function isSpiderStuck(state: SpiderState): boolean {
  if (getSpiderHint(state)) return false;
  return !canDealFromStock(state).ok;
}
