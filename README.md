<div align="center">
  <h1>Klondike Solitaire: Premium Edition</h1>
  <p>A highly customizable, visually stunning React & TypeScript implementation of classic Solitaire.</p>
</div>

## Features

* **Premium Theme Engine**: Choose between gorgeous, highly-detailed aesthetic themes:
  * 🌌 **Abyssal Void** (Lord of the Mysteries inspired, animated fog and starry cards)
  * 👑 **Classic Luxury** (Elegant, clean, casino-style premium deck)
  * ✨ **Ethereal Light** (Soft, vibrant, and approachable)
  * ⚔️ **Maratha Glory** (Anime-styled 17th-century Maratha Empire historical figures)
* **Custom Asset 1:1 Linking**: Theme-specific artwork is meticulously loaded from dedicated `public/assets/themes` directories.
* **Thoughtful Mode**: Toggle this setting to make face-down cards translucent but visible, allowing you to plan ahead without guessing.
* **Guaranteed Winnable Deals**: If enabled, the engine continuously re-rolls hands in the background and runs them through the Deep Search Solver until it mathematically proves the game is solvable before presenting it to the user.
* **Deep Search Auto-Play**: Watch the AI play the game for you! An iterative, DFS-based solver calculates up to 30,000 moves ahead to find the optimal path to victory without dropping the browser's framerate.
* **Dead-End Detection**: The background solver analyzes the board in real-time. If you make a mistake and the board becomes mathematically unsolvable, a "DEAD END REACHED" warning will instantly appear.
* **Advanced Dependency Hints**: Clicking the Hint button now highlights a sequence of up to 3 consecutive moves, teaching you *why* a move is good rather than just *what* move is valid.
* **Bouncing Victory Animation**: A fully custom physics overlay that triggers on win, cascading all 52 cards across the screen in classic Windows 95 style!
* **Offline Play**: Completely offline client-side game logic running in the browser. 

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:3000` (or the port Vite provides) to play!
