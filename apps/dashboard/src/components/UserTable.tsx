import { Eye, Flag, KeyRound, Power, PowerOff, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { liveUsers, type UserRecord } from '../mock/users'
import { useWorkspace } from '../state/workspace'

export function UserTable({ paneId, highlight }: { paneId: string; highlight?: (u: UserRecord) => boolean }) {
  const ws = useWorkspace()
  const pane = ws.panes[paneId]
  const rows = liveUsers(ws.users)
  const selected = new Set(pane?.selectedUserIds ?? [])
  const allIds = rows.filter((u) => u.name !== 'root' && !u.authorized).map((u) => u.id)

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <span className="text-[11px] text-mute">{rows.length} accounts</span>
        <button
          type="button"
          className="rounded border border-line-strong px-2 py-0.5 text-[11px] hover:bg-hover"
          onClick={() => ws.setUserSelected(paneId, selected.size === allIds.length ? [] : allIds)}
        >
          {selected.size === allIds.length ? 'Clear' : 'Select unauthorized'}
        </button>
        <button
          type="button"
          data-testid="bulk-disable"
          disabled={!selected.size}
          className="rounded border border-crit/40 bg-crit-dim px-2 py-0.5 text-[11px] text-crit disabled:opacity-40"
          onClick={() => {
            const ids = [...selected]
            ws.setConfirm({
              title: `Disable ${ids.length} account(s)?`,
              body: 'Demo mock: selected accounts become disabled. Root is never touched.',
              confirmLabel: 'Disable',
              danger: true,
              onConfirm: () => {
                ws.bulkDisable(ids)
                ws.setUserSelected(paneId, [])
              },
            })
          }}
        >
          Disable selected ({selected.size})
        </button>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] text-left text-[12px]" data-testid="user-table">
          <thead className="sticky top-0 z-20 bg-panel text-[10px] uppercase tracking-wide text-faint">
            <tr>
              <th className="sticky left-0 z-30 w-7 bg-panel px-2 py-1" />
              <th className="sticky left-7 z-30 min-w-[8.5rem] bg-panel px-2 py-1">User</th>
              <th className="px-2 py-1">UID</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Shell</th>
              <th className="px-2 py-1">Last login</th>
              <th className="px-2 py-1">Home</th>
              <th className="px-2 py-1 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const hot = highlight?.(u)
              const rowBg = hot ? 'bg-crit-dim/30' : u.flagged ? 'bg-warn-dim/40' : 'bg-panel'
              return (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.name}`}
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
                  <td className={cn('sticky left-0 z-10 px-2 py-1 group-hover:bg-hover', rowBg)}>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      disabled={u.name === 'root'}
                      onChange={() => ws.toggleUserSelected(paneId, u.id)}
                    />
                  </td>
                  <td className={cn('sticky left-7 z-10 px-2 py-1 group-hover:bg-hover', rowBg)}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-mono', u.status === 'disabled' && 'line-through')}>{u.name}</span>
                      {u.flagged && (
                        <span className="rounded bg-warn-dim px-1 text-[9px] uppercase text-warn">flag</span>
                      )}
                      {u.uid === 0 && u.name !== 'root' && (
                        <span className="rounded bg-crit-dim px-1 text-[9px] uppercase text-crit">uid0</span>
                      )}
                      {u.emptyPassword && (
                        <span className="rounded bg-crit-dim px-1 text-[9px] uppercase text-crit">empty</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1 font-mono text-mute">{u.uid}</td>
                  <td className="px-2 py-1">
                    <StatusChip status={u.status} />
                  </td>
                  <td className="px-2 py-1 font-mono text-[11px] text-mute">{u.shell}</td>
                  <td className="px-2 py-1 text-mute">{u.lastLogin ?? 'never'}</td>
                  <td className="px-2 py-1 font-mono text-[11px] text-mute">{u.home}</td>
                  <td className="px-2 py-1">
                    <div className="flex justify-end gap-0.5 text-faint group-hover:text-ink">
                      <IconBtn
                        title="Flag suspicious"
                        testId={`action-flag-${u.name}`}
                        onClick={() =>
                          ws.mutateUser(u.id, { flagged: !u.flagged }, `${u.flagged ? 'Unflagged' : 'Flagged'} ${u.name}`)
                        }
                      >
                        <Flag size={12} />
                      </IconBtn>
                      {u.status === 'active' ? (
                        <IconBtn
                          title="Disable"
                          testId={`action-disable-${u.name}`}
                          onClick={() => ws.mutateUser(u.id, { status: 'disabled' }, `Disabled ${u.name}`)}
                        >
                          <PowerOff size={12} />
                        </IconBtn>
                      ) : (
                        <IconBtn
                          title="Enable / unlock"
                          testId={`action-enable-${u.name}`}
                          onClick={() => ws.mutateUser(u.id, { status: 'active' }, `Enabled ${u.name}`)}
                        >
                          <Power size={12} />
                        </IconBtn>
                      )}
                      <IconBtn
                        title="Reset password"
                        testId={`action-reset-${u.name}`}
                        onClick={() => ws.setPasswordModal({ userId: u.id, name: u.name })}
                      >
                        <KeyRound size={12} />
                      </IconBtn>
                      <IconBtn
                        title="View details"
                        testId={`action-details-${u.name}`}
                        onClick={() => ws.setDetailsUserId(u.id)}
                      >
                        <Eye size={12} />
                      </IconBtn>
                      <IconBtn
                        title="Delete"
                        danger
                        testId={`action-delete-${u.name}`}
                        onClick={() =>
                          ws.setConfirm({
                            title: `Delete ${u.name}?`,
                            body: 'Demo mock delete. Optionally remove the home directory.',
                            confirmLabel: 'Delete',
                            danger: true,
                            extraHome: true,
                            onConfirm: ({ removeHome }) =>
                              ws.mutateUser(
                                u.id,
                                { status: 'deleted' },
                                `Deleted ${u.name}${removeHome ? ' (+ home)' : ''}`,
                              ),
                          })
                        }
                      >
                        <Trash2 size={12} />
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

function StatusChip({ status }: { status: UserRecord['status'] }) {
  const map = {
    active: 'text-ok',
    disabled: 'text-mute',
    locked: 'text-warn',
    deleted: 'text-crit',
  }
  return <span className={cn('text-[11px] capitalize', map[status])}>{status}</span>
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
        'rounded p-1 hover:bg-elev',
        danger ? 'text-crit hover:bg-crit-dim' : 'text-mute hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
