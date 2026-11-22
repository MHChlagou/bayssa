// Tasbih counter logic. Pure functions, no React and no storage.
// Invariant: a count is only ever cleared by an explicit user action
// (`reset` or `startNextRound`). Reaching the target never clears it.

export type Counter = {
  readonly count: number
  readonly target: number
  readonly completedRounds: number
}

export type TasbihState = {
  readonly activeId: string
  readonly counters: Readonly<Record<string, Counter>>
  readonly lifetimeTotal: number
}

export type TasbihAction =
  | { type: 'increment' }
  | { type: 'startNextRound' }
  | { type: 'reset' }
  | { type: 'setTarget'; target: number }
  | { type: 'select'; id: string; defaultTarget: number }

export const MIN_TARGET = 1
export const MAX_TARGET = 10_000

export function createCounter(target: number): Counter {
  return { count: 0, target: clampTarget(target), completedRounds: 0 }
}

export function clampTarget(target: number): number {
  if (!Number.isFinite(target)) return MIN_TARGET
  return Math.min(MAX_TARGET, Math.max(MIN_TARGET, Math.round(target)))
}

export function activeCounter(state: TasbihState): Counter {
  return state.counters[state.activeId] ?? createCounter(MIN_TARGET)
}

export function isTargetReached(counter: Counter): boolean {
  return counter.count >= counter.target
}

/** True only on the tap that lands exactly on the target. */
export function justCompleted(previous: Counter, next: Counter): boolean {
  return previous.count < previous.target && next.count >= next.target
}

/** Progress within the current round, from 0 to 1. */
export function roundProgress(counter: Counter): number {
  return Math.min(1, counter.count / counter.target)
}

function withActive(state: TasbihState, counter: Counter): TasbihState {
  return { ...state, counters: { ...state.counters, [state.activeId]: counter } }
}

export function tasbihReducer(state: TasbihState, action: TasbihAction): TasbihState {
  const current = activeCounter(state)
  switch (action.type) {
    case 'increment':
      return { ...withActive(state, { ...current, count: current.count + 1 }), lifetimeTotal: state.lifetimeTotal + 1 }
    case 'startNextRound':
      if (!isTargetReached(current)) return state
      return withActive(state, { ...current, count: 0, completedRounds: current.completedRounds + 1 })
    case 'reset':
      return withActive(state, { ...current, count: 0, completedRounds: 0 })
    case 'setTarget':
      return withActive(state, { ...current, target: clampTarget(action.target) })
    case 'select':
      return {
        ...state,
        activeId: action.id,
        counters: state.counters[action.id]
          ? state.counters
          : { ...state.counters, [action.id]: createCounter(action.defaultTarget) },
      }
  }
}
