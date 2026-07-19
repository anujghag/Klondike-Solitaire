import React, { useEffect, useRef, useState } from 'react';
import { Card as CardType, Theme } from '../../types';
import { Card, CardBackContent } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { VictoryAnimation } from '../../components/VictoryAnimation';
import { ParticleOverlay, ParticleOverlayHandle } from '../../components/ParticleOverlay';
import { playCardDealSound, playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { Undo2, Lightbulb, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  SpiderState, SpiderSuits, SpiderHint,
  dealSpider, canPickUpRun, canDropOn, canDealFromStock,
  applySpiderMove, applySpiderDeal, isSpiderWon, getSpiderHint, isSpiderStuck,
} from './logic';
import { randomSeed } from '../shared/cards';

interface SpiderBoardProps {
  theme: Theme;
  suitCount: SpiderSuits;
  sfxEnabled: boolean;
  resumeState?: SpiderState;
  onSaveState: (state: SpiderState | null) => void;
  onWin: (stats: { time: number; moves: number; score: number }) => void;
  onExit: () => void;
}

const SUIT_LABEL: Record<SpiderSuits, string> = { 1: '1 Suit', 2: '2 Suits', 4: '4 Suits' };

export const SpiderBoard: React.FC<SpiderBoardProps> = ({
  theme, suitCount, sfxEnabled, resumeState, onSaveState, onWin, onExit,
}) => {
  const [state, setState] = useState<SpiderState>(() => resumeState ?? dealSpider(suitCount, randomSeed()));
  const [history, setHistory] = useState<SpiderState[]>([]);
  const [hint, setHint] = useState<SpiderHint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const particleRef = useRef<ParticleOverlayHandle>(null);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const t = setInterval(() => setState(prev => ({ ...prev, time: prev.time + 1 })), 1000);
    return () => clearInterval(t);
  }, [isWon]);

  // Auto-save on every state change (cleared on win)
  useEffect(() => {
    if (!isWon) onSaveState(state);
  }, [state, isWon, onSaveState]);

  // Win detection
  useEffect(() => {
    if (isSpiderWon(state) && !isWon) {
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

  const stuck = !isWon && isSpiderStuck(state);

  const pushHistory = (s: SpiderState) => setHistory(prev => [...prev, s]);

  const doMove = (from: number, index: number, to: number) => {
    pushHistory(state);
    setHint(null);
    const beforeRuns = state.completedRuns.length;
    const next = applySpiderMove(state, from, index, to);
    if (sfxEnabled) {
      if (next.completedRuns.length > beforeRuns) {
        playCardPlaceSound();
        const el = document.querySelector(`[data-spider-col="${to}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          particleRef.current?.emit(r.left + r.width / 2, r.top + 60, theme.id);
        }
      } else {
        playCardMoveSound();
      }
    }
    setState(next);
  };

  const handleDeal = () => {
    const check = canDealFromStock(state);
    if (!check.ok) {
      setToast(check.reason ?? 'Cannot deal');
      if (sfxEnabled) playErrorSound();
      return;
    }
    pushHistory(state);
    setHint(null);
    if (sfxEnabled) playCardDealSound();
    setState(applySpiderDeal(state));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setHint(null);
  };

  const handleNewGame = () => {
    setState(dealSpider(suitCount, randomSeed()));
    setHistory([]);
    setHint(null);
    setIsWon(false);
  };

  const handleDragStart = (e: React.DragEvent, col: number, index: number) => {
    if (!canPickUpRun(state.tableaus[col], index)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ col, index }));
    e.dataTransfer.effectAllowed = 'move';
    setHint(null);
  };

  const handleDrop = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const { col, index } = JSON.parse(data);
    if (col === to) return;
    const moving = state.tableaus[col][index];
    if (moving && canDropOn(moving, state.tableaus[to])) {
      doMove(col, index, to);
    } else if (sfxEnabled) {
      playErrorSound();
    }
  };

  /** Tap-to-move: pick the best destination for the tapped run. */
  const handleQuickMove = (col: number, index: number) => {
    if (!canPickUpRun(state.tableaus[col], index)) return;
    const moving = state.tableaus[col][index];
    let best = -1;
    let bestScore = -Infinity;
    for (let to = 0; to < 10; to++) {
      if (to === col) continue;
      if (!canDropOn(moving, state.tableaus[to])) continue;
      const target = state.tableaus[to];
      const sameSuit = target.length > 0 && target[target.length - 1].suit === moving.suit;
      const score = (sameSuit ? 4 : 0) + (target.length === 0 ? -1 : 0);
      if (score > bestScore) { bestScore = score; best = to; }
    }
    if (best >= 0) doMove(col, index, best);
    else if (sfxEnabled) playErrorSound();
  };

  const showHint = () => {
    const h = getSpiderHint(state);
    setHint(h);
    if (!h) setToast(state.stock.length > 0 ? 'No moves — deal from the stock' : 'No moves available');
  };

  const dealsLeft = Math.ceil(state.stock.length / 10);

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-24 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Spider"
        subtitle={SUIT_LABEL[suitCount]}
        stats={[
          { label: 'Score', value: state.score },
          { label: 'Moves', value: state.moves },
          { label: 'Runs', value: `${state.completedRuns.length}/8` },
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
        <HeaderButton onClick={handleNewGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      {/* Stock + completed runs strip */}
      <div className="max-w-6xl mx-auto w-full flex flex-wrap justify-between items-center gap-2 mb-3 px-1">
        <button
          onClick={handleDeal}
          disabled={state.stock.length === 0}
          className="relative flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          aria-label="Deal from stock"
        >
          {Array.from({ length: Math.max(dealsLeft, 1) }).map((_, i) => (
            <div key={i} className="w-7 sm:w-14 aspect-[2/3] -ml-4 sm:-ml-6 first:ml-0 shadow-lg">
              <CardBackContent theme={theme} />
            </div>
          ))}
          <span className="text-white/80 text-[11px] sm:text-sm font-bold ml-1 whitespace-nowrap">
            {state.stock.length > 0 ? `Deal (${dealsLeft})` : 'Stock empty'}
          </span>
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {state.completedRuns.map((suit, i) => (
            <div key={i} className="w-5 sm:w-10 aspect-[2/3] rounded bg-black/40 ring-1 ring-amber-400/50 flex items-center justify-center text-xs sm:text-2xl shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              <span className={suit === 'hearts' || suit === 'diamonds' ? 'text-rose-400' : 'text-zinc-200'}>
                {{ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit]}
              </span>
            </div>
          ))}
          {Array.from({ length: 8 - state.completedRuns.length }).map((_, i) => (
            <div key={`e-${i}`} className="w-5 sm:w-10 aspect-[2/3] rounded border border-dashed border-white/15" />
          ))}
        </div>
      </div>

      {/* 10 tableau columns */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-10 gap-1 sm:gap-2">
        {state.tableaus.map((tableau, col) => (
          <div
            key={col}
            data-spider-col={col}
            onDrop={(e) => handleDrop(e, col)}
            onDragOver={(e) => e.preventDefault()}
            className="col-span-1 min-h-[30vh]"
          >
            {tableau.length === 0 ? (
              <div className={`w-full aspect-[2/3] rounded-lg border-2 border-dashed border-white/20 bg-black/5 ${hint?.to === col ? 'ring-4 ring-yellow-400/60 animate-pulse' : ''}`} />
            ) : (
              <div className="relative w-full">
                {tableau.map((card, j) => {
                  const topOffset = tableau.slice(0, j).reduce((acc, c) => acc + (c.isFaceUp ? 18 : 8), 0);
                  const isHintSource = hint?.from === col && hint.index === j;
                  const isHintDest = hint?.to === col && j === tableau.length - 1;
                  return (
                    <div key={card.id} className="absolute left-0 w-full" style={{ top: `${topOffset}%`, zIndex: j }}>
                      <Card
                        card={card}
                        theme={theme}
                        isDraggable={canPickUpRun(tableau, j)}
                        onDragStart={(e) => handleDragStart(e, col, j)}
                        onClick={() => handleQuickMove(col, j)}
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
          onComplete={() => onWin({ time: state.time, moves: state.moves, score: state.score })}
        />
      )}
      <ParticleOverlay ref={particleRef} />
    </div>
  );
};
