// Renders the iOS launch images. iOS shows one only when its pixel size matches
// the device exactly, so there is one file per distinct screen size.
// The app is locked to portrait in the manifest, so only portrait is generated.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { appleSplashScreenSizes } from '@vite-pwa/assets-generator/config'
import sharp from 'sharp'
import { renderMedallion } from './lib/app-icon.ts'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'public', 'splash')
const BACKGROUND = '#0b3d2e'
const MARK_SHARE_OF_WIDTH = 0.4
const MARK_CENTER_FROM_TOP = 0.46

type ScreenSize = { width: number; height: number; scaleFactor: number }
const knownDevices: Record<string, ScreenSize> = appleSplashScreenSizes
const screens = new Map<string, ScreenSize>()
for (const size of Object.values(knownDevices)) {
  screens.set(`${size.width}x${size.height}@${size.scaleFactor}`, size)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const links: { href: string; media: string }[] = []
for (const { width, height, scaleFactor } of screens.values()) {
  const markSize = Math.round(width * MARK_SHARE_OF_WIDTH)
  const renderedMark = await renderMedallion(markSize)
  const file = `apple-splash-${width}-${height}.png`
  await sharp({ create: { width, height, channels: 3, background: BACKGROUND } })
    .composite([{ input: renderedMark, left: Math.round((width - markSize) / 2), top: Math.round(height * MARK_CENTER_FROM_TOP - markSize / 2) }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT, file))
  links.push({
    href: `splash/${file}`,
    media: `screen and (device-width: ${width / scaleFactor}px) and (device-height: ${height / scaleFactor}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: portrait)`,
  })
}

writeFileSync(join(ROOT, 'src', 'app', 'splash-screens.json'), JSON.stringify(links, null, 2) + '\n')
console.log(`wrote ${links.length} launch images to public/splash`)
