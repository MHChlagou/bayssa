// Builds the development dataset in content/dataset from the reference sources
// and the editorial curation file. Run `npm run content:fetch` first.
//
// Rules enforced here:
// - Quran text is copied byte for byte from the Tanzil Uthmani file.
// - Supplication text is copied from Hisn al-Muslim, never typed by hand.
// - An entry is `verified` only when its wording is found in one of the six
//   hadith collections and its repetition count is stated by the source text.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Collection, CollectionItem, Entry, Grade, HadithCollectionId, HadithEntry, HadithSource,
  MatchMethod, QuranEntry, QuranSegment, Segment, Surah, TasbihPreset,
} from '../src/content/schema.ts'
import {
  collections as collectionSpecs, eveningSubstitutions, hisnExcludedReferences, hisnHeldForReview, hisnInstructionItems,
  hisnMatchKeywords,
  hisnQuranRefs, hisnRawAsText, hisnReviewedMatches, tasbihPresetSpecs, type QuranSpec,
} from '../content-sources/curation.ts'
import { excerptAyah, loadMuyassar, loadSimpleClean, loadUthmani, stripLeadingBasmala, type AyahKey } from './lib/quran.ts'
import { must } from './lib/must.ts'
import { lcsLength, skeleton, skeletonWords } from './lib/skeleton.ts'

const ROOT = join(import.meta.dirname, '..')
const SOURCES = join(ROOT, 'content-sources')
const OUT = join(ROOT, 'content', 'dataset')
const TODAY = new Date().toISOString().slice(0, 10)

const NEAR_MATCH_MIN_RATIO = 0.9
const CANDIDATE_MIN_COVERAGE = 0.75
const MIN_WORDS_FOR_UNAIDED_MATCH = 4
const QURAN_QUOTE_MIN_RATIO = 0.85
const MAX_AYAHS_WITH_MEANING = 5
const REVIEWED_MIN_COVERAGE = 0.85
const BRACKETED = /\[[^\]]*\]/g

// ---------------------------------------------------------------- Quran

const uthmani = loadUthmani()
const simpleClean = loadSimpleClean()
const muyassar = loadMuyassar()
const basmala = must(uthmani.get('1:1'), 'Uthmani 1:1')
const simpleBasmala = must(simpleClean.get('1:1'), 'simple 1:1')

