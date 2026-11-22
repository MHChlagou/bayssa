import { formatNumber, t } from '../i18n/t.ts'
import { surahName } from './index.ts'
import type { Entry, HadithSource, QuranSegment } from './schema.ts'

const MAX_SOURCES_SHOWN = 2

export function hadithSourceLabel(source: HadithSource): string {
  return `${t.collections[source.collection]} (${formatNumber(Number(source.number))})`
}

function quranReference(segments: readonly QuranSegment[]): string {
  const bySurah = new Map<number, number[]>()
  for (const segment of segments) {
    bySurah.set(segment.surah, [...(bySurah.get(segment.surah) ?? []), segment.ayah])
  }
  return [...bySurah.entries()]
    .map(([surah, ayahs]) => {
      const first = Math.min(...ayahs)
      const last = Math.max(...ayahs)
      const range = first === last
        ? `${t.reader.ofAyah} ${formatNumber(first)}`
        : `${t.reader.ofAyahs} ${formatNumber(first)}–${formatNumber(last)}`
      return `${t.reader.surah} ${surahName(surah)} · ${range}`
    })
    .join(' ، ')
}

/** One line naming where the text comes from. */
export function sourceLine(entry: Entry): string {
  if (entry.kind === 'quran') return quranReference(entry.segments)
  return entry.sources.slice(0, MAX_SOURCES_SHOWN).map(hadithSourceLabel).join(' · ')
}

/** Grade of the strongest listed source, with the scholar who gave it when known. */
export function gradeLabel(entry: Entry): string | undefined {
  if (entry.kind !== 'hadith') return undefined
  const grading = entry.sources[0]?.grading
  if (!grading) return undefined
  return grading.by === undefined ? grading.label : `${grading.label} · ${grading.by}`
}

/** True when the wording differs in places from the narration it is tied to. */
export function isApproximateMatch(entry: Entry): boolean {
  const method = entry.verification.method
  return entry.kind === 'hadith' && method !== undefined && method !== 'exact'
}

/** The recited text as plain characters, for copying and sharing. Never used for display. */
export function plainText(entry: Entry): string {
  const recited = entry.segments
    .filter((segment) => segment.type !== 'note')
    .map((segment) => (segment.type === 'quran' ? `﴿${segment.text}﴾` : segment.text))
    .join('\n')
  return `${recited}\n\n${sourceLine(entry)}`
}

/** What the search index reads for an entry. The result is a search key, never shown. */
export function searchableText(entry: Entry): string {
  if (entry.kind === 'quran') return entry.searchText
  return entry.segments.filter((segment) => segment.type !== 'note').map((segment) => segment.text).join(' ')
}

/** First recited words, for list previews. */
export function previewText(entry: Entry): string {
  return entry.segments.find((segment) => segment.type !== 'note')?.text ?? ''
}
