import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { OPS_BY_ID } from '../catalog/ops'
import { mosaicMode, MOSAIC_PANEL_MIN_PERCENT, shouldStackPanes } from '../layout/stack'
import type { DropEdge, MosaicNode } from '../layout/tree'
import { isTwoByTwo, walkLeaves } from '../layout/tree'
import { cn } from '../lib/cn'
import { useWorkspace, type DragPayload } from '../state/workspace'
import { OpPanel } from './OpPanel'

export function Mosaic() {
  const { tree, focusedId, focusPane, panes } = useWorkspace()
  const leaves = walkLeaves(tree)
  const hostRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(hostRef)
  const stack = shouldStackPanes(leaves.length, width)
  const mode = mosaicMode(leaves.length, width)

  return (
    <div
      ref={hostRef}
      className="relative flex h-full min-h-0 flex-col bg-app px-3 pb-3 pt-2"
      data-testid="mosaic"
      data-mosaic-mode={mode}
      data-mosaic-grid={isTwoByTwo(tree) ? '2x2' : 'off'}
    >
      {stack && (
        <nav
          role="tablist"
          aria-label="Open panes"
          className="mb-2 flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-line bg-elev/90 px-1.5 py-1.5 shadow-sm"
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
                role="tab"
                aria-selected={active}
                data-testid={`pane-tab-${id}`}
                data-op-id={pane?.opId ?? ''}
                onClick={() => focusPane(id)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-panel text-ink shadow-sm ring-1 ring-line-strong'
                    : 'text-mute hover:bg-hover hover:text-ink',
                )}
              >
                {op ? op.title : 'Empty'}
              </button>
            )
          })}
        </nav>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        {stack ? (
          <div className="h-full min-h-0">
            {leaves.map((id) => (
              <div
                key={id}
                className={cn('h-full min-h-0', id === focusedId ? 'block' : 'hidden')}
              >
                <PaneFrame paneId={id} overlay={id === focusedId} />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-0">
            <MosaicNodeView node={tree} />
          </div>
        )}
      </div>
    </div>
  )
}

function useElementWidth(ref: { current: HTMLElement | null }) {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const next = el.clientWidth
      if (next > 0) setWidth(next)
    }
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

function PaneFrame({ paneId, overlay = true }: { paneId: string; overlay?: boolean }) {
  return (
    <div className="relative h-full min-h-0 p-0.5">
      <div className="pane-frame h-full min-h-0 overflow-hidden">
        <OpPanel paneId={paneId} />
        {overlay && <DropOverlay paneId={paneId} />}
      </div>
    </div>
  )
}

function MosaicNodeView({ node }: { node: MosaicNode }) {
  const { setRatio } = useWorkspace()
  if (node.type === 'leaf') {
    return <PaneFrame paneId={node.id} />
  }

  const direction = node.direction === 'horizontal' ? 'horizontal' : 'vertical'
  const firstPct = Math.round(node.ratio * 100)
  const secondPct = 100 - firstPct
  const minSize = MOSAIC_PANEL_MIN_PERCENT

  return (
    <PanelGroup
      direction={direction}
      id={node.id}
      onLayout={(sizes) => {
        const a = sizes[0]
        if (typeof a === 'number') setRatio(node.id, a / 100)
      }}
    >
      <Panel defaultSize={firstPct} minSize={minSize} id={`${node.id}-a`} order={1} className="min-h-0">
        <MosaicNodeView node={node.first} />
      </Panel>
      <PanelResizeHandle className="resize-handle" />
      <Panel defaultSize={secondPct} minSize={minSize} id={`${node.id}-b`} order={2} className="min-h-0">
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
      className="absolute inset-1.5 z-10"
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
      <div className="pointer-events-none absolute inset-2 grid grid-cols-3 grid-rows-3 gap-1.5">
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
        'flex items-center justify-center rounded-lg text-[12px] font-medium tracking-wide text-accent/80',
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
