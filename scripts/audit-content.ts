// Writes the pre-release content audit: every published entry with its source,
// how it was matched, automatic cross-checks, and a recommended action.
// Also writes the coverage report for hidden entries.
//
// The cross-checks use a second, independent transcription of Hisn al-Muslim
// that carries the author's own footnotes (content-sources/hisn-footnotes).
// Nothing here changes the dataset: this script only reads and reports.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Collection, Entry, HadithCollectionId, HadithEntry } from '../src/content/schema.ts'
import { hisnExcludedReferences, hisnHeldForReview } from '../content-sources/curation.ts'
import { SOURCES as SOURCE_REGISTRY } from '../content-sources/sources.ts'
import { must } from './lib/must.ts'
import { skeleton, skeletonWords } from './lib/skeleton.ts'

const ROOT = join(import.meta.dirname, '..')
const SOURCES = join(ROOT, 'content-sources')
const OUT = join(ROOT, 'docs', 'pre-release')

const entries = JSON.parse(readFileSync(join(ROOT, 'content/dataset/entries.json'), 'utf8')) as Entry[]
const collections = JSON.parse(readFileSync(join(ROOT, 'content/dataset/collections.json'), 'utf8')) as Collection[]

const isAuthentic = (entry: Entry): boolean =>
  entry.kind === 'quran' || entry.sources.some((s) => s.grading !== undefined && s.grading.grade !== 'daif')
const isPublished = (entry: Entry): boolean => entry.verification.status === 'verified' && isAuthentic(entry)

// ---------------------------------------------------------------- Hisn raw items and footnotes

type RawItem = { ID: number; ARABIC_TEXT: string; REPEAT: number; chapter: number; chapterTitle: string }
const rawItems = new Map<number, RawItem>()
for (const file of readdirSync(join(SOURCES, 'hisn/chapters'))) {
  const data = JSON.parse(readFileSync(join(SOURCES, 'hisn/chapters', file), 'utf8')) as Record<string, Omit<RawItem, 'chapter' | 'chapterTitle'>[]>
  const [chapterTitle, items] = must(Object.entries(data)[0], `chapter in ${file}`)
  for (const item of items) rawItems.set(item.ID, { ...item, chapter: Number(file.replace('.json', '')), chapterTitle })
}

type Footnoted = { Text: string; Count: number; Reference: string }
const footnoted: (Footnoted & { words: string[]; wordSet: Set<string> })[] = Object.values(
  JSON.parse(readFileSync(join(SOURCES, 'hisn-footnotes/hisn-with-references.json'), 'utf8')) as Record<string, { Adhkar: Footnoted[] }>,
).flatMap((chapter) => chapter.Adhkar).map((item) => {
  const words = skeletonWords(item.Text)
  return { ...item, words, wordSet: new Set(words) }
})

/** Longest common subsequence, returning which words of `a` were matched. */
function alignWords(a: string[], b: string[]): { matched: boolean[]; length: number } {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const row = must(table[i], 'row')
      const above = must(table[i - 1], 'row')
      row[j] = a[i - 1] === b[j - 1] ? (above[j - 1] ?? 0) + 1 : Math.max(above[j] ?? 0, row[j - 1] ?? 0)
    }
  }
  const matched = new Array<boolean>(a.length).fill(false)
  let i = a.length
  let j = b.length
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { matched[i - 1] = true; i--; j-- }
    else if ((table[i - 1]?.[j] ?? 0) >= (table[i]?.[j - 1] ?? 0)) i--
    else j--
  }
  return { matched, length: table[a.length]?.[b.length] ?? 0 }
}

const FOOTNOTE_MIN_SIMILARITY = 0.6

function footnoteFor(text: string): { item: Footnoted; similarity: number } | undefined {
  const words = skeletonWords(text)
  if (words.length === 0) return undefined
  let best: { item: Footnoted; similarity: number } | undefined
  for (const candidate of footnoted) {
    const shared = words.filter((w) => candidate.wordSet.has(w)).length
    if (shared / words.length < 0.5) continue
    const similarity = alignWords(words, candidate.words).length / Math.max(words.length, candidate.words.length)
    if (!best || similarity > best.similarity) best = { item: candidate, similarity }
  }
  return best && best.similarity >= FOOTNOTE_MIN_SIMILARITY ? best : undefined
}

const CITED: [string, string, HadithCollectionId | null][] = [
  ['البخاري', 'البخاري', 'bukhari'], ['مسلم', 'مسلم', 'muslim'], ['داود', 'أبو داود', 'abudawud'],
  ['الترمذي', 'الترمذي', 'tirmidhi'], ['النسايي', 'النسائي', 'nasai'], ['ابن ماجه', 'ابن ماجه', 'ibnmajah'],
  ['احمد', 'أحمد', null], ['الحاكم', 'الحاكم', null], ['ابن السني', 'ابن السني', null], ['الطبراني', 'الطبراني', null],
  ['ابن حبان', 'ابن حبان', null], ['الدارمي', 'الدارمي', null], ['الموطا', 'مالك', null], ['مالك', 'مالك', null],
  ['البيهقي', 'البيهقي', null], ['ابن خزيمه', 'ابن خزيمة', null], ['البزار', 'البزار', null],
  ['ابن ابي شيبه', 'ابن أبي شيبة', null], ['عبد الرزاق', 'عبد الرزاق', null], ['ابو يعلي', 'أبو يعلى', null],
  ['الدارقطني', 'الدارقطني', null], ['البغوي', 'البغوي', null],
]

