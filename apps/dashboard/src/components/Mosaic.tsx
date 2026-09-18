import { useEffect, useState, type DragEvent } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { OPS_BY_ID } from '../catalog/ops'
import type { DropEdge, MosaicNode } from '../layout/tree'
import { leafCount, walkLeaves } from '../layout/tree'
import { cn } from '../lib/cn'
import { useWorkspace, type DragPayload } from '../state/workspace'
import { OpPanel } from './OpPanel'

export function Mosaic() {
  const { tree, focusedId, focusPane, panes } = useWorkspace()
  const leaves = walkLeaves(tree)
  const many = leafCount(tree) >= 2
  const stack = useStackPanes(leaves.length)

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-app" data-testid="mosaic">
      {many && (
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-sidebar px-2 py-1.5"
          data-testid="pane-tabs"
        >
          {leaves.map((id) => {
            const pane = panes[id]
            const op = pane?.opId ? OPS_BY_ID[pane.opId] : null
            const active = focusedId === id
            return (
              <button
                key={id}
                type="button"
                data-testid={`pane-tab-${id}`}
                onClick={() => {
                  focusPane(id)
                  document
                    .querySelector(`[data-pane-id="${id}"]`)
                    ?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
                }}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[13px]',
                  active ? 'bg-elev text-ink shadow-sm' : 'text-mute hover:bg-hover hover:text-ink',
                )}
              >
                {op ? op.title : 'Empty'}
              </button>
            )
          })}
        </nav>
      )}
      <div className={cn('min-h-0 flex-1', stack ? 'overflow-hidden' : 'overflow-auto')}>
        {stack ? (
          <div className="pane-min h-full">
            <OpPanel paneId={focusedId} />
            <DropOverlay paneId={focusedId} />
          </div>
        ) : (
          <div className="h-full min-h-0 min-w-full">
            <MosaicNodeView node={tree} />
          </div>
        )}
      </div>
    </div>
  )
}

function useStackPanes(count: number) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 720,
  )
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 720)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count >= 5 || (count >= 4 && narrow) || (count >= 2 && narrow)
}

function MosaicNodeView({ node }: { node: MosaicNode }) {
  const { setRatio } = useWorkspace()
  if (node.type === 'leaf') {
    return (
      <div className="relative h-full min-h-0 pane-min">
        <OpPanel paneId={node.id} />
        <DropOverlay paneId={node.id} />
      </div>
    )
  }

  const direction = node.direction === 'horizontal' ? 'horizontal' : 'vertical'
  const firstPct = Math.round(node.ratio * 100)
  const secondPct = 100 - firstPct

  return (
    <PanelGroup
      direction={direction}
      id={node.id}
      onLayout={(sizes) => {
        const a = sizes[0]
        if (typeof a === 'number') setRatio(node.id, a / 100)
      }}
    >
      <Panel defaultSize={firstPct} minSize={14} id={`${node.id}-a`} order={1} className="min-h-0">
        <MosaicNodeView node={node.first} />
      </Panel>
      <PanelResizeHandle className="resize-handle" />
      <Panel defaultSize={secondPct} minSize={14} id={`${node.id}-b`} order={2} className="min-h-0">
        <MosaicNodeView node={node.second} />
      </Panel>
    </PanelGroup>
  )
}

function readPayload(e: DragEvent): DragPayload | null {
  const opId = e.dataTransfer.getData('application/x-cp-op') || ''
  if (opId) return { kind: 'op', opId }
  const paneId = e.dataTransfer.getData('application/x-cp-pane') || ''
  if (paneId) return { kind: 'pane', paneId }
  const fallback = e.dataTransfer.getData('text/plain')
  if (fallback.startsWith('op:')) return { kind: 'op', opId: fallback.slice(3) }
  if (fallback.startsWith('pane:')) return { kind: 'pane', paneId: fallback.slice(5) }
  return null
}

function DropOverlay({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const [dragging, setDragging] = useState(false)
  const [over, setOver] = useState<DropEdge | null>(null)

  useEffect(() => {
    const on = () => setDragging(true)
    const off = () => {
      setDragging(false)
      setOver(null)
    }
    window.addEventListener('dragstart', on)
    window.addEventListener('dragend', off)
    window.addEventListener('drop', off)
    return () => {
      window.removeEventListener('dragstart', on)
      window.removeEventListener('dragend', off)
      window.removeEventListener('drop', off)
    }
  }, [])

  if (!dragging) return null

  return (
    <div
      className="absolute inset-0 z-10"
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-cp-pane')
          ? 'move'
          : 'copy'
        setOver(edgeFromPoint(e))
      }}
      onDrop={(e) => {
        e.preventDefault()
        const payload = readPayload(e)
        const edge = edgeFromPoint(e)
        setOver(null)
        if (payload) ws.dropOnPane(paneId, edge, payload)
      }}
    >
      <div className="pointer-events-none absolute inset-1 grid grid-cols-3 grid-rows-3 gap-1">
        <Zone className="col-start-2 row-start-1" on={over === 'top'} label="Top" />
        <Zone className="col-start-1 row-start-2" on={over === 'left'} label="Left" />
        <Zone className="col-start-2 row-start-2" on={over === 'center'} label="Replace" />
        <Zone className="col-start-3 row-start-2" on={over === 'right'} label="Right" />
        <Zone className="col-start-2 row-start-3" on={over === 'bottom'} label="Bottom" />
      </div>
    </div>
  )
}

function Zone({ className, on, label }: { className: string; on: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-sm text-[11px] tracking-wide text-accent/80',
        className,
        on ? 'drop-zone' : 'bg-ink/5',
      )}
    >
      {label}
    </div>
  )
}

function edgeFromPoint(e: DragEvent): DropEdge {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  const band = 0.28
  if (y < band) return 'top'
  if (y > 1 - band) return 'bottom'
  if (x < band) return 'left'
  if (x > 1 - band) return 'right'
  return 'center'
}
