export type SplitDirection = 'horizontal' | 'vertical'

export type LeafNode = { type: 'leaf'; id: string }

export type SplitNode = {
  type: 'split'
  id: string
  direction: SplitDirection
  ratio: number
  first: MosaicNode
  second: MosaicNode
}

export type MosaicNode = LeafNode | SplitNode

export type DropEdge = 'center' | 'left' | 'right' | 'top' | 'bottom'

export function walkLeaves(node: MosaicNode): string[] {
  if (node.type === 'leaf') return [node.id]
  return [...walkLeaves(node.first), ...walkLeaves(node.second)]
}

export function leafCount(node: MosaicNode): number {
  return walkLeaves(node).length
}

export function containsLeaf(node: MosaicNode, id: string): boolean {
  if (node.type === 'leaf') return node.id === id
  return containsLeaf(node.first, id) || containsLeaf(node.second, id)
}

function replace(node: MosaicNode, id: string, next: MosaicNode): MosaicNode {
  if (node.type === 'leaf') return node.id === id ? next : node
  if (node.id === id) return next
  return {
    ...node,
    first: replace(node.first, id, next),
    second: replace(node.second, id, next),
  }
}

export function setSplitRatio(node: MosaicNode, splitId: string, ratio: number): MosaicNode {
  if (node.type === 'leaf') return node
  if (node.id === splitId) {
    return { ...node, ratio: Math.min(0.8, Math.max(0.2, ratio)) }
  }
  return {
    ...node,
    first: setSplitRatio(node.first, splitId, ratio),
    second: setSplitRatio(node.second, splitId, ratio),
  }
}

/**
 * Default catalog layout: 2-up, then a 2×2 matrix, never a 1×4 strip.
 *
 * 1→2  horizontal split (side by side)
 * 2→3  split the focused leaf perpendicular to its parent
 * 3→4  split the remaining “fat” leaf (full row/column) so both sides nest
 *      in the opposite direction — a 2×2, not a third column or fourth row
 * 5+   still split (the view may tab); prefer perpendicular to avoid strips
 */
export function addLeafPreferGrid(
  root: MosaicNode,
  focusedId: string,
  newLeafId: string,
): MosaicNode {
  const count = leafCount(root)
  const splitFrom = containsLeaf(root, focusedId) ? focusedId : walkLeaves(root)[0]

  if (count <= 1) {
    return splitLeaf(root, splitFrom, 'horizontal', newLeafId)
  }

  if (count === 3) {
    const fat = findFatLeaf(root)
    const target = fat ?? splitFrom
    const parentDir = parentDirection(root, target) ?? 'horizontal'
    return splitLeaf(root, target, perpendicular(parentDir), newLeafId)
  }

  const parentDir = parentDirection(root, splitFrom) ?? 'horizontal'
  return splitLeaf(root, splitFrom, perpendicular(parentDir), newLeafId)
}

export function perpendicular(direction: SplitDirection): SplitDirection {
  return direction === 'horizontal' ? 'vertical' : 'horizontal'
}

/** Direction of the split that directly contains `leafId`. */
export function parentDirection(root: MosaicNode, leafId: string): SplitDirection | null {
  const walk = (node: MosaicNode, parent: SplitNode | null): SplitDirection | null => {
    if (node.type === 'leaf') return node.id === leafId ? (parent?.direction ?? null) : null
    return walk(node.first, node) ?? walk(node.second, node)
  }
  return walk(root, null)
}

/**
 * The leaf that still occupies a full side of a split (sibling of a nested
 * split). Splitting it completes a 2×2 instead of deepening a strip.
 */
export function findFatLeaf(node: MosaicNode): string | null {
  if (node.type !== 'split') return null
  if (node.first.type === 'leaf' && node.second.type === 'split') return node.first.id
  if (node.second.type === 'leaf' && node.first.type === 'split') return node.second.id
  return findFatLeaf(node.first) ?? findFatLeaf(node.second)
}

/**
 * True when the root is a 2-way split and each child is a 2-leaf split in the
 * perpendicular direction — two across and two below, not 1×4 or 4×1.
 */
export function isTwoByTwo(node: MosaicNode): boolean {
  if (node.type !== 'split' || leafCount(node) !== 4) return false
  const { first, second, direction } = node
  if (first.type !== 'split' || second.type !== 'split') return false
  if (leafCount(first) !== 2 || leafCount(second) !== 2) return false
  const perp = perpendicular(direction)
  return first.direction === perp && second.direction === perp
}

