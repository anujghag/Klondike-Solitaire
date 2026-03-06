export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  color: 'red' | 'black';
  value: number; // 1 for A, 11 for J, etc.
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameSettings {
  difficulty: Difficulty;
  thoughtfulMode: boolean;        // If true, all face-down cards are visible but grayed out
  guaranteedWinnable: boolean;    // If true, generate deals until a winnable one is found
  autoPlayEnabled: boolean;       // If true, show a button to let the deep solver play the game
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles
  tableaus: Card[][]; // 7 piles
  score: number;
  moves: number;
  time: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface Stats {
  highScores: Record<Difficulty, number>;
  fastestTimes: Record<Difficulty, number>;
  totalWins: Record<Difficulty, number>;
  achievements: Achievement[];
}

export interface SuitStyle {
  text: string;
  symbol: string;
  background: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  fontFamily: string;
  tableStyle: string;
  tableImageUrl?: string;
  cardBack: string;
  cardBackImageUrl?: string;
  showCharacters: boolean;
  suitStyles: {
    hearts: SuitStyle;
    diamonds: SuitStyle;
    spades: SuitStyle;
    clubs: SuitStyle;
  };
}
