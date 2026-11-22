import { Share, SquarePlus } from 'lucide-react'
import { useEffect, useState, type ReactElement } from 'react'
import { t } from '../../i18n/t.ts'
import { createStore } from '../../storage/localStore.ts'
import { usePersistentState } from '../../storage/usePersistentState.ts'

/** The event Chromium browsers fire when the app can be installed. It is not in the standard DOM types. */
type InstallEvent = Event & { prompt: () => Promise<unknown> }

const isInstallEvent = (event: Event): event is InstallEvent => 'prompt' in event && typeof event.prompt === 'function'

const installNoticeStore = createStore<{ isDismissed: boolean }>({
  name: 'install-notice',
  defaults: { isDismissed: false },
  parse: (raw) => ({ isDismissed: typeof raw === 'object' && raw !== null && 'isDismissed' in raw && raw.isDismissed === true }),
})

function isRunningInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

/** iPhone and iPad offer no install prompt: the app is added from the share sheet. */
function isIosBrowser(): boolean {
  const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIosDevice && !isRunningInstalled()
}

type Offer = { kind: 'none' } | { kind: 'ios' } | { kind: 'prompt'; event: InstallEvent }

/**
 * Offers installation without being asked: a button where the browser can
 * install the app itself (Android, desktop Chrome and Edge), and the two
 * steps to follow on iPhone and iPad. It goes away once the app is
 * installed or the person declines.
 */
export function InstallPrompt(): ReactElement | null {
  const [notice, setNotice] = usePersistentState(installNoticeStore)
  const [offer, setOffer] = useState<Offer>({ kind: 'none' })

  useEffect(() => {
    const onInstallable = (event: Event): void => {
      if (!isInstallEvent(event)) return
      // Keep the browser's own small banner away: the app shows its own button.
      event.preventDefault()
      setOffer({ kind: 'prompt', event })
    }
    const onInstalled = (): void => setOffer({ kind: 'none' })
    window.addEventListener('beforeinstallprompt', onInstallable)
    window.addEventListener('appinstalled', onInstalled)
    // The device is known only in the browser, so this is decided after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the device once, on mount
    if (isIosBrowser()) setOffer({ kind: 'ios' })
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (offer.kind === 'none' || notice.isDismissed) return null
  const dismiss = (): void => setNotice({ isDismissed: true })
  const install = async (event: InstallEvent): Promise<void> => {
    setOffer({ kind: 'none' })
    try {
      await event.prompt()
    } catch (error) {
      console.warn('the install prompt could not be shown', error)
    }
  }

  return (
    <section aria-label={offer.kind === 'ios' ? t.pwa.iosTitle : t.pwa.installTitle} className="toast-enter rounded-2xl border border-line bg-surface px-4 py-3 shadow-float">
      <p className="text-sm font-medium text-ink">{offer.kind === 'ios' ? t.pwa.iosTitle : t.pwa.installTitle}</p>
      {offer.kind === 'ios' ? (
        <ol className="mt-2 space-y-1.5 text-sm text-ink/90">
          <li className="flex items-center gap-2">
            <Share className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t.pwa.iosStepShare}
          </li>
          <li className="flex items-center gap-2">
            <SquarePlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t.pwa.iosStepAdd}
          </li>
        </ol>
      ) : (
        <p className="mt-1 text-sm text-muted">{t.pwa.installBody}</p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={dismiss} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-alt">
          {offer.kind === 'ios' ? t.actions.close : t.pwa.notNow}
        </button>
        {offer.kind === 'prompt' && (
          <button type="button" onClick={() => void install(offer.event)} className="rounded-full bg-action px-4 py-1.5 text-sm font-medium text-on-action">
            {t.pwa.install}
          </button>
        )}
      </div>
    </section>
  )
}
