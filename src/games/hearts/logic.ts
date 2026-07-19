import { Card } from '../../types';
import { buildDeck, shuffle, sortHand } from '../shared/cards';
import { trickValue } from '../mendikot/logic';

/**
 * Hearts: avoid taking hearts (1pt each) and the Q♠ (13pts).
 * Taking all 26 = shooting the moon (everyone else +26).
 * Single-hand rounds; 2♣ leads, hearts must be broken before being led.
 */

export interface HeartsTrickPlay {
  player: number;
  card: Card;
}

export interface HeartsState {
  hands: Card[][];
  trick: HeartsTrickPlay[];
  turn: number;               // -1 while collecting / when done
  heartsBroken: boolean;
  points: number[];           // running points this hand per player
  trickCount: number;
  lastTrickSummary: string;
  result: { scores: number[]; winner: number; moonShooter: number | null } | null;
}

export const HEARTS_PLAYERS = [
  { name: 'You', avatar: '🧑' },
  { name: 'Nina', avatar: '👩🏻‍🦰' },
  { name: 'Omar', avatar: '👨🏾' },
  { name: 'Lily', avatar: '👩🏼' },
];

export function dealHearts(seed?: number): HeartsState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const hands: Card[][] = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  const leader = hands.findIndex(h => h.some(c => c.suit === 'clubs' && c.value === 2));
  return {
    hands: hands.map(sortHand),
    trick: [],
    turn: leader,
    heartsBroken: false,
    points: [0, 0, 0, 0],
    trickCount: 0,
    lastTrickSummary: `${HEARTS_PLAYERS[leader].name} lead${leader === 0 ? '' : 's'} with the 2♣`,
    result: null,
  };
}

export function cardPoints(card: Card): number {
  if (card.suit === 'hearts') return 1;
  if (card.suit === 'spades' && card.rank === 'Q') return 13;
  return 0;
}

export function heartsLegalCards(state: HeartsState, player: number): Card[] {
  const hand = state.hands[player];
  // Very first play of the hand must be the 2♣.
  if (state.trickCount === 0 && state.trick.length === 0) {
    const twoClubs = hand.find(c => c.suit === 'clubs' && c.value === 2);
    if (twoClubs) return [twoClubs];
  }
  if (state.trick.length === 0) {
    // Can't lead hearts until broken (unless hand is all hearts).
    if (!state.heartsBroken) {
      const nonHearts = hand.filter(c => c.suit !== 'hearts');
      if (nonHearts.length > 0) return nonHearts;
    }
    return hand;
  }
  const leadSuit = state.trick[0].card.suit;
  const following = hand.filter(c => c.suit === leadSuit);
  if (following.length > 0) return following;
  // No points may be dumped on the very first trick.
  if (state.trickCount === 0) {
    const clean = hand.filter(c => cardPoints(c) === 0);
    if (clean.length > 0) return clean;
  }
  return hand;
}

export function heartsTrickWinner(trick: HeartsTrickPlay[]): number {
  const leadSuit = trick[0].card.suit;
  let best = trick[0];
  for (const play of trick.slice(1)) {
    if (play.card.suit === leadSuit && trickValue(play.card) > trickValue(best.card)) best = play;
  }
  return best.player;
}

export function heartsPlayCard(state: HeartsState, player: number, card: Card): HeartsState {
  const hands = state.hands.map(h => [...h]);
  hands[player] = hands[player].filter(c => c.id !== card.id);
  const trick = [...state.trick, { player, card }];
  const heartsBroken = state.heartsBroken || card.suit === 'hearts';
  if (trick.length < 4) {
    return { ...state, hands, trick, heartsBroken, turn: (player + 1) % 4 };
  }
  return { ...state, hands, trick, heartsBroken, turn: -1 };
}

export function heartsCollectTrick(state: HeartsState): HeartsState {
  const winner = heartsTrickWinner(state.trick);
  const pts = state.trick.reduce((a, p) => a + cardPoints(p.card), 0);
  const points = [...state.points];
  points[winner] += pts;
  const trickCount = state.trickCount + 1;
  const next: HeartsState = {
    ...state,
    trick: [],
    turn: winner,
    points,
    trickCount,
    lastTrickSummary: `${HEARTS_PLAYERS[winner].name} took trick ${trickCount}${pts > 0 ? ` (+${pts} pts)` : ''}`,
  };
  if (trickCount === 13) {
    // Shooting the moon: 26 points → 0 for the shooter, 26 for everyone else.
    const moonShooter = points.findIndex(p => p === 26);
    const scores = moonShooter >= 0 ? points.map((_, i) => (i === moonShooter ? 0 : 26)) : [...points];
    const min = Math.min(...scores);
    const winnerIdx = scores.indexOf(min);
    return { ...next, turn: -1, result: { scores, winner: winnerIdx, moonShooter: moonShooter >= 0 ? moonShooter : null } };
  }
  return next;
}

export function heartsChooseAiCard(state: HeartsState, player: number): Card {
  const legal = heartsLegalCards(state, player);
  const byValue = [...legal].sort((a, b) => trickValue(a) - trickValue(b));
  const trick = state.trick;

  if (trick.length === 0) {
    // Lead low; avoid leading spades near the queen.
    const safeLead = byValue.filter(c => !(c.suit === 'spades' && trickValue(c) >= 12));
    return (safeLead[0] ?? byValue[0]);
  }

  const leadSuit = trick[0].card.suit;
  const following = legal.filter(c => c.suit === leadSuit);
  if (following.length > 0) {
    const winnerSoFar = heartsTrickWinner(trick);
    const winningVal = trickValue(trick.find(p => p.player === winnerSoFar)!.card);
    const trickPts = trick.reduce((a, p) => a + cardPoints(p.card), 0);
    // Duck under the current winner when possible.
    const ducks = following.filter(c => trickValue(c) < winningVal).sort((a, b) => trickValue(b) - trickValue(a));
    if (ducks.length > 0) return ducks[0]; // highest card that still ducks
    // Forced to win: take with the lowest winner, unless last and no points — then dump the highest.
    const sorted = [...following].sort((a, b) => trickValue(a) - trickValue(b));
    if (trick.length === 3 && trickPts === 0) return sorted[sorted.length - 1];
    return sorted[0];
  }

  // Void: dump the Q♠ first, then high hearts, then highest card.
  const queen = legal.find(c => c.suit === 'spades' && c.rank === 'Q');
  if (queen) return queen;
  const hearts = legal.filter(c => c.suit === 'hearts').sort((a, b) => trickValue(b) - trickValue(a));
  if (hearts.length > 0) return hearts[0];
  return byValue[byValue.length - 1];
}
