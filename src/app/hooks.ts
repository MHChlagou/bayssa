import { useCallback } from 'react'
import { isFavorite, toggleFavorite, type Favorite } from '../domain/favorites/favorites.ts'
import { favoritesStore } from '../storage/stores.ts'
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

