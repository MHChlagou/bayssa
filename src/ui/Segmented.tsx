import { motion } from 'motion/react'
import { useId, type ReactElement } from 'react'
import { cn } from './cn.ts'

type SegmentedProps<T extends string | number> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A single-choice control. Rendered as radio buttons so arrow keys and screen readers work natively. */
export function Segmented<T extends string | number>({ label, options, value, onChange, className }: SegmentedProps<T>): ReactElement {
  const groupId = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex rounded-2xl bg-surface-alt p-1', className)}>
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <label key={option.value} className="relative flex-1 cursor-pointer">
            <input
              type="radio"
              name={groupId}
              className="peer sr-only"
              checked={isSelected}
              onChange={() => onChange(option.value)}
            />
            {isSelected && (
              <motion.span
                layoutId={`${groupId}-thumb`}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="absolute inset-0 rounded-xl bg-surface shadow-card"
              />
            )}
            <span
              className={cn(
                'relative block rounded-xl px-3 py-2 text-center text-sm transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-accent-soft',
                isSelected ? 'font-medium text-primary' : 'text-muted',
              )}
            >
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
