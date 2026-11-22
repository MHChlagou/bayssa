import { useMemo } from 'react'
import type { Collection } from '../content/schema.ts'
import { localDayKey } from '../domain/daily/daily.ts'
import { countFor, progressKey, type DailyProgress } from '../domain/progress/progress.ts'
import { progressStore } from '../storage/stores.ts'
import { usePersistentState } from '../storage/usePersistentState.ts'

export function completedItemCount(collection: Collection, progress: DailyProgress, day: string): number {
  return collection.items.filter((item, index) => countFor(progress, day, progressKey(collection.id, index)) >= item.repeat).length
}

export function useTodayProgress(): { progress: DailyProgress; day: string; setProgress: typeof progressStore.set } {
  const [progress, setProgress] = usePersistentState(progressStore)
  const day = useMemo(() => localDayKey(new Date()), [])
  return { progress, day, setProgress }
}
