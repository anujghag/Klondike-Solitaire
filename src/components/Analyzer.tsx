import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { findWinningPath } from '../utils/solver';
import { Loader2, AlertTriangle, ArrowLeft, Lightbulb, Play } from 'lucide-react';

interface AnalyzerProps {
    history: GameState[];
    drawCount: number;
    onClose: () => void;
    onRestore: (state: GameState, historyIndex: number) => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ history, drawCount, onClose, onRestore }) => {
    const [analyzingIndex, setAnalyzingIndex] = useState(history.length - 2);
    const [fatalMistakeIndex, setFatalMistakeIndex] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [winningMoves, setWinningMoves] = useState<any[] | null>(null);

    useEffect(() => {
        if (history.length < 2) {
            setIsFinished(true);
            return;
        }

        let isCancelled = false;

        const analyzeStep = (index: number) => {
            if (index < 0 || isCancelled) {
                setIsFinished(true);
                return;
            }

            const stateToTest = history[index];
            // Give the solver a larger limit for deep analysis
            const solver = findWinningPath(stateToTest, drawCount, 15000);

            const runChunk = () => {
                if (isCancelled) return;
                const result = solver.next();
                if (result.done) {
                    if (result.value !== null) {
                        // We found a winnable state! This means the move from `index` to `index + 1` was the fatal mistake.
                        if (!isCancelled) {
                            setFatalMistakeIndex(index);
                            setWinningMoves(result.value);
                            setIsFinished(true);
                        }
                    } else {
                        // Still a dead-end, step back further
                        setAnalyzingIndex(index - 1);
                        setTimeout(() => analyzeStep(index - 1), 50);
                    }
                } else {
                    setTimeout(runChunk, 0);
                }
            };

            runChunk();
        };

        analyzeStep(analyzingIndex);

        return () => { isCancelled = true; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden">

                {/* Animated Background */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 ring-4 ring-indigo-500/10">
                        {isFinished && fatalMistakeIndex !== null ? <Lightbulb size={32} /> :
                            isFinished && fatalMistakeIndex === null ? <AlertTriangle size={32} className="text-rose-400" /> :
                                <Loader2 size={32} className="animate-spin" />}
                    </div>

                    <h2 className="text-3xl font-bold mb-4 font-serif text-white">
                        {!isFinished ? 'Analyzing the Past...' :
                            fatalMistakeIndex !== null ? 'Fatal Mistake Found!' :
                                'Unwinnable from the Start'}
                    </h2>

                    <div className="space-y-4 text-white/70 max-w-lg mb-8">
                        {!isFinished && (
                            <>
                                <p className="text-lg">Stepping backward through the timeline to find where the paths diverged...</p>
                                <div className="font-mono bg-black/30 p-4 rounded-xl text-amber-400 border border-white/5">
                                    Checking move {analyzingIndex + 1} of {history.length}...
                                </div>
                            </>
                        )}

                        {isFinished && fatalMistakeIndex !== null && (
                            <>
                                <p className="text-lg">
                                    You lost the game on move <span className="font-bold text-amber-400">{fatalMistakeIndex + 2}</span>.
                                </p>
                                <p>
                                    At move <span className="text-white font-bold">{fatalMistakeIndex + 1}</span>, the game was still 100% winnable. The move you made immediately after locked the board into a dead-end.
                                </p>
                                {winningMoves && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 mt-4">
                                        The AI found a guaranteed path to victory from this point taking {winningMoves.length} precise moves.
                                    </div>
                                )}
                            </>
                        )}

                        {isFinished && fatalMistakeIndex === null && (
                            <p className="text-lg">
                                I backtracked all the way to move 1. This specific deal combination was mathematically impossible from the start. (Try enabling "Guaranteed Winnable Deals" in Experimental Settings next time!)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-white flex justify-center items-center gap-2"
                        >
                            <ArrowLeft size={20} /> Close Analyzer
                        </button>

                        {isFinished && fatalMistakeIndex !== null && (
                            <button
                                onClick={() => {
                                    onRestore(history[fatalMistakeIndex], fatalMistakeIndex);
                                    onClose();
                                }}
                                className="flex-1 py-3 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition-colors font-bold text-white shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2"
                            >
                                <Play size={20} /> Restore to Move {fatalMistakeIndex + 1}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
