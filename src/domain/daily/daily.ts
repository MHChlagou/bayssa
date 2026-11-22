// Picks "today's" item from a list. The same calendar day always gives the
// same item, and consecutive days walk through the whole list before repeating.

const MS_PER_DAY = 86_400_000

/** Local calendar day as YYYY-MM-DD. */
export function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY)
}

export function pickForDay<T>(items: readonly T[], date: Date, salt = 0): T | undefined {
  if (items.length === 0) return undefined
  return items[(localDayNumber(date) + salt) % items.length]
}

export type DayPeriod = 'morning' | 'midday' | 'evening' | 'night'

const MORNING_STARTS_AT_HOUR = 4
const MIDDAY_STARTS_AT_HOUR = 11
const EVENING_STARTS_AT_HOUR = 15
const NIGHT_STARTS_AT_HOUR = 20

export function dayPeriod(date: Date): DayPeriod {
  const hour = date.getHours()
  if (hour >= NIGHT_STARTS_AT_HOUR || hour < MORNING_STARTS_AT_HOUR) return 'night'
  if (hour >= EVENING_STARTS_AT_HOUR) return 'evening'
  if (hour >= MIDDAY_STARTS_AT_HOUR) return 'midday'
  return 'morning'
}
