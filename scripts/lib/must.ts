/** Returns the value, or stops the script with a message naming what was missing. */
export function must<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) throw new Error(`missing ${what}`)
  return value
}
