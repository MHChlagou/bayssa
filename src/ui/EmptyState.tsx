import type { LucideIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'

type EmptyStateProps = { icon: LucideIcon; title: string; body: string; action?: ReactNode }

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps): ReactElement {
  return (
    <div className="rise-in mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-6 grid size-24 place-items-center">
        <div className="absolute inset-0 rotate-45 rounded-[28px] border border-accent-soft/50" />
        <div className="absolute inset-0 rounded-[28px] border border-accent-soft/50 bg-surface" />
        <Icon className="relative size-9 text-primary" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}
