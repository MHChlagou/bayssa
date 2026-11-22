import { describe, expect, it } from 'vitest'
import { SOURCES } from '../../content-sources/sources.ts'
import { allCollections, allEntries, collectionsInSection, contentScope, contentSources, getEntry, tasbihPresets } from './index.ts'

describe('published content', () => {
  it('records where every entry comes from and that no scholar has reviewed it', () => {
    for (const entry of allEntries) {
      expect(SOURCES[entry.provenance.text], entry.id).toBeDefined()
      expect(entry.provenance.scholarlyReview, entry.id).toEqual({ status: 'not-reviewed' })
      if (entry.kind === 'hadith') expect(entry.provenance.reference, entry.id).toBe('hadith-api')
      if (entry.kind === 'quran') expect(entry.provenance.text).toBe('tanzil-uthmani')
    }
    expect(contentSources.map((source) => source.id).sort()).toEqual(
      [...new Set(allEntries.flatMap((e) => [e.provenance.text, e.provenance.reference]).filter((id) => id !== undefined))].sort(),
    )
  })

  it('a cleared build draws only on sources whose redistribution is documented', () => {
    if (contentScope !== 'cleared') return
    expect(contentSources.every((source) => source.redistribution === 'cleared')).toBe(true)
    expect(allEntries.every((entry) => entry.kind === 'quran')).toBe(true)
  })

  it('has every section the app needs', () => {
    if (contentScope !== 'full') return
    for (const section of ['adhkar', 'daily-duas', 'quranic', 'prophetic'] as const) {
      expect(collectionsInSection(section).length).toBeGreaterThan(0)
    }
    for (const id of ['morning', 'evening']) {
      expect(allCollections.some((collection) => collection.id === id)).toBe(true)
    }
  })

  it('contains verified entries only', () => {
    expect(allEntries.every((entry) => entry.verification.status === 'verified')).toBe(true)
  })

  it('gives every prophetic entry a numbered, authentically graded source', () => {
    for (const entry of allEntries) {
      if (entry.kind !== 'hadith') continue
      expect(entry.sources.length, entry.id).toBeGreaterThan(0)
      expect(entry.sources.some((s) => s.grading && s.grading.grade !== 'daif'), entry.id).toBe(true)
    }
  })

  it('resolves every collection item and tasbih preset', () => {
    for (const collection of allCollections) {
      expect(collection.items.length, collection.id).toBeGreaterThan(0)
      for (const item of collection.items) {
        expect(getEntry(item.entryId), `${collection.id}/${item.entryId}`).toBeDefined()
        expect(item.repeat).toBeGreaterThanOrEqual(1)
      }
    }
    for (const preset of tasbihPresets) expect(getEntry(preset.entryId), preset.id).toBeDefined()
  })

  it('does not expose entries held from production by decision', () => {
    for (const id of ['h-87', 'h-32', 'h-166', 'h-206', 'h-20', 'h-77']) {
      expect(getEntry(id), id).toBeUndefined()
      for (const collection of allCollections) {
        expect(collection.items.some((item) => item.entryId === id), `${collection.id}/${id}`).toBe(false)
      }
      expect(tasbihPresets.some((preset) => preset.entryId === id), id).toBe(false)
    }
  })

  it('records how every entry was matched, and publishes no match that needed a person or a workaround', () => {
    for (const entry of allEntries) {
      expect(entry.verification.method, entry.id).toBeDefined()
      expect(['combined', 'evening-wording', 'editor-reviewed'], entry.id).not.toContain(entry.verification.method)
      if (entry.kind === 'quran') expect(entry.verification.method).toBe('quran-exact')
    }
  })

  it('carries no explanation or commentary of the Quran', () => {
    for (const entry of allEntries) expect(Object.keys(entry), entry.id).not.toContain('meaning')
  })

  it('never mixes Quran text into plain text segments of Quran entries', () => {
    for (const entry of allEntries) {
      if (entry.kind === 'quran') expect(entry.segments.every((s) => s.type === 'quran')).toBe(true)
    }
  })
})
