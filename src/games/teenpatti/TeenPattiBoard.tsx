import React, { useEffect, useState } from 'react';
import { Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardDealSound, playCardMoveSound, playCardPlaceSound, playVictorySound } from '../../utils/audio';
import { RotateCcw, Eye } from 'lucide-react';
import { randomSeed } from '../shared/cards';
import {
  TeenPattiState, dealTeenPatti, applyAction, chooseTeenPattiAction,
  costOf, handLabel, loadChips, saveChips, STARTING_CHIPS,
} from './logic';

interface TeenPattiBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean) => void;
  onExit: () => void;
}

export const TeenPattiBoard: React.FC<TeenPattiBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<TeenPattiState>(() => dealTeenPatti(loadChips(), randomSeed()));
  const [reported, setReported] = useState(false);

  const me = state.players[0];
  const isMyTurn = state.turn === 0 && !state.showdown;
  const twoLeft = state.players.filter(p => !p.folded).length === 2;

  // AI turns
  useEffect(() => {
    if (state.showdown || state.turn <= 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.showdown || prev.turn <= 0) return prev;
        let s = prev;
        const action = chooseTeenPattiAction(s, s.turn);
        if (action === 'see') {
          // Seeing is free — the AI then immediately acts on what it saw.
          s = applyAction(s, s.turn, 'see');
          const follow = chooseTeenPattiAction(s, s.turn);
          if (sfxEnabled) playCardMoveSound();
          return applyAction(s, s.turn, follow === 'see' ? 'call' : follow);
        }
        if (sfxEnabled) playCardMoveSound();
        return applyAction(s, s.turn, action);
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  // Persist chips + report result at showdown
  useEffect(() => {
    if (!state.showdown || reported) return;
    setReported(true);
    saveChips(state.players[0].chips);
    const won = state.showdown.winner === 0;
    if (won && sfxEnabled) playVictorySound();
    onFinish(won);
  }, [state.showdown, reported, onFinish, sfxEnabled, state.players]);

  const act = (action: Parameters<typeof applyAction>[2]) => {
    if (!isMyTurn) return;
    if (sfxEnabled) (action === 'see' ? playCardDealSound : playCardPlaceSound)();
    setState(prev => applyAction(prev, 0, action));
  };

  const newGame = () => {
    setState(dealTeenPatti(loadChips(), randomSeed()));
    setReported(false);
  };

  const seat = (i: number) => {
    const p = state.players[i];
    return (
      <div key={i} className={`flex flex-col items-center gap-1 ${p.folded ? 'opacity-40 grayscale' : ''}`}>
        <PlayerSeat
          name={p.name} avatar={p.avatar} cardCount={3}
          isTurn={state.turn === i && !state.showdown}
          statusText={p.folded ? 'Folded' : p.seen ? 'Seen' : 'Blind'}
        />
        <span className="text-amber-300 text-[11px] sm:text-xs font-mono font-bold">₹{p.chips}</span>
        <div className="flex -space-x-3">
          {p.hand.map(c => (
            <div key={c.id} className="w-8 sm:w-10">
              <Card card={{ ...c, isFaceUp: !!state.showdown && !p.folded }} theme={theme} />
            </div>
          ))}
        </div>
        {state.showdown && !p.folded && (
          <span className="text-[10px] text-white/70 font-bold">{handLabel(p.hand)}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Teen Patti"
        subtitle="तीन पत्ती · play-chips only"
        stats={[
          { label: 'Pot', value: `₹${state.pot}`, accent: 'text-amber-300' },
          { label: 'Stake', value: `₹${state.stake}` },
          { label: 'Your chips', value: `₹${me.chips}` },
        ]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Opponents */}
      <div className="flex justify-center gap-4 sm:gap-12 mb-4">{[1, 2, 3].map(seat)}</div>

      {/* Pot + log */}
      <div className="max-w-xl mx-auto w-full text-center mb-3">
        <div className="inline-flex items-center gap-2 bg-black/40 ring-1 ring-amber-400/40 rounded-full px-5 py-2 text-amber-300 font-bold shadow-[0_0_20px_rgba(251,191,36,0.15)]">
          🪙 Pot: ₹{state.pot}
        </div>
        <div className="mt-3 bg-black/25 rounded-xl p-2.5 ring-1 ring-white/10 backdrop-blur-sm text-left">
          {state.log.slice(-3).map((line, i, arr) => (
            <div key={i} className={`text-xs sm:text-sm ${i === arr.length - 1 ? 'text-white font-bold' : 'text-white/45'}`}>{line}</div>
          ))}
        </div>
      </div>

      {/* Your cards */}
      <div className="mt-auto max-w-xl mx-auto w-full flex flex-col items-center gap-3">
        <div className="flex -space-x-4">
          {me.hand.map(c => (
            <div key={c.id} className="w-20 sm:w-28">
              <Card card={{ ...c, isFaceUp: me.seen || !!state.showdown }} theme={theme} />
            </div>
          ))}
        </div>
        {me.seen && !state.showdown && (
          <span className="text-white/80 text-sm font-bold bg-black/40 px-3 py-1 rounded-full">{handLabel(me.hand)}</span>
        )}

        {/* Actions */}
        {isMyTurn && !me.folded && (
          <div className="flex flex-wrap justify-center gap-2">
            {!me.seen && (
              <button onClick={() => act('see')} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full flex items-center gap-1.5">
                <Eye size={15} /> See cards
              </button>
            )}
            <button onClick={() => act('call')} disabled={me.chips < costOf(state, 0, 'call')} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-full">
              {me.seen ? 'Chaal' : 'Blind'} ₹{costOf(state, 0, 'call')}
            </button>
            <button onClick={() => act('raise')} disabled={me.chips < costOf(state, 0, 'raise')} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold rounded-full">
              Raise ₹{costOf(state, 0, 'raise')}
            </button>
            {twoLeft && (
              <button onClick={() => act('show')} disabled={me.chips < costOf(state, 0, 'show')} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-full">
                Show ₹{costOf(state, 0, 'show')}
              </button>
            )}
            <button onClick={() => act('fold')} className="px-4 py-2.5 bg-white/10 hover:bg-rose-500 text-white font-bold rounded-full">
              Fold
            </button>
          </div>
        )}
        {me.folded && !state.showdown && (
          <span className="text-white/50 text-sm italic">You folded — watching the table…</span>
        )}
      </div>

      {/* Showdown overlay */}
      {state.showdown && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{state.showdown.winner === 0 ? '🏆' : '🪙'}</div>
            <h2 className="text-2xl font-bold mb-1">
              {state.showdown.winner === 0 ? `You win ₹${state.pot}!` : `${state.players[state.showdown.winner].name} wins ₹${state.pot}`}
            </h2>
            <p className="text-white/60 text-sm mb-2">({state.showdown.reason})</p>
            <p className="text-amber-300 font-mono font-bold mb-5">Your chips: ₹{me.chips}</p>
            {me.chips < 50 && (
              <p className="text-white/50 text-xs mb-3">Low on chips — the house tops you back up to ₹{STARTING_CHIPS} 🙂</p>
            )}
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
