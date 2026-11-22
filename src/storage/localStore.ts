// One small persistent store per concern, kept in localStorage.
// Stored data is treated as untrusted: each store supplies a parser that
// either returns a valid value or throws, and a failed parse falls back to
// the default instead of crashing the app.

const KEY_PREFIX = 'md:v1:'
const SCHEMA_VERSION = 1

export type Store<T> = {
  readonly key: string
  get: () => T
  set: (next: T | ((current: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

type StoreOptions<T> = {
  name: string
  defaults: T
  /** Returns a valid value built from untrusted data, or throws. */
  parse: (raw: unknown) => T
  storage?: Storage
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createStore<T>({ name, defaults, parse, storage }: StoreOptions<T>): Store<T> {
  const key = KEY_PREFIX + name
  const listeners = new Set<() => void>()
  const backing = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
  let cached: T | undefined

  function read(): T {
    if (!backing) return defaults
    const serialized = backing.getItem(key)
    if (serialized === null) return defaults
    try {
      const envelope: unknown = JSON.parse(serialized)
      if (!isRecord(envelope) || envelope.version !== SCHEMA_VERSION) {
        throw new Error(`unsupported envelope for ${key}`)
      }
      return parse(envelope.data)
    } catch (error) {
      console.warn('stored data was invalid and has been ignored', { key, error })
      return defaults
    }
  }

  function get(): T {
    if (cached === undefined) cached = read()
    return cached
  }

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function set(next: T | ((current: T) => T)): void {
    const value = typeof next === 'function' ? (next as (current: T) => T)(get()) : next
    cached = value
    try {
      backing?.setItem(key, JSON.stringify({ version: SCHEMA_VERSION, data: value }))
    } catch (error) {
      // Quota or private-mode failure: keep working in memory and say so.
      console.warn('could not persist to localStorage', { key, error })
    }
    notify()
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  if (typeof window !== 'undefined') {
    // Keep several open tabs in step with each other.
    window.addEventListener('storage', (event) => {
      if (event.key !== key && event.key !== null) return
      cached = undefined
      notify()
    })
  }

  return { key, get, set, subscribe }
}

export { isRecord }
