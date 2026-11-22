import { Check, Copy, Heart, Share2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactElement } from 'react'
import { gradeLabel, isApproximateMatch, plainText, sourceLine } from '../content/describe.ts'
import type { Entry } from '../content/schema.ts'
import { formatNumber, t } from '../i18n/t.ts'
import { cn } from './cn.ts'
import { EntryText } from './EntryText.tsx'
import { IconButton } from './IconButton.tsx'
import { ProgressRing } from './ProgressRing.tsx'

const COPIED_FEEDBACK_MS = 1600

type Counter = { count: number; repeat: number; onCount: () => void }

type DhikrCardProps = {
  entry: Entry
  position?: number
  /** Remark from the source that applies to this placement. */
  note?: string
  counter?: Counter
  isFavorite: boolean
  onToggleFavorite: () => void
  isHighlighted?: boolean
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.warn('copy to clipboard failed', error)
    return false
  }
}

export function DhikrCard({
  entry, position, note, counter, isFavorite, onToggleFavorite, isHighlighted = false,
}: DhikrCardProps): ReactElement {
  const [hasCopied, setHasCopied] = useState(false)
  const isDone = counter !== undefined && counter.count >= counter.repeat
  const grade = gradeLabel(entry)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!hasCopied) return
    const timer = window.setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [hasCopied])

  const copy = async (): Promise<void> => setHasCopied(await copyText(plainText(entry)))
  const share = async (): Promise<void> => {
    try {
      await navigator.share({ text: `${plainText(entry)}\n${t.reader.sharedFrom}` })
    } catch (error) {
      // Dismissing the share sheet rejects with AbortError: that is not a failure.
      if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn('share failed', error)
    }
  }

  return (
    <article
      id={`entry-${entry.id}`}
      data-done={isDone}
      className={cn(
        'scroll-mt-6 overflow-hidden rounded-[26px] border bg-surface shadow-card transition-[border-color,box-shadow] duration-500',
        isHighlighted ? 'border-accent-soft ring-2 ring-accent-soft/40' : isDone ? 'border-primary/25' : 'border-line',
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-3 sm:px-6">
        {position !== undefined && (
          <span className="grid size-7 place-items-center rounded-full bg-surface-alt text-xs font-medium text-muted" aria-hidden="true">
            {formatNumber(position)}
          </span>
        )}
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium',
            entry.kind === 'quran' ? 'bg-accent-soft/25 text-accent' : 'bg-primary-soft text-primary',
          )}
        >
          {t.kinds[entry.kind]}
        </span>
        <div className="ms-auto flex items-center">
          <IconButton icon={hasCopied ? Check : Copy} label={hasCopied ? t.actions.copied : t.actions.copy} onClick={() => void copy()} />
          {canShare && <IconButton icon={Share2} label={t.actions.share} onClick={() => void share()} />}
          <motion.div whileTap={{ scale: 0.8 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            <IconButton
              icon={Heart}
              label={isFavorite ? t.actions.removeFavorite : t.actions.addFavorite}
              aria-pressed={isFavorite}
              onClick={onToggleFavorite}
              className={isFavorite ? 'text-danger [&_svg]:fill-current' : undefined}
            />
          </motion.div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-1 sm:px-7">
        <EntryText entry={entry} />
        {note !== undefined && (
          <p className="mt-3 border-s-2 border-accent-soft/70 ps-3 text-[0.82rem] leading-relaxed text-muted">{note}</p>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line/70 px-5 py-3 text-xs text-muted sm:px-7">
        <span className="font-medium text-ink/80">{sourceLine(entry)}</span>
        {grade !== undefined && (
          <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[0.68rem] text-primary">{grade}</span>
        )}
        {isApproximateMatch(entry) && (
          <span title={t.reader.approximateHint} className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] text-muted">
            {t.reader.approximate}
          </span>
        )}
        {entry.kind === 'hadith' && <span className="ms-auto">{t.reader.hisn}</span>}
      </footer>

      {counter !== undefined && (
        <button
          type="button"
          onClick={counter.onCount}
          disabled={isDone}
          className={cn(
            'flex min-h-16 w-full items-center justify-between gap-3 px-5 py-3 text-start transition-colors duration-300 sm:px-7',
            isDone ? 'bg-primary-soft text-primary' : 'bg-action text-on-action hover:bg-action/90 active:bg-primary-deep',
          )}
        >
          <span className="text-sm font-medium">
            {isDone ? t.reader.done : t.reader.tapToCount}
            <span className="sr-only"> · {t.reader.repeat} {formatNumber(counter.count)} / {formatNumber(counter.repeat)}</span>
          </span>
          <ProgressRing
            value={counter.count / counter.repeat}
            size={44}
            strokeWidth={3}
            trackClassName={isDone ? 'stroke-primary/20' : 'stroke-on-action/25'}
            barClassName={isDone ? 'stroke-primary' : 'stroke-accent-soft'}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isDone ? (
                <motion.span key="done" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
                  <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key={counter.count}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  aria-hidden="true"
                  className="block text-xs font-semibold tabular-nums"
                >
                  {formatNumber(counter.repeat - counter.count)}
                </motion.span>
              )}
            </AnimatePresence>
          </ProgressRing>
        </button>
      )}
    </article>
  )
}
