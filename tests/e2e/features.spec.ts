import { ABOUT_TEXT } from '../../src/app/about-text.ts'
import { expect, test } from '@playwright/test'

test.describe('favorites', () => {
  test('a saved dhikr survives a reload and can be removed', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    const first = page.locator('article').first()
    await first.getByRole('button', { name: 'إضافة إلى المفضلة' }).click()
    await expect(first.getByRole('button', { name: 'إزالة من المفضلة' })).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await page.goto('./#/favorites')
    await expect(page.locator('article')).toHaveCount(1)

    await page.getByRole('button', { name: 'إزالة من المفضلة' }).click()
    await expect(page.getByText('لا توجد عناصر محفوظة بعد')).toBeVisible()
  })

  test('shows a welcoming empty state', async ({ page }) => {
    await page.goto('./#/favorites')
    await expect(page.getByText('لا توجد عناصر محفوظة بعد')).toBeVisible()
    await expect(page.getByRole('link', { name: 'تصفح الأذكار' })).toBeVisible()
  })
})

test.describe('tasbih', () => {
  test('celebrates the target, never loses the count, and persists', async ({ page }) => {
    await page.goto('./#/tasbih')
    await page.getByLabel('هدف مخصص').fill('3')
    const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
    for (let i = 0; i < 3; i++) await bead.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('ما شاء الله')).toBeVisible()
    await dialog.getByRole('button', { name: 'متابعة العدّ' }).click()
    await expect(dialog).toBeHidden()

    await expect(bead).toHaveAccessibleName(/٣ \/ ٣/)
    await bead.click()
    await expect(bead).toHaveAccessibleName(/٤ \/ ٣/)

    await page.reload()
    await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٤ \/ ٣/)

    await page.getByRole('button', { name: 'جولة أخرى' }).click()
    await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٠ \/ ٣/)
    await expect(page.getByText('جولات مكتملة').locator('..')).toContainText('١')
  })

  test('reset asks first and keeps the count when cancelled', async ({ page }) => {
    await page.goto('./#/tasbih')
    const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
    await bead.click()
    await bead.click()
    await page.getByRole('button', { name: 'تصفير' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'إلغاء' }).click()
    await expect(bead).toHaveAccessibleName(/٢ \//)
    await page.getByRole('button', { name: 'تصفير' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'تصفير' }).click()
    await expect(bead).toHaveAccessibleName(/٠ \//)
  })

  test('each dhikr keeps its own count', async ({ page }) => {
    await page.goto('./#/tasbih')
    const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
    const presets = page.getByRole('radiogroup', { name: 'اختر الذكر' }).getByRole('radio')
    await bead.click()
    await presets.nth(1).click()
    await expect(bead).toHaveAccessibleName(/٠ \//)
    await presets.nth(0).click()
    await expect(bead).toHaveAccessibleName(/١ \//)
  })
})

test.describe('reader', () => {
  test('counts repetitions and tracks progress for the day', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    const progress = page.getByRole('progressbar', { name: 'التقدم' })
    await expect(progress).toHaveAttribute('aria-valuenow', '0')
    const counter = page.locator('article').first().getByRole('button', { name: /التكرار/ })
    await counter.click()
    await expect(progress).toHaveAttribute('aria-valuenow', '1')
    await expect(counter).toBeDisabled()
    await page.reload()
    await expect(page.getByRole('progressbar', { name: 'التقدم' })).toHaveAttribute('aria-valuenow', '1')
  })

  test('shows the source of every entry', async ({ page }) => {
    await page.goto('./#/adhkar/morning')
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThan(5)
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('footer')).toContainText(/سورة|صحيح|سنن|جامع/)
    }
  })
})

test.describe('search', () => {
  test('finds vocalized text from an unvocalized query and opens it', async ({ page }) => {
    await page.goto('./#/search')
    await page.getByRole('searchbox').fill('اسالك العفو والعافيه')
    const result = page.locator('main ul li a').first()
    await expect(result).toContainText('الْعَفْوَ')
    await result.click()
    await expect(page).toHaveURL(/focus=h-/)
    await expect(page.locator('article[id^="entry-h-"]').first()).toBeVisible()
  })

  test('explains when nothing matches', async ({ page }) => {
    await page.goto('./#/search?q=zzzz')
    await expect(page.getByText('لا توجد نتائج')).toBeVisible()
  })
})

