import { Card, Rank } from '../../types';
import { buildDeck, shuffle, sortHand, RANKS } from '../shared/cards';

export interface BluffPlay {
  player: number;
  cards: Card[];      // the actual face-down cards
  claimCount: number; // == cards.length (claims are about rank, not count)
}

export interface BluffState {
  hands: Card[][];
  pile: Card[];               // face-down discard pile for the round
  currentRank: Rank | null;   // rank being claimed this round (null = round start)
  turn: number;
  lastPlay: BluffPlay | null; // most recent unchallenged play
  passes: number;             // consecutive passes since last play
  roundStarter: number;
  pendingWinner: number | null; // played their last card; wins if the play stands
  winner: number | null;
  log: string[];
  reveal: { cards: Card[]; wasLie: boolean; challenger: number; accused: number } | null;
}

export const BLUFF_PLAYERS = [
  { name: 'You', avatar: '🧑' },
  { name: 'Vikram', avatar: '🧔🏽' },
  { name: 'Priya', avatar: '👩🏽‍🦱' },
  { name: 'Kabir', avatar: '👦🏽' },
];

const MAX_LOG = 6;

function pushLog(log: string[], entry: string): string[] {
  return [...log.slice(-(MAX_LOG - 1)), entry];
}

export function dealBluff(seed?: number): BluffState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const hands: Card[][] = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  return {
    hands: hands.map(sortHand),
    pile: [],
    currentRank: null,
    turn: 0,
    lastPlay: null,
    passes: 0,
    roundStarter: 0,
    pendingWinner: null,
    winner: null,
    log: ['New game — you start. Pick any cards and declare a rank!'],
    reveal: null,
  };
}

function activePlayers(state: BluffState): number {
  return state.hands.filter((h, i) => h.length > 0 || state.pendingWinner === i).length;
}

function nextPlayer(state: BluffState, from: number): number {
  let p = from;
  for (let i = 0; i < 4; i++) {
    p = (p + 1) % 4;
    if (state.hands[p].length > 0) return p;
  }
  return from;
}

/** Play cards claiming `rank` (rank only used/needed at round start). */
export function playCards(state: BluffState, player: number, cards: Card[], rank?: Rank): BluffState {
  // Playing on top of someone's final cards (instead of challenging) lets them win.
  if (state.pendingWinner !== null && state.pendingWinner !== player) {
    const w = state.pendingWinner;
    return {
      ...state,
      winner: w,
      turn: -1,
      log: pushLog(state.log, `🏆 ${BLUFF_PLAYERS[w].name} wins — their last play went unchallenged!`),
    };
  }
  const currentRank = state.currentRank ?? rank!;
  const hands = state.hands.map(h => [...h]);
  const ids = new Set(cards.map(c => c.id));
  hands[player] = hands[player].filter(c => !ids.has(c.id));
  const name = BLUFF_PLAYERS[player].name;
  const next: BluffState = {
    ...state,
    hands,
    pile: [...state.pile, ...cards],
    currentRank,
    lastPlay: { player, cards, claimCount: cards.length },
    passes: 0,
    pendingWinner: hands[player].length === 0 ? player : state.pendingWinner === player ? null : state.pendingWinner,
    log: pushLog(state.log, `${name} played ${cards.length} × ${currentRank}${state.currentRank === null ? ` (declared ${currentRank}s)` : ''}${hands[player].length === 0 ? ' — last card!' : ''}`),
    reveal: null,
  };
  return { ...next, turn: nextPlayer(next, player) };
}

export function passPlayer(state: BluffState, player: number): BluffState {
  const name = BLUFF_PLAYERS[player].name;
  let next: BluffState = {
    ...state,
    passes: state.passes + 1,
    log: pushLog(state.log, `${name} passed`),
    reveal: null,
  };

  // Everyone else passed since the last play → pile burns, last player leads a new round.
  if (next.lastPlay && next.passes >= activePlayers(next) - 1) {
    const leader = next.lastPlay.player;
    // A pending winner survives the full table passing on their final play.
    if (next.pendingWinner === leader) {
      return {
        ...next,
        winner: leader,
        log: pushLog(next.log, `🏆 ${BLUFF_PLAYERS[leader].name} wins — nobody challenged!`),
      };
    }
    next = {
      ...next,
      pile: [],
      currentRank: null,
      lastPlay: null,
      passes: 0,
      roundStarter: leader,
      turn: leader,
      log: pushLog(next.log, `Pile burned — ${BLUFF_PLAYERS[leader].name} starts a new round`),
    };
    return next;
  }

  // Round start with no play yet and everyone passing shouldn't happen (starter must play),
  // but guard: move on.
  return { ...next, turn: nextPlayer(next, player) };
}

