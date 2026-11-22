import { describe, expect, it } from 'vitest'
import { DEDICATION_SUPPLICATION, TRIBUTE_PHRASE } from './dedication.ts'

const codePoints = (text: string): number[] => [...text].map((character) => character.codePointAt(0) ?? 0)

// The expected values are written as numbers so that no editor, terminal or
// encoding step can reorder or alter the letters without this test noticing.
describe('dedication wording', () => {
  it('stores the tribute phrase letter for letter, in reading order', () => {
    expect(codePoints(TRIBUTE_PHRASE)).toEqual([
      0x062a, 0x0631, 0x062d, 0x0651, 0x0645, 0x0648, 0x0627, // ta, ra, ha, shadda, mim, waw, alef
      0x0020,
      0x0639, 0x0644, 0x064a, 0x0647, 0x0627, // ain, lam, ya, ha, alef
    ])
  })

  it('stores the supplication letter for letter, in reading order', () => {
    expect(codePoints(DEDICATION_SUPPLICATION)).toEqual([
      0x0627, 0x0644, 0x0644, 0x0647, 0x0645, 0x0020,
      0x0627, 0x0631, 0x062d, 0x0645, 0x0647, 0x0627, 0x0020,
      0x0648, 0x0627, 0x063a, 0x0641, 0x0631, 0x0020,
      0x0644, 0x0647, 0x0627, 0x0020,
      0x0648, 0x0623, 0x0633, 0x0643, 0x0646, 0x0647, 0x0627, 0x0020,
      0x0641, 0x0633, 0x064a, 0x062d, 0x0020,
      0x062c, 0x0646, 0x0627, 0x062a, 0x0643,
    ])
  })

  it('contains no invisible direction or formatting characters', () => {
    // Zero-width and bidirectional control characters, by code point.
    const isInvisible = (point: number): boolean =>
      (point >= 0x200b && point <= 0x200f) || (point >= 0x202a && point <= 0x202e) || (point >= 0x2066 && point <= 0x2069) || point === 0xfeff
    for (const text of [TRIBUTE_PHRASE, DEDICATION_SUPPLICATION]) {
      expect(codePoints(text).filter(isInvisible)).toEqual([])
      expect(text).toBe(text.normalize('NFC'))
    }
  })
})
