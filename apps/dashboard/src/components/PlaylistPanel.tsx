import { PLAYLISTS, getPlaylist } from '@cyberpatriot/ops-catalog'
import { CircleHelp, ListOrdered, Play, RotateCcw, Users } from 'lucide-react'
import { OPS_BY_ID } from '../catalog/ops'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function PlaylistPanel() {
  const ws = useWorkspace()
  const pl = getPlaylist(ws.playlistId) ?? PLAYLISTS[0]
  if (!pl) return null
  const progress = ws.playlistProgress[pl.id] ?? {}
  const done = pl.steps.filter((s) => progress[s.opId] === 'done').length
  const next = pl.steps.find((s) => progress[s.opId] !== 'done')
  const complete = done === pl.steps.length

  return (
    <section
      className="flex max-h-[48%] min-h-0 flex-col overflow-hidden border-b border-line bg-sidebar"
      data-testid="playlist-panel"
      data-playlist-id={pl.id}
    >
      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
        <ListOrdered size={14} className="text-accent" />
        <span className="text-[14px] font-medium text-ink">Round playlist</span>
        <span className="ml-auto font-mono text-[12px] text-faint" data-testid="playlist-progress">
          {done}/{pl.steps.length}
        </span>
      </div>

      <div className="px-4 pb-2">
        <label className="sr-only" htmlFor="playlist-select">
          Playlist
        </label>
        <select
          id="playlist-select"
          data-testid="playlist-select"
          value={pl.id}
          onChange={(e) => ws.setPlaylistId(e.target.value)}
          className="w-full rounded-lg border border-line-strong bg-elev px-2.5 py-2 text-[13.5px] text-ink shadow-sm"
        >
          {PLAYLISTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <p className="coach-tip mt-1.5 text-[12.5px] leading-5 text-mute">{pl.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-2">
        <button
          type="button"
          data-testid="playlist-run-next"
          disabled={ws.playlistBusy || complete}
          onClick={() => void ws.runPlaylistNext()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-semibold text-elev shadow-sm hover:brightness-110 disabled:opacity-50"
        >
          <Play size={12} fill="currentColor" />
          {ws.playlistBusy ? 'Running…' : complete ? 'Done' : 'Run next'}
        </button>
        <button
          type="button"
          data-testid="playlist-run-all"
          disabled={ws.playlistBusy || complete}
          onClick={() => void ws.runPlaylistNext({ all: true })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-elev px-3 py-1.5 text-[13px] font-medium text-ink shadow-sm hover:bg-hover disabled:opacity-50"
        >
          Run all
        </button>
        <button
          type="button"
          data-testid="playlist-reset"
          title="Clear playlist checkmarks"
          onClick={ws.resetPlaylistProgress}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] text-mute hover:bg-hover hover:text-ink"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {next && (
        <p className="coach-tip px-4 pb-2 text-[12.5px] leading-5 text-mute">
          Next: <span className="font-medium text-ink">{OPS_BY_ID[next.opId]?.title ?? next.opId}</span>
          {' — '}
          {next.tip}
        </p>
      )}

      <ol
        className="playlist-steps min-h-0 flex-1 overflow-y-auto border-t border-line py-1"
        data-testid="playlist-steps"
      >
        {pl.steps.map((s, i) => {
          const status = progress[s.opId]
          const op = OPS_BY_ID[s.opId]
          const active = next?.opId === s.opId
          return (
            <li key={s.opId}>
              <div
                data-testid={`playlist-step-${s.opId}`}
                data-status={status ?? 'idle'}
                className={cn(
                  'flex items-start gap-2 px-3 py-1.5 hover:bg-hover',
                  active && 'bg-accent-dim/70',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => ws.assignOp(ws.focusedId, s.opId)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                        status === 'done'
                          ? 'border-ok bg-ok text-elev'
                          : status === 'error'
                            ? 'border-crit bg-crit text-elev'
                            : 'border-line-strong text-faint',
                      )}
                      aria-hidden
                    >
                      {status === 'done' ? '✓' : i + 1}
                    </span>
                    <span className="truncate text-[13.5px] font-medium text-ink">
                      {op?.title ?? s.opId}
                    </span>
                    {op?.risk === 'mutate' && (
                      <span className="rounded-md bg-warn-dim px-1 py-px text-[9px] font-medium uppercase tracking-wide text-warn">
                        changes
                      </span>
                    )}
                  </span>
                  <span className="coach-tip mt-0.5 block pl-6 text-[12px] leading-4 text-faint">
                    {s.tip}
                  </span>
                </button>
                <button
                  type="button"
                  title="How-to"
                  data-testid={`playlist-howto-${s.opId}`}
                  onClick={() => ws.openHowto(s.opId)}
                  className="mt-0.5 rounded-md p-1 text-faint hover:bg-hover hover:text-accent"
                >
                  <CircleHelp size={13} />
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-line px-4 py-2">
        <button
          type="button"
          data-testid="allowlist-open"
          onClick={() => ws.setAllowlistOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-elev px-3 py-1.5 text-[13px] font-medium text-ink shadow-sm hover:border-accent hover:text-accent"
        >
          <Users size={13} />
          Edit allowlists
        </button>
      </div>
    </section>
  )
}
