import { Card } from '../../types';
import { buildDeck, shuffle } from '../shared/cards';

/**
 * Teen Patti (तीन पत्ती) — play-money chips only, no real-money anything.
 * Simplified table rules: boot 10, blind bets ×1, seen bets ×2 (chaal),
 * raise doubles the stake, show available when two players remain.
 */

export const BOOT = 10;
export const STARTING_CHIPS = 1000;

export interface TPPlayer {
  name: string;
  avatar: string;
  hand: Card[];
  chips: number;
  folded: boolean;
  seen: boolean;
  betThisGame: number;
}

export interface TeenPattiState {
  players: TPPlayer[];   // 0 = you
  pot: number;
  stake: number;         // current blind unit
  turn: number;
  actions: number;       // total actions taken (forces showdown eventually)
  log: string[];
  showdown: { winner: number; reason: string } | null;
}

const AI_SEATS = [
  { name: 'Raju', avatar: '🧔🏽' },
  { name: 'Simran', avatar: '👩🏽' },
  { name: 'Bunty', avatar: '👨🏽‍🦱' },
];

export function value14(card: Card): number {
  return card.value === 1 ? 14 : card.value;
}

/**
 * Hand score, higher wins.
 * Category (millions): 6 trail, 5 pure sequence, 4 sequence, 3 color, 2 pair, 1 high card.
 */
export function handScore(hand: Card[]): number {
  const vals = hand.map(value14).sort((a, b) => b - a); // descending
  const [a, b, c] = vals;
  const isTrio = a === b && b === c;
  const flush = hand[0].suit === hand[1].suit && hand[1].suit === hand[2].suit;
  // Sequence detection with A-2-3 ranking just under A-K-Q (doubled scale).
  let seqHigh = 0;
  if (a === b + 1 && b === c + 1) seqHigh = a * 2;                 // normal run
  else if (a === 14 && b === 3 && c === 2) seqHigh = 27;           // A-2-3
  const kickers = a * 10000 + b * 100 + c;
  if (isTrio) return 6_000_000 + a;
  if (seqHigh && flush) return 5_000_000 + seqHigh;
  if (seqHigh) return 4_000_000 + seqHigh;
  if (flush) return 3_000_000 + kickers;
  if (a === b || b === c) {
    const pairVal = a === b ? a : b;
    const kicker = a === b ? c : a;
    return 2_000_000 + pairVal * 100 + kicker;
  }
  return 1_000_000 + kickers;
}

export function handLabel(hand: Card[]): string {
  const s = handScore(hand);
  if (s >= 6_000_000) return 'Trail!';
  if (s >= 5_000_000) return 'Pure Sequence';
  if (s >= 4_000_000) return 'Sequence';
  if (s >= 3_000_000) return 'Color';
  if (s >= 2_000_000) return 'Pair';
  return 'High Card';
}

function pushLog(log: string[], entry: string): string[] {
  return [...log.slice(-4), entry];
}

export function loadChips(): number {
  const raw = localStorage.getItem('teenpatti_chips');
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= BOOT ? n : STARTING_CHIPS;
}

export function saveChips(chips: number): void {
  // Going (nearly) bust tops the player back up — it's play money, keep it fun.
  const next = chips < BOOT * 5 ? STARTING_CHIPS : chips;
  localStorage.setItem('teenpatti_chips', String(next));
}

export function dealTeenPatti(yourChips: number, seed?: number): TeenPattiState {
  const deck = shuffle(buildDeck({ faceUp: true }), seed);
  const mk = (name: string, avatar: string, chips: number): TPPlayer => ({
    name, avatar, chips: chips - BOOT, folded: false, seen: false, betThisGame: BOOT,
    hand: [deck.pop()!, deck.pop()!, deck.pop()!],
  });
  const players = [
    mk('You', '🧑', yourChips),
    mk(AI_SEATS[0].name, AI_SEATS[0].avatar, STARTING_CHIPS),
    mk(AI_SEATS[1].name, AI_SEATS[1].avatar, STARTING_CHIPS),
    mk(AI_SEATS[2].name, AI_SEATS[2].avatar, STARTING_CHIPS),
  ];
  return {
    players,
    pot: BOOT * 4,
    stake: BOOT,
    turn: 0,
    actions: 0,
    log: [`Boot ₹${BOOT} each — pot ₹${BOOT * 4}. Play blind or see your cards!`],
    showdown: null,
  };
}

function activePlayers(state: TeenPattiState): number[] {
  return state.players.map((p, i) => (p.folded ? -1 : i)).filter(i => i >= 0);
}

function nextTurn(state: TeenPattiState, from: number): number {
  let p = from;
  for (let i = 0; i < 4; i++) {
    p = (p + 1) % 4;
    if (!state.players[p].folded) return p;
  }
  return from;
}

