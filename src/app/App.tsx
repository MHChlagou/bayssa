import { useEffect, useSyncExternalStore, type ReactElement } from 'react'
import { RouterProvider } from 'react-router'
import { prefsStore, TEXT_SCALES, type Theme } from '../storage/stores.ts'
import { usePersistentState } from '../storage/usePersistentState.ts'
import { markBooted, StaticShellContext } from './boot.ts'
import { router } from './router.tsx'

const THEME_COLORS = { light: '#0B3D2E', dark: '#071A14' } as const

function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light'
  return theme
}

function useAppearance(): void {
  const [prefs] = usePersistentState(prefsStore)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (): void => {
      const resolved = resolveTheme(prefs.theme, media.matches)
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [prefs.theme])

  useEffect(() => {
    const scale = TEXT_SCALES[prefs.textScaleIndex] ?? 1
    document.documentElement.style.setProperty('--md-scripture-scale', String(scale))
  }, [prefs.textScaleIndex])
}

const subscribeToNothing = (): (() => void) => () => undefined

export function App(): ReactElement {
  useAppearance()
  // While React hydrates the prerendered shell it reads the third argument, so
  // the first render repeats the shell exactly and keeps its elements. The
  // render that follows fills in the day- and user-specific content.
  const isStaticShell = useSyncExternalStore(subscribeToNothing, () => false, () => true)
  useEffect(() => {
    markBooted()
  }, [])
  return (
    <StaticShellContext value={isStaticShell}>
      <RouterProvider router={router} />
    </StaticShellContext>
  )
}
