import type { MiniGameDefinition, MiniGameProps } from '../types/game';
import { ColorClashGame } from './ColorClashGame';
import { EmojiFlashGame } from './EmojiFlashGame';
import { OddOneOutGame } from './OddOneOutGame';
import { QuickMathBlitzGame } from './QuickMathBlitzGame';
import { RedLightTapGame } from './RedLightTapGame';
import { TargetBlitzGame } from './TargetBlitzGame';
import { TrueOrFalseGame } from './TrueOrFalseGame';
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
    id: 'odd-one-out',
    title: 'Odd One Out',
    tagline: 'Lookalike emojis & color shades',
    rules: 'Tap the one tile that does not match — build streaks as the grid scales up to 5×5!',
    durationSec: 25,
    icon: 'eye',
    accent: '#10B981',
    throttleMs: 180,
    component: OddOneOutGame,
  },
  {
    id: 'color-clash',
    title: 'Color Clash',
    tagline: 'Stroop ink-vs-word reflex test',
    rules: 'Tap the button matching the INK COLOR of the word — ignore what the word says!',
    durationSec: 25,
    icon: 'palette',
    accent: '#2563EB',
    throttleMs: 180,
    component: ColorClashGame,
  },
  {
    id: 'quick-math-blitz',
    title: 'Quick Math Blitz',
    tagline: 'Lightning mental arithmetic',
    rules: 'Solve addition, subtraction, and multiplication fast for speed and streak bonuses!',
    durationSec: 25,
    icon: 'zap',
    accent: '#F59E0B',
    throttleMs: 180,
    component: QuickMathBlitzGame,
  },
  {
    id: 'red-light-tap',
    title: 'Red Light, Tap!',
    tagline: 'Mash on green, freeze on red',
    rules: 'Tap the giant button as fast as you can on GREEN — FREEZE on RED or lose 10 points!',
    durationSec: 25,
    icon: 'hand',
    accent: '#10B981',
    throttleMs: 250,
    component: RedLightTapGame,
  },
  {
    id: 'true-or-false',
    title: 'True or False Sprint',
    tagline: 'Rapid-fire crowd trivia',
    rules: 'Read each statement fast and smash TRUE or FALSE — streaks multiply your score!',
    durationSec: 30,
    icon: 'check',
    accent: '#10B981',
    throttleMs: 180,
    component: TrueOrFalseGame,
  },
  {
    id: 'emoji-flash',
    title: 'Emoji Flash',
    tagline: '2-second memory sequence',
    rules: 'Memorize the flashed emoji order for 2 seconds, then tap them back in exact order!',
    durationSec: 30,
    icon: 'sparkles',
    accent: '#38BDF8',
    throttleMs: 180,
    component: EmojiFlashGame,
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
];

export const GAMES_BY_ID: Record<string, MiniGameDefinition> = Object.fromEntries(
  GAME_REGISTRY.map((g) => [g.id, g])
);

export const DEFAULT_PLAYLIST: string[] = GAME_REGISTRY.map((g) => g.id);

export function getGameById(id: string | null | undefined): MiniGameDefinition | null {
  if (!id) return null;
  return GAMES_BY_ID[id] ?? null;
}
