<div align="center">
  <h1>Klondike Solitaire: Premium Edition</h1>
  <p>A highly customizable, visually stunning React & TypeScript implementation of classic Solitaire.</p>
</div>

## ✨ Core Features

* **Premium Theme Engine**: Choose between 4 gorgeous, fully-illustrated aesthetic themes — each with its own card artwork, table felt, font family, suit color palette, and card-back design. Theme selection persists across sessions via `localStorage`:
  * 🌌 **Abyssal Void** — Inspired by *Lord of the Mysteries*. Deep starfield backgrounds, fog overlays, and silver-on-dark card faces with radial gradient accents
  * 👑 **Classic Luxury** — Elegant casino-style deck with warm stone backgrounds, gold diamond-patterned card backs, and serif typography
  * ✨ **Ethereal Light** — Soft lavender/coral gradients, clean white card faces, and drop-shadow suit symbols for a vibrant, approachable feel
  * ⚔️ **Maratha Glory** — 17th-century Maratha Empire historical figures as face cards, red/saffron/gold color palette with ornate card backs

* **Custom Asset 1:1 Linking**: Every theme loads artwork from dedicated `public/assets/themes/<theme-id>/` directories. Card backs use `.webp` images with CSS `background-image` overlays. The `showCharacters` flag per theme controls whether face cards (J/Q/K) render custom character art or standard text glyphs.

* **Bouncing Victory Animation**: A fully custom physics overlay that triggers on win — all 52 cards cascade from the foundations with randomized velocity vectors, gravity (980px/s²), and floor/wall bouncing. Cards leave colorful trails as they bounce, recreating the iconic Windows 95 Solitaire celebration.

## 🧠 Advanced AI & Mechanics

* **100% Deterministic Seeded Games**: The engine uses a Mulberry32 PRNG seeded with pre-computed known-winnable seeds (1,000 for Draw-1, 1,000 for Draw-3). A `scripts/generateSeeds.ts` pipeline tests each seed against the solver at 5,000 iteration depth, eliminating the ~20% unwinnability rate of classic Klondike. The same seed always produces the exact same card deal.

* **Deep Search Auto-Play**: Toggle the ⚡ auto-play button to let an iterative DFS-based solver play the game for you. It calculates up to 30,000 moves ahead, exploring stock cycles, tableau-to-tableau transfers, and foundation promotions. Moves execute with a 300ms delay so you can watch the AI's strategy unfold in real time.

* **"Why Did I Lose?" Analyzer**: Hit a dead end? The Analyzer replays your complete move history side-by-side with the solver's optimal path, highlighting the exact divergence point where your decision led to an unsolvable state. You can step backward to any previous board state and resume play from there.

* **Dead-End Detection**: The background solver continuously analyzes the current board state in a non-blocking generator loop. If the position becomes mathematically unsolvable, a pulsating red "UNWINNABLE DEAL — REDRAW NOW?" banner appears instantly. If you've made moves, it says "DEAD END REACHED — UNDO?" instead, preserving your history.

* **Advanced Dependency Hints**: Clicking the 💡 Hint button doesn't just show one move — it highlights a chain of up to 3 sequential dependency moves (e.g., "move this card to tableau → then this card to tableau → then promote to foundation"), teaching you *why* a sequence works rather than just *what* to do next. Hint targets glow with a yellow ring and pulse animation.

## 🎮 Engagement & Accessibility

* **Custom Seed Engine**: Found a fun deal? Share the seed number! The Play menu has a dedicated "Play Custom Seed" panel with a numeric input, Draw-1/Draw-3 dropdown, and validation against the known-winnable seed pool. Invalid seeds show a red error animation.

* **Thoughtful Mode**: Toggle this in Settings to make all face-down cards semi-transparent but visible (grayed out at 40% opacity). This lets you plan ahead without guessing — perfect for learning strategy. Cards render without the 3D flip animation in this mode to avoid visual confusion.

* **High-Fidelity SFX Engine**: Zero-latency Web Audio API synthesizers generate all sounds programmatically — no audio files needed. Each sound uses two layers: a shaped white-noise burst for paper/cardboard texture (with low-shelf body + high-shelf rolloff), and a sine-wave pitch-drop thud for felt-surface weight. Includes: card move snap, deal swoosh, flip flutter, place click, error thud, and a warm C-major arpeggio victory chime (C5→E5→G5→C6).

