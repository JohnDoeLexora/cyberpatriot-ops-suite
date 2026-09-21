import { useRef } from 'react'
import {
  DEFAULT_ADMINS_TEXT,
  DEFAULT_USERS_TEXT,
  downloadFilename,
  downloadText,
  parseNameList,
  readTextFile,
} from '../lib/allowlist'
import { useWorkspace } from '../state/workspace'

export function AllowlistEditor() {
  const ws = useWorkspace()
  const usersFile = useRef<HTMLInputElement | null>(null)
  const adminsFile = useRef<HTMLInputElement | null>(null)
  if (!ws.allowlistOpen) return null

  const userCount = parseNameList(ws.allowlistUsers).length
  const adminCount = parseNameList(ws.allowlistAdmins).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25" onClick={() => ws.setAllowlistOpen(false)}>
      <div
        className="flex max-h-[min(720px,calc(100vh-2rem))] w-[min(720px,calc(100vw-2rem))] flex-col rounded-2xl border border-line-strong bg-panel shadow-[0_18px_50px_rgba(43,38,31,0.16)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="allowlist-editor"
        role="dialog"
        aria-label="Allowlist editor"
      >
        <header className="shrink-0 border-b border-line px-6 py-4">
          <div className="font-display text-[22px] font-semibold tracking-tight">Allowlists</div>
          <p className="coach-tip mt-1 text-[14px] leading-6 text-mute">
            Paste the README user and admin lists. Saved in this browser. Download{' '}
            <code className="font-mono text-[13px]">allowed-users.txt</code> /{' '}
            <code className="font-mono text-[13px]">allowed-admins.txt</code> into{' '}
            <code className="font-mono text-[13px]">config/</code> on the image. No passwords.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor
              kind="users"
              label="allowed-users.txt"
              testId="allowlist-users"
              value={ws.allowlistUsers}
              count={userCount}
              fileRef={usersFile}
              onChange={ws.setAllowlistUsers}
              onReset={() => ws.setAllowlistUsers(DEFAULT_USERS_TEXT)}
            />
            <ListEditor
              kind="admins"
              label="allowed-admins.txt"
              testId="allowlist-admins"
              value={ws.allowlistAdmins}
              count={adminCount}
              fileRef={adminsFile}
              onChange={ws.setAllowlistAdmins}
              onReset={() => ws.setAllowlistAdmins(DEFAULT_ADMINS_TEXT)}
            />
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            data-testid="allowlist-close"
            className="rounded-lg border border-line-strong px-3.5 py-2 text-[14px] hover:bg-hover"
            onClick={() => ws.setAllowlistOpen(false)}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}

function ListEditor({
  kind,
  label,
  testId,
  value,
  count,
  fileRef,
  onChange,
  onReset,
}: {
  kind: 'users' | 'admins'
  label: string
  testId: string
  value: string
  count: number
  fileRef: { current: HTMLInputElement | null }
  onChange: (text: string) => void
  onReset: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[14px] font-medium text-ink">{label}</span>
        <span className="font-mono text-[12px] text-faint">{count} names</span>
      </div>
      <textarea
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="min-h-[16rem] flex-1 resize-y rounded-xl border border-line bg-elev p-3 font-mono text-[13px] leading-6 text-ink outline-none focus:border-accent"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`${testId}-download`}
          className="rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 text-[13px] hover:bg-hover"
          onClick={() => downloadText(downloadFilename(kind), value)}
        >
          Download
        </button>
        <button
          type="button"
          data-testid={`${testId}-upload`}
          className="rounded-lg border border-line-strong bg-elev px-2.5 py-1.5 text-[13px] hover:bg-hover"
          onClick={() => fileRef.current?.click()}
        >
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          data-testid={`${testId}-file`}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            onChange(await readTextFile(file))
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className="rounded-lg px-2.5 py-1.5 text-[13px] text-mute hover:text-ink"
          onClick={onReset}
        >
          Reset example
        </button>
      </div>
    </div>
  )
}
