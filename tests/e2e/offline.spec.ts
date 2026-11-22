import { expect, test, type Page } from '@playwright/test'

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  test.skip(!(await page.evaluate(() => 'serviceWorker' in navigator)), 'This engine build has no service worker support')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // The first visit is not controlled yet: a reload hands the page to the worker.
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
}

test('every screen works with no network after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await waitForServiceWorkerControl(page)
  await context.setOffline(true)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'السلام عليكم ورحمة الله' })).toBeVisible()

  await page.goto('./#/adhkar')
  await page.getByRole('link', { name: /أذكار الصباح/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'أذكار الصباح' })).toBeVisible()
  await expect(page.locator('article').first()).toBeVisible()

  await page.goto('./#/duas?tab=quranic')
  await expect(page.getByRole('link', { name: /المغفرة والرحمة/ })).toBeVisible()

  await page.goto('./#/tasbih')
  await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toBeVisible()

  await page.goto('./#/favorites')
  await expect(page.getByRole('heading', { level: 1, name: 'المفضلة' })).toBeVisible()

  await page.goto('./#/search?q=' + encodeURIComponent('العافية'))
  await expect(page.locator('main ul li a').first()).toBeVisible()

  await page.goto('./#/settings')
  await expect(page.getByRole('heading', { level: 1, name: 'الإعدادات' })).toBeVisible()

  // A cold start while offline, straight onto a deep link.
  const fresh = await context.newPage()
  await fresh.goto('./#/adhkar/evening')
  await expect(fresh.getByRole('heading', { level: 1, name: 'أذكار المساء' })).toBeVisible()
})

test('recovers when the connection comes back', async ({ page, context }) => {
  await page.goto('./')
  await waitForServiceWorkerControl(page)
  await page.goto('./#/tasbih')
  const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
  await bead.click()

  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: /اضغط للتسبيح/ }).click()
  // Looking for an update while offline fails quietly and must not disturb the page.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update().catch(() => undefined)
  })
  await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٢ \//)

  await context.setOffline(false)
  await page.reload()
  await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٢ \//)
  const isUpToDate = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update()
    return registration?.waiting === null
  })
  expect(isUpToDate).toBe(true)
})

test('the self-hosted fonts are used offline', async ({ page, context }) => {
  await page.goto('./')
  await waitForServiceWorkerControl(page)
  await context.setOffline(true)
  await page.goto('./#/adhkar/morning')
  await expect(page.locator('article').first()).toBeVisible()
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    return {
      amiri: document.fonts.check('24px Amiri', 'اللَّهُمَّ'),
      readex: document.fonts.check('15px "Readex Pro Variable"', 'الأذكار'),
      failed: [...document.fonts].filter((face) => face.status === 'error').map((face) => face.family),
    }
  })
  expect(fonts).toEqual({ amiri: true, readex: true, failed: [] })
})

test('the app makes no third-party requests', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') foreign.push(request.url())
  })
  await page.goto('./')
  await page.goto('./#/adhkar/morning')
  await page.goto('./#/tasbih')
  await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toBeVisible()
  expect(foreign).toEqual([])
})

test('the manifest makes the app installable from the GitHub Pages path', async ({ page, request }) => {
  await page.goto('./')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBe('/nafissa/manifest.webmanifest')
  const manifest = await (await request.get(href ?? '')).json()
  expect(manifest).toMatchObject({ lang: 'ar', dir: 'rtl', display: 'standalone', start_url: '/nafissa/', scope: '/nafissa/' })
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(`/nafissa/${icon.src}`)).ok(), icon.src).toBe(true)
  }
})