function citedIn(reference: string): { names: string[]; ids: Set<HadithCollectionId> } {
  const text = ` ${skeleton(reference)} `
  const names = new Set<string>()
  const ids = new Set<HadithCollectionId>()
  for (const [needle, name, id] of CITED) {
    if (!text.includes(needle)) continue
    names.add(name)
    if (id) ids.add(id)
  }
  // "أصحاب السنن" and "الأربعة" name the four Sunan together.
  if (/اصحاب السنن|اهل السنن|السنن الاربعه| الاربعه /.test(text)) {
    for (const id of ['abudawud', 'tirmidhi', 'nasai', 'ibnmajah'] as const) ids.add(id)
    names.add('أصحاب السنن')
  }
  return { names: [...names], ids }
}

// ---------------------------------------------------------------- Hadith collections (optional cache)

type CachedHadith = { number: string; words: string[]; grades: { name: string; grade: string }[] }
const bookCache = new Map<string, CachedHadith[]>()

function loadBook(book: HadithCollectionId): CachedHadith[] {
  const cached = bookCache.get(book)
  if (cached) return cached
  const path = join(SOURCES, 'cache/hadith', `${book}.json`)
  if (!existsSync(path)) throw new Error(`missing ${path}: run "npm run content:fetch" first`)
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { hadiths: { arabicnumber?: number | string; text: string; grades: { name: string; grade: string }[] }[] }
  const hadiths = raw.hadiths.filter((h) => h.arabicnumber !== undefined).map((h) => ({
    number: must(String(h.arabicnumber).split('.')[0], 'number'), words: skeletonWords(h.text), grades: h.grades,
  }))
  bookCache.set(book, hadiths)
  return hadiths
}

type Extra = { file: string; label: string }
const EXTRA_BOOKS: Extra[] = [
  { file: 'ahmed', label: 'مسند أحمد (نسخة ناقصة)' }, { file: 'malik', label: 'موطأ مالك' }, { file: 'darimi', label: 'سنن الدارمي' },
  { file: 'aladab_almufrad', label: 'الأدب المفرد' }, { file: 'riyad_assalihin', label: 'رياض الصالحين' },
  { file: 'mishkat_almasabih', label: 'مشكاة المصابيح' }, { file: 'bulugh_almaram', label: 'بلوغ المرام' },
]
const extraIndex: { label: string; hadiths: { number: number; joined: string; wordSet: Set<string>; words: string[] }[] }[] = []
for (const extra of EXTRA_BOOKS) {
  const path = join(SOURCES, 'cache/extra', `${extra.file}.json`)
  if (!existsSync(path)) continue
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { hadiths: { idInBook: number; arabic: string }[] }
  extraIndex.push({
    label: extra.label,
    hadiths: raw.hadiths.map((h) => {
      const words = skeletonWords(h.arabic)
      return { number: h.idInBook, joined: ` ${words.join(' ')} `, wordSet: new Set(words), words }
    }),
  })
}

// ---------------------------------------------------------------- Per-entry audit

const recitedText = (entry: Entry): string =>
  entry.segments.filter((s) => s.type === 'text').map((s) => s.text).join(' ')

const displayText = (entry: Entry): string =>
  entry.segments.map((s) => (s.type === 'quran' ? `﴿${s.text}﴾` : s.type === 'note' ? `[ملاحظة المصدر: ${s.text}]` : s.text)).join(' ')

const COLLECTION_NAMES: Record<HadithCollectionId, string> = {
  bukhari: 'صحيح البخاري', muslim: 'صحيح مسلم', abudawud: 'سنن أبي داود', tirmidhi: 'جامع الترمذي', nasai: 'سنن النسائي', ibnmajah: 'سنن ابن ماجه',
}

const AMBIGUITY_MIN_RATIO = 0.9

/** How many narrations of a collection carry this wording (exactly, or 90% in order). */
function narrationsCarrying(words: string[], book: HadithCollectionId): string[] {
  const needle = ` ${words.join(' ')} `
  const distinct = [...new Set(words)]
  const numbers = new Set<string>()
  for (const hadith of loadBook(book)) {
    const joined = ` ${hadith.words.join(' ')} `
    if (joined.includes(needle)) { numbers.add(hadith.number); continue }
    const wordSet = new Set(hadith.words)
    if (distinct.filter((w) => wordSet.has(w)).length / distinct.length < 0.75) continue
    if (alignWords(words, hadith.words).length / words.length >= AMBIGUITY_MIN_RATIO) numbers.add(hadith.number)
  }
  return [...numbers]
}

const BRACKETED = /\[[^\]]*\]/g
const LARGE_BRACKET_SHARE = 0.2

type Method = 'quran-exact' | 'exact' | 'near' | 'bracketed' | 'combined' | 'evening-wording' | 'editor-reviewed' | 'unmatched'

function methodOf(entry: Entry): Method {
  if (entry.kind === 'quran') return 'quran-exact'
  const method = entry.verification.method
  if (method === undefined) return 'unmatched'
  return method === 'approximate' ? 'near' : method
}

const holdFor = (entry: Entry): (typeof hisnHeldForReview)[number] | undefined =>
  entry.kind === 'hadith' ? hisnHeldForReview[entry.hisn.item] : undefined

const METHOD_LABELS: Record<Method, string> = {
  'quran-exact': 'Quran: identical to the Tanzil Uthmani text',
  exact: 'Exact: the full wording occurs in the cited narration',
  near: 'Approximate: 90% or more of the words occur in order, with differences',
  bracketed: 'Bracketed addition set aside, remaining wording matched',
  combined: 'Combination: each part matched in a different narration',
  'evening-wording': 'Matched through the evening form of a morning wording',
  'editor-reviewed': 'Approved by hand after a weak automatic match',
  unmatched: 'No narration matched once the excluded reference was set aside',
}

