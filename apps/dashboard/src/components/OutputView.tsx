import type { Finding, OpResult, Severity } from '../catalog/types'
import { cn } from '../lib/cn'

const sev: Record<Severity, string> = {
  ok: 'text-ok bg-ok-dim',
  info: 'text-info bg-info-dim',
  warn: 'text-warn bg-warn-dim',
  crit: 'text-crit bg-crit-dim',
}

const sevLabel: Record<Severity, string> = {
  ok: 'ok',
  info: 'note',
  warn: 'watch',
  crit: 'urgent',
}

export function OutputView({ output }: { output: OpResult }) {
  return (
    <div className="space-y-4 p-5" data-testid="op-output">
      <p className="text-[15px] leading-7 text-ink">{output.summary}</p>
      {output.meta && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(output.meta).map(([k, v]) => (
            <span key={k} className="rounded-md border border-line bg-elev px-2 py-0.5 text-[12.5px] text-mute">
              {k}={v}
            </span>
          ))}
        </div>
      )}
      {output.findings.length > 0 && (
        <ul className="space-y-2.5">
          {output.findings.map((f) => (
            <FindingRow key={f.id} finding={f} />
          ))}
        </ul>
      )}
      {output.checklist && (
        <div className="overflow-auto rounded-xl border border-line">
          {output.checklist.map((c) => (
            <div key={c.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <span
                className={cn(
                  'mt-0.5 w-14 shrink-0 rounded-md text-center text-[11px] font-medium uppercase',
                  c.status === 'pass' && 'bg-ok-dim text-ok',
                  c.status === 'fail' && 'bg-crit-dim text-crit',
                  c.status === 'warn' && 'bg-warn-dim text-warn',
                  c.status === 'na' && 'bg-elev text-mute',
                )}
              >
                {c.status}
              </span>
              <div className="min-w-0">
                <div className="text-[15px] leading-6">{c.label}</div>
                {c.note && <div className="mt-0.5 text-[13.5px] leading-6 text-mute">{c.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {output.tables?.map((t) => (
        <div key={t.title} className="overflow-auto rounded-xl border border-line">
          <div className="border-b border-line bg-sidebar px-4 py-2 text-[12.5px] font-medium text-faint">
            {t.title}
          </div>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr>
                {t.columns.map((c) => (
                  <th key={c.key} className="px-4 py-2 text-[12.5px] font-medium text-mute">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, i) => (
                <tr key={i} className="border-t border-line/80">
                  {t.columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-2', c.mono && 'font-mono text-[13px] text-mute')}>
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {output.logs && (
        <pre className="overflow-auto rounded-xl border border-line bg-elev p-4 font-mono text-[13px] leading-6">
          {output.logs.map((l, i) => (
            <div key={i}>
              <span className="text-faint">{l.ts}</span>{' '}
              <span
                className={cn(
                  l.level === 'ERROR' && 'text-crit',
                  l.level === 'WARN' && 'text-warn',
                  l.level === 'AUTH' && 'text-info',
                  l.level === 'INFO' && 'text-ok',
                )}
              >
                {l.level}
              </span>{' '}
              {l.msg}
            </div>
          ))}
        </pre>
      )}
    </div>
  )
}

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-elev px-4 py-3 shadow-sm">
      <span className={cn('h-fit rounded-md px-2 py-0.5 text-[11px] font-medium uppercase', sev[finding.severity])}>
        {sevLabel[finding.severity]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium leading-6">{finding.title}</div>
        <div className="mt-1 text-[14px] leading-6 text-mute">{finding.detail}</div>
        {finding.remediation && (
          <div className="mt-1.5 text-[13.5px] leading-6 text-accent">Next: {finding.remediation}</div>
        )}
      </div>
    </li>
  )
}
