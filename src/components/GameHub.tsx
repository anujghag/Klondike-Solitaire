import React, { useState } from 'react';
import { GameId, MultiGameStats, Theme } from '../types';
import { SpiderSuits } from '../games/spider/logic';
import { Play, RotateCcw, Flame, Trophy, Palette } from 'lucide-react';

interface GameHubProps {
  theme: Theme;
  themes: Theme[];
  onThemeChange: (t: Theme) => void;
  multiStats: MultiGameStats;
  klondikeWins: number;
  dailyStreak: number;
  saves: Partial<Record<GameId, boolean>>;
  onOpenKlondike: () => void;
  onResumeKlondike: () => void;
  onPlaySpider: (suits: SpiderSuits, resume: boolean) => void;
  onPlayFreeCell: (resume: boolean) => void;
  onPlaySevens: () => void;
  onPlayBluff: () => void;
  onPlayMendikot: () => void;
  onPlayOther: (id: GameId) => void;
}

interface TileSpec {
  id: GameId;
  icon: string;
  name: string;
  hindi?: string;
  tagline: string;
  accent: string;      // gradient classes for the tile glow
}

const SOLITAIRE_TILES: TileSpec[] = [
  { id: 'klondike', icon: '🃏', name: 'Klondike', tagline: 'The classic — daily challenges, AI solver, roguelite runs', accent: 'from-indigo-500/60 to-purple-500/60' },
  { id: 'spider', icon: '🕷️', name: 'Spider', tagline: 'Two decks, eight runs — the marathon of solitaire', accent: 'from-emerald-500/60 to-teal-500/60' },
  { id: 'freecell', icon: '🧠', name: 'FreeCell', tagline: 'Every card face up — pure open-information skill', accent: 'from-sky-500/60 to-cyan-500/60' },
  { id: 'tripeaks', icon: '⛰️', name: 'TriPeaks', tagline: 'Ride the streak — clear three peaks one rank at a time', accent: 'from-fuchsia-500/60 to-pink-500/60' },
  { id: 'pyramid', icon: '🔺', name: 'Pyramid', tagline: 'Pair to thirteen, kings fly solo — dismantle the pyramid', accent: 'from-yellow-500/60 to-amber-500/60' },
];

const DESI_TILES: TileSpec[] = [
  { id: 'teenpatti', icon: '🪙', name: 'Teen Patti', hindi: 'तीन पत्ती', tagline: 'Blind or chaal? India\'s favourite — play-chips only', accent: 'from-amber-500/60 to-yellow-500/60' },
  { id: 'rummy', icon: '🀄', name: 'Indian Rummy', hindi: 'रमी', tagline: '13 cards, two sequences, one pure — declare first', accent: 'from-violet-500/60 to-purple-500/60' },
  { id: 'bluff', icon: '🎭', name: 'Bluff', hindi: 'चैलेंज', tagline: 'Lie with a straight face, call theirs — first empty hand wins', accent: 'from-rose-500/60 to-red-500/60' },
  { id: 'mendikot', icon: '👑', name: 'Mendikot', hindi: 'मेंढीकोट', tagline: '2v2 trick-taking with your AI partner — capture the tens', accent: 'from-amber-500/60 to-orange-500/60' },
  { id: 'courtpiece', icon: '⚔️', name: 'Court Piece', hindi: 'कोट पीस', tagline: 'Call the hukum, race your team to seven tricks', accent: 'from-cyan-500/60 to-sky-500/60' },
  { id: 'sevens', icon: '7️⃣', name: 'Satte pe Satta', hindi: 'सत्ते पे सत्ता', tagline: 'Build out from the sevens — shed your hand first', accent: 'from-lime-500/60 to-green-500/60' },
];

const WORLD_TILES: TileSpec[] = [
  { id: 'hearts', icon: '💔', name: 'Hearts', tagline: 'Duck the hearts, dodge the Black Lady — or shoot the moon', accent: 'from-red-500/60 to-rose-500/60' },
];

