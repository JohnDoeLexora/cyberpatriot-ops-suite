import { ChevronDown, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, filterOps, OPS, OPS_BY_ID } from '../catalog/ops'
import type { OpDefinition } from '../catalog/types'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function Catalog() {
  const ws = useWorkspace()
  const filtered = useMemo(() => filterOps(ws.query), [ws.query])
  const byCat = useMemo(() => {
    const map = new Map<string, OpDefinition[]>()
    for (const op of filtered) {
      const list = map.get(op.category) ?? []
      list.push(op)
      map.set(op.category, list)
    }
    return map
  }, [filtered])

  const favOps = ws.favorites.map((id) => OPS_BY_ID[id]).filter(Boolean)

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar" data-testid="ops-catalog">
      <div className="border-b border-line px-2 py-2">
        <div className="mb-1.5 flex items-baseline justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Operations
          </span>
          <span className="font-mono text-[10px] text-faint">
            {filtered.length}/{OPS.length}
          </span>
        </div>
        <label className="flex items-center gap-1.5 rounded-md border border-line-strong bg-app px-2 py-1.5 focus-within:border-accent">
          <Search size={13} className="text-faint" />
          <input
            ref={ws.searchRef}
            data-testid="catalog-search"
            value={ws.query}
            onChange={(e) => ws.setQuery(e.target.value)}
            placeholder="Search ops…"
            className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {favOps.length > 0 && !ws.query && (
          <section className="mb-1">
            <div className="flex items-center gap-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Star size={10} /> Pinned
            </div>
            {favOps.map((op) => (
              <CatalogRow key={`fav-${op.id}`} op={op} testIdPrefix="catalog-fav" />
            ))}
          </section>
        )}

        {CATEGORIES.map((cat) => {
          const ops = byCat.get(cat.id)
          if (!ops?.length) return null
          return (
            <CategoryBlock key={cat.id} label={cat.label} hint={cat.hint} ops={ops} />
          )
        })}

        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-mute">
            No ops match “{ws.query}”
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryBlock({
  label,
  hint,
  ops,
}: {
  label: string
  hint: string
  ops: OpDefinition[]
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-3 py-1 text-left hover:bg-hover"
      >
        <ChevronDown
          size={12}
          className={cn('shrink-0 text-faint transition-transform', !open && '-rotate-90')}
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
          {label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-faint">{ops.length}</span>
      </button>
      {open && (
        <>
          <div className="px-3 pb-1 text-[10px] text-faint">{hint}</div>
          {ops.map((op) => (
            <CatalogRow key={op.id} op={op} testIdPrefix="catalog-item" />
          ))}
        </>
      )}
    </section>
  )
}

function CatalogRow({
  op,
  testIdPrefix = 'catalog-item',
}: {
  op: OpDefinition
  testIdPrefix?: string
}) {
  const ws = useWorkspace()
  const starred = ws.favorites.includes(op.id)
  const openSomewhere = Object.values(ws.panes).some((p) => p.opId === op.id)

  return (
    <div
      draggable
      data-testid={`${testIdPrefix}-${op.id}`}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-cp-op', op.id)
        e.dataTransfer.setData('text/plain', `op:${op.id}`)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => ws.openOp(op.id)}
      className={cn(
        'group flex cursor-grab items-start gap-1.5 px-2 py-1 hover:bg-hover active:cursor-grabbing',
        openSomewhere && 'bg-accent-dim/40',
      )}
    >
      <button
        type="button"
        title={starred ? 'Unpin' : 'Pin'}
        className="mt-0.5 text-faint hover:text-warn"
        onClick={(e) => {
          e.stopPropagation()
          ws.toggleFavorite(op.id)
        }}
      >
        <Star size={11} fill={starred ? 'currentColor' : 'none'} className={starred ? 'text-warn' : ''} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[12.5px] font-medium text-ink">{op.title}</span>
          <PlatformBadge platform={op.platform} />
        </div>
        <div className="truncate text-[10.5px] text-faint">{op.description}</div>
      </div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: OpDefinition['platform'] }) {
  if (platform === 'both') return null
  return (
    <span
      className={cn(
        'rounded px-1 py-px font-mono text-[9px] uppercase',
        platform === 'linux' ? 'bg-info-dim text-info' : 'bg-ok-dim text-ok',
      )}
    >
      {platform === 'linux' ? 'lin' : 'win'}
    </span>
  )
}
