import { describe, expect, it } from 'vitest'
import {
  BACKUP_FORMAT, BACKUP_VERSION, MAX_BACKUP_BYTES, backupFileName, createBackup, mergeBackup, parseBackupText,
  previewImport, serializeBackup, type BackupData,
} from './backup.ts'
import { DEFAULT_PREFS, DEFAULT_PROGRESS, DEFAULT_TASBIH } from './stores.ts'

const TODAY = '2026-11-22'
const empty: BackupData = { favorites: [], tasbih: DEFAULT_TASBIH, progress: DEFAULT_PROGRESS, prefs: DEFAULT_PREFS }
const device: BackupData = {
  favorites: [{ id: 'h-79', addedAt: 2000 }, { id: 'q-2-201x', addedAt: 1000 }],
  tasbih: { activeId: 'subhan-allah', counters: { 'subhan-allah': { count: 12, target: 33, completedRounds: 2 } }, lifetimeTotal: 78 },
  progress: { day: TODAY, counts: { 'morning#0': 1 } },
  prefs: { ...DEFAULT_PREFS, theme: 'dark' },
}
const now = new Date('2026-11-22T10:00:00Z')
const fileOf = (data: BackupData): string => serializeBackup(createBackup(data, now, '0.1.0'))
const parsed = (data: BackupData) => {
  const result = parseBackupText(fileOf(data))
  if (!result.ok) throw new Error(result.detail)
  return result.backup
}
const options = { includePrefs: false, today: TODAY }
const known = (): boolean => true

describe('backup file', () => {
  it('round-trips everything a person has saved', () => {
    const backup = parsed(device)
    expect(backup).toEqual({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: '2026-11-22T10:00:00.000Z', appVersion: '0.1.0', data: device })
  })

  it('round-trips an empty device', () => {
    expect(parsed(empty).data).toEqual(empty)
  })

  it('names the file after the app and the day', () => {
    expect(backupFileName(new Date(2026, 10, 22, 9))).toBe('bayssa-backup-2026-11-22.json')
  })
})

describe('rejecting files', () => {
  const error = (text: string) => {
    const result = parseBackupText(text)
    return result.ok ? 'accepted' : result.error
  }
  const withData = (change: (data: Record<string, unknown>) => void): string => {
    const file = JSON.parse(fileOf(device)) as { data: Record<string, unknown> }
    change(file.data)
    return JSON.stringify(file)
  }

  it('rejects text that is not JSON, and an empty file', () => {
    expect(error('')).toBe('not-json')
    expect(error('{not json')).toBe('not-json')
    expect(error('<html></html>')).toBe('not-json')
  })

  it('rejects JSON that is not a Bayssa backup', () => {
    expect(error('[]')).toBe('not-a-backup')
    expect(error('null')).toBe('not-a-backup')
    expect(error('"text"')).toBe('not-a-backup')
    expect(error('{}')).toBe('not-a-backup')
    expect(error(JSON.stringify({ format: 'something-else', version: 1 }))).toBe('not-a-backup')
  })

  it('rejects a version it does not know, older or newer', () => {
    for (const version of [0, 2, '1', null]) {
      expect(error(JSON.stringify({ ...JSON.parse(fileOf(device)), version }))).toBe('unsupported-version')
    }
  })

  it('rejects a file that is too large before reading it', () => {
    expect(error(' '.repeat(MAX_BACKUP_BYTES + 1))).toBe('too-large')
  })

  it('rejects a missing or wrongly typed section', () => {
    expect(error(withData((data) => { delete data.favorites }))).toBe('malformed')
    expect(error(withData((data) => { data.favorites = 'h-79' }))).toBe('malformed')
    expect(error(withData((data) => { data.tasbih = [] }))).toBe('malformed')
    expect(error(withData((data) => { data.progress = null }))).toBe('malformed')
    expect(error(withData((data) => { delete data.prefs }))).toBe('malformed')
    expect(error(JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: 'yesterday', appVersion: '0.1.0', data: device }))).toBe('malformed')
  })

  it('rejects a single bad value instead of quietly dropping it', () => {
    expect(error(withData((data) => { data.favorites = [{ id: 'h-79', addedAt: 1 }, { id: 5, addedAt: 1 }] }))).toBe('malformed')
    expect(error(withData((data) => { data.favorites = [{ id: '', addedAt: 1 }] }))).toBe('malformed')
    expect(error(withData((data) => { data.favorites = [{ id: 'h-79', addedAt: 'now' }] }))).toBe('malformed')
    expect(error(withData((data) => { data.tasbih = { activeId: 'a', counters: { a: { count: -1, target: 33, completedRounds: 0 } }, lifetimeTotal: 0 } }))).toBe('malformed')
    expect(error(withData((data) => { data.tasbih = { activeId: 'a', counters: { a: { count: 1.5, target: 33, completedRounds: 0 } }, lifetimeTotal: 0 } }))).toBe('malformed')
    expect(error(withData((data) => { data.tasbih = { activeId: 'a', counters: { a: { count: 1, target: 0, completedRounds: 0 } }, lifetimeTotal: 0 } }))).toBe('malformed')
    expect(error(withData((data) => { data.tasbih = { activeId: 'a', counters: {}, lifetimeTotal: -4 } }))).toBe('malformed')
    expect(error(withData((data) => { data.progress = { day: '22/11/2026', counts: {} } }))).toBe('malformed')
    expect(error(withData((data) => { data.prefs = { ...DEFAULT_PREFS, theme: 'neon' } }))).toBe('malformed')
    expect(error(withData((data) => { data.prefs = { ...DEFAULT_PREFS, hijriOffsetDays: 9 } }))).toBe('malformed')
  })

  it('accepts a file that lists the same favorite twice, keeping one', () => {
    const result = parseBackupText(withData((data) => { data.favorites = [{ id: 'h-79', addedAt: 2 }, { id: 'h-79', addedAt: 1 }] }))
    expect(result.ok && result.backup.data.favorites).toEqual([{ id: 'h-79', addedAt: 2 }])
  })
})

