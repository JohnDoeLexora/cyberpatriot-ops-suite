import type { OpResult, Severity } from '../catalog/types'
import { summarizeOpResult, type SummaryTone } from '../lib/adapt-result'
import { cn } from '../lib/cn'

const chipClass: Record<Severity, string> = {
  ok: 'bg-ok-dim text-ok',
  info: 'bg-info-dim text-info',
  warn: 'bg-warn-dim text-warn',
  crit: 'bg-crit-dim text-crit',
}

const toneClass: Record<SummaryTone, string> = {
  clear: 'border-ok/40 bg-ok-dim',
  watch: 'border-warn/40 bg-warn-dim',
  urgent: 'border-crit/40 bg-crit-dim',
  info: 'border-line bg-elev',
  empty: 'border-dashed border-line-strong bg-sidebar',
}

export function ResultSummary({ output }: { output: OpResult }) {
  const summary = summarizeOpResult(output)
  return (
    <section
      data-testid="result-summary"
      data-tone={summary.tone}
      data-state={summary.tone === 'empty' ? 'empty' : 'summary'}
      aria-label="Result summary"
      className={cn('rounded-xl border px-4 py-3', toneClass[summary.tone])}
    >
      <h3
        className="font-display text-[1.35rem] font-semibold leading-snug tracking-tight text-ink"
        data-testid="result-headline"
      >
        {summary.headline}
      </h3>
      {summary.tone === 'empty' && (
        <p className="mt-1 text-[14px] leading-6 text-mute" data-testid="state-empty">
          Nothing matched this check. That is different from an error, and different from a check you have not run yet.
        </p>
      )}
      {summary.chips.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Severity counts">
          {summary.chips.map((chip) => (
            <li
              key={`${chip.severity}-${chip.label}`}
              className={cn('rounded-md px-2 py-0.5 text-[12.5px] font-semibold', chipClass[chip.severity])}
            >
              {chip.count} {chip.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
