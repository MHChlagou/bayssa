/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string

interface Navigator {
  /** Set by Safari on iOS when a site runs from the home screen. */
  readonly standalone?: boolean
}
