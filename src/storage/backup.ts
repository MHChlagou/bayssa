// Export and import of what a person has saved: favorites, tasbih counters,
// today's reading progress and preferences. Pure functions: no storage access
// and no network. The file format is documented in docs/product/backup-format.md.
//
// Two rules shape the merge:
// - importing never deletes or lowers anything already on the device;
// - importing the same file twice gives the same result as importing it once.
import type { Favorite } from '../domain/favorites/favorites.ts'
import type { DailyProgress } from '../domain/progress/progress.ts'
import { MAX_TARGET, MIN_TARGET, type Counter, type TasbihState } from '../domain/tasbih/tasbih.ts'
import { MAX_HIJRI_OFFSET_DAYS } from '../domain/hijri/hijri.ts'
import { NUMERALS, TEXT_SCALES, THEMES, type Prefs } from './stores.ts'

export const BACKUP_FORMAT = 'bayssa-backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 1_000_000
const MAX_FAVORITES = 5000
const MAX_COUNTERS = 500
const MAX_ID_LENGTH = 120
const MAX_COUNT = 1_000_000_000

export type BackupData = {
  readonly favorites: readonly Favorite[]
  readonly tasbih: TasbihState
  readonly progress: DailyProgress
  readonly prefs: Prefs
}

export type Backup = {
  readonly format: typeof BACKUP_FORMAT
  readonly version: typeof BACKUP_VERSION
  /** ISO 8601 moment the file was made. */
  readonly exportedAt: string
  readonly appVersion: string
  readonly data: BackupData
}

export type BackupError = 'too-large' | 'not-json' | 'not-a-backup' | 'unsupported-version' | 'malformed'

export type ParseResult = { readonly ok: true; readonly backup: Backup } | { readonly ok: false; readonly error: BackupError; readonly detail: string }

export function createBackup(data: BackupData, now: Date, appVersion: string): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), appVersion, data }
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2)
}

export function backupFileName(now: Date): string {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `bayssa-backup-${day}.json`
}

// ---------------------------------------------------------------- Validation

class Malformed extends Error {
  constructor(detail: string) {
    super(detail)
    this.name = 'Malformed'
  }
}

function record(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Malformed(`${what} must be an object`)
  return value as Record<string, unknown>
}

function count(value: unknown, what: string, max = MAX_COUNT): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) throw new Malformed(`${what} must be a whole number from 0 to ${max}`)
  return value
}

function identifier(value: unknown, what: string): string {
  if (typeof value !== 'string' || value === '' || value.length > MAX_ID_LENGTH) throw new Malformed(`${what} must be a short, non-empty text`)
  return value
}

function readFavorites(value: unknown): Favorite[] {
  if (!Array.isArray(value)) throw new Malformed('favorites must be a list')
  if (value.length > MAX_FAVORITES) throw new Malformed('favorites has too many items')
  const seen = new Set<string>()
  const favorites: Favorite[] = []
  for (const [index, raw] of (value as unknown[]).entries()) {
    const item = record(raw, `favorites[${index}]`)
    const id = identifier(item.id, `favorites[${index}].id`)
    if (typeof item.addedAt !== 'number' || !Number.isFinite(item.addedAt) || item.addedAt < 0) throw new Malformed(`favorites[${index}].addedAt must be a time`)
    // A file may list the same entry twice. Keeping the first is harmless.
    if (seen.has(id)) continue
    seen.add(id)
    favorites.push({ id, addedAt: item.addedAt })
  }
  return favorites
}

function readTasbih(value: unknown): TasbihState {
  const tasbih = record(value, 'tasbih')
  if (typeof tasbih.activeId !== 'string' || tasbih.activeId.length > MAX_ID_LENGTH) throw new Malformed('tasbih.activeId must be a text')
  const rawCounters = record(tasbih.counters, 'tasbih.counters')
  const ids = Object.keys(rawCounters)
  if (ids.length > MAX_COUNTERS) throw new Malformed('tasbih.counters has too many items')
  const counters: Record<string, Counter> = {}
  for (const id of ids) {
    identifier(id, 'a tasbih counter id')
    const counter = record(rawCounters[id], `tasbih.counters.${id}`)
    const target = count(counter.target, `tasbih.counters.${id}.target`, MAX_TARGET)
    if (target < MIN_TARGET) throw new Malformed(`tasbih.counters.${id}.target must be at least ${MIN_TARGET}`)
    counters[id] = {
      count: count(counter.count, `tasbih.counters.${id}.count`),
      target,
      completedRounds: count(counter.completedRounds, `tasbih.counters.${id}.completedRounds`),
    }
  }
  return { activeId: tasbih.activeId, counters, lifetimeTotal: count(tasbih.lifetimeTotal, 'tasbih.lifetimeTotal') }
}

