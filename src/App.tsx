import React, { useCallback, useEffect, useState } from 'react';
import { Board } from './components/Board';
import { Menu } from './components/Menu';
import { GameHub } from './components/GameHub';
import { Theme, Stats, Achievement, GameSettings, GameState, GameId, MultiGameStats } from './types';
import { DEFAULT_THEME, THEMES } from './themes';
import { ROGUELITE_RUNS } from './utils/seedDifficulty';
import { WINNABLE_SEEDS_DRAW_3 } from './utils/knownSeeds';
import { SpiderBoard } from './games/spider/SpiderBoard';
import { SpiderState, SpiderSuits } from './games/spider/logic';
import { FreeCellBoard } from './games/freecell/FreeCellBoard';
import { FreeCellState } from './games/freecell/logic';
import { SevensBoard } from './games/sevens/SevensBoard';
import { BluffBoard } from './games/bluff/BluffBoard';
import { MendikotBoard } from './games/mendikot/MendikotBoard';
import { TriPeaksBoard } from './games/tripeaks/TriPeaksBoard';
import { PyramidBoard } from './games/pyramid/PyramidBoard';
import { HeartsBoard } from './games/hearts/HeartsBoard';
import { CourtPieceBoard } from './games/courtpiece/CourtPieceBoard';
import { TeenPattiBoard } from './games/teenpatti/TeenPattiBoard';
import { RummyBoard } from './games/rummy/RummyBoard';
import {
  saveInProgress, loadInProgress, clearInProgress, hasInProgress,
  loadMultiGameStats, recordGameResult,
} from './utils/gameSave';
import { ArrowLeft } from 'lucide-react';

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

type Screen =
  | 'hub' | 'klondike-menu' | 'klondike' | 'spider' | 'freecell' | 'sevens' | 'bluff' | 'mendikot'
  | 'tripeaks' | 'pyramid' | 'hearts' | 'courtpiece' | 'teenpatti' | 'rummy';

interface KlondikeSave { state: GameState; settings: GameSettings }
interface SpiderSave { state: SpiderState; suits: SpiderSuits }

