import { createDeck, shuffleDeck, generateRandomGame } from '../src/utils/deck';
import { findWinningPath } from '../src/utils/solver';
import * as fs from 'fs';

// Since we are running in Node, let's redefine the PRNG to be safe
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const findSeeds = (targetCount: number, drawCount: number) => {
  const seeds: number[] = [];
  let currentSeed = 1;

  while (seeds.length < targetCount) {
    const rng = mulberry32(currentSeed);
    
    // Inline generateRandomGame logic to use seed
    const deck = shuffleDeck(createDeck(), rng);
    const tableaus: any[][] = Array.from({ length: 7 }, () => []);

    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
        const card = deck.pop()!;
        if (i === j) {
            card.isFaceUp = true;
        }
        tableaus[j].push(card);
        }
    }

    const state = {
        stock: deck,
        waste: [],
        foundations: [[], [], [], []],
        tableaus,
        score: 0,
        moves: 0,
        time: 0,
    };

    // Fast check with 5000 iterations to save time
    const solver = findWinningPath(state, drawCount, 5000);
    let result = solver.next();
    while (!result.done) {
        result = solver.next();
    }

    if (result.value !== null) {
      seeds.push(currentSeed);
      console.log(`Found winnable seed for draw ${drawCount}: ${currentSeed} (${seeds.length}/${targetCount})`);
    }

    currentSeed++;
  }

  return seeds;
};

console.log('Generating winnable deals...');
const winnableDraw1 = findSeeds(1000, 1);
const winnableDraw3 = findSeeds(1000, 3);

const content = `// Auto-generated known winnable seeds
export const WINNABLE_SEEDS_DRAW_1 = ${JSON.stringify(winnableDraw1)};
export const WINNABLE_SEEDS_DRAW_3 = ${JSON.stringify(winnableDraw3)};
`;

fs.writeFileSync('./src/utils/knownSeeds.ts', content);
console.log('Successfully wrote src/utils/knownSeeds.ts');
