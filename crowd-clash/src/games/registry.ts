import type { MiniGameDefinition, MiniGameProps } from '../types/game';
import { QuickMathGame } from './QuickMathGame';
import { StroopFlashGame } from './StroopFlashGame';
import { TargetBlitzGame } from './TargetBlitzGame';
import { TugOfWarGame } from './TugOfWarGame';

export type { MiniGameProps, MiniGameDefinition };

/**
 * Modular Mini-Game Plugin Registry.
 * To add a new mini-game, create one component implementing `MiniGameProps`
 * and register a single entry below.
 */
export const GAME_REGISTRY: MiniGameDefinition[] = [
  {
    id: 'tug-of-war',
    title: 'Crowd Tug-of-War',
    tagline: 'Pure rapid-fire team power',
    rules: 'Tap PULL as fast as humanly possible to yank the rope onto your team’s side!',
    durationSec: 20,
    icon: 'flame',
    accent: '#E63946',
    throttleMs: 350,
    component: TugOfWarGame,
  },
  {
    id: 'stroop-flash',
    title: 'Stroop Flash',
    tagline: 'Color vs. word brain clash',
    rules: 'Tap the button matching the INK COLOR of the word — ignore what the word says!',
    durationSec: 25,
    icon: 'palette',
    accent: '#2563EB',
    throttleMs: 200,
    component: StroopFlashGame,
  },
  {
    id: 'target-blitz',
    title: 'Target Blitz',
    tagline: 'Split-second reflex arena',
    rules: 'Hit green targets (+5) and gold stars (+15) before they vanish, but avoid bombs (-10)!',
    durationSec: 25,
    icon: 'crosshair',
    accent: '#10B981',
    throttleMs: 200,
    component: TargetBlitzGame,
  },
  {
    id: 'quick-math',
    title: 'Speed Surge',
    tagline: 'Lightning mental arithmetic',
    rules: 'Solve equations under 2 seconds for a +5 speed bonus — wrong taps cost 5 points!',
    durationSec: 25,
    icon: 'zap',
    accent: '#F59E0B',
    throttleMs: 200,
    component: QuickMathGame,
  },
];

export const GAMES_BY_ID: Record<string, MiniGameDefinition> = Object.fromEntries(
  GAME_REGISTRY.map((g) => [g.id, g])
);

export const DEFAULT_PLAYLIST: string[] = GAME_REGISTRY.map((g) => g.id);

export function getGameById(id: string | null | undefined): MiniGameDefinition | null {
  if (!id) return null;
  return GAMES_BY_ID[id] ?? null;
}
