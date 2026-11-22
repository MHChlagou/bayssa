import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { DEDICATION_SUPPLICATION, TRIBUTE_PHRASE } from '../../src/app/dedication.ts'

test('the home screen starts without errors and offers only what the build contains', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'السلام عليكم ورحمة الله' })).toBeVisible()
  await expect(page.locator('main').getByText(/هـ/).first()).toBeVisible()
  await expect(page.locator('main').getByRole('link', { name: /المسبحة/ })).toBeVisible()
  await expect(page.locator('main').getByRole('link', { name: /أذكار الصباح/ })).toHaveCount(0)
  expect(problems).toEqual([])
})

test('carries the dedication band on every screen and the supplication in settings', async ({ page }) => {
  for (const route of ['', '#/duas', '#/tasbih', '#/settings']) {
    await page.goto(`./${route}`)
    const band = page.getByRole('complementary', { name: 'إهداء' })
    await expect(band, route).toBeVisible()
    await expect(band.locator('.tribute-viewport .tribute-phrase').first()).toHaveText(TRIBUTE_PHRASE)
  }
  await expect(page.getByRole('region', { name: 'إهداء' })).toContainText(DEDICATION_SUPPLICATION)
})

test('the duas screen lists the Quranic collections only', async ({ page }) => {
  await page.goto('./#/duas')
  await expect(page.getByRole('link', { name: /المغفرة والرحمة/ })).toBeVisible()
  await expect(page.locator('main ul li')).toHaveCount(5)
  await expect(page.getByRole('radiogroup')).toHaveCount(0)
})

test('a Quranic collection shows Quran text with its reference and no explanation', async ({ page }) => {
  await page.goto('./#/duas/q-forgiveness')
  const cards = page.locator('article')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBe(10)
  await expect(cards.first().locator('footer')).toContainText('سورة البقرة')
  await expect(page.getByText('قرآن كريم').first()).toBeVisible()
  await expect(page.getByText('حديث نبوي')).toHaveCount(0)
  await expect(page.locator('details')).toHaveCount(0)
})

test('sections without cleared content say so', async ({ page }) => {
  await page.goto('./#/adhkar')
  await expect(page.getByText('هذا القسم غير متاح في هذه النسخة')).toBeVisible()
})

test('the tasbih works as a plain counter and keeps its count', async ({ page }) => {
  await page.goto('./#/tasbih')
  const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
  await bead.click()
  await bead.click()
  await expect(bead).toHaveAccessibleName(/٢ \//)
  await page.reload()
  await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٢ \//)
})

test('search and favorites work on the Quranic content', async ({ page }) => {
  await page.goto('./#/search')
  await page.getByRole('searchbox').fill('ربنا اتنا في الدنيا حسنة')
  const result = page.locator('main ul li a').first()
  await expect(result).toBeVisible()
  await result.click()
  await expect(page).toHaveURL(/focus=q-/)
  await page.locator('article').first().getByRole('button', { name: 'إضافة إلى المفضلة' }).click()
  await page.goto('./#/favorites')
  await expect(page.locator('article')).toHaveCount(1)
})

test('the sources screen names only the sources this build uses', async ({ page }) => {
  await page.goto('./#/settings')
  await expect(page.getByRole('link', { name: 'tanzil.net' })).toHaveAttribute('href', 'https://tanzil.net')
  await expect(page.getByText('حصن المسلم')).toHaveCount(0)
  await expect(page.getByText('التفسير الميسر')).toHaveCount(0)
  await expect(page.getByRole('note')).toContainText('لم يراجع هذا المحتوى عالمٌ مختص حتى الآن')
})

test('is installable: manifest, icons and, in Chrome, no installability errors', async ({ page, request, browserName }) => {
  await page.goto('./')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href ?? '')).json()
  expect(manifest).toMatchObject({ name: 'Bayssa · أذكار وأدعية', short_name: 'Bayssa', lang: 'ar', dir: 'rtl', display: 'standalone', start_url: '/bayssa/', scope: '/bayssa/' })
  for (const icon of manifest.icons as { src: string }[]) expect((await request.get(`/bayssa/${icon.src}`)).ok(), icon.src).toBe(true)
  expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBeGreaterThanOrEqual(15)
  const licences = await (await request.get('/bayssa/licenses.txt')).text()
  expect(licences).toContain('SIL OPEN FONT LICENSE')

  test.skip(browserName !== 'chromium', 'The installability report is a Chrome DevTools feature')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  const client = await page.context().newCDPSession(page)
  expect((await client.send('Page.getAppManifest')).errors).toEqual([])
  expect((await client.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([])
})

test('makes no third-party request', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') foreign.push(request.url())
  })
  await page.goto('./')
  await page.goto('./#/duas/q-guidance')
  await expect(page.locator('article').first()).toBeVisible()
  await page.goto('./#/settings')
  await expect(page.getByRole('link', { name: 'tanzil.net' })).toBeVisible()
  expect(foreign).toEqual([])
})

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  test.skip(!(await page.evaluate(() => 'serviceWorker' in navigator)), 'This engine build has no service worker support')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await context.setOffline(true)
  await page.goto('./#/duas/q-rescue')
  await expect(page.locator('article').first()).toBeVisible()
})

for (const route of ['', '#/duas', '#/duas/q-family', '#/adhkar', '#/tasbih', '#/settings']) {
  test(`no accessibility violations on "${route || 'home'}"`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`./${route}`)
    await expect(page.locator('main h1, main h2').first()).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  })
}
