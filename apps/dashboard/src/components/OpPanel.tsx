import { Play, SquareSplitHorizontal, SquareSplitVertical, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { OPS_BY_ID } from '../catalog/ops'
import type { RunStatus } from '../catalog/types'
import { cn } from '../lib/cn'
import { COMPETITION_FIREWALL } from '../mock/engine'
import { isSuspicious } from '../mock/users'
import { collectFindings, useWorkspace } from '../state/workspace'
import { PREFLIGHT_ITEMS } from '../state/persist'
import { EmptyPane } from './EmptyPane'
import { OutputView } from './OutputView'
import { UserTable } from './UserTable'

export function OpPanel({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const focused = ws.focusedId === paneId
  const op = pane?.opId ? OPS_BY_ID[pane.opId] : null

  return (
    <section
      data-testid="pane"
      data-pane-id={paneId}
      data-op-id={pane?.opId ?? ''}
      onMouseDown={() => ws.focusPane(paneId)}
      className={cn(
        'flex h-full min-h-0 flex-col bg-panel',
        focused ? 'ring-1 ring-inset ring-accent/70' : 'ring-1 ring-inset ring-transparent',
      )}
    >
      <header
        draggable={Boolean(op)}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-cp-pane', paneId)
          e.dataTransfer.setData('text/plain', `pane:${paneId}`)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className="flex h-8 shrink-0 items-center gap-1 border-b border-line bg-elev/80 px-1.5"
      >
        <StatusDot status={pane?.status ?? 'idle'} />
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
          {op ? op.title : 'Empty pane'}
        </span>
        {op && (
          <span className="hidden font-mono text-[10px] uppercase text-faint sm:inline">{pane.status}</span>
        )}
        <Icon
          title="Split right"
          testId={`split-h-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'horizontal')}
        >
          <SquareSplitVertical size={13} />
        </Icon>
        <Icon
          title="Split down"
          testId={`split-v-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'vertical')}
        >
          <SquareSplitHorizontal size={13} />
        </Icon>
        <Icon title="Close pane" testId={`close-${paneId}`} onClick={() => ws.closePane(paneId)}>
          <X size={13} />
        </Icon>
      </header>

      {!op || !pane ? (
        <EmptyPane paneId={paneId} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-line px-2 py-1.5">
            <button
              type="button"
              data-testid="run-op"
              disabled={pane.status === 'running'}
              onClick={() => void ws.runPane(paneId)}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded bg-accent px-2.5 py-1 text-[12px] font-semibold text-app hover:brightness-110 disabled:opacity-50"
            >
              <Play size={12} fill="currentColor" />
              {pane.status === 'running' ? 'Running…' : op.runLabel}
            </button>
            <span className="truncate text-[11px] text-mute">{op.description}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto" data-testid={`pane-body-${paneId}`}>
            <PaneBody paneId={paneId} />
          </div>
        </div>
      )}
    </section>
  )
}

function PaneBody({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const op = pane?.opId ? OPS_BY_ID[pane.opId] : null
  if (!pane || !op) return null

  if (op.view === 'users') {
    return (
      <>
        <UserTable
          paneId={paneId}
          highlight={
            op.id === 'users.uid0'
              ? (u) => u.uid === 0 && u.name !== 'root'
              : op.id === 'users.flag-suspicious'
                ? isSuspicious
                : op.id === 'users.guest-audit'
                  ? (u) => ['guest', 'games', 'ftp', 'ubuntu', 'testuser'].includes(u.name)
                  : op.id === 'auth.sessions'
                    ? (u) => u.loggedIn
                    : undefined
          }
        />
        {pane.output && <OutputView output={pane.output} />}
        {pane.error && <p className="p-3 text-crit">{pane.error}</p>}
      </>
    )
  }

  if (op.view === 'groups') {
    return (
      <>
        <div className="overflow-auto p-2">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase text-faint">
              <tr>
                <th className="px-2 py-1">Group</th>
                <th className="px-2 py-1">GID</th>
                <th className="px-2 py-1">Members</th>
                <th className="px-2 py-1">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {ws.groups.map((g) => (
                <tr key={g.name} className="border-t border-line">
                  <td className="px-2 py-1 font-mono">{g.name}</td>
                  <td className="px-2 py-1 font-mono text-mute">{g.gid}</td>
                  <td className="px-2 py-1 text-mute">{g.members.join(', ')}</td>
                  <td className="px-2 py-1 text-warn">{g.anomaly ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pane.output && <OutputView output={pane.output} />}
      </>
    )
  }

  if (op.view === 'notes') {
    return (
      <div className="flex h-full flex-col p-2">
        <textarea
          data-testid="forensics-notes"
          value={ws.notes}
          onChange={(e) => ws.setNotes(e.target.value)}
          className="min-h-[200px] flex-1 resize-none rounded-md border border-line bg-app p-2 font-mono text-[12px] leading-5 text-ink outline-none focus:border-accent"
        />
        {pane.output && <OutputView output={pane.output} />}
      </div>
    )
  }

  if (op.view === 'journal') {
    return (
      <div className="p-2">
        <ol className="space-y-1">
          {ws.journal.map((j) => (
            <li key={j.id} className="flex gap-2 rounded border border-line px-2 py-1 text-[12px]">
              <span className="shrink-0 font-mono text-[10px] text-faint">
                {new Date(j.ts).toLocaleTimeString()}
              </span>
              <span className="w-14 shrink-0 font-mono text-[10px] uppercase text-accent">{j.kind}</span>
              <span>{j.text}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (op.view === 'favorites') {
    return (
      <div className="p-2">
        {ws.favorites.length === 0 && <p className="text-[12px] text-mute">Star ops in the catalog to pin them.</p>}
        <ul className="space-y-1">
          {ws.favorites.map((id) => {
            const fav = OPS_BY_ID[id]
            if (!fav) return null
            return (
              <li key={id} className="flex items-center gap-2 rounded border border-line px-2 py-1.5">
                <button
                  type="button"
                  className="text-left text-[12px] text-ink hover:text-accent"
                  onClick={() => ws.openOp(id)}
                >
                  {fav.title}
                </button>
                <button
                  type="button"
                  className="ml-auto text-[11px] text-mute hover:text-crit"
                  onClick={() => ws.toggleFavorite(id)}
                >
                  unpin
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (op.view === 'preflight') {
    const done = PREFLIGHT_ITEMS.filter((i) => ws.preflight[i.id]).length
    return (
      <div className="p-2">
        <div className="mb-2 text-[12px] text-mute">
          {done}/{PREFLIGHT_ITEMS.length} complete — scoreboard-oriented start.
        </div>
        <ul className="space-y-1">
          {PREFLIGHT_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded border border-line px-2 py-1.5 hover:bg-hover">
                <input
                  type="checkbox"
                  checked={Boolean(ws.preflight[item.id])}
                  onChange={() => ws.togglePreflight(item.id)}
                />
                <span>
                  <span className="block text-[12.5px]">{item.label}</span>
                  <span className="text-[11px] text-faint">{item.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (op.view === 'export') {
    const findings = collectFindings(ws.panes)
    return (
      <div className="p-3">
        <p className="text-[12px] text-mute">
          {findings.length} findings across open panes · {ws.journal.length} journal entries.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded bg-accent px-3 py-1.5 text-[12px] font-semibold text-app"
            onClick={() => download('cp-ops-findings.json', JSON.stringify(exportPayload(ws), null, 2), 'application/json')}
          >
            Download JSON
          </button>
          <button
            type="button"
            className="rounded border border-line-strong px-3 py-1.5 text-[12px] hover:bg-hover"
            onClick={() => download('cp-ops-findings.csv', toCsv(findings), 'text/csv')}
          >
            Download CSV
          </button>
        </div>
        {pane.output && <OutputView output={pane.output} />}
      </div>
    )
  }

  if (op.id === 'fs.prohibited-media') {
    return (
      <div>
        <label className="flex items-center gap-2 border-b border-line px-3 py-2 text-[12px]">
          Extensions
          <input
            value={ws.mediaExtensions}
            onChange={(e) => ws.setMediaExtensions(e.target.value)}
            className="flex-1 rounded border border-line-strong bg-app px-2 py-1 font-mono text-[11px]"
          />
        </label>
        {pane.output ? (
          <OutputView output={pane.output} />
        ) : (
          <IdleHint status={pane.status} />
        )}
      </div>
    )
  }

  if (op.id === 'net.firewall-apply') {
    return (
      <div>
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-[12px]">
          <span>
            Current profile: <span className="font-mono text-accent">{ws.firewall.profile}</span>
            {ws.firewall.enabled ? ' · enabled' : ' · disabled'}
          </span>
          <button
            type="button"
            className="ml-auto rounded border border-accent/40 bg-accent-dim px-2 py-1 text-[11px] text-accent"
            onClick={() => {
              ws.applyFirewall(COMPETITION_FIREWALL)
              ws.toast({ tone: 'ok', title: 'Firewall profile applied (demo)' })
              void ws.runPane(paneId)
            }}
          >
            Apply now
          </button>
        </div>
        {pane.output ? <OutputView output={pane.output} /> : <IdleHint status={pane.status} />}
      </div>
    )
  }

  if (pane.output) return <OutputView output={pane.output} />
  if (pane.error) return <p className="p-3 text-crit">{pane.error}</p>
  return <IdleHint status={pane.status} />
}

function IdleHint({ status }: { status: RunStatus }) {
  if (status === 'running') {
    return <p className="p-4 text-[12px] text-mute">Running mock engine…</p>
  }
  return (
    <p className="p-4 text-[12px] text-mute">
      Press <span className="text-accent">Run</span> to generate structured mock output for this op.
    </p>
  )
}

function StatusDot({ status }: { status: RunStatus }) {
  const color =
    status === 'running'
      ? 'bg-accent status-running'
      : status === 'done'
        ? 'bg-ok'
        : status === 'error'
          ? 'bg-crit'
          : 'bg-faint'
  return <span data-testid="run-status" data-status={status} className={cn('h-2 w-2 rounded-full', color)} />
}

function Icon({
  children,
  onClick,
  title,
  testId,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  testId: string
}) {
  return (
    <button
      type="button"
      title={title}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="rounded p-1 text-mute hover:bg-hover hover:text-ink"
    >
      {children}
    </button>
  )
}

function exportPayload(ws: ReturnType<typeof useWorkspace>) {
  return {
    exportedAt: new Date().toISOString(),
    demoMode: ws.demoMode,
    findings: collectFindings(ws.panes),
    journal: ws.journal,
    users: ws.users.map((u) => ({
      name: u.name,
      uid: u.uid,
      status: u.status,
      flagged: u.flagged,
    })),
    firewall: ws.firewall,
  }
}

function toCsv(findings: ReturnType<typeof collectFindings>) {
  const header = 'severity,title,detail'
  const lines = findings.map((f) =>
    [f.severity, csvEscape(f.title), csvEscape(f.detail)].join(','),
  )
  return [header, ...lines].join('\n')
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
