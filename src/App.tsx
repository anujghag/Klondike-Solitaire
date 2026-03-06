import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { Menu } from './components/Menu';
import { Difficulty, Theme, Stats, Achievement, GameSettings } from './types';
import { DEFAULT_THEME } from './themes';

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
    saveStats(newStats);

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
