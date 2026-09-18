import type { Finding, OpResult, Severity } from '../catalog/types'
import { cn } from '../lib/cn'

const sev: Record<Severity, string> = {
  ok: 'text-ok bg-ok-dim',
  info: 'text-info bg-info-dim',
  warn: 'text-warn bg-warn-dim',
  crit: 'text-crit bg-crit-dim',
}

export function OutputView({ output }: { output: OpResult }) {
  return (
    <div className="space-y-3 p-3" data-testid="op-output">
      <p className="text-[12.5px] text-ink">{output.summary}</p>
      {output.meta && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(output.meta).map(([k, v]) => (
            <span key={k} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-mute">
              {k}={v}
            </span>
          ))}
        </div>
      )}
      {output.findings.length > 0 && (
        <ul className="space-y-1">
          {output.findings.map((f) => (
            <FindingRow key={f.id} finding={f} />
          ))}
        </ul>
      )}
      {output.checklist && (
        <div className="rounded-md border border-line">
          {output.checklist.map((c) => (
            <div key={c.id} className="flex items-start gap-2 border-b border-line px-2 py-1.5 last:border-b-0">
              <span
                className={cn(
                  'mt-0.5 w-10 rounded text-center font-mono text-[9px] uppercase',
                  c.status === 'pass' && 'bg-ok-dim text-ok',
                  c.status === 'fail' && 'bg-crit-dim text-crit',
                  c.status === 'warn' && 'bg-warn-dim text-warn',
                  c.status === 'na' && 'bg-elev text-mute',
                )}
              >
                {c.status}
              </span>
              <div>
                <div className="text-[12px]">{c.label}</div>
                {c.note && <div className="text-[11px] text-mute">{c.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {output.tables?.map((t) => (
        <div key={t.title} className="overflow-auto rounded-md border border-line">
          <div className="border-b border-line bg-elev px-2 py-1 text-[10px] uppercase tracking-wide text-faint">
            {t.title}
          </div>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr>
                {t.columns.map((c) => (
                  <th key={c.key} className="px-2 py-1 text-[10px] font-medium text-mute">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, i) => (
                <tr key={i} className="border-t border-line/70">
                  {t.columns.map((c) => (
                    <td key={c.key} className={cn('px-2 py-1', c.mono && 'font-mono text-[11px] text-mute')}>
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
        <pre className="overflow-auto rounded-md border border-line bg-app p-2 font-mono text-[11px] leading-5">
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
    <li className="flex gap-2 rounded border border-line bg-elev/50 px-2 py-1.5">
      <span className={cn('h-fit rounded px-1 py-px font-mono text-[9px] uppercase', sev[finding.severity])}>
        {finding.severity}
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-medium">{finding.title}</div>
        <div className="text-[11.5px] text-mute">{finding.detail}</div>
        {finding.remediation && (
          <div className="text-[11px] text-accent">→ {finding.remediation}</div>
        )}
      </div>
    </li>
  )
}
