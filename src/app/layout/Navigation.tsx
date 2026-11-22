import { Search, Settings } from 'lucide-react'
import type { CSSProperties, ReactElement } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { formatHijriDate } from '../../domain/hijri/hijri.ts'
import { DIRECTION, t } from '../../i18n/t.ts'
import { prefsStore } from '../../storage/stores.ts'
import { usePersistentState } from '../../storage/usePersistentState.ts'
import { cn } from '../../ui/cn.ts'
import { useIsStaticShell } from '../boot.ts'
import { NAV_ITEMS } from '../registry.ts'

const SIDEBAR_ITEM_STEP_PX = 52
// In a right-to-left row the next item sits to the left, so the pill moves the other way.
const INLINE_STEP = DIRECTION === 'rtl' ? -100 : 100

function useActiveIndex(): number {
  const { pathname } = useLocation()
  return NAV_ITEMS.findIndex(({ to, isExact }) => (isExact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)))
}

const pillClass = 'pointer-events-none absolute bg-primary-soft transition-[transform,opacity] duration-300 ease-out-soft'

export function BottomNav(): ReactElement {
  const activeIndex = useActiveIndex()
  const pillStyle: CSSProperties = {
    width: `calc((100% - 0.75rem) / ${NAV_ITEMS.length})`,
    transform: `translateX(${Math.max(0, activeIndex) * INLINE_STEP}%)`,
    opacity: activeIndex === -1 ? 0 : 1,
  }
  return (
    <nav aria-label={t.nav.main} className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden">
      <ul className="pointer-events-auto relative mx-auto flex max-w-md items-stretch rounded-[28px] border border-line bg-surface/90 p-1.5 shadow-float backdrop-blur-xl">
        <li aria-hidden="true" className={cn(pillClass, 'inset-y-1.5 start-1.5 rounded-[22px]')} style={pillStyle} />
        {NAV_ITEMS.map(({ to, label, icon: Icon, isExact }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={isExact}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 rounded-[22px] px-1 py-2 text-[0.68rem] transition-colors duration-200',
                  isActive ? 'font-medium text-primary' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2 : 1.6} aria-hidden="true" />
                  {/* Six labels share the bar: on the narrowest phones they are set a little smaller to stay on one line. */}
                  <span className="whitespace-nowrap max-[359px]:text-[0.58rem]">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Brand(): ReactElement {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-2xl px-3 py-1 transition-colors duration-200 hover:bg-surface-alt/70">
      <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="" width={44} height={44} className="size-11 rounded-full" />
      <span>
        <span className="block text-base font-semibold leading-tight text-ink">{t.appName}</span>
        <span className="block text-xs text-muted">{t.tagline}</span>
      </span>
    </Link>
  )
}

const sideLinkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'relative flex h-12 items-center gap-3 rounded-2xl px-4 text-[0.95rem] transition-colors duration-200',
    isActive ? 'font-medium text-primary' : 'text-muted hover:bg-surface-alt/70 hover:text-ink',
  )

function SidebarDate(): ReactElement | null {
  const [prefs] = usePersistentState(prefsStore)
  const hijri = formatHijriDate(new Date(), { offsetDays: prefs.hijriOffsetDays, numerals: prefs.numerals })
  if (hijri === null) return null
  return (
    <div className="rounded-2xl bg-primary-deep px-4 py-3 text-center">
      <p className="text-sm font-medium text-[#d9bd7f]">{hijri}</p>
    </div>
  )
}

export function Sidebar(): ReactElement {
  const activeIndex = useActiveIndex()
  const isStaticShell = useIsStaticShell()
  return (
    <aside className="fixed bottom-0 start-0 top-(--tribute-height) z-30 hidden w-[272px] flex-col border-e border-line bg-surface/60 px-4 py-7 lg:flex">
      <Brand />
      <nav aria-label={t.nav.main} className="mt-9 flex-1">
        <ul className="relative space-y-1">
          <li
            aria-hidden="true"
            className={cn(pillClass, 'inset-x-0 top-0 h-12 rounded-2xl')}
            style={{ transform: `translateY(${Math.max(0, activeIndex) * SIDEBAR_ITEM_STEP_PX}px)`, opacity: activeIndex === -1 ? 0 : 1 }}
          />
          {NAV_ITEMS.map(({ to, label, icon: Icon, isExact }) => (
            <li key={to}>
              <NavLink to={to} end={isExact} className={sideLinkClass}>
                {({ isActive }) => (
                  <>
                    <Icon className="size-5" strokeWidth={isActive ? 2 : 1.6} aria-hidden="true" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="my-5 h-px bg-line" />
        <ul className="space-y-1">
          <li>
            <NavLink to="/search" className={sideLinkClass}>
              <Search className="size-5" strokeWidth={1.6} aria-hidden="true" />
              {t.actions.search}
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={sideLinkClass}>
              <Settings className="size-5" strokeWidth={1.6} aria-hidden="true" />
              {t.actions.settings}
            </NavLink>
          </li>
        </ul>
      </nav>
      {!isStaticShell && <SidebarDate />}
    </aside>
  )
}
