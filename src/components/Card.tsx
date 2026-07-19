import React, { useState, useRef, useEffect } from 'react';
import { Card as CardType, Theme } from '../types';
import { CARD_CHARACTERS } from '../lotm';
import { MARATHA_CHARACTERS } from '../maratha';
import { getCardImageUrl } from '../services/imageService';

interface CardProps {
  card: CardType;
  theme: Theme;
  thoughtfulMode?: boolean;
  largePrintMode?: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, card: CardType) => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Card Back Renderers ──────────────────────────────────────────────────────

/** CSS-only back designs for the themed decks that don't ship painted art. */
const GENERIC_BACKS: Record<string, { bg: string; pattern: string; emoji: string; ring: string }> = {
  'ocean-back': {
    bg: 'bg-blue-950 bg-[radial-gradient(ellipse_at_bottom,_#0e7490_0%,_#172554_55%,_#020617_100%)]',
    pattern: 'bg-[repeating-radial-gradient(circle_at_50%_120%,transparent_0px,transparent_14px,rgba(103,232,249,0.12)_15px,transparent_17px)]',
    emoji: '🌊', ring: 'border-cyan-300/60',
  },
  'jungle-back': {
    bg: 'bg-green-950 bg-[radial-gradient(ellipse_at_top,_#166534_0%,_#052e16_60%,_#010b04_100%)]',
    pattern: 'bg-[repeating-linear-gradient(60deg,transparent_0px,transparent_16px,rgba(134,239,172,0.10)_17px,transparent_19px),repeating-linear-gradient(-60deg,transparent_0px,transparent_16px,rgba(134,239,172,0.10)_17px,transparent_19px)]',
    emoji: '🌿', ring: 'border-lime-300/60',
  },
  'space-back': {
    bg: 'bg-black bg-[radial-gradient(ellipse_at_30%_20%,_#312e81_0%,_#0f0a2e_45%,_#000000_100%)]',
    pattern: 'bg-[radial-gradient(rgba(255,255,255,0.85)_1px,transparent_1px)] [background-size:22px_22px] [background-position:4px_6px] opacity-60',
    emoji: '🪐', ring: 'border-indigo-300/60',
  },
  'valentine-back': {
    bg: 'bg-rose-800 bg-[radial-gradient(ellipse_at_top,_#fb7185_0%,_#e11d48_55%,_#881337_100%)]',
    pattern: 'bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_12px,rgba(255,228,230,0.16)_13px,transparent_15px)]',
    emoji: '💘', ring: 'border-pink-200/70',
  },
  'pets-back': {
    bg: 'bg-sky-600 bg-[radial-gradient(ellipse_at_top,_#7dd3fc_0%,_#0284c7_60%,_#1e3a8a_100%)]',
    pattern: 'bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_18px,rgba(255,255,255,0.14)_19px,transparent_21px)]',
    emoji: '🐯', ring: 'border-amber-200/80',
  },
};

