import { ClipboardPaste, Copy, Download, Upload } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import { getEntry } from '../../content/index.ts'
import { localDayKey } from '../../domain/daily/daily.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import {
  backupFileName, createBackup, mergeBackup, parseBackupText, previewImport, serializeBackup,
  type Backup, type BackupData, type BackupError, type ImportPreview,
} from '../../storage/backup.ts'
import { favoritesStore, prefsStore, progressStore, tasbihStore } from '../../storage/stores.ts'
import { Dialog } from '../../ui/Dialog.tsx'

type Feedback = { kind: 'success' | 'error'; text: string }
type Pending = { backup: Backup; includePrefs: boolean }

const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-primary/40 hover:text-primary'

function readDevice(): BackupData {
  return { favorites: favoritesStore.get(), tasbih: tasbihStore.get(), progress: progressStore.get(), prefs: prefsStore.get() }
}

function writeDevice(data: BackupData): void {
  favoritesStore.set([...data.favorites])
  tasbihStore.set(data.tasbih)
  progressStore.set(data.progress)
  prefsStore.set(data.prefs)
}

/** True when the app runs from the home screen, where its storage is separate from the browser's. */
function isInstalledApp(): boolean {
  const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches
  const isIosHomeScreen = 'standalone' in navigator && navigator.standalone === true
  return isStandaloneDisplay || isIosHomeScreen
}

function formatMoment(iso: string): string {
  return new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
}

function PreviewLine({ value, label }: { value: number; label: string }): ReactElement | null {
  if (value === 0) return null
  return (
    <li className="flex items-baseline gap-2">
      <span className="min-w-8 text-base font-semibold tabular-nums text-ink">{formatNumber(value)}</span>
      <span>{label}</span>
    </li>
  )
}

