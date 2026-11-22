// Gate for a public build: proves that nothing whose redistribution is not
// documented has reached the given directory.
//   node scripts/check-public-build.ts <directory>
// It looks for every piece of text in the dataset that comes from a source
// not marked `cleared` in content-sources/sources.ts: supplication wording,
// notes and placement notes, and the book they come from. Where the full dataset is absent,
// as in a public checkout, there is nothing restricted to look for and the
// check only confirms the bundle's own declared scope.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { SOURCES } from '../content-sources/sources.ts'
import type { Collection, Entry } from '../src/content/schema.ts'
import { EDITOR_NOTES } from './lib/editor-notes.ts'

const ROOT = join(import.meta.dirname, '..')
const target = process.argv[2]
if (target === undefined) throw new Error('usage: check-public-build.ts <directory>')
const directory = resolve(process.cwd(), target)
if (!existsSync(directory)) throw new Error(`${directory} does not exist`)

// Assembled from parts so that this file does not contain the marker it looks for.
const FULL_SCOPE_MARKER = ['"scope"', '"full"'].join(':')
const TEXT_EXTENSIONS = new Set(['.js', '.html', '.css', '.json', '.txt', '.webmanifest', '.md', '.ts', '.tsx', '.svg', '.yml'])
const MIN_NEEDLE_LENGTH = 12

function filesIn(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name)
    if (statSync(full).isDirectory()) return name === 'node_modules' || name === '.git' ? [] : filesIn(full)
    return TEXT_EXTENSIONS.has(extname(name)) ? [full] : []
  })
}

const isCleared = (id: keyof typeof SOURCES | undefined): boolean => id === undefined || SOURCES[id].redistribution === 'cleared'

const restricted: { label: string; text: string }[] = []
const datasetPath = join(ROOT, 'content', 'dataset', 'entries.json')
if (existsSync(datasetPath)) {
  const entries = JSON.parse(readFileSync(datasetPath, 'utf8')) as Entry[]
  for (const entry of entries) {
    if (!isCleared(entry.provenance.text)) {
      for (const segment of entry.segments) {
        if (segment.type === 'quran' || EDITOR_NOTES.includes(segment.text)) continue
        restricted.push({ label: `${entry.id} ${segment.type}`, text: segment.text })
      }
    }
  }
  const collections = JSON.parse(readFileSync(join(ROOT, 'content', 'dataset', 'collections.json'), 'utf8')) as Collection[]
  for (const collection of collections) {
    for (const item of collection.items) {
      if (item.hisn !== undefined && item.note !== undefined) restricted.push({ label: `${collection.id} placement note`, text: item.note })
    }
  }
}
// The footnoted transcription is the whole book: its items and the author's footnotes are restricted too.
const footnotedPath = join(ROOT, 'content-sources', 'hisn-footnotes', 'hisn-with-references.json')
if (existsSync(footnotedPath)) {
  const book = JSON.parse(readFileSync(footnotedPath, 'utf8')) as Record<string, { Adhkar: { Text: string; Reference: string }[] }>
  for (const [chapter, { Adhkar }] of Object.entries(book)) {
    Adhkar.forEach((item, index) => {
      // Items that are Quran passages are written in braces in that file and are not the author's text.
      if (!item.Text.trim().startsWith('{')) restricted.push({ label: `book item ${chapter} ${index + 1}`, text: item.Text })
      restricted.push({ label: `book footnote ${chapter} ${index + 1}`, text: item.Reference })
    })
  }
}
// Very short phrases (a two-word dhikr) occur in the Quran and in ordinary Arabic, so they prove nothing.
const needles = restricted.filter((needle) => needle.text.length >= MIN_NEEDLE_LENGTH)

const files = filesIn(directory)
const leaks: string[] = []
for (const file of files) {
  const content = readFileSync(file, 'utf8')
  for (const needle of needles) {
    if (content.includes(needle.text)) leaks.push(`${file.slice(directory.length + 1)}: ${needle.label}`)
  }
  if (content.includes(FULL_SCOPE_MARKER)) leaks.push(`${file.slice(directory.length + 1)}: contains a full-scope content bundle`)
}

console.log(`public build check: ${files.length} files scanned for ${needles.length} restricted texts (${restricted.length - needles.length} too short to test)`)
if (leaks.length > 0) {
  console.error(`restricted content found:\n- ${[...new Set(leaks)].slice(0, 40).join('\n- ')}`)
  process.exit(1)
}
console.log('no restricted content found')
