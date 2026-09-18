import { OPS_BY_ID } from '../catalog/ops'
import { leafCount } from '../layout/tree'
import { useWorkspace } from '../state/workspace'

export function StatusBar() {
  const ws = useWorkspace()
  const focused = ws.panes[ws.focusedId]
  const op = focused?.opId ? OPS_BY_ID[focused.opId] : null
  const crit = Object.values(ws.panes)
    .flatMap((p) => p.output?.findings ?? [])
    .filter((f) => f.severity === 'crit').length

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-sidebar px-3 font-mono text-[10.5px] text-mute">
      <span className="text-accent">mock engines</span>
      <span className="text-faint">·</span>
      <span>{leafCount(ws.tree)} panes</span>
      <span className="text-faint">·</span>
      <span className="truncate">
        {op ? op.title : 'empty pane'} {focused?.status && op ? `· ${focused.status}` : ''}
      </span>
      <span className="ml-auto flex items-center gap-3">
        {crit > 0 && <span className="text-crit">{crit} crit findings</span>}
        <span>{ws.journal.length} journal</span>
        <span className={ws.demoMode ? 'text-accent' : 'text-warn'}>
          {ws.demoMode ? 'demo' : 'live-pending'}
        </span>
        <span className="text-faint">cp-01 shell</span>
      </span>
    </footer>
  )
}
