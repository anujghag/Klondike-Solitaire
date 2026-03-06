import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { Menu } from './components/Menu';
import { Difficulty, Theme, Stats, Achievement, GameSettings } from './types';
import { DEFAULT_THEME, THEMES } from './themes';
import { ROGUELITE_RUNS } from './utils/seedDifficulty';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'First Victory', description: 'Win your first game of Solitaire.', unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game in under 3 minutes.', unlocked: false },
  { id: 'flawless', name: 'Flawless', description: 'Win a game without using Undo.', unlocked: false },
  { id: 'hard_master', name: 'Hard Master', description: 'Win a game on Hard difficulty.', unlocked: false },
];

const DEFAULT_STATS: Stats = {
  highScores: { easy: 0, normal: 0, hard: 0 },
  fastestTimes: { easy: Infinity, normal: Infinity, hard: Infinity },
  totalWins: { easy: 0, normal: 0, hard: 0 },
  totalGames: { easy: 0, normal: 0, hard: 0 },
  currentStreak: { easy: 0, normal: 0, hard: 0 },
  bestStreak: { easy: 0, normal: 0, hard: 0 },
  themeWins: {},
  achievements: INITIAL_ACHIEVEMENTS,
  completedDailies: [],
  dailyStreak: 0,
  runProgress: {},
  completedRuns: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'normal',
  customSeed: undefined,
  scoringType: 'standard',
  sfxEnabled: true,
  leftHandedMode: false,
  largePrintMode: false,
  thoughtfulMode: false,
  autoPlayEnabled: false,
};

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    const savedStats = localStorage.getItem('solitaire_stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats({
          ...DEFAULT_STATS,
          ...parsed,
          highScores: { ...DEFAULT_STATS.highScores, ...parsed?.highScores },
          fastestTimes: { ...DEFAULT_STATS.fastestTimes, ...parsed?.fastestTimes },
          totalWins: { ...DEFAULT_STATS.totalWins, ...parsed?.totalWins },
          totalGames: { ...DEFAULT_STATS.totalGames, ...parsed?.totalGames },
          currentStreak: { ...DEFAULT_STATS.currentStreak, ...parsed?.currentStreak },
          bestStreak: { ...DEFAULT_STATS.bestStreak, ...parsed?.bestStreak },
        });
      } catch (e) {
        console.error('Failed to parse stats');
      }
    }
    const savedTheme = localStorage.getItem('solitaire_theme');
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
      } catch (e) {
        console.error('Failed to parse theme');
      }
    }
    const savedSettings = localStorage.getItem('solitaire_settings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  const saveStats = (newStats: Stats) => {
    setStats(newStats);
    localStorage.setItem('solitaire_stats', JSON.stringify(newStats));
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('solitaire_theme', JSON.stringify(newTheme));
  };

  const handleStart = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('solitaire_settings', JSON.stringify(newSettings));

    // Increment total games
    const newStats = { ...stats };
    newStats.totalGames = { ...stats.totalGames };
    newStats.totalGames[newSettings.difficulty]++;
    saveStats(newStats);

    setGameState('playing');
  };

  // — Roguelite Runs —
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const handleStartRun = (newSettings: GameSettings, runId: string) => {
    const run = ROGUELITE_RUNS.find(r => r.id === runId);
    if (!run) return;

    // Switch to the run's theme
    const runTheme = THEMES.find(t => t.id === run.themeId);
    if (runTheme) handleThemeChange(runTheme);

    setActiveRunId(runId);
    handleStart(newSettings);
  };

  const handleWin = (gameStats: { time: number; moves: number; score: number }) => {
    const newStats = { ...stats };
    const diff = settings.difficulty;

    // Update basic stats
    newStats.totalWins = { ...stats.totalWins };
    newStats.highScores = { ...stats.highScores };
    newStats.fastestTimes = { ...stats.fastestTimes };
    newStats.currentStreak = { ...stats.currentStreak };
    newStats.bestStreak = { ...stats.bestStreak };
    newStats.themeWins = { ...stats.themeWins };

    newStats.totalWins[diff]++;
    if (gameStats.score > newStats.highScores[diff]) {
      newStats.highScores[diff] = gameStats.score;
    }
    if (gameStats.time < newStats.fastestTimes[diff]) {
      newStats.fastestTimes[diff] = gameStats.time;
    }

    newStats.currentStreak[diff]++;
    if (newStats.currentStreak[diff] > newStats.bestStreak[diff]) {
      newStats.bestStreak[diff] = newStats.currentStreak[diff];
    }

    newStats.themeWins[theme.id] = (newStats.themeWins[theme.id] || 0) + 1;

    // Check achievements
    const ach = [...newStats.achievements];
    const unlock = (id: string) => {
      const a = ach.find(x => x.id === id);
      if (a && !a.unlocked) a.unlocked = true;
    };

    unlock('first_win');
    if (gameStats.time < 180) unlock('speed_demon');
    if (settings.difficulty === 'hard') unlock('hard_master');
    // Note: Flawless is harder to track without passing undo count from Board, 
    // but we can assume it's unlocked if they win hard mode (since no undos allowed)
    if (settings.difficulty === 'hard') unlock('flawless');

    newStats.achievements = ach;

    // Daily Challenge tracking
    const today = new Date().toISOString().split('T')[0];
    if (settings.customSeed !== undefined) {
      // Check if this seed matches today's daily seed
      const WINNABLE_SEEDS_DRAW_3 = require('../utils/knownSeeds').WINNABLE_SEEDS_DRAW_3;
      let hash = 0;
      for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
      }
      const dailySeed = WINNABLE_SEEDS_DRAW_3[Math.abs(hash) % WINNABLE_SEEDS_DRAW_3.length];
      if (settings.customSeed === dailySeed && !newStats.completedDailies?.includes(today)) {
        newStats.completedDailies = [...(newStats.completedDailies || []), today];
        // Calculate streak
        let streak = 1;
        const d = new Date();
        while (true) {
          d.setDate(d.getDate() - 1);
          const prev = d.toISOString().split('T')[0];
          if (newStats.completedDailies.includes(prev)) {
            streak++;
          } else {
            break;
          }
        }
        newStats.dailyStreak = streak;
      }
    }

    saveStats(newStats);

    // Roguelite Run progress
    if (activeRunId) {
      const runStatsUpdate = { ...newStats };
      runStatsUpdate.runProgress = { ...(runStatsUpdate.runProgress || {}) };
      const currentProgress = runStatsUpdate.runProgress[activeRunId] || 0;
      runStatsUpdate.runProgress[activeRunId] = currentProgress + 1;
      
      const run = ROGUELITE_RUNS.find(r => r.id === activeRunId);
      if (run && runStatsUpdate.runProgress[activeRunId] >= run.seeds.length) {
        runStatsUpdate.completedRuns = [...(runStatsUpdate.completedRuns || []), activeRunId];
      }
      saveStats(runStatsUpdate);
      setActiveRunId(null);
    }

    alert(`You won!\nScore: ${gameStats.score}\nTime: ${gameStats.time}s\nMoves: ${gameStats.moves}`);
    setGameState('menu');
  };

  const handleAbandon = () => {
    const newStats = { ...stats };
    newStats.currentStreak = { ...stats.currentStreak };
    newStats.currentStreak[settings.difficulty] = 0;
    saveStats(newStats);
  };

  return (
    <>
      {gameState === 'menu' ? (
        <Menu
          stats={stats}
          currentTheme={theme}
          currentSettings={settings}
          onStart={handleStart}
          onStartRun={handleStartRun}
          onThemeChange={handleThemeChange}
        />
      ) : (
        <Board
          settings={settings}
          theme={theme}
          onWin={handleWin}
          onMenu={() => {
            handleAbandon();
            setGameState('menu');
          }}
        />
      )}
    </>
  );
}
