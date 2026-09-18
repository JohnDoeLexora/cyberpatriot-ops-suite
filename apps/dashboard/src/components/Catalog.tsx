import { ChevronDown, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, filterOps, OPS, OPS_BY_ID } from '../catalog/ops'
import type { UiOp } from '../catalog/types'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function Catalog() {
  const ws = useWorkspace()
  const filtered = useMemo(() => filterOps(ws.query), [ws.query])
  const byCat = useMemo(() => {
    const map = new Map<string, UiOp[]>()
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
      <div className="border-b border-line px-3 py-2.5">
        <div className="mb-2 flex items-baseline justify-between px-0.5">
          <span className="text-[13px] font-medium text-ink">Checks</span>
          <span className="text-[12px] text-faint" data-testid="catalog-count">
            {filtered.length}/{OPS.length}
          </span>
        </div>
        <label className="flex items-center gap-2 rounded-md border border-line-strong bg-elev px-2.5 py-2 focus-within:border-accent">
          <Search size={15} className="text-faint" />
          <input
            ref={ws.searchRef}
            data-testid="catalog-search"
            value={ws.query}
            onChange={(e) => ws.setQuery(e.target.value)}
            placeholder="Search checks…"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {favOps.length > 0 && !ws.query && (
          <section className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-accent">
              <Star size={12} /> Pinned
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
          <div className="px-4 py-8 text-center text-[14px] text-mute">
            Nothing matches “{ws.query}”. Try “users”, “firewall”, or “ssh”.
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
  ops: UiOp[]
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left hover:bg-hover"
      >
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-faint transition-transform', !open && '-rotate-90')}
        />
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="ml-auto text-[12px] text-faint">{ops.length}</span>
      </button>
      {open && (
        <>
          <div className="px-3 pb-1 text-[12px] text-faint">{hint}</div>
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
  op: UiOp
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
        'group flex cursor-grab items-start gap-1.5 px-2.5 py-1.5 hover:bg-hover active:cursor-grabbing',
        openSomewhere && 'bg-accent-dim/70',
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
        <Star size={13} fill={starred ? 'currentColor' : 'none'} className={starred ? 'text-warn' : ''} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-medium text-ink">{op.title}</span>
          <PlatformBadge platform={op.platform} />
          {op.risk === 'mutate' && (
            <span className="rounded bg-warn-dim px-1 py-px text-[10px] font-medium uppercase tracking-wide text-warn">
              changes
            </span>
          )}
        </div>
        <div className="truncate text-[12.5px] text-faint">{op.description}</div>
      </div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: UiOp['platform'] }) {
  if (platform === 'both') return null
  return (
    <span
      className={cn(
        'rounded px-1 py-px text-[10px] font-medium uppercase',
        platform === 'linux' ? 'bg-info-dim text-info' : 'bg-ok-dim text-ok',
      )}
    >
      {platform === 'linux' ? 'Linux' : 'Windows'}
    </span>
  )
}
