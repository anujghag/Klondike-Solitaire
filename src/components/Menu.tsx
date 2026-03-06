import React, { useState } from 'react';
import { Difficulty, Theme, Stats, GameSettings } from '../types';
import { Trophy, Play, Settings, Palette, Check, Beaker, Swords } from 'lucide-react';
import { THEMES } from '../themes';
import { WINNABLE_SEEDS_DRAW_1, WINNABLE_SEEDS_DRAW_3 } from '../utils/knownSeeds';
import { RogueliteRuns } from './RogueliteRuns';

interface MenuProps {
  stats: Stats;
  currentTheme: Theme;
  currentSettings: GameSettings;
  onStart: (settings: GameSettings) => void;
  onStartRun: (settings: GameSettings, runId: string) => void;
  onThemeChange: (theme: Theme) => void;
}

export const Menu: React.FC<MenuProps> = ({ stats, currentTheme, currentSettings, onStart, onStartRun, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'stats' | 'themes' | 'settings' | 'runs'>('play');
  const [localSettings, setLocalSettings] = useState<GameSettings>(currentSettings);
  const [customDrawCount, setCustomDrawCount] = useState<number>(3);
  const [seedError, setSeedError] = useState<string>('');

  const formatTime = (seconds: number) => {
    if (seconds === Infinity) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    const finalSettings = { ...localSettings, difficulty: diff, customSeed: undefined };
    setLocalSettings(finalSettings);
    onStart(finalSettings);
  };

  const toggleSetting = (key: keyof Pick<GameSettings, 'thoughtfulMode' | 'autoPlayEnabled' | 'leftHandedMode' | 'largePrintMode' | 'sfxEnabled'>) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleScoringType = () => {
    setLocalSettings(prev => ({
      ...prev,
      scoringType: prev.scoringType === 'standard' ? 'vegas' : 'standard'
    }));
  };

  const getThematicTitle = (themeId: string, wins: number) => {
    if (themeId === 'mystic-void') {
      if (wins >= 20) return 'Sequence 4: Bizarro Sorcerer';
      if (wins >= 15) return 'Sequence 5: Marionettist';
      if (wins >= 10) return 'Sequence 6: Faceless';
      if (wins >= 5) return 'Sequence 7: Magician';
      if (wins >= 2) return 'Sequence 8: Clown';
      return 'Sequence 9: Seer';
    } else if (themeId === 'maratha-glory') {
      if (wins >= 20) return 'Sardar / Senapati';
      if (wins >= 15) return 'Hazari';
      if (wins >= 10) return 'Jumladar';
      if (wins >= 5) return 'Havaldar';
      if (wins >= 2) return 'Naik';
      return 'Mavala';
    } else {
      if (wins >= 20) return 'Grandmaster';
      if (wins >= 15) return 'Master';
      if (wins >= 10) return 'Expert';
      if (wins >= 5) return 'Adept';
      if (wins >= 2) return 'Apprentice';
      return 'Novice';
    }
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
            <Settings size={20} /> Settings
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
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${activeTab === 'runs' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
          >
            <Swords size={20} /> Runs
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
            <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Play Custom Seed</h3>
                  <p className="text-sm text-white/60">Enter a specific number to play a deterministic, repeatable game deal.</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <select 
                      value={customDrawCount}
                      onChange={(e) => {
                        setCustomDrawCount(Number(e.target.value));
                        setSeedError('');
                      }}
                      className="bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
                    >
                      <option value={1}>Draw 1</option>
                      <option value={3}>Draw 3</option>
                    </select>
                    <input
                      type="number"
                      placeholder="e.g. 42"
                      value={localSettings.customSeed || ''}
                      onChange={(e) => {
                        setSeedError('');
                        const val = parseInt(e.target.value);
                        setLocalSettings(prev => ({ ...prev, customSeed: isNaN(val) ? undefined : val }));
                      }}
                      className="bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white w-full sm:w-32 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      onClick={() => {
                        const seedPool = customDrawCount === 1 ? WINNABLE_SEEDS_DRAW_1 : WINNABLE_SEEDS_DRAW_3;
                        if (localSettings.customSeed !== undefined && !seedPool.includes(localSettings.customSeed)) {
                          setSeedError('Incorrect seed number. Please enter a valid seed.');
                          return;
                        }
                        const finalSettings = { 
                          ...localSettings, 
                          difficulty: customDrawCount === 1 ? 'easy' as Difficulty : 'normal' as Difficulty 
                        };
                        setLocalSettings(finalSettings);
                        onStart(finalSettings);
                      }}
                      disabled={localSettings.customSeed === undefined}
                      className="bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-stone-900 font-bold px-6 py-2 rounded-xl transition-colors"
                    >
                      Go
                    </button>
                  </div>
                  {seedError && <p className="text-red-400 text-sm animate-pulse">{seedError}</p>}
                </div>
              </div>
            </div>

            {/* Daily Challenge Section */}
            <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-amber-400 mb-1 flex items-center gap-2">
                    🔥 Daily Challenge
                    {stats.dailyStreak > 0 && (
                      <span className="text-sm bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                        {stats.dailyStreak} day streak
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-white/60">
                    A new challenge every day — same seed for everyone. 
                    {stats.completedDailies?.includes(new Date().toISOString().split('T')[0]) 
                      ? ' ✅ Completed today!' 
                      : ' Can you beat it?'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Deterministic daily seed hash from today's date
                    const today = new Date().toISOString().split('T')[0];
                    let hash = 0;
                    for (let i = 0; i < today.length; i++) {
                      hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
                    }
                    const seedPool = WINNABLE_SEEDS_DRAW_3;
                    const dailySeed = seedPool[Math.abs(hash) % seedPool.length];
                    const finalSettings: GameSettings = {
                      ...localSettings,
                      difficulty: 'normal' as Difficulty,
                      customSeed: dailySeed,
                    };
                    setLocalSettings(finalSettings);
                    onStart(finalSettings);
                  }}
                  disabled={stats.completedDailies?.includes(new Date().toISOString().split('T')[0])}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-stone-900 font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 whitespace-nowrap"
                >
                  {stats.completedDailies?.includes(new Date().toISOString().split('T')[0]) ? '✅ Done' : '▶ Play Today\'s'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400 border-b border-white/10 pb-2">
                <Settings size={20} /> Main Settings
              </h2>

            <button
              onClick={() => toggleSetting('leftHandedMode')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.leftHandedMode ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.leftHandedMode ? 'text-amber-400' : 'text-white'}`}>Left-Handed Mode</h3>
                {localSettings.leftHandedMode && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Mirrors the top row of the board, placing the Stock and Waste piles on the right side for easier reach.
              </p>
            </button>

            <button
              onClick={() => toggleSetting('largePrintMode')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.largePrintMode ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.largePrintMode ? 'text-amber-400' : 'text-white'}`}>Large Print Mode</h3>
                {localSettings.largePrintMode && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Significantly increases the size of numbers and suit symbols on all cards for easier readability.
              </p>
            </button>

            <button
              onClick={toggleScoringType}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.scoringType === 'vegas' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.scoringType === 'vegas' ? 'text-amber-400' : 'text-white'}`}>Vegas Scoring</h3>
                {localSettings.scoringType === 'vegas' && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Play for stakes! Start each game at -$52 and earn +$5 for every card you move to the foundation. Can you break the bank?
              </p>
            </button>

            <button
              onClick={() => toggleSetting('sfxEnabled')}
              className={`w-full p-6 text-left rounded-2xl border transition-all ${localSettings.sfxEnabled ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xl font-bold ${localSettings.sfxEnabled ? 'text-amber-400' : 'text-white'}`}>Sound Effects</h3>
                {localSettings.sfxEnabled && <Check className="text-amber-400" />}
              </div>
              <p className="text-sm text-white/70">
                Play synthesized card snaps, error buzzes, and victory fanfares.
              </p>
            </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400 border-b border-white/10 pb-2">
                <Beaker size={20} /> Experimental Features
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
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Thematic Ranking System */}
            <div className="bg-black/20 p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-400">
                <Trophy size={20} /> Progression Titles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEMES.map(t => {
                  const wins = stats.themeWins?.[t.id] || 0;
                  const title = getThematicTitle(t.id, wins);
                  return (
                    <div key={t.id} className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="text-sm text-white/50 mb-1">{t.name}</div>
                      <div className="font-bold text-lg text-emerald-400 font-serif relative z-10">{title}</div>
                      <div className="text-xs text-white/40 mt-1">{wins} Theme {wins === 1 ? 'Win' : 'Wins'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
                <div key={diff} className="bg-black/20 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-bold capitalize mb-4 text-amber-400">{diff}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Games Played</span>
                      <span className="font-mono font-bold">{stats.totalGames && stats.totalGames[diff] !== undefined ? stats.totalGames[diff] : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Wins</span>
                      <span className="font-mono font-bold">{stats.totalWins[diff]}</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span className="text-white/60 tracking-wider">Win %</span>
                      <span className="font-mono font-bold">
                        {stats.totalGames && stats.totalGames[diff] > 0 ? Math.round((stats.totalWins[diff] / stats.totalGames[diff]) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-px bg-white/10 my-3" />
                    <div className="flex justify-between">
                      <span className="text-white/60">High Score</span>
                      <span className="font-mono font-bold">{stats.highScores[diff]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Best Time</span>
                      <span className="font-mono font-bold">{formatTime(stats.fastestTimes[diff])}</span>
                    </div>
                    <div className="h-px bg-white/10 my-3" />
                    <div className="flex justify-between">
                      <span className="text-white/60">Current Streak</span>
                      <span className="font-mono font-bold">{stats.currentStreak && stats.currentStreak[diff] !== undefined ? stats.currentStreak[diff] : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Best Streak</span>
                      <span className="font-mono font-bold text-emerald-400">{stats.bestStreak && stats.bestStreak[diff] !== undefined ? stats.bestStreak[diff] : 0}</span>
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

        {activeTab === 'runs' && (
          <RogueliteRuns stats={stats} onStartRun={onStartRun} />
        )}
      </div>
    </div>
  );
};
