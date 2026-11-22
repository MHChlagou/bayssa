import { Check, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type CSSProperties, type ReactElement } from 'react'
import { haptic, HAPTIC_COMPLETE_PATTERN_MS, HAPTIC_TAP_MS } from '../../app/hooks.ts'
import { FREE_COUNTER, tasbihPresets } from '../../content/index.ts'
import {
  createCounter, isTargetReached, justCompleted, MAX_TARGET, MIN_TARGET, roundProgress, tasbihReducer,
  type Counter, type TasbihAction, type TasbihState,
} from '../../domain/tasbih/tasbih.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { prefsStore, tasbihStore } from '../../storage/stores.ts'
import { usePersistentState } from '../../storage/usePersistentState.ts'
import { cn } from '../../ui/cn.ts'
import { Dialog } from '../../ui/Dialog.tsx'
import { IconButton } from '../../ui/IconButton.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'

const TARGET_CHOICES = [33, 99, 100, 1000] as const
const RING_SIZE = 320
const RING_STROKE = 10
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const RAY_COUNT = 12

function CompletionRays(): ReactElement {
  return (
    <div className="relative mx-auto grid size-28 place-items-center" aria-hidden="true">
      {Array.from({ length: RAY_COUNT }, (_, index) => (
        <span
          key={index}
          style={{ '--ray-angle': `${(360 / RAY_COUNT) * index}deg`, animationDelay: `${index * 18}ms` } as CSSProperties}
          className="absolute h-5 w-[3px] rounded-full bg-accent-soft opacity-0 [animation:ray-out_900ms_var(--ease-out-soft)_forwards]"
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
        className="grid size-16 place-items-center rounded-full bg-action text-on-action shadow-float"
      >
        <Check className="size-8" strokeWidth={2.5} />
      </motion.div>
    </div>
  )
}

export function TasbihPage(): ReactElement {
  const [state, setState] = usePersistentState(tasbihStore)
  const [prefs, setPrefs] = usePersistentState(prefsStore)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const celebrationTitleId = useId()
  const resetTitleId = useId()
  const customTargetId = useId()

  const preset = tasbihPresets.find((candidate) => candidate.id === state.activeId) ?? tasbihPresets[0] ?? FREE_COUNTER

  const counter: Counter = state.counters[preset.id] ?? createCounter(preset.defaultTarget)
  const isReached = isTargetReached(counter)

  // Every action first makes sure the shown preset is the stored one, so the
  // very first tap after install is counted against the right dhikr.
  const reduce = (current: TasbihState, action: TasbihAction): TasbihState =>
    tasbihReducer(tasbihReducer(current, { type: 'select', id: preset.id, defaultTarget: preset.defaultTarget }), action)
  const dispatch = (action: TasbihAction): void => setState((current) => reduce(current, action))

  const tap = (): void => {
    const next = reduce(state, { type: 'increment' }).counters[preset.id]
    const hasJustCompleted = next !== undefined && justCompleted(counter, next)
    haptic(hasJustCompleted ? HAPTIC_COMPLETE_PATTERN_MS : HAPTIC_TAP_MS)
    dispatch({ type: 'increment' })
    if (hasJustCompleted) setIsCelebrating(true)
  }

  const startNextRound = (): void => {
    dispatch({ type: 'startNextRound' })
    setIsCelebrating(false)
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader
        title={t.tasbih.title}
        actions={<IconButton icon={RotateCcw} label={t.actions.reset} onClick={() => setIsConfirmingReset(true)} disabled={counter.count === 0 && counter.completedRounds === 0} className="disabled:opacity-40" />}
      />

      {tasbihPresets.length > 0 && <div role="radiogroup" aria-label={t.tasbih.choose} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tasbihPresets.map((candidate) => {
          const isSelected = candidate.id === preset.id
          return (
            <button
              key={candidate.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setState((current) => tasbihReducer(current, { type: 'select', id: candidate.id, defaultTarget: candidate.defaultTarget }))}
              className={cn(
                'max-w-[78vw] shrink-0 truncate rounded-full border px-4 py-1.5 font-scripture text-[1.05rem] leading-[2] transition-colors duration-200 sm:max-w-full',
                isSelected ? 'border-primary bg-action text-on-action' : 'border-line bg-surface text-ink hover:border-primary/40',
              )}
            >
              {candidate.text}
            </button>
          )
        })}
      </div>}

      {preset.text === ""
        ? <p className="mt-4 text-center text-sm text-muted">{t.tasbih.freeCounter}</p>
        : <p className="scripture mt-4 min-h-[2.15em] text-center text-ink" aria-live="polite">{preset.text}</p>}

      <div className="relative mx-auto mt-2 grid w-[min(78vw,320px)] place-items-center">
        <button
          type="button"
          onClick={tap}
          aria-label={`${t.tasbih.tap} · ${formatNumber(counter.count)} / ${formatNumber(counter.target)}`}
          className="group relative grid aspect-square w-full touch-manipulation select-none place-items-center rounded-full bg-surface shadow-card outline-offset-8 transition-transform duration-150 ease-out-soft active:scale-[0.97]"
        >
          <span key={counter.count} className="pointer-events-none absolute inset-3 rounded-full border-2 border-primary/50 opacity-0 [animation:ripple-out_600ms_ease-out]" aria-hidden="true" />
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} className="stroke-surface-alt" />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={RING_CIRCUMFERENCE * (1 - roundProgress(counter))}
              className={cn('transition-[stroke-dashoffset,stroke] duration-500 ease-out-soft', isReached ? 'stroke-accent-soft' : 'stroke-primary')}
            />
          </svg>
          <span className="relative flex flex-col items-center">
            <span className="relative block h-[4.5rem] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={counter.count}
                  initial={{ y: 26, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -26, opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                  className="block text-[4rem] font-light leading-[4.5rem] tabular-nums text-ink"
                >
                  {formatNumber(counter.count)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="mt-1 text-sm text-muted">{t.tasbih.target} {formatNumber(counter.target)}</span>
            <span className="mt-3 text-xs text-muted/80 group-active:text-primary">{t.tasbih.tap}</span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isReached && !isCelebrating && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-[22px] border border-accent-soft/60 bg-accent-soft/15 px-5 py-3"
          >
            <span className="text-sm text-ink">{t.tasbih.completeBody}</span>
            <button type="button" onClick={startNextRound} className="rounded-full bg-action px-4 py-2 text-sm font-medium text-on-action">
              {t.tasbih.nextRound}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-center">
        <div className="rounded-[22px] border border-line bg-surface px-4 py-3">
          <dt className="text-xs text-muted">{t.tasbih.rounds}</dt>
          <dd className="text-xl font-medium tabular-nums text-ink">{formatNumber(counter.completedRounds)}</dd>
        </div>
        <div className="rounded-[22px] border border-line bg-surface px-4 py-3">
          <dt className="text-xs text-muted">{t.tasbih.total}</dt>
          <dd className="text-xl font-medium tabular-nums text-ink">{formatNumber(state.lifetimeTotal)}</dd>
        </div>
      </dl>

      <section className="mx-auto mt-6 max-w-sm" aria-label={t.tasbih.target}>
        <h2 className="mb-2 text-sm font-medium text-ink">{t.tasbih.target}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {TARGET_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={counter.target === choice}
              onClick={() => dispatch({ type: 'setTarget', target: choice })}
              className={cn(
                'min-w-14 rounded-full border px-4 py-2 text-sm tabular-nums transition-colors duration-200',
                counter.target === choice ? 'border-primary bg-primary-soft font-medium text-primary' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {formatNumber(choice)}
            </button>
          ))}
          <label htmlFor={customTargetId} className="sr-only">{t.tasbih.customTarget}</label>
          <input
            id={customTargetId}
            type="number"
            inputMode="numeric"
            min={MIN_TARGET}
            max={MAX_TARGET}
            placeholder={t.tasbih.customTarget}
            value={(TARGET_CHOICES as readonly number[]).includes(counter.target) ? '' : counter.target}
            onChange={(event) => {
              const value = event.target.valueAsNumber
              if (Number.isFinite(value) && value >= MIN_TARGET) dispatch({ type: 'setTarget', target: value })
            }}
            className="h-10 w-28 rounded-full border border-line bg-surface px-4 text-center text-sm text-ink outline-none placeholder:text-muted/70 focus:border-primary/50"
          />
        </div>
        <label className="mt-5 flex cursor-pointer items-center justify-between rounded-[22px] border border-line bg-surface px-5 py-3 text-sm text-ink">
          {t.tasbih.haptics}
          <input
            type="checkbox"
            role="switch"
            checked={prefs.isHapticsEnabled}
            onChange={(event) => setPrefs((current) => ({ ...current, isHapticsEnabled: event.target.checked }))}
            className="size-5 accent-primary"
          />
        </label>
      </section>

      <Dialog isOpen={isCelebrating} onClose={() => setIsCelebrating(false)} labelledBy={celebrationTitleId}>
        <div className="px-6 pb-6 pt-8 text-center">
          <CompletionRays />
          <h2 id={celebrationTitleId} className="mt-9 font-scripture text-3xl text-primary">{t.tasbih.completeTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.tasbih.completeBody} · {formatNumber(counter.target)}</p>
          <div className="mt-6 grid gap-2">
            <button type="button" autoFocus onClick={startNextRound} className="rounded-full bg-action px-5 py-3 text-sm font-medium text-on-action">
              {t.tasbih.nextRound}
            </button>
            <button type="button" onClick={() => setIsCelebrating(false)} className="rounded-full px-5 py-3 text-sm text-muted hover:bg-surface-alt">
              {t.tasbih.keepCounting}
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isConfirmingReset} onClose={() => setIsConfirmingReset(false)} labelledBy={resetTitleId}>
        <div className="p-6">
          <h2 id={resetTitleId} className="text-lg font-semibold text-ink">{t.tasbih.resetConfirm}</h2>
          <p className="mt-1 text-sm text-muted">{t.tasbih.resetHint}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => setIsConfirmingReset(false)} className="rounded-full px-5 py-2.5 text-sm text-muted hover:bg-surface-alt">
              {t.actions.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'reset' })
                setIsConfirmingReset(false)
              }}
              className="rounded-full bg-danger px-5 py-2.5 text-sm font-medium text-surface"
            >
              {t.actions.reset}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
