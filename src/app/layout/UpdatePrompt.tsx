import { useEffect, type ReactElement } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { t } from '../../i18n/t.ts'

const OFFLINE_NOTE_VISIBLE_MS = 4500

/**
 * New versions wait until the user accepts, so a dhikr in progress is never
 * interrupted by a reload.
 */
export function UpdatePrompt(): ReactElement | null {
  const {
    needRefresh: [isUpdateReady, setIsUpdateReady],
    offlineReady: [isOfflineReady, setIsOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('service worker registration failed', error)
    },
  })

  // The "ready offline" note is informational, so it leaves on its own. An update waits for an answer.
  useEffect(() => {
    if (!isOfflineReady) return
    const timer = window.setTimeout(() => setIsOfflineReady(false), OFFLINE_NOTE_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [isOfflineReady, setIsOfflineReady])

  if (!isUpdateReady && !isOfflineReady) return null
  const dismiss = (): void => {
    setIsUpdateReady(false)
    setIsOfflineReady(false)
  }

  return (
    <div
      role="status"
      className="toast-enter fixed inset-x-3 bottom-28 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-float lg:bottom-6 lg:start-auto lg:end-6 lg:mx-0"
    >
      <p className="flex-1 text-sm text-ink">{isUpdateReady ? t.pwa.updateReady : t.pwa.offlineReady}</p>
      {isUpdateReady && (
        <button type="button" onClick={() => void updateServiceWorker(true)} className="rounded-full bg-action px-4 py-1.5 text-sm font-medium text-on-action">
          {t.pwa.reload}
        </button>
      )}
      <button type="button" onClick={dismiss} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-alt">
        {isUpdateReady ? t.pwa.dismiss : t.actions.close}
      </button>
    </div>
  )
}
