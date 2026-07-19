import React from 'react';

interface PlayerSeatProps {
  name: string;
  avatar: string;          // emoji
  cardCount: number;
  isTurn: boolean;
  isYou?: boolean;
  teamColor?: string;      // tailwind ring color class for team games
  statusText?: string;     // e.g. "Passed", "Thinking…"
  compact?: boolean;
}

/** Opponent/partner seat chip used in the multiplayer-vs-AI games. */
export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  name, avatar, cardCount, isTurn, isYou = false, teamColor, statusText, compact = false,
}) => (
  <div
    className={`flex ${compact ? 'flex-row items-center gap-2 px-2 py-1' : 'flex-col items-center gap-1 px-3 py-2'}
      rounded-xl backdrop-blur-sm transition-all duration-300 select-none
      ${isTurn ? 'bg-amber-400/20 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] scale-105' : 'bg-black/30 ring-1 ring-white/10'}
      ${teamColor ?? ''}`}
  >
    <div className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} ${isTurn ? 'animate-bounce' : ''}`}>{avatar}</div>
    <div className={`flex ${compact ? 'flex-row items-baseline gap-2' : 'flex-col items-center'}`}>
      <span className={`font-bold text-white ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
        {name}{isYou && name !== 'You' ? ' (You)' : ''}
      </span>
      <span className="text-[10px] sm:text-xs text-white/60 font-mono">🂠 {cardCount}</span>
    </div>
    {statusText && (
      <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-300/90 font-bold">{statusText}</span>
    )}
  </div>
);
