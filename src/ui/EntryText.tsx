import type { ReactElement } from 'react'
import { basmala } from '../content/index.ts'
import type { Entry, QuranSegment } from '../content/schema.ts'
import { formatAyahNumber, t } from '../i18n/t.ts'

const SURAHS_WITHOUT_BASMALA = new Set([1, 9])
const END_OF_AYAH = '\u06DD'

function opensSurah(segment: QuranSegment): boolean {
  return segment.ayah === 1 && segment.isPartial !== true && !SURAHS_WITHOUT_BASMALA.has(segment.surah)
}

type Block =
  | { kind: 'plain'; segment: Exclude<Entry['segments'][number], QuranSegment>; key: string }
  | { kind: 'passage'; ayahs: QuranSegment[]; key: string }

/** Groups consecutive ayahs of one surah into a passage, so they read as continuous lines the way a mushaf prints them. */
function toBlocks(entry: Entry): Block[] {
  const blocks: Block[] = []
  entry.segments.forEach((segment, index) => {
    if (segment.type !== 'quran') {
      blocks.push({ kind: 'plain', segment, key: `${segment.type}-${index}` })
      return
    }
    const last = blocks.at(-1)
    const previous = last?.kind === 'passage' ? last.ayahs.at(-1) : undefined
    if (last?.kind === 'passage' && previous?.surah === segment.surah && !opensSurah(segment)) last.ayahs.push(segment)
    else blocks.push({ kind: 'passage', ayahs: [segment], key: `quran-${index}` })
  })
  return blocks
}

/**
 * Renders an entry's segments in order. Quran text is printed exactly as
 * stored, inside a frame, with the ayah number ornament as a separate,
 * decorative element.
 */
export function EntryText({ entry }: { entry: Entry }): ReactElement {
  return (
    <div className="space-y-3">
      {toBlocks(entry).map((block) => {
        if (block.kind === 'plain') {
          return block.segment.type === 'note'
            ? (
                <p key={block.key} className="border-s-2 border-accent-soft/70 ps-3 text-[0.82rem] leading-relaxed text-muted">
                  {block.segment.text}
                </p>
              )
            : <p key={block.key} className="scripture text-ink">{block.segment.text}</p>
        }
        const first = block.ayahs[0]
        return (
          <div key={block.key} className="mushaf">
            {first !== undefined && opensSurah(first) && (
              <p className="scripture scripture-quran pb-1 text-center text-primary" aria-label="البسملة">{basmala}</p>
            )}
            <p className="scripture scripture-quran mushaf-lines text-ink" lang="ar">
              {block.ayahs.map((ayah, index) => (
                <span key={`${ayah.surah}-${ayah.ayah}`}>
                  {index > 0 && ' '}
                  {ayah.text}
                  {ayah.isPartial !== true && (
                    <span className="ps-1 text-accent" role="img" aria-label={`${t.reader.ofAyah} ${formatAyahNumber(ayah.ayah)}`}>
                      {END_OF_AYAH}{formatAyahNumber(ayah.ayah)}
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>
        )
      })}
    </div>
  )
}
