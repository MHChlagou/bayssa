import type { ReactElement } from 'react'
import { basmala } from '../content/index.ts'
import type { Entry, QuranSegment } from '../content/schema.ts'
import { formatAyahNumber, t } from '../i18n/t.ts'

const SURAHS_WITHOUT_BASMALA = new Set([1, 9])
const END_OF_AYAH = '\u06DD'

function opensSurah(segment: QuranSegment): boolean {
  return segment.ayah === 1 && segment.isPartial !== true && !SURAHS_WITHOUT_BASMALA.has(segment.surah)
}

/**
 * Renders an entry's segments in order. Quran text is printed exactly as
 * stored: the ayah number ornament is a separate, decorative element.
 */
export function EntryText({ entry }: { entry: Entry }): ReactElement {
  return (
    <div className="space-y-3">
      {entry.segments.map((segment, index) => {
        const key = `${segment.type}-${index}`
        if (segment.type === 'note') {
          return (
            <p key={key} className="border-s-2 border-accent-soft/70 ps-3 text-[0.82rem] leading-relaxed text-muted">
              {segment.text}
            </p>
          )
        }
        if (segment.type === 'text') {
          return <p key={key} className="scripture text-ink">{segment.text}</p>
        }
        const previous = entry.segments[index - 1]
        const continuesPassage = previous?.type === 'quran' && previous.surah === segment.surah
        return (
          <div key={key} className={continuesPassage ? '-mt-3' : undefined}>
            {opensSurah(segment) && (
              <p className="scripture scripture-quran pb-1 text-center text-primary" aria-label="البسملة">{basmala}</p>
            )}
            <p className="scripture scripture-quran text-ink" lang="ar">
              {segment.text}
              {segment.isPartial !== true && (
                <span className="ps-1 text-accent" role="img" aria-label={`${t.reader.ofAyah} ${formatAyahNumber(segment.ayah)}`}>
                  {END_OF_AYAH}{formatAyahNumber(segment.ayah)}
                </span>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
