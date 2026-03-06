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
    }
];

export const DEFAULT_THEME = THEMES[0];
