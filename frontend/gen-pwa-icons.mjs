import sharp from 'sharp'
import { existsSync } from 'fs'

const BG = '#ffffff'
const src = 'public/isi-logo.png'

async function makeIcon(size, outPath, logoScale = 0.7) {
  const logoWidth = Math.round(size * logoScale)
  const logo = await sharp(src).resize({ width: logoWidth, fit: 'inside' }).toBuffer()
  const logoMeta = await sharp(logo).metadata()

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, left: Math.round((size - logoMeta.width) / 2), top: Math.round((size - logoMeta.height) / 2) }])
    .png()
    .toFile(outPath)

  console.log('wrote', outPath)
}

await makeIcon(192, 'public/pwa-192.png', 0.62)
await makeIcon(512, 'public/pwa-512.png', 0.62)
await makeIcon(512, 'public/pwa-maskable-512.png', 0.45) // extra padding for maskable safe zone
await makeIcon(180, 'public/apple-touch-icon.png', 0.62)

console.log('done')
