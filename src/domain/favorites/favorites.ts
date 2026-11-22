export type Favorite = { readonly id: string; readonly addedAt: number }

export function isFavorite(favorites: readonly Favorite[], id: string): boolean {
  return favorites.some((favorite) => favorite.id === id)
}

/** Newest first. Toggling an existing favorite removes it. */
export function toggleFavorite(favorites: readonly Favorite[], id: string, now: number): Favorite[] {
  if (isFavorite(favorites, id)) return favorites.filter((favorite) => favorite.id !== id)
  return [{ id, addedAt: now }, ...favorites]
}
