import { useEffect, useRef, useState } from 'react';

function computeRemaining(endsAt: number | null): number {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

/**
 * Zero-lag local countdown timer calculated directly from `roundEndsAt`:
 * Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000))
 */
export function useCountdown(
  roundEndsAt: number | null,
  isActive: boolean,
  onExpire?: () => void
): number {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    isActive ? computeRemaining(roundEndsAt) : 0
  );

  const expiredForRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isActive || !roundEndsAt) {
      return;
    }

    const tick = () => {
      const remaining = computeRemaining(roundEndsAt);
      setSecondsLeft(remaining);
      if (remaining === 0 && expiredForRef.current !== roundEndsAt) {
        expiredForRef.current = roundEndsAt;
        onExpireRef.current?.();
      }
    };

    const immediate = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 100);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [roundEndsAt, isActive]);

  return isActive && roundEndsAt ? secondsLeft : 0;
}
