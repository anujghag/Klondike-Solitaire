import React from 'react';
import { Stats, GameSettings, Difficulty } from '../types';
import { ROGUELITE_RUNS, getDifficultyLabel, getDifficultyColor, getSeedDifficulty, DifficultyStars } from '../utils/seedDifficulty';
import { THEMES } from '../themes';

interface RogueliteRunsProps {
  stats: Stats;
  onStartRun: (settings: GameSettings, runId: string) => void;
}

const STAR_CHAR = '★';
const EMPTY_STAR = '☆';

const renderStars = (count: DifficultyStars) => (
  <span className={getDifficultyColor(count)}>
    {STAR_CHAR.repeat(count)}{EMPTY_STAR.repeat(5 - count)}
  </span>
);

export const RogueliteRuns: React.FC<RogueliteRunsProps> = ({ stats, onStartRun }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">⚔️ Roguelite Runs</h2>
        <p className="text-sm text-white/60">Complete 5 escalating seeds in sequence. Each run is themed to a world.</p>
      </div>

      {ROGUELITE_RUNS.map((run) => {
        const progress = stats.runProgress?.[run.id] || 0;
        const isCompleted = stats.completedRuns?.includes(run.id);
        const theme = THEMES.find(t => t.id === run.themeId);
        const nextSeedIndex = Math.min(progress, 4);
        const nextSeed = run.seeds[nextSeedIndex];
        const nextDifficulty = getSeedDifficulty(nextSeed, run.drawCount as 1 | 3);

        return (
          <div
            key={run.id}
            className={`relative overflow-hidden rounded-2xl border transition-all ${
              isCompleted
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {/* Progress bar background */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-yellow-500/10 to-red-500/10 transition-all duration-500"
              style={{ width: `${(progress / 5) * 100}%`, opacity: isCompleted ? 0.15 : 0.3 }}
            />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {run.name}
                    {isCompleted && <span className="text-amber-400 text-sm">🏆 Complete</span>}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">{run.description}</p>
                  <p className="text-xs text-white/30 mt-1">
                    Theme: {theme?.name || run.themeId} • Draw {run.drawCount}
                  </p>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => {
                      const settings: GameSettings = {
                        difficulty: (run.drawCount === 1 ? 'easy' : 'normal') as Difficulty,
                        customSeed: nextSeed,
                        scoringType: 'standard',
                        sfxEnabled: true,
                        leftHandedMode: false,
                        largePrintMode: false,
                        thoughtfulMode: false,
                        autoPlayEnabled: false,
                      };
                      onStartRun(settings, run.id);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 whitespace-nowrap text-sm"
                  >
                    ▶ Seed {progress + 1}/5
                  </button>
                )}
              </div>

              {/* Seed Progress Pills */}
              <div className="flex gap-2">
                {run.seeds.map((seed, i) => {
                  const diff = getSeedDifficulty(seed, run.drawCount as 1 | 3);
                  const completed = i < progress;
                  const isCurrent = i === progress && !isCompleted;

                  return (
                    <div
                      key={seed}
                      className={`flex-1 rounded-lg p-2 text-center transition-all ${
                        completed
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : isCurrent
                          ? 'bg-indigo-500/20 border border-indigo-500/40 ring-2 ring-indigo-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="text-xs font-mono text-white/40 mb-1">
                        {completed ? '✓' : isCurrent ? '▶' : `#${i + 1}`}
                      </div>
                      <div className="text-xs">
                        {renderStars(diff)}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${getDifficultyColor(diff)} opacity-70`}>
                        {getDifficultyLabel(diff)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
