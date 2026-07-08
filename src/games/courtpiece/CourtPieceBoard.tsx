import React, { useEffect, useState } from 'react';
import { Suit, Theme } from '../../types';
import { Card } from '../../components/Card';
import { GameHeader, HeaderButton } from '../shared/GameHeader';
import { PlayerSeat } from '../shared/PlayerSeat';
import { playCardMoveSound, playCardPlaceSound, playErrorSound, playVictorySound } from '../../utils/audio';
import { RotateCcw } from 'lucide-react';
import { randomSeed, SUITS } from '../shared/cards';
import {
  CourtPieceState, COURT_PLAYERS,
  dealCourtPiece, setTrump, courtLegalCards, courtPlayCard, courtCollectTrick, courtChooseAiCard,
} from './logic';

interface CourtPieceBoardProps {
  theme: Theme;
  sfxEnabled: boolean;
  onFinish: (won: boolean, isKot: boolean) => void;
  onExit: () => void;
}

const SUIT_GLYPH: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

const TRICK_POS: Record<number, string> = {
  0: 'bottom-0 left-1/2 -translate-x-1/2',
  1: 'right-0 top-1/2 -translate-y-1/2',
  2: 'top-0 left-1/2 -translate-x-1/2',
  3: 'left-0 top-1/2 -translate-y-1/2',
};

