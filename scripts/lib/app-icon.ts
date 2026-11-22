// The app icon is drawn from assets/app-icon.png: the picture inside its round
// frame, with the white corners outside the frame made transparent.
import { join } from 'node:path'
import sharp from 'sharp'

const SOURCE = join(import.meta.dirname, '..', '..', 'assets', 'app-icon.png')
// Position of the round frame in the source picture, in pixels.
const FRAME_CENTER_X = 620.5
const FRAME_CENTER_Y = 634.5
const FRAME_RADIUS = 612

/** The round picture as a square PNG of the given size, transparent outside the frame. */
export async function renderMedallion(sizePx: number): Promise<Buffer> {
  const side = FRAME_RADIUS * 2
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"><circle cx="${FRAME_RADIUS}" cy="${FRAME_RADIUS}" r="${FRAME_RADIUS}"/></svg>`)
  const cut = await sharp(SOURCE)
    .extract({ left: Math.round(FRAME_CENTER_X - FRAME_RADIUS), top: Math.round(FRAME_CENTER_Y - FRAME_RADIUS), width: side, height: side })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(cut).resize(sizePx, sizePx).png().toBuffer()
}
