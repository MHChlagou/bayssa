import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { UPDATE_SERVER_PORTS } from '../../playwright.config.ts'
import { DEDICATION_SUPPLICATION, TRIBUTE_PHRASE } from '../../src/app/dedication.ts'

declare global {
  interface Window {
    __vibrations: unknown[]
    __shared: unknown[]
    __copied: string[]
  }
}

/** One ayah from the reference file. Expected Quran text is never typed into a test. */
function tanzilAyah(surah: number, ayah: number): string {
  const file = readFileSync(join(import.meta.dirname, '..', '..', 'content-sources', 'quran', 'tanzil-uthmani.txt'), 'utf8')
  const prefix = `${surah}|${ayah}|`
  const line = file.split('\n').find((candidate) => candidate.startsWith(prefix))
  if (line === undefined) throw new Error(`ayah ${surah}:${ayah} not found in the Tanzil file`)
  return line.slice(prefix.length).trim()
}

async function hasServiceWorkers(page: Page): Promise<boolean> {
  return page.evaluate(() => 'serviceWorker' in navigator)
}

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
}

test.describe('first load', () => {
  test('adopts the prerendered home screen without errors', async ({ page }) => {
    const problems: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`)
    })
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('h1')?.setAttribute('data-from-shell', 'true')
      })
    })
    await page.goto('./')
    // Today's date is filled in by the app, so its presence means the app has started.
    await expect(page.locator('main').getByText(/هـ/).first()).toBeVisible()
    await expect(page.locator('h1')).toHaveAttribute('data-from-shell', 'true')
    expect(problems).toEqual([])
  })

  test('shows the greeting before any script runs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('./')
    await expect(page.getByRole('heading', { level: 1, name: 'السلام عليكم ورحمة الله' })).toBeVisible()
    await expect(page.getByRole('link', { name: /أذكار الصباح/ })).toHaveAttribute('href', '#/adhkar/morning')
    await context.close()
  })

  test('a deep link ignores the home shell and opens its own screen', async ({ page }) => {
    const problems: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text())
    })
    await page.goto('./#/tasbih')
    await expect(page.getByRole('heading', { level: 1, name: 'المسبحة' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    expect(problems).toEqual([])
  })
})

test.describe('dedication', () => {
  const ROUTES = ['', '#/adhkar', '#/adhkar/morning', '#/duas', '#/tasbih', '#/favorites', '#/search', '#/settings']

  test('the band is at the top of every screen and is announced once', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(`./${route}`)
      const band = page.getByRole('complementary', { name: 'إهداء' })
      await expect(band, route).toBeVisible()
      const box = await band.boundingBox()
      expect(box?.y, route).toBe(0)
      expect(box?.width, route).toBe(page.viewportSize()?.width)
      // One copy for assistive technology. Every moving copy is hidden from it.
      const exposed = await band.evaluate((element, phrase) => {
        const holders = [...element.querySelectorAll('*')].filter((node) => node.children.length === 0 && node.textContent === phrase)
        return holders.filter((node) => node.closest('[aria-hidden="true"]') === null).length
      }, TRIBUTE_PHRASE)
      expect(exposed, route).toBe(1)
    }
  })

  test('the phrase reaches the page letter for letter, set in Amiri, right to left', async ({ page }) => {
    await page.goto('./')
    const phrase = page.locator('.tribute-viewport .tribute-phrase').first()
    await expect(phrase).toHaveText(TRIBUTE_PHRASE)
    const style = await phrase.evaluate((element) => {
      const computed = getComputedStyle(element)
      return { font: computed.fontFamily, direction: computed.direction }
    })
    expect(style.font).toMatch(/^"?Amiri/)
    expect(style.direction).toBe('rtl')
    expect(await page.evaluate(() => document.fonts.check('17px Amiri', document.querySelector('.tribute-phrase')?.textContent ?? ''))).toBe(true)
  })

  test('drifts slowly, and stops on hover and when its control is used', async ({ page }) => {
    await page.goto('./#/tasbih')
    const track = page.locator('.tribute-track')
    const state = (): Promise<{ name: string; seconds: number; play: string }> =>
      track.evaluate((element) => {
        const computed = getComputedStyle(element)
        return { name: computed.animationName, seconds: Number.parseFloat(computed.animationDuration), play: computed.animationPlayState }
      })
    await page.mouse.move(200, 400)
    const running = await state()
    expect(running.name).toBe('tribute-drift')
    expect(running.seconds).toBeGreaterThanOrEqual(60)
    expect(running.play).toBe('running')

    const control = page.getByRole('button', { name: 'إيقاف حركة شريط الإهداء' })
    await control.focus()
    await page.keyboard.press('Enter')
    await page.mouse.move(200, 400)
    expect((await state()).play).toBe('paused')
    await page.getByRole('button', { name: 'تشغيل حركة شريط الإهداء' }).press('Enter')
    await page.mouse.move(200, 400)
    expect((await state()).play).toBe('running')

    await page.mouse.move(100, 10)
    expect((await state()).play).toBe('paused')
  })

  test('stands still when the device asks for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    await expect(page.locator('.tribute-viewport')).toBeHidden()
    await expect(page.locator('.tribute-still .tribute-phrase')).toHaveText(TRIBUTE_PHRASE)
    await expect(page.locator('.tribute-still')).toBeVisible()
    await expect(page.locator('.tribute-control')).toBeHidden()
  })

  test('the supplication is on a card in settings, and nowhere else', async ({ page }) => {
    await page.goto('./#/settings')
    await expect(page.getByRole('region', { name: 'إهداء' })).toContainText(DEDICATION_SUPPLICATION)
    for (const route of ['', '#/adhkar', '#/tasbih']) {
      await page.goto(`./${route}`)
      await expect(page.locator('main h1, main h2').first()).toBeVisible()
      await expect(page.getByText(DEDICATION_SUPPLICATION)).toHaveCount(0)
    }
  })

  test('the band does not make the page wider or cover the content', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    await expect(page.locator('article').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    const band = await page.locator('.tribute').boundingBox()
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
    if (!band || !heading) throw new Error('layout boxes missing')
    expect(heading.y).toBeGreaterThanOrEqual(band.y + band.height)
  })
})

test.describe('right-to-left layout and Arabic fonts', () => {
  test('the page flows right to left', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    await expect(page.locator('article').first()).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe('rtl')

    const viewport = page.viewportSize()
    const title = await page.getByRole('heading', { level: 1 }).boundingBox()
    if (!viewport || !title) throw new Error('viewport or heading box missing')
    const mainBox = await page.locator('main').boundingBox()
    if (!mainBox) throw new Error('main box missing')
    // The title hugs the right edge of the reading column.
    expect(title.x + title.width).toBeGreaterThan(mainBox.x + mainBox.width / 2)

    const navLinks = page.getByRole('navigation', { name: 'التنقل الرئيسي' }).getByRole('link')
    const first = await navLinks.first().boundingBox()
    const second = await navLinks.nth(1).boundingBox()
    if (!first || !second) throw new Error('navigation boxes missing')
    if (viewport.width < 1024) expect(first.x).toBeGreaterThan(second.x)
    else expect(first.x).toBeGreaterThan(viewport.width / 2)
  })

  test('nothing overflows the screen sideways', async ({ page }) => {
    for (const route of ['', '#/adhkar/morning', '#/tasbih', '#/settings']) {
      await page.goto(`./${route}`)
      await expect(page.locator('main h1').first()).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, route).toBeLessThanOrEqual(1)
    }
  })

  test('supplications use Amiri and the interface uses Readex Pro', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    await expect(page.locator('article').first()).toBeVisible()
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready
      const family = (selector: string): string => getComputedStyle(document.querySelector(selector) ?? document.body).fontFamily
      return {
        scripture: family('.scripture'),
        heading: family('h1'),
        amiriLoaded: document.fonts.check('24px Amiri', 'ٱللَّهُ'),
        readexLoaded: document.fonts.check('15px "Readex Pro Variable"', 'الأذكار'),
        failed: [...document.fonts].filter((face) => face.status === 'error').map((face) => face.family),
      }
    })
    expect(fonts.scripture).toMatch(/^"?Amiri/)
    expect(fonts.heading).toMatch(/^"?Readex Pro Variable/)
    expect(fonts).toMatchObject({ amiriLoaded: true, readexLoaded: true, failed: [] })
  })

  test('Quran text reaches the page unchanged', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    const ayah = page.locator('article').first().locator('p[lang="ar"]').first()
    await expect(ayah).toBeVisible()
    // Ayat al-Kursi must equal the reference file character for character, followed only by its ayah mark.
    const shown = await ayah.evaluate((element) => element.firstChild?.textContent ?? '')
    expect(shown).toBe(tanzilAyah(2, 255))
  })
})

test.describe('haptic feedback', () => {
  test('vibrates on each count and with a pattern on completion, where supported', async ({ page }) => {
    await page.addInitScript(() => {
      window.__vibrations = []
      Object.defineProperty(Navigator.prototype, 'vibrate', {
        configurable: true,
        value: (pattern: unknown) => { window.__vibrations.push(pattern); return true },
      })
    })
    await page.goto('./#/tasbih')
    await page.getByLabel('هدف مخصص').fill('2')
    const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
    await bead.click()
    await bead.click()
    await expect(page.getByRole('dialog').getByText('ما شاء الله')).toBeVisible()
    const vibrations = await page.evaluate(() => window.__vibrations)
    expect(vibrations).toHaveLength(2)
    expect(vibrations[0]).toBe(12)
    expect(Array.isArray(vibrations[1])).toBe(true)
  })

  test('stays silent when the user turns it off', async ({ page }) => {
    await page.addInitScript(() => {
      window.__vibrations = []
      Object.defineProperty(Navigator.prototype, 'vibrate', {
        configurable: true,
        value: (pattern: unknown) => { window.__vibrations.push(pattern); return true },
      })
    })
    await page.goto('./#/tasbih')
    await page.getByRole('switch', { name: 'الاهتزاز عند العدّ' }).uncheck()
    await page.getByRole('button', { name: /اضغط للتسبيح/ }).click()
    expect(await page.evaluate(() => window.__vibrations)).toEqual([])
  })

  test('counting works on browsers with no vibration support', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'vibrate', { configurable: true, value: undefined })
    })
    await page.goto('./#/tasbih')
    const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
    await bead.click()
    await expect(bead).toHaveAccessibleName(/١ \//)
    expect(errors).toEqual([])
  })
})

test.describe('sharing and copying', () => {
  test('shares the text with its source through the system share sheet, where supported', async ({ page }) => {
    await page.addInitScript(() => {
      window.__shared = []
      Object.defineProperty(Navigator.prototype, 'share', {
        configurable: true,
        value: async (data: unknown) => { window.__shared.push(data) },
      })
    })
    await page.goto('./#/duas/q-forgiveness')
    await page.locator('article').first().getByRole('button', { name: 'مشاركة' }).click()
    const shared = await page.evaluate(() => window.__shared)
    expect(shared).toHaveLength(1)
    const text = (shared[0] as { text: string }).text
    const source = tanzilAyah(2, 286)
    const quoted = /﴿(.+)﴾/s.exec(text)?.[1] ?? ''
    expect(quoted.length).toBeGreaterThan(40)
    expect(source.endsWith(quoted)).toBe(true)
    expect(text).toContain('سورة البقرة')
  })

  test('hides the share button on browsers without a share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: undefined })
    })
    await page.goto('./#/duas/q-forgiveness')
    const card = page.locator('article').first()
    await expect(card.getByRole('button', { name: 'نسخ' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'مشاركة' })).toHaveCount(0)
  })

  test('a cancelled share is not treated as an error', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text())
    })
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'share', {
        configurable: true,
        value: async () => { throw new DOMException('cancelled', 'AbortError') },
      })
    })
    await page.goto('./#/duas/q-forgiveness')
    await page.locator('article').first().getByRole('button', { name: 'مشاركة' }).click()
    await expect(page.locator('article').first()).toBeVisible()
    // Only the app's own report of a failed share counts. Engines add unrelated hints of their own.
    expect(warnings.filter((warning) => warning.includes('share failed'))).toEqual([])
  })

  test('copies the text with its source and confirms it', async ({ page }) => {
    await page.addInitScript(() => {
      window.__copied = []
      Object.defineProperty(Navigator.prototype, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => { window.__copied.push(text) } },
      })
    })
    await page.goto('./#/duas/q-forgiveness')
    const card = page.locator('article').first()
    await card.getByRole('button', { name: 'نسخ' }).click()
    await expect(card.getByRole('button', { name: 'تم النسخ' })).toBeVisible()
    const copied = await page.evaluate(() => window.__copied)
    expect(copied[0]).toContain('سورة البقرة')
  })
})

test.describe('installation', () => {
  test('the page declares its icons, manifest and iOS launch images', async ({ page, request }) => {
    await page.goto('./')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/bayssa/manifest.webmanifest')
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1)
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
    const launchImages = page.locator('link[rel="apple-touch-startup-image"]')
    expect(await launchImages.count()).toBeGreaterThanOrEqual(15)
    for (const href of await launchImages.evaluateAll((links) => links.slice(0, 3).map((link) => link.getAttribute('href') ?? ''))) {
      expect((await request.get(href)).ok(), href).toBe(true)
    }
    expect((await request.get('/bayssa/apple-touch-icon-180x180.png')).ok()).toBe(true)
    expect((await request.get('/bayssa/og-image.png')).ok()).toBe(true)
  })

  test('ships the licence texts of the bundled software and fonts', async ({ page, request }) => {
    await page.goto('./#/settings')
    const link = page.getByRole('link', { name: 'تراخيص البرمجيات والخطوط المستعملة' })
    await expect(link).toHaveAttribute('href', '/bayssa/licenses.txt')
    const text = await (await request.get('/bayssa/licenses.txt')).text()
    for (const expected of ['SIL OPEN FONT LICENSE', 'MIT License', 'ISC License', 'react-router', 'The Amiri Project Authors', 'does not concern the religious content']) {
      expect(text, expected).toContain(expected)
    }
  })

  test('Chrome reports no installability errors', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'The installability report is a Chrome DevTools feature')
    await page.goto('./')
    await waitForServiceWorkerControl(page)
    const client = await page.context().newCDPSession(page)
    const manifest = await client.send('Page.getAppManifest')
    expect(manifest.errors).toEqual([])
    const { installabilityErrors } = await client.send('Page.getInstallabilityErrors')
    expect(installabilityErrors).toEqual([])
  })
})

test.describe('service worker updates', () => {
  test.describe.configure({ mode: 'serial' })

  test('a new version waits for the user, then takes over', async ({ page, request, browserName }, testInfo) => {
    test.skip(['android-chrome', 'mobile-safari'].includes(testInfo.project.name), 'Covered by the desktop project of the same engine, which shares its update server')
    const origin = `http://localhost:${UPDATE_SERVER_PORTS[browserName]}`
    const base = `${origin}/bayssa/`
    await request.get(`${origin}/__use/current`)
    await page.goto(base)
    test.skip(!(await hasServiceWorkers(page)), 'This engine build has no service worker support')
    await waitForServiceWorkerControl(page)

    await page.goto(`${base}#/settings`)
    await expect(page.getByText(/الإصدار \d+\.\d+\.\d+ ·/)).toBeVisible()

    // Publish the next build while the page is open, then let the browser check for it.
    await request.get(`${origin}/__use/next`)
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.update()
    })
    await expect(page.getByText('يتوفر تحديث جديد')).toBeVisible()
    // Nothing changes until the user agrees.
    await expect(page.getByText(/الإصدار \d+\.\d+\.\d+ ·/)).toBeVisible()

    await page.getByRole('button', { name: 'تحديث', exact: true }).click()
    await expect(page.getByText(/الإصدار \d+\.\d+\.\d+-next ·/)).toBeVisible()
    await request.get(`${origin}/__use/current`)
  })
})