function readProgress(value: unknown): DailyProgress {
  const progress = record(value, 'progress')
  if (typeof progress.day !== 'string' || !/^(\d{4}-\d{2}-\d{2})?$/.test(progress.day)) throw new Malformed('progress.day must be a date or empty')
  const rawCounts = record(progress.counts, 'progress.counts')
  const counts: Record<string, number> = {}
  for (const [key, value_] of Object.entries(rawCounts)) {
    identifier(key, 'a progress key')
    counts[key] = count(value_, `progress.counts.${key}`)
  }
  return { day: progress.day, counts }
}

function readPrefs(value: unknown): Prefs {
  const prefs = record(value, 'prefs')
  const theme = THEMES.find((candidate) => candidate === prefs.theme)
  const numerals = NUMERALS.find((candidate) => candidate === prefs.numerals)
  if (theme === undefined) throw new Malformed('prefs.theme is not a known theme')
  if (numerals === undefined) throw new Malformed('prefs.numerals is not a known digit style')
  if (typeof prefs.isHapticsEnabled !== 'boolean') throw new Malformed('prefs.isHapticsEnabled must be true or false')
  const offset = prefs.hijriOffsetDays
  if (typeof offset !== 'number' || !Number.isInteger(offset) || Math.abs(offset) > MAX_HIJRI_OFFSET_DAYS) throw new Malformed('prefs.hijriOffsetDays is out of range')
  return {
    theme,
    numerals,
    textScaleIndex: count(prefs.textScaleIndex, 'prefs.textScaleIndex', TEXT_SCALES.length - 1),
    hijriOffsetDays: offset,
    isHapticsEnabled: prefs.isHapticsEnabled,
  }
}

/** Reads the text of a backup file. Rejects anything that is not exactly a supported backup. */
export function parseBackupText(text: string): ParseResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'too-large', detail: `${text.length} characters` }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    return { ok: false, error: 'not-json', detail: error instanceof Error ? error.message : 'not JSON' }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'not-a-backup', detail: 'not an object' }
  const file = raw as Record<string, unknown>
  if (file.format !== BACKUP_FORMAT) return { ok: false, error: 'not-a-backup', detail: 'the format marker is missing or different' }
  if (file.version !== BACKUP_VERSION) return { ok: false, error: 'unsupported-version', detail: `version ${String(file.version)}` }
  try {
    if (typeof file.exportedAt !== 'string' || Number.isNaN(Date.parse(file.exportedAt))) throw new Malformed('exportedAt must be a date and time')
    if (typeof file.appVersion !== 'string' || file.appVersion.length > MAX_ID_LENGTH) throw new Malformed('appVersion must be a short text')
    const data = record(file.data, 'data')
    return {
      ok: true,
      backup: {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: file.exportedAt,
        appVersion: file.appVersion,
        data: {
          favorites: readFavorites(data.favorites),
          tasbih: readTasbih(data.tasbih),
          progress: readProgress(data.progress),
          prefs: readPrefs(data.prefs),
        },
      },
    }
  } catch (error) {
    if (error instanceof Malformed) return { ok: false, error: 'malformed', detail: error.message }
    throw error
  }
}

// ---------------------------------------------------------------- Preview and merge

export type ImportPreview = {
  readonly exportedAt: string
  readonly favorites: { readonly inFile: number; readonly toAdd: number; readonly alreadySaved: number; readonly notInThisVersion: number }
  readonly tasbih: {
    readonly inFile: number
    readonly toAdd: number
    readonly toRaise: number
    readonly unchanged: number
    readonly lifetimeBefore: number
    readonly lifetimeAfter: number
  }
  readonly appliesTodaysProgress: boolean
  readonly prefsDiffer: boolean
  /** True when importing would leave the device exactly as it is. */
  readonly changesNothing: boolean
}

export type ImportOptions = { readonly includePrefs: boolean; readonly today: string }

