/**
 * Shared rendering constants and functions.
 * Single source of truth for both BookMode (editor) and ExactPageRenderer (PDF export).
 *
 * === CANONICAL RENDERING ===
 * All pages are rendered at a FIXED canonical width (CANONICAL_PAGE_WIDTH = 500px).
 * The height is determined by the format's aspect ratio.
 * The container uses CSS `transform: scale()` to fit the viewport.
 *
 * This ensures:
 * - All elements (text, images, decorations, textboxes) are positioned in a
 *   deterministic coordinate space, regardless of screen size.
 * - The editor and PDF export render at the same dimensions → true WYSIWYG.
 * - Font sizes, line heights, decoration sizes are absolute values — no scaling needed.
 */

import type { BookFormat } from '@/store/usePublishStore'
import { BOOK_FORMATS } from '@/store/usePublishStore'

// ---------------------------------------------------------------------------
// Canonical dimensions
// ---------------------------------------------------------------------------

/** Fixed width for all page formats. Height varies by aspect ratio. */
export const CANONICAL_PAGE_WIDTH = 500

/** @deprecated Use CANONICAL_PAGE_WIDTH instead. Kept for backward compat. */
export const REFERENCE_PAGE_WIDTH = CANONICAL_PAGE_WIDTH

/**
 * Resolve a BookFormat to its actual format ID.
 * Handles aliases like 'portrait-a4' → 'portrait-a5' (same Gelato product).
 */
function resolveFormatId(bookFormat: BookFormat): BookFormat {
  if (bookFormat === 'portrait-a4') return 'portrait-a5'
  return bookFormat
}

/**
 * Get the canonical pixel dimensions for a given book format.
 * Width is always CANONICAL_PAGE_WIDTH (500px).
 * Height is calculated from the format's mm ratio.
 */
export function getCanonicalDimensions(bookFormat: BookFormat = 'portrait-a5'): { width: number; height: number } {
  const fmt = BOOK_FORMATS.find(f => f.id === resolveFormatId(bookFormat))
  if (!fmt) return { width: CANONICAL_PAGE_WIDTH, height: Math.round(CANONICAL_PAGE_WIDTH / 0.75) } // fallback portrait 21×28
  const ratio = fmt.widthMm / fmt.heightMm
  return {
    width: CANONICAL_PAGE_WIDTH,
    height: Math.round(CANONICAL_PAGE_WIDTH / ratio),
  }
}

/**
 * Compute the CSS scale factor to fit the canonical page inside a viewport area.
 * Used by the editor to scale the fixed-size page to the available space.
 */
export function getFitScale(
  canonicalWidth: number,
  canonicalHeight: number,
  availableWidth: number,
  availableHeight: number,
): number {
  if (availableWidth <= 0 || availableHeight <= 0) return 1
  return Math.min(availableWidth / canonicalWidth, availableHeight / canonicalHeight)
}

// ---------------------------------------------------------------------------
// Line spacing & font sizing (values are absolute at canonical size)
// ---------------------------------------------------------------------------

export const LINE_SPACINGS = {
  tight:   { label: 'Serré',  nameKey: 'lineSpacings.tight',   pixelHeight: 24 },
  normal:  { label: 'Normal', nameKey: 'lineSpacings.normal',  pixelHeight: 32 },
  relaxed: { label: 'Aéré',   nameKey: 'lineSpacings.relaxed', pixelHeight: 40 },
} as const

export type LineSpacing = keyof typeof LINE_SPACINGS

/**
 * @deprecated With canonical rendering, pageScale is always 1.
 * Kept temporarily for backward compat during migration.
 */
export function getPageScale(pageWidth: number): number {
  return pageWidth / REFERENCE_PAGE_WIDTH
}

export function getBaseLineHeightPx(spacing: LineSpacing = 'normal'): number {
  return LINE_SPACINGS[spacing]?.pixelHeight ?? 32
}

/**
 * Get the line height in px for a given spacing.
 * With canonical rendering, pageWidth should always be CANONICAL_PAGE_WIDTH (scale = 1).
 */
export function getScaledLineHeightPx(spacing: LineSpacing, pageWidth: number = CANONICAL_PAGE_WIDTH): number {
  return Math.round(getBaseLineHeightPx(spacing) * getPageScale(pageWidth))
}

/**
 * Get the scaled font size in px.
 * With canonical rendering, pageWidth should always be CANONICAL_PAGE_WIDTH (scale = 1).
 */
export function getScaledFontSize(fontSize: number, pageWidth: number = CANONICAL_PAGE_WIDTH): number {
  return fontSize * getPageScale(pageWidth)
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

export const DECORATION_BASE_SIZE = 64

/**
 * @deprecated Use getPagePadding(bookFormat) for pixel-exact padding.
 * Kept for backward compat — but these % values are AMBIGUOUS in CSS:
 *   - padding-top: 8% → 8% of WIDTH (CSS spec)
 *   - top: 8% (absolute) → 8% of HEIGHT
 * This caused text/line misalignment on non-square formats.
 */
export const PAGE_PADDING = {
  left: '10%',
  right: '10%',
  top: '8%',
  bottom: '12%',
} as const

/**
 * Page padding ratios (as fractions, not CSS percentages).
 * ALL ratios are fractions of WIDTH — matching the CSS `padding: X%` behavior
 * where padding-top/bottom percentages are resolved against the containing
 * block's WIDTH (not height). See CSS spec §8.4.
 *
 * This ensures pixel-perfect alignment between the editor (BookMode) and
 * the PDF export (ExactPageRenderer), regardless of page aspect ratio.
 */
export const PAGE_PADDING_RATIOS = {
  left: 0.10,   // 10% of width
  right: 0.10,  // 10% of width
  top: 0.08,    // 8% of width  (CSS padding-top % = % of width)
  bottom: 0.12, // 12% of width (CSS padding-bottom % = % of width)
} as const

/**
 * Compute pixel-exact page padding for a given book format.
 * All values are in px, computed from the canonical WIDTH.
 *
 * IMPORTANT: top/bottom are based on WIDTH (not height) to match CSS
 * `padding: X%` behavior. This is the single source of truth — use
 * these values EVERYWHERE (text padding, line positions, safe zones, export).
 */
export function getPagePaddingPx(bookFormat: BookFormat = 'portrait-a5'): {
  left: number; right: number; top: number; bottom: number
} {
  const dims = getCanonicalDimensions(resolveFormatId(bookFormat))
  return {
    left: Math.round(PAGE_PADDING_RATIOS.left * dims.width),
    right: Math.round(PAGE_PADDING_RATIOS.right * dims.width),
    top: Math.round(PAGE_PADDING_RATIOS.top * dims.width),
    bottom: Math.round(PAGE_PADDING_RATIOS.bottom * dims.width),
  }
}

/** Spine width in px (visual book binding) */
export const SPINE_WIDTH = 16
