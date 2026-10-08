import { CircleHelp, Copy, Wrench } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export type RowFix = {
  opId: string
  params?: Record<string, string>
  title: string
  body: string
}

function slug(label: string) {
  const cleaned = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return cleaned || 'row'
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    /* fall through to the selection fallback */
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}

export function RowActions({
  paneId,
  label,
  copyValue,
  howtoOpId,
  fix,
}: {
  paneId: string
  label: string
  copyValue: string
  howtoOpId: string
  fix?: RowFix
}) {
  const ws = useWorkspace()
  const id = slug(label)
  const [copied, setCopied] = useState(false)

  return (
    <div className="row-actions" role="group" aria-label={`Actions for ${label}`}>
      <RowButton
        title={`Copy ${label}`}
        testId={`row-copy-${id}`}
        onClick={() => {
          void copyText(copyValue).then(() => {
            setCopied(true)
            ws.toast({ tone: 'info', title: `Copied ${label}` })
          })
        }}
      >
        <Copy size={14} aria-hidden />
      </RowButton>
      <RowButton title={`How to for ${label}`} testId={`row-howto-${id}`} onClick={() => ws.openHowto(howtoOpId)}>
        <CircleHelp size={14} aria-hidden />
      </RowButton>
      <RowButton
        title={fix ? `Run related fix for ${label}` : `No related fix for ${label}`}
        testId={`row-fix-${id}`}
        disabled={!fix}
        onClick={() => {
          if (!fix) return
          ws.setConfirm({
            title: fix.title,
            body: fix.body,
            confirmLabel: 'Yes, apply',
            danger: true,
            onConfirm: () => {
              ws.assignOp(paneId, fix.opId)
              void ws.runPane(paneId, { confirm: true, opId: fix.opId, params: fix.params })
            },
          })
        }}
      >
        <Wrench size={14} aria-hidden />
      </RowButton>
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied ${label}` : ''}
      </span>
    </div>
  )
}

function RowButton({
  children,
  onClick,
  title,
  testId,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  testId: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-hover hover:text-ink',
        'focus-visible:text-ink disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function fixCopy(demo: boolean, action: string): string {
  return demo
    ? `Practice data: this simulates ${action}. This computer is not changed.`
    : `This runs ${action} on this computer. Continue only on an authorized image.`
}

/** Same three actions for service, file, port, and package tables. */
export function tableRowActions(
  tableTitle: string,
  row: Record<string, string>,
  demo: boolean,
): { label: string; copyValue: string; howtoOpId: string; fix?: RowFix } | null {
  if (tableTitle === 'Services') {
    const label = row.name || 'service'
    const risky = /risky/i.test(row.note ?? '')
    return {
      label,
      copyValue: label,
      howtoOpId: risky ? 'disable-service' : 'list-services',
      fix: risky
        ? {
            opId: 'disable-service',
            params: { service: label },
            title: `Disable ${label}?`,
            body: fixCopy(demo, `disabling ${label}`),
          }
        : undefined,
    }
  }
  if (tableTitle === 'Files') {
    const label = row.path || 'file'
    const note = row.note ?? ''
    const howtoOpId = /suid/i.test(note)
      ? 'find-suid-sgid'
      : /world-writable/i.test(note)
        ? 'find-world-writable'
        : 'check-sensitive-file-perms'
    return { label, copyValue: label, howtoOpId }
  }
  if (tableTitle === 'Listening ports') {
    const label = row.local || 'port'
    const note = row.note ?? ''
    const unexpected = Boolean(note) && !/expected/i.test(note)
    const proc = row.proc?.trim()
    const telnet = label.endsWith(':23') || /telnet/i.test(proc ?? '') || /telnet/i.test(note)
    return {
      label,
      copyValue: label,
      howtoOpId: telnet ? 'disable-telnet' : 'audit-listening-ports',
      fix:
        unexpected && proc
          ? {
              opId: telnet ? 'disable-telnet' : 'disable-service',
              params: telnet ? undefined : { service: proc },
              title: telnet ? 'Turn off Telnet?' : `Disable ${proc}?`,
              body: fixCopy(demo, telnet ? 'turning off Telnet' : `disabling ${proc}`),
            }
          : undefined,
    }
  }
  if (tableTitle === 'Software') {
    const label = row.name || 'package'
    const banned = /banned/i.test(row.note ?? '')
    return {
      label,
      copyValue: label,
      howtoOpId: banned ? 'remove-package' : 'find-prohibited-software',
      fix: banned
        ? {
            opId: 'remove-package',
            params: { package: label },
            title: `Remove ${label}?`,
            body: fixCopy(demo, `removing ${label}`),
          }
        : undefined,
    }
  }
  return null
}
