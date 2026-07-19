import { Theme } from './types';

export const THEMES: Theme[] = [
    {
        id: 'mystic-void',
        name: 'Abyssal Void',
        fontFamily: '"Cinzel", serif',
        tableStyle: 'bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-600 via-zinc-900 to-black',
        tableImageUrl: '/assets/themes/mystic-void/table.webp',
        cardBack: 'mystic-back',
        cardBackImageUrl: '/assets/themes/mystic-void/back.webp',
        showCharacters: true,
        suitStyles: {
            hearts: {
                text: 'text-rose-200',
                symbol: 'text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#4c0519_0%,_#09090b_100%)]',
                border: 'border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.2)]',
            },
            diamonds: {
                text: 'text-amber-200',
                symbol: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#78350f_0%,_#09090b_100%)]',
                border: 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
            },
            spades: {
                text: 'text-zinc-300',
                symbol: 'text-zinc-500 drop-shadow-[0_0_8px_rgba(113,113,122,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#18181b_0%,_#000000_100%)]',
                border: 'border-zinc-400/50 shadow-[0_0_10px_rgba(161,161,170,0.2)]',
            },
            clubs: {
                text: 'text-emerald-200',
                symbol: 'text-emerald-600 drop-shadow-[0_0_8px_rgba(5,150,105,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#064e3b_0%,_#09090b_100%)]',
                border: 'border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            }
        }
    },
    {
        id: 'classic-luxury',
        name: 'Classic Luxury',
        fontFamily: '"Playfair Display", serif',
        tableStyle: 'bg-emerald-900 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800 to-emerald-950',
        cardBack: 'luxury-back',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-red-900',
                symbol: 'text-red-600',
                background: 'bg-stone-100',
                border: 'border-stone-300',
            },
            diamonds: {
                text: 'text-red-900',
                symbol: 'text-red-600',
                background: 'bg-stone-100',
                border: 'border-stone-300',
            },
            spades: {
                text: 'text-slate-900',
                symbol: 'text-slate-800',
                background: 'bg-stone-100',
                border: 'border-stone-300',
            },
            clubs: {
                text: 'text-slate-900',
                symbol: 'text-slate-800',
                background: 'bg-stone-100',
                border: 'border-stone-300',
            }
        }
    },
    {
        id: 'ethereal-light',
        name: 'Ethereal Light',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-indigo-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-300 via-indigo-500 to-indigo-900',
        cardBack: 'ethereal-back',
        cardBackImageUrl: '/assets/themes/ethereal-light/back.webp',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-rose-500',
                symbol: 'text-rose-400 drop-shadow-[0_0_4px_rgba(251,113,133,0.5)]',
                background: 'bg-white',
                border: 'border-white',
            },
            diamonds: {
                text: 'text-orange-500',
                symbol: 'text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]',
                background: 'bg-white',
                border: 'border-white',
            },
            spades: {
                text: 'text-slate-700',
                symbol: 'text-slate-500 drop-shadow-[0_0_4px_rgba(100,116,139,0.5)]',
                background: 'bg-white',
                border: 'border-white',
            },
            clubs: {
                text: 'text-teal-600',
                symbol: 'text-teal-400 drop-shadow-[0_0_4px_rgba(45,212,191,0.5)]',
                background: 'bg-white',
                border: 'border-white',
            }
        }
    },
    {
        id: 'maratha-glory',
        name: 'Maratha Glory',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-emerald-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-700 via-emerald-900 to-black',
        tableImageUrl: '/assets/themes/maratha-glory/table.webp',
        cardBack: 'luxury-back',
        cardBackImageUrl: '/assets/themes/maratha-glory/back.webp',
        showCharacters: true,
        suitStyles: {
            spades: {
                text: 'text-indigo-200',
                symbol: 'text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#312e81_0%,_#09090b_100%)]',
                border: 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
            },
            hearts: {
                text: 'text-red-200',
                symbol: 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#7f1d1d_0%,_#09090b_100%)]',
                border: 'border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]',
            },
            diamonds: {
                text: 'text-emerald-200',
                symbol: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#064e3b_0%,_#09090b_100%)]',
                border: 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
            },
            clubs: {
                text: 'text-orange-200',
                symbol: 'text-orange-600 drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]',
                background: 'bg-zinc-900 bg-[radial-gradient(circle_at_50%_50%,_#78350f_0%,_#09090b_100%)]',
                border: 'border-orange-500/50 shadow-[0_0_10px_rgba(234,88,12,0.2)]',
            }
        }
    },
    {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-blue-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-700 via-blue-950 to-slate-950',
        cardBack: 'ocean-back',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-rose-200',
                symbol: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]',
                background: 'bg-slate-900 bg-[radial-gradient(circle_at_50%_50%,_#4c1d3f_0%,_#020617_100%)]',
                border: 'border-rose-400/50 shadow-[0_0_10px_rgba(251,113,133,0.2)]',
            },
            diamonds: {
                text: 'text-cyan-100',
                symbol: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]',
                background: 'bg-slate-900 bg-[radial-gradient(circle_at_50%_50%,_#155e75_0%,_#020617_100%)]',
                border: 'border-cyan-400/50 shadow-[0_0_10px_rgba(103,232,249,0.25)]',
            },
            spades: {
                text: 'text-blue-100',
                symbol: 'text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.7)]',
                background: 'bg-slate-900 bg-[radial-gradient(circle_at_50%_50%,_#1e3a8a_0%,_#020617_100%)]',
                border: 'border-blue-400/50 shadow-[0_0_10px_rgba(147,197,253,0.2)]',
            },
            clubs: {
                text: 'text-teal-100',
                symbol: 'text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.7)]',
                background: 'bg-slate-900 bg-[radial-gradient(circle_at_50%_50%,_#134e4a_0%,_#020617_100%)]',
                border: 'border-teal-400/50 shadow-[0_0_10px_rgba(94,234,212,0.2)]',
            },
        },
    },
    {
        id: 'jungle-canopy',
        name: 'Jungle Canopy',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-green-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600 via-green-900 to-emerald-950',
        cardBack: 'jungle-back',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-orange-100',
                symbol: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]',
                background: 'bg-emerald-950 bg-[radial-gradient(circle_at_50%_50%,_#7c2d12_0%,_#022c22_100%)]',
                border: 'border-orange-400/50 shadow-[0_0_10px_rgba(251,146,60,0.2)]',
            },
            diamonds: {
                text: 'text-yellow-100',
                symbol: 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]',
                background: 'bg-emerald-950 bg-[radial-gradient(circle_at_50%_50%,_#713f12_0%,_#022c22_100%)]',
                border: 'border-yellow-400/50 shadow-[0_0_10px_rgba(253,224,71,0.2)]',
            },
            spades: {
                text: 'text-emerald-100',
                symbol: 'text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]',
                background: 'bg-emerald-950 bg-[radial-gradient(circle_at_50%_50%,_#064e3b_0%,_#01120c_100%)]',
                border: 'border-emerald-400/50 shadow-[0_0_10px_rgba(110,231,183,0.2)]',
            },
            clubs: {
                text: 'text-lime-100',
                symbol: 'text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.8)]',
                background: 'bg-emerald-950 bg-[radial-gradient(circle_at_50%_50%,_#3f6212_0%,_#022c22_100%)]',
                border: 'border-lime-400/50 shadow-[0_0_10px_rgba(190,242,100,0.2)]',
            },
        },
    },
    {
        id: 'deep-space',
        name: 'Deep Space',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800 via-slate-950 to-black',
        cardBack: 'space-back',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-fuchsia-100',
                symbol: 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]',
                background: 'bg-zinc-950 bg-[radial-gradient(circle_at_50%_50%,_#701a75_0%,_#000000_100%)]',
                border: 'border-fuchsia-500/50 shadow-[0_0_10px_rgba(232,121,249,0.25)]',
            },
            diamonds: {
                text: 'text-cyan-100',
                symbol: 'text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]',
                background: 'bg-zinc-950 bg-[radial-gradient(circle_at_50%_50%,_#164e63_0%,_#000000_100%)]',
                border: 'border-cyan-400/50 shadow-[0_0_10px_rgba(103,232,249,0.25)]',
            },
            spades: {
                text: 'text-indigo-100',
                symbol: 'text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.9)]',
                background: 'bg-zinc-950 bg-[radial-gradient(circle_at_50%_50%,_#312e81_0%,_#000000_100%)]',
                border: 'border-indigo-400/50 shadow-[0_0_10px_rgba(165,180,252,0.25)]',
            },
            clubs: {
                text: 'text-violet-100',
                symbol: 'text-violet-300 drop-shadow-[0_0_10px_rgba(196,181,253,0.9)]',
                background: 'bg-zinc-950 bg-[radial-gradient(circle_at_50%_50%,_#4c1d95_0%,_#000000_100%)]',
                border: 'border-violet-400/50 shadow-[0_0_10px_rgba(196,181,253,0.25)]',
            },
        },
    },
    {
        id: 'valentine-romance',
        name: 'Valentine Romance',
        fontFamily: '"Playfair Display", serif',
        tableStyle: 'bg-rose-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-300 via-rose-500 to-rose-900',
        cardBack: 'valentine-back',
        showCharacters: false,
        suitStyles: {
            hearts: {
                text: 'text-red-600',
                symbol: 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]',
                background: 'bg-rose-50',
                border: 'border-rose-200',
            },
            diamonds: {
                text: 'text-pink-600',
                symbol: 'text-pink-500 drop-shadow-[0_0_4px_rgba(236,72,153,0.5)]',
                background: 'bg-rose-50',
                border: 'border-rose-200',
            },
            spades: {
                text: 'text-purple-800',
                symbol: 'text-purple-700 drop-shadow-[0_0_4px_rgba(126,34,206,0.4)]',
                background: 'bg-rose-50',
                border: 'border-rose-200',
            },
            clubs: {
                text: 'text-rose-800',
                symbol: 'text-rose-700 drop-shadow-[0_0_4px_rgba(190,18,60,0.4)]',
                background: 'bg-rose-50',
                border: 'border-rose-200',
            },
        },
    },
    {
        id: 'cutie-pets',
        name: 'Cutie Pets',
        fontFamily: '"Outfit", sans-serif',
        tableStyle: 'bg-sky-600 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200 via-sky-400 to-blue-800',
        cardBack: 'pets-back',
        showCharacters: false,
        // Puppy hearts, kitten diamonds, panda clubs, rabbit spades — tiger guards the back.
        suitEmojis: { hearts: '🐶', diamonds: '🐱', clubs: '🐼', spades: '🐰' },
        suitStyles: {
            hearts: {
                text: 'text-orange-600',
                symbol: 'text-orange-500',
                background: 'bg-white',
                border: 'border-orange-200',
            },
            diamonds: {
                text: 'text-pink-600',
                symbol: 'text-pink-500',
                background: 'bg-white',
                border: 'border-pink-200',
            },
            spades: {
                text: 'text-violet-700',
                symbol: 'text-violet-600',
                background: 'bg-white',
                border: 'border-violet-200',
            },
            clubs: {
                text: 'text-slate-800',
                symbol: 'text-slate-700',
                background: 'bg-white',
                border: 'border-slate-300',
            },
        },
    },
];

export const DEFAULT_THEME = THEMES[0];
