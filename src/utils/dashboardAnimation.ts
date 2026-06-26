import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimatedNumber(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frame = 0;
    const timeout = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(target * eased));
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setValue(target);
        }
      };
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value;
}

export function dashboardStaggerClass(index: number, rowOffset = 0): string {
  const slot = Math.min(index + rowOffset, 14);
  return `dashboard-rise dashboard-rise-${slot}`;
}

export function chartMotionProps(reduced: boolean) {
  if (reduced) {
    return { isAnimationActive: false as const };
  }
  return {
    isAnimationActive: true as const,
    animationDuration: 1400,
    animationEasing: 'ease-out' as const,
  };
}

/** Faster pie / compact charts on the dashboard */
export function fastChartMotionProps(reduced: boolean) {
  if (reduced) {
    return { isAnimationActive: false as const };
  }
  return {
    isAnimationActive: true as const,
    animationDuration: 360,
    animationEasing: 'ease-out' as const,
  };
}
