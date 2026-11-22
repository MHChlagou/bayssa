import { describe, expect, it } from 'vitest'
import { allCollections, allEntries, collectionsInSection, getEntry, tasbihPresets } from './index.ts'

describe('published content', () => {
  it('has every section the app needs', () => {
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

  it('never mixes Quran text into plain text segments of Quran entries', () => {
    for (const entry of allEntries) {
      if (entry.kind === 'quran') expect(entry.segments.every((s) => s.type === 'quran')).toBe(true)
    }
  })
})
