// Validates the development dataset and writes the bundle the app imports.
// Production bundles contain verified, authentically graded entries only.
// Pass --include-unverified to preview hidden entries locally, --check to validate without writing.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { SOURCES } from '../content-sources/sources.ts'
import type { BundleScope, Collection, ContentBundle, Entry, SourceId, Surah, TasbihPreset } from '../src/content/schema.ts'
import { isContiguousWordRun, loadUthmani, stripLeadingBasmala } from './lib/quran.ts'

const ROOT = join(import.meta.dirname, '..')
const DATASET = join(ROOT, 'content', 'dataset')
const includeUnverified = process.argv.includes('--include-unverified')
const checkOnly = process.argv.includes('--check')
// `--rights=cleared`, or CONTENT_RIGHTS=cleared, writes the public bundle: only
// material whose redistribution is documented in content-sources/sources.ts.
const scope: BundleScope = process.argv.includes('--rights=cleared') || process.env.CONTENT_RIGHTS === 'cleared' ? 'cleared' : 'full'
if (scope === 'cleared' && includeUnverified) throw new Error('--include-unverified cannot be combined with the cleared scope')

const verification = z.strictObject({
  status: z.enum(['verified', 'needs-review']),
  method: z.enum(['quran-exact', 'exact', 'approximate', 'bracketed', 'combined', 'evening-wording', 'editor-reviewed']).optional(),
  checkedAgainst: z.array(z.string()).min(1),
  checkedOn: z.iso.date(),
  note: z.string().optional(),
})
const sourceId = z.enum(['tanzil-uthmani', 'hisn-al-muslim', 'tafsir-muyassar-tanzil', 'hadith-api'])
const provenance = z.strictObject({
  text: sourceId,
  reference: sourceId.optional(),
  meaning: sourceId.optional(),
  scholarlyReview: z.discriminatedUnion('status', [
    z.strictObject({ status: z.literal('not-reviewed') }),
    z.strictObject({ status: z.literal('reviewed'), by: z.string().min(1), on: z.iso.date() }),
  ]),
})
const quranSegment = z.strictObject({
  type: z.literal('quran'),
  surah: z.number().int().min(1).max(114),
  ayah: z.number().int().min(1),
  text: z.string().min(1),
  isPartial: z.literal(true).optional(),
})
const textSegment = z.strictObject({ type: z.literal('text'), text: z.string().min(1) })
const noteSegment = z.strictObject({ type: z.literal('note'), text: z.string().min(1) })
const hisnRef = z.strictObject({ chapter: z.number().int(), item: z.number().int() })
const entrySchema = z.discriminatedUnion('kind', [
  z.strictObject({
    id: z.string().regex(/^q-/),
    kind: z.literal('quran'),
    segments: z.array(quranSegment).min(1),
    searchText: z.string().min(1),
    meaning: z.strictObject({ text: z.string().min(1), source: z.string().min(1) }).optional(),
    provenance,
    verification,
  }),
  z.strictObject({
    id: z.string().regex(/^h-/),
    kind: z.literal('hadith'),
    segments: z.array(z.discriminatedUnion('type', [quranSegment, textSegment, noteSegment])).min(1),
    hisn: hisnRef,
    sources: z.array(z.strictObject({
      collection: z.enum(['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah']),
      number: z.string().regex(/^\d+$/),
      grading: z.strictObject({
        grade: z.enum(['sahih', 'hasan', 'daif']),
        label: z.string().min(1),
        by: z.string().optional(),
      }).optional(),
    })),
    provenance,
    verification,
  }),
])
const collectionSchema = z.strictObject({
  id: z.string().min(1),
  section: z.enum(['adhkar', 'daily-duas', 'quranic', 'prophetic']),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  icon: z.string().min(1),
  items: z.array(z.strictObject({
    entryId: z.string(),
    repeat: z.number().int().min(1),
    note: z.string().optional(),
    hisn: hisnRef.optional(),
  })),
})
const presetSchema = z.strictObject({
  id: z.string().min(1), text: z.string().min(1), entryId: z.string(), defaultTarget: z.number().int().min(1),
})
const metaSchema = z.strictObject({
  basmala: z.string().min(1),
  surahs: z.array(z.strictObject({ number: z.number().int(), name: z.string().min(1) })).length(114),
})

const read = (name: string): unknown => JSON.parse(readFileSync(join(DATASET, name), 'utf8'))
const entries: Entry[] = z.array(entrySchema).parse(read('entries.json'))
const collections: Collection[] = z.array(collectionSchema).parse(read('collections.json'))
const presets: TasbihPreset[] = z.array(presetSchema).parse(read('tasbih-presets.json'))
const meta: { basmala: string; surahs: Surah[] } = metaSchema.parse(read('meta.json'))

const problems: string[] = []
const uthmani = loadUthmani()
if (meta.basmala !== uthmani.get('1:1')) problems.push('meta.basmala differs from Tanzil 1:1')

