import React, { useEffect, useRef } from 'react';
import { Card, Theme } from '../types';
import { getCardImageUrl } from '../services/imageService';

interface VictoryAnimationProps {
    theme: Theme;
    onComplete: () => void;
}

interface PhysicsCard {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    imageUrl: string;
    suitStyleClass: string;
    delay: number;
    active: boolean;
}

export const VictoryAnimation: React.FC<VictoryAnimationProps> = ({ theme, onComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [cards, setCards] = React.useState<PhysicsCard[]>([]);
    const animationRef = useRef<number>();

    useEffect(() => {
        // Generate the 52 cards
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];

        const initialCards: PhysicsCard[] = [];
        let delayCounter = 0;

        // We cascade them from the top roughly where the foundations are.
        // For simplicity, we just distribute them horizontally across the top.

        for (let i = 0; i < 4; i++) {
            const suit = suits[i];
            for (let j = 0; j < 13; j++) {
                const rank = ranks[j];
                initialCards.push({
                    id: `${suit}-${rank}`,
                    x: 100 + i * 150, // Approximate starting X for foundation piles
                    y: 50, // Starting Y
                    vx: -5 + Math.random() * 10, // Initial horizontal velocity
                    vy: -5 - Math.random() * 5, // Initial vertical jump
                    imageUrl: getCardImageUrl(theme.id, suit, rank),
                    suitStyleClass: theme.suitStyles[suit as keyof typeof theme.suitStyles].background,
                    delay: delayCounter * 10, // Frames to wait before activating
                    active: false,
                });
                delayCounter++;
            }
        }

        setCards(initialCards);

        let frames = 0;

        const animate = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            let allDone = true;

            initialCards.forEach(card => {
                if (!card.active) {
                    if (frames >= card.delay) {
                        card.active = true;
                    } else {
                        allDone = false;
                        return;
                    }
                }

                // Apply gravity
                card.vy += 0.5;

                // Move
                card.x += card.vx;
                card.y += card.vy;

                // Bounce off bottom
                if (card.y > height) {
                    card.y = height;
                    card.vy = -card.vy * 0.7; // Dampen bounce
                }

                // Bounce off sides
                if (card.x < 0) {
                    card.x = 0;
                    card.vx = -card.vx;
                } else if (card.x > width) {
                    card.x = width;
                    card.vx = -card.vx;
                }

                // Check if still moving significantly
                if (card.y < height || Math.abs(card.vy) > 1 || Math.abs(card.vx) > 0.1) {
                    allDone = false;

                    // Add friction when rolling on the ground
                    if (card.y >= height) {
                        card.vx *= 0.95;
                    }
                }
            });

            // Update the DOM manually for performance instead of triggering React state
            initialCards.forEach((card, index) => {
                if (!card.active) return;
                const el = document.getElementById(`victory-card-${index}`);
                if (el) {
                    el.style.transform = `translate(${card.x}px, ${card.y}px)`;
                    el.style.display = 'block';
                }
            });

            frames++;

            if (allDone && frames > 100) {
                // Animation finished!
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
                <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center z-[101]">
                    <h1 className="text-4xl md:text-5xl font-bold text-amber-500 mb-4 animate-bounce" style={{ fontFamily: theme.fontFamily }}>Victory!</h1>
                    <p className="text-zinc-300 mb-8">You have successfully cleared the deck.</p>
                    <button
                        onClick={onComplete}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        Continue to Menu
                    </button>
                </div>
            </div>

            {/* Render the 52 cards as absolute positioned generic divs */}
            {cards.map((card, index) => (
                <div
                    key={index}
                    id={`victory-card-${index}`}
                    className={`absolute top-0 left-0 w-16 h-24 sm:w-20 sm:h-32 rounded-md shadow-lg bg-white bg-cover bg-center hidden z-[100]`}
                    style={{ backgroundImage: `url(${card.imageUrl})` }}
                />
            ))}
        </div>
    );
};
