import { Card, Suit } from '../../types';
import { buildDeck, shuffle, sortHand, SUITS } from '../shared/cards';
import { mulberry32 } from '../../utils/deck';

/**
 * Mendikot (मेंढीकोट) — 4 players in fixed partnerships (You + North vs East + West).
 * Capture the four 10s: 3+ tens wins the hand, all 4 is a "Mendikot",
 * and taking all 13 tricks is a whitewash (52-card kot).
 */

export interface TrickPlay {
  player: number;
  card: Card;
}

export type MendikotResult = {
  winningTeam: 0 | 1;          // 0 = You & North, 1 = East & West
  tens: [number, number];
  tricks: [number, number];
  isMendikot: boolean;         // all four tens
  isWhitewash: boolean;        // all thirteen tricks
} | null;

export interface MendikotState {
  hands: Card[][];             // 0 = You (S), 1 = East, 2 = North (partner), 3 = West
  trump: Suit;
  trick: TrickPlay[];          // current trick, first entry is the leader
  turn: number;                // whose move (-1 while trick is being collected)
  leader: number;              // who led the current trick
  tricksWon: [number, number]; // per team
  tensWon: [number, number];   // per team
  capturedTens: { card: Card; team: 0 | 1 }[];
  trickCount: number;
  lastTrickSummary: string;
  result: MendikotResult;
}

export const MENDIKOT_PLAYERS = [
  { name: 'You', avatar: '🧑', team: 0 as const },
  { name: 'Ravi', avatar: '👨🏽‍🦰', team: 1 as const },
  { name: 'Asha', avatar: '👩🏽', team: 0 as const },   // your partner
  { name: 'Suresh', avatar: '👴🏽', team: 1 as const },
];

export function teamOf(player: number): 0 | 1 {
  return (player % 2) as 0 | 1;
}

export function dealMendikot(seed?: number): MendikotState {
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  const deck = shuffle(buildDeck({ faceUp: true }), s);
  const hands: Card[][] = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  const rng = mulberry32(s + 7);
  const trump = SUITS[Math.floor(rng() * 4)];
  return {
    hands: hands.map(sortHand),
    trump,
    trick: [],
    turn: 0,
    leader: 0,
    tricksWon: [0, 0],
    tensWon: [0, 0],
    capturedTens: [],
    trickCount: 0,
    lastTrickSummary: `Trump is ${suitGlyph(trump)} — you lead the first trick`,
    result: null,
  };
}

/** Must follow the led suit when possible. */
export function legalCards(state: MendikotState, player: number): Card[] {
  const hand = state.hands[player];
  if (state.trick.length === 0) return hand;
  const leadSuit = state.trick[0].card.suit;
  const following = hand.filter(c => c.suit === leadSuit);
  return following.length > 0 ? following : hand;
}

/** Ace ranks high in trick play (the deck model stores A as 1). */
export function trickValue(card: Card): number {
  return card.value === 1 ? 14 : card.value;
}

export function trickWinner(trick: TrickPlay[], trump: Suit): number {
  const leadSuit = trick[0].card.suit;
  let best = trick[0];
  for (const play of trick.slice(1)) {
    const c = play.card, b = best.card;
    if (c.suit === trump && b.suit !== trump) best = play;
    else if (c.suit === b.suit && trickValue(c) > trickValue(b)) best = play;
    else if (c.suit === leadSuit && b.suit !== trump && b.suit !== leadSuit) best = play;
  }
  return best.player;
}

export function playTrickCard(state: MendikotState, player: number, card: Card): MendikotState {
  const hands = state.hands.map(h => [...h]);
  hands[player] = hands[player].filter(c => c.id !== card.id);
  const trick = [...state.trick, { player, card }];
  if (trick.length < 4) {
    return { ...state, hands, trick, turn: (player + 1) % 4 };
  }
  // Trick complete — turn -1 signals the UI to pause before collecting.
  return { ...state, hands, trick, turn: -1 };
}

