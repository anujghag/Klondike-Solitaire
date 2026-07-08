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
  customSeed?: number;            // Optional explicit seed
  scoringType: 'standard' | 'vegas';  // Standard increments points, Vegas starts at -$52 and adds $5 per foundation card
  sfxEnabled: boolean;            // If true, plays generated web audio sounds
  leftHandedMode: boolean;        // If true, Stock/Waste are on the right, Foundations on the left
  largePrintMode: boolean;        // If true, highly increases font/icon sizes on the cards
  thoughtfulMode: boolean;        // If true, all face-down cards are visible but grayed out
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
  totalGames: Record<Difficulty, number>;
  currentStreak: Record<Difficulty, number>;
  bestStreak: Record<Difficulty, number>;
  themeWins: Record<string, number>;
  achievements: Achievement[];
  completedDailies: string[];  // ISO date strings e.g. '2026-03-07'
  dailyStreak: number;
  runProgress: Record<string, number>;  // runId -> number of seeds completed (0-5)
  completedRuns: string[];              // runIds of fully completed gauntlets
}

// ─── Multi-game hub ───────────────────────────────────────────────────────────

export type GameId =
  | 'klondike' | 'spider' | 'freecell' | 'tripeaks' | 'pyramid'
  | 'sevens' | 'bluff' | 'mendikot' | 'courtpiece' | 'teenpatti' | 'rummy'
  | 'hearts';

export interface GameRecord {
  games: number;
  wins: number;
  bestScore: number;
  bestTime: number;   // seconds; 0 = none recorded
  special: number;    // game-specific: Mendikots won, 4-suit Spider wins, etc.
}

export type MultiGameStats = Partial<Record<GameId, GameRecord>>;

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
