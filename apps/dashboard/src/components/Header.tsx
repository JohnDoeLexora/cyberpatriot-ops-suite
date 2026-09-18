import { RotateCcw, Shield } from 'lucide-react'
import { leafCount } from '../layout/tree'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function Header() {
  const ws = useWorkspace()
  const panes = leafCount(ws.tree)

  return (
    <header className="flex h-10 shrink-0 items-center gap-3 border-b border-line bg-sidebar px-3">
      <div className="flex items-center gap-2 pr-3 border-r border-line">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-dim text-accent">
          <Shield size={14} strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <div className="text-[12.5px] font-semibold tracking-wide text-ink">CP OPS</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">CyberPatriot</div>
        </div>
      </div>

      <div className="hidden items-center gap-2 text-[11px] text-mute md:flex">
        <kbd className="rounded border border-line-strong bg-elev px-1.5 py-0.5 font-mono text-[10px] text-ink">
          /
        </kbd>
        <span>search ops</span>
        <span className="text-faint">·</span>
        <span>drag ops into panes · split · rearrange</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-[11px] text-mute sm:inline" data-testid="pane-count">
          {panes} pane{panes === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          className="rounded border border-line-strong bg-elev px-2 py-1 text-[11px] text-mute hover:bg-hover hover:text-ink"
          onClick={ws.resetLayout}
          title="Reset pane layout"
        >
          Reset layout
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-line-strong bg-elev px-2 py-1 text-[11px] text-mute hover:bg-hover hover:text-ink"
          onClick={ws.resetDemo}
          title="Reset mock users, firewall, journal"
        >
          <RotateCcw size={11} />
          Reset demo
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
        'inline-flex items-center gap-2 rounded border px-2 py-1 text-[11px] font-semibold tracking-wide',
        ws.demoMode
          ? 'border-accent/40 bg-accent-dim text-accent'
          : 'border-line-strong bg-elev text-mute',
      )}
      title="Demo mode uses a mock API so every control works on macOS"
    >
      <span
        className={cn(
          'h-3.5 w-6 rounded-full p-0.5 transition-colors',
          ws.demoMode ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'block h-2.5 w-2.5 rounded-full bg-app transition-transform',
            ws.demoMode && 'translate-x-2.5',
          )}
        />
      </span>
      DEMO {ws.demoMode ? 'ON' : 'OFF'}
    </button>
  )
}
