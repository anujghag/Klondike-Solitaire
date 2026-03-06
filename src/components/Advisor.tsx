import React, { useState, useEffect, useRef } from 'react';
import { GameState, Theme } from '../types';

// ─── Theme Dialogue Pools ─────────────────────────────────────────────────────

interface DialoguePool {
  firstFoundation: string[];
  emptyColumn: string[];
  halfDone: string[];
  nearDead: string[];
  goodStreak: string[];
  idle: string[];
}

const THEME_DIALOGUES: Record<string, DialoguePool> = {
  'mystic-void': {
    firstFoundation: [
      'The first seal breaks…',
      'A thread pulled from the fog.',
      'The Pupil-less Eye watches your progress.',
    ],
    emptyColumn: [
      'An emptied column… the Void yawns wider.',
      'Nothing remains but potential.',
      'The sequences align in the darkness.',
    ],
    halfDone: [
      'The pathways converge at the halfway mark.',
      'Above the Grey Fog, light begins to show.',
      'Beyonder, you are halfway through the labyrinth.',
    ],
    nearDead: [
      'The threads narrow… choose wisely.',
      'I sense a constriction in the paths.',
      'Careful. The Fool\'s trap lies ahead.',
    ],
    goodStreak: [
      'Your clarity is remarkable, Beyonder.',
      'The sequences flow like quicksilver.',
      'Even the High-Sequence Beyonders would nod.',
    ],
    idle: [
      'The fog swirls gently…',
      'Patience is a Beyonder\'s greatest weapon.',
      'The cards wait for your insight.',
    ],
  },
  'classic-luxury': {
    firstFoundation: [
      'An excellent opening, sir.',
      'First card to the foundation. Well played.',
      'The game begins in earnest.',
    ],
    emptyColumn: [
      'A column cleared — room to maneuver.',
      'Space created. Opportunity awaits.',
      'Well managed, if I may say so.',
    ],
    halfDone: [
      'Halfway there. You\'re doing splendidly.',
      'The foundations grow. Keep this pace.',
      'A fine showing thus far.',
    ],
    nearDead: [
      'Careful now — options are thinning.',
      'A tricky position. Consider your undo.',
      'The margin grows slim.',
    ],
    goodStreak: [
      'Brilliant sequence of moves.',
      'You move with the confidence of a champion.',
      'Masterfully done.',
    ],
    idle: [
      'Take your time. No rush.',
      'The cards are patient.',
      'A moment of reflection never hurts.',
    ],
  },
  'ethereal-light': {
    firstFoundation: [
      'A spark of light rises ✨',
      'The first card ascends!',
      'Beautiful beginning.',
    ],
    emptyColumn: [
      'An opening appears in the garden...',
      'Space blooms between the cards.',
      'Fresh air flows through.',
    ],
    halfDone: [
      'Halfway! The light grows stronger.',
      'You\'re glowing with momentum!',
      'The path ahead is clear.',
    ],
    nearDead: [
      'The petals wilt slightly…',
      'Hmm, the light flickers ahead.',
      'Tread softly here.',
    ],
    goodStreak: [
      'A cascade of brilliance!',
      'You shine like the dawn!',
      'Simply radiant moves.',
    ],
    idle: [
      'The breeze whispers patiently.',
      'Take a breath. The light waits.',
      'Beauty cannot be rushed.',
    ],
  },
  'maratha-glory': {
    firstFoundation: [
      'Jai Bhavani! The campaign begins.',
      'First conquest claimed, Sardar.',
      'The fortress wall rises.',
    ],
    emptyColumn: [
      'Ground cleared! Advance the Hukumdar.',
      'A column falls — press the advantage!',
      'The enemy retreats. Occupy the pass.',
    ],
    halfDone: [
      'Half the field is ours, Maharaj!',
      'Swarajya is within reach.',
      'The Maratha flag flies higher.',
    ],
    nearDead: [
      'The siege tightens… plan your sortie.',
      'Careful, Sardar — ambush territory.',
      'Our forces thin. Caution advised.',
    ],
    goodStreak: [
      'Chhatrapati himself would be proud!',
      'A blitzkrieg of moves. Unstoppable!',
      'The legend grows with each card.',
    ],
    idle: [
      'The battlefield awaits your command.',
      'Even the mightiest pause before the charge.',
      'Patience before the thunder, Sardar.',
    ],
  },
};

const DEFAULT_POOL: DialoguePool = {
  firstFoundation: ['First foundation card placed!'],
  emptyColumn: ['Column cleared!'],
  halfDone: ['Halfway done!'],
  nearDead: ['Getting tight...'],
  goodStreak: ['Nice moves!'],
  idle: ['Thinking...'],
};

// ─── Advisor Component ────────────────────────────────────────────────────────

interface AdvisorProps {
  gameState: GameState;
  theme: Theme;
}

const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const Advisor: React.FC<AdvisorProps> = ({ gameState, theme }) => {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const prevFoundations = useRef(0);
  const prevEmptyColumns = useRef(0);
  const movesSinceMsg = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastMsgTime = useRef(Date.now());

  const pool = THEME_DIALOGUES[theme.id] || DEFAULT_POOL;

  const showMessage = (msg: string) => {
    // Throttle: at least 4 seconds between messages
    if (Date.now() - lastMsgTime.current < 4000) return;
    lastMsgTime.current = Date.now();

    setMessage(msg);
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 3500);
  };

  useEffect(() => {
    const totalFoundations = gameState.foundations.reduce((sum, f) => sum + f.length, 0);
    const emptyColumns = gameState.tableaus.filter(t => t.length === 0).length;

    // 1. First foundation card
    if (totalFoundations === 1 && prevFoundations.current === 0) {
      showMessage(pickRandom(pool.firstFoundation));
    }
    // 2. Half done (26 cards in foundations)
    else if (totalFoundations >= 26 && prevFoundations.current < 26) {
      showMessage(pickRandom(pool.halfDone));
    }
    // 3. Empty column appeared 
    else if (emptyColumns > prevEmptyColumns.current && emptyColumns > 0) {
      showMessage(pickRandom(pool.emptyColumn));
    }
    // 4. Good streak (3+ foundations in a row without other messages)
    else if (totalFoundations > prevFoundations.current) {
      movesSinceMsg.current++;
      if (movesSinceMsg.current >= 3) {
        showMessage(pickRandom(pool.goodStreak));
        movesSinceMsg.current = 0;
      }
    }

    prevFoundations.current = totalFoundations;
    prevEmptyColumns.current = emptyColumns;
  }, [gameState.foundations, gameState.tableaus]);

  // Idle message after 30 seconds of no moves
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      if (gameState.moves > 0) {
        showMessage(pickRandom(pool.idle));
      }
    }, 30000);
    return () => clearTimeout(idleTimer);
  }, [gameState.moves]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible || !message) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 max-w-xs px-4 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-md border transition-all duration-500 z-[9999] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        background: 'rgba(0,0,0,0.55)',
        borderColor: 'rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.9)',
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
        The Advisor
      </div>
      {message}
    </div>
  );
};
