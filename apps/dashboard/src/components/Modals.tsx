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
      className="fixed z-50 min-w-48 rounded-xl border border-line-strong bg-elev py-1.5 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3.5 py-1.5 font-mono text-[12.5px] text-faint">{user.name}</div>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={cn(
            'block w-full px-3.5 py-2 text-left text-[14px] hover:bg-hover',
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
        className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirm-dialog"
      >
        <div className="font-display text-[22px] font-semibold tracking-tight">{c.title}</div>
        <p className="mt-2 text-[15px] leading-7 text-mute">{c.body}</p>
        {c.extraHome && (
          <label className="mt-3 flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
            Also mark the home folder
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
            onClick={() => ws.setConfirm(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-accept"
            className={cn(
              'rounded-lg px-3.5 py-2 text-[14px] font-semibold',
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
        className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="password-dialog"
      >
        <div className="font-display text-[22px] font-semibold tracking-tight">Expire password — {name}</div>
        <p className="mt-2 text-[15px] leading-7 text-mute">
          {ws.demoMode
            ? 'Practice only: a suggested password is written to the change log, not the operating system.'
            : 'On this computer, prefer the Expire password check with confirmation. This dialog only notes the intent.'}
        </p>
        <input
          className="mt-3 w-full rounded-lg border border-line-strong bg-elev px-3 py-2 font-mono text-[14px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
            onClick={() => ws.setPasswordModal(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-ink px-3.5 py-2 text-[14px] font-semibold text-elev"
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
        className="w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="user-details"
      >
        <div className="font-display text-[22px] font-semibold tracking-tight">{user.name}</div>
        <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-2 text-[14px]">
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
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
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
