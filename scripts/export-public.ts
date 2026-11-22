// Writes the public export: a copy of the project that contains only code,
// assets and content whose redistribution rights are documented.
//   node scripts/export-public.ts <empty directory outside this repository> [--allow-dirty]
//
// The export is built from an allow-list. A file is copied only if it is
// tracked by git here and named below, so anything new stays private until
// someone adds it on purpose. The dataset is not copied: it is regenerated
// inside the export from the Tanzil files alone. This script never runs git
// in the target and never pushes anything.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import type { Collection, Entry, Surah } from '../src/content/schema.ts'

const ROOT = resolve(import.meta.dirname, '..')

const ALLOWED_FILES = new Set([
  'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'eslint.config.js',
  'playwright.public.config.ts', '.gitignore',
  'README.md', 'README.ar.md', 'CONTRIBUTING.md', 'THIRD_PARTY_CONTENT.md',
  'scripts/build-content.ts', 'scripts/import-content.ts', 'scripts/check-public-build.ts', 'scripts/generate-icons.ts', 'scripts/generate-splash.ts',
  'content-sources/README.md', 'content-sources/curation.ts', 'content-sources/sources.ts',
  // Surah names and numbering only. This file holds no Quran text.
  'content-sources/quran/tanzil-quran-data.js',
  'docs/social-preview.png', 'docs/pre-release/licensing.md',
])
const ALLOWED_DIRECTORIES = ['src/', 'public/', 'assets/', '.github/', 'scripts/lib/', 'tests/public/', 'docs/screenshots/']

// npm scripts that need private inputs are dropped, and the ones that remain are pointed at the public variants.
const REMOVED_SCRIPTS = ['content:fetch', 'content:audit', 'build:update-fixture', 'build:public', 'test:public']
const REPLACED_SCRIPTS: Record<string, string> = {
  'content:import': 'node scripts/import-content.ts --quran-only',
  'test:e2e': 'PUBLIC_DIST=dist playwright test -c playwright.public.config.ts',
  'check:public': 'node scripts/check-public-build.ts dist',
}

const EXTRACTS = ['tanzil-uthmani', 'tanzil-simple-clean'] as const
const GENERATED_FILES = [
  ...EXTRACTS.map((name) => `content-sources/quran/${name}-extract.txt`),
  'content/dataset/entries.json', 'content/dataset/collections.json', 'content/dataset/meta.json', 'content/dataset/tasbih-presets.json', 'content/README.md',
]

const CONTENT_NOTICE = `# Content in this directory

This directory holds religious content. It is not covered by the licence of
the application's source code.

## Quran text

The Quran passages in \`dataset/\` are taken, unchanged, from:

    Tanzil Quran Text (Uthmani, Version 1.1)
    Copyright (C) 2007-2026 Tanzil Project
    License: Creative Commons Attribution 3.0
    https://tanzil.net

Terms of use set by the Tanzil Project: verbatim copies only, changing the
text is not allowed. The source must be clearly indicated with a link to
tanzil.net, and this notice must stay with copies of the text.

This repository does not contain the Quran. It holds only the ayahs that the
supplications are taken from, in \`content-sources/quran/*-extract.txt\`, each
ayah whole and unchanged, with Tanzil's complete notice at the top of the file.
The complete text is available from https://tanzil.net.

Some entries are a continuous run of words from within an ayah. They are
marked \`isPartial\`. No word is altered, added or reordered.

The dataset is produced by \`npm run content:import\` from the Tanzil files
and \`content-sources/curation.ts\`, and the build checks every passage
against the extract character for character.
`

const targetArgument = process.argv[2]
if (targetArgument === undefined) throw new Error('usage: export-public.ts <empty directory outside this repository>')
const target = resolve(process.cwd(), targetArgument)
if (target === ROOT || target.startsWith(ROOT + sep)) throw new Error('the export directory must be outside this repository')
if (existsSync(target) && readdirSync(target).length > 0) throw new Error(`${target} is not empty`)

const isAllowed = (path: string): boolean => ALLOWED_FILES.has(path) || ALLOWED_DIRECTORIES.some((directory) => path.startsWith(directory))

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean)
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim()
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
// A release export must come from a commit, so that it can be traced and repeated.
// `--allow-dirty` is for rehearsals only.
if (dirty !== '' && !process.argv.includes('--allow-dirty')) {
  throw new Error('the working tree has uncommitted changes: commit first, or pass --allow-dirty for a rehearsal')
}

mkdirSync(target, { recursive: true })
const copied: string[] = []
for (const path of tracked.filter(isAllowed)) {
  const destination = join(target, path)
  mkdirSync(dirname(destination), { recursive: true })
  cpSync(join(ROOT, path), destination)
  copied.push(path)
}

