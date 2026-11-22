import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    __copied: string[]
  }
}

type FileData = {
  favorites: { id: string; addedAt: number }[]
  tasbih: { activeId: string; counters: Record<string, { count: number; target: number; completedRounds: number }>; lifetimeTotal: number }
  progress: { day: string; counts: Record<string, number> }
  prefs: { theme: string; numerals: string; textScaleIndex: number; hijriOffsetDays: number; isHapticsEnabled: boolean }
}

const PREFS = { theme: 'light', numerals: 'arab', textScaleIndex: 1, hijriOffsetDays: 0, isHapticsEnabled: true }
const EMPTY: FileData = { favorites: [], tasbih: { activeId: '', counters: {}, lifetimeTotal: 0 }, progress: { day: '', counts: {} }, prefs: PREFS }

function backupFile(data: Partial<FileData>, overrides: Record<string, unknown> = {}): { name: string; mimeType: string; buffer: Buffer } {
  const file = { format: 'bayssa-backup', version: 1, exportedAt: '2026-11-22T10:00:00.000Z', appVersion: '0.1.0', data: { ...EMPTY, ...data }, ...overrides }
  return { name: 'bayssa-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) }
}

async function chooseFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(file)
}

/** Saves one favorite and counts three times on the tasbih, through the interface. */
async function useTheApp(page: Page): Promise<void> {
  await page.goto('./#/adhkar/morning')
  await page.locator('article').first().getByRole('button', { name: 'إضافة إلى المفضلة' }).click()
  await page.goto('./#/tasbih')
  const bead = page.getByRole('button', { name: /اضغط للتسبيح/ })
  for (let i = 0; i < 3; i++) await bead.click()
  await expect(bead).toHaveAccessibleName(/٣ \//)
}

async function savedState(page: Page): Promise<{ favorites: number; tasbih: string }> {
  return page.evaluate(() => {
    const read = (key: string): unknown => JSON.parse(localStorage.getItem(`md:v1:${key}`) ?? 'null')
    const favorites = read('favorites') as { data: unknown[] } | null
    const tasbih = read('tasbih') as { data: unknown } | null
    return { favorites: favorites?.data.length ?? 0, tasbih: JSON.stringify(tasbih?.data ?? null) }
  })
}

test.describe('export', () => {
  test('writes a versioned file holding the favorites and the counters', async ({ page }) => {
    await useTheApp(page)
    await page.goto('./#/settings')
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'تصدير ملف' }).click()
    const download = await downloading
    expect(download.suggestedFilename()).toMatch(/^bayssa-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const file = JSON.parse(await readFile(await download.path(), 'utf8')) as { format: string; version: number; exportedAt: string; data: FileData }
    expect(file.format).toBe('bayssa-backup')
    expect(file.version).toBe(1)
    expect(Number.isNaN(Date.parse(file.exportedAt))).toBe(false)
    expect(file.data.favorites).toHaveLength(1)
    expect(Object.values(file.data.tasbih.counters)[0]).toMatchObject({ count: 3 })
    expect(file.data.tasbih.lifetimeTotal).toBe(3)
    await expect(page.getByRole('status').filter({ hasText: 'حُفظ الملف' })).toBeVisible()
    // Exporting changes nothing on the device.
    expect((await savedState(page)).favorites).toBe(1)
  })

  test('makes no network request', async ({ page }) => {
    await page.goto('./#/settings')
    await expect(page.getByRole('button', { name: 'تصدير ملف' })).toBeVisible()
    // Let the page finish loading its own files before listening.
    await page.waitForLoadState('networkidle')
    const requests: string[] = []
    page.on('request', (request) => {
      if (!request.url().startsWith('blob:')) requests.push(request.url())
    })
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'تصدير ملف' }).click()
    await downloading
    expect(requests).toEqual([])
  })
})