const INSTRUCTION_OPENERS = ['يقرا', 'يبدا', 'يقول', 'يجمع', 'يكبر', 'يستعيذ', 'يفعل', 'ينفث', 'ويقوم']
const DAIF_HINTS = ['ضعيف', 'ضعفه', 'ضعف']

// Notes from the engineer's own read of the flagged entries. They are observations
// about what the sources say, not rulings: the reviewer is not a hadith scholar.
const REVIEWER_NOTES: Record<string, string> = {
  'h-206': 'The unmatched words are the written-out repetitions of الحمد لله and الله أكبر, which Abu Dawud 2602 states as "three times", and the word اللهم, which that narration does not have (it reads سبحانك إني ظلمت نفسي). The book\'s footnote cites Abu Dawud and at-Tirmidhi, which agrees with the source shown.',
  'h-20': 'The first part is word for word in Abu Dawud 466 and the last part in Muslim 713. The linking words between them (بسم الله، والصلاة والسلام على رسول الله) are shown as source notes and were not matched to any collection. No footnote was found to compare against.',
  'h-77': 'Muslim 2723 gives the evening wording and states that the same was said in the morning beginning أصبحنا. The 8 unmatched words are exactly the morning substitutions. Low concern, but the morning form is derived, not quoted.',
  'h-10': 'The footnote confirms the split: the wording is in al-Bukhari and Muslim, and the addition بسم الله is from Sa\'id ibn Mansur, cited through Fath al-Bari. That addition is outside the six books and carries no grading in the dataset.',
  'h-32': 'About 41% of the displayed words are inside brackets. The footnote cites several places in al-Bukhari, so the bracketed phrases are probably variants from other Bukhari narrations, but none of them was matched. In its present form most of this entry is unverified.',
  'h-36': 'The bracketed phrase وما استقلت به قدمي is not in Muslim 771. The footnote cites Muslim and three of the Sunan.',
  'h-165': 'The footnote says the wording is Ibn Majah\'s and the bracketed phrase is from Aisha\'s narration in Muslim. The source transcription spells أَسْاَلُ with a plain alef where أَسْأَلُ is meant. This typing error comes from hisnmuslim.com and is displayed unchanged.',
  'h-87': 'The reference shown is wrong. Bukhari 93 is a different narration in which Umar says رضينا بالله ربا, on another occasion. The footnote cites Ahmad, an-Nasa\'i (Amal al-Yawm wal-Layla), Ibn as-Sunni, Abu Dawud and at-Tirmidhi. The matcher accepted Bukhari 93 because 10 of 11 words occur in order.',
  'h-166': 'Abu Dawud 2160 was shown as a reference and is wrong: it is the supplication for marriage or buying a servant, which shares the phrase. Once it was excluded the matcher offered Ibn Majah 2252, and Ibn Majah 1918 also carries the wording. Both were read and are that same supplication, so all three are excluded. Muslim 899 and at-Tirmidhi 3449 are about wind, but there the words occur in order and not side by side. The footnote cites Abu Dawud 4/326, a different Abu Dawud narration, and Ibn Majah.',
}

type Audit = {
  entry: Entry
  method: Method
  placements: string[]
  footnote?: Footnoted
  footnoteSimilarity?: number
  sourceText: string
  concerns: string[]
  action: string
  differences: string[]
  referenceCheck: string
  footnoteDuplicates: number
}

function gradersFor(entry: HadithEntry): string[] {
  const lines: string[] = []
  for (const source of entry.sources) {
    if (source.collection === 'bukhari' || source.collection === 'muslim') continue
    const hadiths = loadBook(source.collection).filter((h) => h.number === source.number)
    const grades = new Map<string, string>()
    for (const h of hadiths) for (const g of h.grades) grades.set(g.name, g.grade)
    lines.push(`${COLLECTION_NAMES[source.collection]} ${source.number}: ${[...grades].map(([n, g]) => `${n} = ${g}`).join('; ') || 'no grading recorded'}`)
  }
  return lines
}

