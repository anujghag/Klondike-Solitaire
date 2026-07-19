import { Card, Suit } from '../../types';
import { buildDeck, shuffle, sortHand, SUITS } from '../shared/cards';

export interface SuitTrack {
  low: number;   // lowest value played (7 when only the 7 is down)
  high: number;  // highest value played
}

export interface SevensState {
  hands: Card[][];                      // 4 players; 0 = you (South), then clockwise E, N, W
  layout: Partial<Record<Suit, SuitTrack>>;
  turn: number;
  finished: number[];                   // player indices in finish order
  passStreak: Record<number, boolean>;  // who passed on their last visit (for seat status)
  lastAction: string;                   // human-readable ticker
  gameOver: boolean;
}

export const SEVENS_PLAYERS = [
  { name: 'You', avatar: '🧑' },
  { name: 'Meera', avatar: '👩🏽' },
  { name: 'Arjun', avatar: '👨🏽' },
  { name: 'Dadi', avatar: '👵🏽' },
];

export function dealSevens(seed?: number): SevensState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const hands: Card[][] = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  const state: SevensState = {
    hands: hands.map(sortHand),
    layout: {},
    turn: 0,
    finished: [],
    passStreak: {},
    lastAction: '',
    gameOver: false,
  };
  // The holder of the 7♥ opens the game with it, per tradition.
  const opener = hands.findIndex(h => h.some(c => c.suit === 'hearts' && c.value === 7));
  const seven = state.hands[opener].find(c => c.suit === 'hearts' && c.value === 7)!;
  return playCard(state, opener, seven, true);
}

export function isPlayable(card: Card, layout: SevensState['layout']): boolean {
  if (card.value === 7) return true;
  const track = layout[card.suit];
  if (!track) return false;
  return card.value === track.low - 1 || card.value === track.high + 1;
}

export function legalMoves(state: SevensState, player: number): Card[] {
  return state.hands[player].filter(c => isPlayable(c, state.layout));
}

function nextActivePlayer(state: SevensState, from: number): number {
  let p = from;
  for (let i = 0; i < 4; i++) {
    p = (p + 1) % 4;
    if (state.hands[p].length > 0) return p;
  }
  return from;
}

export function playCard(state: SevensState, player: number, card: Card, isOpening = false): SevensState {
  const hands = state.hands.map(h => [...h]);
  hands[player] = hands[player].filter(c => c.id !== card.id);
  const layout = { ...state.layout };
  const track = layout[card.suit];
  if (card.value === 7) {
    layout[card.suit] = { low: 7, high: 7 };
  } else if (track) {
    layout[card.suit] = {
      low: Math.min(track.low, card.value),
      high: Math.max(track.high, card.value),
    };
  }

  const finished = [...state.finished];
  const name = SEVENS_PLAYERS[player].name;
  let lastAction = isOpening
    ? `${name} opened with the 7♥`
    : `${name} played ${card.rank}${suitGlyph(card.suit)}`;
  if (hands[player].length === 0 && !finished.includes(player)) {
    finished.push(player);
    lastAction = `🎉 ${name} finished #${finished.length}!`;
  }

  const next: SevensState = {
    ...state,
    hands,
    layout,
    finished,
    lastAction,
    passStreak: { ...state.passStreak, [player]: false },
  };
  const remaining = hands.filter(h => h.length > 0).length;
  if (remaining <= 1) {
    // Last player with cards comes in last.
    const loser = hands.findIndex(h => h.length > 0);
    if (loser >= 0 && !finished.includes(loser)) finished.push(loser);
    return { ...next, finished, gameOver: true, turn: -1 };
  }
  return { ...next, turn: nextActivePlayer(next, player) };
}

export function passTurn(state: SevensState, player: number): SevensState {
  return {
    ...state,
    lastAction: `${SEVENS_PLAYERS[player].name} passed`,
    passStreak: { ...state.passStreak, [player]: true },
    turn: nextActivePlayer(state, player),
  };
}

/**
 * AI: prefer the legal card that unblocks the most of its own cards
 * (cards in the same suit farther from 7), and hold back "edge" cards
 * that only help opponents.
 */
export function chooseAiCard(state: SevensState, player: number): Card | null {
  const moves = legalMoves(state, player);
  if (moves.length === 0) return null;
  const hand = state.hands[player];
  let best = moves[0];
  let bestScore = -Infinity;
  for (const card of moves) {
    const beyond = hand.filter(c =>
      c.suit === card.suit &&
      (card.value > 7 ? c.value > card.value : card.value < 7 ? c.value < card.value : c.value !== 7)
    ).length;
    // Opening a new suit with a 7 also unblocks both directions of that suit.
    const score = beyond * 2 + (card.value === 7 ? 1 : 0) - Math.abs(card.value - 7) * 0.1 + Math.random() * 0.5;
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}

function suitGlyph(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export { SUITS };
