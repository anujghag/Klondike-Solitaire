import React, { useEffect, useState } from 'react';
import { Rank, Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw, Swords } from 'lucide-react';
import { RANKS, randomSeed } from '../shared/cards';
import {
  BluffState, BLUFF_PLAYERS,
  dealBluff, playCards, passPlayer, challenge, chooseAiAction,
} from './logic';

interface BluffBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean) => void;
  onExit: () => void;
}

export const BluffBoard: React.FC<BluffBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<BluffState>(() => dealBluff(randomSeed()));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickingRank, setPickingRank] = useState(false);
  const [reported, setReported] = useState(false);

  const isMyTurn = state.turn === 0 && state.winner === null;
  const isRoundStart = state.currentRank === null;
  const canChallenge = isMyTurn && state.lastPlay !== null && state.lastPlay.player !== 0;
  const facingWinner = state.lastPlay !== null && state.pendingWinner === state.lastPlay.player && state.lastPlay.player !== 0;

  // AI turns — pause a beat longer when a reveal is showing so the player can read it.
  useEffect(() => {
    if (state.winner !== null || state.turn === 0 || state.turn < 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.winner !== null || prev.turn === 0 || prev.turn < 0) return prev;
        const action = chooseAiAction(prev, prev.turn);
        if (action.type === 'challenge') {
          if (sfxEnabled) playCardPlaceSound();
          return challenge(prev, prev.turn);
        }
        if (action.type === 'play') {
          if (sfxEnabled) playCardMoveSound();
          return playCards(prev, prev.turn, action.cards, action.rank);
        }
        return passPlayer(prev, prev.turn);
      });
    }, state.reveal ? 2200 : 1100);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  useEffect(() => {
    if (state.winner === null || reported) return;
    setReported(true);
    if (state.winner === 0 && sfxEnabled) playVictorySound();
    onFinish(state.winner === 0);
  }, [state.winner, reported, onFinish, sfxEnabled]);

  const toggleSelect = (id: string) => {
    if (!isMyTurn) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const submitPlay = (rank?: Rank) => {
    const cards = state.hands[0].filter(c => selected.has(c.id));
    if (cards.length === 0) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (isRoundStart && !rank) {
      setPickingRank(true);
      return;
    }
    if (sfxEnabled) playCardMoveSound();
    setState(prev => playCards(prev, 0, cards, rank));
    setSelected(new Set());
    setPickingRank(false);
  };

  const doPass = () => {
    if (!isMyTurn || isRoundStart) return;
    setSelected(new Set());
    setState(prev => passPlayer(prev, 0));
  };

  const doChallenge = () => {
    if (!canChallenge) return;
    if (sfxEnabled) playCardPlaceSound();
    setSelected(new Set());
    setState(prev => challenge(prev, 0));
  };

  const newGame = () => {
    setState(dealBluff(randomSeed()));
    setSelected(new Set());
    setReported(false);
    setPickingRank(false);
  };

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Bluff · Challenge"
        subtitle="चैलेंज · call their lies"
        stats={[
          { label: 'Round rank', value: state.currentRank ?? '—', accent: 'text-amber-300' },
          { label: 'Pile', value: state.pile.length },
        ]}
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
            name={BLUFF_PLAYERS[p].name}
            avatar={BLUFF_PLAYERS[p].avatar}
            cardCount={state.hands[p].length}
            isTurn={state.turn === p}
            statusText={state.lastPlay?.player === p ? `claimed ${state.lastPlay.claimCount} × ${state.currentRank}` : undefined}
          />
        ))}
      </div>

      {/* Center: pile + reveal + log */}
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center gap-3 mb-4">
        <div className="relative h-28 sm:h-36 flex items-center justify-center">
          {state.reveal ? (
            <div className={`flex gap-2 p-3 rounded-xl ${state.reveal.wasLie ? 'bg-red-500/20 ring-2 ring-red-500' : 'bg-emerald-500/20 ring-2 ring-emerald-500'}`}>
              {state.reveal.cards.map(c => (
                <div key={c.id} className="w-14 sm:w-20"><Card card={{ ...c, isFaceUp: true }} theme={theme} /></div>
              ))}
            </div>
          ) : state.pile.length > 0 ? (
            <div className="relative">
              {state.pile.slice(-5).map((c, i) => (
                <div
                  key={c.id}
                  className="w-16 sm:w-24 absolute top-0 left-1/2"
                  style={{ transform: `translateX(-50%) rotate(${(i - 2) * 7}deg) translateY(${-i * 2}px)`, zIndex: i }}
                >
                  <Card card={{ ...c, isFaceUp: false }} theme={theme} />
                </div>
              ))}
              <div className="w-16 sm:w-24 opacity-0"><div className="aspect-[2/3]" /></div>
              {state.lastPlay && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-amber-300 text-xs sm:text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  {BLUFF_PLAYERS[state.lastPlay.player].name}: “{state.lastPlay.claimCount} × {state.currentRank}”
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/30 text-sm italic">Empty table — new round</div>
          )}
        </div>

        <div className="w-full bg-black/25 rounded-xl p-2.5 sm:p-3 ring-1 ring-white/10 backdrop-blur-sm">
          {state.log.slice(-4).map((line, i, arr) => (
            <div key={i} className={`text-xs sm:text-sm ${i === arr.length - 1 ? 'text-white font-bold' : 'text-white/45'}`}>{line}</div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      {isMyTurn && (
        <div className="flex justify-center gap-2 sm:gap-3 mb-3 flex-wrap">
          {canChallenge && (
            <button
              onClick={doChallenge}
              className={`px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-full shadow-lg flex items-center gap-2 ${facingWinner ? 'animate-pulse ring-2 ring-red-300' : ''}`}
            >
              <Swords size={16} /> Challenge{facingWinner ? ' (last chance!)' : ''}!
            </button>
          )}
          {!facingWinner && (
            <button
              onClick={() => submitPlay()}
              disabled={selected.size === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-full shadow-lg"
            >
              {isRoundStart ? `Play ${selected.size || ''} & declare rank` : `Play ${selected.size || ''} as ${state.currentRank}`}
            </button>
          )}
          {!isRoundStart && (
            <button onClick={doPass} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full">
              Pass
            </button>
          )}
        </div>
      )}

      {/* Your hand */}
      <div className="mt-auto max-w-5xl mx-auto w-full">
        <div className="mb-2 flex justify-center">
          <PlayerSeat name="You" avatar="🧑" compact cardCount={state.hands[0].length} isTurn={isMyTurn} isYou />
        </div>
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center -space-x-5 sm:-space-x-7">
            {state.hands[0].map(card => (
              <div
                key={card.id}
                className={`w-12 sm:w-[4.5rem] transition-transform duration-150 cursor-pointer ${selected.has(card.id) ? '-translate-y-4' : 'hover:-translate-y-2'}`}
              >
                <Card
                  card={card}
                  theme={theme}
                  onClick={() => toggleSelect(card.id)}
                  className={selected.has(card.id) ? 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rank picker */}
      {pickingRank && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPickingRank(false)}>
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Declare a rank</h3>
            <p className="text-white/50 text-sm mb-4">You claim your {selected.size} face-down card{selected.size > 1 ? 's are all' : ' is a'} this rank — truth or bluff, up to you.</p>
            <div className="grid grid-cols-7 gap-2">
              {RANKS.map(rank => (
                <button
                  key={rank}
                  onClick={() => submitPlay(rank)}
                  className="py-2.5 bg-white/10 hover:bg-amber-500 hover:text-black rounded-lg font-bold transition-colors"
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Winner overlay */}
      {state.winner !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{state.winner === 0 ? '🏆' : '🎭'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {state.winner === 0 ? 'You out-bluffed the table!' : `${BLUFF_PLAYERS[state.winner].name} wins`}
            </h2>
            <p className="text-white/60 text-sm mb-6">{state.log[state.log.length - 1]}</p>
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
