import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { VictoryAnimation } from '../../components/VictoryAnimation';
import { ParticleOverlay, ParticleOverlayHandle } from '../../components/ParticleOverlay';
import { playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { Undo2, Lightbulb, RotateCcw, AlertTriangle, Zap } from 'lucide-react';
import {
  FreeCellState, FreeCellHint,
  dealFreeCell, canStackOn, canMoveToFoundation, isValidRun, maxRunSize,
  isFreeCellWon, isSafeAutoMove, getFreeCellHint, isFreeCellStuck,
} from './logic';
import { randomSeed } from '../shared/cards';

interface FreeCellBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  resumeState?: FreeCellState;
  onSaveState: (state: FreeCellState | null) => void;
  onWin: (stats: { time: number; moves: number; score: number }) => void;
  onExit: () => void;
}

type DragPayload = { zone: 'cascade' | 'free'; index: number; cardIndex: number };

export const FreeCellBoard: React.FC<FreeCellBoardProps> = ({
  theme, sfxEnabled, resumeState, onSaveState, onWin, onExit,
}) => {
  const [state, setState] = useState<FreeCellState>(() => resumeState ?? dealFreeCell(randomSeed()));
  const [history, setHistory] = useState<FreeCellState[]>([]);
  const [hint, setHint] = useState<FreeCellHint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const particleRef = useRef<ParticleOverlayHandle>(null);

  useEffect(() => {
    if (isWon) return;
    const t = setInterval(() => setState(prev => ({ ...prev, time: prev.time + 1 })), 1000);
    return () => clearInterval(t);
  }, [isWon]);

  useEffect(() => {
    if (!isWon) onSaveState(state);
  }, [state, isWon, onSaveState]);

  useEffect(() => {
    if (isFreeCellWon(state) && !isWon) {
      if (sfxEnabled) playVictorySound();
      setIsWon(true);
      onSaveState(null);
    }
  }, [state, isWon, sfxEnabled, onSaveState]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const stuck = !isWon && isFreeCellStuck(state);

  const commit = (next: FreeCellState, placedOnFoundation = false, at?: { x: number; y: number }) => {
    setHistory(prev => [...prev, state]);
    setHint(null);
    if (sfxEnabled) {
      if (placedOnFoundation) {
        playCardPlaceSound();
        if (at) particleRef.current?.emit(at.x, at.y, theme.id);
      } else {
        playCardMoveSound();
      }
    }
    setState({ ...next, moves: next.moves + 1 });
  };

  const clone = (s: FreeCellState): FreeCellState => ({
    ...s,
    cascades: s.cascades.map(c => [...c]),
    freeCells: [...s.freeCells],
    foundations: s.foundations.map(f => [...f]),
  });

  /** Remove the payload's cards from a cloned state; returns them or null if illegal. */
  const extract = (s: FreeCellState, p: DragPayload) => {
    if (p.zone === 'free') {
      const card = s.freeCells[p.index];
      if (!card) return null;
      s.freeCells[p.index] = null;
      return [card];
    }
    const cascade = s.cascades[p.index];
    if (p.cardIndex < 0 || p.cardIndex >= cascade.length) return null;
    if (!isValidRun(cascade, p.cardIndex)) return null;
    return cascade.splice(p.cardIndex);
  };

  const tryMoveToCascade = (p: DragPayload, to: number) => {
    const s = clone(state);
    const run = extract(s, p);
    if (!run) return false;
    const target = state.cascades[to];
    if (!canStackOn(run[0], target)) return false;
    if (run.length > maxRunSize(state, target.length === 0)) {
      setToast(`Not enough free cells to move ${run.length} cards`);
      return false;
    }
    s.cascades[to].push(...run);
    commit(s);
    return true;
  };

  const tryMoveToFoundation = (p: DragPayload, f: number, at?: { x: number; y: number }) => {
    const s = clone(state);
    const run = extract(s, p);
    if (!run || run.length !== 1) return false;
    if (!canMoveToFoundation(run[0], state.foundations[f])) return false;
    s.foundations[f].push(run[0]);
    commit(s, true, at);
    return true;
  };

  const tryMoveToFree = (p: DragPayload, cell: number) => {
    if (state.freeCells[cell] !== null) return false;
    const s = clone(state);
    const run = extract(s, p);
    if (!run || run.length !== 1) return false;
    s.freeCells[cell] = run[0];
    commit(s);
    return true;
  };

  const handleDrop = (e: React.DragEvent, zone: 'cascade' | 'foundation' | 'free', index: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const p: DragPayload = JSON.parse(data);
    const at = { x: e.clientX, y: e.clientY };
    const ok =
      zone === 'cascade' ? tryMoveToCascade(p, index) :
      zone === 'foundation' ? tryMoveToFoundation(p, index, at) :
      tryMoveToFree(p, index);
    if (!ok && sfxEnabled) playErrorSound();
  };

  /** Tap-to-move: foundation → cascade stack → free cell. */
  const quickMove = (p: DragPayload) => {
    const isSingle = p.zone === 'free' || p.cardIndex === state.cascades[p.index].length - 1;
    if (isSingle) {
      for (let f = 0; f < 4; f++) {
        const el = document.querySelector(`[data-fc-foundation="${f}"]`);
        const at = el ? (() => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : undefined;
        if (tryMoveToFoundation(p, f, at)) return;
      }
    }
    if (p.zone === 'cascade') {
      const run = state.cascades[p.index].slice(p.cardIndex);
      if (isValidRun(state.cascades[p.index], p.cardIndex)) {
        // Prefer non-empty targets
        for (const wantEmpty of [false, true]) {
          for (let j = 0; j < 8; j++) {
            if (j === p.index) continue;
            const target = state.cascades[j];
            if ((target.length === 0) !== wantEmpty) continue;
            if (!canStackOn(run[0], target)) continue;
            if (run.length > maxRunSize(state, target.length === 0)) continue;
            if (tryMoveToCascade(p, j)) return;
          }
        }
      }
    } else {
      for (let j = 0; j < 8; j++) {
        if (state.cascades[j].length > 0 && canStackOn(state.freeCells[p.index]!, state.cascades[j])) {
          if (tryMoveToCascade(p, j)) return;
        }
      }
    }
    if (isSingle && p.zone === 'cascade') {
      const cell = state.freeCells.findIndex(c => c === null);
      if (cell >= 0 && tryMoveToFree(p, cell)) return;
    }
    if (sfxEnabled) playErrorSound();
  };

  /** Auto-collect all currently safe foundation moves, animated. */
  const autoCollect = () => {
    const step = () => {
      setState(prev => {
        const s = clone(prev);
        // free cells first
        for (let i = 0; i < 4; i++) {
          const card = s.freeCells[i];
          if (card && isSafeAutoMove(card, s)) {
            for (let f = 0; f < 4; f++) {
              if (canMoveToFoundation(card, s.foundations[f])) {
                s.freeCells[i] = null;
                s.foundations[f].push(card);
                s.moves += 1;
                if (sfxEnabled) playCardPlaceSound();
                setTimeout(step, 90);
                return s;
              }
            }
          }
        }
        for (let i = 0; i < 8; i++) {
          const c = s.cascades[i];
          if (c.length === 0) continue;
          const card = c[c.length - 1];
          if (!isSafeAutoMove(card, s)) continue;
          for (let f = 0; f < 4; f++) {
            if (canMoveToFoundation(card, s.foundations[f])) {
              c.pop();
              s.foundations[f].push(card);
              s.moves += 1;
              if (sfxEnabled) playCardPlaceSound();
              setTimeout(step, 90);
              return s;
            }
          }
        }
        return prev;
      });
    };
    setHistory(prev => [...prev, state]);
    step();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setHint(null);
  };

  const handleNewGame = () => {
    setState(dealFreeCell(randomSeed()));
    setHistory([]);
    setHint(null);
    setIsWon(false);
  };

  const showHint = () => {
    const h = getFreeCellHint(state);
    setHint(h);
    if (!h) setToast('No moves available');
  };

  const dragStart = (e: React.DragEvent, p: DragPayload) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(p));
    e.dataTransfer.effectAllowed = 'move';
    setHint(null);
  };

  const hintMatches = (zone: string, index: number, cardIndex?: number) =>
    hint &&
    ((hint.from.zone === zone && hint.from.index === index && (cardIndex === undefined || hint.from.cardIndex === cardIndex)) ||
     (hint.to.zone === zone && hint.to.index === index && cardIndex === undefined));

  const foundationCount = state.foundations.reduce((a, f) => a + f.length, 0);

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-24 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="FreeCell"
        subtitle="Every deal solvable with skill"
        stats={[
          { label: 'Moves', value: state.moves },
          { label: 'Home', value: `${foundationCount}/52` },
        ]}
        onExit={onExit}
        banner={stuck ? (
          <button
            onClick={handleUndo}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce z-20"
          >
            <AlertTriangle size={14} /> NO MOVES LEFT — UNDO?
          </button>
        ) : undefined}
      >
        <HeaderButton onClick={handleUndo} disabled={history.length === 0}>
          <Undo2 size={18} /> <span className="hidden sm:inline">Undo</span>
        </HeaderButton>
        <HeaderButton onClick={showHint}>
          <Lightbulb size={18} /> <span className="hidden sm:inline">Hint</span>
        </HeaderButton>
        <HeaderButton onClick={autoCollect} className="!bg-emerald-500/80 hover:!bg-emerald-400">
          <Zap size={18} /> <span className="hidden sm:inline">Collect</span>
        </HeaderButton>
        <HeaderButton onClick={handleNewGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Free cells + foundations */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-8 gap-1 sm:gap-2 mb-4">
        {state.freeCells.map((card, i) => (
          <div
            key={`free-${i}`}
            onDrop={(e) => handleDrop(e, 'free', i)}
            onDragOver={(e) => e.preventDefault()}
            className={`aspect-[2/3] rounded-lg ${card ? '' : 'border-2 border-dashed border-sky-300/30 bg-sky-500/5'} ${hintMatches('free', i) ? 'ring-4 ring-yellow-400/60 animate-pulse' : ''}`}
          >
            {card && (
              <Card
                card={card}
                theme={theme}
                isDraggable
                onDragStart={(e) => dragStart(e, { zone: 'free', index: i, cardIndex: 0 })}
                onClick={() => quickMove({ zone: 'free', index: i, cardIndex: 0 })}
              />
            )}
          </div>
        ))}
        {state.foundations.map((foundation, i) => (
          <div
            key={`found-${i}`}
            data-fc-foundation={i}
            onDrop={(e) => handleDrop(e, 'foundation', i)}
            onDragOver={(e) => e.preventDefault()}
            className={`aspect-[2/3] rounded-lg ${foundation.length === 0 ? 'border-2 border-dashed border-amber-300/30 bg-amber-500/5 flex items-center justify-center' : ''} ${hintMatches('foundation', i) ? 'ring-4 ring-yellow-400/60 animate-pulse' : ''}`}
          >
            {foundation.length > 0 ? (
              <Card card={foundation[foundation.length - 1]} theme={theme} />
            ) : (
              <span className="text-amber-200/30 text-2xl font-bold select-none">A</span>
            )}
          </div>
        ))}
      </div>

      {/* 8 cascades */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-8 gap-1 sm:gap-2">
        {state.cascades.map((cascade, col) => (
          <div
            key={col}
            onDrop={(e) => handleDrop(e, 'cascade', col)}
            onDragOver={(e) => e.preventDefault()}
            className="col-span-1 min-h-[40vh]"
          >
            {cascade.length === 0 ? (
              <div className={`w-full aspect-[2/3] rounded-lg border-2 border-dashed border-white/20 bg-black/5 ${hintMatches('cascade', col) ? 'ring-4 ring-yellow-400/60 animate-pulse' : ''}`} />
            ) : (
              <div className="relative w-full">
                {cascade.map((card, j) => {
                  const isHintSource = hint?.from.zone === 'cascade' && hint.from.index === col && hint.from.cardIndex === j;
                  const isHintDest = hint?.to.zone === 'cascade' && hint.to.index === col && j === cascade.length - 1;
                  return (
                    <div key={card.id} className="absolute left-0 w-full" style={{ top: `${j * 16}%`, zIndex: j }}>
                      <Card
                        card={card}
                        theme={theme}
                        isDraggable={isValidRun(cascade, j)}
                        onDragStart={(e) => dragStart(e, { zone: 'cascade', index: col, cardIndex: j })}
                        onClick={() => quickMove({ zone: 'cascade', index: col, cardIndex: j })}
                        className={`${isHintSource ? 'ring-4 ring-yellow-400 animate-pulse' : ''} ${isHintDest ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-full shadow-xl z-40 backdrop-blur-sm">
          {toast}
        </div>
      )}

      {isWon && (
        <VictoryAnimation
          theme={theme}
          onComplete={() => onWin({ time: state.time, moves: state.moves, score: Math.max(0, 1000 - state.moves * 2) })}
        />
      )}
      <ParticleOverlay ref={particleRef} />
    </div>
  );
};
