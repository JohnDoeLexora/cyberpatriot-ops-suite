import { CircleAlert, CircleDashed, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { explainRunError } from '../lib/adapt-result'

export function IdleHint({ demo }: { demo: boolean }) {
  return (
    <div
      className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 p-8 text-center"
      data-testid="state-idle"
      data-state="idle"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-sidebar text-mute">
        <CircleDashed size={20} aria-hidden />
      </span>
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-mute">Not run yet</p>
      <p className="max-w-sm text-[15px] leading-7 text-ink">
        Press the button above to {demo ? 'run this check on practice data.' : 'run this check on this computer.'}
      </p>
    </div>
  )
}

export function RunningState({
  startedAt,
  onCancel,
  compact = false,
}: {
  startedAt?: number | null
  onCancel: () => void
  compact?: boolean
}) {
  return (
    <div
      className={compact ? 'border-b border-line bg-accent-dim/50 px-4 py-2.5' : 'p-4'}
      data-testid="state-running"
      data-state="running"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <LoaderCircle size={16} className="status-running text-accent" aria-hidden />
        <span className="text-[14px] font-medium text-ink">
          Running · <Elapsed since={startedAt ?? Date.now()} />
        </span>
        <button
          type="button"
          data-testid="cancel-run"
          onClick={onCancel}
          className="ml-auto rounded-lg border border-line-strong bg-elev px-2.5 py-1 text-[13px] font-medium text-ink hover:bg-hover"
        >
          Cancel
        </button>
      </div>
      {!compact && (
        <div className="mt-4 space-y-2.5" aria-hidden>
          <div className="skeleton h-6 w-3/5 rounded-lg" />
          <div className="skeleton h-4 w-full rounded-md" />
          <div className="skeleton h-4 w-4/5 rounded-md" />
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const seconds = Math.max(0, Math.floor((now - since) / 1000))
  return (
    <span data-testid="run-elapsed">
      {seconds}s
    </span>
  )
}

export function ErrorCard({ message }: { message: string }) {
  const copy = explainRunError(message)
  return (
    <div
      className="m-4 rounded-xl border border-crit/40 bg-crit-dim px-4 py-3.5"
      data-testid="error-card"
      data-state="error"
      role="alert"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-crit">
        <CircleAlert size={14} className="mr-1 inline" aria-hidden />
        Something went wrong
      </p>
      <h3 className="mt-1.5 font-display text-[1.25rem] font-semibold tracking-tight text-ink">What happened</h3>
      <p className="mt-1 text-[15px] leading-6 text-ink">{copy.what}</p>
      <h3 className="mt-3 text-[14px] font-semibold text-ink">What to try</h3>
      <p className="mt-1 text-[14.5px] leading-6 text-mute">{copy.tryNext}</p>
      <details className="mt-3 rounded-lg border border-crit/20 bg-panel/70 px-3 py-2">
        <summary className="cursor-pointer text-[13.5px] font-medium text-ink">Details</summary>
        <pre
          data-testid="error-details"
          className="mt-2 overflow-hidden whitespace-pre-wrap break-words font-mono text-[12.5px] leading-5 text-mute"
        >
          {message}
        </pre>
      </details>
    </div>
  )
}
