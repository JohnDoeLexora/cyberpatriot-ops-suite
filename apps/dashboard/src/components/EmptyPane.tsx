import { LayoutDashboard } from 'lucide-react'
import { OPS_BY_ID } from '../catalog/ops'
import { useWorkspace } from '../state/workspace'

const SUGGEST = ['users.flag-suspicious', 'users.uid0', 'net.firewall-apply', 'team.preflight']

export function EmptyPane({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  return (
    <div
      className="grid-bg flex h-full flex-col items-center justify-center px-6 text-center"
      data-testid="empty-pane"
    >
      <LayoutDashboard className="mb-3 text-accent" size={28} />
      <div className="text-[14px] font-semibold text-ink">Drop an operation here</div>
      <p className="mt-1 max-w-sm text-[12px] text-mute">
        Click an op in the catalog, or drag it onto this pane. Split with the toolbar once an op is
        open. Press <kbd className="rounded border border-line-strong px-1 font-mono text-[11px]">/</kbd> to
        search.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {SUGGEST.map((id) => {
          const op = OPS_BY_ID[id]
          if (!op) return null
          return (
            <button
              key={id}
              type="button"
              className="rounded-full border border-line-strong bg-elev px-2.5 py-1 text-[11px] text-ink hover:border-accent hover:text-accent"
              onClick={() => ws.assignOp(paneId, id)}
            >
              {op.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