const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
for (const name of REMOVED_SCRIPTS) delete manifest.scripts[name]
Object.assign(manifest.scripts, REPLACED_SCRIPTS)
writeFileSync(join(target, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')

// Only the ayahs the public dataset uses leave this repository, never the complete text.
type QuranRef = { surah: number; ayah: number }
const privateEntries = JSON.parse(readFileSync(join(ROOT, 'content', 'dataset', 'entries.json'), 'utf8')) as Entry[]
const privateCollections = JSON.parse(readFileSync(join(ROOT, 'content', 'dataset', 'collections.json'), 'utf8')) as Collection[]
const publicEntryIds = new Set(
  privateCollections
    .filter((collection) => collection.section === 'quranic')
    .flatMap((collection) => collection.items.filter((item) => item.hisn === undefined).map((item) => item.entryId)),
)
const neededAyahs = new Map<string, QuranRef>([['1:1', { surah: 1, ayah: 1 }]]) // 1:1 is the basmala the dataset schema records
for (const entry of privateEntries) {
  if (!publicEntryIds.has(entry.id)) continue
  for (const segment of entry.segments) {
    if (segment.type === 'quran') neededAyahs.set(`${segment.surah}:${segment.ayah}`, { surah: segment.surah, ayah: segment.ayah })
  }
}
const orderedAyahs = [...neededAyahs.values()].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)

for (const name of EXTRACTS) {
  const complete = readFileSync(join(ROOT, 'content-sources', 'quran', `${name}.txt`), 'utf8').split('\n').map((line) => line.replace(/\r$/, ''))
  const notice = complete.filter((line) => line.startsWith('#'))
  if (!notice.some((line) => line.includes('Tanzil')) || !notice.some((line) => line.includes('Creative Commons'))) {
    throw new Error(`${name}.txt has lost its Tanzil notice`)
  }
  const byKey = new Map(complete.filter((line) => /^\d+\|\d+\|/.test(line)).map((line) => {
    const [surah, ayah] = line.split('|')
    return [`${Number(surah)}:${Number(ayah)}`, line] as const
  }))
  const lines = orderedAyahs.map(({ surah, ayah }) => {
    const line = byKey.get(`${surah}:${ayah}`)
    if (line === undefined) throw new Error(`${name}.txt has no ayah ${surah}:${ayah}`)
    return line
  })
  const header = [
    '# EXTRACT. This file is not the complete Quran text.',
    `# It contains ${lines.length} ayahs, each whole and unchanged, copied from the`,
    '# Tanzil file whose notice follows. The complete text is at https://tanzil.net',
    '#',
  ]
  const destination = join(target, 'content-sources', 'quran', `${name}-extract.txt`)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, [...header, ...notice, '', ...lines, ''].join('\n'))
}

// The dataset is rebuilt inside the export from what the export itself contains.
execFileSync('node', ['scripts/import-content.ts', '--quran-only'], { cwd: target, stdio: 'ignore' })
writeFileSync(join(target, 'content', 'README.md'), CONTENT_NOTICE)

function filesIn(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = join(directory, name)
    return statSync(full).isDirectory() ? filesIn(full) : [relative(target, full).split(sep).join('/')]
  })
}
// The rebuilt dataset must be exactly the public part of the private one.
const rebuilt = JSON.parse(readFileSync(join(target, 'content', 'dataset', 'entries.json'), 'utf8')) as Entry[]
const expectedById = new Map(privateEntries.filter((entry) => publicEntryIds.has(entry.id)).map((entry) => [entry.id, JSON.stringify(entry.segments)]))
if (rebuilt.length !== expectedById.size || rebuilt.some((entry) => expectedById.get(entry.id) !== JSON.stringify(entry.segments))) {
  throw new Error('the dataset rebuilt inside the export differs from the public part of the private dataset')
}
const completeQuranFiles = ['content-sources/quran/tanzil-uthmani.txt', 'content-sources/quran/tanzil-simple-clean.txt']
for (const path of completeQuranFiles) {
  if (existsSync(join(target, path))) throw new Error(`the complete Quran text reached the export: ${path}`)
}

const exported = filesIn(target).sort()
const unexpected = exported.filter((path) => !isAllowed(path) && !GENERATED_FILES.includes(path))
if (unexpected.length > 0) throw new Error(`files outside the allow-list reached the export: ${unexpected.join(', ')}`)
if (existsSync(join(target, '.git'))) throw new Error('the export must not contain git history')

// ---------------------------------------------------------------- Reports

const reports = join(ROOT, 'docs', 'open-source')
mkdirSync(reports, { recursive: true })
const origin = (path: string): string =>
  GENERATED_FILES.includes(path) ? 'generated in the export' : path === 'package.json' ? 'copied, scripts adjusted' : 'copied'
const sha = (path: string): string => createHash('sha256').update(readFileSync(join(target, path))).digest('hex').slice(0, 12)
const bytes = (path: string): number => statSync(join(target, path)).size

