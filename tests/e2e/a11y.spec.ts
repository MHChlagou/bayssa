import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = ['', '#/adhkar', '#/adhkar/morning', '#/duas?tab=quranic', '#/duas/q-forgiveness', '#/tasbih', '#/favorites', '#/search?q=الله', '#/settings', '#/about']

// With reduced motion, the lists must be there from the first paint and stay there. They used
// to fade in for about half a second, and in Safari they then vanished for one frame.
for (const route of ['#/adhkar', '#/duas?tab=quranic']) {
  test(`with reduced motion the list on "${route}" is never transparent`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const seen = { frames: 0, transparentFrames: 0 }
      Object.assign(window, { __listOpacity: seen })
      const watch = (): void => {
        const items = [...document.querySelectorAll('main ul > li')]
        if (items.length > 0) {
          seen.frames++
          if (items.some((item) => Number(getComputedStyle(item).opacity) < 0.99)) seen.transparentFrames++
        }
        if (seen.frames < 60) requestAnimationFrame(watch)
      }
      requestAnimationFrame(watch)
    })
    await page.goto(`./${route}`)
    await expect(page.locator('main ul > li').first()).toBeVisible()
    // Sixty painted frames cover the old fade and the frame in which the list used to vanish.
    const read = (): Promise<{ frames: number; transparentFrames: number }> =>
      page.evaluate(() => (window as unknown as { __listOpacity: { frames: number; transparentFrames: number } }).__listOpacity)
    await expect.poll(async () => (await read()).frames, { timeout: 20_000 }).toBe(60)
    expect((await read()).transparentFrames).toBe(0)
  })
}

for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`no accessibility violations on "${route || 'home'}" (${theme})`, async ({ page }) => {
      await page.addInitScript((value) => {
        localStorage.setItem('md:v1:prefs', JSON.stringify({ version: 1, data: { theme: value } }))
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`./${route}`)
      await expect(page.locator('main h1, main [role="search"]').first()).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }
}
