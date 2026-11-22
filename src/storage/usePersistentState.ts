import { useSyncExternalStore } from 'react'
import type { Store } from './localStore.ts'

export function usePersistentState<T>(store: Store<T>): [T, Store<T>['set']] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.get)
  return [value, store.set]
}
