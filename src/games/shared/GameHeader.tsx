import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  accent?: string; // optional tailwind text color class
}

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
  onExit: () => void;
  children?: React.ReactNode; // action buttons
  banner?: React.ReactNode;   // floating alert banner (dead end etc.)
}

/** Shared translucent header bar used by every game board. */
export const GameHeader: React.FC<GameHeaderProps> = ({ title, subtitle, stats, onExit, children, banner }) => (
  <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 bg-black/25 p-3 sm:p-4 rounded-xl text-white shadow-lg backdrop-blur-sm relative">
    {banner}
    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
      <button
        onClick={onExit}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors shrink-0"
        aria-label="Back to games"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="flex flex-col min-w-0">
        <span className="text-sm sm:text-lg font-bold tracking-wide truncate">{title}</span>
        {subtitle && <span className="text-[10px] sm:text-xs opacity-60 uppercase tracking-widest truncate">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-3 sm:gap-6 pl-2 sm:pl-4 border-l border-white/10">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-60">{s.label}</span>
            <span className={`text-base sm:text-xl font-mono font-bold leading-tight ${s.accent ?? ''}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex gap-2 flex-wrap">{children}</div>
  </div>
);

export const HeaderButton: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, className = '', children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-white text-sm ${className}`}
  >
    {children}
  </button>
);
