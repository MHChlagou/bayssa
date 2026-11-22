// Writes the favicon, the install icons and the iOS home screen icon from assets/app-icon.png.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { renderMedallion } from './lib/app-icon.ts'

const OUT = join(import.meta.dirname, '..', 'public')
const BACKGROUND = '#ffffff'
// Android may crop a maskable icon to a circle 80% of its width, so the picture stays inside that.
const MASKABLE_PICTURE_SHARE = 0.78
const APPLE_PICTURE_SHARE = 0.86
const FAVICON_SIZE_PX = 48

async function onBackground(sizePx: number, pictureShare: number): Promise<Buffer> {
  const pictureSize = Math.round(sizePx * pictureShare)
  const offset = Math.round((sizePx - pictureSize) / 2)
  return sharp({ create: { width: sizePx, height: sizePx, channels: 3, background: BACKGROUND } })
    .composite([{ input: await renderMedallion(pictureSize), left: offset, top: offset }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()
}

/** An .ico file holding one PNG image, which every current browser reads. */
function icoFromPng(png: Buffer, sizePx: number): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(sizePx, 6)
  header.writeUInt8(sizePx, 7)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}

for (const sizePx of [64, 192, 512]) {
  const icon = await sharp(await renderMedallion(sizePx)).png({ compressionLevel: 9, palette: true }).toBuffer()
  writeFileSync(join(OUT, `pwa-${sizePx}x${sizePx}.png`), icon)
}
writeFileSync(join(OUT, 'maskable-icon-512x512.png'), await onBackground(512, MASKABLE_PICTURE_SHARE))
writeFileSync(join(OUT, 'apple-touch-icon-180x180.png'), await onBackground(180, APPLE_PICTURE_SHARE))
writeFileSync(join(OUT, 'favicon.ico'), icoFromPng(await renderMedallion(FAVICON_SIZE_PX), FAVICON_SIZE_PX))
console.log('wrote the favicon and five icons to public')
