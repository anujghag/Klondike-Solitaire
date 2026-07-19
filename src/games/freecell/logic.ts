import { Card } from '../../types';
import { buildDeck, shuffle } from '../shared/cards';

export interface FreeCellState {
  cascades: Card[][];            // 8 columns, all face up
  freeCells: (Card | null)[];    // 4 cells
  foundations: Card[][];         // 4 piles by suit (any order)
  moves: number;
  time: number;
}

export function dealFreeCell(seed?: number): FreeCellState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const cascades: Card[][] = Array.from({ length: 8 }, () => []);
  deck.forEach((card, i) => cascades[i % 8].push(card));
  return {
    cascades,
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves: 0,
    time: 0,
  };
}

/** Alternating color, descending by one. */
export function canStackOn(card: Card, target: Card[]): boolean {
  if (target.length === 0) return true;
  const top = target[target.length - 1];
  return card.color !== top.color && card.value === top.value - 1;
}

export function canMoveToFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.value === 1;
  const top = foundation[foundation.length - 1];
  return card.suit === top.suit && card.value === top.value + 1;
}

/** The run at cascades[col][index..] must itself alternate colors descending. */
export function isValidRun(cascade: Card[], index: number): boolean {
  for (let i = index; i < cascade.length - 1; i++) {
    const a = cascade[i], b = cascade[i + 1];
    if (a.color === b.color || a.value !== b.value + 1) return false;
  }
  return true;
}

/** Classic supermove capacity: (free cells + 1) × 2^(empty cascades). */
export function maxRunSize(state: FreeCellState, movingToEmpty: boolean): number {
  const free = state.freeCells.filter(c => c === null).length;
  let empties = state.cascades.filter(c => c.length === 0).length;
  if (movingToEmpty && empties > 0) empties -= 1; // the destination doesn't help
  return (free + 1) * Math.pow(2, empties);
}

export function isFreeCellWon(state: FreeCellState): boolean {
  return state.foundations.every(f => f.length === 13);
}

/** A card is "safe" to auto-send when no lower card of the opposite color still needs it. */
export function isSafeAutoMove(card: Card, state: FreeCellState): boolean {
  if (card.value <= 2) return true;
  // Lowest foundation top among the two opposite-color suits (0 when a suit hasn't started).
  const tops = state.foundations
    .filter(f => f.length > 0 && f[f.length - 1].color !== card.color)
    .map(f => f[f.length - 1].value);
  while (tops.length < 2) tops.push(0);
  return card.value <= Math.min(...tops) + 1;
}

export interface FreeCellHint {
  from: { zone: 'cascade' | 'free'; index: number; cardIndex?: number };
  to: { zone: 'cascade' | 'foundation' | 'free'; index: number };
}

export function getFreeCellHint(state: FreeCellState): FreeCellHint | null {
  // 1. Anything to foundation
  for (let i = 0; i < 8; i++) {
    const c = state.cascades[i];
    if (c.length === 0) continue;
    const card = c[c.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canMoveToFoundation(card, state.foundations[f])) {
        return { from: { zone: 'cascade', index: i, cardIndex: c.length - 1 }, to: { zone: 'foundation', index: f } };
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    const card = state.freeCells[i];
    if (!card) continue;
    for (let f = 0; f < 4; f++) {
      if (canMoveToFoundation(card, state.foundations[f])) {
        return { from: { zone: 'free', index: i }, to: { zone: 'foundation', index: f } };
      }
    }
  }
  // 2. Cascade runs onto other cascades (skip empty→empty noise)
  for (let i = 0; i < 8; i++) {
    const c = state.cascades[i];
    for (let k = 0; k < c.length; k++) {
      if (!isValidRun(c, k)) continue;
      const runLen = c.length - k;
      for (let j = 0; j < 8; j++) {
        if (i === j) continue;
        const target = state.cascades[j];
        if (!canStackOn(c[k], target)) continue;
        if (runLen > maxRunSize(state, target.length === 0)) continue;
        if (target.length === 0 && k === 0) continue;
        return { from: { zone: 'cascade', index: i, cardIndex: k }, to: { zone: 'cascade', index: j } };
      }
    }
  }
  // 3. Free cell card back onto a cascade
  for (let i = 0; i < 4; i++) {
    const card = state.freeCells[i];
    if (!card) continue;
    for (let j = 0; j < 8; j++) {
      if (state.cascades[j].length > 0 && canStackOn(card, state.cascades[j])) {
        return { from: { zone: 'free', index: i }, to: { zone: 'cascade', index: j } };
      }
    }
  }
  // 4. Last resort: park a top card in a free cell
  const freeIdx = state.freeCells.findIndex(c => c === null);
  if (freeIdx >= 0) {
    for (let i = 0; i < 8; i++) {
      if (state.cascades[i].length > 0) {
        return { from: { zone: 'cascade', index: i, cardIndex: state.cascades[i].length - 1 }, to: { zone: 'free', index: freeIdx } };
      }
    }
  }
  return null;
}

export function isFreeCellStuck(state: FreeCellState): boolean {
  // Stuck only when nothing can move at all: no foundation play, no stack, no free cell space.
  if (state.freeCells.some(c => c === null)) return false;
  for (let i = 0; i < 8; i++) {
    const c = state.cascades[i];
    if (c.length === 0) return false;
    const card = c[c.length - 1];
    for (let f = 0; f < 4; f++) if (canMoveToFoundation(card, state.foundations[f])) return false;
    for (let j = 0; j < 8; j++) if (i !== j && canStackOn(card, state.cascades[j])) return false;
  }
  for (let i = 0; i < 4; i++) {
    const card = state.freeCells[i];
    if (!card) continue;
    for (let f = 0; f < 4; f++) if (canMoveToFoundation(card, state.foundations[f])) return false;
    for (let j = 0; j < 8; j++) if (canStackOn(card, state.cascades[j])) return false;
  }
  return true;
}
