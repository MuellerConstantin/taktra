export const DOT_ICON_SIZE = 32

const DOT_RADIUS = DOT_ICON_SIZE * 0.375

/**
 * A round dot of a `#rrggbb` color in the middle of a transparent square, as premultiplied BGRA
 * pixels, the format of `nativeImage.createFromBitmap()`. The edge is smoothed over one pixel.
 */
export function colorDotPixels(color: string, size = DOT_ICON_SIZE): Buffer {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16))
  const center = size / 2
  const radius = (DOT_RADIUS * size) / DOT_ICON_SIZE
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot(x + 0.5 - center, y + 0.5 - center)
      const alpha = Math.min(1, Math.max(0, radius + 0.5 - distance))
      const offset = (y * size + x) * 4
      pixels[offset] = Math.round(blue * alpha)
      pixels[offset + 1] = Math.round(green * alpha)
      pixels[offset + 2] = Math.round(red * alpha)
      pixels[offset + 3] = Math.round(255 * alpha)
    }
  }
  return pixels
}

/**
 * Wraps a square PNG into an ICO file, which may hold PNG data since Windows Vista. Windows takes
 * the icon of a jump list entry only from a file.
 */
export function icoFromPng(png: Buffer, size = DOT_ICON_SIZE): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size % 256, 6)
  header.writeUInt8(size % 256, 7)
  header.writeUInt8(0, 8)
  header.writeUInt8(0, 9)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}
