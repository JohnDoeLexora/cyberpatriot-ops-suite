import { coachTipFor } from '@cyberpatriot/ops-catalog'
import { CircleHelp, Play, SquareSplitHorizontal, SquareSplitVertical, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { getEngineOp, OPS_BY_ID } from '../catalog/ops'
import type { RunStatus } from '../catalog/types'
import { walkLeaves } from '../layout/tree'
import { cn } from '../lib/cn'
import { isSuspicious } from '../lib/users'
import { collectFindings, useWorkspace } from '../state/workspace'
import { PREFLIGHT_ITEMS } from '../state/persist'
import { EmptyPane } from './EmptyPane'
import { OpExplainer } from './OpExplainer'
import { ErrorCard, IdleHint, RunningState } from './PaneStates'
import { OutputView } from './OutputView'
import { ResultSummary } from './ResultSummary'
import { UserTable } from './UserTable'

export function OpPanel({ paneId }: { paneId: string }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const focused = ws.focusedId === paneId
  const op = pane?.opId ? OPS_BY_ID[pane.opId] : null
  const index = walkLeaves(ws.tree).indexOf(paneId)

  return (
    <section
      data-testid="pane"
      data-pane-id={paneId}
      data-op-id={pane?.opId ?? ''}
      data-active={focused ? 'true' : 'false'}
      aria-current={focused ? 'true' : undefined}
      aria-label={op ? op.title : 'Empty pane'}
      aria-busy={pane?.status === 'running' ? true : undefined}
      tabIndex={-1}
      onMouseDown={() => ws.focusPane(paneId)}
      className="pane-cq flex h-full min-h-0 flex-col bg-panel outline-none"
    >
      <header
        draggable={Boolean(op)}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-cp-pane', paneId)
          e.dataTransfer.setData('text/plain', `pane:${paneId}`)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className="flex h-12 shrink-0 items-center gap-1.5 border-b border-line px-2.5"
      >
        {index >= 0 && index < 4 && (
          <kbd
            className="shrink-0 rounded-md border border-line-strong bg-sidebar px-1.5 py-0.5 font-mono text-[12px] text-mute"
            title={`Press ${index + 1} to focus this pane`}
          >
            {index + 1}
          </kbd>
        )}
        <StatusDot status={pane?.status ?? 'idle'} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-tight" title={op ? op.title : 'Empty pane'}>
          {op ? op.title : 'Empty pane'}
        </span>
        {focused && (
          <span
            data-testid="focus-badge"
            className="focus-badge shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
          >
            Next op opens here
          </span>
        )}
        <Icon
          title="Split right"
          testId={`split-h-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'horizontal')}
        >
          <SquareSplitVertical size={15} />
        </Icon>
        <Icon
          title="Split down"
          testId={`split-v-${paneId}`}
          onClick={() => ws.splitPane(paneId, 'vertical')}
        >
          <SquareSplitHorizontal size={15} />
        </Icon>
        <Icon title="Close pane" testId={`close-${paneId}`} onClick={() => ws.closePane(paneId)}>
          <X size={15} />
        </Icon>
      </header>

      {!op || !pane ? (
        <EmptyPane paneId={paneId} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.5">
            <button
              type="button"
              data-testid="run-op"
              disabled={pane.status === 'running'}
              onClick={() => void ws.runPane(paneId)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-semibold text-elev shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              <Play size={13} fill="currentColor" />
              {pane.status === 'running' ? 'Running…' : op.runLabel}
            </button>
            <button
              type="button"
              data-testid="howto-button"
              title="How to use this check"
              onClick={() => ws.openHowto(op.id)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line-strong bg-elev px-3 py-2 text-[13.5px] font-medium text-ink hover:border-accent hover:text-accent"
            >
              <CircleHelp size={14} />
              How to
            </button>
            <span
              className="op-blurb hide-narrow min-w-0 flex-1 line-clamp-2 text-[13.5px] leading-5 text-mute"
              title={op.description}
            >
              {op.description}
            </span>
            {op.risk === 'mutate' && !ws.demoMode && (
              <span className="rounded-md bg-warn-dim px-2 py-0.5 text-[12px] font-medium text-warn">
                asks first
              </span>
            )}
          </div>
          <OpExplainer opId={op.id} />
          <CoachTip opId={op.id} />
          <ParamBar paneId={paneId} />
          <div className="pane-cq min-h-0 flex-1 overflow-auto" data-testid={`pane-body-${paneId}`}>
            <PaneBody paneId={paneId} />
          </div>
        </div>
      )}
    </section>
  )
}

function CoachTip({ opId }: { opId: string }) {
  const ws = useWorkspace()
  const tip = coachTipFor(opId, ws.playlistId)
  if (!tip) return null
  return (
    <div
      className="coach-tip flex items-start gap-2 border-b border-line bg-accent-dim/40 px-4 py-2 text-[13.5px] leading-5 text-ink"
      data-testid="coach-tip"
    >
      <span className="min-w-0 flex-1">{tip}</span>
      <button
        type="button"
        className="shrink-0 text-[13px] font-medium text-accent hover:underline"
        onClick={() => ws.openHowto(opId)}
      >
        How-to
      </button>
    </div>
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
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 text-[13.5px]">
      {keys.map((key) => {
        const field = props[key]
        if (field.type === 'boolean') {
          const on = pane.params[key] === 'true'
          return (
            <label key={key} className="inline-flex items-center gap-2 text-mute">
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
              className="min-w-0 flex-1 rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 font-mono text-[13px] text-ink"
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
        {pane.status === 'running' && (
          <RunningState compact startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        )}
        {pane.error && <ErrorCard message={pane.error} />}
        {pane.output && <div className="p-3 pb-0"><ResultSummary output={pane.output} /></div>}
        <UserTable paneId={paneId} highlight={userHighlight(op.id)} />
        {pane.output && <OutputView output={pane.output} paneId={paneId} showSummary={false} />}
      </>
    )
  }

  if (op.view === 'groups') {
    return (
      <>
        <div className="overflow-auto p-4">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12.5px] font-medium text-faint">
              <tr>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2">Members</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {ws.groups.map((g) => (
                <tr key={g.name} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-[13.5px]">{g.name}</td>
                  <td className="px-3 py-2 text-mute">{g.members.join(', ')}</td>
                  <td className="px-3 py-2 text-warn">{g.anomaly ?? (g.privileged ? 'privileged' : '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pane.status === 'running' && (
          <RunningState compact startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        )}
        {pane.error && <ErrorCard message={pane.error} />}
        {pane.output && <OutputView output={pane.output} paneId={paneId} />}
      </>
    )
  }

  if (op.view === 'notes') {
    return (
      <div className="flex h-full flex-col p-4">
        <textarea
          data-testid="forensics-notes"
          value={ws.notes}
          onChange={(e) => ws.setNotes(e.target.value)}
          className="min-h-[200px] flex-1 resize-none rounded-xl border border-line bg-elev p-4 font-mono text-[14px] leading-7 text-ink outline-none focus:border-accent"
        />
        {pane.status === 'running' && (
          <RunningState compact startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        )}
        {pane.error && <ErrorCard message={pane.error} />}
        {pane.output && <OutputView output={pane.output} paneId={paneId} />}
      </div>
    )
  }

  if (op.view === 'journal') {
    return (
      <div className="p-4">
        {ws.journal.length === 0 && (
          <p className="text-[15px] leading-7 text-mute">Nothing logged yet. Run a check to start the log.</p>
        )}
        <ol className="space-y-2">
          {ws.journal.map((j) => (
            <li key={j.id} className="flex gap-3 rounded-xl border border-line bg-elev px-3.5 py-2.5 text-[14px]">
              <span className="shrink-0 font-mono text-[12.5px] text-faint">
                {new Date(j.ts).toLocaleTimeString()}
              </span>
              <span className="w-16 shrink-0 text-[12px] uppercase tracking-wide text-accent">{j.kind}</span>
              <span>{j.text}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (op.view === 'favorites') {
    return (
      <div className="p-4">
        {ws.favorites.length === 0 && (
          <p className="text-[15px] leading-7 text-mute">Star checks in the list to pin them here.</p>
        )}
        <ul className="space-y-2">
          {ws.favorites.map((id) => {
            const fav = OPS_BY_ID[id]
            if (!fav) return null
            return (
              <li key={id} className="flex items-center gap-2 rounded-xl border border-line bg-elev px-3.5 py-2.5">
                <button
                  type="button"
                  className="text-left text-[15px] text-ink hover:text-accent"
                  onClick={() => ws.openOp(id)}
                >
                  {fav.title}
                </button>
                <button
                  type="button"
                  className="ml-auto text-[13.5px] text-mute hover:text-crit"
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
      <div className="p-4">
        <div className="mb-3 text-[15px] text-mute">
          {done}/{PREFLIGHT_ITEMS.length} complete — start-of-round list.
        </div>
        <ul className="space-y-2">
          {PREFLIGHT_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-elev px-3.5 py-2.5 hover:bg-hover">
                <input
                  type="checkbox"
                  checked={Boolean(ws.preflight[item.id])}
                  onChange={() => ws.togglePreflight(item.id)}
                />
                <span>
                  <span className="block text-[15px]">{item.label}</span>
                  <span className="text-[13px] text-faint">{item.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {pane.status === 'running' && (
          <RunningState compact startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        )}
        {pane.error && <ErrorCard message={pane.error} />}
        {pane.output && <OutputView output={pane.output} paneId={paneId} />}
      </div>
    )
  }

  if (op.view === 'export') {
    const findings = collectFindings(ws.panes)
    return (
      <div className="p-5">
        <p className="text-[15px] leading-7 text-mute">
          {findings.length} findings across open panes · {ws.journal.length} log entries.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-semibold text-elev"
            onClick={() => download('cp-ops-findings.json', JSON.stringify(exportPayload(ws), null, 2), 'application/json')}
          >
            Download JSON
          </button>
          <button
            type="button"
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[13.5px] hover:bg-hover"
            onClick={() => download('cp-ops-findings.csv', toCsv(findings), 'text/csv')}
          >
            Download CSV
          </button>
        </div>
        {pane.status === 'running' && (
          <RunningState startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        )}
        {pane.error && <ErrorCard message={pane.error} />}
        {pane.output && <OutputView output={pane.output} paneId={paneId} />}
        {!pane.output && pane.status !== 'running' && !pane.error && <IdleHint demo={ws.demoMode} />}
      </div>
    )
  }

  if (op.id === 'find-media-files') {
    return (
      <div>
        <label className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[13.5px]">
          File types
          <input
            value={ws.mediaExtensions}
            onChange={(e) => ws.setMediaExtensions(e.target.value)}
            className="flex-1 rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 font-mono text-[13px]"
          />
        </label>
        {pane.status === 'running' ? (
          <RunningState startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
        ) : pane.error && !pane.output ? (
          <ErrorCard message={pane.error} />
        ) : pane.output ? (
          <>
            {pane.error && <ErrorCard message={pane.error} />}
            <OutputView output={pane.output} paneId={paneId} />
          </>
        ) : (
          <IdleHint demo={ws.demoMode} />
        )}
      </div>
    )
  }

  if (pane.status === 'running') {
    return <RunningState startedAt={pane.startedAt} onCancel={() => ws.cancelRun(paneId)} />
  }
  if (pane.error && !pane.output) return <ErrorCard message={pane.error} />
  if (pane.output) {
    return (
      <>
        {pane.error && <ErrorCard message={pane.error} />}
        <OutputView output={pane.output} paneId={paneId} />
      </>
    )
  }
  return <IdleHint demo={ws.demoMode} />
}

function userHighlight(opId: string) {
  if (opId === 'audit-uid-zero' || opId === 'audit-duplicate-uids') {
    return (user: { uid?: number; name: string }) => user.uid === 0 && user.name !== 'root'
  }
  if (opId === 'flag-suspicious-users') return isSuspicious
  if (opId === 'disable-guest-account') return (user: { name: string }) => user.name.toLowerCase() === 'guest'
  if (opId === 'check-empty-passwords') return (user: { emptyPassword: boolean }) => user.emptyPassword
  return undefined
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
      aria-label={title}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="rounded-lg p-1.5 text-mute hover:bg-hover hover:text-ink"
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