export function splitLeaf(
  root: MosaicNode,
  leafId: string,
  direction: SplitDirection,
  newLeafId: string,
  place: 'after' | 'before' = 'after',
): MosaicNode {
  const leaf: LeafNode = { type: 'leaf', id: leafId }
  const created: LeafNode = { type: 'leaf', id: newLeafId }
  const split: SplitNode = {
    type: 'split',
    id: `split_${newLeafId}`,
    direction,
    ratio: 0.5,
    first: place === 'before' ? created : leaf,
    second: place === 'before' ? leaf : created,
  }
  return replace(root, leafId, split)
}

/** Remove a leaf. Returns the remaining tree. Last leaf is kept (caller should clear it). */
export function removeLeaf(root: MosaicNode, leafId: string): MosaicNode {
  if (root.type === 'leaf') return root

  if (root.first.type === 'leaf' && root.first.id === leafId) return root.second
  if (root.second.type === 'leaf' && root.second.id === leafId) return root.first

  return {
    ...root,
    first: removeLeaf(root.first, leafId),
    second: removeLeaf(root.second, leafId),
  }
}

function edgeToSplit(edge: Exclude<DropEdge, 'center'>): {
  direction: SplitDirection
  place: 'before' | 'after'
} {
  if (edge === 'left') return { direction: 'horizontal', place: 'before' }
  if (edge === 'right') return { direction: 'horizontal', place: 'after' }
  if (edge === 'top') return { direction: 'vertical', place: 'before' }
  return { direction: 'vertical', place: 'after' }
}

export function insertLeafAtEdge(
  root: MosaicNode,
  targetLeafId: string,
  newLeafId: string,
  edge: Exclude<DropEdge, 'center'>,
): MosaicNode {
  const { direction, place } = edgeToSplit(edge)
  return splitLeaf(root, targetLeafId, direction, newLeafId, place)
}

/**
 * Move an existing leaf onto another leaf. Center swaps IDs (contents stay
 * bound to pane ids in the store). Edge drops remove the source then split
 * the target.
 */
export function moveLeaf(
  root: MosaicNode,
  sourceId: string,
  targetId: string,
  edge: DropEdge,
): MosaicNode {
  if (sourceId === targetId) return root
  if (!containsLeaf(root, sourceId) || !containsLeaf(root, targetId)) return root

  if (edge === 'center') {
    return swapLeafIds(root, sourceId, targetId)
  }

  const stripped = removeLeaf(root, sourceId)
  if (!containsLeaf(stripped, targetId)) {
    // Target was the sibling that got promoted; re-insert against the promoted node.
    return insertAgainstRoot(stripped, sourceId, edge)
  }
  return insertLeafAtEdge(stripped, targetId, sourceId, edge)
}

export function dockAtRoot(
  root: MosaicNode,
  newLeafId: string,
  edge: Exclude<DropEdge, 'center'>,
): MosaicNode {
  const { direction, place } = edgeToSplit(edge)
  const created: LeafNode = { type: 'leaf', id: newLeafId }
  return {
    type: 'split',
    id: `split_${newLeafId}`,
    direction,
    ratio: place === 'after' ? 0.66 : 0.34,
    first: place === 'before' ? created : root,
    second: place === 'before' ? root : created,
  }
}

function insertAgainstRoot(
  root: MosaicNode,
  newLeafId: string,
  edge: Exclude<DropEdge, 'center'>,
): MosaicNode {
  const { direction, place } = edgeToSplit(edge)
  const created: LeafNode = { type: 'leaf', id: newLeafId }
  return {
    type: 'split',
    id: `split_${newLeafId}`,
    direction,
    ratio: 0.5,
    first: place === 'before' ? created : root,
    second: place === 'before' ? root : created,
  }
}

function swapLeafIds(node: MosaicNode, a: string, b: string): MosaicNode {
  if (node.type === 'leaf') {
    if (node.id === a) return { ...node, id: b }
    if (node.id === b) return { ...node, id: a }
    return node
  }
  return {
    ...node,
    first: swapLeafIds(node.first, a, b),
    second: swapLeafIds(node.second, a, b),
  }
}

export function isMosaicNode(value: unknown): value is MosaicNode {
  if (!value || typeof value !== 'object') return false
  const node = value as MosaicNode
  if (node.type === 'leaf') return typeof node.id === 'string'
  if (node.type === 'split') {
    return (
      typeof node.id === 'string' &&
      (node.direction === 'horizontal' || node.direction === 'vertical') &&
      typeof node.ratio === 'number' &&
      isMosaicNode(node.first) &&
      isMosaicNode(node.second)
    )
  }
  return false
}
