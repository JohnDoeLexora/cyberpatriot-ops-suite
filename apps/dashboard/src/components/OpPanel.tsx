import { Play, SquareSplitHorizontal, SquareSplitVertical, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { getEngineOp, OPS_BY_ID } from '../catalog/ops'
import type { RunStatus } from '../catalog/types'
import { cn } from '../lib/cn'
import { isSuspicious } from '../lib/users'
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
        focused ? 'ring-1 ring-inset ring-accent/50' : 'ring-1 ring-inset ring-transparent',
      )}
    >
      <header
        draggable={Boolean(op)}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-cp-pane', paneId)
          e.dataTransfer.setData('text/plain', `pane:${paneId}`)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className="flex h-10 shrink-0 items-center gap-1.5 border-b border-line bg-elev/90 px-2"
      >
        <StatusDot status={pane?.status ?? 'idle'} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
          {op ? op.title : 'Empty pane'}
        </span>
        {op && (
          <span className="hidden text-[12px] text-faint sm:inline">
            {pane.status === 'idle' ? '' : pane.status}
          </span>
        )}
        <Icon
          title="Split right"
          testId={`split-h-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'horizontal')}
        >
          <SquareSplitVertical size={14} />
        </Icon>
        <Icon
          title="Split down"
          testId={`split-v-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'vertical')}
        >
          <SquareSplitHorizontal size={14} />
        </Icon>
        <Icon title="Close pane" testId={`close-${paneId}`} onClick={() => ws.closePane(paneId)}>
          <X size={14} />
        </Icon>
      </header>

      {!op || !pane ? (
        <EmptyPane paneId={paneId} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <button
              type="button"
              data-testid="run-op"
              disabled={pane.status === 'running'}
              onClick={() => void ws.runPane(paneId)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-elev hover:brightness-110 disabled:opacity-50"
            >
              <Play size={13} fill="currentColor" />
              {pane.status === 'running' ? 'Running…' : op.runLabel}
            </button>
            <span className="min-w-0 flex-1 truncate text-[13px] text-mute">{op.description}</span>
            {op.risk === 'mutate' && !ws.demoMode && (
              <span className="rounded bg-warn-dim px-1.5 py-0.5 text-[11px] font-medium text-warn">
                asks first
              </span>
            )}
          </div>
          <ParamBar paneId={paneId} />
          <div className="min-h-0 flex-1 overflow-auto" data-testid={`pane-body-${paneId}`}>
            <PaneBody paneId={paneId} />
          </div>
        </div>
      )}
    </section>
  )
}

