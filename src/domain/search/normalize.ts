// Arabic text normalization for search. The result is only ever used as a
// search key: displayed text always comes from the original, untouched string.

const COMBINING_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g
const TATWEEL_AND_INVISIBLES = /[\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
const ALEF_FORMS = /[آأإٱٲٳٵ]/g
const NOT_LETTER_OR_DIGIT = /[^\p{L}\p{N}]+/gu
const ARABIC_INDIC_ZERO = 0x0660
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0

/**
 * Safe folds only: differences that never change which word is meant.
 * Removes vocalization, Quranic marks and tatweel, unifies the alef forms
 * (أ إ آ ٱ become ا), expands ligatures such as ﻻ, and unifies digits.
 */
export function normalizeArabic(text: string): string {
  return text
    .normalize('NFKC')
    .replace(COMBINING_MARKS, '')
    .replace(TATWEEL_AND_INVISIBLES, '')
    .replace(ALEF_FORMS, 'ا')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO))
    .replace(NOT_LETTER_OR_DIGIT, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Lossy folds for a second, lower-ranked matching pass. These letters are not
 * interchangeable in general, so the fold is limited to the positions where
 * people commonly type one for the other:
 * - ى and ي only at the end of a word (على / علي)
 * - ة and ه only at the end of a word (رحمة / رحمه)
 * - hamza carriers ؤ and ئ, and a bare ء, which are often typed without hamza
 * Expects text that already went through `normalizeArabic`.
 */
export function foldLoose(normalized: string): string {
  return normalized
    .replace(/ى(?= |$)/g, 'ي')
    .replace(/ة(?= |$)/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/ +/g, ' ')
    .trim()
}
