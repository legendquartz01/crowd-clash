# CROWD CLASH — Live Audience Party Game

A real-time multiplayer party game web application modeled after Kahoot / DevFest live audience battles. One **Host** controls the game flow on a large screen (`/host`), while **Players** join on their phones (`/`) via QR code or a 4-letter room code.

## Features
- **Zero-Database Supabase Realtime Architecture:** Uses Supabase **Broadcast** and **Presence** channels (`room:{roomCode}`) only — no Postgres tables required.
- **Built-In Local Multi-Tab Demo Mode:** Automatically falls back to browser `BroadcastChannel` when `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are not configured so you can test Host (`/host`) and multiple Players (`/`) side-by-side in tabs immediately.
- **Full Synchronized State Machine:** `LOBBY` → `TEAM_SELECT` → `GAME_INTRO` → `COUNTDOWN` (`3-2-1-GO!`) → `GAME_ACTIVE` → `ROUND_END` → `FINAL_WINNER` (with `canvas-confetti` celebration & Top 3 MVP podium).
- **Resilient Sync & Reconnection:**
  - Host mirrors authoritative room state in `sessionStorage` to survive accidental refreshes.
  - Players persist `{ roomCode, playerId, name, team }` in `localStorage` and automatically rejoin & restore their score on refresh.
  - Rapid-tap mini-games (`tug-of-war`, `red-light-tap`) buffer points locally and flush `SCORE_DELTA` on a throttle interval.
  - Zero-lag local countdown timer calculated directly from `countdownEndsAt` and `roundEndsAt`.
- **Modular Mini-Game Registry (`src/games/registry.ts`):**
  1. **Crowd Tug-of-War** (`tug-of-war`) — Rapid-tap team pull with animated SVG rope on the Host stage.
  2. **Odd One Out** (`odd-one-out`) — Lookalike emoji & color shade spotter scaling from 3×3 → 4×4 → 5×5.
  3. **Color Clash** (`color-clash`) — Stroop ink-vs-word reflex battle with speed and streak bonuses.
  4. **Quick Math Blitz** (`quick-math-blitz`) — Rapid-fire mental math with speed and streak multipliers.
  5. **Red Light, Tap!** (`red-light-tap`) — Mash on GREEN, freeze on RED or lose 10 points.
  6. **True or False Sprint** (`true-or-false`) — 48 shuffled trivia statements with giant TRUE/FALSE buttons.
  7. **Emoji Flash** (`emoji-flash`) — 2-second memory sequence recall on a 6-emoji grid.
  8. **Target Blitz** (`target-blitz`) — 3×3 reflex grid with targets, gold stars, and bombs.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional for live multi-device crowd play) Configure Supabase Realtime:
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

3. Run the development server:
   ```bash
   npm run dev
   ```
   - Open `/host` on the big screen / laptop.
   - Scan the QR code or open `/?room=XXXX` on player phones (or click **Test Player Tab** in the Host lobby).

## Adding a New Mini-Game
1. Create a React component in `src/games/` implementing `MiniGameProps`:
   ```ts
   export interface MiniGameProps {
     onScore: (points: number) => void;
     team: 'red' | 'white';
     timeLeft: number;
     isActive: boolean;
   }
   ```
2. Register one entry in `GAME_REGISTRY` inside `src/games/registry.ts`.