/** Challenge the last play. Returns the resolved state with a reveal for the UI. */
export function challenge(state: BluffState, challenger: number): BluffState {
  const play = state.lastPlay;
  if (!play || !state.currentRank) return state;
  const wasLie = play.cards.some(c => c.rank !== state.currentRank);
  const loser = wasLie ? play.player : challenger;
  const hands = state.hands.map(h => [...h]);
  hands[loser] = sortHand([...hands[loser], ...state.pile]);

  const chName = BLUFF_PLAYERS[challenger].name;
  const acName = BLUFF_PLAYERS[play.player].name;
  let log = pushLog(state.log, `⚔️ ${chName} challenged ${acName}: ${wasLie ? `LIE! ${acName} takes the pile` : `truth — ${chName} takes the pile`}`);

  // If the accused truthfully played their final cards, they win.
  let winner: number | null = null;
  if (!wasLie && state.pendingWinner === play.player) {
    winner = play.player;
    log = pushLog(log, `🏆 ${acName} wins the game!`);
  }

  const roundStarter = wasLie ? challenger : play.player;
  return {
    ...state,
    hands,
    pile: [],
    currentRank: null,
    lastPlay: null,
    passes: 0,
    pendingWinner: winner !== null ? state.pendingWinner : null,
    roundStarter,
    turn: winner !== null ? -1 : roundStarter,
    winner,
    log,
    reveal: { cards: play.cards, wasLie, challenger, accused: play.player },
  };
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export type AiAction =
  | { type: 'play'; cards: Card[]; rank?: Rank }
  | { type: 'pass' }
  | { type: 'challenge' };

export function chooseAiAction(state: BluffState, player: number): AiAction {
  const hand = state.hands[player];

  // Consider challenging the previous play first.
  if (state.lastPlay && state.lastPlay.player !== player && state.currentRank) {
    const ownOfRank = hand.filter(c => c.rank === state.currentRank).length;
    const claimed = state.lastPlay.claimCount;
    const accusedHand = state.hands[state.lastPlay.player].length;
    // Impossible claim: more of the rank in play than exist.
    if (ownOfRank + claimed > 4) return { type: 'challenge' };
    // Someone just played their last cards — challenge often.
    if (state.pendingWinner === state.lastPlay.player && Math.random() < 0.75) return { type: 'challenge' };
    const suspicion = 0.08 + claimed * 0.05 + (accusedHand <= 2 ? 0.25 : 0) + ownOfRank * 0.06;
    if (Math.random() < suspicion) return { type: 'challenge' };
  }

  // Round start: declare our most common rank.
  if (state.currentRank === null) {
    const counts = new Map<Rank, Card[]>();
    for (const c of hand) {
      counts.set(c.rank, [...(counts.get(c.rank) ?? []), c]);
    }
    let bestRank: Rank = hand[0]?.rank ?? 'A';
    let bestCards: Card[] = hand.slice(0, 1);
    for (const [rank, cards] of counts) {
      if (cards.length > bestCards.length) { bestRank = rank; bestCards = cards; }
    }
    return { type: 'play', cards: bestCards.slice(0, 4), rank: bestRank };
  }

  // Mid round: play truthful cards when we have them.
  const truthful = hand.filter(c => c.rank === state.currentRank);
  if (truthful.length > 0) {
    // Occasionally slip one extra bluff card underneath.
    const cards = [...truthful];
    if (Math.random() < 0.2 && hand.length > truthful.length) {
      const filler = hand.find(c => c.rank !== state.currentRank);
      if (filler) cards.push(filler);
    }
    return { type: 'play', cards: cards.slice(0, 4) };
  }

  // No truthful cards: bluff more when the hand is heavy, pass when light.
  const bluffChance = Math.min(0.65, 0.25 + hand.length * 0.02);
  if (hand.length > 0 && Math.random() < bluffChance) {
    const count = 1 + (Math.random() < 0.3 ? 1 : 0);
    // Bluff with cards far from useful ranks (dump duplicates first).
    const cards = [...hand].sort((a, b) => a.value - b.value).slice(0, count);
    return { type: 'play', cards };
  }
  return { type: 'pass' };
}

export { RANKS };
