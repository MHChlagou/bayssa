import { describe, expect, it } from 'vitest'
import { dayPeriod, localDayKey, pickForDay } from './daily/daily.ts'
import { clampHijriOffset, formatHijriDate } from './hijri/hijri.ts'
import { clearCollection, countFor, progressKey, recordRepetition } from './progress/progress.ts'

describe('hijri date', () => {
  // 1 Ramadan 1445 in the Umm al-Qura calendar was 11 March 2024.
  const date = new Date(2024, 2, 11, 12)

  it('formats a known date with Arabic-Indic digits', () => {
    expect(formatHijriDate(date)).toMatch(/^١ رمضان ١٤٤٥/)
  })

  it('applies the manual adjustment', () => {
    expect(formatHijriDate(date, { offsetDays: 1 })).toMatch(/^٢ رمضان ١٤٤٥/)
    expect(formatHijriDate(date, { offsetDays: -1 })).toMatch(/شعبان ١٤٤٥/)
  })

  it('can use Western digits', () => {
    expect(formatHijriDate(date, { numerals: 'latn' })).toMatch(/^1 رمضان 1445/)
  })

  it('clamps the adjustment', () => {
    expect(clampHijriOffset(9)).toBe(2)
    expect(clampHijriOffset(-9)).toBe(-2)
    expect(clampHijriOffset(Number.NaN)).toBe(0)
  })

  it('accepts another locale for future translations', () => {
    expect(formatHijriDate(date, { locale: 'en' })).toMatch(/Ramadan/)
  })
})

describe('daily pick', () => {
  it('handles empty and single-item lists', () => {
    expect(pickForDay([], new Date())).toBeUndefined()
    expect(pickForDay(['only'], new Date())).toBe('only')
  })

  it('is stable within a day and advances the next day', () => {
    const items = ['a', 'b', 'c']
    const morning = pickForDay(items, new Date(2026, 0, 5, 6))
    expect(pickForDay(items, new Date(2026, 0, 5, 23))).toBe(morning)
    expect(pickForDay(items, new Date(2026, 0, 6, 6))).not.toBe(morning)
  })

  it('names the period of the day', () => {
    expect(dayPeriod(new Date(2026, 0, 5, 6))).toBe('morning')
    expect(dayPeriod(new Date(2026, 0, 5, 12))).toBe('midday')
    expect(dayPeriod(new Date(2026, 0, 5, 17))).toBe('evening')
    expect(dayPeriod(new Date(2026, 0, 5, 23))).toBe('night')
    expect(dayPeriod(new Date(2026, 0, 5, 2))).toBe('night')
  })
})

describe('daily progress', () => {
  const key = progressKey('morning', 0)

  it('counts up to the required repetitions and no further', () => {
    let progress = { day: '', counts: {} }
    for (let i = 0; i < 5; i++) progress = recordRepetition(progress, '2026-01-05', key, 3)
    expect(countFor(progress, '2026-01-05', key)).toBe(3)
  })

  it('starts fresh on a new day', () => {
    const progress = recordRepetition({ day: '', counts: {} }, '2026-01-05', key, 3)
    expect(countFor(progress, '2026-01-06', key)).toBe(0)
    expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('clears one collection only', () => {
    let progress = recordRepetition({ day: '', counts: {} }, 'd', key, 3)
    progress = recordRepetition(progress, 'd', progressKey('evening', 0), 3)
    expect(clearCollection(progress, 'd', 'morning').counts).toEqual({ 'evening#0': 1 })
  })
})
