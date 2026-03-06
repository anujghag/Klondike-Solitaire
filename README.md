<div align="center">
  <h1>Klondike Solitaire: Premium Edition</h1>
  <p>A highly customizable, visually stunning React & TypeScript implementation of classic Solitaire.</p>
</div>

## ✨ Core Features

* **Premium Theme Engine**: Choose between gorgeous, highly-detailed aesthetic themes:
  * 🌌 **Abyssal Void** (Lord of the Mysteries inspired, animated fog and starry cards)
  * 👑 **Classic Luxury** (Elegant, clean, casino-style premium deck)
  * ✨ **Ethereal Light** (Soft, vibrant, and approachable)
  * ⚔️ **Maratha Glory** (Anime-styled 17th-century Maratha Empire historical figures)
* **Custom Asset 1:1 Linking**: Theme-specific artwork is meticulously loaded from dedicated `public/assets/themes` directories.
* **Bouncing Victory Animation**: A fully custom physics overlay that triggers on win, cascading all 52 cards across the screen in classic Windows 95 style!

## 🧠 Advanced AI & Mechanics

* **100% Deterministic Seeded Games**: The engine pulls from a massive pre-computed pool of *known-winnable* Mulberry32 PRNG seeds, theoretically eliminating the standard 20% unwinnability rate of classic Klondike!
* **Deep Search Auto-Play**: Watch the AI play the game for you. An iterative, DFS-based solver calculates up to 30,000 moves ahead to find the optimal path to victory.
* **"Why Did I Lose?" Analyzer**: If you hit a dead end, a retrospective AI analyzes your exact move history to find the fatal mistake, allowing you to step back and fix it.
* **Dead-End Detection**: The background solver analyzes the board in real-time. If you make a mistake and the board becomes mathematically unsolvable, a pulsating "DEAD END REACHED" warning will instantly appear.
* **Advanced Dependency Hints**: Clicking the Hint button highlights a sequence of up to 3 consecutive moves, teaching you *why* a move is good rather than just telling you *what* move is valid.

## 🎮 Engagement & Accessibility Improvements

* **Custom Seed Engine**: Found a fun deal? Share the seed! Manually type numeric seeds into the Play menu to replay your favorite Draw 1 or Draw 3 matches.
* **Thoughtful Mode**: Toggle this setting to make face-down cards translucent but visible, allowing you to plan ahead without guessing.
* **High-Fidelity SFX Engine**: Beautiful, latency-free Web Audio API synthesizers. Listen to realistic white-noise paper-friction card snaps, shuffling, error thuds, and a warm C-major victory arpeggio.
* **Vegas Scoring**: Toggle between standard increments and high-stakes cumulative negative score betting (-$52 start, +$5 per foundation card).
* **Detailed Statistics & Lore Titles**: Track your win percentages, fastest times, and unlock epic thematic titles depending on which theme you conquer the board with (e.g. *Sequence 9: Seer* or *Mavala*).
* **Left-Handed & Large Print Modes**: Instantly mirror the game board to place the stock on the right, or drastically increase the SVG font scales for accessibility.
* **Fast "Tap-to-Move"**: Swiftly single-click cards to logically snap them to foundations or compatible tableaus without tedious dragging.

## 🚀 Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server (Defaults to Port 3000):
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:3000` to play!
