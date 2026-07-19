import { Card } from '../../types';
import { buildDeck, shuffle } from '../shared/cards';

/**
 * TriPeaks: 28 cards in three peaks, 24-card stock. Play any uncovered card
 * that is one rank above or below the waste top (Ace wraps to both 2 and King).
 */

export interface PeakSlot {
  card: Card;
  removed: boolean;
  row: number;   // 0 = peaks, 3 = bottom row
  col: number;   // grid column in bottom-row units (0..9), fractional for upper rows
}

export interface TriPeaksState {
  slots: PeakSlot[];     // 28 board cards
  stock: Card[];
  waste: Card[];         // top = current base card
  score: number;
  streak: number;
  moves: number;
  time: number;
}

/** children[i] = indices of the two slots that must be removed before slot i is free. */
function childrenOf(index: number): number[] {
  if (index < 3) {
    // Peaks: covered by row-1 pair (2p, 2p+1) offset by 3.
    return [3 + index * 2, 3 + index * 2 + 1];
  }
  if (index < 9) {
    // Row 1 (indices 3-8): j = index-3, peak p = j>>1, row-2 children p*3 + j%2 (+1), offset 9.
    const j = index - 3;
    const p = j >> 1;
    const base = 9 + p * 3 + (j % 2);
    return [base, base + 1];
  }
  if (index < 18) {
    // Row 2 (indices 9-17): k = index-9, covered by bottom row k, k+1, offset 18.
    const k = index - 9;
    return [18 + k, 18 + k + 1];
  }
  return []; // bottom row is always free
}

/** Horizontal position (in bottom-row card units) for rendering. */
function colOf(index: number): { row: number; col: number } {
  if (index < 3) return { row: 0, col: 1.5 + index * 3 };
  if (index < 9) {
    const j = index - 3;
    const p = j >> 1;
    return { row: 1, col: 1 + p * 3 + (j % 2) };
  }
  if (index < 18) return { row: 2, col: 0.5 + (index - 9) };
  return { row: 3, col: index - 18 };
}

export function dealTriPeaks(seed?: number): TriPeaksState {
  const deck = shuffle(buildDeck(), seed);
  const slots: PeakSlot[] = [];
  for (let i = 0; i < 28; i++) {
    const card = deck.pop()!;
    card.isFaceUp = i >= 18;
    const { row, col } = colOf(i);
    slots.push({ card, removed: false, row, col });
  }
  const waste = [{ ...deck.pop()!, isFaceUp: true }];
  return { slots, stock: deck, waste, score: 0, streak: 0, moves: 0, time: 0 };
}

export function isFree(state: TriPeaksState, index: number): boolean {
  if (state.slots[index].removed) return false;
  return childrenOf(index).every(c => state.slots[c].removed);
}

export function isAdjacentRank(a: Card, b: Card): boolean {
  const diff = Math.abs(a.value - b.value);
  return diff === 1 || diff === 12; // A↔K wrap
}

export function playSlot(state: TriPeaksState, index: number): TriPeaksState {
  const slot = state.slots[index];
  const slots = state.slots.map(s => ({ ...s }));
  slots[index] = { ...slot, removed: true };
  // Reveal any newly-freed cards.
  for (let i = 0; i < 18; i++) {
    if (!slots[i].removed && childrenOf(i).every(c => slots[c].removed)) {
      slots[i] = { ...slots[i], card: { ...slots[i].card, isFaceUp: true } };
    }
  }
  const streak = state.streak + 1;
  return {
    ...state,
    slots,
    waste: [...state.waste, { ...slot.card, isFaceUp: true }],
    score: state.score + 10 * streak, // streak multiplier
    streak,
    moves: state.moves + 1,
  };
}

export function drawFromStock(state: TriPeaksState): TriPeaksState {
  if (state.stock.length === 0) return state;
  const stock = [...state.stock];
  const card = { ...stock.pop()!, isFaceUp: true };
  return { ...state, stock, waste: [...state.waste, card], streak: 0, moves: state.moves + 1 };
}

export function isTriPeaksWon(state: TriPeaksState): boolean {
  return state.slots.every(s => s.removed);
}

export function hasMoves(state: TriPeaksState): boolean {
  const top = state.waste[state.waste.length - 1];
  return state.slots.some((s, i) => !s.removed && isFree(state, i) && isAdjacentRank(s.card, top));
}

export function isTriPeaksLost(state: TriPeaksState): boolean {
  return !isTriPeaksWon(state) && state.stock.length === 0 && !hasMoves(state);
}
