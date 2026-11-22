import { foldLoose, normalizeArabic } from './normalize.ts'

export type SearchDocument = { id: string; text: string }

export type SearchIndex = {
  readonly documents: readonly { id: string; strict: string; loose: string }[]
}

const STRICT_TOKEN_SCORE = 2
const LOOSE_TOKEN_SCORE = 1
const PHRASE_BONUS = 3

/** The index stores search keys only. Callers keep the original text for display. */
export function buildSearchIndex(documents: readonly SearchDocument[]): SearchIndex {
  return {
    documents: documents.map(({ id, text }) => {
      const strict = normalizeArabic(text)
      return { id, strict: ` ${strict} `, loose: ` ${foldLoose(strict)} ` }
    }),
  }
}

/**
 * Every query word must occur in a document. Exact-letter matches rank above
 * matches that needed the lossy fold, and a whole-phrase match ranks highest.
 */
export function search(index: SearchIndex, query: string, limit = 50): string[] {
  const strictQuery = normalizeArabic(query)
  if (strictQuery === '') return []
  const strictTokens = strictQuery.split(' ')
  const looseTokens = strictTokens.map((token) => foldLoose(token)).filter((token) => token !== '')
  if (looseTokens.length === 0) return []

  const scored: { id: string; score: number }[] = []
  for (const document of index.documents) {
    let score = 0
    let isMatch = true
    for (const [position, looseToken] of looseTokens.entries()) {
      const strictToken = strictTokens[position]
      if (strictToken !== undefined && document.strict.includes(strictToken)) score += STRICT_TOKEN_SCORE
      else if (document.loose.includes(looseToken)) score += LOOSE_TOKEN_SCORE
      else {
        isMatch = false
        break
      }
    }
    if (!isMatch) continue
    if (strictTokens.length > 1 && document.strict.includes(strictQuery)) score += PHRASE_BONUS
    scored.push({ id: document.id, score })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.id)
}
