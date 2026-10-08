import { getPlaylist, PLAYLISTS } from '@cyberpatriot/ops-catalog'
import { LayoutDashboard, Play } from 'lucide-react'
import { OPS_BY_ID } from '../catalog/ops'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

const TOP_OPS: Record<'linux' | 'windows' | 'both', string[]> = {
  linux: ['list-users', 'flag-suspicious-users', 'ssh-hardening-audit'],
  windows: ['list-users', 'audit-uac', 'enable-windows-defender'],
  both: ['skim-forensics-readme', 'list-users', 'scoreboard-preflight'],
}

export function EmptyPane({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const suggestions = PLAYLISTS.filter((p) => p.emptySuggest)
  const platform = getPlaylist(ws.playlistId)?.platform ?? 'linux'
  const osLabel = platform === 'windows' ? 'Windows' : platform === 'linux' ? 'Linux' : 'this image'
  const top = TOP_OPS[platform]

  return (
    <div
      className="flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-6 text-center"
      data-testid="empty-pane"
      data-state="idle"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-dim text-accent shadow-sm">
        <LayoutDashboard size={24} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="font-display text-[22px] font-semibold tracking-tight text-ink">
        {ws.beginnerMode ? 'Start a round playlist' : 'Start with a check'}
      </div>
      <p className="coach-tip mt-2 max-w-md text-[15px] leading-7 text-mute">
        {ws.beginnerMode
          ? 'Not sure what to click? Pick a playlist or one of the top checks. A click fills this pane. The green ring shows where the next check lands. Live changes still ask first.'
          : 'Click a check to put it in this pane. The badge says where the next one opens. Split, or drop on an edge, when you want another pane. Press / to search.'}
      </p>
      <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2" data-testid="empty-playlists">
        {suggestions.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`empty-playlist-${p.id}`}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[13px] shadow-sm hover:border-accent hover:text-accent',
              p.id === ws.playlistId
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
      <div className="mt-5 w-full max-w-md text-left" data-testid="empty-top-ops" data-os={platform}>
        <div className="mb-2 text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-mute">
          Top checks for {osLabel}
        </div>
        <ul className="space-y-2">
          {top.map((id) => {
            const op = OPS_BY_ID[id]
            if (!op) return null
            return (
              <li key={id} className="flex items-center gap-2 rounded-xl border border-line bg-elev px-2 py-1.5 shadow-sm">
                <button
                  type="button"
                  data-testid={`empty-op-${id}`}
                  className="min-w-0 flex-1 truncate px-1.5 text-left text-[14px] font-medium text-ink hover:text-accent"
                  title={op.description}
                  onClick={() => ws.assignOp(paneId, id)}
                >
                  {op.title}
                </button>
                <button
                  type="button"
                  data-testid={`empty-run-${id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-semibold text-elev"
                  onClick={() => {
                    ws.assignOp(paneId, id)
                    void ws.runPane(paneId, { opId: id })
                  }}
                >
                  <Play size={12} fill="currentColor" aria-hidden />
                  Run
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <button
        type="button"
        data-testid="howto-browse"
        onClick={() => ws.openHowto()}
        className="mt-4 rounded-lg border border-line-strong bg-elev px-4 py-2 text-[14px] font-medium text-ink shadow-sm hover:border-accent hover:text-accent"
      >
        Browse how-tos
      </button>
    </div>
  )
}
