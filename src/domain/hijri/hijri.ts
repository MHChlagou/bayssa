// Hijri date from the platform's Umm al-Qura calendar. It is a calculated
// calendar, so the user can shift it by a day or two to follow local sighting.

const MS_PER_DAY = 86_400_000
export const MAX_HIJRI_OFFSET_DAYS = 2

export type DateNumerals = 'arab' | 'latn'
export type HijriOptions = { offsetDays?: number; locale?: string; numerals?: DateNumerals }

export function clampHijriOffset(offsetDays: number): number {
  if (!Number.isFinite(offsetDays)) return 0
  return Math.min(MAX_HIJRI_OFFSET_DAYS, Math.max(-MAX_HIJRI_OFFSET_DAYS, Math.trunc(offsetDays)))
}

/** Returns null when the runtime has no Umm al-Qura calendar. */
export function formatHijriDate(date: Date, { offsetDays = 0, locale = 'ar', numerals = 'arab' }: HijriOptions = {}): string | null {
  const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura-nu-${numerals}`, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  if (formatter.resolvedOptions().calendar !== 'islamic-umalqura') return null
  const shifted = new Date(date.getTime() + clampHijriOffset(offsetDays) * MS_PER_DAY)
  return formatter.format(shifted)
}

export function formatGregorianDate(date: Date, numerals: DateNumerals = 'arab', locale = 'ar'): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-gregory-nu-${numerals}`, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
