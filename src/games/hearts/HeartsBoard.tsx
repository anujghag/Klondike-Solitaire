import React, { useEffect, useState } from 'react';
import { Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { HandFan } from '../shared/HandFan';
import { playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw } from 'lucide-react';
import { randomSeed } from '../shared/cards';
import {
  HeartsState, HEARTS_PLAYERS,
  dealHearts, heartsLegalCards, heartsPlayCard, heartsCollectTrick, heartsChooseAiCard,
} from './logic';

interface HeartsBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean, shotMoon: boolean) => void;
  onExit: () => void;
}

const TRICK_POS: Record<number, string> = {
  0: 'bottom-0 left-1/2 -translate-x-1/2',
  1: 'right-0 top-1/2 -translate-y-1/2',
  2: 'top-0 left-1/2 -translate-x-1/2',
  3: 'left-0 top-1/2 -translate-y-1/2',
};

export const HeartsBoard: React.FC<HeartsBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<HeartsState>(() => dealHearts(randomSeed()));
  const [reported, setReported] = useState(false);

  const myLegal = state.turn === 0 ? heartsLegalCards(state, 0) : [];
  const legalIds = new Set(myLegal.map(c => c.id));

  // AI turns
  useEffect(() => {
    if (state.result || state.turn <= 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.result || prev.turn <= 0) return prev;
        const card = heartsChooseAiCard(prev, prev.turn);
        if (sfxEnabled) playCardMoveSound();
        return heartsPlayCard(prev, prev.turn, card);
      });
    }, 800);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  // Collect completed trick
  useEffect(() => {
    if (state.result || state.trick.length !== 4) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.trick.length !== 4 || prev.result) return prev;
        if (sfxEnabled) playCardPlaceSound();
        return heartsCollectTrick(prev);
      });
    }, 1300);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  useEffect(() => {
    if (!state.result || reported) return;
    setReported(true);
    const won = state.result.winner === 0;
    if (won && sfxEnabled) playVictorySound();
    onFinish(won, state.result.moonShooter === 0);
  }, [state.result, reported, onFinish, sfxEnabled]);

  const handlePlay = (cardId: string) => {
    if (state.turn !== 0 || state.result) return;
    const card = state.hands[0].find(c => c.id === cardId);
    if (!card || !legalIds.has(card.id)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (sfxEnabled) playCardMoveSound();
    setState(prev => heartsPlayCard(prev, 0, card));
  };

  const newGame = () => {
    setState(dealHearts(randomSeed()));
    setReported(false);
  };

  const result = state.result;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Hearts"
        subtitle="Avoid hearts & the Black Lady"
        stats={[
          { label: 'Your pts', value: state.points[0], accent: state.points[0] > 0 ? 'text-rose-400' : '' },
          { label: 'Hearts', value: state.heartsBroken ? 'broken' : 'safe' },
          { label: 'Trick', value: `${state.trickCount}/13` },
        ]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Table */}
      <div className="flex-1 max-w-3xl mx-auto w-full grid grid-rows-[auto_1fr] gap-2">
        <div className="flex justify-center">
          <PlayerSeat
            name={HEARTS_PLAYERS[2].name} avatar={HEARTS_PLAYERS[2].avatar}
            cardCount={state.hands[2].length} isTurn={state.turn === 2}
            statusText={`${state.points[2]} pts`}
          />
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <PlayerSeat
            name={HEARTS_PLAYERS[3].name} avatar={HEARTS_PLAYERS[3].avatar}
            cardCount={state.hands[3].length} isTurn={state.turn === 3}
            statusText={`${state.points[3]} pts`}
          />
          <div className="relative h-48 sm:h-64 bg-black/20 rounded-3xl ring-1 ring-white/10 backdrop-blur-sm">
            {state.trick.map(play => (
              <div key={play.card.id} className={`absolute ${TRICK_POS[play.player]} w-16 sm:w-24 p-1 transition-all duration-300`}>
                <Card
                  card={play.card}
                  theme={theme}
                  className={play.card.suit === 'hearts' || (play.card.suit === 'spades' && play.card.rank === 'Q') ? 'ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''}
                />
              </div>
            ))}
            {state.trick.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs sm:text-sm italic px-4 text-center">
                {state.lastTrickSummary}
              </div>
            )}
          </div>
          <PlayerSeat
            name={HEARTS_PLAYERS[1].name} avatar={HEARTS_PLAYERS[1].avatar}
            cardCount={state.hands[1].length} isTurn={state.turn === 1}
            statusText={`${state.points[1]} pts`}
          />
        </div>
      </div>

      <div className="text-center text-white/60 text-xs sm:text-sm my-2 h-5">
        {state.trick.length > 0 ? state.lastTrickSummary : ''}
      </div>

      {/* Your hand */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-2 flex justify-center">
          <PlayerSeat name="You" avatar="🧑" compact cardCount={state.hands[0].length} isTurn={state.turn === 0} isYou />
        </div>
        <HandFan
          cards={state.hands[0]}
          wrapperClass={card => {
            const playable = state.turn === 0 && legalIds.has(card.id);
            return playable ? 'hover:-translate-y-4 cursor-pointer' : state.turn === 0 ? 'opacity-50' : '';
          }}
          renderCard={card => {
            const playable = state.turn === 0 && legalIds.has(card.id);
            return (
              <Card
                card={card}
                theme={theme}
                onClick={() => handlePlay(card.id)}
                className={playable ? 'ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : ''}
              />
            );
          }}
        />
      </div>

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{result.moonShooter === 0 ? '🌙' : result.winner === 0 ? '🏆' : '💔'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {result.moonShooter === 0
                ? 'You shot the moon!'
                : result.moonShooter !== null
                  ? `${HEARTS_PLAYERS[result.moonShooter].name} shot the moon!`
                  : result.winner === 0 ? 'You win the hand!' : `${HEARTS_PLAYERS[result.winner].name} wins the hand`}
            </h2>
            <div className="space-y-1.5 my-4 text-left">
              {result.scores.map((s, i) => (
                <div key={i} className={`flex justify-between px-3 py-1.5 rounded-lg ${i === result.winner ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-white/5'}`}>
                  <span className="font-bold">{HEARTS_PLAYERS[i].avatar} {HEARTS_PLAYERS[i].name}</span>
                  <span className="font-mono">{s} pts</span>
                </div>
              ))}
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
