import { Card, Rank } from '../../types';
import { buildDeck, shuffle, sortHand, RANKS } from '../shared/cards';

/**
 * Indian Rummy (13-card) vs the AI. One deck plus a revealed wild-joker rank.
 * Declare when your 13 cards form valid melds: ≥2 sequences, one of them pure.
 */

export interface RummyState {
  hands: [Card[], Card[]];   // 0 = you, 1 = AI
  stock: Card[];
  discard: Card[];
  wildRank: Rank;            // every card of this rank is a joker
  wildCard: Card;            // the revealed card (display only)
  turn: number;
  phase: 'draw' | 'discard';
  message: string;
  result: { winner: number } | null;
}

export const RUMMY_PLAYERS = [
  { name: 'You', avatar: '🧑' },
  { name: 'Anandi', avatar: '👵🏽' },
];

export function dealRummy(seed?: number): RummyState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const hands: [Card[], Card[]] = [[], []];
  for (let i = 0; i < 26; i++) hands[i % 2].push(deck.pop()!);
  const wildCard = deck.pop()!;
  const firstDiscard = deck.pop()!;
  return {
    hands: [sortHand(hands[0]), sortHand(hands[1])],
    stock: deck,
    discard: [firstDiscard],
    wildRank: wildCard.rank,
    wildCard,
    turn: 0,
    phase: 'draw',
    message: `${wildCard.rank}s are wild — you draw first`,
    result: null,
  };
}

export function isWild(card: Card, wildRank: Rank): boolean {
  return card.rank === wildRank;
}

/** Meld check for a subset of cards (with wilds). */
function checkMeld(cards: Card[], wildRank: Rank): { valid: boolean; isSeq: boolean; isPure: boolean } {
  const wilds = cards.filter(c => isWild(c, wildRank));
  const natural = cards.filter(c => !isWild(c, wildRank));
  const n = cards.length;
  if (n < 3) return { valid: false, isSeq: false, isPure: false };

  // Set: same rank, distinct suits, max 4.
  if (n <= 4 && natural.length > 0) {
    const rank = natural[0].rank;
    const suits = new Set(natural.map(c => c.suit));
    if (natural.every(c => c.rank === rank) && suits.size === natural.length && rank !== wildRank) {
      return { valid: true, isSeq: false, isPure: false };
    }
  }
  // All-wild groups count as a set.
  if (natural.length === 0) return { valid: true, isSeq: false, isPure: false };

  // Sequence: natural cards same suit, values fit a window of size n with wilds as fillers.
  const suit = natural[0].suit;
  if (!natural.every(c => c.suit === suit)) return { valid: false, isSeq: false, isPure: false };
  // Unique values fitting a window of n cards; the wilds fill gaps and ends
  // (window ≤ n already guarantees enough wilds, since n = naturals + wilds).
  const tryValues = (vals: number[]): boolean => {
    if (new Set(vals).size !== vals.length) return false;
    return Math.max(...vals) - Math.min(...vals) <= n - 1;
  };
  const low = natural.map(c => c.value);
  const high = natural.map(c => (c.value === 1 ? 14 : c.value));
  const seqOk = tryValues(low) || tryValues(high);
  if (!seqOk) return { valid: false, isSeq: false, isPure: false };
  return { valid: true, isSeq: true, isPure: wilds.length === 0 };
}

/**
 * Can these 13 cards be partitioned into valid melds with ≥2 sequences (≥1 pure)?
 * Exact-cover backtracking over bitmask-enumerated melds.
 */
