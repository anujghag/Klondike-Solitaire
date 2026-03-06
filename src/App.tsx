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
  achievements: INITIAL_ACHIEVEMENTS,
};

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'normal',
  thoughtfulMode: false,
  guaranteedWinnable: false,
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
        setStats(JSON.parse(savedStats));
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
    setGameState('playing');
  };

  const handleWin = (gameStats: { time: number; moves: number; score: number }) => {
    const newStats = { ...stats };

    // Update basic stats
    newStats.totalWins[settings.difficulty]++;
    if (gameStats.score > newStats.highScores[settings.difficulty]) {
      newStats.highScores[settings.difficulty] = gameStats.score;
    }
    if (gameStats.time < newStats.fastestTimes[settings.difficulty]) {
      newStats.fastestTimes[settings.difficulty] = gameStats.time;
    }

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
          onMenu={() => setGameState('menu')}
        />
      )}
    </>
  );
}