export const CourtPieceBoard: React.FC<CourtPieceBoardProps> = ({ theme, sfxEnabled, onFinish, onExit }) => {
  const [state, setState] = useState<CourtPieceState>(() => dealCourtPiece(randomSeed()));
  const [reported, setReported] = useState(false);

  const pickingTrump = state.trump === null; // only true when the human is the caller
  const myLegal = state.turn === 0 && !pickingTrump ? courtLegalCards(state, 0) : [];
  const legalIds = new Set(myLegal.map(c => c.id));

  // AI turns
  useEffect(() => {
    if (state.result || pickingTrump || state.turn <= 0) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.result || prev.trump === null || prev.turn <= 0) return prev;
        const card = courtChooseAiCard(prev, prev.turn);
        if (sfxEnabled) playCardMoveSound();
        return courtPlayCard(prev, prev.turn, card);
      });
    }, 800);
    return () => clearTimeout(t);
  }, [state, pickingTrump, sfxEnabled]);

  // Collect completed tricks
  useEffect(() => {
    if (state.result || state.trick.length !== 4) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.trick.length !== 4 || prev.result) return prev;
        if (sfxEnabled) playCardPlaceSound();
        return courtCollectTrick(prev);
      });
    }, 1300);
    return () => clearTimeout(t);
  }, [state, sfxEnabled]);

  useEffect(() => {
    if (!state.result || reported) return;
    setReported(true);
    const won = state.result.winningTeam === 0;
    if (won && sfxEnabled) playVictorySound();
    onFinish(won, state.result.isKot);
  }, [state.result, reported, onFinish, sfxEnabled]);

  const handlePlay = (cardId: string) => {
    if (state.turn !== 0 || state.result || pickingTrump) return;
    const card = state.hands[0].find(c => c.id === cardId);
    if (!card || !legalIds.has(card.id)) {
      if (sfxEnabled) playErrorSound();
      return;
    }
    if (sfxEnabled) playCardMoveSound();
    setState(prev => courtPlayCard(prev, 0, card));
  };

  const newGame = () => {
    setState(dealCourtPiece(randomSeed()));
    setReported(false);
  };

  const result = state.result;

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-2 sm:p-6 pb-6 font-sans overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <GameHeader
        title="Court Piece"
        subtitle="कोट पीस · Hokm — first to 7 tricks"
        stats={[
          { label: 'Hukum', value: state.trump ? SUIT_GLYPH[state.trump] : '?', accent: state.trump === 'hearts' || state.trump === 'diamonds' ? 'text-rose-400' : 'text-zinc-200' },
          { label: 'Tricks', value: `${state.tricksWon[0]} : ${state.tricksWon[1]}` },
        ]}
        onExit={onExit}
      >
        <HeaderButton onClick={newGame}>
          <RotateCcw size={18} /> <span className="hidden sm:inline">New</span>
        </HeaderButton>
      </GameHeader>

      <div className="flex justify-center gap-4 text-[11px] sm:text-xs mb-3">
        <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40 font-bold">
          🔵 You + Zoya — {state.tricksWon[0]}/7
        </span>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40 font-bold">
          🔴 Imran + Farhan — {state.tricksWon[1]}/7
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 max-w-3xl mx-auto w-full grid grid-rows-[auto_1fr] gap-2">
        <div className="flex justify-center">
          <PlayerSeat
            name={COURT_PLAYERS[2].name} avatar={COURT_PLAYERS[2].avatar}
            cardCount={state.hands[2].length} isTurn={state.turn === 2}
            statusText="Partner" teamColor="ring-sky-400/50"
          />
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <PlayerSeat
            name={COURT_PLAYERS[3].name} avatar={COURT_PLAYERS[3].avatar}
            cardCount={state.hands[3].length} isTurn={state.turn === 3}
            teamColor="ring-rose-400/40"
          />
          <div className="relative h-48 sm:h-64 bg-black/20 rounded-3xl ring-1 ring-white/10 backdrop-blur-sm">
            {state.trick.map(play => (
              <div key={play.card.id} className={`absolute ${TRICK_POS[play.player]} w-16 sm:w-24 p-1 transition-all duration-300`}>
                <Card
                  card={play.card}
                  theme={theme}
                  className={state.trump && play.card.suit === state.trump ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}
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
            name={COURT_PLAYERS[1].name} avatar={COURT_PLAYERS[1].avatar}
            cardCount={state.hands[1].length} isTurn={state.turn === 1}
            teamColor="ring-rose-400/40"
          />
        </div>
      </div>

      <div className="text-center text-white/60 text-xs sm:text-sm my-2 h-5">
        {state.trick.length > 0 ? state.lastTrickSummary : ''}
      </div>

      {/* Your hand */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-2 flex justify-center">
          <PlayerSeat name="You" avatar="🧑" compact cardCount={state.hands[0].length} isTurn={state.turn === 0 && !pickingTrump} isYou teamColor="ring-sky-400/50" />
        </div>
        <div className="flex justify-center">
          <div className="flex -space-x-6 sm:-space-x-8">
            {state.hands[0].map(card => {
              const playable = state.turn === 0 && !pickingTrump && legalIds.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`w-14 sm:w-20 transition-transform duration-200 ${playable ? 'hover:-translate-y-4 cursor-pointer' : state.turn === 0 && !pickingTrump ? 'opacity-50' : ''}`}
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

      {/* Trump picker (human caller) */}
      {pickingTrump && !result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl text-center">
            <h3 className="font-bold text-lg mb-1">Call the hukum</h3>
            <p className="text-white/50 text-sm mb-4">Your first five cards — pick the trump suit for this hand.</p>
            <div className="flex justify-center gap-1.5 mb-5">
              {state.firstFive.map(c => (
                <div key={c.id} className="w-14 sm:w-16"><Card card={c} theme={theme} /></div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SUITS.map(suit => (
                <button
                  key={suit}
                  onClick={() => setState(prev => setTrump(prev, suit))}
                  className={`py-3 bg-white/10 hover:bg-amber-500 hover:text-black rounded-xl text-2xl transition-colors ${suit === 'hearts' || suit === 'diamonds' ? 'text-rose-400' : 'text-white'}`}
                >
                  {SUIT_GLYPH[suit]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 ring-1 ring-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-3">{result.winningTeam === 0 ? (result.isKot ? '👑' : '🏆') : '⚔️'}</div>
            <h2 className="text-2xl font-bold mb-1">
              {result.winningTeam === 0 ? 'Your team takes the court!' : 'Imran & Farhan take it'}
            </h2>
            {result.isKot && <p className="text-amber-300 font-bold mb-1">KOT — all thirteen tricks!</p>}
            <p className="font-mono text-xl my-3">{result.tricks[0]} : {result.tricks[1]}</p>
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