/** Resolve a completed trick (call after the UI pause). */
export function collectTrick(state: MendikotState): MendikotState {
  const winner = trickWinner(state.trick, state.trump);
  const team = teamOf(winner);
  const tricksWon: [number, number] = [...state.tricksWon];
  tricksWon[team] += 1;
  const tensWon: [number, number] = [...state.tensWon];
  const capturedTens = [...state.capturedTens];
  for (const play of state.trick) {
    if (play.card.value === 10) {
      tensWon[team] += 1;
      capturedTens.push({ card: play.card, team });
    }
  }
  const trickCount = state.trickCount + 1;
  const tensLine = state.trick.some(p => p.card.value === 10) ? ` (took ${state.trick.filter(p => p.card.value === 10).length} ten${state.trick.filter(p => p.card.value === 10).length > 1 ? 's' : ''}!)` : '';
  const next: MendikotState = {
    ...state,
    trick: [],
    turn: winner,
    leader: winner,
    tricksWon,
    tensWon,
    capturedTens,
    trickCount,
    lastTrickSummary: `${MENDIKOT_PLAYERS[winner].name} won trick ${trickCount}${tensLine}`,
  };
  if (trickCount === 13) {
    return { ...next, turn: -1, result: scoreHand(next) };
  }
  return next;
}

function scoreHand(state: MendikotState): MendikotResult {
  const [t0, t1] = state.tensWon;
  let winningTeam: 0 | 1;
  if (t0 !== t1) winningTeam = t0 > t1 ? 0 : 1;
  else winningTeam = state.tricksWon[0] >= 7 ? 0 : 1; // 2-2 tens → 7+ tricks decides
  return {
    winningTeam,
    tens: [t0, t1],
    tricks: [state.tricksWon[0], state.tricksWon[1]],
    isMendikot: state.tensWon[winningTeam] === 4,
    isWhitewash: state.tricksWon[winningTeam] === 13,
  };
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export function chooseAiTrickCard(state: MendikotState, player: number): Card {
  const legal = legalCards(state, player);
  const trick = state.trick;
  const trump = state.trump;
  const lowest = (cards: Card[]) => [...cards].sort((a, b) => trickValue(a) - trickValue(b))[0];
  const lowestNonTen = (cards: Card[]) => {
    const nonTens = cards.filter(c => c.value !== 10);
    return nonTens.length > 0 ? lowest(nonTens) : lowest(cards);
  };

  // Leading: play a non-trump ace when we have one, otherwise a low probe card.
  if (trick.length === 0) {
    const aces = legal.filter(c => c.rank === 'A' && c.suit !== trump);
    if (aces.length > 0) return aces[0];
    return lowestNonTen(legal);
  }

  const winnerSoFar = trickWinner(trick, trump);
  const partnerWinning = teamOf(winnerSoFar) === teamOf(player);
  const trickHasTen = trick.some(p => p.card.value === 10);
  const isLastToPlay = trick.length === 3;
  const winningCard = trick.find(p => p.player === winnerSoFar)!.card;

  const wouldWin = (card: Card) =>
    trickWinner([...trick, { player, card }], trump) === player;
  const winners = legal.filter(wouldWin);

  if (partnerWinning) {
    // Partner has it: feed them a 10 if they look safe (last to play or they trumped/ace'd).
    const safePartner = isLastToPlay || winningCard.suit === trump || winningCard.rank === 'A';
    const myTens = legal.filter(c => c.value === 10);
    if (safePartner && myTens.length > 0) return myTens[0];
    return lowestNonTen(legal);
  }

  // Opponent winning: fight for tricks holding tens, or when we're last and can win cheap.
  if (winners.length > 0 && (trickHasTen || legal.some(c => c.value === 10) || isLastToPlay)) {
    // Cheapest winning card; avoid burning a 10 to win unless it's the only way.
    const nonTenWinners = winners.filter(c => c.value !== 10);
    return lowest(nonTenWinners.length > 0 ? nonTenWinners : winners);
  }
  return lowestNonTen(legal);
}

function suitGlyph(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}