function auditEntry(entry: Entry): Audit {
  const method = methodOf(entry)
  const concerns: string[] = []
  const differences: string[] = []
  const placements = collections.filter((c) => c.items.some((i) => i.entryId === entry.id)).map((c) => `${c.title} (×${must(c.items.find((i) => i.entryId === entry.id), 'item').repeat})`)

  const hisnIds = entry.kind === 'hadith'
    ? [entry.hisn.item]
    : collections.flatMap((c) => c.items.filter((i) => i.entryId === entry.id && i.hisn).map((i) => must(i.hisn, 'hisn').item))
  const raw = hisnIds.map((id) => rawItems.get(id)).find((item) => item !== undefined)
  const footnoteMatch = raw ? footnoteFor(raw.ARABIC_TEXT) : undefined
  const footnote = footnoteMatch?.item

  let sourceText: string
  if (entry.kind === 'quran') {
    const ayahs = entry.segments.filter((segment) => segment.type === 'quran')
    const first = must(ayahs[0], 'segment')
    const last = must(ayahs.at(-1), 'segment')
    sourceText = `Quran ${first.surah}:${first.ayah}${last.ayah !== first.ayah || last.surah !== first.surah ? `–${last.surah === first.surah ? '' : `${last.surah}:`}${last.ayah}` : ''}${ayahs.some((segment) => segment.isPartial) ? ' (excerpt)' : ''}`
    if (raw) {
      concerns.push(footnote
        ? `Reciting this passage at this occasion rests on the narration the book cites (${footnote.Reference}). That narration was not checked.`
        : 'Reciting this passage at this occasion comes from Hisn al-Muslim. The narration behind it was not located or checked.')
    }
  } else {
    sourceText = entry.sources.map((s) => `${COLLECTION_NAMES[s.collection]} ${s.number}${s.grading ? ` (${s.grading.label}${s.grading.by ? `، ${s.grading.by}` : ''})` : ''}`).join(' · ')
    const words = skeletonWords(recitedText(entry))

    // Words of the published text that the cited narration does not contain, in order.
    for (const source of entry.sources) {
      const candidates = loadBook(source.collection).filter((h) => h.number === source.number)
      let best: { matched: boolean[]; length: number } | undefined
      for (const candidate of candidates) {
        const alignment = alignWords(words, candidate.words)
        if (!best || alignment.length > best.length) best = alignment
      }
      if (!best) { concerns.push(`${COLLECTION_NAMES[source.collection]} ${source.number} could not be re-read from the dataset.`); continue }
      const missing = words.filter((_, index) => best.matched[index] !== true)
      if (missing.length > 0) {
        differences.push(`${COLLECTION_NAMES[source.collection]} ${source.number}: ${missing.length} of ${words.length} words not found in order: ${missing.join(' ، ')}`)
      }
    }

    for (const source of entry.sources) {
      const carrying = narrationsCarrying(method === 'bracketed' ? skeletonWords(recitedText(entry).replace(BRACKETED, ' ')) : words, source.collection)
      if (carrying.length > 1) {
        concerns.push(`Ambiguous number: ${carrying.length} narrations in ${COLLECTION_NAMES[source.collection]} carry this wording (${carrying.slice(0, 8).join('، ')}${carrying.length > 8 ? '…' : ''}). The number shown, ${source.number}, was picked by closest wording and may belong to a different occasion.`)
      }
    }
    const bracketedWords = skeletonWords((recitedText(entry).match(BRACKETED) ?? []).join(' ')).length
    if (bracketedWords / Math.max(1, words.length) > LARGE_BRACKET_SHARE) {
      concerns.push(`${Math.round((bracketedWords / words.length) * 100)}% of the displayed words sit inside brackets and were not matched to any source.`)
    }
    if (footnoteMatch && footnote) {
      const theirs = skeletonWords(footnote.Text)
      const alignment = alignWords(words, theirs)
      const absent = words.filter((_, index) => alignment.matched[index] !== true)
      if (absent.length > 0 && footnoteMatch.similarity >= 0.8) {
        concerns.push(`The two transcriptions of the book differ in ${absent.length} word(s): ${absent.slice(0, 12).join(' ، ')}. One of them may contain a typing error.`)
      }
    }

    if (footnote) {
      const cited = citedIn(footnote.Reference)
      const ours = entry.sources.map((s) => s.collection)
      if (!ours.some((id) => cited.ids.has(id))) {
        concerns.push(`None of the collections shown (${ours.map((id) => COLLECTION_NAMES[id]).join('، ')}) is named in the book's own footnote, which cites: ${cited.names.join('، ') || 'no recognised collection'}. The wording was found there, but it may be a different narration from the one the author used.`)
      }
      if (DAIF_HINTS.some((hint) => skeleton(footnote.Reference).includes(skeleton(hint)))) {
        concerns.push('The book\'s footnote mentions weakness for this item. Read the footnote.')
      }
      const placedRepeats = new Set(collections.flatMap((c) => c.items.filter((i) => i.entryId === entry.id).map((i) => i.repeat)))
      if (!placedRepeats.has(footnote.Count)) {
        concerns.push(`Repetition count differs between transcriptions: published ×${[...placedRepeats].join('/')}, second transcription ×${footnote.Count}.`)
      }
    } else {
      concerns.push('No matching item was found in the footnoted transcription, so the author\'s cited source could not be compared.')
    }

    const graderLines = gradersFor(entry)
    if (graderLines.some((line) => /Daif|Munkar|Shadh|Mursal/.test(line))) {
      concerns.push(`Scholars recorded in the dataset disagree on the grading: ${graderLines.join(' | ')}`)
    }
    const shown = entry.sources[0]?.grading
    if (shown?.by !== undefined && shown.by !== 'الألباني') concerns.push(`The grading shown is by ${shown.by}, because no grading by al-Albani is recorded for this narration.`)
    if (words.length < 4) concerns.push('Very short text: the narration was pinned with a topic keyword chosen by the editor.')
    const first = skeletonWords(must(entry.segments.find((s) => s.type === 'text'), 'text').text)[0] ?? ''
    if (INSTRUCTION_OPENERS.includes(first)) concerns.push('The text opens like an instruction or a narrator\'s description, not like recited words. Check how it is presented.')
    if (/قال رسول|قال النبي|من قال|قال صلي/.test(skeleton(recitedText(entry)))) concerns.push('The text is a full prophetic statement about a dhikr, not only the words to recite.')
  }

  if (method === 'near') concerns.unshift('Approximate match: the published wording is Hisn al-Muslim\'s, and it differs in places from the cited narration (see differences).')
  if (method === 'bracketed') concerns.unshift('The bracketed words are an addition from another narration and were not matched to any source.')
  if (method === 'combined') concerns.unshift('The text joins two narrations. Each part was matched separately, the bracketed linking words were not.')
  if (method === 'evening-wording') concerns.unshift('The morning wording was matched only after swapping its morning words for the evening ones.')
  if (method === 'editor-reviewed') concerns.unshift('The automatic match was below the threshold. An editor (not a scholar) accepted it by hand.')

  let action = 'Keep. Include in the scholar\'s read-through.'
  const serious = concerns.some((c) => /None of the collections|disagree|weakness|instruction|could not be re-read|Ambiguous number|inside brackets/.test(c))
  if (method === 'quran-exact') action = raw ? 'Keep the text. Scholar to confirm the occasion and count from the cited narration.' : 'Keep. No action needed for the text.'
  else if (method === 'editor-reviewed' || method === 'combined' || method === 'evening-wording') action = 'Hold for scholar review before release, or hide until reviewed.'
  else if (serious) action = 'Scholar review required before release: see concerns.'
  else if (method === 'near' || method === 'bracketed') action = 'Scholar to confirm the wording differences are acceptable. Consider showing the narration\'s own wording instead.'

  const hold = holdFor(entry)
  if (hold) action = `Held from production. Decision of the ${hold.decidedBy} on ${hold.decidedOn}: ${hold.decision}. ${hold.reason}`

  let referenceCheck = 'Not applicable: Quran reference by surah and ayah, checked against the Tanzil text.'
  if (entry.kind === 'hadith') {
    if (entry.sources.length === 0) referenceCheck = 'No reference established.'
    else if (!footnote) referenceCheck = 'Not comparable: no footnote found for this item.'
    else if (concerns.some((c) => c.startsWith('None of the collections'))) referenceCheck = 'Differs: the collection shown is not named in the author\'s footnote.'
    else if (concerns.some((c) => c.startsWith('Ambiguous number'))) referenceCheck = 'Collection agrees with the author\'s footnote. The hadith number is ambiguous and unconfirmed.'
    else referenceCheck = 'Collection agrees with the author\'s footnote. The hadith number is the only narration in that collection carrying the wording.'
  }
  const footnoteDuplicates = raw ? footnoted.filter((candidate) => {
    const words = skeletonWords(raw.ARABIC_TEXT)
    return alignWords(words, candidate.words).length / Math.max(words.length, candidate.words.length) >= 0.6
  }).length : 0

  return { entry, method, placements, referenceCheck, footnoteDuplicates, footnote, footnoteSimilarity: footnoteMatch?.similarity, sourceText, concerns, action, differences }
}

