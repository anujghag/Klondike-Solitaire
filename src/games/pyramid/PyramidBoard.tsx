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
  PyramidState, PyramidPick, dealPyramid, isExposed, pickCard, removePicks,
  drawPyramid, isPyramidWon, isPyramidLost, pyramidValue,
} from './logic';

interface PyramidBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onWin: (stats: { time: number; moves: number; score: number }) => void;
  onLose: () => void;
  onExit: () => void;
}

const samePick = (a: PyramidPick, b: PyramidPick) =>
  a.zone === b.zone && (a.zone !== 'pyramid' || b.zone !== 'pyramid' || a.index === b.index);

export const PyramidBoard: React.FC<PyramidBoardProps> = ({ theme, sfxEnabled, onWin, onLose, onExit }) => {
  const [state, setState] = useState<PyramidState>(() => dealPyramid(randomSeed()));
  const [history, setHistory] = useState<PyramidState[]>([]);
  const [selected, setSelected] = useState<PyramidPick | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [lostReported, setLostReported] = useState(false);
  const particleRef = useRef<ParticleOverlayHandle>(null);

  useEffect(() => {
    if (isWon) return;
    const t = setInterval(() => setState(prev => ({ ...prev, time: prev.time + 1 })), 1000);
    return () => clearInterval(t);
  }, [isWon]);

  useEffect(() => {
    if (isPyramidWon(state) && !isWon) {
      if (sfxEnabled) playVictorySound();
      setIsWon(true);
    }
  }, [state, isWon, sfxEnabled]);

  const lost = isPyramidLost(state);
  useEffect(() => {
    if (lost && !lostReported) {
      setLostReported(true);
      onLose();
    }
  }, [lost, lostReported, onLose]);

  const commit = (picks: PyramidPick[]) => {
    setHistory(prev => [...prev, state]);
    if (sfxEnabled) playCardMoveSound();
    setState(removePicks(state, picks));
    setSelected(null);
  };

  const handlePick = (pick: PyramidPick) => {
    const card = pickCard(state, pick);
    if (!card) return;
    if (pick.zone === 'pyramid' && !isExposed(state, pick.index)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    // Kings remove alone.
    if (pyramidValue(card) === 13) {
      commit([pick]);
      return;
    }
    if (!selected) {
      setSelected(pick);
      return;
    }
    if (samePick(selected, pick)) {
      setSelected(null);
      return;
    }
    const other = pickCard(state, selected);
    if (other && pyramidValue(card) + pyramidValue(other) === 13) {
      commit([selected, pick]);
    } else {
      if (sfxEnabled) playErrorSound();
      setSelected(pick);
    }
  };

  const handleDraw = () => {
    if (state.stock.length === 0 && (state.recycles === 0 || state.waste.length === 0)) return;
    setHistory(prev => [...prev, state]);
    if (sfxEnabled) playCardDealSound();
    setState(drawPyramid(state));
    setSelected(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
    setLostReported(false);
  };

  const newGame = () => {
    setState(dealPyramid(randomSeed()));
    setHistory([]);
    setSelected(null);
    setIsWon(false);
    setLostReported(false);
  };

  const wasteTop = state.waste[state.waste.length - 1];
  const remaining = state.slots.filter(s => !s.removed).length;
  const isSel = (p: PyramidPick) => selected !== null && samePick(selected, p);

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-10 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Pyramid"
        subtitle="Pair to 13 · Kings fly solo"
        stats={[
          { label: 'Score', value: state.score },
          { label: 'Left', value: remaining },
          { label: 'Recycles', value: state.recycles },
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

      {/* Pyramid */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="relative w-full" style={{ paddingBottom: '80%' }}>
          {state.slots.map((slot, i) => {
            if (slot.removed) return null;
            const exposed = isExposed(state, i);
            const pick: PyramidPick = { zone: 'pyramid', index: i };
            return (
              <div
                key={slot.card.id}
                className="absolute transition-all duration-200"
                style={{
                  left: `${50 - (slot.row * 6.75) + slot.col * 13.5 - 6.25}%`,
                  top: `${slot.row * 11.5}%`,
                  width: '12.5%',
                  zIndex: slot.row,
                }}
              >
                <Card
                  card={slot.card}
                  theme={theme}
                  onClick={() => handlePick(pick)}
                  className={`${isSel(pick) ? 'ring-4 ring-amber-400 -translate-y-1' : ''} ${exposed ? 'cursor-pointer hover:-translate-y-1' : 'brightness-[0.55]'}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock + waste */}
      <div className="flex justify-center items-end gap-6 mt-2">
        <button
          onClick={handleDraw}
          disabled={state.stock.length === 0 && (state.recycles === 0 || state.waste.length === 0)}
          className="relative disabled:opacity-40"
          aria-label="Draw from stock"
        >
          <div
            className="w-16 sm:w-24 aspect-[2/3] rounded-lg ring-1 ring-white/25 shadow-xl bg-zinc-800 overflow-hidden flex items-center justify-center"
            style={theme.cardBackImageUrl && state.stock.length > 0 ? { backgroundImage: `url(${theme.cardBackImageUrl})`, backgroundSize: 'cover' } : undefined}
          >
            {state.stock.length === 0 && <span className="text-white/40 text-xl">↻</span>}
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {state.stock.length}
          </span>
        </button>
        <div className="w-16 sm:w-24">
          {wasteTop ? (
            <Card
              card={{ ...wasteTop, isFaceUp: true }}
              theme={theme}
              onClick={() => handlePick({ zone: 'waste' })}
              className={`cursor-pointer ${isSel({ zone: 'waste' }) ? 'ring-4 ring-amber-400 -translate-y-1' : ''}`}
            />
          ) : (
            <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-white/20" />
          )}
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
