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
      className="flex h-full flex-col items-center justify-center px-8 py-10 text-center"
      data-testid="empty-pane"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent shadow-sm">
        <LayoutDashboard size={26} strokeWidth={1.75} />
      </div>
      <div className="font-display text-[22px] font-semibold tracking-tight text-ink">
        Start with a check
      </div>
      <p className="mt-3 max-w-md text-[15px] leading-7 text-mute">
        Pick something from the list on the left — like Scan users — or drag it into this space.
        Press{' '}
        <kbd className="rounded-md border border-line-strong bg-elev px-1.5 py-0.5 font-mono text-[13px] text-ink">
          /
        </kbd>{' '}
        to search.
      </p>
      <button
        type="button"
        data-testid="howto-browse"
        onClick={() => ws.openHowto()}
        className="mt-6 rounded-lg border border-line-strong bg-elev px-4 py-2 text-[14px] font-medium text-ink shadow-sm hover:border-accent hover:text-accent"
      >
        Browse how-tos
      </button>
      <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
        {SUGGEST.map((id) => {
          const op = OPS_BY_ID[id]
          if (!op) return null
          return (
            <button
              key={id}
              type="button"
              className="rounded-full border border-line bg-elev px-3.5 py-1.5 text-[13px] text-ink shadow-sm hover:border-accent hover:text-accent"
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