const published = entries.filter(isPublished)
const audits = published.map(auditEntry)
const heldAudits = entries.filter((entry) => holdFor(entry) !== undefined).map(auditEntry)

// ---------------------------------------------------------------- Audit report

const METHOD_ORDER: Method[] = ['editor-reviewed', 'combined', 'evening-wording', 'bracketed', 'near', 'exact', 'quran-exact', 'unmatched']
const lines: string[] = []
const count = (predicate: (a: Audit) => boolean): number => audits.filter(predicate).length

lines.push('# Islamic content audit', '')
lines.push(`Generated by \`npm run content:audit\` on ${new Date().toISOString().slice(0, 10)} from \`content/dataset\`. Do not edit by hand.`, '')
lines.push('## What "verified" means here', '')
lines.push('Every check in this report is mechanical. A script compared letters between sources. No scholar has reviewed any entry. The status column therefore reads "mechanically verified", never "verified by a scholar", and every entry is still owed a read-through by a person qualified in hadith.', '')
lines.push('The mechanical checks establish that the wording exists in the cited collection under the cited number, and which grading a named scholar gave that narration in the dataset. They do not establish that the narration is the one the author of Hisn al-Muslim relied on, that the occasion attached to it is right, or that the grading in the third-party dataset was transcribed correctly.', '')
lines.push('Each entry is described on four separate lines, which must not be read as one verdict:', '')
lines.push('- Text match: exact or approximate, a comparison of letters by a script.')
lines.push('- Reference check: whether the collection shown agrees with the author\'s own footnote, and whether the hadith number is the only candidate.')
lines.push('- Scholarly review: none for every entry at this time.')
lines.push('- Publication status: published, or held from production by decision.', '')
lines.push('## Summary', '')
lines.push('| Matching method | Entries |', '|---|---|')
for (const method of METHOD_ORDER) lines.push(`| ${METHOD_LABELS[method]} | ${count((a) => a.method === method)} |`)
lines.push(`| Total published | ${audits.length} |`)
lines.push(`| Held from production by decision | ${heldAudits.length} |`, '')
lines.push('| Automatic cross-check | Entries flagged |', '|---|---|')
lines.push(`| Shown collection is not named in the book's own footnote | ${count((a) => a.concerns.some((c) => c.startsWith('None of the collections')))} |`)
lines.push(`| Scholars in the dataset disagree on the grading | ${count((a) => a.concerns.some((c) => c.startsWith('Scholars recorded')))} |`)
lines.push(`| Grading shown is not al-Albani's | ${count((a) => a.concerns.some((c) => c.startsWith('The grading shown')))} |`)
lines.push(`| Ambiguous number: several narrations in the collection carry the wording | ${count((a) => a.concerns.some((c) => c.startsWith('Ambiguous number')))} |`)
lines.push(`| More than 20% of the text is bracketed and unmatched | ${count((a) => a.concerns.some((c) => c.includes('inside brackets')))} |`)
lines.push(`| The two transcriptions of the book differ in wording | ${count((a) => a.concerns.some((c) => c.startsWith('The two transcriptions')))} |`)
lines.push(`| Repetition count differs between the two transcriptions | ${count((a) => a.concerns.some((c) => c.startsWith('Repetition count')))} |`)
lines.push(`| Text opens like an instruction | ${count((a) => a.concerns.some((c) => c.startsWith('The text opens')))} |`)
lines.push(`| Text is a full statement, not only recited words | ${count((a) => a.concerns.some((c) => c.startsWith('The text is a full')))} |`)
lines.push(`| No footnote found to compare | ${count((a) => a.concerns.some((c) => c.startsWith('No matching item')))} |`)
lines.push(`| Quran passages whose occasion rests on an unchecked narration | ${count((a) => a.method === 'quran-exact' && a.concerns.length > 0)} |`, '')

