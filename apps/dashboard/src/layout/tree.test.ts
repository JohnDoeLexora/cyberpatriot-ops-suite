import { describe, expect, it } from 'vitest'
import {
  dockAtRoot,
  insertLeafAtEdge,
  leafCount,
  moveLeaf,
  removeLeaf,
  splitLeaf,
  walkLeaves,
  type MosaicNode,
} from './tree'

const leaf = (id: string): MosaicNode => ({ type: 'leaf', id })

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