const surahs: Surah[] = [...readFileSync(join(SOURCES, 'quran/tanzil-quran-data.js'), 'utf8')
  .matchAll(/^\t\[\d+, \d+, \d+, \d+, '([^']+)'/gm)]
  .slice(0, 114)
  .map((match, index) => ({ number: index + 1, name: must(match[1], 'surah name') }))
if (surahs.length !== 114) throw new Error(`expected 114 surah names, found ${surahs.length}`)

const surahLength = new Map<number, number>()
for (const key of uthmani.keys()) {
  const [surah = 0, ayah = 0] = key.split(':').map(Number)
  surahLength.set(surah, Math.max(surahLength.get(surah) ?? 0, ayah))
}

function parseRef(ref: string): { surah: number; start: number; end: number } {
  const [surahPart, ayahPart] = ref.split(':')
  const surah = Number(surahPart)
  if (ayahPart === undefined) return { surah, start: 1, end: must(surahLength.get(surah), `surah ${surah}`) }
  const [start, end] = ayahPart.split('-').map(Number)
  const first = must(start, `ayah in ${ref}`)
  return { surah, start: first, end: end ?? first }
}

function specId(spec: QuranSpec): string {
  const isExcerpt = spec.from !== undefined || spec.to !== undefined
  return spec.ref.replace(/[:-]/g, '-') + (isExcerpt ? 'x' : '')
}

function sliceSpec(spec: QuranSpec, source: Map<AyahKey, string>, sourceBasmala: string) {
  const { surah, start, end } = parseRef(spec.ref)
  const ayahs: { surah: number; ayah: number; text: string; isPartial: boolean }[] = []
  for (let ayah = start; ayah <= end; ayah++) {
    const full = stripLeadingBasmala(must(source.get(`${surah}:${ayah}`), `ayah ${surah}:${ayah}`), sourceBasmala, surah, ayah)
    const excerpt = {
      ...(ayah === start ? { from: spec.from, fromOccurrence: spec.fromOccurrence } : {}),
      ...(ayah === end ? { to: spec.to } : {}),
    }
    const text = excerptAyah(full, excerpt)
    ayahs.push({ surah, ayah, text, isPartial: text !== full })
  }
  return ayahs
}

const entries = new Map<string, Entry>()

function quranEntry(specs: QuranSpec[]): QuranEntry {
  const id = 'q-' + specs.map(specId).join('_')
  const existing = entries.get(id)
  if (existing) return existing as QuranEntry

  const segments: QuranSegment[] = specs.flatMap((spec) =>
    sliceSpec(spec, uthmani, basmala).map(({ isPartial, ...rest }) => ({
      type: 'quran' as const, ...rest, ...(isPartial ? { isPartial } : {}),
    })),
  )
  const plain = specs.flatMap((spec) => sliceSpec(spec, simpleClean, simpleBasmala).map((a) => a.text))
  const surahNames = [...new Set(segments.map((s) => must(surahs[s.surah - 1], `surah ${s.surah}`).name))]
  const entry: QuranEntry = {
    id,
    kind: 'quran',
    segments,
    searchText: [...plain, ...surahNames].join(' '),
    ...(segments.length <= MAX_AYAHS_WITH_MEANING
      ? {
          meaning: {
            text: segments.map((s) => must(muyassar.get(`${s.surah}:${s.ayah}`), `tafsir ${s.surah}:${s.ayah}`)).join(' '),
            source: 'التفسير الميسر · مجمع الملك فهد لطباعة المصحف الشريف',
          },
        }
      : {}),
    verification: { status: 'verified', method: 'quran-exact', checkedAgainst: ['tanzil-uthmani-1.1'], checkedOn: TODAY },
  }
  entries.set(id, entry)
  return entry
}

// ---------------------------------------------------------------- Hadith index

const BOOKS: HadithCollectionId[] = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah']

type IndexedHadith = {
  number: string
  words: string[]
  wordSet: Set<string>
  joined: string
  grades: { name: string; grade: string }[]
}

const bookIndex = new Map<HadithCollectionId, IndexedHadith[]>()
for (const book of BOOKS) {
  const raw = JSON.parse(readFileSync(join(SOURCES, 'cache/hadith', `${book}.json`), 'utf8')) as {
    hadiths: { arabicnumber?: number | string; text: string; grades: { name: string; grade: string }[] }[]
  }
  // Records without a citable number cannot serve as a reference, so they are not matched.
  bookIndex.set(book, raw.hadiths.filter((h) => h.text.trim() !== '' && h.arabicnumber !== undefined).map((h) => {
    const words = skeletonWords(h.text)
    return {
      number: must(String(h.arabicnumber).split('.')[0], 'hadith number'),
      words,
      wordSet: new Set(words),
      joined: ` ${words.join(' ')} `,
      grades: h.grades,
    }
  }))
}

const GRADERS: [string, string][] = [
  ['Al-Albani', 'الألباني'],
  ['Shuaib Al Arnaut', 'شعيب الأرناؤوط'],
  ['Zubair Ali Zai', 'زبير علي زئي'],
]

const GRADE_LABELS: Record<string, [Grade, string]> = {
  Sahih: ['sahih', 'صحيح'],
  'Hasan Sahih': ['sahih', 'حسن صحيح'],
  'Sahih Lighairihi': ['sahih', 'صحيح لغيره'],
  'Isnaad Sahih': ['sahih', 'إسناده صحيح'],
  Hasan: ['hasan', 'حسن'],
  'Hasan Lighairihi': ['hasan', 'حسن لغيره'],
  'Isnaad Hasan': ['hasan', 'إسناده حسن'],
  Daif: ['daif', 'ضعيف'],
  'Very Daif': ['daif', 'ضعيف جداً'],
  'Isnaad Daif': ['daif', 'إسناده ضعيف'],
}

function gradingFor(book: HadithCollectionId, hadith: IndexedHadith): HadithSource['grading'] {
  if (book === 'bukhari' || book === 'muslim') return { grade: 'sahih', label: 'صحيح' }
  for (const [name, arabicName] of GRADERS) {
    const found = hadith.grades.find((g) => g.name === name)
    if (!found) continue
    const known = GRADE_LABELS[found.grade.trim()]
    if (known) return { grade: known[0], label: known[1], by: arabicName }
    if (/^Sahih (Bukhari|Muslim) \(/.test(found.grade)) return { grade: 'sahih', label: 'صحيح', by: arabicName }
    // A grade we cannot classify is not guessed at: try the next grader.
  }
  return undefined
}

type Match = { book: HadithCollectionId; hadith: IndexedHadith; ratio: number }

function findMatches(words: string[], keywords: string[], excluded: ReadonlySet<string> = new Set()): Match[] {
  const needle = ` ${words.join(' ')} `
  const distinct = [...new Set(words)]
  const matches: Match[] = []
  for (const book of BOOKS) {
    let best: Match | undefined
    for (const hadith of bookIndex.get(book) ?? []) {
      if (excluded.has(`${book}:${hadith.number}`)) continue
      if (!keywords.every((k) => hadith.joined.includes(k))) continue
      let ratio: number
      if (hadith.joined.includes(needle)) {
        ratio = 1
      } else {
        const covered = distinct.filter((w) => hadith.wordSet.has(w)).length
        if (covered / distinct.length < CANDIDATE_MIN_COVERAGE) continue
        ratio = lcsLength(words, hadith.words) / words.length
        if (ratio < NEAR_MATCH_MIN_RATIO) continue
        ratio = Math.min(ratio, 0.999)
      }
      const isBetter = !best || ratio > best.ratio
        || (ratio === best.ratio && hadith.words.length < best.hadith.words.length)
      if (isBetter) best = { book, hadith, ratio }
    }
    if (best) matches.push(best)
  }
  return matches.sort((a, b) => b.ratio - a.ratio || BOOKS.indexOf(a.book) - BOOKS.indexOf(b.book))
}

function toEvening(words: string[]): string[] {
  return words.map((word) => {
    for (const [morning, evening] of eveningSubstitutions) {
      const match = new RegExp(`^([وف]?)${morning}$`).exec(word)
      if (match) return match[1] + evening
    }
    return word
  })
}

// ---------------------------------------------------------------- Hisn al-Muslim

type Piece = { kind: 'dua' | 'quran' | 'raw'; text: string }

function splitQuranQuotes(text: string, outerKind: 'dua' | 'raw'): Piece[] {
  const pieces: Piece[] = []
  let cursor = 0
  for (const match of text.matchAll(/﴿(.*?)﴾/gs)) {
    pieces.push({ kind: outerKind, text: text.slice(cursor, match.index) })
    pieces.push({ kind: 'quran', text: match[1] ?? '' })
    cursor = match.index + match[0].length
  }
  pieces.push({ kind: outerKind, text: text.slice(cursor) })
  return pieces
}

function tokenize(text: string): Piece[] {
  const pieces: Piece[] = []
  let cursor = 0
  for (const match of text.matchAll(/\(\((.*?)\)\)(?!\))/gs)) {
    pieces.push(...splitQuranQuotes(text.slice(cursor, match.index), 'raw'))
    pieces.push(...splitQuranQuotes(match[1] ?? '', 'dua'))
    cursor = match.index + match[0].length
  }
  if (cursor === 0) {
    const wrapped = /^\s*\(\s*(.*?)\s*\)\s*\.?\s*$/s.exec(text)
    if (wrapped && !text.includes('﴿')) return [{ kind: 'dua', text: wrapped[1] ?? '' }]
  }
  pieces.push(...splitQuranQuotes(text.slice(cursor), 'raw'))
  return pieces
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').replace(/ ([،.؛:])/g, '$1').trim()

function cleanNotes(raw: string): string[] {
  const text = tidy(raw).replace(/^[\s.،,؛:]+|[\s.،,؛:]+$/g, '')
  if (skeleton(text) === '') return []
  const groups = [...text.matchAll(/\(([^()]+)\)|\[([^[\]]+)\]/g)]
  const remainder = text.replace(/\(([^()]+)\)|\[([^[\]]+)\]/g, '')
  if (groups.length > 0 && skeleton(remainder) === '') {
    return groups.map((g) => tidy(g[1] ?? g[2] ?? '').replace(/[.،]+$/, ''))
  }
  return [text]
}

const COUNT_PHRASES: [string, number][] = [
  ['ثلاثا وثلاثين', 33], ['ثلاث مرات', 3], ['اربع مرات', 4], ['سبع مرات', 7], ['عشر مرات', 10],
  ['مايه مره', 100],
]
const RECITATION_OPENERS = new Set(['بسم الله الرحمن الرحيم', 'اعوذ بالله من الشيطان الرجيم'])

type Imported = { item: CollectionItem; flags: string[] }
const imported = new Map<number, Imported>()
const report: string[] = []

function importHisnItem(chapter: number, raw: { ID: number; ARABIC_TEXT: string; REPEAT: number }): Imported {
  const cached = imported.get(raw.ID)
  if (cached) return cached

  const flags: string[] = []
  const pieces = tokenize(raw.ARABIC_TEXT)
  const quranSpecs = [...(hisnQuranRefs[raw.ID] ?? [])]
  const rawAsText = hisnRawAsText[raw.ID] ?? []
  const segments: Segment[] = []
  const usedSpecs: QuranSpec[] = []
  let rawIndex = -1

  for (const piece of pieces) {
    if (piece.kind === 'quran') {
      const spec = quranSpecs.shift()
      if (!spec) { flags.push('quran-quote-without-reference'); continue }
      const plain = sliceSpec(spec, simpleClean, simpleBasmala).map((a) => a.text).join(' ')
      const quoted = skeletonWords(piece.text)
      const reference = skeletonWords(plain)
      const ratio = lcsLength(quoted, reference) / Math.max(quoted.length, reference.length)
      if (ratio < QURAN_QUOTE_MIN_RATIO) flags.push(`quran-quote-mismatch(${spec.ref}:${ratio.toFixed(2)})`)
      usedSpecs.push(spec)
      segments.push(...sliceSpec(spec, uthmani, basmala).map(({ isPartial, ...rest }) => ({
        type: 'quran' as const, ...rest, ...(isPartial ? { isPartial } : {}),
      })))
      continue
    }
    if (piece.kind === 'raw') rawIndex++
    const isRecited = piece.kind === 'dua' ? !hisnInstructionItems.has(raw.ID) : rawAsText.includes(rawIndex)
    if (isRecited) {
      const text = tidy(piece.text.replace(/\(\(|\)\)/g, '')).replace(/^[،.؛:\s]+|[،؛:\s]+$/g, '')
      if (skeleton(text) !== '') segments.push({ type: 'text', text })
      continue
    }
    if (/\(\(|\)\)/.test(piece.text)) flags.push('unbalanced-delimiters')
    for (const note of cleanNotes(piece.text.replace(/\(\(|\)\)/g, ''))) {
      if (!RECITATION_OPENERS.has(skeleton(note))) segments.push({ type: 'note', text: note })
    }
  }
  if (quranSpecs.length > 0) flags.push('unused-quran-reference')

  const recited = segments.filter((s) => s.type !== 'note')
  if (recited.length === 0) flags.push('no-recited-text')
  if (!raw.ARABIC_TEXT.includes('((') && !raw.ARABIC_TEXT.includes('﴿') && pieces[0]?.kind === 'raw') {
    flags.push('no-delimiters')
  }

  // Repetition count: the book's own words decide, the API field only confirms.
  const noteText = skeleton(segments.filter((s) => s.type === 'note').map((s) => s.text).join(' '))
  const wholeText = skeleton(raw.ARABIC_TEXT)
  const stated = COUNT_PHRASES.find(([phrase]) => noteText.includes(phrase))
  let repeat = 1
  if (stated) {
    repeat = stated[1]
  } else if (raw.REPEAT > 1) {
    const confirmed = COUNT_PHRASES.some(([phrase, count]) => count === raw.REPEAT && wholeText.includes(phrase))
    if (confirmed) repeat = raw.REPEAT
    else flags.push(`repeat-unconfirmed(${raw.REPEAT})`)
  }
  const visibleSegments = segments.filter(
    (s) => !(s.type === 'note' && COUNT_PHRASES.some(([phrase]) => skeleton(s.text) === phrase)),
  )

  const hisn = { chapter, item: raw.ID }
  const textSegments = visibleSegments.filter((s) => s.type === 'text')
  let result: Imported

  if (textSegments.length === 0 && usedSpecs.length > 0 && flags.length === 0) {
    const entry = quranEntry(usedSpecs)
    const note = visibleSegments.filter((s) => s.type === 'note').map((s) => s.text).join(' · ')
    result = { item: { entryId: entry.id, repeat, ...(note ? { note } : {}), hisn }, flags }
  } else {
    const text = textSegments.map((s) => s.text).join(' ')
    const keywords = (hisnMatchKeywords[raw.ID] ?? []).map((k) => skeleton(k))
    const fullWords = skeletonWords(text)
    const bareWords = skeletonWords(text.replace(BRACKETED, ' '))
    const attempts: { label: string; words: string[] }[] = [{ label: '', words: fullWords }]
    if (bareWords.length !== fullWords.length) attempts.push({ label: 'without bracketed additions', words: bareWords })
    if (chapter === 27) attempts.push({ label: 'in its evening wording', words: toEvening(fullWords) })

    let matches: Match[] = []
    const excluded = new Set((hisnExcludedReferences[raw.ID] ?? []).map((ref) => `${ref.collection}:${ref.number}`))
    let matchedAs = ''
    for (const attempt of attempts) {
      if (attempt.words.length === 0) continue
      if (attempt.words.length < MIN_WORDS_FOR_UNAIDED_MATCH && keywords.length === 0) continue
      matches = findMatches(attempt.words, keywords, excluded)
      if (matches.length > 0) { matchedAs = attempt.label; break }
    }
    if (matches.length === 0) {
      // The book sometimes joins several narrations: accept only if every part is found on its own.
      const runs = textSegments.flatMap((s) => s.text.split(BRACKETED)).map((run) => skeletonWords(run)).filter((run) => run.length > 0)
      const perRun = runs.map((run) => (run.length < MIN_WORDS_FOR_UNAIDED_MATCH ? [] : findMatches(run, [], excluded)))
      if (runs.length > 1 && perRun.every((found) => found.length > 0)) {
        matches = perRun.flatMap((found) => found.slice(0, 1))
        matchedAs = 'as a combination of narrations'
      }
    }
    const reviewed = hisnReviewedMatches[raw.ID]
    if (matches.length === 0 && reviewed) {
      const distinct = [...new Set(fullWords)]
      for (const hadith of bookIndex.get(reviewed.collection) ?? []) {
        if (hadith.number !== reviewed.number) continue
        const coverage = distinct.filter((w) => hadith.wordSet.has(w)).length / distinct.length
        if (coverage < REVIEWED_MIN_COVERAGE) continue
        matches = [{ book: reviewed.collection, hadith, ratio: lcsLength(fullWords, hadith.words) / fullWords.length }]
        matchedAs = `editor-reviewed: ${reviewed.reason}`
      }
    }
    if (matches.length === 0) {
      flags.push(fullWords.length < MIN_WORDS_FOR_UNAIDED_MATCH && keywords.length === 0
        ? 'too-short-to-match' : 'wording-not-found-in-six-books')
    } else if (matchedAs === 'without bracketed additions') {
      visibleSegments.push({ type: 'note', text: 'ما بين المعقوفين زيادة من رواية أخرى أوردها مؤلف حصن المسلم.' })
    } else if (matchedAs === 'as a combination of narrations') {
      visibleSegments.push({ type: 'note', text: 'هذا النص مجموع من أكثر من رواية كما أورده مؤلف حصن المسلم.' })
    }
    const METHOD_BY_LABEL: Record<string, MatchMethod> = {
      'without bracketed additions': 'bracketed',
      'in its evening wording': 'evening-wording',
      'as a combination of narrations': 'combined',
    }
    let method: MatchMethod | undefined
    if (matches.length > 0) {
      method = matchedAs.startsWith('editor-reviewed') ? 'editor-reviewed'
        : METHOD_BY_LABEL[matchedAs] ?? (matches.some((m) => m.ratio === 1) ? 'exact' : 'approximate')
    }
    const hold = hisnHeldForReview[raw.ID]
    if (hold) flags.push(`held-by-decision (${hold.decidedOn}, ${hold.decidedBy}): ${hold.decision}. ${hold.reason}`)
    if (matchedAs) matchedAs = ` (matched ${matchedAs})`

    const allSources: HadithSource[] = matches.map((m) => {
      const grading = gradingFor(m.book, m.hadith)
      return { collection: m.book, number: m.hadith.number, ...(grading ? { grading } : {}) }
    })
    const authentic = allSources.filter((s) => s.grading && s.grading.grade !== 'daif')
    const sources = (authentic.length > 0 ? authentic : allSources).slice(0, 3)
    const matchNote = matches
      .map((m) => `${m.book} ${m.hadith.number}: ${m.ratio === 1 ? 'exact wording' : `near wording ${m.ratio.toFixed(2)}`}`)
      .join('; ')

    const entry: HadithEntry = {
      id: `h-${raw.ID}`,
      kind: 'hadith',
      segments: visibleSegments,
      hisn,
      sources,
      verification: {
        status: flags.length === 0 ? 'verified' : 'needs-review',
        ...(method ? { method } : {}),
        checkedAgainst: ['hisnmuslim.com', ...new Set(matches.map((m) => `hadith-api:${m.book}`))],
        checkedOn: TODAY,
        ...(flags.length > 0 || matchNote ? { note: [flags.join(', '), matchNote + matchedAs].filter(Boolean).join(' | ') } : {}),
      },
    }
    entries.set(entry.id, entry)
    result = { item: { entryId: entry.id, repeat }, flags }
  }

  if (raw.REPEAT !== repeat && !flags.some((f) => f.startsWith('repeat-unconfirmed'))) {
    report.push(`#${raw.ID}: source text states ${repeat}, API field says ${raw.REPEAT}; using ${repeat}`)
  }
  imported.set(raw.ID, result)
  return result
}

type HisnChapter = { title: string; items: { ID: number; ARABIC_TEXT: string; REPEAT: number }[] }
const chapters = new Map<number, HisnChapter>()
for (const file of readdirSync(join(SOURCES, 'hisn/chapters'))) {
  const data = JSON.parse(readFileSync(join(SOURCES, 'hisn/chapters', file), 'utf8')) as Record<string, HisnChapter['items']>
  const [title, items] = must(Object.entries(data)[0], `chapter in ${file}`)
  chapters.set(Number(file.replace('.json', '')), { title, items })
}

// ---------------------------------------------------------------- Collections

const collections: Collection[] = collectionSpecs.map((spec) => {
  const items: CollectionItem[] = []
  for (const source of spec.chapters ?? []) {
    const chapter = chapters.get(source.chapter)
    if (!chapter) throw new Error(`collection ${spec.id}: Hisn chapter ${source.chapter} not found`)
    for (const raw of chapter.items) {
      if (source.except?.includes(raw.ID)) continue
      items.push(importHisnItem(source.chapter, raw).item)
    }
  }
  for (const quranSpec of spec.quran ?? []) {
    items.push({ entryId: quranEntry([quranSpec]).id, repeat: 1 })
  }
  return {
    id: spec.id, section: spec.section, title: spec.title,
    ...(spec.subtitle ? { subtitle: spec.subtitle } : {}), icon: spec.icon, items,
  }
})

// ---------------------------------------------------------------- Tasbih presets

const EDGE_PUNCTUATION = /^[\s،.؛:()[\]]+|[\s،.؛:()[\]]+$/g

const tasbihPresets: TasbihPreset[] = tasbihPresetSpecs.map((spec) => {
  const entry = entries.get(`h-${spec.hisnItem}`)
  if (!entry) throw new Error(`tasbih preset ${spec.id}: Hisn item ${spec.hisnItem} was not imported`)
  const phrase = skeletonWords(spec.phrase)
  for (const segment of entry.segments) {
    if (segment.type !== 'text') continue
    const words = segment.text.split(' ')
    const skeletons = words.map((w) => skeleton(w))
    for (let start = 0; start + phrase.length <= words.length; start++) {
      if (phrase.every((p, offset) => skeletons[start + offset] === p)) {
        const text = words.slice(start, start + phrase.length).join(' ').replace(EDGE_PUNCTUATION, '')
        return { id: spec.id, text, entryId: entry.id, defaultTarget: spec.defaultTarget }
      }
    }
  }
  throw new Error(`tasbih preset ${spec.id}: phrase not found in Hisn item ${spec.hisnItem}`)
})

// ---------------------------------------------------------------- Output

mkdirSync(OUT, { recursive: true })
const write = (name: string, value: unknown) => writeFileSync(join(OUT, name), JSON.stringify(value, null, 2) + '\n')
const allEntries = [...entries.values()]
write('meta.json', { basmala, surahs })
write('entries.json', allEntries)
write('collections.json', collections)
write('tasbih-presets.json', tasbihPresets)

const isAuthentic = (entry: Entry) =>
  entry.kind === 'quran' || entry.sources.some((s) => s.grading && s.grading.grade !== 'daif')
const publishable = allEntries.filter((e) => e.verification.status === 'verified' && isAuthentic(e))
console.log(`entries: ${allEntries.length} · publishable: ${publishable.length}`)
for (const collection of collections) {
  const ok = collection.items.filter((i) => publishable.some((e) => e.id === i.entryId)).length
  console.log(`  ${collection.section}/${collection.id}: ${ok}/${collection.items.length}`)
}
if (process.argv.includes('--verbose')) {
  for (const entry of allEntries) {
    if (publishable.includes(entry)) continue
    const first = entry.segments.find((s) => s.type !== 'note')
    console.log(`HIDDEN ${entry.id}: ${entry.verification.note ?? 'not authentic'} :: ${first?.text.slice(0, 60) ?? ''}`)
  }
}
console.log(report.join('\n'))
