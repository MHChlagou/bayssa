import type { ReactElement, ReactNode } from 'react'
import { BottomNav, Sidebar } from './Navigation.tsx'
import { TributeBand } from './TributeBand.tsx'

/** The navigation and page container. Shared by the live app and the build-time shell. */
export function AppFrame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="min-h-dvh lg:ps-[272px] lg:pt-(--tribute-height)">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-action focus:px-4 focus:py-2 focus:text-on-action">
        تخطي إلى المحتوى
      </a>
      <div className="lg:fixed lg:inset-x-0 lg:top-0 lg:z-40">
        <TributeBand />
      </div>
      <Sidebar />
      <main id="main" className="mx-auto w-full max-w-[1040px] px-4 pb-32 pt-3 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

/**
 * Where notices appear: above the bottom bar on small screens, in the corner on desktop.
 * The build-time shell renders it empty, so the live app finds the same element in place.
 */
export function NoticeStack({ children }: { children?: ReactNode }): ReactElement {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-28 z-50 mx-auto flex max-w-sm flex-col gap-2 *:pointer-events-auto lg:bottom-6 lg:start-auto lg:end-6 lg:mx-0 lg:w-96">
      {children}
    </div>
  )
}
