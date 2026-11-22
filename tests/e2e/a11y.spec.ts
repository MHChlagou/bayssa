import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = ['', '#/adhkar', '#/adhkar/morning', '#/duas?tab=quranic', '#/duas/q-forgiveness', '#/tasbih', '#/favorites', '#/search?q=الله', '#/settings']

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
