import React, { useEffect, useState } from 'react';
import { Suit, Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw } from 'lucide-react';
import { randomSeed } from '../shared/cards';
import {
  MendikotState, MENDIKOT_PLAYERS,
  dealMendikot, legalCards, playTrickCard, collectTrick, chooseAiTrickCard, teamOf,
} from './logic';

interface MendikotBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean, isMendikot: boolean) => void;
  onExit: () => void;
}

const SUIT_GLYPH: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

/** Center-table position for each seat's played card. */
const TRICK_POS: Record<number, string> = {
  0: 'bottom-0 left-1/2 -translate-x-1/2',
  1: 'right-0 top-1/2 -translate-y-1/2',
  2: 'top-0 left-1/2 -translate-x-1/2',
  3: 'left-0 top-1/2 -translate-y-1/2',
};

export const MendikotBoard: React.FC<MendikotBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<MendikotState>(() => dealMendikot(randomSeed()));
  const [reported, setReported] = useState(false);

  const myLegal = state.turn === 0 ? legalCards(state, 0) : [];
  const legalIds = new Set(myLegal.map(c => c.id));

  // AI turns
  useEffect(() => {
    if (state.result || state.turn <= 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.result || prev.turn <= 0) return prev;
        const card = chooseAiTrickCard(prev, prev.turn);
        if (sfxEnabled) playCardMoveSound();
        return playTrickCard(prev, prev.turn, card);
      });
    }, 800);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  // Collect completed tricks after a readable pause
  useEffect(() => {
    if (state.result || state.trick.length !== 4) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.trick.length !== 4 || prev.result) return prev;
        if (sfxEnabled && prev.trick.some(p => p.card.value === 10)) playCardPlaceSound();
        return collectTrick(prev);
      });
    }, 1300);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  // Report the hand result once
  useEffect(() => {
    if (!state.result || reported) return;
    setReported(true);
    const won = state.result.winningTeam === 0;
    if (won && sfxEnabled) playVictorySound();
    onFinish(won, state.result.isMendikot);
  }, [state.result, reported, onFinish, sfxEnabled]);

  const handlePlay = (cardId: string) => {
    if (state.turn !== 0 || state.result) return;
    const card = state.hands[0].find(c => c.id === cardId);
    if (!card || !legalIds.has(card.id)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (sfxEnabled) playCardMoveSound();
    setState(prev => playTrickCard(prev, 0, card));
  };

  const newGame = () => {
    setState(dealMendikot(randomSeed()));
    setReported(false);
  };

  const result = state.result;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Mendikot"
        subtitle="मेंढीकोट · capture the tens"
        stats={[
          { label: 'Trump', value: SUIT_GLYPH[state.trump], accent: state.trump === 'hearts' || state.trump === 'diamonds' ? 'text-rose-400' : 'text-zinc-200' },
          { label: 'Tens', value: `${state.tensWon[0]} : ${state.tensWon[1]}` },
          { label: 'Tricks', value: `${state.tricksWon[0]} : ${state.tricksWon[1]}` },
        ]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Team banner */}
      <div className="flex justify-center gap-4 text-[11px] sm:text-xs mb-3">
        <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40 font-bold">
          🔵 You + Asha — {state.tensWon[0]} tens
        </span>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40 font-bold">
          🔴 Ravi + Suresh — {state.tensWon[1]} tens
        </span>
      </div>

      {/* Table: partner top, opponents left/right, trick center */}
      <div className="flex-1 max-w-3xl mx-auto w-full grid grid-rows-[auto_1fr] gap-2">
        <div className="flex justify-center">
          <PlayerSeat
            name={MENDIKOT_PLAYERS[2].name} avatar={MENDIKOT_PLAYERS[2].avatar}
            cardCount={state.hands[2].length} isTurn={state.turn === 2}
            statusText="Partner" teamColor="ring-sky-400/50"
          />
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <PlayerSeat
            name={MENDIKOT_PLAYERS[3].name} avatar={MENDIKOT_PLAYERS[3].avatar}
            cardCount={state.hands[3].length} isTurn={state.turn === 3}
            teamColor="ring-rose-400/40"
          />
          {/* Trick area */}
          <div className="relative h-48 sm:h-64 bg-black/20 rounded-3xl ring-1 ring-white/10 backdrop-blur-sm">
            {state.trick.map(play => (
              <div key={play.card.id} className={`absolute ${TRICK_POS[play.player]} w-16 sm:w-24 p-1 transition-all duration-300`}>
                <Card card={play.card} theme={theme} className={play.card.value === 10 ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''} />
              </div>
            ))}
            {state.trick.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs sm:text-sm italic px-4 text-center">
                {state.lastTrickSummary}
              </div>
            )}
          </div>
          <PlayerSeat
            name={MENDIKOT_PLAYERS[1].name} avatar={MENDIKOT_PLAYERS[1].avatar}
            cardCount={state.hands[1].length} isTurn={state.turn === 1}
            teamColor="ring-rose-400/40"
          />
        </div>
      </div>

      {/* Ticker + captured tens */}
      <div className="flex justify-center items-center gap-3 my-2 text-white/60 text-xs sm:text-sm h-6">
        <span>{state.trick.length > 0 ? state.lastTrickSummary : ''}</span>
        {state.capturedTens.length > 0 && (
          <span className="flex gap-1">
            {state.capturedTens.map(({ card, team }) => (
              <span key={card.id} className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${team === 0 ? 'bg-sky-500/30 text-sky-100' : 'bg-rose-500/30 text-rose-100'}`}>
                10{SUIT_GLYPH[card.suit]}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Your hand */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-2 flex justify-center">
          <PlayerSeat
            name="You" avatar="🧑" compact cardCount={state.hands[0].length}
            isTurn={state.turn === 0} isYou teamColor="ring-sky-400/50"
          />
        </div>
        <div className="flex justify-center">
          <div className="flex -space-x-6 sm:-space-x-8">
            {state.hands[0].map(card => {
              const playable = state.turn === 0 && legalIds.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`w-14 sm:w-20 transition-transform duration-200 ${playable ? 'hover:-translate-y-4 cursor-pointer' : state.turn === 0 ? 'opacity-50' : ''}`}
                >
                  <Card
                    card={card}
                    theme={theme}
                    onClick={() => handlePlay(card.id)}
                    className={playable ? 'ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : ''}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hand result overlay */}
      {result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">
              {result.winningTeam === 0 ? (result.isMendikot ? '👑' : '🏆') : '⚔️'}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {result.winningTeam === 0 ? 'Your team wins!' : 'Ravi & Suresh win'}
            </h2>
            {result.isMendikot && <p className="text-amber-300 font-bold mb-1">MENDIKOT — all four tens!</p>}
            {result.isWhitewash && <p className="text-amber-300 font-bold mb-1">WHITEWASH — all 13 tricks!</p>}
            <div className="flex justify-center gap-6 my-4 text-sm">
              <div>
                <div className="text-white/50 uppercase text-[10px] tracking-wider">Tens</div>
                <div className="font-mono font-bold text-xl">{result.tens[0]} : {result.tens[1]}</div>
              </div>
              <div>
                <div className="text-white/50 uppercase text-[10px] tracking-wider">Tricks</div>
                <div className="font-mono font-bold text-xl">{result.tricks[0]} : {result.tricks[1]}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={newGame} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
                Next Hand
              </button>
              <button onClick={onExit} className="flex-1 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-xl transition-colors">
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
