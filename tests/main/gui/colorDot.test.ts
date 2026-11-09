import { describe, expect, it } from 'vitest'
import { DOT_ICON_SIZE, colorDotPixels, icoFromPng } from '@/main/gui/colorDot'

function pixelAt(pixels: Buffer, x: number, y: number): number[] {
  const offset = (y * DOT_ICON_SIZE + x) * 4
  return [...pixels.subarray(offset, offset + 4)]
}

describe('color dot', () => {
  it('fills the middle with the color as opaque BGRA and leaves the corners transparent', () => {
    const pixels = colorDotPixels('#a855f7')

    expect(pixels).toHaveLength(DOT_ICON_SIZE * DOT_ICON_SIZE * 4)
    expect(pixelAt(pixels, DOT_ICON_SIZE / 2, DOT_ICON_SIZE / 2)).toEqual([0xf7, 0x55, 0xa8, 255])
    expect(pixelAt(pixels, 0, 0)).toEqual([0, 0, 0, 0])
  })

  it('wraps a PNG into an ICO file with one entry', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const ico = icoFromPng(png)

    expect([...ico.subarray(0, 6)]).toEqual([0, 0, 1, 0, 1, 0])
    expect(ico.readUInt8(6)).toBe(DOT_ICON_SIZE)
    expect(ico.readUInt32LE(14)).toBe(png.length)
    expect(ico.readUInt32LE(18)).toBe(22)
    expect(ico.subarray(22)).toEqual(png)
  })
})
