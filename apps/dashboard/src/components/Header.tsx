import { RotateCcw, Shield } from 'lucide-react'
import { leafCount } from '../layout/tree'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function Header() {
  const ws = useWorkspace()
  const panes = leafCount(ws.tree)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-sidebar px-4">
      <div className="flex items-center gap-2.5 pr-4 border-r border-line">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim text-accent">
          <Shield size={15} strokeWidth={2.1} />
        </span>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-tight text-ink">CP Ops</div>
          <div className="text-[11px] text-faint">CyberPatriot checks</div>
        </div>
      </div>

      <div className="hidden items-center gap-2 text-[13px] text-mute md:flex">
        <kbd className="rounded border border-line-strong bg-elev px-1.5 py-0.5 font-mono text-[11px] text-ink">
          /
        </kbd>
        <span>search</span>
        <span className="text-faint">·</span>
        <span>drag a check into a pane, then split</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-[13px] text-mute sm:inline" data-testid="pane-count">
          {panes} pane{panes === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          className="rounded-md border border-line-strong bg-elev px-2.5 py-1 text-[13px] text-mute hover:bg-hover hover:text-ink"
          onClick={ws.resetLayout}
          title="Reset pane layout"
        >
          Reset panes
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-elev px-2.5 py-1 text-[13px] text-mute hover:bg-hover hover:text-ink"
          onClick={ws.resetDemo}
          title="Reset practice accounts and the change log"
        >
          <RotateCcw size={12} />
          Reset data
        </button>
        <DemoSwitch />
      </div>
    </header>
  )
}

function DemoSwitch() {
  const ws = useWorkspace()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ws.demoMode}
      data-testid="demo-toggle"
      onClick={() => ws.setDemoMode(!ws.demoMode)}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] font-medium',
        ws.demoMode
          ? 'border-accent/30 bg-accent-dim text-accent'
          : 'border-warn/40 bg-warn-dim text-warn',
      )}
      title={
        ws.demoMode
          ? 'Practice data — Mac-safe fixtures, no host changes'
          : 'This computer — live engines, confirm before changes'
      }
    >
      <span
        className={cn(
          'h-3.5 w-6 rounded-full p-0.5 transition-colors',
          ws.demoMode ? 'bg-accent' : 'bg-warn',
        )}
      >
        <span
          className={cn(
            'block h-2.5 w-2.5 rounded-full bg-elev transition-transform',
            ws.demoMode && 'translate-x-2.5',
          )}
        />
      </span>
      {ws.demoMode ? 'Practice data' : 'This computer'}
    </button>
  )
}
