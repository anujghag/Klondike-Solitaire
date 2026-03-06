import React, { useState } from 'react';
import { Card as CardType, Theme } from '../types';
import { CARD_CHARACTERS } from '../lotm';
import { MARATHA_CHARACTERS } from '../maratha';
import { getCardImageUrl } from '../services/imageService';

interface CardProps {
  card: CardType;
  theme: Theme;
  thoughtfulMode?: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, card: CardType) => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  card,
  theme,
  thoughtfulMode = false,
  isDraggable = false,
  onDragStart,
  onClick,
  className = '',
  style = {},
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const character = theme.id === 'maratha-glory'
    ? MARATHA_CHARACTERS[card.suit]?.[card.rank]
    : CARD_CHARACTERS[card.suit]?.[card.rank];
  const imageUrl = card.isFaceUp ? getCardImageUrl(theme.id, card.suit, card.rank) : '';

  // We allow an error state to kick in if the static image is missing.
  const [imageFailed, setImageFailed] = useState(false);

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

  if (!card.isFaceUp && !thoughtfulMode) {
    if (theme.cardBackImageUrl) {
      return (
        <div
          className={`w-full aspect-[2/3] rounded-lg shadow-md flex items-center justify-center bg-zinc-900 bg-cover bg-center bg-no-repeat overflow-hidden border-[1px] sm:border-2 border-zinc-500/80 relative transition-transform duration-300 ${className}`}
          style={{ ...style, backgroundImage: `url(${theme.cardBackImageUrl})` }}
          onClick={onClick}
        >
          {/* Subtle overlay to ensure it still looks like a card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" />
        </div>
      );
    } else if (theme.cardBack === 'mystic-back') {
      return (
        <div
          className={`w-full aspect-[2/3] rounded-lg border-2 border-zinc-500/80 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center bg-zinc-900 overflow-hidden relative ${className}`}
          style={{
            ...style,
            backgroundImage: 'radial-gradient(circle at 50% 50%, #27272a 0%, #000000 100%)'
          }}
          onClick={onClick}
        >
          {/* Sefirah Castle Gray Fog mist */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(161,161,170,0.4)_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute w-[200%] h-[200%] animate-spin opacity-20 bg-[conic-gradient(from_0deg,transparent,rgba(212,212,216,0.3),transparent)] rounded-full blur-2xl" style={{ animationDuration: '20s' }} />

          {/* The Fool's Emblem: Pupil-less Eye and Contorted Lines */}
          <div className="absolute inset-3 sm:inset-4 border border-zinc-500/30 rounded-lg flex items-center justify-center">
            {/* The Eye Shape */}
            <div className="w-12 h-6 sm:w-16 sm:h-8 border-2 border-zinc-400/80 rounded-[100%] flex items-center justify-center shadow-[0_0_15px_rgba(161,161,170,0.5)] relative overflow-hidden z-10">
              {/* Pupil-less interior (glowing fog) */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(228,228,231,0.5)_0%,transparent_60%)] animate-pulse" style={{ animationDuration: '3s' }} />
            </div>

            {/* Contorted Lines surrounding the eye */}
            <div className="absolute w-20 h-20 sm:w-28 sm:h-28 border-[1px] border-zinc-500/40 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 border-[1px] border-dashed border-zinc-500/30 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 border-[1px] border-zinc-400/20 rotate-45" />

            {/* Corner Runes */}
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
          className={`w-full aspect-[2/3] rounded-lg border-[3px] border-amber-600/80 shadow-md flex flex-col items-center justify-center bg-stone-900 overflow-hidden relative ${className}`}
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
        className={`w-full aspect-[2/3] rounded-lg shadow-md flex items-center justify-center overflow-hidden bg-slate-200 border-2 border-white/50 relative ${className}`}
        style={style}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 via-purple-200/50 to-pink-200/50" />
        <div className="absolute inset-2 border border-blue-400/20 rounded-md" />
        <div className="w-full h-full border-4 border-transparent rounded-md opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.4)_10px,rgba(255,255,255,0.4)_20px)]" />
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitStyleClass = theme.suitStyles[card.suit as keyof typeof theme.suitStyles];
  const lotmCharacter = character as { name: string; title: string };
  const marathaCharacter = character as any as { entity: string; title: string };

  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[card.suit];

  const filterStyle = (!card.isFaceUp && thoughtfulMode) ? { filter: 'grayscale(100%) opacity(60%)' } : {};

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`relative w-full aspect-[2/3] rounded-lg ${suitStyleClass.background} border-[1px] sm:border-2 ${suitStyleClass.border} shadow-lg flex items-center justify-center overflow-hidden ${interactiveClasses} ${draggingClasses} ${className}`}
      style={{
        ...style,
        fontFamily: theme.fontFamily,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        ...filterStyle
      }}
    >
      {/* Image Layer - Shown if there is an image URL and we haven't failed to load it */}
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
      <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col items-center leading-none ${suitStyleClass.text} z-10 ${theme.showCharacters ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/60 backdrop-blur-md px-1 sm:px-1.5 py-1 sm:py-1.5 rounded border border-white/10 shadow-lg' : ''}`}>
        <span className="text-sm sm:text-lg md:text-xl font-bold">{card.rank}</span>
        <span className={`text-xs sm:text-sm md:text-base ${theme.showCharacters ? 'mt-0.5' : ''} ${suitStyleClass.symbol}`}>{suitSymbol}</span>
      </div>

      {/* Center */}
      <div className={`${suitStyleClass.symbol} z-10 flex flex-col items-center justify-center w-full h-full px-2 pointer-events-none`}>
        {(!imageUrl || imageFailed) && (
          <>
            <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">{suitSymbol}</div>
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
};
