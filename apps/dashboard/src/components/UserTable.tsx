import { Eye, Flag, KeyRound, Power, PowerOff, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { liveUsers, type UiUser } from '../lib/users'
import { useWorkspace } from '../state/workspace'

export function UserTable({ paneId, highlight }: { paneId: string; highlight?: (u: UiUser) => boolean }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const rows = liveUsers(ws.users)
  const selected = new Set(pane?.selectedUserIds ?? [])
  const allIds = rows.filter((u) => u.name !== 'root' && !u.authorized).map((u) => u.id)

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.5">
        <span className="text-[13.5px] text-mute">{rows.length} accounts</span>
        <button
          type="button"
          className="rounded-lg border border-line-strong px-2.5 py-1.5 text-[13.5px] hover:bg-hover"
          onClick={() => ws.setUserSelected(paneId, selected.size === allIds.length ? [] : allIds)}
        >
          {selected.size === allIds.length ? 'Clear' : 'Select extra accounts'}
        </button>
        <button
          type="button"
          data-testid="bulk-disable"
          disabled={!selected.size}
          className="rounded-lg border border-crit/30 bg-crit-dim px-2.5 py-1.5 text-[13.5px] text-crit disabled:opacity-40"
          onClick={() => {
            const ids = [...selected]
            const live = !ws.demoMode
            ws.setConfirm({
              title: `Turn off ${ids.length} account(s)?`,
              body: live
                ? 'This will disable the selected accounts on this computer. Root is never touched. Continue only on an authorized image.'
                : 'Practice data: selected accounts become disabled. Root is never touched.',
              confirmLabel: 'Turn off',
              danger: true,
              onConfirm: () => {
                ws.bulkDisable(ids)
                ws.setUserSelected(paneId, [])
              },
            })
          }}
        >
          Turn off selected ({selected.size})
        </button>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-left text-[14px]" data-testid="user-table">
          <thead className="sticky top-0 z-10 bg-panel text-[12.5px] font-medium text-faint">
            <tr>
              <th className="w-8 bg-panel px-3 py-2.5" />
              <th className="min-w-[8rem] bg-panel px-3 py-2.5">Account</th>
              <th className="hide-narrow bg-panel px-3 py-2.5">UID</th>
              <th className="bg-panel px-3 py-2.5">Status</th>
              <th className="hide-narrow bg-panel px-3 py-2.5">Shell</th>
              <th className="hide-narrow bg-panel px-3 py-2.5">Last login</th>
              <th className="hide-narrow bg-panel px-3 py-2.5">Home</th>
              <th className="bg-panel px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const hot = highlight?.(u)
              const rowBg = hot ? 'bg-crit-dim/40' : u.flagged ? 'bg-warn-dim/50' : 'bg-panel'
              return (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.name.toLowerCase()}`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    ws.setContextMenu({ x: e.clientX, y: e.clientY, userId: u.id })
                  }}
                  className={cn(
                    'group border-t border-line/80 hover:bg-hover',
                    rowBg,
                    u.status === 'disabled' && 'opacity-70',
                  )}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      disabled={u.name === 'root'}
                      onChange={() => ws.toggleUserSelected(paneId, u.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className={cn('font-mono text-[13.5px]', u.status === 'disabled' && 'line-through')}>
                        {u.name}
                      </span>
                      {u.flagged && (
                        <span className="rounded-md bg-warn-dim px-1.5 py-px text-[11px] font-medium uppercase text-warn">
                          flag
                        </span>
                      )}
                      {u.uid === 0 && u.name !== 'root' && (
                        <span className="rounded-md bg-crit-dim px-1.5 py-px text-[11px] font-medium uppercase text-crit">
                          extra root
                        </span>
                      )}
                      {u.emptyPassword && (
                        <span className="rounded-md bg-crit-dim px-1.5 py-px text-[11px] font-medium uppercase text-crit">
                          blank password
                        </span>
                      )}
                    </div>
                    <div className="show-narrow mt-1 text-[12.5px] leading-5 text-faint">
                      {u.uid ?? '—'} · {u.shell ?? '—'} · {formatLogin(u.lastLogin)}
                    </div>
                  </td>
                  <td className="hide-narrow px-3 py-2.5 font-mono text-[13.5px] text-mute">{u.uid ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <StatusChip status={u.status} />
                  </td>
                  <td className="hide-narrow px-3 py-2.5 font-mono text-[13px] text-mute">{u.shell ?? '—'}</td>
                  <td className="hide-narrow px-3 py-2.5 text-mute">{formatLogin(u.lastLogin)}</td>
                  <td className="hide-narrow px-3 py-2.5 font-mono text-[13px] text-mute">{u.home ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-nowrap justify-end gap-0.5 text-ink">
                      <IconBtn
                        title="Flag"
                        testId={`action-flag-${u.name.toLowerCase()}`}
                        onClick={() =>
                          ws.mutateUser(u.id, { flagged: !u.flagged }, `${u.flagged ? 'Unflagged' : 'Flagged'} ${u.name}`)
                        }
                      >
                        <Flag size={14} />
                      </IconBtn>
                      {u.status === 'active' ? (
                        <IconBtn
                          title="Turn off"
                          testId={`action-disable-${u.name.toLowerCase()}`}
                          onClick={() => {
                            const live = !ws.demoMode
                            const apply = () => ws.mutateUser(u.id, { status: 'disabled' }, `Turned off ${u.name}`)
                            if (live) {
                              ws.setConfirm({
                                title: `Turn off ${u.name}?`,
                                body: 'This disables the account on this computer. Continue only on an authorized image.',
                                confirmLabel: 'Turn off',
                                danger: true,
                                onConfirm: apply,
                              })
                            } else {
                              apply()
                            }
                          }}
                        >
                          <PowerOff size={14} />
                        </IconBtn>
                      ) : (
                        <IconBtn
                          title="Turn on"
                          testId={`action-enable-${u.name.toLowerCase()}`}
                          onClick={() => ws.mutateUser(u.id, { status: 'active' }, `Turned on ${u.name}`)}
                        >
                          <Power size={14} />
                        </IconBtn>
                      )}
                      <IconBtn
                        title="Expire password"
                        testId={`action-reset-${u.name.toLowerCase()}`}
                        onClick={() => ws.setPasswordModal({ userId: u.id, name: u.name })}
                      >
                        <KeyRound size={14} />
                      </IconBtn>
                      <IconBtn
                        title="View details"
                        testId={`action-details-${u.name.toLowerCase()}`}
                        onClick={() => ws.setDetailsUserId(u.id)}
                      >
                        <Eye size={14} />
                      </IconBtn>
                      <IconBtn
                        title="Remove from list"
                        danger
                        testId={`action-delete-${u.name.toLowerCase()}`}
                        onClick={() =>
                          ws.setConfirm({
                            title: `Remove ${u.name} from the list?`,
                            body: ws.demoMode
                              ? 'Practice data only — hides the account in this session. Prefer turning the account off on a real image.'
                              : 'Hides the row here. Use Turn off account to disable it on this computer.',
                            confirmLabel: 'Remove',
                            danger: true,
                            extraHome: true,
                            onConfirm: ({ removeHome }) =>
                              ws.mutateUser(
                                u.id,
                                { status: 'deleted' },
                                `Removed ${u.name}${removeHome ? ' (home marked)' : ''}`,
                              ),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatLogin(value: string | null) {
  if (!value) return 'never'
  const d = Date.parse(value)
  if (Number.isNaN(d)) return value
  return new Date(d).toLocaleString()
}

function StatusChip({ status }: { status: UiUser['status'] }) {
  const map = {
    active: 'text-ok',
    disabled: 'text-mute',
    locked: 'text-warn',
    deleted: 'text-crit',
  }
  const label = { active: 'active', disabled: 'off', locked: 'locked', deleted: 'removed' }
  return <span className={cn('text-[13.5px]', map[status])}>{label[status]}</span>
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  testId,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  danger?: boolean
  testId: string
}) {
  return (
    <button
      type="button"
      title={title}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'rounded-lg p-1.5 hover:bg-hover',
        danger ? 'text-crit hover:bg-crit-dim' : 'text-mute hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