test.describe('moving data between two separate storage areas', () => {
  // Two browser contexts share nothing, like Safari and the app installed on the home screen.
  test('a file exported in one is imported into the other, after a preview', async ({ browser }) => {
    const first = await browser.newContext({ locale: 'ar-EG' })
    const source = await first.newPage()
    await useTheApp(source)
    await source.goto('./#/settings')
    const downloading = source.waitForEvent('download')
    await source.getByRole('button', { name: 'تصدير ملف' }).click()
    const exported = await readFile(await (await downloading).path())
    await first.close()

    const second = await browser.newContext({ locale: 'ar-EG' })
    const page = await second.newPage()
    await page.goto('./#/settings')
    expect((await savedState(page)).favorites).toBe(0)
    await chooseFile(page, { name: 'bayssa-backup.json', mimeType: 'application/json', buffer: exported })

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'معاينة قبل الاستيراد' })).toBeVisible()
    await expect(dialog).toContainText('ستُضاف')
    await expect(dialog).toContainText('عدّادات جديدة')
    await expect(dialog).toContainText('لن يُحذف شيء')
    // The preview alone writes nothing.
    expect((await savedState(page)).favorites).toBe(0)

    await dialog.getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'تم الاستيراد' })).toBeVisible()
    await page.goto('./#/favorites')
    await expect(page.locator('article')).toHaveCount(1)
    await page.goto('./#/tasbih')
    await expect(page.getByRole('button', { name: /اضغط للتسبيح/ })).toHaveAccessibleName(/٣ \//)
    await second.close()
  })

  test('the copied text can be pasted in place of a file', async ({ page }) => {
    await page.addInitScript(() => {
      window.__copied = []
      Object.defineProperty(Navigator.prototype, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => { window.__copied.push(text) } },
      })
    })
    await useTheApp(page)
    await page.goto('./#/settings')
    await page.getByRole('button', { name: 'نسخ البيانات' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'نُسخت البيانات' })).toBeVisible()
    const copied = await page.evaluate(() => window.__copied[0] ?? '')
    expect(JSON.parse(copied)).toMatchObject({ format: 'bayssa-backup', version: 1 })

    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: 'لصق البيانات' }).click()
    await page.getByLabel('الصق هنا البيانات المنسوخة').fill(copied)
    await page.getByRole('button', { name: 'معاينة' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'تم الاستيراد' })).toBeVisible()
    expect((await savedState(page)).favorites).toBe(1)
  })

  test('says which environment is in use and how to move data', async ({ page }) => {
    await page.goto('./#/settings')
    await expect(page.getByText('أنت تستعمل Bayssa الآن في المتصفح')).toBeVisible()
    await page.emulateMedia({ media: 'screen' })
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window)
      window.matchMedia = (query: string) => (query.includes('display-mode: standalone') ? { ...original(query), matches: true } as MediaQueryList : original(query))
    })
    await page.reload()
    await expect(page.getByText('أنت تستعمل Bayssa الآن تطبيقاً مثبّتاً')).toBeVisible()
  })
})

