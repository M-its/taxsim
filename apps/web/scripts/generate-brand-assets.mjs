import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'

// Reuse Next's image transformer; the approved SVG is the only source of truth.
const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('next/package.json'))
const sharp = nextRequire('sharp')
const source = await readFile(new URL('../public/brand/icon.svg', import.meta.url))
const render = (size) => sharp(source, { density: 384 }).resize(size, size).png().toBuffer()

for (const size of [32, 180, 192, 512]) {
  const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  await writeFile(new URL(`../public/brand/${filename}`, import.meta.url), await render(size))
}

// Modern ICO entries embed lossless PNGs, avoiding an additional tool dependency.
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(render))
const directory = Buffer.alloc(6 + 16 * sizes.length)
directory.writeUInt16LE(1, 2)
directory.writeUInt16LE(sizes.length, 4)
let offset = directory.length
images.forEach((image, index) => {
  const entry = 6 + index * 16
  directory[entry] = sizes[index]
  directory[entry + 1] = sizes[index]
  directory.writeUInt16LE(1, entry + 4)
  directory.writeUInt16LE(32, entry + 6)
  directory.writeUInt32LE(image.length, entry + 8)
  directory.writeUInt32LE(offset, entry + 12)
  offset += image.length
})
await writeFile(
  new URL('../src/app/favicon.ico', import.meta.url),
  Buffer.concat([directory, ...images]),
)
console.log('Generated approved TS icons: 16/32/48 ICO, 32/180/192/512 PNG.')
