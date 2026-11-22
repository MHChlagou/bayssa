import type { ComponentType } from 'react'
import { createHashRouter } from 'react-router'
import { HomePage } from '../features/home/HomePage.tsx'
import { AppShell, InitialLoad } from './layout/AppShell.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'

type LazyRoute = () => Promise<{ Component: ComponentType }>

/** Loads a page together with the animation provider its components expect. */
function page(load: () => Promise<ComponentType>): LazyRoute {
  return async () => {
    const [Page, { MotionRoot }] = await Promise.all([load(), import('../ui/MotionRoot.tsx')])
    return { Component: () => <MotionRoot><Page /></MotionRoot> }
  }
}

// Hash routing: GitHub Pages has no server-side fallback, and hash URLs also
// keep working when the app is opened offline from any deep link.
export const router = createHashRouter([
  {
    element: <AppShell />,
    hydrateFallbackElement: <InitialLoad />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'adhkar', lazy: page(async () => (await import('../features/library/LibraryPage.tsx')).AdhkarPage) },
      { path: 'duas', lazy: page(async () => (await import('../features/library/LibraryPage.tsx')).DuasPage) },
      { path: 'adhkar/:collectionId', lazy: page(async () => (await import('../features/reader/CollectionPage.tsx')).CollectionPage) },
      { path: 'duas/:collectionId', lazy: page(async () => (await import('../features/reader/CollectionPage.tsx')).CollectionPage) },
      { path: 'tasbih', lazy: page(async () => (await import('../features/tasbih/TasbihPage.tsx')).TasbihPage) },
      { path: 'favorites', lazy: page(async () => (await import('../features/favorites/FavoritesPage.tsx')).FavoritesPage) },
      { path: 'search', lazy: page(async () => (await import('../features/search/SearchPage.tsx')).SearchPage) },
      { path: 'settings', lazy: page(async () => (await import('../features/settings/SettingsPage.tsx')).SettingsPage) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
