import { Card, Suit } from '../../types';
import { buildDeck, shuffle, sortHand, SUITS } from '../shared/cards';
import { trickValue, trickWinner, TrickPlay } from '../mendikot/logic';

/**
 * Court Piece (Hokm / Coat Pees) — 2v2 trick-taking. The trump caller sees
 * their first five cards and declares the hukum. First team to 7 tricks wins
 * the rubber; taking all 13 is a "52-card kot".
 */

export interface CourtPieceState {
  hands: Card[][];               // 0 = You (S), 1 = East, 2 = North (partner), 3 = West
  firstFive: Card[];             // caller's first five cards (trump-picking phase)
  trump: Suit | null;            // null while the caller decides
  caller: number;
  trick: TrickPlay[];
  turn: number;                  // -1 while collecting / done
  tricksWon: [number, number];
  trickCount: number;
  lastTrickSummary: string;
  result: { winningTeam: 0 | 1; tricks: [number, number]; isKot: boolean } | null;
}

export const COURT_PLAYERS = [
  { name: 'You', avatar: '🧑', team: 0 as const },
  { name: 'Imran', avatar: '🧔🏽', team: 1 as const },
  { name: 'Zoya', avatar: '👩🏽‍🦱', team: 0 as const },
  { name: 'Farhan', avatar: '👨🏽‍🦳', team: 1 as const },
];

export function dealCourtPiece(seed?: number): CourtPieceState {
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  const deck = shuffle(buildDeck({ faceUp: true }), s);
  const hands: Card[][] = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  const caller = s % 4; // rotate who calls the hukum
  const state: CourtPieceState = {
    hands: hands.map(sortHand),
    firstFive: hands[caller].slice(0, 5),
    trump: null,
    caller,
    trick: [],
    turn: caller,
    tricksWon: [0, 0],
    trickCount: 0,
    lastTrickSummary: `${COURT_PLAYERS[caller].name} call${caller === 0 ? '' : 's'} the hukum from the first five cards`,
    result: null,
  };
  // AI callers pick immediately; a human caller gets the picker UI.
  if (caller !== 0) {
    return setTrump(state, aiPickTrump(state.firstFive));
  }
  return state;
}

export function aiPickTrump(firstFive: Card[]): Suit {
  let best: Suit = 'spades';
  let bestScore = -1;
  for (const suit of SUITS) {
    const cards = firstFive.filter(c => c.suit === suit);
    const score = cards.length * 10 + cards.reduce((a, c) => a + trickValue(c), 0);
    if (score > bestScore) { bestScore = score; best = suit; }
  }
  return best;
}

export function setTrump(state: CourtPieceState, trump: Suit): CourtPieceState {
  const glyph = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[trump];
  return {
    ...state,
    trump,
    lastTrickSummary: `${COURT_PLAYERS[state.caller].name} declared ${glyph} as hukum — ${COURT_PLAYERS[state.caller].name === 'You' ? 'you lead' : 'they lead'}`,
  };
}

export function courtLegalCards(state: CourtPieceState, player: number): Card[] {
  const hand = state.hands[player];
  if (state.trick.length === 0) return hand;
  const leadSuit = state.trick[0].card.suit;
  const following = hand.filter(c => c.suit === leadSuit);
  return following.length > 0 ? following : hand;
}

export function courtPlayCard(state: CourtPieceState, player: number, card: Card): CourtPieceState {
  const hands = state.hands.map(h => [...h]);
  hands[player] = hands[player].filter(c => c.id !== card.id);
  const trick = [...state.trick, { player, card }];
  if (trick.length < 4) {
    return { ...state, hands, trick, turn: (player + 1) % 4 };
  }
  return { ...state, hands, trick, turn: -1 };
}

export function courtCollectTrick(state: CourtPieceState): CourtPieceState {
  const winner = trickWinner(state.trick, state.trump!);
  const team = (winner % 2) as 0 | 1;
  const tricksWon: [number, number] = [...state.tricksWon];
  tricksWon[team] += 1;
  const trickCount = state.trickCount + 1;
  const next: CourtPieceState = {
    ...state,
    trick: [],
    turn: winner,
    tricksWon,
    trickCount,
    lastTrickSummary: `${COURT_PLAYERS[winner].name} won trick ${trickCount} — ${tricksWon[0]} : ${tricksWon[1]}`,
  };
  // First to 7 tricks wins. If the leaders haven't conceded a single trick,
  // play continues so they can chase the 13-0 "kot"; any opposing trick ends it.
  const leader: 0 | 1 | -1 = tricksWon[0] >= 7 ? 0 : tricksWon[1] >= 7 ? 1 : -1;
  if (leader !== -1) {
    const chasingKot = tricksWon[leader === 0 ? 1 : 0] === 0 && trickCount < 13;
    if (!chasingKot) {
      return {
        ...next,
        turn: -1,
        result: {
          winningTeam: leader as 0 | 1,
          tricks: [tricksWon[0], tricksWon[1]],
          isKot: tricksWon[leader] === 13,
        },
      };
    }
  }
  return next;
}

/** Same trick heuristics as Mendikot, minus the tens obsession. */
export function courtChooseAiCard(state: CourtPieceState, player: number): Card {
  const legal = courtLegalCards(state, player);
  const trump = state.trump!;
  const trick = state.trick;
  const lowest = (cards: Card[]) => [...cards].sort((a, b) => trickValue(a) - trickValue(b))[0];

  if (trick.length === 0) {
    const aces = legal.filter(c => c.rank === 'A' && c.suit !== trump);
    if (aces.length > 0) return aces[0];
    // Lead trumps aggressively when holding many.
    const trumps = legal.filter(c => c.suit === trump);
    if (trumps.length >= 5) return trumps.sort((a, b) => trickValue(b) - trickValue(a))[0];
    return lowest(legal);
  }

  const winnerSoFar = trickWinner(trick, trump);
  const partnerWinning = winnerSoFar % 2 === player % 2;
  const wouldWin = (card: Card) => trickWinner([...trick, { player, card }], trump) === player;
  const winners = legal.filter(wouldWin);

  if (partnerWinning) return lowest(legal);
  if (winners.length > 0) return lowest(winners);
  return lowest(legal);
}
