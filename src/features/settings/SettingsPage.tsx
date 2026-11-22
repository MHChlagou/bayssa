import { Minus, Plus } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { Link } from 'react-router'
import { ABOUT_TEXT } from '../../app/about-text.ts'
import { DEDICATION_SUPPLICATION } from '../../app/dedication.ts'
import { isApproximateMatch } from '../../content/describe.ts'
import { allEntries, basmala, contentSources } from '../../content/index.ts'
import type { Entry } from '../../content/schema.ts'
import { clampHijriOffset, formatHijriDate, MAX_HIJRI_OFFSET_DAYS } from '../../domain/hijri/hijri.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { NUMERALS, prefsStore, TEXT_SCALES, THEMES } from '../../storage/stores.ts'
import { usePersistentState } from '../../storage/usePersistentState.ts'
import { IconButton } from '../../ui/IconButton.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'
import { BackupSection } from './BackupSection.tsx'
import { Segmented } from '../../ui/Segmented.tsx'

function Group({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-card sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

const MATCH_GROUPS = ['quran', 'exact', 'approximate'] as const
type MatchGroup = (typeof MATCH_GROUPS)[number]

function matchGroup(entry: Entry): MatchGroup {
  if (entry.kind === 'quran') return 'quran'
  return isApproximateMatch(entry) ? 'approximate' : 'exact'
}

const matchCounts: Record<MatchGroup, number> = { quran: 0, exact: 0, approximate: 0 }
for (const entry of allEntries) matchCounts[matchGroup(entry)] += 1

function offsetLabel(offsetDays: number): string {
  if (offsetDays === 0) return t.settings.days.zero
  return `${formatNumber(Math.abs(offsetDays))} ${offsetDays > 0 ? t.settings.days.plus : t.settings.days.minus}`
}

export function SettingsPage(): ReactElement {
  const [prefs, setPrefs] = usePersistentState(prefsStore)
  const hijri = formatHijriDate(new Date(), { offsetDays: prefs.hijriOffsetDays, numerals: prefs.numerals })
  const shiftHijri = (delta: number): void =>
    setPrefs((current) => ({ ...current, hijriOffsetDays: clampHijriOffset(current.hijriOffsetDays + delta) }))

  return (
    <div className="mx-auto max-w-[720px] space-y-4">
      <PageHeader title={t.settings.title} backTo="/" actions={<span />} />

      <section aria-label={t.settings.dedication} className="relative overflow-hidden rounded-[26px] bg-linear-to-bl from-[#14705a] via-[#0d4a3a] to-[#072a20] px-6 py-7 text-center shadow-card">
        <p className="text-xs font-medium tracking-wide text-[#e6cf98]">{t.settings.dedication}</p>
        <p className="scripture mt-2 text-[#fdfaf1]">{DEDICATION_SUPPLICATION}</p>
        <Link to="/about" className="mt-3 inline-block rounded-full border border-[#e6cf98]/50 px-4 py-1.5 text-sm text-[#e6cf98] transition-colors duration-200 hover:bg-[#e6cf98]/10">
          {ABOUT_TEXT.title}
        </Link>
      </section>

      <Group title={t.settings.appearance}>
        <div>
          <p className="mb-2 text-sm text-muted">{t.settings.theme}</p>
          <Segmented
            label={t.settings.theme}
            options={THEMES.map((value) => ({ value, label: t.settings.themes[value] }))}
            value={prefs.theme}
            onChange={(theme) => setPrefs((current) => ({ ...current, theme }))}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">{t.settings.numerals}</p>
          <Segmented
            label={t.settings.numerals}
            options={NUMERALS.map((value) => ({ value, label: t.settings.numeralSamples[value] }))}
            value={prefs.numerals}
            onChange={(numerals) => setPrefs((current) => ({ ...current, numerals }))}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">{t.settings.textSize}</p>
          <Segmented
            label={t.settings.textSize}
            options={TEXT_SCALES.map((_, index) => ({ value: index, label: t.settings.textSizes[index] ?? '' }))}
            value={prefs.textScaleIndex}
            onChange={(textScaleIndex) => setPrefs((current) => ({ ...current, textScaleIndex }))}
          />
          <p className="scripture scripture-quran mt-4 rounded-2xl bg-surface-alt/60 px-4 py-2 text-center text-ink" aria-label={t.settings.preview}>
            {basmala}
          </p>
        </div>
      </Group>

      <Group title={t.settings.hijri}>
        {hijri === null ? (
          <p className="text-sm text-muted">{t.settings.hijriUnavailable}</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-medium text-ink" aria-live="polite">{hijri}</p>
                <p className="text-xs text-muted">{t.settings.hijriAdjust}: {offsetLabel(prefs.hijriOffsetDays)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-surface-alt p-1">
                <IconButton icon={Minus} label={t.settings.days.minus} onClick={() => shiftHijri(-1)} disabled={prefs.hijriOffsetDays <= -MAX_HIJRI_OFFSET_DAYS} className="disabled:opacity-35" />
                <IconButton icon={Plus} label={t.settings.days.plus} onClick={() => shiftHijri(1)} disabled={prefs.hijriOffsetDays >= MAX_HIJRI_OFFSET_DAYS} className="disabled:opacity-35" />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">{t.settings.hijriHint}</p>
          </>
        )}
      </Group>

      <BackupSection />

      <Group title={t.settings.sources}>
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-ink/90 marker:text-accent-soft">
          {t.settings.sourcesBody
            .filter((line) => contentSources.some((source) => source.id === line.source))
            .map((line) => (
              <li key={line.source}>
                {line.text}
                {line.source === 'tanzil-uthmani' && (
                  <>
                    {' '}
                    <a href="https://tanzil.net" target="_blank" rel="noreferrer" dir="ltr" className="font-medium text-primary underline underline-offset-4">
                      {t.settings.tanzilLink}
                    </a>
                  </>
                )}
              </li>
            ))}
        </ul>
      </Group>

      <Group title={t.settings.method}>
        <div role="note" className="rounded-2xl border border-accent-soft/60 bg-accent-soft/15 px-4 py-3">
          <p className="text-sm font-semibold text-ink">{t.settings.notReviewedTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/90">{t.settings.notReviewed}</p>
        </div>
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-ink/90 marker:text-accent-soft">
          {t.settings.methodBody.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <dl className="grid grid-flow-col auto-cols-fr gap-2 text-center">
          {MATCH_GROUPS.filter((group) => matchCounts[group] > 0).map((group) => (
            <div key={group} className="rounded-2xl bg-surface-alt/60 px-2 py-3">
              <dd className="text-xl font-medium tabular-nums text-ink">{formatNumber(matchCounts[group])}</dd>
              <dt className="text-xs leading-snug text-muted">{t.settings.matchStats[group]}</dt>
            </div>
          ))}
        </dl>
      </Group>

      <Group title={t.settings.privacy}>
        <p className="text-sm leading-relaxed text-ink/90">{t.settings.privacyBody}</p>
        <a href={`${import.meta.env.BASE_URL}licenses.txt`} className="inline-block text-sm font-medium text-primary underline underline-offset-4">
          {t.settings.softwareLicenses}
        </a>
      </Group>

      <p className="pb-2 text-center text-xs text-muted">
        {t.appName} · {t.settings.version} {__APP_VERSION__} · {formatNumber(allEntries.length)} {t.library.count.few}
      </p>
    </div>
  )
}
