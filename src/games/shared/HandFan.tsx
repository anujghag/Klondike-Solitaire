import React, { useEffect, useRef, useState } from 'react';
import { Card as CardType } from '../../types';

interface HandFanProps {
  cards: CardType[];
  renderCard: (card: CardType) => React.ReactNode;
  /** Extra classes per card wrapper (hover lift, cursor, opacity…). */
  wrapperClass?: (card: CardType) => string;
  /** Upper bound for card width in px (default 80). */
  maxCardWidth?: number;
}

/**
 * A fanned hand that always fits its container: card width and overlap are
 * computed from the measured container width, so a 13-card hand fits a
 * 5-inch phone and still spreads out on a desktop.
 */
export const HandFan: React.FC<HandFanProps> = ({
  cards, renderCard, wrapperClass, maxCardWidth = 80,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = cards.length;
  if (n === 0) return <div ref={containerRef} className="w-full" />;

  // Card width: generous when few cards, bounded by what n cards can show legibly.
  const cardW = width === 0 ? 0 : Math.max(
    36,
    Math.min(maxCardWidth, width / 4.5),
  );
  // Step between cards: comfortable overlap, compressed until the hand fits.
  const idealStep = cardW * 0.62;
  const step = n === 1 ? 0 : Math.min(idealStep, (width - cardW) / (n - 1));
  const totalW = cardW + step * (n - 1);
  const cardH = cardW * 1.5;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {width > 0 && (
        <div data-handfan className="relative" style={{ width: totalW, height: cardH + 18 }}>
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`absolute top-0 transition-transform duration-150 ${wrapperClass?.(card) ?? ''}`}
              style={{ left: i * step, width: cardW, zIndex: i }}
            >
              {renderCard(card)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
