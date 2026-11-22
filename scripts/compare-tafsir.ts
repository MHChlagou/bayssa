// Read-only comparison of the explanation text in use (the Tanzil copy of
// التفسير الميسر) with the QuranEnc.com copy, for the ayahs the dataset shows.
// Writes docs/open-source/quranenc-comparison.md. Changes no content.
//
// Both inputs are outside the repository: the Tanzil file and the QuranEnc
// download live under content-sources/ and are ignored by git.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Entry } from '../src/content/schema.ts'
import { must } from './lib/must.ts'
import { loadMuyassar } from './lib/quran.ts'

const ROOT = join(import.meta.dirname, '..')
const CACHE = join(ROOT, 'content-sources', 'cache', 'quranenc', 'arabic_moyassar.json')
const OUT = join(ROOT, 'docs', 'open-source', 'quranenc-comparison.md')
const REQUEST_GAP_MS = 150
const FETCH_TIMEOUT_MS = 30_000

const entries = JSON.parse(readFileSync(join(ROOT, 'content', 'dataset', 'entries.json'), 'utf8')) as Entry[]
const surahs = (JSON.parse(readFileSync(join(ROOT, 'content', 'dataset', 'meta.json'), 'utf8')) as { surahs: { number: number; name: string }[] }).surahs

const usedBy = new Map<string, string[]>()
for (const entry of entries) {
  if (entry.kind !== 'quran' || !entry.meaning) continue
  for (const segment of entry.segments) {
    const key = `${segment.surah}:${segment.ayah}`
    usedBy.set(key, [...(usedBy.get(key) ?? []), entry.id])
  }
}

async function loadQuranEnc(keys: string[]): Promise<Record<string, string>> {
  const cached: unknown = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
  const texts: Record<string, string> = {}
  if (typeof cached === 'object' && cached !== null) {
    for (const [key, value] of Object.entries(cached)) if (typeof value === 'string') texts[key] = value
  }
  for (const key of keys) {
    if (texts[key] !== undefined) continue
    const [surah, ayah] = key.split(':')
    const response = await fetch(`https://quranenc.com/api/v1/translation/aya/arabic_moyassar/${surah}/${ayah}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`QuranEnc answered ${response.status} for ${key}`)
    const body: unknown = await response.json()
    const result = typeof body === 'object' && body !== null && 'result' in body ? body.result : undefined
    const text = typeof result === 'object' && result !== null && 'translation' in result ? result.translation : undefined
    if (typeof text !== 'string' || text.trim() === '') throw new Error(`QuranEnc returned no text for ${key}`)
    texts[key] = text.trim()
    await new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS))
  }
  mkdirSync(join(CACHE, '..'), { recursive: true })
  writeFileSync(CACHE, JSON.stringify(texts, null, 1))
  return texts
}

/** Letters only: vocalization, tatweel and punctuation removed. Used to classify, never shown. */
const lettersOnly = (text: string): string =>
  text.normalize('NFC').replace(/[ً-ْٰـ]/g, '').replace(/[^ء-ي]+/g, ' ').trim()

/** Words of `a` that have no partner in `b`, by longest common subsequence, as groups of adjacent words. */
function unmatchedRuns(a: string[], b: string[]): string[] {
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
  const runs: string[] = []
  let current: string[] = []
  a.forEach((word, index) => {
    if (matched[index]) { if (current.length > 0) runs.push(current.join(' ')); current = [] }
    else current.push(word)
  })
  if (current.length > 0) runs.push(current.join(' '))
  return runs
}

const keys = [...usedBy.keys()].sort((x, y) => {
  const [xs = 0, xa = 0] = x.split(':').map(Number)
  const [ys = 0, ya = 0] = y.split(':').map(Number)
  return xs - ys || xa - ya
})
const current = loadMuyassar()
const quranEnc = await loadQuranEnc(keys)

type Row = { key: string; kind: 'identical' | 'marks-only' | 'wording'; mine: string; theirs: string; onlyMine: string[]; onlyTheirs: string[] }
const rows: Row[] = keys.map((key) => {
  const mine = must(current.get(key as `${number}:${number}`), `current text of ${key}`)
  const theirs = must(quranEnc[key], `QuranEnc text of ${key}`)
  const a = lettersOnly(mine).split(' ')
  const b = lettersOnly(theirs).split(' ')
  const kind = mine === theirs ? 'identical' : a.join(' ') === b.join(' ') ? 'marks-only' : 'wording'
  return { key, kind, mine, theirs, onlyMine: kind === 'wording' ? unmatchedRuns(a, b) : [], onlyTheirs: kind === 'wording' ? unmatchedRuns(b, a) : [] }
})

const label = (key: string): string => {
  const [surah = 0, ayah = 0] = key.split(':').map(Number)
  return `${must(surahs[surah - 1], `surah ${surah}`).name} ${surah}:${ayah}`
}
const KIND_LABEL: Record<Row['kind'], string> = {
  identical: 'Identical, character for character',
  'marks-only': 'Same words. Vocalization or punctuation differs',
  wording: 'Wording differs',
}
const count = (kind: Row['kind']): number => rows.filter((row) => row.kind === kind).length

const lines: string[] = []
lines.push('# التفسير الميسر: current copy compared with the QuranEnc.com copy', '')
lines.push(`Generated by \`node scripts/compare-tafsir.ts\` on ${new Date().toISOString().slice(0, 10)}. Read-only: no content was changed. This file quotes both copies in full for review and must stay out of any public repository.`, '')
lines.push(`The dataset shows an explanation for ${rows.length} ayahs, in ${new Set([...usedBy.values()].flat()).size} Quran entries. "Current" is the copy from the Tanzil Project (\`ar.muyassar\`). "QuranEnc" is the text served by \`quranenc.com/api/v1/translation/aya/arabic_moyassar\`.`, '')
lines.push('| Result | Ayahs |', '|---|---|')
for (const kind of ['identical', 'marks-only', 'wording'] as const) lines.push(`| ${KIND_LABEL[kind]} | ${count(kind)} |`)
lines.push(`| Total | ${rows.length} |`, '')
lines.push('"Wording differs" means the letters differ once vocalization and punctuation are set aside. The differing words are listed for each such ayah, in the order they occur. Words are compared as written, so a spelling variant counts as a difference.', '')

lines.push(`## The ${count('wording')} ayahs whose wording differs`, '')
lines.push('| Ayah | Only in the current copy | Only in the QuranEnc copy |', '|---|---|---|')
for (const row of rows.filter((r) => r.kind === 'wording')) {
  lines.push(`| ${label(row.key)} | ${row.onlyMine.join(' ، ') || 'nothing'} | ${row.onlyTheirs.join(' ، ') || 'nothing'} |`)
}
lines.push('')

lines.push('## All ayahs, side by side', '')
for (const row of rows) {
  lines.push(`### ${label(row.key)}`, '')
  lines.push(`- Result: ${KIND_LABEL[row.kind]}`)
  lines.push(`- Used by: ${must(usedBy.get(row.key), 'entries').join(', ')}`)
  if (row.kind === 'wording') {
    lines.push(`- Only in the current copy: ${row.onlyMine.join(' ، ') || 'nothing'}`)
    lines.push(`- Only in the QuranEnc copy: ${row.onlyTheirs.join(' ، ') || 'nothing'}`)
  }
  lines.push(`- Current: ${row.mine}`)
  lines.push(`- QuranEnc: ${row.theirs}`, '')
}

writeFileSync(OUT, lines.join('\n'))
console.log(`compared ${rows.length} ayahs: ${count('identical')} identical, ${count('marks-only')} marks only, ${count('wording')} wording`)
