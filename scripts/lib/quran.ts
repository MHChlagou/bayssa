import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { skeleton } from './skeleton.ts'

const SOURCES = join(import.meta.dirname, '..', '..', 'content-sources', 'quran')

export type AyahKey = `${number}:${number}`

function loadTanzil(file: string): Map<AyahKey, string> {
  const ayahs = new Map<AyahKey, string>()
  for (const line of readFileSync(join(SOURCES, file), 'utf8').split('\n')) {
    if (line.startsWith('#') || line.trim() === '') continue
    const [surah, ayah, ...rest] = line.split('|')
    ayahs.set(`${Number(surah)}:${Number(ayah)}`, rest.join('|').replace(/\r$/, ''))
  }
  if (ayahs.size !== 6236) throw new Error(`${file}: expected 6236 ayahs, found ${ayahs.size}`)
  return ayahs
}

export const loadUthmani = () => loadTanzil('tanzil-uthmani.txt')
export const loadSimpleClean = () => loadTanzil('tanzil-simple-clean.txt')
export const loadMuyassar = () => loadTanzil('tanzil-ar-muyassar.txt')

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
