import { ChevronLeft, CircleDot, Heart } from 'lucide-react'
import { useMemo, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useEntranceAnimation, useIsStaticShell } from '../../app/boot.ts'
import { useFavorites } from '../../app/hooks.ts'
import { completedItemCount, useTodayProgress } from '../../app/progress.ts'
import { previewText, sourceLine } from '../../content/describe.ts'
import { collectionPath, collectionsContaining, entriesInSection, FREE_COUNTER, getCollection, tasbihPresets } from '../../content/index.ts'
import type { Collection, Entry } from '../../content/schema.ts'
import { dayPeriod, pickForDay, type DayPeriod } from '../../domain/daily/daily.ts'
import { formatGregorianDate, formatHijriDate } from '../../domain/hijri/hijri.ts'
import { createCounter, roundProgress } from '../../domain/tasbih/tasbih.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { prefsStore, recentsStore, tasbihStore } from '../../storage/stores.ts'
import { usePersistentState } from '../../storage/usePersistentState.ts'
import { cn } from '../../ui/cn.ts'
import { CollectionCard } from '../../ui/CollectionCard.tsx'
import { CollectionIcon } from '../../ui/icons.tsx'
import { HeaderLinks } from '../../ui/PageHeader.tsx'
import { ProgressRing } from '../../ui/ProgressRing.tsx'

const SUGGESTED_BY_PERIOD: Record<DayPeriod, string> = { morning: 'morning', midday: 'general', evening: 'evening', night: 'sleep' }
const DAILY_DUA_SALT = 7
// The static shell reserves space only for cards this build can actually fill.
const CAN_SUGGEST_WIRD = [...Object.values(SUGGESTED_BY_PERIOD), 'morning'].some((id) => getCollection(id) !== undefined)
const HAS_DAILY_DHIKR = (getCollection('general')?.items.length ?? 0) > 0
const MAX_RECENTS_SHOWN = 4

function Reveal({ order, children, className }: { order: number; children: ReactNode; className?: string }): ReactElement {
  const shouldAnimate = useEntranceAnimation()
  return (
    <section className={cn(shouldAnimate && 'rise-in', className)} style={{ '--rise-order': order } as CSSProperties}>
      {children}
    </section>
  )
}

function DailyCard({ label, entry }: { label: string; entry: Entry }): ReactElement | null {
  const collection = collectionsContaining(entry.id)[0]
  if (!collection) return null
  return (
    <Link
      to={`${collectionPath(collection)}?focus=${encodeURIComponent(entry.id)}`}
      className="group flex h-full flex-col rounded-[26px] border border-line bg-surface p-5 shadow-card transition-[transform,border-color] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
    >
      <span className="flex items-center justify-between text-xs font-medium text-accent">
        {label}
        <ChevronLeft className="size-4 text-muted/60 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
      </span>
      <span className="scripture mt-2 line-clamp-4 flex-1 text-ink">{previewText(entry)}</span>
      <span className="mt-3 truncate text-xs text-muted">{sourceLine(entry)}</span>
    </Link>
  )
}

/** Holds the place of a daily card in the build-time shell, where today's pick is unknown. */
function DailyCardPlaceholder({ label }: { label: string }): ReactElement {
  return (
    <div className="flex min-h-44 flex-col rounded-[26px] border border-line bg-surface p-5 shadow-card">
      <span className="text-xs font-medium text-accent">{label}</span>
      <span className="mt-4 h-4 w-11/12 rounded-full bg-surface-alt" />
      <span className="mt-4 h-4 w-3/4 rounded-full bg-surface-alt" />
    </div>
  )
}

