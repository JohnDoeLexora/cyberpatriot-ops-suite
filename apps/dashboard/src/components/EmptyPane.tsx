import { PLAYLISTS } from '@cyberpatriot/ops-catalog'
import { LayoutDashboard } from 'lucide-react'
import { OPS_BY_ID } from '../catalog/ops'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

const SUGGEST = [
  'list-users',
  'flag-suspicious-users',
  'apply-default-deny-inbound',
  'one-click-hardening-checklist',
]

export function EmptyPane({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const suggestions = PLAYLISTS.filter((p) => p.emptySuggest)

  return (
    <div
      className="flex h-full flex-col items-center justify-center px-8 py-10 text-center"
      data-testid="empty-pane"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent shadow-sm">
        <LayoutDashboard size={26} strokeWidth={1.75} />
      </div>
      <div className="font-display text-[22px] font-semibold tracking-tight text-ink">
        {ws.beginnerMode ? 'Start a round playlist' : 'Start with a check'}
      </div>
      <p className="coach-tip mt-3 max-w-md text-[15px] leading-7 text-mute">
        {ws.beginnerMode
          ? 'Not sure what to click? Pick a playlist. A click fills this pane. Split the pane if you want two checks at once. Live changes still ask first.'
          : 'Click a check to put it in this pane. Split, or drop on an edge, when you want another pane beside it. Press / to search.'}
      </p>
      <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2" data-testid="empty-playlists">
        {suggestions.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`empty-playlist-${p.id}`}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[13px] shadow-sm hover:border-accent hover:text-accent',
              p.id === 'linux-starter'
                ? 'border-accent/40 bg-accent-dim text-accent'
                : 'border-line bg-elev text-ink',
            )}
            onClick={() => {
              ws.setPlaylistId(p.id)
              const first = p.steps[0]
              if (first) ws.assignOp(paneId, first.opId)
            }}
          >
            {p.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="howto-browse"
        onClick={() => ws.openHowto()}
        className="mt-6 rounded-lg border border-line-strong bg-elev px-4 py-2 text-[14px] font-medium text-ink shadow-sm hover:border-accent hover:text-accent"
      >
        Browse how-tos
      </button>
      {!ws.beginnerMode && (
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
      )}
    </div>
  )
}
