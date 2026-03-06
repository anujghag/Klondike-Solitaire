import React, { useState } from 'react';
import { Difficulty, Theme, Stats, GameSettings } from '../types';
import { Trophy, Play, Settings, Palette, Check, Beaker } from 'lucide-react';
import { THEMES } from '../themes';

interface MenuProps {
  stats: Stats;
  currentTheme: Theme;
  currentSettings: GameSettings;
  onStart: (settings: GameSettings) => void;
  onThemeChange: (theme: Theme) => void;
}

export const Menu: React.FC<MenuProps> = ({ stats, currentTheme, currentSettings, onStart, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'stats' | 'themes' | 'settings'>('play');
  const [localSettings, setLocalSettings] = useState<GameSettings>(currentSettings);

  const formatTime = (seconds: number) => {
    if (seconds === Infinity) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    const finalSettings = { ...localSettings, difficulty: diff };
    setLocalSettings(finalSettings);
    onStart(finalSettings);
  };

  const toggleSetting = (key: keyof Pick<GameSettings, 'thoughtfulMode' | 'guaranteedWinnable' | 'autoPlayEnabled'>) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${currentTheme.tableStyle} ${currentTheme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-4 font-sans transition-colors duration-500`}
      style={currentTheme.tableImageUrl ? { backgroundImage: `url(${currentTheme.tableImageUrl})` } : undefined}
    >
      <div className="bg-black/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-2xl w-full text-white border border-white/20">
        <h1 className="text-5xl font-bold text-center mb-8 tracking-tight drop-shadow-lg">
          Klondike <span className="text-amber-400">Solitaire</span>
        </h1>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${activeTab === 'play' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
          >
            <Play size={20} /> Play
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-amber-400 text-slate-900 shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
          >
            <Beaker size={20} /> Experimental
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
          >
            <Trophy size={20} /> Stats
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${activeTab === 'themes' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
          >
            <Palette size={20} /> Themes
          </button>
        </div>

        {activeTab === 'play' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-400">
              Select Difficulty to Start
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => handleDifficultySelect(diff)}
                  className="p-6 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all group text-left relative overflow-hidden"
                >
                  {localSettings.difficulty === diff && (
                    <div className="absolute top-4 right-4 text-emerald-400">
                      <Check size={20} />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold capitalize mb-2 group-hover:text-amber-400 transition-colors">{diff}</h3>
                  <p className="text-sm text-white/60">
                    {diff === 'easy' && 'Draw 1, infinite passes. Perfect for relaxing.'}
                    {diff === 'normal' && 'Draw 3, limited undos. The classic experience.'}
                    {diff === 'hard' && 'Draw 3, no undos, strict time limit. For experts.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-400">
              <Beaker /> Experimental Features
            </h2>

            <button
              onClick={() => toggleSetting('thoughtfulMode')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.thoughtfulMode ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.thoughtfulMode ? 'text-amber-400' : 'text-white'}`}>Thoughtful Mode</h3>
                {localSettings.thoughtfulMode && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Play perfectly! All hidden cards on the board are rendered face-up but grayed-out, allowing you to plan your moves completely instead of guessing.
              </p>
            </button>

            <button
              onClick={() => toggleSetting('guaranteedWinnable')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.guaranteedWinnable ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.guaranteedWinnable ? 'text-amber-400' : 'text-white'}`}>Guaranteed Winnable Deals</h3>
                {localSettings.guaranteedWinnable && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Never get locked out. The game will automatically re-roll random deals in the background until it mathematically proves the layout can be solved.
              </p>
            </button>

            <button
              onClick={() => toggleSetting('autoPlayEnabled')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.autoPlayEnabled ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.autoPlayEnabled ? 'text-amber-400' : 'text-white'}`}>Deep Search Auto-Play</h3>
                {localSettings.autoPlayEnabled && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Adds an "Auto Play" button to the board. When clicked, powerful Deep Search AI takes over, calculating hundreds of moves ahead to mathematically guarantee a flawless victory!
              </p>
            </button>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
                <div key={diff} className="bg-black/20 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-bold capitalize mb-4 text-amber-400">{diff}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Wins</span>
                      <span className="font-mono font-bold">{stats.totalWins[diff]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">High Score</span>
                      <span className="font-mono font-bold">{stats.highScores[diff]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Best Time</span>
                      <span className="font-mono font-bold">{formatTime(stats.fastestTimes[diff])}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="text-amber-400" /> Achievements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.achievements.map(ach => (
                  <div key={ach.id} className={`p-4 rounded-xl border ${ach.unlocked ? 'bg-amber-500/20 border-amber-500/50' : 'bg-black/20 border-white/10 opacity-50'}`}>
                    <h4 className={`font-bold ${ach.unlocked ? 'text-amber-400' : 'text-white'}`}>{ach.name}</h4>
                    <p className="text-sm text-white/70">{ach.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme)}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${currentTheme.id === theme.id ? 'bg-white/20 border-white' : 'bg-black/20 border-white/10 hover:bg-white/10'
                  }`}
              >
                <div
                  className={`w-12 h-16 rounded shadow-inner ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat' : ''} border-2 border-white/20 flex flex-col items-center justify-center pl-1 pt-1 overflow-hidden relative`}
                  style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
                >
                  <div className={`w-10 h-14 rounded-sm shadow-sm relative overflow-hidden`} >
                    {theme.cardBackImageUrl ? (
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${theme.cardBackImageUrl})` }} />
                    ) : theme.cardBack === 'mystic-back' ? (
                      <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center border border-zinc-500/50">
                        <div className="w-4 h-4 rounded-full border border-zinc-300/30 flex items-center justify-center">
                          <div className="w-2 h-2 rotate-45 border border-zinc-200/40" />
                        </div>
                      </div>
                    ) : theme.cardBack === 'luxury-back' ? (
                      <div className="absolute inset-0 bg-stone-900 flex items-center justify-center border-2 border-amber-600/80">
                        <div className="w-3 h-3 rotate-45 border-2 border-amber-600/50" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-200 border border-white/50" />
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="font-bold" style={{ fontFamily: theme.fontFamily }}>{theme.name}</h4>
                  {currentTheme.id === theme.id && <span className="text-xs text-amber-400">Current Theme</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
