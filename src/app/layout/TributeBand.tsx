import { useState, type ReactElement } from 'react'
import { t } from '../../i18n/t.ts'
import { TRIBUTE_PHRASE } from '../dedication.ts'

const REPETITIONS_PER_GROUP = 8

function Crescent(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="tribute-crescent" aria-hidden="true">
      <path d="M20.4 14.6A9 9 0 1 1 9.4 3.6a7.2 7.2 0 0 0 11 11z" fill="currentColor" />
    </svg>
  )
}

function Group(): ReactElement {
  return (
    <div className="tribute-group">
      {Array.from({ length: REPETITIONS_PER_GROUP }, (_, index) => (
        <span key={index} className="tribute-item">
          <span className="tribute-phrase">{TRIBUTE_PHRASE}</span>
          <Crescent />
        </span>
      ))}
    </div>
  )
}

/**
 * The dedication at the top of every screen. One line that drifts slowly and
 * continuously. It stands still when the device asks for reduced motion, and
 * stops when hovered or when its control is used.
 *
 * Assistive technology is given the phrase once: the moving copies are hidden.
 */
export function TributeBand(): ReactElement {
  const [isPaused, setIsPaused] = useState(false)
  return (
    <aside className="tribute" aria-label={t.tribute.label} data-paused={isPaused}>
      <p className="sr-only">{TRIBUTE_PHRASE}</p>
      <div className="tribute-still" aria-hidden="true">
        <Crescent />
        <span className="tribute-phrase">{TRIBUTE_PHRASE}</span>
        <Crescent />
      </div>
      <div className="tribute-viewport" aria-hidden="true">
        <div className="tribute-track">
          <Group />
          <Group />
        </div>
      </div>
      <button
        type="button"
        className="tribute-control"
        aria-pressed={isPaused}
        aria-label={isPaused ? t.tribute.resume : t.tribute.pause}
        onClick={() => setIsPaused((current) => !current)}
      />
    </aside>
  )
}
