import { Crosshair, Flame, Palette, Zap } from 'lucide-react';
import type { MiniGameDefinition } from '../types/game';

interface GameIconProps {
  icon: MiniGameDefinition['icon'];
  className?: string;
}

export function GameIcon({ icon, className = 'h-5 w-5' }: GameIconProps) {
  switch (icon) {
    case 'flame':
      return <Flame className={className} />;
    case 'palette':
      return <Palette className={className} />;
    case 'crosshair':
      return <Crosshair className={className} />;
    case 'zap':
      return <Zap className={className} />;
  }
}
