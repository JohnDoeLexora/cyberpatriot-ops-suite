import { ChevronDown, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isBeginnerOp } from '@cyberpatriot/ops-catalog'
import { CATEGORIES, filterOps, OPS, OPS_BY_ID } from '../catalog/ops'
import type { UiOp } from '../catalog/types'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function Catalog() {
  const ws = useWorkspace()
  const filtered = useMemo(() => {
    let ops = filterOps(ws.query)
    if (ws.beginnerMode && !ws.showAdvanced && !ws.query.trim()) {
      ops = ops.filter((op) => isBeginnerOp(op.id))
    }
    return ops
  }, [ws.query, ws.beginnerMode, ws.showAdvanced])
  const hidingAdvanced =
    ws.beginnerMode && !ws.showAdvanced && !ws.query.trim() && filtered.length < OPS.length
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
      <div className="border-b border-line px-4 py-3.5">
        <div className="mb-2.5 flex items-baseline justify-between px-0.5">
          <span className="text-[14px] font-medium text-ink">Checks</span>
          <span className="text-[12.5px] text-faint" data-testid="catalog-count">
            {filtered.length}/{OPS.length}
          </span>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-line-strong bg-elev px-3 py-2.5 shadow-sm focus-within:border-accent">
          <Search size={16} className="text-faint" />
          <input
            ref={ws.searchRef}
            data-testid="catalog-search"
            value={ws.query}
            onChange={(e) => ws.setQuery(e.target.value)}
            placeholder="Search checks…"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {favOps.length > 0 && !ws.query && (
          <section className="mb-2">
            <div className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-accent">
              <Star size={13} /> Pinned
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
          <div className="px-5 py-10 text-center text-[15px] leading-7 text-mute">
            Nothing matches “{ws.query}”. Try “users”, “firewall”, or “ssh”.
          </div>
        )}

        {ws.beginnerMode && (
          <div className="px-4 py-3">
            <button
              type="button"
              data-testid="show-advanced"
              onClick={() => ws.setShowAdvanced(!ws.showAdvanced)}
              className="w-full rounded-lg border border-line-strong bg-elev px-3 py-2 text-[13px] font-medium text-ink shadow-sm hover:border-accent hover:text-accent"
            >
              {ws.showAdvanced ? 'Hide advanced checks' : 'Show advanced'}
            </button>
            {hidingAdvanced && (
              <p className="coach-tip mt-2 text-center text-[12.5px] leading-5 text-faint">
                Starter checks only. Power users: Show advanced, or turn Beginner off.
              </p>
            )}
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
    <section className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-hover"
      >
        <ChevronDown
          size={15}
          className={cn('shrink-0 text-faint transition-transform', !open && '-rotate-90')}
        />
        <span className="text-[14px] font-medium text-ink">{label}</span>
        <span className="ml-auto text-[12.5px] text-faint">{ops.length}</span>
      </button>
      {open && (
        <>
          <div className="px-4 pb-1.5 text-[12.5px] leading-5 text-faint">{hint}</div>
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
        'group flex cursor-grab items-start gap-2 px-3 py-2 hover:bg-hover active:cursor-grabbing',
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
        <Star size={14} fill={starred ? 'currentColor' : 'none'} className={starred ? 'text-warn' : ''} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-medium text-ink">{op.title}</span>
          <PlatformBadge platform={op.platform} />
          {op.risk === 'mutate' && (
            <span className="rounded-md bg-warn-dim px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-warn">
              changes
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-faint">{op.description}</div>
      </div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: UiOp['platform'] }) {
  if (platform === 'both') return null
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-px text-[10px] font-medium uppercase',
        platform === 'linux' ? 'bg-info-dim text-info' : 'bg-ok-dim text-ok',
      )}
    >
      {platform === 'linux' ? 'Linux' : 'Windows'}
    </span>
  )
}
