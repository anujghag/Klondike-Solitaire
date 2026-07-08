import React, { useEffect, useMemo, useState } from 'react';
import { Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardDealSound, playCardMoveSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw, Sparkles } from 'lucide-react';
import { randomSeed } from '../shared/cards';
import {
  RummyState, RUMMY_PLAYERS,
  dealRummy, drawCard, discardCard, chooseAiDraw, chooseAiDiscard,
  winningDiscards, isWild,
} from './logic';

interface RummyBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean) => void;
  onExit: () => void;
}

export const RummyBoard: React.FC<RummyBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<RummyState>(() => dealRummy(randomSeed()));
  const [reported, setReported] = useState(false);

  const isMyTurn = state.turn === 0 && !state.result;
  const myHand = state.hands[0];

  // Winning discards (only when holding 14 in discard phase) — powers the "declare" glow.
  const winners = useMemo(
    () => (isMyTurn && state.phase === 'discard' && myHand.length === 14
      ? winningDiscards(myHand, state.wildRank)
      : new Set<string>()),
    [isMyTurn, state.phase, myHand, state.wildRank],
  );

  // AI turn: draw, then discard after a beat.
  useEffect(() => {
    if (state.result || state.turn !== 1) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.result || prev.turn !== 1) return prev;
        if (prev.phase === 'draw') {
          if (sfxEnabled) playCardDealSound();
          return drawCard(prev, 1, chooseAiDraw(prev));
        }
        if (sfxEnabled) playCardMoveSound();
        return discardCard(prev, 1, chooseAiDiscard(prev));
      });
    }, 900);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  useEffect(() => {
    if (!state.result || reported) return;
    setReported(true);
    const won = state.result.winner === 0;
    if (won && sfxEnabled) playVictorySound();
    onFinish(won);
  }, [state.result, reported, onFinish, sfxEnabled]);

  const handleDraw = (from: 'stock' | 'discard') => {
    if (!isMyTurn || state.phase !== 'draw') {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (sfxEnabled) playCardDealSound();
    setState(prev => drawCard(prev, 0, from));
  };

  const handleDiscard = (cardId: string) => {
    if (!isMyTurn || state.phase !== 'discard') return;
    if (sfxEnabled) playCardMoveSound();
    setState(prev => discardCard(prev, 0, cardId));
  };

  const newGame = () => {
    setState(dealRummy(randomSeed()));
    setReported(false);
  };

  const discardTop = state.discard[state.discard.length - 1];
  const result = state.result;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Indian Rummy"
        subtitle="13 cards · 2 sequences, 1 pure"
        stats={[
          { label: 'Wild', value: state.wildRank, accent: 'text-purple-300' },
          { label: 'Stock', value: state.stock.length },
          { label: 'Phase', value: isMyTurn ? state.phase : 'Anandi…' },
        ]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Opponent */}
      <div className="flex justify-center mb-4">
        <PlayerSeat
          name={RUMMY_PLAYERS[1].name} avatar={RUMMY_PLAYERS[1].avatar}
          cardCount={state.hands[1].length} isTurn={state.turn === 1}
          statusText="Rummy champion of the mohalla"
        />
      </div>

      {/* Table: stock, discard, wild card */}
      <div className="flex justify-center items-end gap-5 sm:gap-8 mb-3">
        <button onClick={() => handleDraw('stock')} className="relative group" aria-label="Draw from stock">
          <div
            className={`w-16 sm:w-24 aspect-[2/3] rounded-lg ring-1 ring-white/25 shadow-xl bg-zinc-800 overflow-hidden transition-transform ${isMyTurn && state.phase === 'draw' ? 'group-hover:-translate-y-1 ring-2 ring-amber-400/70' : ''}`}
            style={theme.cardBackImageUrl ? { backgroundImage: `url(${theme.cardBackImageUrl})`, backgroundSize: 'cover' } : undefined}
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Stock</span>
        </button>
        <div className="relative">
          <div className="w-16 sm:w-24">
            {discardTop ? (
              <Card
                card={discardTop}
                theme={theme}
                onClick={() => handleDraw('discard')}
                className={isMyTurn && state.phase === 'draw' ? 'cursor-pointer ring-2 ring-amber-400/70 hover:-translate-y-1' : ''}
              />
            ) : (
              <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-white/20" />
            )}
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Discard</span>
        </div>
        <div className="relative rotate-90 translate-y-[-6px]">
          <div className="w-14 sm:w-20">
            <Card card={state.wildCard} theme={theme} />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 -rotate-90 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Joker</span>
        </div>
      </div>

      <div className="text-center text-white/60 text-xs sm:text-sm mb-2 h-5">{state.message}</div>

      {winners.size > 0 && (
        <div className="flex justify-center mb-2">
          <span className="flex items-center gap-2 bg-emerald-500/20 ring-2 ring-emerald-400 text-emerald-200 text-sm font-bold px-4 py-1.5 rounded-full animate-pulse">
            <Sparkles size={15} /> You can declare — discard a glowing card!
          </span>
        </div>
      )}

      {/* Your hand */}
      <div className="mt-auto max-w-5xl mx-auto w-full">
        <div className="mb-2 flex justify-center">
          <PlayerSeat name="You" avatar="🧑" compact cardCount={myHand.length} isTurn={isMyTurn} isYou />
        </div>
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center -space-x-5 sm:-space-x-6">
            {myHand.map(card => {
              const wild = isWild(card, state.wildRank);
              const isWinner = winners.has(card.id);
              const canDiscard = isMyTurn && state.phase === 'discard';
              return (
                <div
                  key={card.id}
                  className={`w-12 sm:w-[4.4rem] transition-transform duration-150 ${canDiscard ? 'hover:-translate-y-3 cursor-pointer' : ''}`}
                >
                  <Card
                    card={card}
                    theme={theme}
                    onClick={() => handleDiscard(card.id)}
                    className={
                      isWinner ? 'ring-4 ring-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.6)] animate-pulse' :
                      wild ? 'ring-2 ring-purple-400/80 shadow-[0_0_10px_rgba(192,132,252,0.4)]' : ''
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-white/35 text-[11px] mt-2">
          {isMyTurn && state.phase === 'draw' ? 'Draw from the stock or the discard pile' :
           isMyTurn ? 'Tap a card to discard it' : ''}
        </p>
      </div>

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{result.winner === 0 ? '🏆' : '🃏'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {result.winner === 0 ? 'Rummy! You declared first!' : 'Anandi declared first'}
            </h2>
            {result.winner === 1 && (
              <div className="flex flex-wrap justify-center gap-1 my-3">
                {state.hands[1].map(c => (
                  <div key={c.id} className="w-9 sm:w-11"><Card card={c} theme={theme} /></div>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={newGame} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
                Next Deal
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
