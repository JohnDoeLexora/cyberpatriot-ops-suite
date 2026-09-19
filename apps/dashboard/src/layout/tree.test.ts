import { describe, expect, it } from 'vitest'
import { mosaicMode, NARROW_STACK_WIDTH_PX, shouldStackPanes, TAB_OVERFLOW_COUNT } from './stack'
import {
  addLeafPreferGrid,
  dockAtRoot,
  findFatLeaf,
  insertLeafAtEdge,
  isTwoByTwo,
  leafCount,
  moveLeaf,
  parentDirection,
  removeLeaf,
  splitLeaf,
  walkLeaves,
  type MosaicNode,
} from './tree'

const leaf = (id: string): MosaicNode => ({ type: 'leaf', id })

function grow(ids: string[]): MosaicNode {
  let root: MosaicNode = leaf(ids[0]!)
  for (let i = 1; i < ids.length; i++) {
    root = addLeafPreferGrid(root, ids[i - 1]!, ids[i]!)
  }
  return root
}

describe('mosaic tree', () => {
  it('splits a leaf into two', () => {
    const root = splitLeaf(leaf('a'), 'a', 'horizontal', 'b')
    expect(walkLeaves(root)).toEqual(['a', 'b'])
    expect(leafCount(root)).toBe(2)
  })

  it('removes a leaf and promotes the sibling', () => {
    const root = splitLeaf(leaf('a'), 'a', 'vertical', 'b')
    const next = removeLeaf(root, 'b')
    expect(next).toEqual(leaf('a'))
  })

  it('keeps the last leaf', () => {
    expect(removeLeaf(leaf('a'), 'a')).toEqual(leaf('a'))
  })

  it('inserts at an edge', () => {
    const root = insertLeafAtEdge(leaf('a'), 'a', 'c', 'left')
    expect(root.type).toBe('split')
    if (root.type !== 'split') return
    expect(root.direction).toBe('horizontal')
    expect(walkLeaves(root)).toEqual(['c', 'a'])
  })

  it('keeps left/right as horizontal and top/bottom as vertical', () => {
    const right = insertLeafAtEdge(leaf('a'), 'a', 'b', 'right')
    const bottom = insertLeafAtEdge(leaf('a'), 'a', 'b', 'bottom')
    expect(right.type === 'split' && right.direction).toBe('horizontal')
    expect(bottom.type === 'split' && bottom.direction).toBe('vertical')
  })

  it('docks a third pane at the root', () => {
    const two = splitLeaf(leaf('a'), 'a', 'horizontal', 'b')
    const three = dockAtRoot(two, 'c', 'right')
    expect(walkLeaves(three)).toEqual(['a', 'b', 'c'])
    expect(three.type).toBe('split')
    if (three.type !== 'split') return
    expect(three.ratio).toBeCloseTo(0.66)
  })

  it('moves a pane onto another edge', () => {
    let root: MosaicNode = splitLeaf(leaf('a'), 'a', 'horizontal', 'b')
    root = splitLeaf(root, 'b', 'vertical', 'c')
    const moved = moveLeaf(root, 'c', 'a', 'bottom')
    expect(walkLeaves(moved).sort()).toEqual(['a', 'b', 'c'])
    expect(leafCount(moved)).toBe(3)
  })
})

describe('2×2 grid layout', () => {
  it('opens the second pane as a 2-up row', () => {
    const root = addLeafPreferGrid(leaf('a'), 'a', 'b')
    expect(root.type).toBe('split')
    if (root.type !== 'split') return
    expect(root.direction).toBe('horizontal')
    expect(walkLeaves(root)).toEqual(['a', 'b'])
    expect(parentDirection(root, 'a')).toBe('horizontal')
  })

  it('starts the matrix by splitting the focused pane perpendicular to the row', () => {
    const two = addLeafPreferGrid(leaf('a'), 'a', 'b')
    const three = addLeafPreferGrid(two, 'b', 'c')
    expect(three.type).toBe('split')
    if (three.type !== 'split') return
    expect(three.direction).toBe('horizontal')
    expect(three.second.type).toBe('split')
    if (three.second.type !== 'split') return
    expect(three.second.direction).toBe('vertical')
    expect(findFatLeaf(three)).toBe('a')
  })

  it('completes a 2×2 instead of a third column or a 1×4 strip', () => {
    const four = grow(['a', 'b', 'c', 'd'])
    expect(walkLeaves(four).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(isTwoByTwo(four)).toBe(true)
    expect(four.type).toBe('split')
    if (four.type !== 'split') return
    expect(four.direction).toBe('horizontal')
    expect(four.first.type).toBe('split')
    expect(four.second.type).toBe('split')
    if (four.first.type !== 'split' || four.second.type !== 'split') return
    expect(four.first.direction).toBe('vertical')
    expect(four.second.direction).toBe('vertical')
  })

  it('still builds a 2×2 when focus stays on the first pane', () => {
    let root: MosaicNode = leaf('a')
    root = addLeafPreferGrid(root, 'a', 'b')
    root = addLeafPreferGrid(root, 'a', 'c')
    root = addLeafPreferGrid(root, 'a', 'd')
    expect(isTwoByTwo(root)).toBe(true)
  })

  it('does not treat four stacked rows as a 2×2', () => {
    let strip: MosaicNode = leaf('a')
    strip = splitLeaf(strip, 'a', 'vertical', 'b')
    strip = splitLeaf(strip, 'b', 'vertical', 'c')
    strip = splitLeaf(strip, 'c', 'vertical', 'd')
    expect(leafCount(strip)).toBe(4)
    expect(isTwoByTwo(strip)).toBe(false)
  })

  it('does not treat four columns as a 2×2', () => {
    let cols: MosaicNode = leaf('a')
    cols = splitLeaf(cols, 'a', 'horizontal', 'b')
    cols = splitLeaf(cols, 'b', 'horizontal', 'c')
    cols = splitLeaf(cols, 'c', 'horizontal', 'd')
    expect(isTwoByTwo(cols)).toBe(false)
  })
})

describe('mosaic stack policy', () => {
  it('keeps a single pane full-bleed', () => {
    expect(shouldStackPanes(1, 1440)).toBe(false)
    expect(mosaicMode(1, 1440)).toBe('single')
  })

  it('keeps two, three, and four panes in the mosaic on desktop', () => {
    expect(shouldStackPanes(2, 1100)).toBe(false)
    expect(shouldStackPanes(3, 1100)).toBe(false)
    expect(shouldStackPanes(4, 1440)).toBe(false)
    expect(mosaicMode(4, 1440)).toBe('mosaic')
  })

  it('tabs from the fifth pane, not the third', () => {
    expect(TAB_OVERFLOW_COUNT).toBe(5)
    expect(shouldStackPanes(4, 1920)).toBe(false)
    expect(shouldStackPanes(5, 1920)).toBe(true)
    expect(mosaicMode(5, 1920)).toBe('tabs')
  })

  it('stacks on a phone-width mosaic', () => {
    expect(shouldStackPanes(2, NARROW_STACK_WIDTH_PX - 1)).toBe(true)
    expect(mosaicMode(4, 400)).toBe('tabs')
  })

  it('does not stack an unmeasured mosaic (jsdom / first paint)', () => {
    expect(shouldStackPanes(4, 0)).toBe(false)
    expect(mosaicMode(4, 0)).toBe('mosaic')
  })
})
