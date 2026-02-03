/**
 * Shared rendering constants and functions.
 * Single source of truth for both BookMode (editor) and ExactPageRenderer (PDF export).
 */

export const REFERENCE_PAGE_WIDTH = 500

export const LINE_SPACINGS = {
  tight:   { label: 'Serré',  pixelHeight: 24 },
  normal:  { label: 'Normal', pixelHeight: 32 },
  relaxed: { label: 'Aéré',   pixelHeight: 40 },
} as const

export type LineSpacing = keyof typeof LINE_SPACINGS

export function getPageScale(pageWidth: number): number {
  return pageWidth / REFERENCE_PAGE_WIDTH
}

export function getBaseLineHeightPx(spacing: LineSpacing = 'normal'): number {
  return LINE_SPACINGS[spacing]?.pixelHeight ?? 32
}

export function getScaledLineHeightPx(spacing: LineSpacing, pageWidth: number): number {
  return Math.round(getBaseLineHeightPx(spacing) * getPageScale(pageWidth))
}

export function getScaledFontSize(fontSize: number, pageWidth: number): number {
  return fontSize * getPageScale(pageWidth)
}

export const DECORATION_BASE_SIZE = 64

export const PAGE_PADDING = {
  left: '10%',
  right: '10%',
  top: '8%',
  bottom: '12%',
} as const
