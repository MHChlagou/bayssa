import { BookOpen } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactElement } from 'react'
import { useSearchParams } from 'react-router'
import { completedItemCount, useTodayProgress } from '../../app/progress.ts'
import { collectionsInSection } from '../../content/index.ts'
import type { Collection, SectionId } from '../../content/schema.ts'
import { t } from '../../i18n/t.ts'
import { CollectionCard } from '../../ui/CollectionCard.tsx'
import { EmptyState } from '../../ui/EmptyState.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'
import { Segmented } from '../../ui/Segmented.tsx'

const STAGGER_SECONDS = 0.035

function CollectionGrid({ collections, isTracked }: { collections: Collection[]; isTracked: boolean }): ReactElement {
  const { progress, day } = useTodayProgress()
  // A build limited to cleared content can leave a whole section empty.
  if (collections.length === 0) return <EmptyState icon={BookOpen} title={t.library.unavailableTitle} body={t.library.unavailableBody} />
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {collections.map((collection, index) => (
        <motion.li
          key={collection.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * STAGGER_SECONDS, ease: [0.22, 1, 0.36, 1] }}
        >
          <CollectionCard collection={collection} completedItems={isTracked ? completedItemCount(collection, progress, day) : 0} />
        </motion.li>
      ))}
    </ul>
  )
}

export function AdhkarPage(): ReactElement {
  return (
    <>
      <PageHeader title={t.library.adhkarTitle} subtitle={t.library.adhkarSubtitle} />
      <CollectionGrid collections={collectionsInSection('adhkar')} isTracked />
    </>
  )
}

// Everyday and prophetic supplications come first. Supplications from the Quran are one category among them.
const DUA_TABS = ['daily-duas', 'prophetic', 'quranic'] as const satisfies readonly SectionId[]
type DuaTab = (typeof DUA_TABS)[number]

function isDuaTab(value: string | null): value is DuaTab {
  return value !== null && (DUA_TABS as readonly string[]).includes(value)
}

export function DuasPage(): ReactElement {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const availableTabs = DUA_TABS.filter((value) => collectionsInSection(value).length > 0)
  const tab: DuaTab = isDuaTab(requested) && availableTabs.includes(requested) ? requested : (availableTabs[0] ?? 'daily-duas')
  return (
    <>
      <PageHeader title={t.library.duasTitle} subtitle={t.library.duasSubtitle} />
      {availableTabs.length > 1 && (
        <Segmented
          label={t.library.duasTitle}
          className="mb-5 max-w-md"
          options={availableTabs.map((value) => ({ value, label: t.library.tabs[value] }))}
          value={tab}
          onChange={(value) => setParams({ tab: value }, { replace: true })}
        />
      )}
      <CollectionGrid key={tab} collections={collectionsInSection(tab)} isTracked={false} />
    </>
  )
}