export function canDeclare(cards: Card[], wildRank: Rank): boolean {
  if (cards.length !== 13) return false;
  const n = 13;
  const total = 1 << n;
  interface Meld { mask: number; isSeq: boolean; isPure: boolean }
  const melds: Meld[] = [];
  for (let mask = 0; mask < total; mask++) {
    const size = popcount(mask);
    if (size < 3) continue;
    const subset: Card[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(cards[i]);
    const res = checkMeld(subset, wildRank);
    if (res.valid) melds.push({ mask, isSeq: res.isSeq, isPure: res.isPure });
  }
  // Group melds by their lowest set bit for the exact-cover search.
  const byFirstBit: Meld[][] = Array.from({ length: n }, () => []);
  for (const m of melds) {
    for (let i = 0; i < n; i++) {
      if (m.mask & (1 << i)) { byFirstBit[i].push(m); break; }
    }
  }
  const full = total - 1;
  const search = (covered: number, seqs: number, pures: number): boolean => {
    if (covered === full) return seqs >= 2 && pures >= 1;
    let first = 0;
    while (covered & (1 << first)) first++;
    for (const m of byFirstBit[first]) {
      if (m.mask & covered) continue;
      if (search(covered | m.mask, seqs + (m.isSeq ? 1 : 0), pures + (m.isPure ? 1 : 0))) return true;
    }
    return false;
  };
  return search(0, 0, 0);
}

function popcount(x: number): number {
  let c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
}

/** Which cards in a 14-card hand can be discarded to leave a winning 13? */
export function winningDiscards(hand: Card[], wildRank: Rank): Set<string> {
  const out = new Set<string>();
  if (hand.length !== 14) return out;
  for (let i = 0; i < 14; i++) {
    const rest = hand.filter((_, j) => j !== i);
    if (canDeclare(rest, wildRank)) out.add(hand[i].id);
  }
  return out;
}

// ─── State transitions ───────────────────────────────────────────────────────

export function drawCard(state: RummyState, player: number, from: 'stock' | 'discard'): RummyState {
  const hands: [Card[], Card[]] = [ [...state.hands[0]], [...state.hands[1]] ];
  let stock = [...state.stock];
  let discard = [...state.discard];
  let card: Card;
  if (from === 'discard' && discard.length > 0) {
    card = discard.pop()!;
  } else {
    // Recycle discard into the stock when it runs dry (keep the top card).
    if (stock.length === 0) {
      const top = discard.pop()!;
      stock = shuffle(discard);
      discard = [top];
    }
    card = stock.pop()!;
  }
  hands[player] = sortHand([...hands[player], card]);
  return {
    ...state,
    hands,
    stock,
    discard,
    phase: 'discard',
    message: `${RUMMY_PLAYERS[player].name} drew from the ${from}`,
  };
}

export function discardCard(state: RummyState, player: number, cardId: string): RummyState {
  const hands: [Card[], Card[]] = [ [...state.hands[0]], [...state.hands[1]] ];
  const card = hands[player].find(c => c.id === cardId);
  if (!card) return state;
  hands[player] = hands[player].filter(c => c.id !== cardId);
  // A winning discard ends the game.
  if (canDeclare(hands[player], state.wildRank)) {
    return {
      ...state,
      hands,
      discard: [...state.discard, card],
      result: { winner: player },
      turn: -1,
      message: `🏆 ${RUMMY_PLAYERS[player].name} declared!`,
    };
  }
  return {
    ...state,
    hands,
    discard: [...state.discard, card],
    turn: 1 - player,
    phase: 'draw',
    message: `${RUMMY_PLAYERS[player].name} discarded ${card.rank}`,
  };
}

// ─── AI ──────────────────────────────────────────────────────────────────────

/** Synergy score: how much this card contributes to melds in this hand. */
function synergy(card: Card, hand: Card[], wildRank: Rank): number {
  if (isWild(card, wildRank)) return 100;
  let s = 0;
  for (const other of hand) {
    if (other.id === card.id) continue;
    if (other.rank === card.rank && other.suit !== card.suit) s += 3;   // set potential
    if (other.suit === card.suit && !isWild(other, wildRank)) {
      const d = Math.abs(other.value - card.value);
      const dAce = Math.abs((other.value === 1 ? 14 : other.value) - (card.value === 1 ? 14 : card.value));
      const dist = Math.min(d, dAce);
      if (dist === 1) s += 4;                                            // run neighbour
      else if (dist === 2) s += 2;                                       // gap run
    }
  }
  return s;
}

export function chooseAiDraw(state: RummyState): 'stock' | 'discard' {
  const top = state.discard[state.discard.length - 1];
  if (!top) return 'stock';
  const hand = state.hands[1];
  if (isWild(top, state.wildRank)) return 'discard';
  return synergy(top, hand, state.wildRank) >= 6 ? 'discard' : 'stock';
}

export function chooseAiDiscard(state: RummyState): string {
  const hand = state.hands[1];
  // Winning discard first.
  const winners = winningDiscards(hand, state.wildRank);
  if (winners.size > 0) return [...winners][0];
  // Otherwise shed the least useful, most expensive card.
  let worst = hand[0];
  let worstScore = Infinity;
  for (const card of hand) {
    const points = Math.min(card.value === 1 ? 10 : card.value, 10);
    const score = synergy(card, hand, state.wildRank) * 10 - points;
    if (score < worstScore) { worstScore = score; worst = card; }
  }
  return worst.id;
}

export { RANKS };
