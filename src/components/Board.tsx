import React, { useState, useEffect } from 'react';
import { Card as CardType, GameState, GameSettings, Theme } from '../types';
import { Card } from './Card';
import { Pile } from './Pile';
import { canMoveToFoundation, canMoveToTableau, checkWin, getHint } from '../utils/gameLogic';
import { dealGame } from '../utils/deck';
import { Undo2, Lightbulb, FastForward, Settings, Trophy, Cpu, AlertTriangle } from 'lucide-react';
import { VictoryAnimation } from './VictoryAnimation';
import { Analyzer } from './Analyzer';
import { findWinningPath, applyMove, GameMove, translateMoveToHint } from '../utils/solver';
import { playCardDealSound, playCardMoveSound, playErrorSound, playVictorySound, playCardPlaceSound, playCardFlipSound } from '../utils/audio';

interface BoardProps {
  settings: GameSettings;
  theme: Theme;
  onWin: (stats: { time: number; moves: number; score: number }) => void;
  onMenu: () => void;
}

export const Board: React.FC<BoardProps> = ({ settings, theme, onWin, onMenu }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = dealGame(settings.difficulty === 'easy' ? 1 : 3, settings.customSeed);
    if (settings.scoringType === 'vegas') initialState.score = -52;
    return initialState;
  });
  const [history, setHistory] = useState<GameState[]>([]);
  const [fullHistory, setFullHistory] = useState<GameState[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hint, setHint] = useState<Array<{ from: string; to: string; card?: CardType }>>([]);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [isDeadEnd, setIsDeadEnd] = useState(false);
  const [winningPath, setWinningPath] = useState<GameMove[] | null>(null);

  // Timer
  useEffect(() => {
    if (isAutoCompleting || isDeepSearching) return;
    const timer = setInterval(() => {
      setGameState(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoCompleting, isDeepSearching]);

  // Check Win
  useEffect(() => {
    if (checkWin(gameState.foundations) && !isWon) {
      if (settings.sfxEnabled) playVictorySound();
      setIsWon(true);
    }
  }, [gameState.foundations, isWon]);

  // Background Dead-End Detection & Hint Calculation
  useEffect(() => {
    let isCancelled = false;

    // Don't detect if game is already won or currently auto-playing
    if (isWon || isAutoCompleting || isDeepSearching) return;

    // Reset dead-end state while calculating
    setIsDeadEnd(false);
    setWinningPath(null);

    // Limit to 10k iterations so background solver doesn't burn user's battery indefinitely
    const solver = findWinningPath(gameState, settings.difficulty === 'easy' ? 1 : 3, 10000);

    const calculateChunk = () => {
      if (isCancelled) return;
      const result = solver.next();
      if (result.done) {
        if (!isCancelled) {
          if (result.value === null) {
            setIsDeadEnd(true);
            setWinningPath(null);
          } else {
            setIsDeadEnd(false);
            setWinningPath(result.value);
          }
        }
      } else {
        setTimeout(calculateChunk, 0);
      }
    };

    calculateChunk();

    return () => { isCancelled = true; };
  }, [gameState, isWon, isAutoCompleting, isDeepSearching, settings.difficulty]);

  const saveHistory = (state: GameState) => {
    setFullHistory(prev => [...prev, state]);
    if (settings.difficulty === 'hard') return; // No undos in hard mode
    setHistory(prev => {
      const newHistory = [...prev, state];
      if (settings.difficulty === 'normal' && newHistory.length > 3) {
        return newHistory.slice(newHistory.length - 3); // Limit to 3 undos
      }
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setGameState(previousState);
    setHistory(prev => prev.slice(0, -1));
    setFullHistory(prev => prev.slice(0, -1));
    setHint([]);
  };

  const handleRedraw = () => {
    const initialState = dealGame(settings.difficulty === 'easy' ? 1 : 3, settings.customSeed);
    if (settings.scoringType === 'vegas') initialState.score = -52;
    setGameState(initialState);
    setHistory([]);
    setFullHistory([]);
    setHint([]);
    setIsDeadEnd(false);
    setWinningPath(null);
  };

  const drawCard = () => {
    saveHistory(gameState);
    setHint([]);
    if (settings.sfxEnabled) playCardDealSound();
    setGameState(prev => {
      const drawCount = settings.difficulty === 'easy' ? 1 : 3;
      const newStock = [...prev.stock];
      const newWaste = [...prev.waste];

      if (newStock.length === 0) {
        // Reset stock from waste
        if (newWaste.length === 0) return prev;
        const resetStock = newWaste.reverse().map(c => ({ ...c, isFaceUp: false }));
        return {
          ...prev,
          stock: resetStock,
          waste: [],
          moves: prev.moves + 1,
          score: settings.scoringType === 'vegas' ? prev.score : Math.max(0, prev.score - 20), // Penalty for recycling only in standard
        };
      }

      const drawn = newStock.splice(-drawCount).reverse().map(c => ({ ...c, isFaceUp: true }));
      return {
        ...prev,
        stock: newStock,
        waste: [...newWaste, ...drawn],
        moves: prev.moves + 1,
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, card: CardType, source: string, stackIndex: number = 0) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ card, source, stackIndex }));
    e.dataTransfer.effectAllowed = 'move';
    setHint([]);
  };

  const handleDropOnFoundation = (e: React.DragEvent, foundationIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { card, source, stackIndex } = JSON.parse(data);

    // Can only move single cards to foundation
    if (source.startsWith('tableau') && stackIndex !== gameState.tableaus[parseInt(source.split('-')[1])].length - 1) {
      return;
    }

    const foundation = gameState.foundations[foundationIndex];
    if (canMoveToFoundation(card, foundation)) {
      saveHistory(gameState);
      moveCard(source, `foundation-${foundationIndex}`, card, 10);
    } else {
      if (settings.sfxEnabled) playErrorSound();
    }
  };

  const handleDropOnTableau = (e: React.DragEvent, tableauIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { card, source, stackIndex } = JSON.parse(data);

    const tableau = gameState.tableaus[tableauIndex];
    if (canMoveToTableau(card, tableau)) {
      saveHistory(gameState);
      moveCard(source, `tableau-${tableauIndex}`, card, 5, stackIndex);
    } else {
      if (settings.sfxEnabled) playErrorSound();
    }
  };

  const moveCard = (source: string, destination: string, card: CardType, scoreDelta: number, stackIndex: number = -1) => {
    if (settings.sfxEnabled) {
      if (destination.startsWith('foundation')) {
        playCardPlaceSound();
      } else {
        playCardMoveSound();
      }
    }
    setGameState(prev => {
      let actualScoreDelta = scoreDelta;
      if (settings.scoringType === 'vegas') {
        actualScoreDelta = destination.startsWith('foundation') ? 5 : 0;
      }

      const newState = {
        ...prev,
        moves: prev.moves + 1,
        score: prev.score + actualScoreDelta,
        waste: [...prev.waste],
        foundations: prev.foundations.map(f => [...f]),
        tableaus: prev.tableaus.map(t => [...t])
      };

      let movingCards: CardType[] = [];

      // Remove from source
      if (source === 'waste') {
        movingCards = [newState.waste.pop()!];
      } else if (source.startsWith('foundation')) {
        const idx = parseInt(source.split('-')[1]);
        movingCards = [newState.foundations[idx].pop()!];
        newState.score -= settings.scoringType === 'vegas' ? 5 : 15; // Penalty for moving from foundation
      } else if (source.startsWith('tableau')) {
        const idx = parseInt(source.split('-')[1]);
        const tableau = newState.tableaus[idx];
        const sIdx = stackIndex !== -1 ? stackIndex : tableau.findIndex(c => c.id === card.id);
        movingCards = tableau.splice(sIdx);
        // Flip top card if needed
        if (tableau.length > 0 && !tableau[tableau.length - 1].isFaceUp) {
          tableau[tableau.length - 1] = { ...tableau[tableau.length - 1], isFaceUp: true };
          if (settings.scoringType === 'standard') newState.score += 5;
          if (settings.sfxEnabled) setTimeout(() => playCardFlipSound(), 150); // Small delay to separate from move snap
        }
      }

      // Add to destination
      if (destination.startsWith('foundation')) {
        const idx = parseInt(destination.split('-')[1]);
        newState.foundations[idx].push(...movingCards);
      } else if (destination.startsWith('tableau')) {
        const idx = parseInt(destination.split('-')[1]);
        newState.tableaus[idx].push(...movingCards);
      }

      return newState;
    });
  };

  const handleQuickMove = (card: CardType, source: string, stackIndex: number) => {
    if (!card.isFaceUp) return;

    // Check if it's the top card of the stack or a completely face-up stack (for tableau-to-tableau dragging vs clicking)
    // Actually, for Quick Move, we usually only move the entire valid stack or the top card. 
    // If it's a top card:
    let isTop = false;
    if (source === 'waste' && stackIndex === gameState.waste.length - 1) isTop = true;
    if (source.startsWith('tableau') && stackIndex === gameState.tableaus[parseInt(source.split('-')[1])].length - 1) isTop = true;

    // 1. Try to move to foundation first (only possible for single top cards)
    if (isTop) {
      for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, gameState.foundations[i])) {
          saveHistory(gameState);
          moveCard(source, `foundation-${i}`, card, 10, stackIndex);
          return;
        }
      }
    }

    // 2. Try to move to a tableau (can move a stack if card is logically at the bottom of a face-up sequence)
    // To keep it simple and match standard tap-to-move, if a user taps a face-up card in the middle of a tableau stack,
    // we try to move that card (and all cards on top of it) to another valid tableau.
    for (let i = 0; i < 7; i++) {
      const targetTableau = gameState.tableaus[i];
      // Prevent moving a stack to the exact same tableau
      if (source === `tableau-${i}`) continue;

      if (canMoveToTableau(card, targetTableau)) {
        // Only move kings to empty spots if they are NOT already at the bottom of a column to avoid infinite loops
        const isKingAtBottom = card.value === 13 && stackIndex === 0 && source.startsWith('tableau');
        if (!isKingAtBottom) {
          saveHistory(gameState);
          moveCard(source, `tableau-${i}`, card, 5, stackIndex);
          return;
        }
      }
    }

    if (settings.sfxEnabled) playErrorSound();
  };

  const showHint = () => {
    if (winningPath && winningPath.length > 0) {
      // Advanced Hint: Show up to 3 sequential moves!
      const nextMoves = winningPath.slice(0, 3).map(move => translateMoveToHint(gameState, move));
      setHint(nextMoves);
      setGameState(prev => ({ ...prev, score: Math.max(0, prev.score - 5) })); // Penalty for hint
    } else {
      // Fallback to basic hint if deep search failed or hasn't finished calculating yet
      const h = getHint(gameState.stock, gameState.waste, gameState.foundations, gameState.tableaus);
      setHint(h ? [h] : []);
      if (h) {
        setGameState(prev => ({ ...prev, score: Math.max(0, prev.score - 5) }));
      }
    }
  };

  const canAutoComplete = () => {
    // Check if there are ANY face-down cards left anywhere in the tableaus
    for (const tableau of gameState.tableaus) {
      if (tableau.some(c => !c.isFaceUp)) return false;
    }

    // Must have no stock or waste left because our auto-complete logic only targets foundations 
    // and doesn't do complex tableau-to-tableau unblocking needed when stock/waste are present.
    if (gameState.stock.length === 0 && gameState.waste.length === 0) return true;

    return false;
  };

  const doAutoComplete = () => {
    if (!canAutoComplete()) return;
    setIsAutoCompleting(true);

    const interval = setInterval(() => {
      setGameState(prev => {
        const newState = {
          ...prev,
          tableaus: prev.tableaus.map(t => [...t]),
          foundations: prev.foundations.map(f => [...f]),
          stock: [...prev.stock],
          waste: [...prev.waste]
        };

        // 1. Try Tableau cards
        for (let i = 0; i < 7; i++) {
          const tableau = newState.tableaus[i];
          if (tableau.length > 0) {
            const card = tableau[tableau.length - 1];
            for (let j = 0; j < 4; j++) {
              if (canMoveToFoundation(card, newState.foundations[j])) {
                tableau.pop();
                newState.foundations[j].push(card);
                newState.score += 10;
                return newState; // Return early, don't break interval
              }
            }
          }
        }

        // 2. Try Waste card (only if auto-complete was somehow invoked with waste)
        if (newState.waste.length > 0) {
          const card = newState.waste[newState.waste.length - 1];
          for (let j = 0; j < 4; j++) {
            if (canMoveToFoundation(card, newState.foundations[j])) {
              newState.waste.pop();
              newState.foundations[j].push(card);
              newState.score += 10;
              return newState; // Return early
            }
          }
        }

        // If we get here, no cards could be moved to the foundation.
        // It's finished (either won, or impossible to auto-complete further).
        clearInterval(interval);
        setIsAutoCompleting(false);
        return newState;
      });
    }, 50); // Faster interval for cooler zip effect
  };

  const doAutoPlay = async () => {
    setIsDeepSearching(true);
    setHint(null);

    // Step 1: Find the path without freezing the UI via event loop yielding
    const solver = findWinningPath(gameState, settings.difficulty === 'easy' ? 1 : 3);

    const runSolver = (): Promise<GameMove[] | null> => {
      return new Promise((resolve) => {
        const calculateChunk = () => {
          const result = solver.next();
          if (result.done) {
            resolve(result.value);
          } else {
            // result.value is the iteration count. Yield to paint/event loop.
            setTimeout(calculateChunk, 0);
          }
        };
        calculateChunk();
      });
    };

    const path = await runSolver();

    if (!path) {
      alert("No mathematically guaranteed winning path from this exact board state within computation limits. (Try Undo or Draw again)");
      setIsDeepSearching(false);
      return;
    }

    // Step 2: Play the path visually
    let index = 0;

    const playNextMove = () => {
      if (index >= path.length) {
        setIsDeepSearching(false);
        return;
      }

      const move = path[index];
      setGameState(prevState => applyMove(prevState, move, settings.difficulty === 'easy' ? 1 : 3));
      index++;
      setTimeout(playNextMove, 200); // 200ms delay between AI moves
    };

    playNextMove();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`h-full min-h-screen flex flex-col ${theme.tableStyle} ${theme.tableImageUrl ? 'bg-cover bg-center bg-no-repeat bg-fixed' : ''} p-4 sm:p-8 pb-32 sm:pb-40 font-sans transition-colors duration-500 overflow-y-auto overflow-x-hidden`}
      style={theme.tableImageUrl ? { backgroundImage: `url(${theme.tableImageUrl})` } : undefined}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 bg-black/20 p-4 rounded-xl text-white shadow-lg backdrop-blur-sm relative transition-all">
        {isDeadEnd && (
          fullHistory.length === 0 ? (
            <button
              onClick={handleRedraw}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-400 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce cursor-pointer transition-colors z-20"
            >
              <AlertTriangle size={16} />
              <span>UNWINNABLE DEAL &mdash; REDRAW NOW?</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAnalyzing(true)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-400 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce cursor-pointer transition-colors z-20"
            >
              <AlertTriangle size={16} />
              <span>DEAD END REACHED &mdash; ANALYZE MISTAKE?</span>
            </button>
          )
        )}
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider opacity-70">Score</span>
            <span className={`text-xl sm:text-2xl font-mono font-bold ${gameState.score < 0 && settings.scoringType === 'vegas' ? 'text-rose-400' : ''}`}>
              {settings.scoringType === 'vegas'
                ? (gameState.score < 0 ? `-$${Math.abs(gameState.score)}` : `$${gameState.score}`)
                : gameState.score}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider opacity-70">Moves</span>
            <span className="text-xl sm:text-2xl font-mono font-bold">{gameState.moves}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider opacity-70">Time</span>
            <span className="text-xl sm:text-2xl font-mono font-bold">{formatTime(gameState.time)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 sm:mt-0">
          <button onClick={onMenu} className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2">
            <Settings size={18} /> <span className="hidden sm:inline">Menu</span>
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || settings.difficulty === 'hard'}
            className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <Undo2 size={18} /> <span className="hidden sm:inline">Undo</span>
          </button>
          <button onClick={showHint} className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2">
            <Lightbulb size={18} /> <span className="hidden sm:inline">Hint</span>
          </button>

          {settings.autoPlayEnabled && !isAutoCompleting && !isDeepSearching && (
            <button onClick={doAutoPlay} className="p-2 sm:px-4 sm:py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Cpu size={18} /> <span className="hidden sm:inline">Auto-Play</span>
            </button>
          )}
          {isDeepSearching && (
            <button disabled className="p-2 sm:px-4 sm:py-2 bg-indigo-500/50 text-white rounded-lg flex items-center gap-2 shadow-lg animate-pulse cursor-not-allowed">
              <Cpu size={18} /> <span className="hidden sm:inline">Thinking...</span>
            </button>
          )}

          {canAutoComplete() && !isAutoCompleting && !isDeepSearching && (
            <button onClick={doAutoComplete} className="p-2 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-pulse">
              <FastForward size={18} /> <span className="hidden sm:inline">Auto-Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto w-full grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
        {/* Top Row */}
        <div className="col-span-1" style={{ order: settings.leftHandedMode ? 7 : 1 }}>
          <Pile onClick={drawCard} className="cursor-pointer hover:bg-black/20 transition-colors w-full">
            {gameState.stock.length > 0 && (
              <Card card={gameState.stock[gameState.stock.length - 1]} theme={theme} largePrintMode={settings.largePrintMode} />
            )}
          </Pile>
        </div>
        <div className="col-span-1" style={{ order: settings.leftHandedMode ? 6 : 2 }}>
          <Pile className="w-full">
            {gameState.waste.length > 0 && (
              <div className="relative w-full h-full">
                {gameState.waste.slice(-3).map((card, i, arr) => {
                  // Calculate absolute index to prevent cards from jumping when top card is removed
                  const absIndex = gameState.waste.length - arr.length + i;
                  const offset = settings.difficulty === 'easy' ? 0 : (absIndex % 3);
                  return (
                    <div
                      key={card.id}
                      className="absolute top-0 w-full"
                      style={{ left: `${offset * 12}%`, zIndex: i }}
                    >
                      <Card
                        largePrintMode={settings.largePrintMode}
                        card={card}
                        theme={theme}
                        isDraggable={i === arr.length - 1}
                        onDragStart={(e) => handleDragStart(e, card, 'waste', gameState.waste.length - 1)}
                        onClick={() => handleQuickMove(card, 'waste', gameState.waste.length - 1)}
                        className={hint.some(h => h.from === 'waste' && i === arr.length - 1) ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Pile>
        </div>
        <div className="col-span-1" style={{ order: settings.leftHandedMode ? 5 : 3 }}></div> {/* Empty space */}
        {gameState.foundations.map((foundation, i) => (
          <div key={`foundation-${i}`} className="col-span-1" style={{ order: settings.leftHandedMode ? i + 1 : i + 4 }}>
            <Pile
              onDrop={(e) => handleDropOnFoundation(e, i)}
              emptyText="A"
              className={`w-full ${hint.some(h => h.to === `foundation-${i}`) ? 'ring-4 ring-yellow-400/50' : ''}`}
            >
              {foundation.length > 0 && (
                <Card
                  largePrintMode={settings.largePrintMode}
                  card={foundation[foundation.length - 1]}
                  theme={theme}
                  isDraggable={true}
                  onDragStart={(e) => handleDragStart(e, foundation[foundation.length - 1], `foundation-${i}`, foundation.length - 1)}
                />
              )}
            </Pile>
          </div>
        ))}

        {/* Bottom Row: Tableaus */}
        {gameState.tableaus.map((tableau, i) => (
          <div key={`tableau-${i}`} className="col-span-1 mt-2 sm:mt-4 md:mt-6 order-last">
            <Pile
              onDrop={(e) => handleDropOnTableau(e, i)}
              className="w-full border-none bg-transparent"
            >
              {tableau.length === 0 ? (
                <div className={`w-full aspect-[2/3] rounded-lg border-2 border-dashed border-white/20 bg-black/5 ${hint.some(h => h.to === `tableau-${i}`) ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`} />
              ) : (
                <div className="relative w-full h-full">
                  {tableau.map((card, j) => {
                    // Calculate top offset based on previous cards using percentages
                    // This ensures the spacing scales perfectly with the card size
                    const topOffset = tableau.slice(0, j).reduce((acc, c) => acc + (c.isFaceUp ? 22 : 12), 0);

                    const isHintSource = hint.some(h => h.from === `tableau-${i}` && h.card?.id === card.id);
                    const isHintDest = hint.some(h => h.to === `tableau-${i}` && j === tableau.length - 1);

                    return (
                      <div
                        key={card.id}
                        className="absolute left-0 w-full"
                        style={{ top: `${topOffset}%`, zIndex: j }}
                      >
                        <Card
                          largePrintMode={settings.largePrintMode}
                          card={card}
                          theme={theme}
                          thoughtfulMode={settings.thoughtfulMode}
                          isDraggable={card.isFaceUp}
                          onDragStart={(e) => handleDragStart(e, card, `tableau-${i}`, j)}
                          onClick={() => handleQuickMove(card, `tableau-${i}`, j)}
                          className={`${isHintSource ? 'ring-4 ring-yellow-400 animate-pulse' : ''} ${isHintDest ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Pile>
          </div>
        ))}
      </div>

      {isWon && (
        <VictoryAnimation
          theme={theme}
          onComplete={() => onWin({ time: gameState.time, moves: gameState.moves, score: gameState.score })}
        />
      )}

      {isAnalyzing && (
        <Analyzer
          history={[...fullHistory, gameState]}
          drawCount={settings.difficulty === 'easy' ? 1 : 3}
          onClose={() => setIsAnalyzing(false)}
          onRestore={(state, index) => {
            setGameState(state);
            setFullHistory(prev => prev.slice(0, index));
            setHistory([]);
          }}
        />
      )}
    </div>
  );
};
