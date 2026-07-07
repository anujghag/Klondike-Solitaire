import React, { useEffect, useState } from 'react';
import { Suit, Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardMoveSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw } from 'lucide-react';
import { RANKS, randomSeed } from '../shared/cards';
import {
  SevensState, SEVENS_PLAYERS, SUITS,
  dealSevens, isPlayable, legalMoves, playCard, passTurn, chooseAiCard,
} from './logic';

interface SevensBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean, place: number) => void;
  onExit: () => void;
}

const SUIT_META: Record<Suit, { glyph: string; color: string }> = {
  hearts: { glyph: '♥', color: 'text-rose-400' },
  diamonds: { glyph: '♦', color: 'text-amber-400' },
  clubs: { glyph: '♣', color: 'text-emerald-400' },
  spades: { glyph: '♠', color: 'text-zinc-300' },
};

export const SevensBoard: React.FC<SevensBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<SevensState>(() => dealSevens(randomSeed()));
  const [reported, setReported] = useState(false);

  const myLegal = legalMoves(state, 0);

  // AI turns
  useEffect(() => {
    if (state.gameOver || state.turn === 0 || state.turn < 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.gameOver || prev.turn === 0 || prev.turn < 0) return prev;
        const card = chooseAiCard(prev, prev.turn);
        if (sfxEnabled && card) playCardMoveSound();
        return card ? playCard(prev, prev.turn, card) : passTurn(prev, prev.turn);
      });
    }, 750);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  // Report result once
  useEffect(() => {
    if (!state.gameOver || reported) return;
    setReported(true);
    const place = state.finished.indexOf(0) + 1;
    if (place === 1 && sfxEnabled) playVictorySound();
    onFinish(place === 1, place);
  }, [state.gameOver, reported, state.finished, onFinish, sfxEnabled]);

  const handlePlay = (cardId: string) => {
    if (state.turn !== 0 || state.gameOver) return;
    const card = state.hands[0].find(c => c.id === cardId);
    if (!card) return;
    if (!isPlayable(card, state.layout)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (sfxEnabled) playCardMoveSound();
    setState(prev => playCard(prev, 0, card));
  };

  const handlePass = () => {
    if (state.turn !== 0 || state.gameOver || myLegal.length > 0) return;
    setState(prev => passTurn(prev, 0));
  };

  const newGame = () => {
    setState(dealSevens(randomSeed()));
    setReported(false);
  };

  const myPlace = state.finished.indexOf(0) + 1;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Satte pe Satta"
        subtitle="सत्ते पे सत्ता · Sevens"
        stats={[{ label: 'Your cards', value: state.hands[0].length }]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Opponents */}
      <div className="flex justify-center gap-3 sm:gap-10 mb-4">
        {[1, 2, 3].map(p => (
          <PlayerSeat
            key={p}
            name={SEVENS_PLAYERS[p].name}
            avatar={SEVENS_PLAYERS[p].avatar}
            cardCount={state.hands[p].length}
            isTurn={state.turn === p}
            statusText={
              state.finished.includes(p)
                ? `Finished #${state.finished.indexOf(p) + 1}`
                : state.passStreak[p] ? 'Passed' : undefined
            }
          />
        ))}
      </div>

      {/* Ticker */}
      <div className="text-center text-white/70 text-xs sm:text-sm mb-3 h-5 font-medium">{state.lastAction}</div>

      {/* Suit tracks */}
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-1.5 sm:gap-2 mb-6 bg-black/25 rounded-2xl p-3 sm:p-4 backdrop-blur-sm ring-1 ring-white/10">
        {SUITS.map(suit => {
          const track = state.layout[suit];
          return (
            <div key={suit} className="flex items-center gap-2">
              <span className={`w-6 text-xl sm:text-2xl text-center ${SUIT_META[suit].color}`}>{SUIT_META[suit].glyph}</span>
              <div className="flex-1 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-0.5 sm:gap-1">
                {RANKS.map((rank, i) => {
                  const value = i + 1;
                  const played = !!track && value >= track.low && value <= track.high;
                  const isSeven = value === 7;
                  return (
                    <div
                      key={rank}
                      className={`h-6 sm:h-8 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300
                        ${played
                          ? `bg-white/90 text-zinc-900 shadow-md ${isSeven ? 'ring-2 ring-amber-400' : ''} scale-100`
                          : 'bg-white/5 text-white/25 scale-95'}`}
                    >
                      {rank}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Your hand */}
      <div className="mt-auto max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2 px-1">
          <PlayerSeat
            name="You" avatar="🧑" compact
            cardCount={state.hands[0].length}
            isTurn={state.turn === 0}
            isYou
            statusText={myPlace > 0 ? `Finished #${myPlace}` : undefined}
          />
          {state.turn === 0 && myLegal.length === 0 && !state.gameOver && state.hands[0].length > 0 && (
            <button
              onClick={handlePass}
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-full shadow-lg animate-pulse"
            >
              No moves — Pass
            </button>
          )}
        </div>
        <div className="flex justify-center">
          <div className="flex -space-x-6 sm:-space-x-8">
            {state.hands[0].map(card => {
              const playable = state.turn === 0 && isPlayable(card, state.layout);
              return (
                <div
                  key={card.id}
                  className={`w-14 sm:w-20 transition-transform duration-200 ${playable ? 'hover:-translate-y-4 cursor-pointer' : 'opacity-60'}`}
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

      {/* Game over overlay */}
      {state.gameOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{myPlace === 1 ? '🏆' : myPlace === 2 ? '🥈' : '🃏'}</div>
            <h2 className="text-2xl font-bold mb-1">{myPlace === 1 ? 'You won!' : `You finished #${myPlace}`}</h2>
            <p className="text-white/60 text-sm mb-5">Final standings</p>
            <ol className="text-left space-y-2 mb-6">
              {state.finished.map((p, i) => (
                <li key={p} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${p === 0 ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-white/5'}`}>
                  <span className="font-mono font-bold w-6">#{i + 1}</span>
                  <span className="text-xl">{SEVENS_PLAYERS[p].avatar}</span>
                  <span className="font-bold">{SEVENS_PLAYERS[p].name}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-3">
              <button onClick={newGame} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
                Play Again
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
