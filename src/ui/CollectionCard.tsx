import { Check, ChevronLeft } from 'lucide-react'
import type { ReactElement } from 'react'
import { useIsStaticShell } from '../app/boot.ts'
import { Link } from 'react-router'
import { collectionPath } from '../content/index.ts'
import type { Collection } from '../content/schema.ts'
import { formatDhikrCount } from '../i18n/t.ts'
import { CollectionIcon } from './icons.tsx'
import { ProgressRing } from './ProgressRing.tsx'

type CollectionCardProps = { collection: Collection; completedItems?: number }

export function CollectionCard({ collection, completedItems = 0 }: CollectionCardProps): ReactElement {
  const total = collection.items.length
  // The count is printed with the user's digit preference, which the build-time shell cannot know.
  const isStaticShell = useIsStaticShell()
  const isComplete = completedItems >= total
  return (
    <Link
      to={collectionPath(collection)}
      className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-4 shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-float/20 active:scale-[0.985]"
    >
      <ProgressRing value={completedItems / total} size={54} strokeWidth={2.5} trackClassName="stroke-transparent">
        <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-action group-hover:text-on-action">
          {isComplete ? <Check className="size-5" strokeWidth={2.25} aria-hidden="true" /> : <CollectionIcon name={collection.icon} className="size-5" />}
        </span>
      </ProgressRing>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.02rem] font-medium text-ink">{collection.title}</span>
        <span className="block truncate text-xs text-muted">{collection.subtitle ?? (isStaticShell ? '\u00A0' : formatDhikrCount(total))}</span>
      </span>
      <ChevronLeft className="size-5 shrink-0 text-muted/60 transition-transform duration-300 group-hover:-translate-x-1 group-hover:text-primary" aria-hidden="true" />
    </Link>
  )
}
