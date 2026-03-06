import { Card, Rank, Suit, GameState } from '../types';
import { findWinningPath } from './solver';
import { WINNABLE_SEEDS_DRAW_1, WINNABLE_SEEDS_DRAW_3 } from './knownSeeds';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        isFaceUp: false,
        color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
        value: i + 1,
      });
    }
  }
  return deck;
}

export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function shuffleDeck(deck: Card[], rng: () => number = Math.random): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function dealGame(drawCount: number = 3, customSeed?: number) {
  if (customSeed !== undefined && !isNaN(customSeed)) {
    console.log(`Dealing custom game using specific seed ${customSeed} (Draw ${drawCount})`);
    return generateRandomGame(customSeed);
  }

  // Pick a random known winnable seed
  const seedPool = drawCount === 1 ? WINNABLE_SEEDS_DRAW_1 : WINNABLE_SEEDS_DRAW_3;
  const randomSeed = seedPool[Math.floor(Math.random() * seedPool.length)];
  console.log(`Dealing guaranteed winnable game using seed ${randomSeed} (Draw ${drawCount})`);
  return generateRandomGame(randomSeed);
}

export function generateRandomGame(seed?: number): GameState {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  const deck = shuffleDeck(createDeck(), rng);
  const tableaus: Card[][] = Array.from({ length: 7 }, () => []);

  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = deck.pop()!;
      if (i === j) {
        card.isFaceUp = true;
      }
      tableaus[j].push(card);
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableaus,
    score: 0,
    moves: 0,
    time: 0,
  };
}
