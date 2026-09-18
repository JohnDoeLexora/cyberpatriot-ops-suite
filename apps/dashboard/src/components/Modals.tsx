import { useEffect, useState } from 'react'
import { liveUsers } from '../lib/users'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function OverlayLayer() {
  return (
    <>
      <ContextMenu />
      <ConfirmDialog />
      <PasswordDialog />
      <UserDetails />
    </>
  )
}

function ContextMenu() {
  const ws = useWorkspace()
  const menu = ws.contextMenu
  useEffect(() => {
    if (!menu) return
    const close = () => ws.setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu, ws])
  if (!menu) return null
  const user = ws.users.find((u) => u.id === menu.userId)
  if (!user) return null
  const actions: { label: string; danger?: boolean; run: () => void }[] = [
    {
      label: user.flagged ? 'Unflag' : 'Flag',
      run: () => ws.mutateUser(user.id, { flagged: !user.flagged }, `${user.flagged ? 'Unflagged' : 'Flagged'} ${user.name}`),
    },
    {
      label: user.status === 'disabled' || user.status === 'locked' ? 'Turn on' : 'Turn off',
      run: () =>
        ws.mutateUser(
          user.id,
          { status: user.status === 'active' ? 'disabled' : 'active' },
          `${user.status === 'active' ? 'Turned off' : 'Turned on'} ${user.name}`,
        ),
    },
    {
      label: 'Expire password…',
      run: () => ws.setPasswordModal({ userId: user.id, name: user.name }),
    },
    {
      label: 'View details',
      run: () => ws.setDetailsUserId(user.id),
    },
    {
      label: 'Remove from list…',
      danger: true,
      run: () =>
        ws.setConfirm({
          title: `Remove ${user.name} from the list?`,
          body: 'Hides the row in this session. Prefer turning the account off on a real image.',
          confirmLabel: 'Remove',
          danger: true,
          extraHome: true,
          onConfirm: ({ removeHome }) =>
            ws.mutateUser(
              user.id,
              { status: 'deleted' },
              `Removed ${user.name}${removeHome ? ' (home marked)' : ''}`,
            ),
        }),
    },
  ]
  return (
    <div
      data-testid="context-menu"
      className="fixed z-50 min-w-44 rounded-md border border-line-strong bg-elev py-1 shadow-lg"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 font-mono text-[12px] text-faint">{user.name}</div>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={cn(
            'block w-full px-3 py-1.5 text-left text-[13.5px] hover:bg-hover',
            a.danger ? 'text-crit' : 'text-ink',
          )}
          onClick={() => {
            a.run()
            ws.setContextMenu(null)
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

function ConfirmDialog() {
  const ws = useWorkspace()
  const [home, setHome] = useState(false)
  useEffect(() => {
    setHome(false)
  }, [ws.confirm])
  if (!ws.confirm) return null
  const c = ws.confirm
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setConfirm(null)}>
      <div
        className="w-[min(440px,calc(100vw-2rem))] rounded-lg border border-line-strong bg-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirm-dialog"
      >
        <div className="font-display text-[18px] font-semibold">{c.title}</div>
        <p className="mt-2 text-[14px] leading-6 text-mute">{c.body}</p>
        {c.extraHome && (
          <label className="mt-3 flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
            Also mark the home folder
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-line-strong px-3 py-1.5 text-[14px] hover:bg-hover"
            onClick={() => ws.setConfirm(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-accept"
            className={cn(
              'rounded-md px-3 py-1.5 text-[14px] font-semibold',
              c.danger ? 'bg-crit text-elev' : 'bg-ink text-elev',
            )}
            onClick={() => {
              c.onConfirm({ removeHome: home })
              ws.setConfirm(null)
            }}
          >
            {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PasswordDialog() {
  const ws = useWorkspace()
  const [value, setValue] = useState('')
  useEffect(() => {
    if (ws.passwordModal) setValue(genPassword())
  }, [ws.passwordModal])
  if (!ws.passwordModal) return null
  const { name, userId } = ws.passwordModal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setPasswordModal(null)}>
      <div
        className="w-[min(440px,calc(100vw-2rem))] rounded-lg border border-line-strong bg-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="password-dialog"
      >
        <div className="font-display text-[18px] font-semibold">Expire password — {name}</div>
        <p className="mt-2 text-[14px] leading-6 text-mute">
          {ws.demoMode
            ? 'Practice only: a suggested password is written to the change log, not the operating system.'
            : 'On this computer, prefer the Expire password check with confirmation. This dialog only notes the intent.'}
        </p>
        <input
          className="mt-3 w-full rounded-md border border-line-strong bg-elev px-2 py-1.5 font-mono text-[13px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-line-strong px-3 py-1.5 text-[14px] hover:bg-hover"
            onClick={() => ws.setPasswordModal(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-ink px-3 py-1.5 text-[14px] font-semibold text-elev"
            onClick={() => {
              ws.mutateUser(userId, { emptyPassword: false }, `Password expired for ${name} (noted)`)
              ws.log('user', `Password note for ${name}`)
              ws.setPasswordModal(null)
            }}
          >
            Note it
          </button>
        </div>
      </div>
    </div>
  )
}

function UserDetails() {
  const ws = useWorkspace()
  if (!ws.detailsUserId) return null
  const user =
    liveUsers(ws.users).find((u) => u.id === ws.detailsUserId) ?? ws.users.find((u) => u.id === ws.detailsUserId)
  if (!user) return null
  const rows: [string, string][] = [
    ['Name', user.name],
    ['UID', user.uid == null ? '—' : String(user.uid)],
    ['Home', user.home ?? '—'],
    ['Shell', user.shell ?? '—'],
    ['Groups', user.groups.join(', ')],
    ['Status', user.status],
    ['Flagged', user.flagged ? 'yes' : 'no'],
    ['Last login', user.lastLogin ?? 'never'],
    ['Created', user.createdAt || '—'],
    ['Blank password', user.emptyPassword ? 'yes' : 'no'],
    ['Admin / sudo', user.sudo ? 'yes' : 'no'],
    ['On allowlist', user.authorized ? 'yes' : 'no'],
    ['Notes', user.notes || '—'],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setDetailsUserId(null)}>
      <div
        className="w-[min(480px,calc(100vw-2rem))] rounded-lg border border-line-strong bg-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="user-details"
      >
        <div className="font-display text-[18px] font-semibold">{user.name}</div>
        <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-1.5 text-[14px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-faint">{k}</dt>
              <dd className="font-mono text-[13px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="rounded-md border border-line-strong px-3 py-1.5 text-[14px] hover:bg-hover"
            onClick={() => ws.setDetailsUserId(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  let out = ''
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
