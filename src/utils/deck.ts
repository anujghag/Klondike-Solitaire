import { Card, Rank, Suit, GameState } from '../types';
import { findWinningPath } from './solver';

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

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function dealGame(drawCount: number = 3, guaranteedWinnable: boolean = false) {
  let attempt = 0;

  while (true) {
    attempt++;
    const state = generateRandomGame();

    if (!guaranteedWinnable) {
      return state;
    }

    // Try to solve it synchronously. Limit to 5000 iterations to avoid hanging the browser too long.
    const solver = findWinningPath(state, drawCount, 5000);

    let result = solver.next();
    while (!result.done) {
      result = solver.next();
    }

    // result.value contains the move path if it was found
    if (result.value !== null) {
      console.log(`Found a winnable game on attempt ${attempt}!`);
      return state;
    }

    if (attempt > 20) {
      console.warn("Could not find a guaranteed winnable game within 20 attempts. Returning best effort.");
      return state; // Escape hatch so we don't freeze forever
    }
  }
}

function generateRandomGame(): GameState {
  const deck = shuffleDeck(createDeck());
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