export const CardBackContent: React.FC<{ theme: Theme; onClick?: () => void; style?: React.CSSProperties }> = ({ theme, onClick, style }) => {
  const generic = GENERIC_BACKS[theme.cardBack];
  if (!theme.cardBackImageUrl && generic) {
    return (
      <div
        className={`w-full h-full rounded-lg shadow-md flex items-center justify-center overflow-hidden relative border-[1px] sm:border-2 border-white/30 ${generic.bg}`}
        style={style}
        onClick={onClick}
      >
        <div className={`absolute inset-0 ${generic.pattern}`} />
        <div className={`absolute inset-2 sm:inset-3 rounded-md border ${generic.ring} opacity-70`} />
        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 ${generic.ring} bg-black/25 backdrop-blur-[1px] flex items-center justify-center text-xl sm:text-3xl shadow-[0_0_18px_rgba(0,0,0,0.4)]`}>
          {generic.emoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>
    );
  }
  if (theme.cardBackImageUrl) {
    return (
      <div
        className="w-full h-full rounded-lg shadow-md flex items-center justify-center bg-zinc-900 bg-cover bg-center bg-no-repeat overflow-hidden border-[1px] sm:border-2 border-zinc-500/80 relative"
        style={{ ...style, backgroundImage: `url(${theme.cardBackImageUrl})` }}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" />
      </div>
    );
  } else if (theme.cardBack === 'mystic-back') {
    return (
      <div
        className="w-full h-full rounded-lg border-2 border-zinc-500/80 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center bg-zinc-900 overflow-hidden relative"
        style={{
          ...style,
          backgroundImage: 'radial-gradient(circle at 50% 50%, #27272a 0%, #000000 100%)'
        }}
        onClick={onClick}
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(161,161,170,0.4)_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute w-[200%] h-[200%] animate-spin opacity-20 bg-[conic-gradient(from_0deg,transparent,rgba(212,212,216,0.3),transparent)] rounded-full blur-2xl" style={{ animationDuration: '20s' }} />
        <div className="absolute inset-3 sm:inset-4 border border-zinc-500/30 rounded-lg flex items-center justify-center">
          <div className="w-12 h-6 sm:w-16 sm:h-8 border-2 border-zinc-400/80 rounded-[100%] flex items-center justify-center shadow-[0_0_15px_rgba(161,161,170,0.5)] relative overflow-hidden z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(228,228,231,0.5)_0%,transparent_60%)] animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute w-20 h-20 sm:w-28 sm:h-28 border-[1px] border-zinc-500/40 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 border-[1px] border-dashed border-zinc-500/30 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
          <div className="absolute w-16 h-16 sm:w-20 sm:h-20 border-[1px] border-zinc-400/20 rotate-45" />
          <div className="absolute top-2 left-2 text-[8px] sm:text-[10px] text-zinc-500/80 font-serif">◯</div>
          <div className="absolute top-2 right-2 text-[8px] sm:text-[10px] text-zinc-500/80 font-serif">△</div>
          <div className="absolute bottom-2 left-2 text-[8px] sm:text-[10px] text-zinc-500/80 font-serif">◇</div>
          <div className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] text-zinc-500/80 font-serif">☆</div>
        </div>
      </div>
    );
  } else if (theme.cardBack === 'luxury-back') {
    return (
      <div
        className="w-full h-full rounded-lg border-[3px] border-amber-600/80 shadow-md flex flex-col items-center justify-center bg-stone-900 overflow-hidden relative"
        style={style}
        onClick={onClick}
      >
        <div className="absolute inset-1.5 border border-amber-500/30 rounded-sm" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0)_0px,rgba(0,0,0,0)_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)]" />
        <div className="w-12 h-12 rotate-45 border-4 border-amber-600/50 flex flex-col items-center justify-center relative">
          <div className="absolute inset-1 border border-amber-500/40" />
          <div className="w-4 h-4 rounded-full bg-amber-600/80 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        </div>
      </div>
    );
  }

  // Default Ethereal or generic back
  return (
    <div
      className="w-full h-full rounded-lg shadow-md flex items-center justify-center overflow-hidden bg-slate-200 border-2 border-white/50 relative"
      style={style}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 via-purple-200/50 to-pink-200/50" />
      <div className="absolute inset-2 border border-blue-400/20 rounded-md" />
      <div className="w-full h-full border-4 border-transparent rounded-md opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.4)_10px,rgba(255,255,255,0.4)_20px)]" />
    </div>
  );
};

// ─── Main Card Component ──────────────────────────────────────────────────────

export const Card: React.FC<CardProps> = ({
  card,
  theme,
  thoughtfulMode = false,
  largePrintMode = false,
  isDraggable = false,
  onDragStart,
  onClick,
  className = '',
  style = {},
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Track previous isFaceUp to detect flip transitions
  const prevFaceUp = useRef(card.isFaceUp);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevFaceUp.current !== card.isFaceUp) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 180); // match CSS transition duration
      prevFaceUp.current = card.isFaceUp;
      return () => clearTimeout(timer);
    }
  }, [card.isFaceUp]);

  const character = theme.id === 'maratha-glory'
    ? MARATHA_CHARACTERS[card.suit]?.[card.rank]
    : CARD_CHARACTERS[card.suit]?.[card.rank];
  const imageUrl = getCardImageUrl(theme.id, card.suit, card.rank);

  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable && onDragStart) {
      onDragStart(e, card);
      setTimeout(() => setIsDragging(true), 0);
    } else {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const interactiveClasses = isDraggable
    ? 'cursor-grab active:cursor-grabbing hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:!z-50 active:scale-110 active:shadow-[0_20px_40px_rgba(0,0,0,0.8)] active:-rotate-2 active:!z-50 transition-all duration-300 ease-out'
    : 'cursor-default transition-all duration-300 ease-out';

  const draggingClasses = isDragging ? 'opacity-30 scale-90 grayscale-[70%] blur-[1px]' : '';

  // ── Thoughtful Mode: face-down but visible ──
  // In thoughtful mode, show the face content but with a grayscale filter
  const isThoughtfulHidden = !card.isFaceUp && thoughtfulMode;
  const filterStyle = isThoughtfulHidden ? { filter: 'grayscale(100%) opacity(60%)' } : {};

  // Determine if the card is showing face up (either actually face up, or thoughtful mode)
  const showFaceUp = card.isFaceUp || thoughtfulMode;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitStyleClass = theme.suitStyles[card.suit as keyof typeof theme.suitStyles];

  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[card.suit];

  // ── Face Content (shared between normal and thoughtful rendering) ──
  const faceContent = (
    <div
      className={`w-full h-full rounded-lg ${suitStyleClass.background} border-[1px] sm:border-2 ${suitStyleClass.border} shadow-lg flex items-center justify-center overflow-hidden relative`}
      style={{
        fontFamily: theme.fontFamily,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        ...filterStyle
      }}
    >
      {/* Image Layer */}
      {imageUrl && !imageFailed && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-lg pointer-events-none">
          <img
            src={imageUrl}
            alt={theme.showCharacters && character ? character.name : `${card.rank} of ${card.suit}`}
            className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
            onError={() => setImageFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />
        </div>
      )}

      {/* Starry background effect (only if no image or image failed) */}
      {(!imageUrl || imageFailed) && (
        <>
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:20px_20px] [background-position:0_0,10px_10px]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:15px_15px] [background-position:5px_5px]" />
        </>
      )}

      {/* Conditional Background Image Mix-blend */}
      {theme.showCharacters && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Top Left */}
      <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col items-center leading-none ${suitStyleClass.text} z-10 ${theme.showCharacters || largePrintMode ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/60 backdrop-blur-md px-1 sm:px-1.5 py-1 sm:py-1.5 rounded border border-white/10 shadow-lg' : ''}`}>
        <span className={`font-bold ${largePrintMode ? 'text-2xl sm:text-3xl md:text-4xl drop-shadow-md' : 'text-sm sm:text-lg md:text-xl'}`}>{card.rank}</span>
        <span className={`${largePrintMode ? 'text-xl sm:text-2xl md:text-3xl' : 'text-xs sm:text-sm md:text-base'} ${theme.showCharacters ? 'mt-0.5' : ''} ${suitStyleClass.symbol}`}>{suitSymbol}</span>
      </div>

      {/* Center */}
      <div className={`${suitStyleClass.symbol} z-10 flex flex-col items-center justify-center w-full h-full px-2 pointer-events-none`}>
        {(!imageUrl || imageFailed) && (
          <>
            {theme.suitEmojis?.[card.suit] ? (
              <div className="text-3xl sm:text-5xl md:text-6xl mb-1 sm:mb-2 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]">
                {theme.suitEmojis[card.suit]}
              </div>
            ) : (
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">{suitSymbol}</div>
            )}
            {theme.showCharacters && character && (
              <div className={`flex flex-col items-center text-center ${suitStyleClass.text} bg-black/40 backdrop-blur-sm px-2 py-1 rounded w-[90%] border border-white/5 shadow-md`}>
                {character.title && (
                  <span className="text-[5px] sm:text-[6px] md:text-[8px] tracking-widest uppercase opacity-80 leading-tight mb-0.5">
                    {character.title}
                  </span>
                )}
                <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold tracking-wider leading-tight">
                  {character.name}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Right */}
      <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex flex-col items-center leading-none rotate-180 ${suitStyleClass.text} z-10 ${theme.showCharacters ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/60 backdrop-blur-md px-1 sm:px-1.5 py-1 sm:py-1.5 rounded border border-white/10 shadow-lg' : ''}`}>
        <span className="text-sm sm:text-lg md:text-xl font-bold">{card.rank}</span>
        <span className={`text-xs sm:text-sm md:text-base ${theme.showCharacters ? 'mt-0.5' : ''} ${suitStyleClass.symbol}`}>{suitSymbol}</span>
      </div>
    </div>
  );

  // ── 3D Flip Container ──
  // When thoughtful mode is on and card is face-down, skip the 3D flip (just show face content with filter)
  if (isThoughtfulHidden) {
    return (
      <div
        draggable={false}
        onClick={onClick}
        className={`relative w-full aspect-[2/3] ${className}`}
        style={style}
      >
        {faceContent}
      </div>
    );
  }

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`relative w-full aspect-[2/3] card-flip-perspective ${interactiveClasses} ${draggingClasses} ${className}`}
      style={style}
    >
      <div className={`card-flip-inner ${card.isFaceUp ? 'flipped' : ''} ${isAnimating ? 'scale-x-[0.96]' : ''}`}
        style={{ transition: isAnimating ? 'transform 0.18s ease-in-out' : 'transform 0.18s ease-in-out' }}
      >
        {/* Back Face (visible when not flipped) */}
        <div className="card-face card-face-back">
          <CardBackContent theme={theme} />
        </div>

        {/* Front Face (visible when flipped) */}
        <div className="card-face card-face-front">
          {faceContent}
        </div>
      </div>
    </div>
  );
};
