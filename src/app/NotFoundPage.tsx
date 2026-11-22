import { Compass } from 'lucide-react'
import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { t } from '../i18n/t.ts'
import { EmptyState } from '../ui/EmptyState.tsx'

export function NotFoundPage(): ReactElement {
  return (
    <EmptyState
      icon={Compass}
      title={t.errors.notFoundTitle}
      body={t.errors.notFoundBody}
      action={<Link to="/" className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-on-action">{t.errors.goHome}</Link>}
    />
  )
}
