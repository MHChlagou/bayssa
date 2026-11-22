import { MotionConfig } from 'motion/react'
import type { ReactElement, ReactNode } from 'react'

/**
 * Wraps the lazily loaded pages. Keeping the animation library out of the
 * first-load bundle is what this indirection buys.
 */
export function MotionRoot({ children }: { children: ReactNode }): ReactElement {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
