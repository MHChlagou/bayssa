import { Suspense, useEffect, type ReactElement, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useEntranceAnimation } from '../boot.ts'
import { AppFrame, NoticeStack } from './AppFrame.tsx'
import { InstallPrompt } from './InstallPrompt.tsx'
import { UpdatePrompt } from './UpdatePrompt.tsx'

export function PageSkeleton(): ReactElement {
  return (
    <div className="space-y-4 pt-4" aria-hidden="true">
      <div className="h-9 w-40 animate-[soft-pulse_1.6s_ease-in-out_infinite] rounded-xl bg-surface-alt" />
      <div className="h-44 animate-[soft-pulse_1.6s_ease-in-out_infinite] rounded-[26px] bg-surface-alt" />
      <div className="h-28 animate-[soft-pulse_1.6s_ease-in-out_infinite] rounded-[26px] bg-surface-alt" />
    </div>
  )
}

/** Shown while the first route's code is still loading, for example on a deep link. */
export function InitialLoad(): ReactElement {
  return (
    <AppFrame>
      <PageSkeleton />
    </AppFrame>
  )
}

function PageTransition({ children }: { children: ReactNode }): ReactElement {
  const shouldAnimate = useEntranceAnimation()
  return <div className={shouldAnimate ? 'page-enter' : undefined}>{children}</div>
}

export function AppShell(): ReactElement {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <AppFrame>
        <PageTransition key={pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </AppFrame>
      <NoticeStack>
        <InstallPrompt />
        <UpdatePrompt />
      </NoticeStack>
    </>
  )
}
