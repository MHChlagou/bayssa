import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { skeleton } from './skeleton.ts'

const SOURCES = join(import.meta.dirname, '..', '..', 'content-sources', 'quran')

export type AyahKey = `${number}:${number}`

const AYAHS_IN_THE_QURAN = 6236

/**
 * Reads a Tanzil text file. The private repository keeps the complete file as
 * the reference. A public checkout carries only an extract with the ayahs the
 * dataset uses, in the same line format and with Tanzil's notice.
 */
function loadTanzil(name: string): Map<AyahKey, string> {
  const complete = join(SOURCES, `${name}.txt`)
  const extract = join(SOURCES, `${name}-extract.txt`)
  const isComplete = existsSync(complete)
  if (!isComplete && !existsSync(extract)) throw new Error(`neither ${name}.txt nor ${name}-extract.txt found in ${SOURCES}`)
  const ayahs = new Map<AyahKey, string>()
  for (const line of readFileSync(isComplete ? complete : extract, 'utf8').split('\n')) {
    if (line.startsWith('#') || line.trim() === '') continue
    const [surah, ayah, ...rest] = line.split('|')
    ayahs.set(`${Number(surah)}:${Number(ayah)}`, rest.join('|').replace(/\r$/, ''))
  }
  if (isComplete && ayahs.size !== AYAHS_IN_THE_QURAN) throw new Error(`${name}.txt: expected ${AYAHS_IN_THE_QURAN} ayahs, found ${ayahs.size}`)
  if (ayahs.size === 0) throw new Error(`${name}: no ayahs found`)
  return ayahs
}

export const loadUthmani = (): Map<AyahKey, string> => loadTanzil('tanzil-uthmani')
export const loadSimpleClean = (): Map<AyahKey, string> => loadTanzil('tanzil-simple-clean')
export const loadMuyassar = (): Map<AyahKey, string> => loadTanzil('tanzil-ar-muyassar')

/** Tanzil prefixes the basmala to ayah 1 of every surah except 1 and 9. */
export function stripLeadingBasmala(text: string, basmala: string, surah: number, ayah: number): string {
  if (ayah !== 1 || surah === 1 || surah === 9) return text
  return text.startsWith(basmala + ' ') ? text.slice(basmala.length + 1) : text
}

// Uthmani spelling often writes a dagger alef where plain spelling writes a
// full alef, so anchors are compared with every alef dropped.
const anchorKey = (word: string): string => skeleton(word).replace(/ا/g, '')

export type Excerpt = { from?: string; fromOccurrence?: number; to?: string }

/**
 * Cuts a contiguous run of words out of an ayah. Anchors are matched on the
 * letter skeleton, but the returned text is the untouched source substring.
 */
export function excerptAyah(ayahText: string, excerpt: Excerpt): string {
  const words = ayahText.split(' ')
  const skeletons = words.map(anchorKey)
  const from = excerpt.from === undefined ? undefined : anchorKey(excerpt.from)
  const to = excerpt.to === undefined ? undefined : anchorKey(excerpt.to)
  let start = 0
  if (from !== undefined) {
    let seen = 0
    start = skeletons.findIndex((s) => s === from && ++seen === (excerpt.fromOccurrence ?? 1))
    if (start === -1) throw new Error(`anchor "${excerpt.from}" not found in: ${ayahText}`)
  }
  let end = words.length
  if (to !== undefined) {
    const offset = skeletons.slice(start + 1).findIndex((s) => s === to)
    if (offset === -1) throw new Error(`end anchor "${excerpt.to}" not found in: ${ayahText}`)
    end = start + 1 + offset + 1
  }
  return words.slice(start, end).join(' ')
}

export function isContiguousWordRun(excerpt: string, ayahText: string): boolean {
  return ` ${ayahText} `.includes(` ${excerpt} `)
}