lines.push('## Findings from the review', '')
lines.push('The engineer read every entry in the first five groups below and every entry flagged by a cross-check. The main findings:', '')
lines.push('1. Two references are wrong. `h-87` cites Sahih al-Bukhari 93, which is a different narration. `h-166` lists Abu Dawud 2160, which is a supplication for a different occasion. Both passed because the matcher compares wording only.')
lines.push('2. The matcher accepts words that occur in order but not side by side, and it does not know the occasion of a narration. Short or common phrases can therefore match a narration about something else. The "ambiguous number" check counts how many entries are exposed to this.')
lines.push('3. Where a collection holds several narrations with the wording, the number shown was picked by closest wording. It may not be the narration the author cites. The author\'s footnotes give volume and page of printed editions, so they cannot confirm a hadith number.')
lines.push('4. `h-32` is published although about 41% of its words are bracketed additions that were never matched.')
lines.push('5. Texts are displayed exactly as transcribed by hisnmuslim.com, including typing errors such as أَسْاَلُ in `h-165`. The check against the second transcription lists where the two differ.')
lines.push('6. Gradings are taken from one third-party dataset. For entries where the scholars recorded there disagree, the app shows only the first one in a fixed order (al-Albani, then al-Arna\'ut, then Zubair Ali Za\'i) and does not show the disagreement.')
lines.push('7. Several entries are complete prophetic statements about a dhikr ("whoever says ... will have ..."), shown in a card with a repetition counter as if the whole statement were recited.')
lines.push('8. The footnote comparison aligns items by text. Where the same dhikr appears in several chapters of the book, the footnote of another chapter may have been picked, so a "not named in the footnote" flag can itself be wrong.', '')
lines.push('Findings 1 and 4 have since been acted on by decision: see "Decisions recorded". The remaining recommended actions are proposals.', '')
lines.push('| Recommended action | Entries |', '|---|---|')
for (const [action, total] of [...audits.reduce((map, a) => map.set(a.action, (map.get(a.action) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])) {
  lines.push(`| ${action} | ${total} |`)
}
lines.push('')

const TEXT_MATCH: Record<Method, string> = {
  'quran-exact': 'Exact (identical to the reference Quran text)',
  exact: 'Exact textual match',
  near: 'Approximate textual match',
  bracketed: 'Approximate textual match (exact once the bracketed additions are set aside)',
  combined: 'Approximate textual match (each part exact in a different narration)',
  'evening-wording': 'Approximate textual match (through the evening form)',
  'editor-reviewed': 'Approximate textual match, below the automatic threshold, accepted by hand',
  unmatched: 'No textual match',
}

function writeEntry(target: string[], audit: Audit): void {
  const { entry } = audit
  const hold = holdFor(entry)
  target.push(`### ${entry.id}`, '')
  target.push(`- Arabic text: ${displayText(entry)}`)
  target.push(`- Source: ${audit.sourceText || 'none'}`)
  if (entry.kind === 'hadith') target.push(`- Hisn al-Muslim: chapter ${entry.hisn.chapter}, item ${entry.hisn.item}`)
  if (audit.footnote) target.push(`- Book's own footnote: ${audit.footnote.Reference}`)
  target.push(`- Appears in: ${audit.placements.join('، ') || 'tasbih presets only'}`)
  target.push(`- Matching method: ${METHOD_LABELS[audit.method]}`)
  if (audit.differences.length > 0) target.push(`- Differences from the narration: ${audit.differences.join(' | ')}`)
  target.push(`- Text match: ${TEXT_MATCH[audit.method]}`)
  target.push(`- Reference check: ${audit.referenceCheck}`)
  target.push('- Scholarly review: none. No qualified scholar has reviewed this entry.')
  target.push(`- Publication status: ${hold ? 'held from production by decision' : 'published'}`)
  target.push(`- Outstanding concerns: ${audit.concerns.length > 0 ? audit.concerns.join(' ') : 'none found by the automatic checks'}`)
  const reviewerNote = REVIEWER_NOTES[entry.id]
  if (reviewerNote !== undefined) target.push(`- Engineer's review note: ${reviewerNote}`)
  if (entry.kind === 'hadith') {
    for (const excludedRef of hisnExcludedReferences[entry.hisn.item] ?? []) {
      target.push(`- Reference excluded from consideration: ${COLLECTION_NAMES[excludedRef.collection]} ${excludedRef.number}. ${excludedRef.reason}`)
    }
  }
  target.push(`- Recommended action: ${audit.action}`, '')
}

lines.push('## Decisions recorded', '')
lines.push('These decisions were taken by the project owner after reading the first version of this audit. They are stored in `content-sources/curation.ts` (`hisnHeldForReview`, `hisnExcludedReferences`). The records and their Arabic wording remain in `content/dataset` unchanged. A held entry returns to production only by another explicit decision.', '')
lines.push('| Entry | Decision | Date | Reason |', '|---|---|---|---|')
for (const audit of heldAudits) {
  const hold = must(holdFor(audit.entry), 'hold')
  lines.push(`| ${audit.entry.id} | ${hold.decision} | ${hold.decidedOn} | ${hold.reason} |`)
}
lines.push('')
lines.push('Also decided: the proposed global rule (publish only when the collection shown is named in the author\'s footnote) is not applied. The affected entries are listed in `footnote-review-list.md` for individual review, and no entry is published or hidden as a result of that list without approval.', '')
lines.push('## Held from production by decision', '')
for (const audit of heldAudits) writeEntry(lines, audit)

for (const method of METHOD_ORDER) {
  const group = audits.filter((a) => a.method === method)
  if (group.length === 0) continue
  lines.push(`## Published · ${METHOD_LABELS[method]} (${group.length})`, '')
  for (const audit of group) writeEntry(lines, audit)
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'content-audit.md'), lines.join('\n'))

// ---------------------------------------------------------------- Footnote review list

const flaggedForFootnote = [...audits, ...heldAudits].filter((a) => a.concerns.some((c) => c.startsWith('None of the collections')))
const review: string[] = []
review.push('# Review list: collection shown is not named in the author\'s footnote', '')
review.push(`Generated by \`npm run content:audit\` on ${new Date().toISOString().slice(0, 10)}.`, '')
review.push(`${flaggedForFootnote.length} entries. For each of them the wording was found in one of the six books, but the collection shown in the app is not among those the author of Hisn al-Muslim cites in his footnote for that item.`, '')
review.push('This is a list for individual review. No global rule is applied: a supplication can legitimately be narrated in several collections, and the author often cites only one or two. Nothing is published or hidden because of this list without approval.', '')
review.push('Two things can make a flag wrong. The footnote was paired with the item by comparing text, so where the same dhikr occurs in several chapters of the book the footnote of another chapter may have been picked. And the author\'s footnotes cite volume and page of printed editions, which cannot be compared with hadith numbers.', '')
review.push('| Entry | Shown in the app | Author cites | Same dhikr elsewhere in the book | Status |', '|---|---|---|---|---|')
for (const audit of flaggedForFootnote) {
  const cited = audit.footnote ? citedIn(audit.footnote.Reference).names.join('، ') : ''
  review.push(`| ${audit.entry.id} | ${audit.sourceText || 'none'} | ${cited || 'no recognised collection'} | ${audit.footnoteDuplicates > 1 ? `yes, ${audit.footnoteDuplicates} similar items` : 'no'} | ${holdFor(audit.entry) ? 'held' : 'published'} |`)
}
review.push('')
for (const audit of flaggedForFootnote) {
  const { entry } = audit
  review.push(`## ${entry.id}`, '')
  review.push(`- Arabic text: ${displayText(entry)}`)
  review.push(`- Appears in: ${audit.placements.join('، ')}`)
  review.push(`- Shown in the app: ${audit.sourceText || 'none'}`)
  review.push(`- Every narration the matcher found: ${(entry.verification.note ?? 'not recorded').split(' | ').at(-1) ?? ''}`)
  review.push(`- Author's footnote: ${audit.footnote?.Reference ?? 'none'}`)
  review.push(`- Text of the footnoted item it was paired with: ${audit.footnote?.Text ?? 'none'}`)
  review.push(`- Pairing confidence: ${audit.footnoteSimilarity !== undefined ? `${Math.round(audit.footnoteSimilarity * 100)}% of the words agree` : 'not paired'}${audit.footnoteDuplicates > 1 ? `. ${audit.footnoteDuplicates} items in the book carry similar wording, so this footnote may belong to another chapter` : ''}`)
  review.push(`- Text match: ${TEXT_MATCH[audit.method]}`)
  if (audit.differences.length > 0) review.push(`- Differences from the narration: ${audit.differences.join(' | ')}`)
  review.push(`- Other concerns: ${audit.concerns.filter((c) => !c.startsWith('None of the collections')).join(' ') || 'none'}`)
  const reviewerNote = REVIEWER_NOTES[entry.id]
  if (reviewerNote !== undefined) review.push(`- Engineer's review note: ${reviewerNote}`)
  review.push('- Question for the reviewer: is the narration shown the same hadith the author cites (reported in more than one collection), or a different narration that only shares the wording?')
  review.push('- Reviewer\'s decision: pending', '')
}
writeFileSync(join(OUT, 'footnote-review-list.md'), review.join('\n'))

// ---------------------------------------------------------------- Provenance report

const provenance: string[] = []
const rightsOf = (id: keyof typeof SOURCE_REGISTRY | undefined): string => (id === undefined ? 'none' : `${id} (${SOURCE_REGISTRY[id].redistribution})`)
provenance.push('# Content provenance', '')
provenance.push(`Generated by \`npm run content:audit\` on ${new Date().toISOString().slice(0, 10)}. This report quotes no source text.`, '')
provenance.push('Every entry in the dataset records where its wording and its references come from (`provenance` in `src/content/schema.ts`). Redistribution rights are held once per source in `content-sources/sources.ts`. The public build (`npm run build:public`) keeps only what that registry marks `cleared`.', '')
provenance.push('## Sources', '', '| Id | Work | Rights holder | Terms | Redistribution | Commercial use | Modification | Evidence | Pending |', '|---|---|---|---|---|---|---|---|---|')
for (const source of Object.values(SOURCE_REGISTRY)) {
  provenance.push(`| ${source.id} | ${source.title} | ${source.rightsHolder} | ${source.terms} | ${source.redistribution} | ${source.commercialUse} | ${source.modification} | ${source.evidence} | ${source.pendingAction ?? ''} |`)
}
const inPublicBuild = (audit: Audit): boolean =>
  SOURCE_REGISTRY[audit.entry.provenance.text].redistribution === 'cleared'
  && (audit.entry.provenance.reference === undefined || SOURCE_REGISTRY[audit.entry.provenance.reference].redistribution === 'cleared')
  && collections.some((c) => c.items.some((item) => item.entryId === audit.entry.id && item.hisn === undefined))
provenance.push('', '## Published entries', '')
provenance.push(`${audits.length} entries are published in the private build. ${audits.filter(inPublicBuild).length} of them qualify for the public build today.`, '')
provenance.push('| Entry | Wording from | Reference | Reference data from | Verification method | Scholarly review | In the public build |', '|---|---|---|---|---|---|---|')
for (const audit of audits) {
  const { entry } = audit
  const review = entry.provenance.scholarlyReview
  provenance.push(`| ${entry.id} | ${rightsOf(entry.provenance.text)} | ${audit.sourceText.replaceAll('|', '/')} | ${rightsOf(entry.provenance.reference)} | ${TEXT_MATCH[audit.method]} | ${review.status === 'reviewed' ? `reviewed by ${review.by} on ${review.on}` : 'not reviewed'} | ${inPublicBuild(audit) ? 'yes' : 'no'} |`)
}
writeFileSync(join(OUT, 'provenance.md'), provenance.join('\n'))

// ---------------------------------------------------------------- Coverage report for hidden entries

const hidden = entries.filter((entry) => !isPublished(entry))
const coverage: string[] = []
const tally = new Map<string, number>()
const rows: string[] = []
let foundInExtra = 0

for (const entry of hidden) {
  if (entry.kind !== 'hadith') continue
  const raw = rawItems.get(entry.hisn.item)
  const footnote = raw ? footnoteFor(raw.ARABIC_TEXT)?.item : undefined
  const cited = footnote ? citedIn(footnote.Reference) : { names: [], ids: new Set<HadithCollectionId>() }
  for (const name of cited.names) tally.set(name, (tally.get(name) ?? 0) + 1)

  const words = skeletonWords(recitedText(entry))
  const needle = ` ${words.join(' ')} `
  const extraHits: string[] = []
  const distinctWords = [...new Set(words)]
  if (words.length >= 4) {
    for (const book of extraIndex) {
      let best: { number: number; ratio: number } | undefined
      for (const hadith of book.hadiths) {
        const isExact = hadith.joined.includes(needle)
        if (!isExact && distinctWords.filter((w) => hadith.wordSet.has(w)).length / distinctWords.length < 0.75) continue
        const ratio = isExact ? 1 : alignWords(words, hadith.words).length / words.length
        if (ratio >= 0.9 && (!best || ratio > best.ratio)) best = { number: hadith.number, ratio }
      }
      if (best) extraHits.push(`${book.label} ${best.number} (${best.ratio === 1 ? 'exact' : best.ratio.toFixed(2)})`)
    }
  }
  if (extraHits.length > 0) foundInExtra++

  const reason = entry.verification.status === 'verified'
    ? 'Wording found, but graded weak or not graded sahih or hasan'
    : (entry.verification.note ?? '').split(' | ')[0] ?? ''
  rows.push(`### ${entry.id}`, '')
  rows.push(`- Arabic text: ${displayText(entry)}`)
  rows.push(`- Hisn al-Muslim: chapter ${entry.hisn.chapter} (${raw?.chapterTitle ?? ''}), item ${entry.hisn.item}`)
  rows.push(`- Why it is hidden: ${reason}`)
  rows.push(`- Book's own footnote: ${footnote?.Reference ?? 'not found in the footnoted transcription'}`)
  rows.push(`- Collections the footnote names: ${cited.names.join('، ') || 'none recognised'}`)
  rows.push(`- Found in the extra datasets: ${extraHits.join(' · ') || 'no'}`, '')
}

coverage.push('# Source coverage for hidden entries', '')
coverage.push(`Generated by \`npm run content:audit\` on ${new Date().toISOString().slice(0, 10)}. Nothing in this report has been published.`, '')
coverage.push(`${hidden.length} entries are hidden from production. For each one this report gives the source the author of Hisn al-Muslim cites in his own footnote, and whether the wording could be located in the additional datasets that were investigated.`, '')
coverage.push('## Collections cited by the footnotes of hidden entries', '', '| Collection | Hidden entries citing it |', '|---|---|')
for (const [name, total] of [...tally].sort((a, b) => b[1] - a[1])) coverage.push(`| ${name} | ${total} |`)
coverage.push('', `Wording located in at least one extra dataset: ${foundInExtra} of ${hidden.length}.`, '')
coverage.push('## Entries', '', ...rows)
writeFileSync(join(OUT, 'source-coverage.md'), coverage.join('\n'))

console.log(`audit: ${audits.length} published entries, ${hidden.length} hidden, ${heldAudits.length} held by decision, ${flaggedForFootnote.length} on the footnote review list`)
for (const method of METHOD_ORDER) console.log(`  ${method}: ${count((a) => a.method === method)}`)
console.log(`  footnote does not name shown collection: ${count((a) => a.concerns.some((c) => c.startsWith('None of the collections')))}`)
console.log(`  graders disagree: ${count((a) => a.concerns.some((c) => c.startsWith('Scholars recorded')))}`)
console.log(`  ambiguous number: ${count((a) => a.concerns.some((c) => c.startsWith('Ambiguous number')))}`)
console.log(`  transcriptions differ: ${count((a) => a.concerns.some((c) => c.startsWith('The two transcriptions')))}`)
console.log(`  clean (no concern at all): ${count((a) => a.concerns.length === 0)}`)
console.log(`  action keep: ${count((a) => a.action.startsWith('Keep'))}`)
console.log(`  repeat differs: ${count((a) => a.concerns.some((c) => c.startsWith('Repetition count')))}`)
console.log(`  instruction-like: ${count((a) => a.concerns.some((c) => c.startsWith('The text opens')))}`)
console.log(`  no footnote: ${count((a) => a.concerns.some((c) => c.startsWith('No matching item')))}`)
console.log(`  hidden found in extra datasets: ${foundInExtra}`)
console.log([...tally].sort((a, b) => b[1] - a[1]).map(([n, t]) => `${n}:${t}`).join(' '))
