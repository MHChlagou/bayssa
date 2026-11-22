import { createContext, useContext, useState } from 'react'

let hasBooted = false

/** Called once the app has painted for the first time. */
export function markBooted(): void {
  hasBooted = true
}

/**
 * True for components mounted after the first paint. The first screen is
 * already visible as a prerendered shell, so replaying its entrance
 * animation would make the page blink. Fixed for the life of the component.
 */
export function useEntranceAnimation(): boolean {
  const [shouldAnimate] = useState(() => hasBooted)
  return shouldAnimate
}

/** True while rendering the build-time shell, where nothing day- or user-specific may appear. */
export const StaticShellContext = createContext(false)

export function useIsStaticShell(): boolean {
  return useContext(StaticShellContext)
}