test.describe('settings', () => {
  test('the Hijri date can be adjusted and the choice persists', async ({ page }) => {
    await page.goto('./#/settings')
    const date = page.locator('p[aria-live="polite"]')
    const before = await date.textContent()
    await page.getByRole('button', { name: 'يوم +' }).click()
    await expect(date).not.toHaveText(before ?? '')
    const after = await date.textContent()
    await page.reload()
    await expect(page.locator('p[aria-live="polite"]')).toHaveText(after ?? '')
  })

  test('states plainly that no scholar has reviewed the content', async ({ page }) => {
    await page.goto('./#/settings')
    await expect(page.getByRole('note')).toContainText('لم يراجع هذا المحتوى عالمٌ مختص حتى الآن')
    await expect(page.getByRole('heading', { name: 'منهج التوثيق' })).toBeVisible()
    await expect(page.getByText('مطابقة تقريبية', { exact: true })).toBeVisible()
  })

  test('marks approximate matches on the card', async ({ page }) => {
    await page.goto('./#/adhkar/sleep')
    await expect(page.locator('article').first()).toBeVisible()
    await expect(page.locator('article footer').getByText('مطابقة تقريبية').first()).toBeVisible()
  })

  test('the dark theme applies and persists', async ({ page }) => {
    await page.goto('./#/settings')
    await page.getByText('داكن', { exact: true }).click()
    await expect(page.getByRole('radio', { name: 'داكن' })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test('the page is right-to-left Arabic and an unknown route recovers', async ({ page }) => {
  await page.goto('./#/nowhere')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await page.getByRole('link', { name: 'العودة إلى الرئيسية' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'السلام عليكم ورحمة الله' })).toBeVisible()
})

test.describe('the page about Nafissa', () => {
  test('is reached from the navigation and shows the owner\'s text', async ({ page }, testInfo) => {
    await page.goto('./')
    // The desktop layout lists it in the sidebar. Smaller screens offer it in the page header.
    const isDesktop = testInfo.project.name.startsWith('desktop')
    const link = isDesktop
      ? page.getByRole('complementary').getByRole('link', { name: ABOUT_TEXT.title })
      : page.getByRole('main').getByRole('link', { name: ABOUT_TEXT.title })
    await link.click()
    await expect(page).toHaveURL(/#\/about$/)
    await expect(page.getByRole('heading', { level: 1, name: ABOUT_TEXT.title })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: ABOUT_TEXT.heading })).toBeVisible()
    for (const text of [ABOUT_TEXT.subtitle, ...ABOUT_TEXT.body, ...ABOUT_TEXT.supplications]) {
      await expect(page.getByText(text, { exact: true })).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  })

  test('is also offered from the dedication card in settings, and is not part of the collections', async ({ page }) => {
    await page.goto('./#/settings')
    await page.getByRole('region', { name: 'إهداء' }).getByRole('link', { name: ABOUT_TEXT.title }).click()
    await expect(page.getByRole('heading', { level: 1, name: ABOUT_TEXT.title })).toBeVisible()
    // It holds no supplication card, counter or favorite button.
    await expect(page.locator('article')).toHaveCount(0)
  })
})

test('the app name leads back to the home screen', async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name.startsWith('desktop')
  // The sidebar carries the name on every screen. On small screens it heads the home screen.
  await page.goto(isDesktop ? './#/settings' : './')
  const brand = isDesktop ? page.getByRole('complementary').getByRole('link', { name: /أذكار وأدعية/ }) : page.getByRole('main').getByRole('link', { name: /أذكار وأدعية/ })
  await expect(brand).toBeVisible()
  await brand.click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.locator('main').getByText(/هـ/).first()).toBeVisible()
})
