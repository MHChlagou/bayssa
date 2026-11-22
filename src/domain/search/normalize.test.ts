import { describe, expect, it } from 'vitest'
import { foldLoose, normalizeArabic } from './normalize.ts'

describe('normalizeArabic', () => {
  it('returns an empty string for empty and punctuation-only input', () => {
    expect(normalizeArabic('')).toBe('')
    expect(normalizeArabic(' ،؛ ! ')).toBe('')
  })

  it('strips vocalization from fully vocalized text', () => {
    expect(normalizeArabic('اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ')).toBe('اللهم اني اسالك العفو والعافية')
  })

  it('strips shadda, sukun, tanwin and the dagger alef', () => {
    expect(normalizeArabic('رَبًّا')).toBe('ربا')
    expect(normalizeArabic('عِلْمٌ')).toBe('علم')
    expect(normalizeArabic('ٱلرَّحْمَـٰنِ')).toBe('الرحمن')
  })

  it('strips Quranic pause and annotation marks', () => {
    expect(normalizeArabic('رَحْمَةً ۚ إِنَّكَ')).toBe('رحمة انك')
    expect(normalizeArabic('لَهُۥ')).toBe('له')
  })

  it('removes tatweel', () => {
    expect(normalizeArabic('اللَّهُـــمَّ')).toBe('اللهم')
    expect(normalizeArabic('عِنْـــــدَهُ')).toBe('عنده')
  })

  it('unifies the alef forms', () => {
    for (const form of ['أحمد', 'إحمد', 'آحمد', 'ٱحمد', 'احمد']) {
      expect(normalizeArabic(form)).toBe('احمد')
    }
  })

  it('unifies a decomposed alef with madda or hamza', () => {
    expect(normalizeArabic('آمن')).toBe('امن')
    expect(normalizeArabic('أحد')).toBe('احد')
  })

  it('expands presentation forms and ligatures', () => {
    expect(normalizeArabic('ﻻ إله')).toBe('لا اله')
    expect(normalizeArabic('ﷲ')).toBe('الله')
  })

  it('keeps letters that are not interchangeable', () => {
    expect(normalizeArabic('على')).toBe('على')
    expect(normalizeArabic('علي')).toBe('علي')
    expect(normalizeArabic('رحمة')).toBe('رحمة')
    expect(normalizeArabic('رحمه')).toBe('رحمه')
    expect(normalizeArabic('مؤمن')).toBe('مؤمن')
    expect(normalizeArabic('شيء')).toBe('شيء')
  })

  it('unifies digits and collapses punctuation to single spaces', () => {
    expect(normalizeArabic('٣٣ مرّة، ثم ۱۰!')).toBe('33 مرة ثم 10')
  })
})

describe('foldLoose', () => {
  it('folds a final alef maqsura and a final ya together', () => {
    expect(foldLoose('على')).toBe(foldLoose('علي'))
    expect(foldLoose('الى الهدى')).toBe('الي الهدي')
  })

  it('folds a final ta marbuta and a final ha together', () => {
    expect(foldLoose('رحمة')).toBe(foldLoose('رحمه'))
  })

  it('leaves ya and ha alone inside a word', () => {
    expect(foldLoose('يهدي')).toBe('يهدي')
    expect(foldLoose('هداية')).toBe('هدايه')
    expect(foldLoose('الهدى')).not.toBe(foldLoose('الهده'))
  })

  it('folds hamza carriers and drops a bare hamza', () => {
    expect(foldLoose('مؤمن')).toBe('مومن')
    expect(foldLoose('شيء')).toBe(foldLoose('شي'))
    expect(foldLoose('خطايئ')).toBe('خطايي')
  })
})
