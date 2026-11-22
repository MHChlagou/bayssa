import { Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { HomePage } from '../features/home/HomePage.tsx'
import { StaticShellContext } from './boot.ts'
import { AppFrame } from './layout/AppFrame.tsx'

/**
 * HTML of the home screen without anything that depends on the day or on the
 * user's saved data. The build places it inside #root so the first paint does
 * not wait for JavaScript. The app hydrates it in place when it starts.
 */
export function renderShell(): string {
  // The tree below must produce the same DOM as the app's first render on the
  // home route (see AppShell), because the app hydrates this HTML in place.
  const html = renderToString(
    <StaticShellContext value>
      <MemoryRouter initialEntries={['/']}>
        <AppFrame>
          <div>
            <Suspense fallback={null}>
              <HomePage />
            </Suspense>
          </div>
        </AppFrame>
      </MemoryRouter>
    </StaticShellContext>,
  )
  // The app uses hash routes: rewrite links so a tap before the app starts still lands on the right screen.
  return html.replaceAll('href="/', 'href="#/')
}
