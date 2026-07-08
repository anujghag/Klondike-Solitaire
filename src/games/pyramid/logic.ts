import { Card } from '../../types';
import { buildDeck, shuffle } from '../shared/cards';

/**
 * Pyramid: 28 cards in a 7-row pyramid. Remove exposed pairs summing to 13
 * (K=13 alone, Q=12, J=11). Draw through the stock; two recycles allowed.
 */

export interface PyramidSlot {
  card: Card;
  removed: boolean;
  row: number; // 0 (top) .. 6 (base)
  col: number; // 0..row
}

export interface PyramidState {
  slots: PyramidSlot[];   // 28, row-major
  stock: Card[];
  waste: Card[];
  recycles: number;       // remaining stock recycles
  score: number;
  moves: number;
  time: number;
}

export function pyramidValue(card: Card): number {
  return card.value; // A=1 … K=13 matches the pairing math directly
}

function indexOf(row: number, col: number): number {
  return (row * (row + 1)) / 2 + col;
}

export function dealPyramid(seed?: number): PyramidState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const slots: PyramidSlot[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= row; col++) {
      slots.push({ card: deck.pop()!, removed: false, row, col });
    }
  }
  return { slots, stock: deck, waste: [], recycles: 2, score: 0, moves: 0, time: 0 };
}

export function isExposed(state: PyramidState, index: number): boolean {
  const slot = state.slots[index];
  if (slot.removed) return false;
  if (slot.row === 6) return true;
  const left = state.slots[indexOf(slot.row + 1, slot.col)];
  const right = state.slots[indexOf(slot.row + 1, slot.col + 1)];
  return left.removed && right.removed;
}

export type PyramidPick =
  | { zone: 'pyramid'; index: number }
  | { zone: 'waste' };

export function pickCard(state: PyramidState, pick: PyramidPick): Card | null {
  if (pick.zone === 'waste') return state.waste[state.waste.length - 1] ?? null;
  const slot = state.slots[pick.index];
  return slot && !slot.removed ? slot.card : null;
}

export function removePicks(state: PyramidState, picks: PyramidPick[]): PyramidState {
  const slots = state.slots.map(s => ({ ...s }));
  let waste = [...state.waste];
  for (const p of picks) {
    if (p.zone === 'pyramid') slots[p.index] = { ...slots[p.index], removed: true };
    else waste = waste.slice(0, -1);
  }
  return {
    ...state,
    slots,
    waste,
    score: state.score + 15 * picks.length,
    moves: state.moves + 1,
  };
}

export function drawPyramid(state: PyramidState): PyramidState {
  if (state.stock.length > 0) {
    const stock = [...state.stock];
    const card = stock.pop()!;
    return { ...state, stock, waste: [...state.waste, card], moves: state.moves + 1 };
  }
  if (state.recycles > 0 && state.waste.length > 0) {
    return {
      ...state,
      stock: [...state.waste].reverse(),
      waste: [],
      recycles: state.recycles - 1,
      moves: state.moves + 1,
    };
  }
  return state;
}

export function isPyramidWon(state: PyramidState): boolean {
  return state.slots.every(s => s.removed);
}

export function hasPyramidMoves(state: PyramidState): boolean {
  if (state.stock.length > 0 || (state.recycles > 0 && state.waste.length > 0)) return true;
  const exposed = state.slots
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => isExposed(state, i));
  const wasteTop = state.waste[state.waste.length - 1];
  for (const { s } of exposed) {
    if (pyramidValue(s.card) === 13) return true;
    if (wasteTop && pyramidValue(s.card) + pyramidValue(wasteTop) === 13) return true;
  }
  for (let a = 0; a < exposed.length; a++) {
    for (let b = a + 1; b < exposed.length; b++) {
      if (pyramidValue(exposed[a].s.card) + pyramidValue(exposed[b].s.card) === 13) return true;
    }
  }
  if (wasteTop && pyramidValue(wasteTop) === 13) return true;
  return false;
}

export function isPyramidLost(state: PyramidState): boolean {
  return !isPyramidWon(state) && !hasPyramidMoves(state);
}