function ParamBar({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const catalogOp = pane?.opId ? getEngineOp(pane.opId) : undefined
  if (!pane || !catalogOp) return null
  const props = catalogOp.paramsSchema.properties
  const keys = Object.keys(props).filter((k) => k !== 'allowlistPath' && k !== 'extensions')
  if (!keys.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-[13px]">
      {keys.map((key) => {
        const field = props[key]
        if (field.type === 'boolean') {
          const on = pane.params[key] === 'true'
          return (
            <label key={key} className="inline-flex items-center gap-1.5 text-mute">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => ws.setPaneParam(paneId, key, e.target.checked ? 'true' : 'false')}
              />
              {field.description || key}
            </label>
          )
        }
        return (
          <label key={key} className="inline-flex min-w-[12rem] flex-1 items-center gap-2 text-mute">
            <span className="shrink-0 capitalize">{key}</span>
            <input
              value={pane.params[key] ?? ''}
              onChange={(e) => ws.setPaneParam(paneId, key, e.target.value)}
              placeholder={field.description}
              className="min-w-0 flex-1 rounded-md border border-line-strong bg-elev px-2 py-1 font-mono text-[12.5px] text-ink"
            />
          </label>
        )
      })}
    </div>
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
            op.id === 'audit-uid-zero' || op.id === 'audit-duplicate-uids'
              ? (u) => u.uid === 0 && u.name !== 'root'
              : op.id === 'flag-suspicious-users'
                ? isSuspicious
                : op.id === 'disable-guest-account'
                  ? (u) => u.name.toLowerCase() === 'guest'
                  : op.id === 'check-empty-passwords'
                    ? (u) => u.emptyPassword
                    : undefined
          }
        />
        {pane.output && <OutputView output={pane.output} />}
        {pane.error && <p className="p-3 text-[14px] text-crit">{pane.error}</p>}
      </>
    )
  }

  if (op.view === 'groups') {
    return (
      <>
        <div className="overflow-auto p-3">
          <table className="w-full min-w-[28rem] text-left text-[13.5px]">
            <thead className="text-[12px] text-faint">
              <tr>
                <th className="px-2 py-1.5 font-medium">Group</th>
                <th className="px-2 py-1.5 font-medium">Members</th>
                <th className="px-2 py-1.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {ws.groups.map((g) => (
                <tr key={g.name} className="border-t border-line">
                  <td className="px-2 py-1.5 font-mono text-[13px]">{g.name}</td>
                  <td className="px-2 py-1.5 text-mute">{g.members.join(', ')}</td>
                  <td className="px-2 py-1.5 text-warn">{g.anomaly ?? (g.privileged ? 'privileged' : '')}</td>
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
      <div className="flex h-full flex-col p-3">
        <textarea
          data-testid="forensics-notes"
          value={ws.notes}
          onChange={(e) => ws.setNotes(e.target.value)}
          className="min-h-[200px] flex-1 resize-none rounded-md border border-line bg-elev p-3 font-mono text-[13px] leading-6 text-ink outline-none focus:border-accent"
        />
        {pane.output && <OutputView output={pane.output} />}
      </div>
    )
  }

  if (op.view === 'journal') {
    return (
      <div className="p-3">
        {ws.journal.length === 0 && (
          <p className="text-[14px] text-mute">Nothing logged yet. Run a check to start the log.</p>
        )}
        <ol className="space-y-1.5">
          {ws.journal.map((j) => (
            <li key={j.id} className="flex gap-2 rounded-md border border-line bg-elev px-2.5 py-1.5 text-[13.5px]">
              <span className="shrink-0 font-mono text-[12px] text-faint">
                {new Date(j.ts).toLocaleTimeString()}
              </span>
              <span className="w-16 shrink-0 text-[12px] uppercase text-accent">{j.kind}</span>
              <span>{j.text}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (op.view === 'favorites') {
    return (
      <div className="p-3">
        {ws.favorites.length === 0 && (
          <p className="text-[14px] text-mute">Star checks in the list to pin them here.</p>
        )}
        <ul className="space-y-1.5">
          {ws.favorites.map((id) => {
            const fav = OPS_BY_ID[id]
            if (!fav) return null
            return (
              <li key={id} className="flex items-center gap-2 rounded-md border border-line bg-elev px-2.5 py-2">
                <button
                  type="button"
                  className="text-left text-[14px] text-ink hover:text-accent"
                  onClick={() => ws.openOp(id)}
                >
                  {fav.title}
                </button>
                <button
                  type="button"
                  className="ml-auto text-[13px] text-mute hover:text-crit"
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
      <div className="p-3">
        <div className="mb-2 text-[14px] text-mute">
          {done}/{PREFLIGHT_ITEMS.length} complete — start-of-round list.
        </div>
        <ul className="space-y-1.5">
          {PREFLIGHT_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line bg-elev px-2.5 py-2 hover:bg-hover">
                <input
                  type="checkbox"
                  checked={Boolean(ws.preflight[item.id])}
                  onChange={() => ws.togglePreflight(item.id)}
                />
                <span>
                  <span className="block text-[14px]">{item.label}</span>
                  <span className="text-[12.5px] text-faint">{item.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {pane.output && <OutputView output={pane.output} />}
      </div>
    )
  }

  if (op.view === 'export') {
    const findings = collectFindings(ws.panes)
    return (
      <div className="p-4">
        <p className="text-[14px] text-mute">
          {findings.length} findings across open panes · {ws.journal.length} log entries.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-elev"
            onClick={() => download('cp-ops-findings.json', JSON.stringify(exportPayload(ws), null, 2), 'application/json')}
          >
            Download JSON
          </button>
          <button
            type="button"
            className="rounded-md border border-line-strong px-3 py-1.5 text-[13px] hover:bg-hover"
            onClick={() => download('cp-ops-findings.csv', toCsv(findings), 'text/csv')}
          >
            Download CSV
          </button>
        </div>
        {pane.output && <OutputView output={pane.output} />}
        {!pane.output && <IdleHint status={pane.status} demo={ws.demoMode} />}
      </div>
    )
  }

  if (op.id === 'find-media-files') {
    return (
      <div>
        <label className="flex items-center gap-2 border-b border-line px-3 py-2 text-[13px]">
          File types
          <input
            value={ws.mediaExtensions}
            onChange={(e) => ws.setMediaExtensions(e.target.value)}
            className="flex-1 rounded-md border border-line-strong bg-elev px-2 py-1 font-mono text-[12.5px]"
          />
        </label>
        {pane.output ? <OutputView output={pane.output} /> : <IdleHint status={pane.status} demo={ws.demoMode} />}
      </div>
    )
  }

  if (pane.output) return <OutputView output={pane.output} />
  if (pane.error) return <p className="p-4 text-[14px] text-crit">{pane.error}</p>
  return <IdleHint status={pane.status} demo={ws.demoMode} />
}

function IdleHint({ status, demo }: { status: RunStatus; demo: boolean }) {
  if (status === 'running') {
    return <p className="p-5 text-[14px] text-mute">Running…</p>
  }
  return (
    <p className="p-5 text-[14px] leading-6 text-mute">
      Press the button above to {demo ? 'run this check on practice data.' : 'run this check on this computer.'}
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
  return <span data-testid="run-status" data-status={status} className={cn('h-2.5 w-2.5 rounded-full', color)} />
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
      className="rounded-md p-1 text-mute hover:bg-hover hover:text-ink"
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
