'use client';
import { useEffect, useState } from 'react';

/** Shared resend countdown; preserves the existing one-second timer behavior. */
export function useCooldown() {
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  return [cooldown, setCooldown] as const;
}