* **Vegas Scoring**: Toggle between Standard scoring (incremental points for moves) and Vegas mode. Vegas starts at −$52 (you "bought" the deck) and adds $5 per foundation card — meaning you need 11+ cards in foundations just to break even. The score display updates in real-time.

* **Detailed Statistics & Lore Titles**: The Stats tab tracks per-difficulty high scores, fastest times, total wins, current/best streaks, and theme-specific win counts. Each theme unlocks thematic rank titles as you accumulate wins:
  * 🌌 Abyssal Void: Sequence 9 Seer → Sequence 8 Clown → Magician → Faceless → Marionettist → Bizarro Sorcerer
  * ⚔️ Maratha Glory: Mavala → Naik → Havaldar → Jumladar → Hazari → Sardar / Senapati
  * Others: Novice → Apprentice → Adept → Expert → Master → Grandmaster

* **Left-Handed & Large Print Modes**: Left-Handed mode mirrors the entire board layout — Stock/Waste move to the right, Foundations to the left — via CSS `order` properties on the grid. Large Print mode scales all card rank text and suit symbols to 150%+ size for accessibility.

* **Fast "Tap-to-Move"**: Single-click any face-up card to automatically move it to the best legal destination. The engine tries foundations first (highest priority), then compatible tableau columns. For tableau stacks, clicking a card in the middle of a face-up sequence moves the entire sub-stack. No dragging required.

## 🎭 Visual Polish & Retention

* **3D Card Flip Animation**: Pure CSS `rotateY` with `perspective(600px)` and `backface-visibility: hidden` creates a satisfying 180ms card-turn when face-down cards are revealed on the tableau. Both front and back faces are rendered inside a `preserve-3d` container — the back shows theme-specific artwork, the front reveals the card value. Each theme has fully opaque, theme-aware card backgrounds to prevent ghosting through the 3D layers.

* **Foundation Drop Particles**: A full-screen `<canvas>` overlay with a physics-based particle emitter fires themed sparks every time a card lands on a foundation pile. Particles have radial velocity, gravity (120px/s²), alpha-fade, and per-theme shape/color palettes:
  * 🌌 Abyssal Void: Silver star-shaped motes
  * 👑 Classic Luxury: Gold diamond chips
  * ✨ Ethereal Light: Pastel circle sparkles
  * ⚔️ Maratha Glory: Red/gold ember diamond fragments

* **Audio-Reactive Table Felt**: All 6 sound endpoints (card move, deal, flip, place, error, victory) route through a shared Web Audio `AnalyserNode`. A `requestAnimationFrame` loop reads time-domain amplitude data and maps it to a `--audio-glow` CSS custom property. A `::after` pseudo-element on the board uses this variable to render a subtle radial white glow that pulses in sync with every card sound — making the table felt feel alive.

* **The Advisor**: A floating toast-style narrator in the bottom-left corner that monitors game state and delivers atmosphere-appropriate commentary. 72 unique dialogue strings across 4 themes × 6 triggers:
  * First foundation card placed
  * Column cleared
  * Halfway point (26 cards in foundations)
  * Good streak (3+ consecutive foundation plays)
  * Near-dead detection
  * Idle timeout (30 seconds of no moves)

* **🔥 Daily Seed Challenge**: Every day, a deterministic `djb2`-style hash of the current ISO date string selects a specific seed from the Draw-3 winnable pool — meaning every player worldwide gets the exact same deal. A fire-emoji streak counter tracks consecutive days completed. The Play tab shows a gradient "Daily Challenge" card with completion state and a disabled button once you've beaten today's seed.

* **⚔️ Seed Difficulty & Roguelite Runs**: Seeds are automatically rated ★1–★5 based on their position in the pre-computed winnable pool (earlier = easier to solve = fewer stars). Four themed gauntlets challenge players to beat 5 escalating seeds in sequence:
  * 🌌 **The Sequence Protocol** (Abyssal Void, Draw 3) — Five layers of the Fog
  * 👑 **The Grand Tournament** (Classic Luxury, Draw 1) — Five rounds of high-stakes play
  * ✨ **The Ascent** (Ethereal Light, Draw 3) — Valley floor to summit
  * ⚔️ **Swarajya Campaign** (Maratha Glory, Draw 3) — Five forts, five battles

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
