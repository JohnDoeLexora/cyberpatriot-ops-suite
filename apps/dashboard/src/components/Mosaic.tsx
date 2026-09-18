import { useEffect, useState, type DragEvent } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import type { DropEdge, MosaicNode } from '../layout/tree'
import { cn } from '../lib/cn'
import { useWorkspace, type DragPayload } from '../state/workspace'
import { OpPanel } from './OpPanel'

export function Mosaic() {
  const { tree } = useWorkspace()
  return (
    <div className="relative h-full min-h-0 bg-app" data-testid="mosaic">
      <MosaicNodeView node={tree} />
    </div>
  )
}

function MosaicNodeView({ node }: { node: MosaicNode }) {
  const { setRatio } = useWorkspace()
  if (node.type === 'leaf') {
    return (
      <div className="relative h-full min-h-0">
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
      <Panel defaultSize={firstPct} minSize={18} id={`${node.id}-a`} order={1}>
        <MosaicNodeView node={node.first} />
      </Panel>
      <PanelResizeHandle className="resize-handle" />
      <Panel defaultSize={secondPct} minSize={18} id={`${node.id}-b`} order={2}>
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
      <div className="absolute inset-1 grid grid-cols-3 grid-rows-3 gap-1 pointer-events-none">
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
        'flex items-center justify-center rounded-sm text-[10px] uppercase tracking-wide text-accent/80',
        className,
        on ? 'drop-zone' : 'bg-black/20',
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
