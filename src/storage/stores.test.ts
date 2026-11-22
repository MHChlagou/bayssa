import { describe, expect, it, vi } from 'vitest'
import { toggleFavorite } from '../domain/favorites/favorites.ts'
import { tasbihReducer } from '../domain/tasbih/tasbih.ts'
import { createStore } from './localStore.ts'
import { addRecent, DEFAULT_PREFS, DEFAULT_TASBIH, MAX_RECENTS, parseFavorites, parsePrefs, parseProgress, parseTasbih } from './stores.ts'

const favorites = () => createStore({ name: 'favorites', defaults: [], parse: parseFavorites })

describe('favorites persistence', () => {
  it('starts empty', () => {
    expect(favorites().get()).toEqual([])
  })

  it('survives a reload', () => {
    favorites().set((current) => toggleFavorite(current, 'h-77', 1000))
    favorites().set((current) => toggleFavorite(current, 'q-2-255', 2000))
    expect(favorites().get()).toEqual([{ id: 'q-2-255', addedAt: 2000 }, { id: 'h-77', addedAt: 1000 }])
  })

  it('removes a favorite when toggled again', () => {
    const store = favorites()
    store.set((current) => toggleFavorite(current, 'h-77', 1000))
    store.set((current) => toggleFavorite(current, 'h-77', 2000))
    expect(favorites().get()).toEqual([])
  })

  it('ignores corrupt stored data instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem('md:v1:favorites', '{not json')
    expect(favorites().get()).toEqual([])
    localStorage.setItem('md:v1:favorites', JSON.stringify({ version: 99, data: [] }))
    expect(favorites().get()).toEqual([])
    localStorage.setItem('md:v1:favorites', JSON.stringify({ version: 1, data: 'nope' }))
    expect(favorites().get()).toEqual([])
    expect(warn).toHaveBeenCalledTimes(3)
    warn.mockRestore()
  })

  it('drops malformed and duplicate items but keeps the valid ones', () => {
    expect(parseFavorites([{ id: 'a', addedAt: 1 }, { id: 'a', addedAt: 2 }, { id: 5 }, null, { id: 'b', addedAt: 3 }]))
      .toEqual([{ id: 'a', addedAt: 1 }, { id: 'b', addedAt: 3 }])
  })

  it('notifies subscribers and stops after unsubscribe', () => {
    const store = favorites()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.set([{ id: 'a', addedAt: 1 }])
    unsubscribe()
    store.set([])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('keeps working in memory when storage refuses the write', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const full: Storage = { ...localStorage, getItem: () => null, setItem: () => { throw new Error('quota') }, removeItem: () => undefined, clear: () => undefined, key: () => null, length: 0 }
    const store = createStore({ name: 'favorites', defaults: [], parse: parseFavorites, storage: full })
    store.set([{ id: 'a', addedAt: 1 }])
    expect(store.get()).toEqual([{ id: 'a', addedAt: 1 }])
    warn.mockRestore()
  })
})

describe('tasbih persistence', () => {
  it('keeps the count across a reload', () => {
    const open = () => createStore({ name: 'tasbih', defaults: DEFAULT_TASBIH, parse: parseTasbih })
    open().set((state) => tasbihReducer(tasbihReducer(state, { type: 'select', id: 'x', defaultTarget: 33 }), { type: 'increment' }))
    expect(open().get()).toEqual({ activeId: 'x', counters: { x: { count: 1, target: 33, completedRounds: 0 } }, lifetimeTotal: 1 })
  })

  it('repairs out-of-range values and drops broken counters', () => {
    expect(parseTasbih({ activeId: 'x', lifetimeTotal: -4, counters: { x: { count: 5, target: 0 }, y: { count: -1, target: 3 }, z: 'bad' } }))
      .toEqual({ activeId: 'x', counters: { x: { count: 5, target: 1, completedRounds: 0 } }, lifetimeTotal: 0 })
  })
})

describe('other parsers', () => {
  it('falls back field by field for preferences', () => {
    expect(parsePrefs({})).toEqual(DEFAULT_PREFS)
    expect(parsePrefs({ theme: 'neon', textScaleIndex: 99, hijriOffsetDays: 9, isHapticsEnabled: false }))
      .toEqual({ theme: 'system', numerals: DEFAULT_PREFS.numerals, textScaleIndex: 1, hijriOffsetDays: 2, isHapticsEnabled: false })
    expect(parsePrefs({ numerals: 'arab' }).numerals).toBe('arab')
  })

  it('rejects progress without a day', () => {
    expect(() => parseProgress({ counts: {} })).toThrow()
    expect(parseProgress({ day: '2026-01-01', counts: { a: 2, b: -1, c: 'x' } })).toEqual({ day: '2026-01-01', counts: { a: 2 } })
  })

  it('keeps recents unique, newest first and bounded', () => {
    expect(addRecent(['a', 'b'], 'b')).toEqual(['b', 'a'])
    const many = Array.from({ length: 20 }, (_, i) => `c${i}`).reduce<string[]>((list, id) => addRecent(list, id), [])
    expect(many).toHaveLength(MAX_RECENTS)
    expect(many[0]).toBe('c19')
  })
})
