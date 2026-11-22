import { useCallback } from 'react'
import { isFavorite, toggleFavorite, type Favorite } from '../domain/favorites/favorites.ts'
import { favoritesStore, prefsStore } from '../storage/stores.ts'
import { usePersistentState } from '../storage/usePersistentState.ts'

export function useFavorites(): {
  favorites: readonly Favorite[]
  has: (id: string) => boolean
  toggle: (id: string) => void
} {
  const [favorites, setFavorites] = usePersistentState(favoritesStore)
  const has = useCallback((id: string) => isFavorite(favorites, id), [favorites])
  const toggle = useCallback(
    (id: string) => setFavorites((current) => toggleFavorite(current, id, Date.now())),
    [setFavorites],
  )
  return { favorites, has, toggle }
}

export const HAPTIC_TAP_MS = 12
export const HAPTIC_COMPLETE_PATTERN_MS: readonly number[] = [24, 60, 24, 60, 48]

/** Vibrates where the device supports it and the user has not turned it off. */
export function haptic(pattern: number | readonly number[]): void {
  if (!prefsStore.get().isHapticsEnabled) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern])
}
