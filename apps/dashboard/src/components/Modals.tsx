import { useEffect, useState } from 'react'
import { liveUsers } from '../lib/users'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'
import { AllowlistEditor } from './AllowlistEditor'
import { useFocusTrap } from './focus-trap'

export function OverlayLayer() {
  return (
    <>
      <ContextMenu />
      <ConfirmDialog />
      <PasswordDialog />
      <UserDetails />
      <ShortcutsModal />
      <AllowlistEditor />
    </>
  )
}

const SHORTCUTS: { keys: string; what: string }[] = [
  { keys: '/  or  Ctrl+K', what: 'Search the check list' },
  { keys: '1 – 4', what: 'Focus that pane' },
  { keys: 'Alt + arrows', what: 'Move focus between panes' },
  { keys: 'Enter', what: 'Run the focused check' },
  { keys: 'h', what: 'Open the how-to for the focused check' },
  { keys: '?', what: 'Show or hide this cheat sheet' },
  { keys: 'Esc', what: 'Close the dialog or drawer' },
]

function ShortcutsModal() {
  const ws = useWorkspace()
  const ref = useFocusTrap(ws.shortcutsOpen)
  if (!ws.shortcutsOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setShortcutsOpen(false)}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(28,27,25,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="shortcuts-modal"
      >
        <h2 id="shortcuts-title" className="font-display text-[22px] font-semibold tracking-tight">
          Keyboard shortcuts
        </h2>
        <p className="mt-1 text-[14px] leading-6 text-mute">These stay quiet while you are typing in a field.</p>
        <dl className="mt-4 divide-y divide-line">
          {SHORTCUTS.map((row) => (
            <div key={row.keys} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="font-mono text-[13px] text-ink">{row.keys}</dt>
              <dd className="text-right text-[14px] text-mute">{row.what}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            data-dialog-initial
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
            onClick={() => ws.setShortcutsOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
  const ref = useFocusTrap(Boolean(ws.confirm))
  useEffect(() => {
    setHome(false)
  }, [ws.confirm])
  if (!ws.confirm) return null
  const c = ws.confirm
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.cancelConfirm()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirm-dialog"
      >
        <h2 id="confirm-title" className="font-display text-[22px] font-semibold tracking-tight">{c.title}</h2>
        <p className="mt-2 text-[15px] leading-7 text-mute">{c.body}</p>
        {/* cp-13 dry-run preview slot. Hidden until confirm.preview is set. */}
        <div
          data-testid="confirm-dry-run"
          className={c.preview ? 'mt-3 rounded-xl border border-line bg-sidebar px-3 py-2.5 text-[13.5px] leading-6 text-ink' : 'hidden'}
        >
          {c.preview}
        </div>
        {c.extraHome && (
          <label className="mt-3 flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
            Also mark the home folder
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            data-dialog-initial
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
            onClick={() => ws.cancelConfirm()}
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
  const ref = useFocusTrap(Boolean(ws.passwordModal))
  useEffect(() => {
    if (ws.passwordModal) setValue(genPassword())
  }, [ws.passwordModal])
  if (!ws.passwordModal) return null
  const { name, userId } = ws.passwordModal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setPasswordModal(null)}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-title"
        className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="password-dialog"
      >
        <h2 id="password-title" className="font-display text-[22px] font-semibold tracking-tight">Expire password — {name}</h2>
        <p className="mt-2 text-[15px] leading-7 text-mute">
          {ws.demoMode
            ? 'Practice only: a suggested password is written to the change log, not the operating system.'
            : 'On this computer, prefer the Expire password check with confirmation. This dialog only notes the intent.'}
        </p>
        <input
          data-dialog-initial
          aria-label={`Suggested note for ${name}`}
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
  const ref = useFocusTrap(Boolean(ws.detailsUserId))
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
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        className="w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-panel p-6 shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="user-details"
      >
        <h2 id="user-details-title" className="font-display text-[22px] font-semibold tracking-tight">{user.name}</h2>
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
            data-dialog-initial
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
