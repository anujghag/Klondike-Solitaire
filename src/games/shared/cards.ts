import { Card, Rank, Suit } from '../../types';
import { mulberry32 } from '../../utils/deck';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export interface DeckOptions {
  decks?: number;          // number of full decks (default 1)
  suits?: Suit[];          // restrict suits (Spider 1-suit / 2-suit modes)
  faceUp?: boolean;        // deal all cards face up
}

/** Build one or more decks with globally unique card ids. */
export function buildDeck(options: DeckOptions = {}): Card[] {
  const { decks = 1, suits = SUITS, faceUp = false } = options;
  const cards: Card[] = [];
  // When suits are restricted (Spider), pad copies so the total is still decks * 52.
  const copiesPerSuit = (decks * 4) / suits.length;
  for (let copy = 0; copy < copiesPerSuit; copy++) {
    for (const suit of suits) {
      for (let i = 0; i < RANKS.length; i++) {
        cards.push({
          id: `${RANKS[i]}-${suit}-${copy}`,
          suit,
          rank: RANKS[i],
          isFaceUp: faceUp,
          color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
          value: i + 1,
        });
      }
    }
  }
  return cards;
}

/** Fisher–Yates shuffle; deterministic when a seed is provided. */
export function shuffle<T>(items: T[], seed?: number): T[] {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Sort a hand by suit then descending value — the standard way players fan cards. */
export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
  return [...hand].sort((a, b) =>
    suitOrder[a.suit] - suitOrder[b.suit] || b.value - a.value
  );
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}
