import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const source = path.resolve(process.argv[2] ?? 'public/chamabondo-crest.png')
const outDir = path.resolve('public/icons')
const GREEN = '#1B5E20'

await mkdir(outDir, { recursive: true })

async function render(size, filename, background) {
  await sharp(source, { density: 1024 })
    .resize(size, size, {
      fit: 'contain',
      background: background ?? { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(path.join(outDir, filename))
}

await render(192, 'icon-192.png')
await render(512, 'icon-512.png')
await render(180, 'apple-touch-icon.png')

const inner = await sharp(source, { density: 1024 })
  .resize(384, 384, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: GREEN,
  },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(path.join(outDir, 'maskable-512.png'))

console.log(`Generated PWA icons in ${outDir} from ${source}`)
