import type { Favorite } from '../domain/favorites/favorites.ts'
import { clampHijriOffset } from '../domain/hijri/hijri.ts'
import type { DailyProgress } from '../domain/progress/progress.ts'
import { clampTarget, type Counter, type TasbihState } from '../domain/tasbih/tasbih.ts'
import { createStore, isRecord } from './localStore.ts'

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const TEXT_SCALES = [0.9, 1, 1.15, 1.3] as const
export const DEFAULT_TEXT_SCALE_INDEX = 1

export const NUMERALS = ['arab', 'latn'] as const
export type Numerals = (typeof NUMERALS)[number]

/** Eastern Arabic digits where the device already uses them, Western digits elsewhere (the Maghreb, for one). */
function detectNumerals(): Numerals {
  if (typeof navigator === 'undefined') return 'latn'
  return new Intl.NumberFormat(navigator.language).resolvedOptions().numberingSystem === 'arab' ? 'arab' : 'latn'
}

export type Prefs = {
  readonly theme: Theme
  readonly numerals: Numerals
  readonly textScaleIndex: number
  readonly hijriOffsetDays: number
  readonly isHapticsEnabled: boolean
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  numerals: detectNumerals(),
  textScaleIndex: DEFAULT_TEXT_SCALE_INDEX,
  hijriOffsetDays: 0,
  isHapticsEnabled: true,
}

function expectRecord(raw: unknown, what: string): Record<string, unknown> {
  if (!isRecord(raw)) throw new Error(`${what} must be an object`)
  return raw
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function parsePrefs(raw: unknown): Prefs {
  const data = expectRecord(raw, 'prefs')
  const scale = data.textScaleIndex
  return {
    theme: isTheme(data.theme) ? data.theme : DEFAULT_PREFS.theme,
    numerals: data.numerals === 'arab' || data.numerals === 'latn' ? data.numerals : DEFAULT_PREFS.numerals,
    textScaleIndex: isCount(scale) && scale < TEXT_SCALES.length ? scale : DEFAULT_TEXT_SCALE_INDEX,
    hijriOffsetDays: typeof data.hijriOffsetDays === 'number' ? clampHijriOffset(data.hijriOffsetDays) : 0,
    isHapticsEnabled: typeof data.isHapticsEnabled === 'boolean' ? data.isHapticsEnabled : true,
  }
}

export function parseFavorites(raw: unknown): Favorite[] {
  if (!Array.isArray(raw)) throw new Error('favorites must be an array')
  const seen = new Set<string>()
  const favorites: Favorite[] = []
  for (const item of raw as unknown[]) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.addedAt !== 'number') continue
    if (seen.has(item.id)) continue
    seen.add(item.id)
    favorites.push({ id: item.id, addedAt: item.addedAt })
  }
  return favorites
}

export const DEFAULT_TASBIH: TasbihState = { activeId: '', counters: {}, lifetimeTotal: 0 }

export function parseTasbih(raw: unknown): TasbihState {
  const data = expectRecord(raw, 'tasbih')
  const counters: Record<string, Counter> = {}
  for (const [id, value] of Object.entries(expectRecord(data.counters, 'tasbih.counters'))) {
    if (!isRecord(value) || !isCount(value.count) || typeof value.target !== 'number') continue
    counters[id] = {
      count: value.count,
      target: clampTarget(value.target),
      completedRounds: isCount(value.completedRounds) ? value.completedRounds : 0,
    }
  }
  return {
    activeId: typeof data.activeId === 'string' ? data.activeId : '',
    counters,
    lifetimeTotal: isCount(data.lifetimeTotal) ? data.lifetimeTotal : 0,
  }
}

export const DEFAULT_PROGRESS: DailyProgress = { day: '', counts: {} }

export function parseProgress(raw: unknown): DailyProgress {
  const data = expectRecord(raw, 'progress')
  if (typeof data.day !== 'string') throw new Error('progress.day must be a string')
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(expectRecord(data.counts, 'progress.counts'))) {
    if (isCount(value)) counts[key] = value
  }
  return { day: data.day, counts }
}

export const MAX_RECENTS = 8

export function parseRecents(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new Error('recents must be an array')
  return (raw as unknown[]).filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENTS)
}

export function addRecent(recents: readonly string[], collectionId: string): string[] {
  return [collectionId, ...recents.filter((id) => id !== collectionId)].slice(0, MAX_RECENTS)
}

export const prefsStore = createStore({ name: 'prefs', defaults: DEFAULT_PREFS, parse: parsePrefs })
export const favoritesStore = createStore<Favorite[]>({ name: 'favorites', defaults: [], parse: parseFavorites })
export const tasbihStore = createStore({ name: 'tasbih', defaults: DEFAULT_TASBIH, parse: parseTasbih })
export const progressStore = createStore({ name: 'progress', defaults: DEFAULT_PROGRESS, parse: parseProgress })
export const recentsStore = createStore<string[]>({ name: 'recents', defaults: [], parse: parseRecents })
