import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing the #root element')

// The build places a static copy of the home screen inside #root. On the home
// route the app adopts that HTML, so nothing on screen is rebuilt. On any other
// route the shell does not match, and the app renders from scratch.
const isHomeRoute = window.location.hash === '' || window.location.hash === '#/'
const hasShell = root.firstElementChild !== null

if (hasShell && isHomeRoute) {
  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>,
    {
      onRecoverableError(error) {
        // React falls back to a full client render, so the app still works. Say why it happened.
        console.warn('the prerendered shell did not match the app and was re-rendered', error)
      },
    },
  )
} else {
  root.replaceChildren()
  delete document.documentElement.dataset.skipShell
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Ask the browser not to evict favorites and tasbih progress under storage pressure.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch((error: unknown) => console.warn('persistent storage request failed', error))
}
