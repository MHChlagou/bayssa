import { Heart } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactElement } from 'react'
import { Link } from 'react-router'
import { useFavorites } from '../../app/hooks.ts'
import { collectionsContaining, getEntry } from '../../content/index.ts'
import type { Entry, SectionId } from '../../content/schema.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { cn } from '../../ui/cn.ts'
import { DhikrCard } from '../../ui/DhikrCard.tsx'
import { EmptyState } from '../../ui/EmptyState.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'

const SECTION_ORDER: readonly SectionId[] = ['adhkar', 'daily-duas', 'quranic', 'prophetic']
type Filter = SectionId | 'all'

export function FavoritesPage(): ReactElement {
  const { favorites, toggle } = useFavorites()
  const [filter, setFilter] = useState<Filter>('all')

  const saved: { entry: Entry; section: SectionId }[] = favorites.flatMap((favorite) => {
    const entry = getEntry(favorite.id)
    const section = collectionsContaining(favorite.id)[0]?.section
    // A saved id can outlive its entry when content is updated: skip it quietly.
    return entry && section ? [{ entry, section }] : []
  })
  const sections = SECTION_ORDER.filter((section) => saved.some((item) => item.section === section))
  const activeFilter: Filter = filter !== 'all' && !sections.includes(filter) ? 'all' : filter
  const visible = saved.filter((item) => activeFilter === 'all' || item.section === activeFilter)

  if (saved.length === 0) {
    return (
      <>
        <PageHeader title={t.favorites.title} subtitle={t.favorites.subtitle} />
        <EmptyState
          icon={Heart}
          title={t.favorites.emptyTitle}
          body={t.favorites.emptyBody}
          action={<Link to="/adhkar" className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-on-action">{t.favorites.browse}</Link>}
        />
      </>
    )
  }

  const chips: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: t.favorites.all, count: saved.length },
    ...sections.map((section) => ({
      value: section,
      label: t.sections[section],
      count: saved.filter((item) => item.section === section).length,
    })),
  ]

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title={t.favorites.title} subtitle={t.favorites.subtitle} />
      {sections.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t.favorites.title}>
          {chips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={activeFilter === chip.value}
              onClick={() => setFilter(chip.value)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
                activeFilter === chip.value ? 'border-primary bg-action text-on-action' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {chip.label} <span className="opacity-70">{formatNumber(chip.count)}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {visible.map(({ entry }) => (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <DhikrCard entry={entry} isFavorite onToggleFavorite={() => toggle(entry.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
