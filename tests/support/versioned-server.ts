// Serves the production build the way GitHub Pages does, and can swap to a
// second build on request. The service worker update test uses it to publish
// "a new version" while a page is open.
//   node tests/support/versioned-server.ts <port>
//   GET /__use/current   serve dist
//   GET /__use/next      serve dist-next
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const BASE = '/bayssa/'
const ROOT = join(import.meta.dirname, '..', '..')
const BUILDS: Record<string, string> = { current: join(ROOT, 'dist'), next: join(ROOT, 'dist-next') }
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
}

const port = Number(process.argv[2])
if (!Number.isInteger(port) || port <= 0) throw new Error('usage: versioned-server.ts <port>')
for (const [name, dir] of Object.entries(BUILDS)) {
  if (!existsSync(join(dir, 'index.html'))) throw new Error(`build "${name}" is missing at ${dir}: run "npm run build" and "npm run build:update-fixture"`)
}

let active = BUILDS.current ?? ''

createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname
  const swap = /^\/__use\/(current|next)$/.exec(path)
  if (swap) {
    active = BUILDS[swap[1] ?? 'current'] ?? active
    response.writeHead(204).end()
    return
  }
  if (!path.startsWith(BASE)) {
    response.writeHead(404).end()
    return
  }
  const relative = normalize(decodeURIComponent(path.slice(BASE.length)) || 'index.html')
  const file = join(active, relative)
  if (!file.startsWith(active) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end()
    return
  }
  // Like GitHub Pages, nothing is cached forever, so the browser revalidates sw.js.
  response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
  createReadStream(file).pipe(response)
}).listen(port, () => console.log(`versioned server on http://localhost:${port}${BASE}`))
