import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { cn } from './cn.ts'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  label: string
  isActive?: boolean
}

export function IconButton({ icon: Icon, label, isActive = false, className, ...rest }: IconButtonProps): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-90',
        isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-alt hover:text-ink',
        className,
      )}
      {...rest}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
