import { LayoutDashboard } from 'lucide-react'
import { OPS_BY_ID } from '../catalog/ops'
import { useWorkspace } from '../state/workspace'

const SUGGEST = [
  'list-users',
  'flag-suspicious-users',
  'apply-default-deny-inbound',
  'one-click-hardening-checklist',
]

export function EmptyPane({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  return (
    <div
      className="grid-bg flex h-full flex-col items-center justify-center px-8 text-center"
      data-testid="empty-pane"
    >
      <LayoutDashboard className="mb-3 text-accent" size={32} />
      <div className="font-display text-[18px] font-semibold text-ink">Start with a check</div>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-mute">
        Pick something from the list on the left — like Scan users — or drag it into this space.
        Press{' '}
        <kbd className="rounded border border-line-strong bg-elev px-1 font-mono text-[12px]">/</kbd> to
        search.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SUGGEST.map((id) => {
          const op = OPS_BY_ID[id]
          if (!op) return null
          return (
            <button
              key={id}
              type="button"
              className="rounded-full border border-line-strong bg-elev px-3 py-1.5 text-[13px] text-ink hover:border-accent hover:text-accent"
              onClick={() => ws.assignOp(paneId, id)}
            >
              {op.runLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
