'use client';

import { MotionConfig } from 'motion/react';

/**
 * Global Motion config. `reducedMotion="user"` respects the visitor's
 * prefers-reduced-motion setting: transform/layout animations are replaced
 * with instant transitions while opacity fades still play. Every motion/react
 * component in the app renders inside this provider.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
