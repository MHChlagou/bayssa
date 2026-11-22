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
