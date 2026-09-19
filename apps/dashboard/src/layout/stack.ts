/** Floor so a 2×2 cell cannot be dragged down to the old ~168px columns. */
export const MIN_PANE_WIDTH_PX = 280
export const MIN_PANE_HEIGHT_PX = 200

/** Phone-width mosaic: fall back to tabs. Desktop 2–4 panes stay in the tree. */
export const NARROW_STACK_WIDTH_PX = 560

/** Tabs are overflow after a comfortable 2×2, not a cap at two panes. */
export const TAB_OVERFLOW_COUNT = 5

/** Percentage minSize on each 2-child split (~32% of that axis). */
export const MOSAIC_PANEL_MIN_PERCENT = 32

/**
 * Stack (tabs + one pane) at 5+ leaves, or when the mosaic is too narrow for
 * even a 2-up. Width 0 means unmeasured (jsdom / first paint) — keep the tree
 * visible so 2×2 tests and the first frame stay stable.
 */
export function shouldStackPanes(leafCount: number, mosaicWidthPx: number): boolean {
  if (leafCount <= 1) return false
  if (leafCount >= TAB_OVERFLOW_COUNT) return true
  if (mosaicWidthPx <= 0) return false
  return mosaicWidthPx < NARROW_STACK_WIDTH_PX
}

export type MosaicMode = 'single' | 'mosaic' | 'tabs'

export function mosaicMode(leafCount: number, mosaicWidthPx: number): MosaicMode {
  if (leafCount <= 1) return 'single'
  return shouldStackPanes(leafCount, mosaicWidthPx) ? 'tabs' : 'mosaic'
}
