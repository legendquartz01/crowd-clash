# CROWD CLASH — Live Audience Party Game

A real-time multiplayer party game web application modeled after Kahoot / DevFest live audience battles. One **Host** controls the game flow on a large screen (`/host`), while **Players** join on their phones (`/`) via QR code or a 4-letter room code.

## Features
- **Zero-Database Supabase Realtime Architecture:** Uses Supabase **Broadcast** and **Presence** channels (`room:{roomCode}`) only — no Postgres tables required.
- **Built-In Local Multi-Tab Demo Mode:** Automatically falls back to browser `BroadcastChannel` when `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are not configured so you can test Host (`/host`) and multiple Players (`/`) side-by-side in tabs immediately.
- **Full 6-Stage Synchronized State Machine:** `LOBBY` → `TEAM_SELECT` → `GAME_INTRO` → `GAME_ACTIVE` → `ROUND_END` → `FINAL_WINNER` (with `canvas-confetti` celebration & Top 3 MVP podium).
- **Resilient Sync & Reconnection:**
  - Host mirrors authoritative room state in `sessionStorage` to survive accidental refreshes.
  - Players persist `{ roomCode, playerId, name, team }` in `localStorage` and automatically rejoin & restore their score on refresh.
  - Rapid-tap mini-games (`tug-of-war`) buffer points locally and flush `SCORE_DELTA` every 350ms.
  - Zero-lag local countdown timer calculated directly from `roundEndsAt`.
- **Modular Mini-Game Registry (`src/games/registry.ts`):**
  1. **Crowd Tug-of-War** (`tug-of-war`) — Rapid-tap team pull with animated SVG rope on the Host stage.
  2. **Stroop Flash** (`stroop-flash`) — Color vs. word reflex clash.
  3. **Target Blitz** (`target-blitz`) — 3×3 reflex grid with targets, gold stars, and bombs.
  4. **Speed Surge** (`quick-math`) — Rapid mental arithmetic sprint.

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
