// Aggressive letter-skeleton used only to compare wording between sources.
// It is deliberately lossy and must never be used for display or for user search.
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200C-\u200F]/g

export function skeleton(text: string): string {
  return text
    .replace(MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[^ء-ي]+/g, ' ')
    .trim()
}

export function skeletonWords(text: string): string[] {
  const s = skeleton(text)
  return s === '' ? [] : s.split(' ')
}

/** Length of the longest common subsequence of two word lists. */
export function lcsLength(a: string[], b: string[]): number {
  let previous: number[] = new Array<number>(b.length + 1).fill(0)
  for (const wordA of a) {
    const current: number[] = [0]
    b.forEach((wordB, j) => {
      const diagonal = previous[j] ?? 0
      const up = previous[j + 1] ?? 0
      const left = current[j] ?? 0
      current.push(wordA === wordB ? diagonal + 1 : Math.max(up, left))
    })
    previous = current
  }
  return previous[b.length] ?? 0
}
