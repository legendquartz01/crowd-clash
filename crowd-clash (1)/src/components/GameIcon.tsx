import {
  BadgeCheck,
  Crosshair,
  Eye,
  Flame,
  Hand,
  Palette,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { GameIconId } from '../types/game';

interface GameIconProps {
  icon: GameIconId;
  className?: string;
}

export function GameIcon({ icon, className = 'h-5 w-5' }: GameIconProps) {
  switch (icon) {
    case 'flame':
      return <Flame className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'palette':
      return <Palette className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'hand':
      return <Hand className={className} />;
    case 'check':
      return <BadgeCheck className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'crosshair':
      return <Crosshair className={className} />;
  }
}
