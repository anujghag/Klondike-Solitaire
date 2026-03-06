import { WINNABLE_SEEDS_DRAW_1, WINNABLE_SEEDS_DRAW_3 } from './knownSeeds';

// ─── Seed Difficulty ──────────────────────────────────────────────────────────
// Seeds are naturally ordered by discovery difficulty. Earlier seeds (lower index)
// were found quickly by the solver — meaning they have more obvious winning paths.
// Later seeds required more computation — meaning they have tighter, harder paths.
// We bin the 1000-seed arrays into 5 quintiles for a ★1-5 rating.

export type DifficultyStars = 1 | 2 | 3 | 4 | 5;

export const getSeedDifficulty = (seed: number, drawCount: 1 | 3): DifficultyStars => {
  const pool = drawCount === 1 ? WINNABLE_SEEDS_DRAW_1 : WINNABLE_SEEDS_DRAW_3;
  const index = pool.indexOf(seed);
  if (index === -1) return 3; // Unknown seed — default medium
  const quintile = Math.floor((index / pool.length) * 5);
  return (Math.min(quintile, 4) + 1) as DifficultyStars;
};

export const getDifficultyLabel = (stars: DifficultyStars): string => {
  switch (stars) {
    case 1: return 'Novice';
    case 2: return 'Adept';
    case 3: return 'Skilled';
    case 4: return 'Expert';
    case 5: return 'Master';
  }
};

export const getDifficultyColor = (stars: DifficultyStars): string => {
  switch (stars) {
    case 1: return 'text-emerald-400';
    case 2: return 'text-blue-400';
    case 3: return 'text-yellow-400';
    case 4: return 'text-orange-400';
    case 5: return 'text-red-400';
  }
};

// ─── Roguelite Runs ───────────────────────────────────────────────────────────
// Each run is a curated gauntlet of 5 seeds that escalate from ★1 to ★5.
// Players complete seeds sequentially; completing all 5 unlocks the run.

export interface RogueliteRun {
  id: string;
  name: string;
  description: string;
  themeId: string;
  seeds: number[];  // 5 seeds, escalating difficulty
  drawCount: 1 | 3;
}

// Pick seeds from specific quintiles to ensure escalation
const pickSeedFromQuintile = (pool: number[], quintile: number) => {
  const start = Math.floor(pool.length * quintile / 5);
  const end = Math.floor(pool.length * (quintile + 1) / 5);
  // Pick from the middle of each quintile for consistency
  return pool[Math.floor((start + end) / 2)];
};

export const ROGUELITE_RUNS: RogueliteRun[] = [
  {
    id: 'void-sequence',
    name: 'The Sequence Protocol',
    description: 'Five layers of the Fog — each deeper than the last. Can you reach the Pupil-less Eye?',
    themeId: 'mystic-void',
    seeds: [
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 0), // ★1
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 1), // ★2
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 2), // ★3
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 3), // ★4
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 4), // ★5
    ],
    drawCount: 3,
  },
  {
    id: 'luxury-tournament',
    name: 'The Grand Tournament',
    description: 'Five rounds of high-stakes play. Prove your worth at the gentleman\'s table.',
    themeId: 'classic-luxury',
    seeds: [
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_1, 0),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_1, 1),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_1, 2),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_1, 3),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_1, 4),
    ],
    drawCount: 1,
  },
  {
    id: 'light-ascent',
    name: 'The Ascent',
    description: 'Climb from the valley floor to the summit. Each step brighter — and harder.',
    themeId: 'ethereal-light',
    seeds: [
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 0),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 1),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 2),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 3),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 4),
    ],
    drawCount: 3,
  },
  {
    id: 'maratha-campaign',
    name: 'Swarajya Campaign',
    description: 'Five forts, five battles. From the Western Ghats to the throne of Raigad. Har Har Mahadev!',
    themeId: 'maratha-glory',
    seeds: [
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 0),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 1),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 2),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 3),
      pickSeedFromQuintile(WINNABLE_SEEDS_DRAW_3, 4),
    ],
    drawCount: 3,
  },
];