function endByLastStanding(state: TeenPattiState): TeenPattiState {
  const alive = activePlayers(state);
  const winner = alive[0];
  const players = state.players.map((p, i) => i === winner ? { ...p, chips: p.chips + state.pot } : p);
  return {
    ...state,
    players,
    showdown: { winner, reason: 'everyone else folded' },
    log: pushLog(state.log, `🏆 ${state.players[winner].name} takes ₹${state.pot} — all others folded`),
    turn: -1,
  };
}

export function resolveShowdown(state: TeenPattiState, reason: string): TeenPattiState {
  const alive = activePlayers(state);
  let winner = alive[0];
  for (const i of alive.slice(1)) {
    if (handScore(state.players[i].hand) > handScore(state.players[winner].hand)) winner = i;
  }
  const players = state.players.map((p, i) => i === winner ? { ...p, chips: p.chips + state.pot } : p);
  return {
    ...state,
    players,
    showdown: { winner, reason },
    log: pushLog(state.log, `🏆 ${state.players[winner].name} wins ₹${state.pot} with ${handLabel(state.players[winner].hand)}`),
    turn: -1,
  };
}

export type TPAction = 'see' | 'call' | 'raise' | 'fold' | 'show';

export function costOf(state: TeenPattiState, player: number, action: 'call' | 'raise' | 'show'): number {
  const seen = state.players[player].seen;
  if (action === 'show') return state.stake * 2;
  const base = seen ? state.stake * 2 : state.stake;
  return action === 'raise' ? base * 2 : base;
}

export function applyAction(state: TeenPattiState, player: number, action: TPAction): TeenPattiState {
  const p = state.players[player];
  const name = p.name;

  if (action === 'see') {
    const players = state.players.map((pl, i) => i === player ? { ...pl, seen: true } : pl);
    return { ...state, players, log: pushLog(state.log, `${name} looked at their cards`) };
  }

  if (action === 'fold') {
    const players = state.players.map((pl, i) => i === player ? { ...pl, folded: true } : pl);
    let next = { ...state, players, actions: state.actions + 1, log: pushLog(state.log, `${name} folded`) };
    if (activePlayers(next).length === 1) return endByLastStanding(next);
    return { ...next, turn: nextTurn(next, player) };
  }

  if (action === 'show') {
    const cost = Math.min(costOf(state, player, 'show'), p.chips);
    const players = state.players.map((pl, i) => i === player ? { ...pl, chips: pl.chips - cost, betThisGame: pl.betThisGame + cost } : pl);
    const withPot = { ...state, players, pot: state.pot + cost, actions: state.actions + 1, log: pushLog(state.log, `${name} paid ₹${cost} for a show!`) };
    return resolveShowdown(withPot, 'show');
  }

  // call / raise
  const cost = Math.min(costOf(state, player, action), p.chips);
  const stake = action === 'raise' ? state.stake * 2 : state.stake;
  const players = state.players.map((pl, i) => i === player ? { ...pl, chips: pl.chips - cost, betThisGame: pl.betThisGame + cost } : pl);
  const next: TeenPattiState = {
    ...state,
    players,
    pot: state.pot + cost,
    stake,
    actions: state.actions + 1,
    log: pushLog(state.log, `${name} ${action === 'raise' ? `raised to ₹${cost}` : `bet ₹${cost}`}${p.seen ? '' : ' (blind)'}`),
  };
  // Long games force a showdown so the pot can't spiral forever.
  if (next.actions >= 16) return resolveShowdown(next, 'table limit — cards on the table');
  return { ...next, turn: nextTurn(next, player) };
}

/** AI: strength-driven with pot pressure and a dash of unpredictability. */
export function chooseTeenPattiAction(state: TeenPattiState, player: number): TPAction {
  const p = state.players[player];
  const alive = activePlayers(state).length;

  if (!p.seen) {
    // Blind play is cheap — mostly continue, sometimes look.
    if (Math.random() < 0.45) return 'see';
    if (p.chips < state.stake * 2) return 'fold';
    return Math.random() < 0.15 ? 'raise' : 'call';
  }

  const score = handScore(p.hand);
  const strength =
    score >= 4_000_000 ? 1 :        // sequence or better
    score >= 2_000_000 ? 0.65 :     // pair / color
    score >= 1_120_000 ? 0.4 :      // decent high card (Q high+)
    0.2;
  const cost = costOf(state, player, 'call');
  const pressure = cost / Math.max(p.chips, 1);

  if (alive === 2 && strength >= 0.65 && Math.random() < 0.5) return 'show';
  if (strength >= 0.9) return Math.random() < 0.6 ? 'raise' : 'call';
  if (strength >= 0.6) return Math.random() < 0.2 ? 'raise' : 'call';
  if (strength >= 0.4) return pressure > 0.25 ? 'fold' : 'call';
  // Weak: occasional bluff raise, mostly fold under pressure.
  if (Math.random() < 0.08) return 'raise';
  return pressure > 0.12 || Math.random() < 0.5 ? 'fold' : 'call';
}