const inventory: string[] = []
inventory.push('# Stage A public export: file inventory', '')
inventory.push(`Generated by \`node scripts/export-public.ts\` on ${new Date().toISOString().slice(0, 10)} from private commit \`${commit.slice(0, 7)}\`${dirty ? ', with uncommitted changes in the working tree' : ''}.`, '')
inventory.push(`${exported.length} files, ${(exported.reduce((sum, path) => sum + bytes(path), 0) / 1024).toFixed(0)} kB. Only tracked files named in the allow-list of the export script are copied. The dataset and the content notice are generated inside the export.`, '')
const groups = new Map<string, string[]>()
for (const path of exported) {
  const top = path.includes('/') ? path.split('/').slice(0, path.startsWith('src/') || path.startsWith('content') || path.startsWith('docs/') || path.startsWith('.github/') ? 2 : 1).join('/') : '(root)'
  groups.set(top, [...(groups.get(top) ?? []), path])
}
inventory.push('| Area | Files | Size |', '|---|---|---|')
for (const [group, paths] of groups) inventory.push(`| ${group} | ${paths.length} | ${(paths.reduce((sum, path) => sum + bytes(path), 0) / 1024).toFixed(1)} kB |`)
inventory.push('', '## Every file', '', '| Path | Bytes | SHA-256 (first 12) | Origin |', '|---|---|---|---|')
for (const path of exported) inventory.push(`| ${path} | ${bytes(path)} | ${sha(path)} | ${origin(path)} |`)
inventory.push('', '## Tracked files that are not exported', '')
const excluded = tracked.filter((path) => !isAllowed(path))
const excludedGroups = new Map<string, number>()
for (const path of excluded) {
  const key = path.startsWith('docs/') || path.startsWith('content') || path.startsWith('tests/') || path.startsWith('scripts/') ? path.split('/').slice(0, 2).join('/') + (path.split('/').length > 2 ? '/' : '') : path
  excludedGroups.set(key, (excludedGroups.get(key) ?? 0) + 1)
}
inventory.push('| Path | Files |', '|---|---|')
for (const [key, total] of excludedGroups) inventory.push(`| ${key} | ${total} |`)
writeFileSync(join(reports, 'stage-a-inventory.md'), inventory.join('\n') + '\n')

const read = <T>(name: string): T => JSON.parse(readFileSync(join(target, 'content', 'dataset', name), 'utf8')) as T
const entries = read<Entry[]>('entries.json')
const collections = read<Collection[]>('collections.json')
const { surahs } = read<{ surahs: Surah[] }>('meta.json')
const byId = new Map(entries.map((entry) => [entry.id, entry]))

const contents: string[] = []
contents.push('# Stage A public build: exact contents', '')
contents.push(`Generated by \`node scripts/export-public.ts\` on ${new Date().toISOString().slice(0, 10)} from the dataset inside the export. The Arabic below is copied by the script from the Tanzil Uthmani text.`, '')
contents.push(`${entries.length} entries in ${collections.length} collections. Every entry is a supplication taken from the Quran, shown with its surah and ayah. The export carries ${orderedAyahs.length} ayahs as its reference, not the complete text. ${entries.filter((entry) => entry.segments.some((segment) => segment.type === 'quran' && segment.isPartial)).length} entries contain an excerpt of an ayah, the rest are whole ayahs. There are no hadith entries and no tasbih presets.`, '')
contents.push('| Collection | Entries |', '|---|---|')
for (const collection of collections) contents.push(`| ${collection.title} (\`${collection.id}\`) | ${collection.items.length} |`)
contents.push('')
for (const collection of collections) {
  contents.push(`## ${collection.title}`, '')
  contents.push('| # | Entry | Reference | Extent | Text |', '|---|---|---|---|---|')
  collection.items.forEach((item, index) => {
    const entry = byId.get(item.entryId)
    if (!entry) throw new Error(`collection ${collection.id} refers to a missing entry ${item.entryId}`)
    const ayahs = entry.segments.filter((segment) => segment.type === 'quran')
    const first = ayahs[0]
    const last = ayahs.at(-1)
    if (!first || !last) throw new Error(`${entry.id} has no Quran text`)
    const name = surahs[first.surah - 1]?.name ?? ''
    const reference = `${name} ${first.surah}:${first.ayah}${last.ayah !== first.ayah ? `-${last.ayah}` : ''}`
    const partial = ayahs.filter((segment) => segment.isPartial).map((segment) => segment.ayah)
    const extent = partial.length === 0 ? 'whole' : ayahs.length === 1 ? 'excerpt' : `ayah ${partial.join(', ')} excerpted`
    contents.push(`| ${index + 1} | ${entry.id} | ${reference} | ${extent} | ${ayahs.map((segment) => segment.text).join(' ۝ ')} |`)
  })
  contents.push('')
}
writeFileSync(join(reports, 'stage-a-contents.md'), contents.join('\n'))

console.log(`exported ${exported.length} files to ${target}`)
console.log(`dataset: ${entries.length} entries in ${collections.length} collections`)
console.log('next, inside the export: npm ci, npm run lint, npm run typecheck, npm test, npm run build, npm run check:public, npm run test:e2e')
