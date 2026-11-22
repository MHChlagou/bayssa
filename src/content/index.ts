import bundleJson from './generated/content.json'
import type { BundleScope, Collection, ContentBundle, ContentSource, Entry, SectionId, TasbihPreset } from './schema.ts'

// The bundle is produced and schema-checked by scripts/build-content.ts, so the
// shape is guaranteed at build time. The inferred JSON type is too wide to use.
const bundle = bundleJson as unknown as ContentBundle

const entriesById = new Map(bundle.entries.map((entry) => [entry.id, entry]))
const collectionsById = new Map(bundle.collections.map((collection) => [collection.id, collection]))

export const basmala: string = bundle.basmala
export const allEntries: readonly Entry[] = bundle.entries
export const allCollections: readonly Collection[] = bundle.collections
export const tasbihPresets: readonly TasbihPreset[] = bundle.tasbihPresets
/** `cleared` means this build holds only content that may be redistributed publicly. */
export const contentScope: BundleScope = bundle.scope
export const contentSources: readonly ContentSource[] = bundle.sources

/** A plain counter with no dhikr text, used when the build carries no presets. */
export const FREE_COUNTER: TasbihPreset = { id: 'free-counter', text: '', entryId: '', defaultTarget: 33 }

export function getEntry(id: string): Entry | undefined {
  return entriesById.get(id)
}

export function getCollection(id: string): Collection | undefined {
  return collectionsById.get(id)
}

export function collectionsInSection(section: SectionId): Collection[] {
  return bundle.collections.filter((collection) => collection.section === section)
}

export function collectionsContaining(entryId: string): Collection[] {
  return bundle.collections.filter((collection) => collection.items.some((item) => item.entryId === entryId))
}

export function surahName(surahNumber: number): string {
  return bundle.surahs[surahNumber - 1]?.name ?? ''
}

export function collectionPath(collection: Collection): string {
  return `/${collection.section === 'adhkar' ? 'adhkar' : 'duas'}/${collection.id}`
}

/** Entries of one section, each listed once, in reading order. */
export function entriesInSection(section: SectionId): Entry[] {
  const seen = new Set<string>()
  const entries: Entry[] = []
  for (const collection of collectionsInSection(section)) {
    for (const item of collection.items) {
      const entry = entriesById.get(item.entryId)
      if (!entry || seen.has(entry.id)) continue
      seen.add(entry.id)
      entries.push(entry)
    }
  }
  return entries
}
