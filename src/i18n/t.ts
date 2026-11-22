import { prefsStore, type Numerals } from '../storage/stores.ts'
import { ar, type Messages } from './ar.ts'

// A single locale for now. Components read copy through `t` so that adding a
// locale later only changes this module.
export const LOCALE = 'ar'
export const DIRECTION = 'rtl'
export const t: Messages = ar

const formatters: Record<Numerals, Intl.NumberFormat> = {
  arab: new Intl.NumberFormat(`${LOCALE}-u-nu-arab`, { useGrouping: false }),
  latn: new Intl.NumberFormat(`${LOCALE}-u-nu-latn`, { useGrouping: false }),
}

/** Formats with the digits the user chose in settings. */
export function formatNumber(value: number): string {
  return formatters[prefsStore.get().numerals].format(value)
}

/** Ayah numbers always use the digits printed in the mushaf. */
export function formatAyahNumber(value: number): string {
  return formatters.arab.format(value)
}

/** Arabic count agreement: 1 ذكر واحد, 2 ذكران, 3 to 10 أذكار, 11 and up ذكراً. */
export function formatDhikrCount(count: number): string {
  const forms = t.library.count
  if (count === 1) return forms.one
  if (count === 2) return forms.two
  const remainder = count % 100
  const noun = remainder >= 3 && remainder <= 10 ? forms.few : forms.many
  return `${formatNumber(count)} ${noun}`
}
