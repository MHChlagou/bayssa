import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ABOUT_TEXT } from './about-text.ts'

const allText = [ABOUT_TEXT.title, ABOUT_TEXT.subtitle, ABOUT_TEXT.heading, ...ABOUT_TEXT.body, ...ABOUT_TEXT.supplications]

describe('the page about Nafissa', () => {
  it('keeps the owner\'s words exactly as given', () => {
    // Fingerprint of the text as the owner wrote it. Any edit, however small, changes it.
    expect(createHash('sha256').update(allText.join('\n'), 'utf8').digest('hex')).toBe('740198665982c223e9e00f1a459c5c1fb706ce0a6fc6350be4fa0ee2b3a77a8d')
  })

  it('has three paragraphs and two supplications', () => {
    expect(ABOUT_TEXT.body).toHaveLength(3)
    expect(ABOUT_TEXT.supplications).toHaveLength(2)
  })

  it('contains no invisible direction or formatting characters', () => {
    const isInvisible = (point: number): boolean =>
      (point >= 0x200b && point <= 0x200f) || (point >= 0x202a && point <= 0x202e) || (point >= 0x2066 && point <= 0x2069) || point === 0xfeff
    for (const text of allText) {
      expect([...text].map((character) => character.codePointAt(0) ?? 0).filter(isInvisible)).toEqual([])
    }
  })
})
