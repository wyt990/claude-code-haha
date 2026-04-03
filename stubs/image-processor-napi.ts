/* eslint-disable @typescript-eslint/no-explicit-any */

export type SharpFunction = any

export function processImage(_input: unknown): unknown {
  return null
}

export const sharp: SharpFunction = (() => {
  return {}
}) as unknown as SharpFunction

export default sharp

export interface ClipboardImageResult {
  png: Buffer
  originalWidth: number
  originalHeight: number
  width: number
  height: number
}

export function getNativeModule(): { hasClipboardImage: () => boolean; readClipboardImage: (maxW: number, maxH: number) => ClipboardImageResult | null } {
  return {
    hasClipboardImage: () => false,
    readClipboardImage: () => null,
  }
}
