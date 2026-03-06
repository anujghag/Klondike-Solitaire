import { Card, GameState } from '../types';
import { canMoveToFoundation, canMoveToTableau, checkWin } from './gameLogic';

export type GameMove =
    | { type: 'draw' }
    | { type: 'recycle' }
    | { type: 'tableauToFoundation'; fromTableau: number; foundationIndex: number }
    | { type: 'wasteToFoundation'; foundationIndex: number }
    | { type: 'wasteToTableau'; toTableau: number }
    | { type: 'tableauToTableau'; fromTableau: number; toTableau: number; count: number };

// A serialized representation of the state for the visited set
function hashState(state: GameState): string {
    const stock = state.stock.map(c => c.id).join(',');
    const waste = state.waste.map(c => c.id).join(',');
    const foundations = state.foundations.map(f => f.length > 0 ? f[f.length - 1].id : '').join('|');
    const tableaus = state.tableaus.map(t =>
        t.map(c => (c.isFaceUp ? 'U' : 'D') + c.id).join(',')
    ).join('|');

    return `${stock}#${waste}#${foundations}#${tableaus}`;
}

// Deep Clone helper for GameState
function cloneState(state: GameState): GameState {
    return {
        stock: state.stock.map(c => ({ ...c })),
        waste: state.waste.map(c => ({ ...c })),
        foundations: state.foundations.map(f => f.map(c => ({ ...c }))),
        tableaus: state.tableaus.map(t => t.map(c => ({ ...c }))),
        score: state.score,
        moves: state.moves,
        time: state.time
    };
}

export function getValidMoves(state: GameState, drawCount: number): GameMove[] {
    const moves: GameMove[] = [];

    // 1. Waste to Foundation
    if (state.waste.length > 0) {
        const topWaste = state.waste[state.waste.length - 1];
        for (let i = 0; i < 4; i++) {
            if (canMoveToFoundation(topWaste, state.foundations[i])) {
                moves.push({ type: 'wasteToFoundation', foundationIndex: i });
            }
        }
    }

    // 2. Tableau to Foundation
    for (let i = 0; i < 7; i++) {
        const tableau = state.tableaus[i];
        if (tableau.length > 0) {
            const topTableau = tableau[tableau.length - 1];
            for (let j = 0; j < 4; j++) {
                if (canMoveToFoundation(topTableau, state.foundations[j])) {
                    moves.push({ type: 'tableauToFoundation', fromTableau: i, foundationIndex: j });
                }
            }
        }
    }

    // 3. Waste to Tableau
    if (state.waste.length > 0) {
        const topWaste = state.waste[state.waste.length - 1];
        for (let i = 0; i < 7; i++) {
            if (canMoveToTableau(topWaste, state.tableaus[i])) {
                moves.push({ type: 'wasteToTableau', toTableau: i });
            }
        }
    }

    // 4. Tableau to Tableau
    for (let i = 0; i < 7; i++) {
        const tableau = state.tableaus[i];
        for (let k = 0; k < tableau.length; k++) {
            const card = tableau[k];
            if (card.isFaceUp) {
                for (let j = 0; j < 7; j++) {
                    if (i !== j && canMoveToTableau(card, state.tableaus[j])) {
                        const isKingAtBottom = k === 0 && card.value === 13;
                        if (!isKingAtBottom) {
                            moves.push({ type: 'tableauToTableau', fromTableau: i, toTableau: j, count: tableau.length - k });
                        }
                    }
                }
            }
        }
    }

    // 5. Draw / Recycle
    if (state.stock.length > 0) {
        moves.push({ type: 'draw' });
    } else if (state.waste.length > 0) {
        moves.push({ type: 'recycle' });
    }

    return moves;
}

export function applyMove(originalState: GameState, move: GameMove, drawCount: number): GameState {
    const state = cloneState(originalState);

    switch (move.type) {
        case 'wasteToFoundation': {
            const card = state.waste.pop()!;
            state.foundations[move.foundationIndex].push(card);
            break;
        }
        case 'tableauToFoundation': {
            const card = state.tableaus[move.fromTableau].pop()!;
            state.foundations[move.foundationIndex].push(card);
            const tab = state.tableaus[move.fromTableau];
            if (tab.length > 0) tab[tab.length - 1].isFaceUp = true;
            break;
        }
        case 'wasteToTableau': {
            const card = state.waste.pop()!;
            state.tableaus[move.toTableau].push(card);
            break;
        }
        case 'tableauToTableau': {
            const fromTab = state.tableaus[move.fromTableau];
            const cards = fromTab.splice(fromTab.length - move.count, move.count);
            state.tableaus[move.toTableau].push(...cards);
            if (fromTab.length > 0) fromTab[fromTab.length - 1].isFaceUp = true;
            break;
        }
        case 'draw': {
            const drawn = state.stock.splice(-drawCount).reverse().map(c => ({ ...c, isFaceUp: true }));
            state.waste.push(...drawn);
            break;
        }
        case 'recycle': {
            state.stock = state.waste.reverse().map(c => ({ ...c, isFaceUp: false }));
            state.waste = [];
            break;
        }
    }

    state.moves++;
    return state;
}

// Deep search solver using Depth First Search with memoization (Generator)
// Yields the current number of iterations so the UI can update without freezing
export function* findWinningPath(initialState: GameState, drawCount: number, maxIterations: number = 30000): Generator<number, GameMove[] | null, void> {
    const visited = new Set<string>();

    // DFS Stack: [state, moveHistory]
    const stack: { state: GameState, path: GameMove[] }[] = [];
    stack.push({ state: initialState, path: [] });
    visited.add(hashState(initialState));

    let iterations = 0;

    while (stack.length > 0) {
        const { state, path } = stack.pop()!;

        if (checkWin(state.foundations)) {
            return path; // Found a win!
        }

        iterations++;
        if (iterations % 200 === 0) {
            yield iterations;
        }

        if (iterations > maxIterations) {
            return null; // Give up
        }

        const availableMoves = getValidMoves(state, drawCount);

        // DFS is LIFO. getValidMoves produces foundation moves first, then draw moves last.
        // Reverse the array so that foundation moves are pushed LAST and thus popped FIRST.
        // This heuristic heavily biases the solver towards making productive board-clearing moves.
        availableMoves.reverse();

        for (const move of availableMoves) {
            const nextState = applyMove(state, move, drawCount);
            const hash = hashState(nextState);

            if (!visited.has(hash)) {
                visited.add(hash);
                stack.push({ state: nextState, path: [...path, move] });
            }
        }
    }

    return null; // No winning path found
}

// Converts a backend solver move into a frontend UI hint
export function translateMoveToHint(state: GameState, move: GameMove): { from: string; to: string; card?: Card } {
    switch (move.type) {
        case 'draw':
        case 'recycle':
            return { from: 'stock', to: 'waste' };
        case 'wasteToFoundation':
            return { from: 'waste', to: `foundation-${move.foundationIndex}`, card: state.waste[state.waste.length - 1] };
        case 'wasteToTableau':
            return { from: 'waste', to: `tableau-${move.toTableau}`, card: state.waste[state.waste.length - 1] };
        case 'tableauToFoundation':
            return {
                from: `tableau-${move.fromTableau}`,
                to: `foundation-${move.foundationIndex}`,
                card: state.tableaus[move.fromTableau][state.tableaus[move.fromTableau].length - 1]
            };
        case 'tableauToTableau':
            return {
                from: `tableau-${move.fromTableau}`,
                to: `tableau-${move.toTableau}`,
                card: state.tableaus[move.fromTableau][state.tableaus[move.fromTableau].length - move.count]
            };
    }
}