function mergeCounter(local: Counter | undefined, incoming: Counter): Counter {
  if (!local) return incoming
  // The larger value wins, so nothing counted on this device is lost and a repeated import changes nothing.
  return {
    count: Math.max(local.count, incoming.count),
    target: local.target,
    completedRounds: Math.max(local.completedRounds, incoming.completedRounds),
  }
}

const sameCounter = (a: Counter | undefined, b: Counter): boolean =>
  a !== undefined && a.count === b.count && a.target === b.target && a.completedRounds === b.completedRounds

const samePrefs = (a: Prefs, b: Prefs): boolean =>
  a.theme === b.theme && a.numerals === b.numerals && a.textScaleIndex === b.textScaleIndex
  && a.hijriOffsetDays === b.hijriOffsetDays && a.isHapticsEnabled === b.isHapticsEnabled

/** Combines what is on the device with a backup. Never removes or lowers what is on the device. */
export function mergeBackup(current: BackupData, incoming: BackupData, options: ImportOptions): BackupData {
  const saved = new Set(current.favorites.map((favorite) => favorite.id))
  const favorites = [...current.favorites, ...incoming.favorites.filter((favorite) => !saved.has(favorite.id))]
    .sort((a, b) => b.addedAt - a.addedAt)

  const counters: Record<string, Counter> = { ...current.tasbih.counters }
  for (const [id, counter] of Object.entries(incoming.tasbih.counters)) counters[id] = mergeCounter(counters[id], counter)
  const tasbih: TasbihState = {
    activeId: current.tasbih.activeId === '' ? incoming.tasbih.activeId : current.tasbih.activeId,
    counters,
    lifetimeTotal: Math.max(current.tasbih.lifetimeTotal, incoming.tasbih.lifetimeTotal),
  }

  // Reading progress belongs to one day. A file made on another day says nothing about today.
  let progress = current.progress
  if (incoming.progress.day === options.today && incoming.progress.day !== '') {
    const base = current.progress.day === options.today ? current.progress.counts : {}
    const counts: Record<string, number> = { ...base }
    for (const [key, value] of Object.entries(incoming.progress.counts)) counts[key] = Math.max(counts[key] ?? 0, value)
    progress = { day: options.today, counts }
  }

  return { favorites, tasbih, progress, prefs: options.includePrefs ? incoming.prefs : current.prefs }
}

/** Describes what an import would do, before anything is written. */
export function previewImport(
  current: BackupData,
  backup: Backup,
  options: ImportOptions,
  isKnownEntry: (id: string) => boolean,
): ImportPreview {
  const incoming = backup.data
  const saved = new Set(current.favorites.map((favorite) => favorite.id))
  const newFavorites = incoming.favorites.filter((favorite) => !saved.has(favorite.id))
  const merged = mergeBackup(current, incoming, options)

  let toAdd = 0
  let toRaise = 0
  let unchanged = 0
  for (const [id, counter] of Object.entries(incoming.tasbih.counters)) {
    const local = current.tasbih.counters[id]
    if (!local) toAdd++
    else if (sameCounter(local, mergeCounter(local, counter))) unchanged++
    else toRaise++
  }

  const appliesTodaysProgress = JSON.stringify(merged.progress) !== JSON.stringify(current.progress)
  const prefsDiffer = !samePrefs(current.prefs, incoming.prefs)
  return {
    exportedAt: backup.exportedAt,
    favorites: {
      inFile: incoming.favorites.length,
      toAdd: newFavorites.length,
      alreadySaved: incoming.favorites.length - newFavorites.length,
      notInThisVersion: newFavorites.filter((favorite) => !isKnownEntry(favorite.id)).length,
    },
    tasbih: {
      inFile: Object.keys(incoming.tasbih.counters).length,
      toAdd,
      toRaise,
      unchanged,
      lifetimeBefore: current.tasbih.lifetimeTotal,
      lifetimeAfter: merged.tasbih.lifetimeTotal,
    },
    appliesTodaysProgress,
    prefsDiffer,
    changesNothing:
      newFavorites.length === 0 && toAdd === 0 && toRaise === 0 && !appliesTodaysProgress
      && merged.tasbih.lifetimeTotal === current.tasbih.lifetimeTotal && merged.tasbih.activeId === current.tasbih.activeId
      && (!options.includePrefs || !prefsDiffer),
  }
}
