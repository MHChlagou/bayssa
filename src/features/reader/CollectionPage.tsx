import { BookOpen, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactElement } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { haptic, HAPTIC_COMPLETE_PATTERN_MS, HAPTIC_TAP_MS, useFavorites } from '../../app/hooks.ts'
import { completedItemCount, useTodayProgress } from '../../app/progress.ts'
import { getCollection, getEntry } from '../../content/index.ts'
import { clearCollection, countFor, progressKey, recordRepetition } from '../../domain/progress/progress.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { addRecent, recentsStore } from '../../storage/stores.ts'
import { DhikrCard } from '../../ui/DhikrCard.tsx'
import { EmptyState } from '../../ui/EmptyState.tsx'
import { IconButton } from '../../ui/IconButton.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'

export function CollectionPage(): ReactElement {
  const { collectionId = '' } = useParams()
  const [params] = useSearchParams()
  const focusedEntryId = params.get('focus')
  const collection = getCollection(collectionId)
  const { progress, day, setProgress } = useTodayProgress()
  const favorites = useFavorites()

  useEffect(() => {
    if (collection) recentsStore.set((recents) => addRecent(recents, collection.id))
  }, [collection])

  useEffect(() => {
    if (focusedEntryId === null) return
    document.getElementById(`entry-${focusedEntryId}`)?.scrollIntoView({ block: 'start' })
  }, [focusedEntryId])

  const backTo = collection?.section === 'adhkar' ? '/adhkar' : '/duas'
  if (!collection) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t.reader.notFound}
        body={t.errors.notFoundBody}
        action={<Link to="/adhkar" className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-on-action">{t.reader.backToLibrary}</Link>}
      />
    )
  }

  const total = collection.items.length
  const completed = completedItemCount(collection, progress, day)
  const isComplete = completed === total

  const count = (index: number, repeat: number): void => {
    const key = progressKey(collection.id, index)
    const willFinishItem = countFor(progress, day, key) + 1 >= repeat
    haptic(willFinishItem ? HAPTIC_COMPLETE_PATTERN_MS : HAPTIC_TAP_MS)
    setProgress((current) => recordRepetition(current, day, key, repeat))
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader
        title={collection.title}
        subtitle={collection.subtitle}
        backTo={backTo}
        actions={completed > 0 ? (
          <IconButton icon={RotateCcw} label={t.reader.restart} onClick={() => setProgress((current) => clearCollection(current, day, collection.id))} />
        ) : <span />}
      />

      <div className="sticky top-0 z-20 -mx-4 mb-4 lg:top-(--tribute-height) bg-bg/85 px-4 py-2.5 backdrop-blur-lg sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label={t.reader.progress}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt"
          >
            <div
              className="h-full origin-right rounded-full bg-linear-to-l from-primary to-accent-soft transition-transform duration-500 ease-out-soft"
              style={{ transform: `scaleX(${completed / total})` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted">{formatNumber(completed)} / {formatNumber(total)}</span>
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="pattern-stars mb-4 rounded-[22px] bg-primary-deep px-5 py-4 text-center text-sm font-medium text-[#f3e6c4]">
              {t.reader.completed}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ol className="space-y-4">
        {collection.items.map((item, index) => {
          const entry = getEntry(item.entryId)
          if (!entry) return null
          return (
            <li key={`${item.entryId}-${index}`}>
              <DhikrCard
                entry={entry}
                position={index + 1}
                note={item.note}
                isFavorite={favorites.has(entry.id)}
                onToggleFavorite={() => favorites.toggle(entry.id)}
                isHighlighted={entry.id === focusedEntryId}
                counter={{
                  count: countFor(progress, day, progressKey(collection.id, index)),
                  repeat: item.repeat,
                  onCount: () => count(index, item.repeat),
                }}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
