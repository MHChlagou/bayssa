import { describe, expect, it } from 'vitest'
import { buildSearchIndex, search } from './search.ts'

const documents = [
  { id: 'afw', text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ' },
  { id: 'rahma', text: 'رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً' },
  { id: 'rahimahu', text: 'يَرْحَمُكَ اللَّهُ فَرَحِمَهُ' },
  { id: 'ala', text: 'تَوَكَّلْتُ عَلَى اللَّهِ' },
]
const index = buildSearchIndex(documents)

describe('search', () => {
  it('returns nothing for an empty index or an empty query', () => {
    expect(search(buildSearchIndex([]), 'الله')).toEqual([])
    expect(search(index, '')).toEqual([])
    expect(search(index, '  ،  ')).toEqual([])
  })

  it('finds vocalized text from an unvocalized query', () => {
    expect(search(index, 'العفو والعافية')).toEqual(['afw'])
  })

  it('finds text regardless of how hamza on alef was typed', () => {
    expect(search(index, 'اسالك')).toEqual(['afw'])
    expect(search(index, 'أسألك')).toEqual(['afw'])
    expect(search(index, 'الاخرة')).toEqual(['afw'])
  })

  it('requires every query word to be present', () => {
    expect(search(index, 'العفو رحمة')).toEqual([])
  })

  it('ranks an exact-letter match above a folded one', () => {
    expect(search(index, 'رحمة')).toEqual(['rahma', 'rahimahu'])
    expect(search(index, 'رحمه')).toEqual(['rahimahu', 'rahma'])
  })

  it('matches a final ya typed for alef maqsura', () => {
    expect(search(index, 'علي الله')).toEqual(['ala'])
  })

  it('respects the result limit', () => {
    expect(search(index, 'الله', 1)).toHaveLength(1)
  })
})
