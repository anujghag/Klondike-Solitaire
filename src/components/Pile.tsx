import React from 'react';

interface PileProps {
  children?: React.ReactNode;
  onClick?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  className?: string;
  emptyText?: string;
}

export const Pile: React.FC<PileProps> = ({
  children,
  onClick,
  onDrop,
  onDragOver,
  className = '',
  emptyText,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if (onDragOver) onDragOver(e);
  };

  return (
    <div
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={handleDragOver}
      className={`relative aspect-[2/3] rounded-lg border-2 border-dashed border-white/30 bg-black/10 flex items-center justify-center ${className}`}
    >
      {children ? children : (
        <span className="text-white/30 text-2xl font-bold select-none">{emptyText}</span>
      )}
    </div>
  );
};