export default function App() {
  const [screen, setScreen] = useState<Screen>('hub');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [multiStats, setMultiStats] = useState<MultiGameStats>(() => loadMultiGameStats());

  // Per-launch resume payloads
  const [klondikeResume, setKlondikeResume] = useState<GameState | undefined>(undefined);
  const [spiderSuits, setSpiderSuits] = useState<SpiderSuits>(1);
  const [spiderResume, setSpiderResume] = useState<SpiderState | undefined>(undefined);
  const [freecellResume, setFreecellResume] = useState<FreeCellState | undefined>(undefined);

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

  // ─── Klondike (classic flow, unchanged mechanics) ─────────────────────────

  const handleStart = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('solitaire_settings', JSON.stringify(newSettings));

    const newStats = { ...stats };
    newStats.totalGames = { ...stats.totalGames };
    newStats.totalGames[newSettings.difficulty]++;
    // Starting fresh over an unfinished saved game abandons it → streak resets.
    if (hasInProgress('klondike')) {
      newStats.currentStreak = { ...newStats.currentStreak, [newSettings.difficulty]: 0 };
      clearInProgress('klondike');
    }
    saveStats(newStats);

    setKlondikeResume(undefined);
    setScreen('klondike');
  };

  const handleResumeKlondike = () => {
    const save = loadInProgress<KlondikeSave>('klondike');
    if (!save) return;
    setSettings(save.settings);
    setKlondikeResume(save.state);
    setScreen('klondike');
  };

  const handleKlondikeSaveState = useCallback((state: GameState | null) => {
    if (state === null) clearInProgress('klondike');
    else setSettings(current => {
      saveInProgress<KlondikeSave>('klondike', { state, settings: current });
      return current;
    });
  }, []);

  // ─── Roguelite Runs ────────────────────────────────────────────────────────

  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const handleStartRun = (newSettings: GameSettings, runId: string) => {
    const run = ROGUELITE_RUNS.find(r => r.id === runId);
    if (!run) return;
    const runTheme = THEMES.find(t => t.id === run.themeId);
    if (runTheme) handleThemeChange(runTheme);
    setActiveRunId(runId);
    handleStart(newSettings);
  };

  const handleWin = (gameStats: { time: number; moves: number; score: number }) => {
    const newStats = { ...stats };
    const diff = settings.difficulty;

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

    const ach = [...newStats.achievements];
    const unlock = (id: string) => {
      const a = ach.find(x => x.id === id);
      if (a && !a.unlocked) a.unlocked = true;
    };

    unlock('first_win');
    if (gameStats.time < 180) unlock('speed_demon');
    if (settings.difficulty === 'hard') unlock('hard_master');
    if (settings.difficulty === 'hard') unlock('flawless');

    newStats.achievements = ach;

    // Daily Challenge tracking
    const today = new Date().toISOString().split('T')[0];
    if (settings.customSeed !== undefined) {
      let hash = 0;
      for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
      }
      const dailySeed = WINNABLE_SEEDS_DRAW_3[Math.abs(hash) % WINNABLE_SEEDS_DRAW_3.length];
      if (settings.customSeed === dailySeed && !newStats.completedDailies?.includes(today)) {
        newStats.completedDailies = [...(newStats.completedDailies || []), today];
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
    setMultiStats(recordGameResult('klondike', { won: true, score: gameStats.score, time: gameStats.time }));
    clearInProgress('klondike');

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

    setScreen('klondike-menu');
  };

  // ─── New games: launch + result recording ─────────────────────────────────

  const handlePlaySpider = (suits: SpiderSuits, resume: boolean) => {
    if (resume) {
      const save = loadInProgress<SpiderSave>('spider');
      if (save) {
        setSpiderSuits(save.suits);
        setSpiderResume(save.state);
        setScreen('spider');
        return;
      }
    }
    clearInProgress('spider');
    setSpiderSuits(suits);
    setSpiderResume(undefined);
    setScreen('spider');
  };

  const handleSpiderSave = useCallback((state: SpiderState | null) => {
    if (state === null) clearInProgress('spider');
    else setSpiderSuits(current => {
      saveInProgress<SpiderSave>('spider', { state, suits: current });
      return current;
    });
  }, []);

  const handlePlayFreeCell = (resume: boolean) => {
    if (resume) {
      const save = loadInProgress<FreeCellState>('freecell');
      if (save) {
        setFreecellResume(save);
        setScreen('freecell');
        return;
      }
    }
    clearInProgress('freecell');
    setFreecellResume(undefined);
    setScreen('freecell');
  };

  const handleFreeCellSave = useCallback((state: FreeCellState | null) => {
    if (state === null) clearInProgress('freecell');
    else saveInProgress('freecell', state);
  }, []);

  const record = useCallback((game: GameId, result: { won: boolean; score?: number; time?: number; special?: boolean }) => {
    setMultiStats(recordGameResult(game, result));
  }, []);

  const goHub = useCallback(() => setScreen('hub'), []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const saves: Partial<Record<GameId, boolean>> = screen === 'hub' ? {
    klondike: hasInProgress('klondike'),
    spider: hasInProgress('spider'),
    freecell: hasInProgress('freecell'),
  } : {};

  switch (screen) {
    case 'hub':
      return (
        <GameHub
          theme={theme}
          themes={THEMES}
          onThemeChange={handleThemeChange}
          multiStats={multiStats}
          klondikeWins={stats.totalWins.easy + stats.totalWins.normal + stats.totalWins.hard}
          dailyStreak={stats.dailyStreak}
          saves={saves}
          onOpenKlondike={() => setScreen('klondike-menu')}
          onResumeKlondike={handleResumeKlondike}
          onPlaySpider={handlePlaySpider}
          onPlayFreeCell={handlePlayFreeCell}
          onPlaySevens={() => setScreen('sevens')}
          onPlayBluff={() => setScreen('bluff')}
          onPlayMendikot={() => setScreen('mendikot')}
          onPlayOther={(id) => setScreen(id as Screen)}
        />
      );

    case 'klondike-menu':
      return (
        <div className="relative">
          <button
            onClick={goHub}
            className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 text-white text-sm font-bold rounded-full backdrop-blur-sm ring-1 ring-white/20 transition-colors"
          >
            <ArrowLeft size={16} /> All Games
          </button>
          <Menu
            stats={stats}
            currentTheme={theme}
            currentSettings={settings}
            onStart={handleStart}
            onStartRun={handleStartRun}
            onThemeChange={handleThemeChange}
          />
        </div>
      );

    case 'klondike':
      return (
        <Board
          settings={settings}
          theme={theme}
          resumeState={klondikeResume}
          onSaveState={handleKlondikeSaveState}
          onWin={handleWin}
          onMenu={() => setScreen('klondike-menu')}
        />
      );

    case 'spider':
      return (
        <SpiderBoard
          theme={theme}
          suitCount={spiderSuits}
          sfxEnabled={settings.sfxEnabled}
          resumeState={spiderResume}
          onSaveState={handleSpiderSave}
          onWin={({ time, score }) => {
            record('spider', { won: true, score, time, special: spiderSuits === 4 });
            goHub();
          }}
          onExit={goHub}
        />
      );

    case 'freecell':
      return (
        <FreeCellBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          resumeState={freecellResume}
          onSaveState={handleFreeCellSave}
          onWin={({ time, score }) => {
            record('freecell', { won: true, score, time });
            goHub();
          }}
          onExit={goHub}
        />
      );

    case 'sevens':
      return (
        <SevensBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won) => record('sevens', { won })}
          onExit={goHub}
        />
      );

    case 'bluff':
      return (
        <BluffBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won) => record('bluff', { won })}
          onExit={goHub}
        />
      );

    case 'mendikot':
      return (
        <MendikotBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won, isMendikot) => record('mendikot', { won, special: isMendikot })}
          onExit={goHub}
        />
      );

    case 'tripeaks':
      return (
        <TriPeaksBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onWin={({ time, score }) => {
            record('tripeaks', { won: true, score, time });
            goHub();
          }}
          onLose={() => record('tripeaks', { won: false })}
          onExit={goHub}
        />
      );

    case 'pyramid':
      return (
        <PyramidBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onWin={({ time, score }) => {
            record('pyramid', { won: true, score, time });
            goHub();
          }}
          onLose={() => record('pyramid', { won: false })}
          onExit={goHub}
        />
      );

    case 'hearts':
      return (
        <HeartsBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won, shotMoon) => record('hearts', { won, special: shotMoon })}
          onExit={goHub}
        />
      );

    case 'courtpiece':
      return (
        <CourtPieceBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won, isKot) => record('courtpiece', { won, special: isKot })}
          onExit={goHub}
        />
      );

    case 'teenpatti':
      return (
        <TeenPattiBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won) => record('teenpatti', { won })}
          onExit={goHub}
        />
      );

    case 'rummy':
      return (
        <RummyBoard
          theme={theme}
          sfxEnabled={settings.sfxEnabled}
          onFinish={(won) => record('rummy', { won })}
          onExit={goHub}
        />
      );
  }
}
