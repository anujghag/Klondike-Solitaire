import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { VictoryAnimation } from '../../components/VictoryAnimation';
import { ParticleOverlay, ParticleOverlayHandle } from '../../components/ParticleOverlay';
import { playCardDealSound, playCardMoveSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { Undo2, RotateCcw, AlertTriangle } from 'lucide-react';
import { randomSeed } from '../shared/cards';
import {
  TriPeaksState, dealTriPeaks, isFree, isAdjacentRank, playSlot, drawFromStock,
  isTriPeaksWon, isTriPeaksLost,
} from './logic';

interface TriPeaksBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onWin: (stats: { time: number; moves: number; score: number }) => void;
  onLose: () => void;
  onExit: () => void;
}

export const TriPeaksBoard: React.FC<TriPeaksBoardProps> = ({ theme, sfxEnabled, onWin, onLose, onExit }) => {
  const [state, setState] = useState<TriPeaksState>(() => dealTriPeaks(randomSeed()));
  const [history, setHistory] = useState<TriPeaksState[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [lostReported, setLostReported] = useState(false);
  const particleRef = useRef<ParticleOverlayHandle>(null);

  useEffect(() => {
    if (isWon) return;
    const t = setInterval(() => setState(prev => ({ ...prev, time: prev.time + 1 })), 1000);
    return () => clearInterval(t);
  }, [isWon]);

  useEffect(() => {
    if (isTriPeaksWon(state) && !isWon) {
      if (sfxEnabled) playVictorySound();
      setIsWon(true);
    }
  }, [state, isWon, sfxEnabled]);

  const lost = isTriPeaksLost(state);
  useEffect(() => {
    if (lost && !lostReported) {
      setLostReported(true);
      onLose();
    }
  }, [lost, lostReported, onLose]);

  const wasteTop = state.waste[state.waste.length - 1];

  const handleSlotClick = (index: number) => {
    if (!isFree(state, index) || !isAdjacentRank(state.slots[index].card, wasteTop)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    setHistory(prev => [...prev, state]);
    if (sfxEnabled) playCardMoveSound();
    const next = playSlot(state, index);
    if (next.streak >= 3) {
      const el = document.querySelector(`[data-peak-slot="${index}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        particleRef.current?.emit(r.left + r.width / 2, r.top + r.height / 2, theme.id);
      }
    }
    setState(next);
  };

  const handleDraw = () => {
    if (state.stock.length === 0) return;
    setHistory(prev => [...prev, state]);
    if (sfxEnabled) playCardDealSound();
    setState(drawFromStock(state));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setLostReported(false);
  };

  const newGame = () => {
    setState(dealTriPeaks(randomSeed()));
    setHistory([]);
    setIsWon(false);
    setLostReported(false);
  };

  const remaining = state.slots.filter(s => !s.removed).length;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-10 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="TriPeaks"
        subtitle="Clear the three peaks"
        stats={[
          { label: 'Score', value: state.score },
          { label: 'Streak', value: state.streak > 0 ? `×${state.streak}` : '—', accent: state.streak >= 3 ? 'text-amber-300' : '' },
          { label: 'Left', value: remaining },
        ]}
        onExit={onExit}
        banner={lost ? (
          <button
            onClick={handleUndo}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce z-20"
          >
            <AlertTriangle size={14} /> OUT OF MOVES — UNDO?
          </button>
        ) : undefined}
      >
        <HeaderButton onClick={handleUndo} disabled={history.length === 0}>
          <Undo2 size={18} /> <span className="hidden sm:inline">Undo</span>
        </HeaderButton>
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Peaks board: absolute layout on a 10-unit grid */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="relative w-full" style={{ paddingBottom: '58%' }}>
          {state.slots.map((slot, i) => {
            if (slot.removed) return null;
            const free = isFree(state, i);
            const playable = free && isAdjacentRank(slot.card, wasteTop);
            return (
              <div
                key={slot.card.id}
                data-peak-slot={i}
                className="absolute transition-all duration-200"
                style={{
                  left: `${slot.col * 9.4}%`,
                  top: `${slot.row * 21}%`,
                  width: '10.5%',
                  zIndex: slot.row,
                }}
              >
                <Card
                  card={slot.card}
                  theme={theme}
                  onClick={() => handleSlotClick(i)}
                  className={playable ? 'ring-2 ring-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.5)] cursor-pointer hover:-translate-y-1' : free ? 'cursor-pointer' : ''}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock + waste */}
      <div className="flex justify-center items-end gap-6 mt-4">
        <button onClick={handleDraw} disabled={state.stock.length === 0} className="relative disabled:opacity-40" aria-label="Draw from stock">
          <div
            className="w-16 sm:w-24 aspect-[2/3] rounded-lg ring-1 ring-white/25 shadow-xl bg-zinc-800 overflow-hidden"
            style={theme.cardBackImageUrl ? { backgroundImage: `url(${theme.cardBackImageUrl})`, backgroundSize: 'cover' } : undefined}
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {state.stock.length}
          </span>
        </button>
        <div className="w-16 sm:w-24">
          <Card card={wasteTop} theme={theme} />
        </div>
      </div>

      {isWon && (
        <VictoryAnimation
          theme={theme}
          onComplete={() => onWin({ time: state.time, moves: state.moves, score: state.score })}
        />
      )}
      <ParticleOverlay ref={particleRef} />
    </div>
  );
};