export function BackupSection(): ReactElement {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [pasted, setPasted] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const pasteId = useId()
  const today = localDayKey(new Date())

  const fail = (error: BackupError | 'unreadable'): void => setFeedback({ kind: 'error', text: t.backup.errors[error] })

  const currentFile = (): string => serializeBackup(createBackup(readDevice(), new Date(), __APP_VERSION__))

  const exportFile = (): void => {
    const url = URL.createObjectURL(new Blob([currentFile()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName(new Date())
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setFeedback({ kind: 'success', text: t.backup.exported })
  }

  const copyData = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(currentFile())
      setFeedback({ kind: 'success', text: t.backup.copied })
    } catch (error) {
      console.warn('copying the backup failed', error)
      setFeedback({ kind: 'error', text: t.backup.copyFailed })
    }
  }

  // Nothing is written here. A valid file only opens the preview.
  const review = (text: string): void => {
    const result = parseBackupText(text)
    if (!result.ok) {
      console.warn('backup rejected', { error: result.error, detail: result.detail })
      fail(result.error)
      return
    }
    setFeedback(null)
    setPending({ backup: result.backup, includePrefs: false })
  }

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      review(await file.text())
    } catch (error) {
      console.warn('the chosen file could not be read', error)
      fail('unreadable')
    }
  }

  const preview: ImportPreview | null = pending
    ? previewImport(readDevice(), pending.backup, { includePrefs: pending.includePrefs, today }, (id) => getEntry(id) !== undefined)
    : null

  const apply = (): void => {
    if (!pending || !preview) return
    writeDevice(mergeBackup(readDevice(), pending.backup.data, { includePrefs: pending.includePrefs, today }))
    const parts = [
      `${t.backup.done}.`,
      `${formatNumber(preview.favorites.toAdd)} ${t.backup.doneFavorites}،`,
      `${formatNumber(preview.tasbih.toAdd + preview.tasbih.toRaise)} ${t.backup.doneCounters}.`,
      pending.includePrefs && preview.prefsDiffer ? t.backup.donePrefs : '',
    ]
    setFeedback({ kind: 'success', text: parts.filter(Boolean).join(' ') })
    setPending(null)
    setIsPasting(false)
    setPasted('')
  }

  return (
    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-card sm:p-6" aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-3 text-base font-semibold text-ink">{t.backup.title}</h2>
      <p className="text-sm leading-relaxed text-ink/90">{t.backup.intro}</p>
      <p className="mt-3 rounded-2xl bg-surface-alt/60 px-4 py-3 text-xs leading-relaxed text-ink/85">
        {isInstalledApp() ? t.backup.installed : t.backup.inBrowser}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={exportFile}>
          <Download className="size-4" aria-hidden="true" />
          {t.backup.exportFile}
        </button>
        <button type="button" className={buttonClass} onClick={() => void copyData()}>
          <Copy className="size-4" aria-hidden="true" />
          {t.backup.copyData}
        </button>
        <button type="button" className={buttonClass} onClick={() => fileInput.current?.click()}>
          <Upload className="size-4" aria-hidden="true" />
          {t.backup.importFile}
        </button>
        <button type="button" className={buttonClass} aria-expanded={isPasting} onClick={() => setIsPasting((current) => !current)}>
          <ClipboardPaste className="size-4" aria-hidden="true" />
          {t.backup.pasteData}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label={t.backup.importFile}
          onChange={(event) => void onFileChosen(event)}
        />
      </div>

      {isPasting && (
        <div className="mt-4">
          <label htmlFor={pasteId} className="mb-1.5 block text-sm text-muted">{t.backup.pasteLabel}</label>
          <textarea
            id={pasteId}
            dir="ltr"
            rows={4}
            value={pasted}
            placeholder={t.backup.pastePlaceholder}
            onChange={(event) => setPasted(event.target.value)}
            className="w-full rounded-2xl border border-line bg-bg px-3 py-2 font-mono text-xs text-ink outline-none placeholder:text-muted/70 focus:border-primary/50"
          />
          <button type="button" className={`${buttonClass} mt-2`} disabled={pasted.trim() === ''} onClick={() => review(pasted)}>
            {t.backup.review}
          </button>
        </div>
      )}

      <p
        role={feedback?.kind === 'error' ? 'alert' : 'status'}
        className={feedback
          ? `mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed ${feedback.kind === 'error' ? 'border border-danger/40 text-danger' : 'bg-primary-soft text-primary'}`
          : 'sr-only'}
      >
        {feedback?.text ?? ''}
      </p>

      <Dialog isOpen={pending !== null} onClose={() => setPending(null)} labelledBy={`${titleId}-preview`}>
        {pending && preview && (
          <div className="p-6">
            <h3 id={`${titleId}-preview`} className="text-lg font-semibold text-ink">{t.backup.previewTitle}</h3>
            <p className="mt-1 text-xs text-muted">{t.backup.exportedOn}: {formatMoment(preview.exportedAt)}</p>

            {preview.changesNothing ? (
              <p className="mt-4 text-sm leading-relaxed text-ink">{t.backup.changesNothing}</p>
            ) : (
              <div className="mt-4 space-y-4 text-sm text-ink/90">
                <div>
                  <h4 className="mb-1 font-medium text-ink">{t.backup.favoritesHeading}</h4>
                  <ul className="space-y-1">
                    <PreviewLine value={preview.favorites.toAdd} label={t.backup.favoritesToAdd} />
                    <PreviewLine value={preview.favorites.alreadySaved} label={t.backup.favoritesAlready} />
                    <PreviewLine value={preview.favorites.notInThisVersion} label={t.backup.favoritesUnavailable} />
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-ink">{t.backup.tasbihHeading}</h4>
                  <ul className="space-y-1">
                    <PreviewLine value={preview.tasbih.toAdd} label={t.backup.countersToAdd} />
                    <PreviewLine value={preview.tasbih.toRaise} label={t.backup.countersToRaise} />
                    <PreviewLine value={preview.tasbih.unchanged} label={t.backup.countersUnchanged} />
                  </ul>
                  <p className="mt-1 text-xs text-muted">
                    {t.backup.lifetime}: {formatNumber(preview.tasbih.lifetimeBefore)} ← {formatNumber(preview.tasbih.lifetimeAfter)}
                  </p>
                </div>
                {preview.appliesTodaysProgress && <p>{t.backup.todaysProgress}</p>}
              </div>
            )}

            {preview.prefsDiffer && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-alt/60 px-4 py-3 text-sm leading-relaxed text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-primary"
                  checked={pending.includePrefs}
                  onChange={(event) => setPending({ ...pending, includePrefs: event.target.checked })}
                />
                {t.backup.includePrefs}
              </label>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted">{t.backup.nothingRemoved}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" autoFocus className="rounded-full px-5 py-2.5 text-sm text-muted hover:bg-surface-alt" onClick={() => setPending(null)}>
                {preview.changesNothing ? t.backup.close : t.backup.cancel}
              </button>
              {!preview.changesNothing && (
                <button type="button" className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-on-action" onClick={apply}>
                  {t.backup.apply}
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