function Hero({ suggested, completed }: { suggested: Collection | undefined; completed: number }): ReactElement {
  const [prefs] = usePersistentState(prefsStore)
  const isStaticShell = useIsStaticShell()
  const now = useMemo(() => new Date(), [])
  const hijri = formatHijriDate(now, { offsetDays: prefs.hijriOffsetDays, numerals: prefs.numerals })
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-linear-to-bl from-[#14705a] via-[#0d4a3a] to-[#072a20] text-[#fdfaf1] shadow-float">
      <div className="pattern-stars absolute inset-0 opacity-[0.13]" aria-hidden="true" />
      <div className="absolute -start-16 -top-20 size-56 rounded-full bg-[#d9bd7f]/15 blur-3xl" aria-hidden="true" />
      <div className="relative p-6 sm:p-8">
        <p className="min-h-[1.7em] text-sm font-medium text-[#e6cf98]">
          {!isStaticShell && (hijri ?? formatGregorianDate(now, prefs.numerals))}
          {!isStaticShell && hijri !== null && <span className="ms-2 font-normal text-[#fdfaf1]/60">{formatGregorianDate(now, prefs.numerals)}</span>}
        </p>
        <h1 className="mt-3 font-scripture text-[2rem] leading-[1.7] sm:text-[2.4rem]">{t.home.greeting}</h1>
        <p className="min-h-[1.7em] text-[0.95rem] text-[#fdfaf1]/75">{!isStaticShell && t.home.periods[dayPeriod(now)]}</p>

        {isStaticShell && CAN_SUGGEST_WIRD && <div className="mt-6 h-[88px] rounded-[24px] bg-[#fdfaf1]/10 ring-1 ring-[#fdfaf1]/15" />}
        {!isStaticShell && suggested && (
          <Link
            to={collectionPath(suggested)}
            className="group mt-6 flex items-center gap-4 rounded-[24px] bg-[#fdfaf1]/10 p-4 ring-1 ring-[#fdfaf1]/15 backdrop-blur-sm transition-[background-color,transform] duration-300 hover:bg-[#fdfaf1]/15 active:scale-[0.985]"
          >
            <ProgressRing value={completed / suggested.items.length} size={56} strokeWidth={3} trackClassName="stroke-[#fdfaf1]/15" barClassName="stroke-[#d9bd7f]">
              <CollectionIcon name={suggested.icon} className="size-6 text-[#e6cf98]" strokeWidth={1.5} />
            </ProgressRing>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-[#fdfaf1]/65">{t.home.suggested}</span>
              <span className="block truncate text-lg font-medium">{suggested.title}</span>
            </span>
            <span className="rounded-full bg-[#d9bd7f] px-4 py-2 text-sm font-medium text-[#072a20] transition-transform duration-300 group-hover:-translate-x-0.5">
              {completed > 0 && completed < suggested.items.length ? t.actions.continue : completed > 0 ? t.home.doneToday : t.actions.startNow}
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

export function HomePage(): ReactElement {
  const isStaticShell = useIsStaticShell()
  const now = useMemo(() => new Date(), [])
  const { progress, day } = useTodayProgress()
  const { favorites } = useFavorites()
  const [recents] = usePersistentState(recentsStore)
  const [tasbih] = usePersistentState(tasbihStore)

  const suggested = getCollection(SUGGESTED_BY_PERIOD[dayPeriod(now)]) ?? getCollection('morning')
  const morning = getCollection('morning')
  const evening = getCollection('evening')
  const dailyDhikr = pickForDay(getCollection('general')?.items ?? [], now)
  const dailyDhikrEntry = dailyDhikr ? entriesInSection('adhkar').find((entry) => entry.id === dailyDhikr.entryId) : undefined
  const dailyDua = pickForDay(
    [...entriesInSection('daily-duas'), ...entriesInSection('prophetic'), ...entriesInSection('quranic')],
    now,
    DAILY_DUA_SALT,
  )
  const recentCollections = recents.flatMap((id) => getCollection(id) ?? []).slice(0, MAX_RECENTS_SHOWN)

  // In the static shell nothing saved on the device may show: it would not match the prerendered HTML.
  const savedPreset = isStaticShell ? undefined : tasbihPresets.find((candidate) => candidate.id === tasbih.activeId)
  const preset = savedPreset ?? tasbihPresets[0] ?? FREE_COUNTER
  const savedCounter = isStaticShell || !preset ? undefined : tasbih.counters[preset.id]
  const counter = preset ? (savedCounter ?? createCounter(preset.defaultTarget)) : undefined
  const completedToday = (collection: Collection): number => (isStaticShell ? 0 : completedItemCount(collection, progress, day))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-1 lg:hidden">
        <Link to="/" className="flex items-center gap-3 rounded-xl">
          <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="" width={44} height={44} className="size-11 rounded-full" />
          <span>
            <span className="block text-lg font-semibold leading-tight text-ink">{t.appName}</span>
            <span className="block text-xs text-muted">{t.tagline}</span>
          </span>
        </Link>
        <div className="-me-2 flex"><HeaderLinks /></div>
      </header>

      <Reveal order={0}>
        <Hero suggested={suggested} completed={suggested ? completedToday(suggested) : 0} />
      </Reveal>

      <Reveal order={1} className="grid gap-3 sm:grid-cols-2">
        {morning && <CollectionCard collection={morning} completedItems={completedToday(morning)} />}
        {evening && <CollectionCard collection={evening} completedItems={completedToday(evening)} />}
      </Reveal>

      {/* Quick actions sit above the daily cards so that everything on a phone's first screen
          is static and paints from the prerendered shell. The daily picks depend on the date. */}
      <Reveal order={2} className="grid gap-3 sm:grid-cols-2">
        {preset && counter && (
          <Link to="/tasbih" className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-4 shadow-card transition-[transform,border-color] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.985]">
            <ProgressRing value={roundProgress(counter)} size={54} strokeWidth={3}>
              <CircleDot className="size-5 text-primary" strokeWidth={1.6} aria-hidden="true" />
            </ProgressRing>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.02rem] font-medium text-ink">{t.home.quickTasbih}</span>
              {preset.text === ""
                ? <span className="block truncate text-xs text-muted">{t.home.tasbihHint}</span>
                : <span className="block truncate font-scripture text-[0.95rem] leading-[1.9] text-muted">{preset.text}</span>}
            </span>
            <span className="text-sm tabular-nums text-muted">{!isStaticShell && `${formatNumber(counter.count)} / ${formatNumber(counter.target)}`}</span>
          </Link>
        )}
        <Link to="/favorites" className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-4 shadow-card transition-[transform,border-color] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.985]">
          <span className="grid size-[54px] place-items-center rounded-full bg-accent-soft/20 text-accent">
            <Heart className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.02rem] font-medium text-ink">{t.home.favorites}</span>
            <span className="block truncate text-xs text-muted">{t.home.favoritesHint}</span>
          </span>
          <span className="text-sm tabular-nums text-muted">{!isStaticShell && formatNumber(favorites.length)}</span>
        </Link>
      </Reveal>

      <Reveal order={3} className="grid gap-3 md:grid-cols-2">
        {isStaticShell && HAS_DAILY_DHIKR && <DailyCardPlaceholder label={t.home.dailyDhikr} />}
        {isStaticShell && <DailyCardPlaceholder label={t.home.dailyDua} />}
        {!isStaticShell && dailyDhikrEntry && <DailyCard label={t.home.dailyDhikr} entry={dailyDhikrEntry} />}
        {!isStaticShell && dailyDua && <DailyCard label={t.home.dailyDua} entry={dailyDua} />}
      </Reveal>

      {!isStaticShell && recentCollections.length > 0 && (
        <Reveal order={4}>
          <h2 className="mb-3 text-sm font-medium text-muted">{t.home.recents}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recentCollections.map((collection) => (
              <li key={collection.id}><CollectionCard collection={collection} /></li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  )
}
