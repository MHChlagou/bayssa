import type { CSSProperties, ReactElement } from 'react'
import { ABOUT_TEXT } from '../../app/about-text.ts'
import { PageHeader } from '../../ui/PageHeader.tsx'

function Crescent({ className }: { className: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M20.4 14.6A9 9 0 1 1 9.4 3.6a7.2 7.2 0 0 0 11 11z" fill="currentColor" />
    </svg>
  )
}

/** A thin rule with an eight-pointed star at its centre. */
function Ornament(): ReactElement {
  return (
    <div className="flex items-center justify-center gap-4 py-2 text-accent-soft" aria-hidden="true">
      <span className="h-px w-16 bg-current opacity-60 sm:w-24" />
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </svg>
      <span className="h-px w-16 bg-current opacity-60 sm:w-24" />
    </div>
  )
}

const order = (value: number): CSSProperties => ({ '--rise-order': value }) as CSSProperties

/** A page of remembrance. It stands apart from the duas and adhkar collections. */
export function AboutPage(): ReactElement {
  return (
    <div className="mx-auto max-w-[720px] pb-6">
      <PageHeader title={ABOUT_TEXT.title} subtitle={ABOUT_TEXT.subtitle} backTo="/" />

      <section className="rise-in relative overflow-hidden rounded-[28px] bg-linear-to-bl from-[#14705a] via-[#0d4a3a] to-[#072a20] px-6 py-12 text-center shadow-card sm:px-10 sm:py-14" style={order(0)}>
        <div className="pattern-stars pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />
        <div className="relative">
          <Crescent className="mx-auto size-7 text-[#d9bd7f]" />
          <h2 className="mt-5 font-scripture text-[1.9rem] leading-[1.9] text-[#fdfaf1] sm:text-[2.3rem]">{ABOUT_TEXT.heading}</h2>
        </div>
      </section>

      <section className="rise-in mt-5 rounded-[28px] border border-line bg-surface px-6 py-8 shadow-card sm:px-10 sm:py-10" style={order(1)}>
        <div className="mx-auto max-w-[34rem] space-y-6 text-[1.06rem] leading-[2.15] text-ink/90">
          {ABOUT_TEXT.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <div className="rise-in mt-6" style={order(2)}>
        <Ornament />
      </div>

      <section className="rise-in mt-4 rounded-[28px] bg-linear-to-bl from-[#14705a] via-[#0d4a3a] to-[#072a20] px-6 py-9 text-center shadow-card sm:px-10" style={order(3)}>
        <div className="mx-auto max-w-[32rem] space-y-3">
          {ABOUT_TEXT.supplications.map((supplication) => <p key={supplication} className="scripture text-[#fdfaf1]">{supplication}</p>)}
        </div>
      </section>
    </div>
  )
}
