import { describe, expect, it } from 'vitest'
import {
  activeCounter, clampTarget, isTargetReached, justCompleted, MAX_TARGET, roundProgress, tasbihReducer,
  type TasbihAction, type TasbihState,
} from './tasbih.ts'

const start: TasbihState = { activeId: 'a', counters: { a: { count: 0, target: 3, completedRounds: 0 } }, lifetimeTotal: 0 }
const run = (state: TasbihState, ...actions: TasbihAction[]): TasbihState => actions.reduce(tasbihReducer, state)
const tap: TasbihAction = { type: 'increment' }

describe('tasbihReducer', () => {
  it('counts each tap and tracks the lifetime total', () => {
    const state = run(start, tap, tap)
    expect(activeCounter(state).count).toBe(2)
    expect(state.lifetimeTotal).toBe(2)
  })

  it('reports completion exactly once, on the tap that reaches the target', () => {
    const two = run(start, tap, tap)
    const three = run(two, tap)
    const four = run(three, tap)
    expect(justCompleted(activeCounter(two), activeCounter(three))).toBe(true)
    expect(justCompleted(activeCounter(three), activeCounter(four))).toBe(false)
    expect(isTargetReached(activeCounter(three))).toBe(true)
  })

  it('never clears the count when the target is reached or passed', () => {
    const state = run(start, tap, tap, tap, tap, tap)
    expect(activeCounter(state).count).toBe(5)
    expect(activeCounter(state).completedRounds).toBe(0)
    expect(roundProgress(activeCounter(state))).toBe(1)
  })

  it('starts another round only when asked, and only after the target', () => {
    expect(run(start, tap, { type: 'startNextRound' })).toEqual(run(start, tap))
    const next = run(start, tap, tap, tap, { type: 'startNextRound' })
    expect(activeCounter(next)).toEqual({ count: 0, target: 3, completedRounds: 1 })
    expect(next.lifetimeTotal).toBe(3)
  })

  it('resets the active counter but keeps the lifetime total', () => {
    const state = run(start, tap, tap, tap, { type: 'startNextRound' }, tap, { type: 'reset' })
    expect(activeCounter(state)).toEqual({ count: 0, target: 3, completedRounds: 0 })
    expect(state.lifetimeTotal).toBe(4)
  })

  it('keeps each dhikr count when switching between them', () => {
    const state = run(start, tap, tap, { type: 'select', id: 'b', defaultTarget: 100 }, tap, { type: 'select', id: 'a', defaultTarget: 33 })
    expect(activeCounter(state)).toEqual({ count: 2, target: 3, completedRounds: 0 })
    expect(state.counters.b).toEqual({ count: 1, target: 100, completedRounds: 0 })
  })

  it('changes the target without touching the count', () => {
    const state = run(start, tap, tap, { type: 'setTarget', target: 100 })
    expect(activeCounter(state)).toEqual({ count: 2, target: 100, completedRounds: 0 })
  })

  it('clamps invalid targets', () => {
    expect(clampTarget(0)).toBe(1)
    expect(clampTarget(-5)).toBe(1)
    expect(clampTarget(Number.NaN)).toBe(1)
    expect(clampTarget(33.4)).toBe(33)
    expect(clampTarget(1e9)).toBe(MAX_TARGET)
  })

  it('falls back to a usable counter when nothing is selected', () => {
    const empty: TasbihState = { activeId: '', counters: {}, lifetimeTotal: 0 }
    expect(activeCounter(empty)).toEqual({ count: 0, target: 1, completedRounds: 0 })
  })
})