describe('merging', () => {
  it('moves everything onto an empty device, as when going from the browser to the installed app', () => {
    const merged = mergeBackup(empty, parsed(device).data, options)
    expect(merged.favorites).toEqual(device.favorites)
    expect(merged.tasbih).toEqual(device.tasbih)
    expect(merged.progress).toEqual(device.progress)
    expect(merged.prefs).toEqual(DEFAULT_PREFS)
  })

  it('leaves the device untouched when the file is empty', () => {
    expect(mergeBackup(device, parsed(empty).data, options)).toEqual(device)
    expect(previewImport(device, parsed(empty), options, known).changesNothing).toBe(true)
  })

  it('importing the same file twice changes nothing the second time', () => {
    const once = mergeBackup(empty, parsed(device).data, options)
    const twice = mergeBackup(once, parsed(device).data, options)
    expect(twice).toEqual(once)
    expect(previewImport(once, parsed(device), options, known)).toMatchObject({ changesNothing: true, favorites: { toAdd: 0, alreadySaved: 2 }, tasbih: { toAdd: 0, toRaise: 0, unchanged: 1 } })
  })

  it('adds new favorites without duplicating or dropping the ones already saved', () => {
    const incoming: BackupData = { ...empty, favorites: [{ id: 'h-79', addedAt: 9999 }, { id: 'h-91', addedAt: 3000 }] }
    const merged = mergeBackup(device, incoming, options)
    expect(merged.favorites).toEqual([{ id: 'h-91', addedAt: 3000 }, { id: 'h-79', addedAt: 2000 }, { id: 'q-2-201x', addedAt: 1000 }])
    expect(previewImport(device, parsed(incoming), options, known).favorites).toEqual({ inFile: 2, toAdd: 1, alreadySaved: 1, notInThisVersion: 0 })
  })

  it('never lowers a counter, a round count or the lifetime total', () => {
    const smaller: BackupData = { ...empty, tasbih: { activeId: 'x', counters: { 'subhan-allah': { count: 3, target: 100, completedRounds: 0 } }, lifetimeTotal: 5 } }
    expect(mergeBackup(device, smaller, options).tasbih).toEqual(device.tasbih)
    const larger: BackupData = { ...empty, tasbih: { activeId: 'x', counters: { 'subhan-allah': { count: 40, target: 100, completedRounds: 5 }, tahlil: { count: 7, target: 100, completedRounds: 0 } }, lifetimeTotal: 500 } }
    expect(mergeBackup(device, larger, options).tasbih).toEqual({
      activeId: 'subhan-allah',
      counters: { 'subhan-allah': { count: 40, target: 33, completedRounds: 5 }, tahlil: { count: 7, target: 100, completedRounds: 0 } },
      lifetimeTotal: 500,
    })
    expect(previewImport(device, parsed(larger), options, known).tasbih).toEqual({ inFile: 2, toAdd: 1, toRaise: 1, unchanged: 0, lifetimeBefore: 78, lifetimeAfter: 500 })
  })

  it('keeps preferences unless the person asks for them', () => {
    const incoming: BackupData = { ...empty, prefs: { ...DEFAULT_PREFS, theme: 'light', textScaleIndex: 3 } }
    expect(mergeBackup(device, incoming, options).prefs).toEqual(device.prefs)
    expect(mergeBackup(device, incoming, { ...options, includePrefs: true }).prefs).toEqual(incoming.prefs)
    expect(previewImport(device, parsed(incoming), options, known)).toMatchObject({ prefsDiffer: true, changesNothing: true })
    expect(previewImport(device, parsed(incoming), { ...options, includePrefs: true }, known).changesNothing).toBe(false)
  })

  it('applies reading progress only from a file made today, and never lowers it', () => {
    const yesterday: BackupData = { ...empty, progress: { day: '2026-11-21', counts: { 'morning#0': 3, 'evening#1': 2 } } }
    expect(mergeBackup(device, yesterday, options).progress).toEqual(device.progress)
    const today: BackupData = { ...empty, progress: { day: TODAY, counts: { 'morning#0': 0, 'evening#1': 2 } } }
    expect(mergeBackup(device, today, options).progress).toEqual({ day: TODAY, counts: { 'morning#0': 1, 'evening#1': 2 } })
    const stale: BackupData = { ...device, progress: { day: '2026-11-20', counts: { 'sleep#0': 1 } } }
    expect(mergeBackup(stale, today, options).progress).toEqual({ day: TODAY, counts: { 'morning#0': 0, 'evening#1': 2 } })
  })

  it('counts favorites this version of the app does not contain, and still keeps them', () => {
    const incoming: BackupData = { ...empty, favorites: [{ id: 'h-9999', addedAt: 1 }, { id: 'h-91', addedAt: 2 }] }
    expect(previewImport(empty, parsed(incoming), options, (id) => id !== 'h-9999').favorites).toEqual({ inFile: 2, toAdd: 2, alreadySaved: 0, notInThisVersion: 1 })
    expect(mergeBackup(empty, incoming, options).favorites).toHaveLength(2)
  })

  it('does not mutate what it is given', () => {
    const before = JSON.stringify(device)
    mergeBackup(device, parsed(device).data, { ...options, includePrefs: true })
    expect(JSON.stringify(device)).toBe(before)
  })
})
