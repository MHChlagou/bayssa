import { ArrowRight, Search, Settings } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { t } from '../i18n/t.ts'
import { IconButton } from './IconButton.tsx'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Shows a back arrow that returns to this path when there is no history to go back to. */
  backTo?: string
  actions?: ReactNode
}

const linkClass = 'grid size-11 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-alt hover:text-ink active:scale-90'

export function HeaderLinks(): ReactElement {
  return (
    <>
      <Link to="/search" aria-label={t.actions.search} title={t.actions.search} className={linkClass}>
        <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </Link>
      <Link to="/settings" aria-label={t.actions.settings} title={t.actions.settings} className={linkClass}>
        <Settings className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </>
  )
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps): ReactElement {
  const navigate = useNavigate()
  const goBack = (): void => {
    if (backTo === undefined) return
    // History length 1 means the page was opened directly, so there is nothing to go back to.
    if (window.history.length > 1) void navigate(-1)
    else void navigate(backTo)
  }
  return (
    <header className="flex items-start gap-2 pb-5 pt-2">
      {backTo !== undefined && <IconButton icon={ArrowRight} label={t.actions.back} onClick={goBack} className="-ms-2 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.6rem] font-semibold leading-snug tracking-tight text-ink">{title}</h1>
        {subtitle !== undefined && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="-me-2 flex items-center">{actions ?? <HeaderLinks />}</div>
    </header>
  )
}