test.describe('files that must be refused', () => {
  const CASES: { name: string; file: () => { name: string; mimeType: string; buffer: Buffer }; message: string }[] = [
    { name: 'text that is not JSON', file: () => ({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('this is not a backup') }), message: 'تعذّرت قراءة الملف' },
    { name: 'an empty file', file: () => ({ name: 'empty.json', mimeType: 'application/json', buffer: Buffer.from('') }), message: 'تعذّرت قراءة الملف' },
    { name: 'JSON from another program', file: () => ({ name: 'other.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ favorites: ['a'] })) }), message: 'ليس نسخة من بيانات Bayssa' },
    { name: 'a newer format version', file: () => backupFile({}, { version: 2 }), message: 'بإصدار لا يدعمه هذا التطبيق' },
    { name: 'a negative counter', file: () => backupFile({ tasbih: { activeId: 'a', counters: { a: { count: -5, target: 33, completedRounds: 0 } }, lifetimeTotal: 0 } }), message: 'بيانات غير سليمة' },
    { name: 'a favorite without an id', file: () => backupFile({ favorites: [{ id: '', addedAt: 1 }] }), message: 'بيانات غير سليمة' },
    { name: 'a file that is too large', file: () => ({ name: 'huge.json', mimeType: 'application/json', buffer: Buffer.from(' '.repeat(1_000_001)) }), message: 'أكبر من أن يكون' },
  ]

  for (const { name, file, message } of CASES) {
    test(`${name} is refused and the data stays as it was`, async ({ page }) => {
      await useTheApp(page)
      await page.goto('./#/settings')
      const before = await savedState(page)
      await chooseFile(page, file())
      await expect(page.getByRole('alert')).toContainText(message)
      await expect(page.getByRole('alert')).toContainText('لم يتغير شيء')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(await savedState(page)).toEqual(before)
    })
  }
})

test.describe('duplicates and existing data', () => {
  test('importing the same file twice adds nothing the second time', async ({ page }) => {
    const file = backupFile({ favorites: [{ id: 'q-2-201x', addedAt: 5 }], tasbih: { activeId: 'subhan-allah', counters: { 'subhan-allah': { count: 7, target: 33, completedRounds: 1 } }, lifetimeTotal: 40 } })
    await page.goto('./#/settings')
    await chooseFile(page, file)
    await page.getByRole('dialog').getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'تم الاستيراد' })).toBeVisible()
    const afterFirst = await savedState(page)
    expect(afterFirst.favorites).toBe(1)

    await chooseFile(page, file)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('كل ما في هذه النسخة موجود عندك')
    await expect(dialog.getByRole('button', { name: 'استيراد', exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'إغلاق' }).click()
    expect(await savedState(page)).toEqual(afterFirst)
  })

  test('keeps what is already saved, adds what is new, and never lowers a counter', async ({ page }) => {
    await useTheApp(page)
    await page.goto('./#/settings')
    const before = await savedState(page)
    const active = (JSON.parse(before.tasbih) as { activeId: string }).activeId
    await chooseFile(page, backupFile({
      favorites: [{ id: 'q-2-201x', addedAt: 5 }],
      tasbih: { activeId: active, counters: { [active]: { count: 1, target: 100, completedRounds: 0 }, tahlil: { count: 9, target: 100, completedRounds: 0 } }, lifetimeTotal: 1 },
    }))
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('عدّادات جديدة')
    await expect(dialog).toContainText('عدّادات لن تتغير')
    await dialog.getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'تم الاستيراد' })).toBeVisible()

    const after = await savedState(page)
    expect(after.favorites).toBe(2)
    const tasbih = JSON.parse(after.tasbih) as FileData['tasbih']
    expect(tasbih.counters[active]).toMatchObject({ count: 3, target: 33 })
    expect(tasbih.counters.tahlil).toMatchObject({ count: 9 })
    expect(tasbih.lifetimeTotal).toBe(3)
  })

  test('cancelling the preview changes nothing', async ({ page }) => {
    await useTheApp(page)
    await page.goto('./#/settings')
    const before = await savedState(page)
    await chooseFile(page, backupFile({ favorites: [{ id: 'q-2-201x', addedAt: 5 }] }))
    await page.getByRole('dialog').getByRole('button', { name: 'إلغاء' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await savedState(page)).toEqual(before)
  })

  test('leaves preferences alone unless asked to import them', async ({ page }) => {
    await page.goto('./#/settings')
    const file = backupFile({ favorites: [{ id: 'q-2-201x', addedAt: 5 }], prefs: { ...PREFS, theme: 'dark' } })
    await chooseFile(page, file)
    await page.getByRole('dialog').getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await chooseFile(page, file)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: 'استيراد', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test('export and import work with no network', async ({ page, context }) => {
  await page.goto('./')
  test.skip(!(await page.evaluate(() => 'serviceWorker' in navigator)), 'This engine build has no service worker support')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await context.setOffline(true)
  await page.goto('./#/settings')
  await chooseFile(page, backupFile({ favorites: [{ id: 'q-2-201x', addedAt: 5 }] }))
  await page.getByRole('dialog').getByRole('button', { name: 'استيراد', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'تم الاستيراد' })).toBeVisible()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'تصدير ملف' }).click()
  expect((await downloading).suggestedFilename()).toMatch(/^bayssa-backup-/)
})
