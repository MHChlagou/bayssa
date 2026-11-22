import type { ReactElement, ReactNode } from 'react'

type ProgressRingProps = {
  /** From 0 to 1. */
  value: number
  size: number
  strokeWidth?: number
  trackClassName?: string
  barClassName?: string
  children?: ReactNode
}

export function ProgressRing({
  value, size, strokeWidth = 4, trackClassName = 'stroke-line', barClassName = 'stroke-primary', children,
}: ProgressRingProps): ReactElement {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className={trackClassName} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clamped)}
          className={`${barClassName} transition-[stroke-dashoffset] duration-500 ease-out-soft`}
        />
      </svg>
      <div className="relative">{children}</div>
    </div>
  )
}
