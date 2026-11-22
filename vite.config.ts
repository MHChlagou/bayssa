import { existsSync, readdirSync, readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createServer, type HtmlTagDescriptor, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the site from https://<user>.github.io/bayssa/
const BASE_PATH = '/bayssa/'

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
 * https://example.github.io/bayssa/. Link previews on other sites need
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

// Software and fonts that end up inside the built site. Their licences ask that
// the licence text travels with every copy, so the build writes them to
// dist/licenses.txt. The build fails if it bundles a package missing from here.
const BUNDLED_PACKAGES = [
  'react', 'react-dom', 'scheduler', 'react-router', 'motion', 'framer-motion', 'motion-dom', 'motion-utils',
  'lucide-react', 'workbox-window', '@fontsource/amiri', '@fontsource-variable/readex-pro',
] as const

const LICENSES_HEADER = `Bayssa: third-party software and font licences
====================================================

This file lists the open-source software and fonts included in this
application, with the licence text of each.

It does not concern the religious content shown by the application. The Quran
text, the supplications and the tafsir are not software, are not covered by
any licence in this file, and remain under the terms of their own rights
holders. See the sources screen inside the application.
`

function packageNameOf(moduleId: string): string | undefined {
  return /node_modules\/((?:@[^/]+\/)?[^/]+)\/(?!.*node_modules\/)/.exec(moduleId)?.[1]
}

/** Tanzil's own notice, copied from the text file it ships with, as its terms of use require. */
function tanzilNotice(): string {
  const directory = new URL('./content-sources/quran/', import.meta.url)
  const file = ['tanzil-uthmani.txt', 'tanzil-uthmani-extract.txt'].find((name) => existsSync(new URL(name, directory)))
  if (file === undefined) throw new Error('third-party-licenses: the Tanzil text file is missing')
  const notice = readFileSync(new URL(file, directory), 'utf8').split('\n').map((line) => line.replace(/\r$/, '')).filter((line) => line.startsWith('#'))
  if (!notice.some((line) => line.includes('Tanzil Project'))) throw new Error(`third-party-licenses: ${file} has lost its Tanzil notice`)
  return `${'-'.repeat(72)}\nQuran text\n${'-'.repeat(72)}\n\n${notice.join('\n')}\n`
}

function thirdPartyLicenses(): Plugin {
  return {
    name: 'third-party-licenses',
    apply: 'build',
    generateBundle(_options, bundle) {
      const bundled = new Set<string>()
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        for (const moduleId of Object.keys(chunk.modules)) {
          const name = packageNameOf(moduleId)
          if (name !== undefined) bundled.add(name)
        }
      }
      const listed: readonly string[] = BUNDLED_PACKAGES
      const unlisted = [...bundled].filter((name) => !listed.includes(name))
      if (unlisted.length > 0) {
        throw new Error(`third-party-licenses: bundled but not listed in BUNDLED_PACKAGES: ${unlisted.join(', ')}`)
      }

      const sections = BUNDLED_PACKAGES.map((name) => {
        const directory = new URL(`./node_modules/${name}/`, import.meta.url)
        const manifest: unknown = JSON.parse(readFileSync(new URL('package.json', directory), 'utf8'))
        const field = (key: string): string =>
          typeof manifest === 'object' && manifest !== null && key in manifest ? String((manifest as Record<string, unknown>)[key]) : 'unknown'
        const licenseFile = readdirSync(directory).find((file) => /^licen[cs]e(\.|$)/i.test(file))
        if (licenseFile === undefined) throw new Error(`third-party-licenses: ${name} has no licence file`)
        const text = readFileSync(new URL(licenseFile, directory), 'utf8').trim()
        return `${'-'.repeat(72)}\n${name} ${field('version')} (${field('license')})\n${'-'.repeat(72)}\n\n${text}\n`
      })
      this.emitFile({ type: 'asset', fileName: 'licenses.txt', source: `${LICENSES_HEADER}\n${sections.join('\n')}\n${tanzilNotice()}` })
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
    thirdPartyLicenses(),
    prerenderShell(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: BASE_PATH,
        name: 'Bayssa · أذكار وأدعية',
        short_name: 'Bayssa',
        description: 'أذكار الصباح والمساء وأدعية اليوم والليلة، ومسبحة إلكترونية. يعمل دون اتصال.',
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
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,txt}'],
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
