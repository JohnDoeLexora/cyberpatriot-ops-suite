import { getPlaylist } from '@cyberpatriot/ops-catalog'
import { OPS_BY_ID } from '../catalog/ops'
import { leafCount } from '../layout/tree'
import { useWorkspace } from '../state/workspace'

export function StatusBar() {
  const ws = useWorkspace()
  const focused = ws.panes[ws.focusedId]
  const op = focused?.opId ? OPS_BY_ID[focused.opId] : null
  const panes = leafCount(ws.tree)
  const crit = Object.values(ws.panes)
    .flatMap((p) => p.output?.findings ?? [])
    .filter((f) => f.severity === 'crit').length

  const engineLabel =
    ws.engineSource === 'api'
      ? 'engine connected'
      : ws.engineSource === 'demo-fallback'
        ? 'practice fallback'
        : ws.apiOk
          ? 'engine ready'
          : 'practice fallback'

  const playlist = getPlaylist(ws.playlistId)
  const done = playlist
    ? playlist.steps.filter((s) => (ws.playlistProgress[playlist.id] ?? {})[s.opId] === 'done').length
    : 0

  return (
    <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-sidebar px-5 text-[13px] text-mute">
      <span className="text-accent">{engineLabel}</span>
      <span className="text-faint">·</span>
      <span>
        {panes} pane{panes === 1 ? '' : 's'}
      </span>
      <span className="text-faint">·</span>
      <span className="truncate">
        {op ? op.title : 'empty pane'} {focused?.status && op ? `· ${focused.status}` : ''}
      </span>
      <span className="ml-auto flex items-center gap-3">
        {playlist && (
          <span data-testid="status-playlist">
            {playlist.title} {done}/{playlist.steps.length}
          </span>
        )}
        {crit > 0 && <span className="text-crit">{crit} urgent</span>}
        <span>{ws.journal.length} log</span>
        <span className={ws.demoMode ? 'text-accent' : 'text-warn'} data-testid="mode-label">
          {ws.demoMode ? 'practice' : 'this computer'}
        </span>
      </span>
    </footer>
  )
}
