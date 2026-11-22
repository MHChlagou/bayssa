// Per-day repetition progress inside the adhkar readers.
// Counts belong to one calendar day and start fresh on the next.

export type DailyProgress = {
  readonly day: string
  readonly counts: Readonly<Record<string, number>>
}

export function progressKey(collectionId: string, itemIndex: number): string {
  return `${collectionId}#${itemIndex}`
}

export function progressForDay(progress: DailyProgress, day: string): DailyProgress {
  return progress.day === day ? progress : { day, counts: {} }
}

export function countFor(progress: DailyProgress, day: string, key: string): number {
  return progressForDay(progress, day).counts[key] ?? 0
}

/** Adds one repetition, never going past `repeat`. */
export function recordRepetition(progress: DailyProgress, day: string, key: string, repeat: number): DailyProgress {
  const today = progressForDay(progress, day)
  const next = Math.min(repeat, (today.counts[key] ?? 0) + 1)
  return { day, counts: { ...today.counts, [key]: next } }
}

export function clearCollection(progress: DailyProgress, day: string, collectionId: string): DailyProgress {
  const today = progressForDay(progress, day)
  const prefix = `${collectionId}#`
  return {
    day,
    counts: Object.fromEntries(Object.entries(today.counts).filter(([key]) => !key.startsWith(prefix))),
  }
}