const byId = new Map<string, Entry>()
for (const entry of entries) {
  if (byId.has(entry.id)) problems.push(`duplicate entry id ${entry.id}`)
  byId.set(entry.id, entry)

  // Quran integrity: every Quran segment must be Tanzil's text, character for character.
  for (const segment of entry.segments) {
    if (segment.type !== 'quran') continue
    const source = uthmani.get(`${segment.surah}:${segment.ayah}`)
    if (source === undefined) {
      problems.push(`${entry.id}: ayah ${segment.surah}:${segment.ayah} does not exist`)
      continue
    }
    const ayah = stripLeadingBasmala(source, meta.basmala, segment.surah, segment.ayah)
    const isIntact = segment.isPartial ? isContiguousWordRun(segment.text, ayah) : segment.text === ayah
    if (!isIntact) problems.push(`${entry.id}: text of ${segment.surah}:${segment.ayah} differs from the Tanzil Uthmani text`)
  }
  // Provenance must describe what the entry actually contains.
  if (entry.kind === 'quran' && (entry.meaning !== undefined) !== (entry.provenance.meaning !== undefined)) {
    problems.push(`${entry.id}: the explanation and its recorded source do not match`)
  }
  if (entry.kind === 'hadith' && (entry.sources.length > 0) !== (entry.provenance.reference !== undefined)) {
    problems.push(`${entry.id}: the references and their recorded source do not match`)
  }
  if (entry.kind === 'hadith' && entry.verification.status === 'verified' && entry.sources.length === 0) {
    problems.push(`${entry.id}: marked verified without a source`)
  }
}

const isAuthentic = (entry: Entry): boolean =>
  entry.kind === 'quran' || entry.sources.some((s) => s.grading !== undefined && s.grading.grade !== 'daif')
const isPublished = (entry: Entry): boolean =>
  includeUnverified || (entry.verification.status === 'verified' && isAuthentic(entry))

for (const collection of collections) {
  for (const item of collection.items) {
    if (!byId.has(item.entryId)) problems.push(`collection ${collection.id}: unknown entry ${item.entryId}`)
  }
}
for (const preset of presets) {
  const entry = byId.get(preset.entryId)
  if (!entry) { problems.push(`tasbih preset ${preset.id}: unknown entry ${preset.entryId}`); continue }
  const isExcerpt = entry.segments.some((s) => s.type === 'text' && s.text.includes(preset.text))
  if (!isExcerpt) problems.push(`tasbih preset ${preset.id}: text is not an excerpt of ${preset.entryId}`)
}

if (problems.length > 0) {
  console.error(`content validation failed:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

const isCleared = (id: SourceId | undefined): boolean => id === undefined || SOURCES[id].redistribution === 'cleared'

/** In the cleared scope an entry is kept only if its wording and its references may be redistributed. */
const isInScope = (entry: Entry): boolean =>
  scope === 'full' || (isCleared(entry.provenance.text) && isCleared(entry.provenance.reference))

/** Drops the parts of an entry that may not be redistributed, never the wording itself. */
function forScope(entry: Entry): Entry {
  if (scope === 'full' || entry.kind !== 'quran' || isCleared(entry.provenance.meaning)) return entry
  return {
    id: entry.id,
    kind: 'quran',
    segments: entry.segments,
    searchText: entry.searchText,
    provenance: { text: entry.provenance.text, scholarlyReview: entry.provenance.scholarlyReview },
    verification: entry.verification,
  }
}

const publishedCollections = collections
  .map((c) => ({
    ...c,
    items: c.items.filter((item) => {
      const e = byId.get(item.entryId)
      // A placement taken from Hisn al-Muslim (its count and its note) follows that book's rights.
      const isPlacementInScope = scope === 'full' || item.hisn === undefined
      return e !== undefined && isPublished(e) && isInScope(e) && isPlacementInScope
    }),
  }))
  .filter((c) => c.items.length > 0)
const usedIds = new Set(publishedCollections.flatMap((c) => c.items.map((item) => item.entryId)))
const publishedPresets = presets.filter((p) => { const e = byId.get(p.entryId); return e !== undefined && isPublished(e) && isInScope(e) })
for (const preset of publishedPresets) usedIds.add(preset.entryId)

const bundle: ContentBundle = {
  generatedOn: new Date().toISOString().slice(0, 10),
  scope,
  sources: [],
  basmala: meta.basmala,
  surahs: meta.surahs,
  // Editorial verification notes are for maintainers and stay out of the shipped bundle.
  entries: entries.filter((e) => usedIds.has(e.id)).map((e) => ({ ...forScope(e), verification: { ...e.verification, note: undefined } })),
  collections: publishedCollections,
  tasbihPresets: publishedPresets,
}

const usedSources = new Set<SourceId>()
for (const entry of bundle.entries) {
  for (const id of [entry.provenance.text, entry.provenance.reference, entry.provenance.meaning]) {
    if (id !== undefined) usedSources.add(id)
  }
}
bundle.sources = Object.values(SOURCES).filter((source) => usedSources.has(source.id))
if (scope === 'cleared') {
  const leaked = bundle.sources.filter((source) => source.redistribution !== 'cleared')
  if (leaked.length > 0) throw new Error(`cleared bundle still draws on: ${leaked.map((source) => source.id).join(', ')}`)
}

const hidden = entries.length - bundle.entries.length
console.log(`content (${scope}): ${bundle.entries.length} entries in ${bundle.collections.length} collections, ${bundle.tasbihPresets.length} tasbih presets, ${hidden} hidden`)
if (!checkOnly) {
  const out = join(ROOT, 'src', 'content', 'generated')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'content.json'), JSON.stringify(bundle))
}
