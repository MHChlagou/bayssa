// Downloads the reference texts used to build and verify the content dataset.
// Nothing here is shipped to users directly: see content-sources/README.md.
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'content-sources')
const FETCH_TIMEOUT_MS = 120_000
const HADITH_BOOKS = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah']
const force = process.argv.includes('--force')

const tanzil = (quranType: string) =>
  `https://tanzil.net/pub/download/index.php?quranType=${quranType}&outType=txt-2&agree=true&marks=true&sajdah=true&tatweel=true`

async function exists(path: string): Promise<boolean> {
  return access(path).then(() => true, () => false)
}

async function download(url: string, relativePath: string): Promise<string> {
  const target = join(ROOT, relativePath)
  if (!force && (await exists(target))) return target
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`)
  const body = (await response.text()).replace(/^\uFEFF/, '')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  console.log(`saved ${relativePath} (${body.length} chars)`)
  return target
}

await download(tanzil('uthmani'), 'quran/tanzil-uthmani.txt')
await download(tanzil('simple-clean'), 'quran/tanzil-simple-clean.txt')
await download('https://tanzil.net/trans/?transID=ar.muyassar&type=txt-2', 'quran/tanzil-ar-muyassar.txt')

await download('https://www.hisnmuslim.com/api/ar/husn_ar.json', 'hisn/index.json')
const { readFile } = await import('node:fs/promises')
const index = JSON.parse(await readFile(join(ROOT, 'hisn/index.json'), 'utf8')) as {
  العربية: { ID: number }[]
}
for (const chapter of index['العربية']) {
  await download(`https://www.hisnmuslim.com/api/ar/${chapter.ID}.json`, `hisn/chapters/${chapter.ID}.json`)
}

// A second transcription of Hisn al-Muslim that keeps the author's footnotes (MIT licence).
await download('https://raw.githubusercontent.com/asellam/HisnElMuslim/main/hisn.json', 'hisn-footnotes/hisn-with-references.json')
await download('https://raw.githubusercontent.com/asellam/HisnElMuslim/main/LICENSE.md', 'hisn-footnotes/LICENSE.md')

// Collections outside the six books, used only by the coverage investigation in the audit.
const EXTRA_BOOKS = [
  'the_9_books/ahmed', 'the_9_books/darimi', 'the_9_books/malik', 'other_books/aladab_almufrad',
  'other_books/riyad_assalihin', 'other_books/mishkat_almasabih', 'other_books/bulugh_almaram',
]
for (const path of EXTRA_BOOKS) {
  await download(
    `https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/${path}.json`,
    `cache/extra/${path.split('/')[1]}.json`,
  )
}

for (const book of HADITH_BOOKS) {
  await download(
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}.min.json`,
    `cache/hadith/${book}.json`,
  )
}
