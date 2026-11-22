import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createServer, type HtmlTagDescriptor, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the site from https://<user>.github.io/muslim-daily/
const BASE_PATH = '/muslim-daily/'

// The first screen is Arabic text in these two fonts, so they are fetched
// alongside the HTML instead of after the stylesheet is parsed.
const PRELOADED_FONTS = [/amiri-arabic-400-normal.*\.woff2$/, /readex-pro-arabic-wght-normal.*\.woff2$/]

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context): HtmlTagDescriptor[] {
        return Object.keys(context.bundle ?? {})
          .filter((file) => PRELOADED_FONTS.some((pattern) => pattern.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: BASE_PATH + file, crossorigin: '' },
            injectTo: 'head',
          }))
      },
    },
  }
}

/**
 * Public address of the deployed site, with a trailing slash, for example
 * https://example.github.io/muslim-daily/. Link previews on other sites need
 * absolute URLs. The deploy workflow sets it. Local builds leave it unset.
 */
function readSiteUrl(): URL | undefined {
  const raw = process.env.SITE_URL
  if (raw === undefined || raw === '') return undefined
  if (!raw.endsWith('/') || !URL.canParse(raw)) throw new Error(`SITE_URL must be an absolute URL ending in "/", got "${raw}"`)
  return new URL(raw)
}

function siteMeta(): Plugin {
  const siteUrl = readSiteUrl()
  return {
    name: 'site-meta',
    transformIndexHtml(): HtmlTagDescriptor[] {
      const image = siteUrl ? new URL('og-image.png', siteUrl).href : `${BASE_PATH}og-image.png`
      const tags: HtmlTagDescriptor[] = [
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ]
      if (siteUrl) {
        tags.push({ tag: 'link', attrs: { rel: 'canonical', href: siteUrl.href }, injectTo: 'head' })
        tags.push({ tag: 'meta', attrs: { property: 'og:url', content: siteUrl.href }, injectTo: 'head' })
      }
      return tags
    },
  }
}

type SplashLink = { href: string; media: string }

function isSplashLink(value: unknown): value is SplashLink {
  return typeof value === 'object' && value !== null && 'href' in value && 'media' in value
    && typeof value.href === 'string' && typeof value.media === 'string'
}

/** Adds the iOS launch images written by scripts/generate-splash.ts. */
function appleSplashScreens(): Plugin {
  const parsed: unknown = JSON.parse(readFileSync(new URL('./src/app/splash-screens.json', import.meta.url), 'utf8'))
  if (!Array.isArray(parsed) || !parsed.every(isSplashLink)) throw new Error('src/app/splash-screens.json is malformed: run "npm run icons"')
  const links: SplashLink[] = parsed
  return {
    name: 'apple-splash-screens',
    transformIndexHtml(): HtmlTagDescriptor[] {
      return links.map(({ href, media }) => ({
        tag: 'link',
        attrs: { rel: 'apple-touch-startup-image', href: BASE_PATH + href, media },
        injectTo: 'head',
      }))
    },
  }
}

const EMPTY_ROOT = '<div id="root"></div>'

/**
 * Renders the home screen to static HTML at build time and places it inside
 * #root, so the first paint does not wait for the JavaScript bundle.
 */
function prerenderShell(): Plugin {
  return {
    name: 'prerender-shell',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      async handler(html): Promise<string> {
        if (!html.includes(EMPTY_ROOT)) throw new Error('prerender-shell: index.html has no empty #root element')
        const server = await createServer({
          configFile: false,
          base: BASE_PATH,
          plugins: [react()],
          server: { middlewareMode: true, hmr: false },
          appType: 'custom',
          optimizeDeps: { noDiscovery: true },
          logLevel: 'error',
        })
        try {
          const module: unknown = await server.ssrLoadModule('/src/app/shell.tsx')
          if (typeof module !== 'object' || module === null || !('renderShell' in module) || typeof module.renderShell !== 'function') {
            throw new Error('prerender-shell: src/app/shell.tsx must export renderShell()')
          }
          const shell: unknown = module.renderShell()
          if (typeof shell !== 'string' || shell === '') throw new Error('prerender-shell: renderShell() returned nothing')
          return html.replace(EMPTY_ROOT, `<div id="root">${shell}</div>`)
        } finally {
          await server.close()
        }
      },
    },
  }
}

// The "update-fixture" mode builds a second copy that reports a different
// version, so the end-to-end tests can publish an update while a page is open.
export default defineConfig(({ mode }) => ({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts(),
    siteMeta(),
    appleSplashScreens(),
    prerenderShell(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: BASE_PATH,
        name: 'المسلم اليومي · أذكار وأدعية',
        short_name: 'المسلم اليومي',
        description: 'أذكار الصباح والمساء، الأدعية القرآنية والنبوية، والمسبحة الإلكترونية. يعمل دون اتصال.',
        lang: 'ar',
        dir: 'rtl',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF6EC',
        theme_color: '#0B3D2E',
        categories: ['lifestyle', 'books', 'education'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'أذكار الصباح', url: `${BASE_PATH}#/adhkar/morning` },
          { name: 'أذكار المساء', url: `${BASE_PATH}#/adhkar/evening` },
          { name: 'المسبحة', url: `${BASE_PATH}#/tasbih` },
        ],
      },
      workbox: {
        // Everything is precached: the app makes no network request after install.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        // Link previews fetch the first image and iOS fetches its launch image at install time.
        globIgnores: ['**/og-image.png', 'splash/**'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify((process.env.npm_package_version ?? '0.0.0') + (mode === 'update-fixture' ? '-next' : '')),
  },
  // The verified content dataset ships as one chunk of about 500 kB (125 kB gzipped).
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: false,
  },
}))