export const GameHub: React.FC<GameHubProps> = ({
  theme, themes, onThemeChange, multiStats, klondikeWins, dailyStreak, saves,
  onOpenKlondike, onResumeKlondike, onPlaySpider, onPlayFreeCell,
  onPlaySevens, onPlayBluff, onPlayMendikot, onPlayOther,
}) => {
  const [spiderSuits, setSpiderSuits] = useState<SpiderSuits>(1);
  const [showThemes, setShowThemes] = useState(false);

  const statLine = (id: GameId) => {
    const rec = multiStats[id];
    const wins = id === 'klondike' ? klondikeWins : rec?.wins ?? 0;
    const games = id === 'klondike' ? undefined : rec?.games ?? 0;
    if (id === 'klondike') return wins > 0 ? `${wins} wins` : 'Not played yet';
    if (!games) return 'Not played yet';
    return `${games} played · ${wins} won`;
  };

  const launch = (id: GameId, resume: boolean) => {
    switch (id) {
      case 'klondike': resume ? onResumeKlondike() : onOpenKlondike(); break;
      case 'spider': onPlaySpider(spiderSuits, resume); break;
      case 'freecell': onPlayFreeCell(resume); break;
      case 'sevens': onPlaySevens(); break;
      case 'bluff': onPlayBluff(); break;
      case 'mendikot': onPlayMendikot(); break;
      default: onPlayOther(id); break;
    }
  };

  const Tile: React.FC<{ spec: TileSpec }> = ({ spec }) => {
    const hasSave = !!saves[spec.id];
    return (
      <div data-game={spec.id} className={`group relative rounded-2xl p-[1px] bg-gradient-to-br ${spec.accent} shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
        <div className="rounded-2xl bg-zinc-950/80 backdrop-blur-md p-4 sm:p-5 h-full flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <span className="text-4xl sm:text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300">{spec.icon}</span>
            {hasSave && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/50 px-2 py-1 rounded-full animate-pulse">
                In progress
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white">{spec.name}</h3>
            {spec.hindi && <span className="text-white/50 text-sm">{spec.hindi}</span>}
          </div>
          <p className="text-white/50 text-xs sm:text-sm mt-1 mb-3 flex-1">{spec.tagline}</p>

          {spec.id === 'spider' && (
            <div className="flex gap-1.5 mb-3">
              {([1, 2, 4] as SpiderSuits[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSpiderSuits(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${spiderSuits === s ? 'bg-white text-zinc-900' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  {s} suit{s > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/40 font-mono">{statLine(spec.id)}</span>
            <div className="flex gap-2">
              {hasSave && (
                <button
                  onClick={() => launch(spec.id, true)}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={13} /> Resume
                </button>
              )}
              <button
                onClick={() => launch(spec.id, false)}
                className="px-3 py-2 bg-white/90 hover:bg-white text-zinc-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Play size={13} /> {spec.id === 'klondike' ? 'Open' : 'Play'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalWins = klondikeWins + (Object.entries(multiStats) as [GameId, { wins: number }][])
    .filter(([id]) => id !== 'klondike') // klondike wins already counted via its own stats
    .reduce((a, [, rec]) => a + (rec?.wins ?? 0), 0);

  return (
    <div
      className={`min-h-screen ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} overflow-y-auto`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      <div className="min-h-screen bg-gradient-to-b from-black/60 via-black/30 to-black/70 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="text-5xl sm:text-6xl mb-3 tracking-widest select-none">🂡 🂱 🃁 🃑</div>
            <h1
              className="text-3xl sm:text-5xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] mb-2"
              style={{ fontFamily: theme.fontFamily }}
            >
              The Card Pavilion
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Twelve games. Zero ads. Your table, your rules.
            </p>

            {/* Stats strip */}
            <div className="flex justify-center gap-3 sm:gap-4 mt-5 flex-wrap">
              <span className="flex items-center gap-1.5 bg-black/40 ring-1 ring-white/10 text-white/80 text-xs sm:text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Trophy size={14} className="text-amber-400" /> {totalWins} total wins
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 ring-1 ring-white/10 text-white/80 text-xs sm:text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Flame size={14} className="text-orange-400" /> {dailyStreak}-day daily streak
              </span>
              <button
                onClick={() => setShowThemes(v => !v)}
                className="flex items-center gap-1.5 bg-black/40 ring-1 ring-white/10 hover:ring-white/40 text-white/80 text-xs sm:text-sm px-3 py-1.5 rounded-full backdrop-blur-sm transition-all"
              >
                <Palette size={14} className="text-purple-300" /> {theme.name}
              </button>
            </div>

            {showThemes && (
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { onThemeChange(t); setShowThemes(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${t.id === theme.id ? 'bg-white text-zinc-900' : 'bg-white/10 text-white/70 hover:bg-white/25'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Solitaire section */}
          <div className="mb-8">
            <h2 className="text-white/80 font-bold uppercase tracking-[0.25em] text-xs sm:text-sm mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-white/25" />
              Solitaire Studio
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/25 to-white/25" />
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SOLITAIRE_TILES.map(spec => <Tile key={spec.id} spec={spec} />)}
            </div>
          </div>

          {/* Desi classics section */}
          <div className="mb-8">
            <h2 className="text-white/80 font-bold uppercase tracking-[0.25em] text-xs sm:text-sm mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/40 to-amber-400/40" />
              🇮🇳 Desi Classics
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400/40 to-amber-400/40" />
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DESI_TILES.map(spec => <Tile key={spec.id} spec={spec} />)}
            </div>
          </div>

          {/* World classics section */}
          <div>
            <h2 className="text-white/80 font-bold uppercase tracking-[0.25em] text-xs sm:text-sm mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-white/25" />
              🌍 World Table
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/25 to-white/25" />
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORLD_TILES.map(spec => <Tile key={spec.id} spec={spec} />)}
              <div className="rounded-2xl border-2 border-dashed border-white/15 p-4 sm:p-5 flex flex-col justify-center items-center text-center">
                <span className="text-3xl mb-2 opacity-50">🔜</span>
                <p className="text-white/40 text-xs sm:text-sm font-bold">Coming next</p>
                <p className="text-white/30 text-[11px] mt-1">29 · Callbreak · Gin Rummy · Euchre · Spades</p>
              </div>
            </div>
          </div>

          <p className="text-center text-white/25 text-[11px] mt-10">
            All games play fully offline · progress saved automatically on this device
          </p>
        </div>
      </div>
    </div>
  );
};
