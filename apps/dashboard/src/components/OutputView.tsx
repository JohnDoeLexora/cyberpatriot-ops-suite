import type { Finding, OpResult, Severity } from '../catalog/types'
import { summarizeOpResult } from '../lib/adapt-result'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'
import { ResultSummary } from './ResultSummary'
import { RowActions, tableRowActions } from './RowActions'

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

export function OutputView({
  output,
  paneId,
  showSummary = true,
}: {
  output: OpResult
  paneId: string
  showSummary?: boolean
}) {
  const ws = useWorkspace()
  const summary = summarizeOpResult(output)
  const showEngineLine = output.summary.trim() && output.summary.trim() !== summary.headline

  return (
    <div className="max-w-full space-y-3 overflow-x-hidden p-4" data-testid="op-output">
      {showSummary && <ResultSummary output={output} />}
      {output.report && output.report.facts.length > 0 && (
        <dl
          data-testid="result-details"
          aria-label="Check details"
          className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-line bg-elev px-4 py-3 sm:grid-cols-2"
        >
          {output.report.facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-[12.5px] font-medium uppercase tracking-wide text-mute">{fact.label}</dt>
              <dd className="truncate text-[15px] leading-6 text-ink" title={fact.value}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {showEngineLine && (
        <p className="line-clamp-2 text-[14.5px] leading-6 text-mute" title={output.summary}>
          {output.summary}
        </p>
      )}
      {output.findings.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-elev">
          {output.findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </ul>
      )}
      {output.checklist && (
        <div className="overflow-hidden rounded-xl border border-line">
          {output.checklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
              <span
                className={cn(
                  'mt-0.5 w-14 shrink-0 rounded-md text-center text-[11px] font-semibold uppercase',
                  item.status === 'pass' && 'bg-ok-dim text-ok',
                  item.status === 'fail' && 'bg-crit-dim text-crit',
                  item.status === 'warn' && 'bg-warn-dim text-warn',
                  item.status === 'na' && 'bg-sidebar text-mute',
                )}
              >
                {item.status}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14.5px] leading-6" title={item.label}>
                  {item.label}
                </div>
                {item.note && (
                  <div className="truncate text-[13px] leading-5 text-mute" title={item.note}>
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {output.tables?.map((table) => (
        <div
          key={table.title}
          data-testid="result-table"
          data-title={table.title}
          className="max-w-full overflow-hidden rounded-xl border border-line"
        >
          <div className="border-b border-line bg-sidebar px-3 py-2 text-[13px] font-medium text-mute">{table.title}</div>
          <table className="w-full table-fixed text-left text-[14px]">
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 text-[12.5px] font-medium text-mute">
                    {column.label}
                  </th>
                ))}
                <th className="w-[7.75rem] px-2 py-2 text-right text-[12.5px] font-medium text-mute">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => {
                const actions = tableRowActions(table.title, row, ws.demoMode)
                return (
                  <tr key={index} className="group border-t border-line/80" data-testid={`result-row-${index}`}>
                    {table.columns.map((column) => {
                      const value = row[column.key] ?? ''
                      return (
                        <td key={column.key} className="overflow-hidden px-3 py-2 align-middle">
                          <span
                            className={cn('block truncate', column.mono && 'font-mono text-[13px] text-mute')}
                            title={value || undefined}
                          >
                            {value}
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-1 py-1 align-middle">
                      {actions ? (
                        <RowActions paneId={paneId} {...actions} />
                      ) : (
                        <span className="sr-only">No row actions</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
      {(output.logs?.length || (output.meta && Object.keys(output.meta).length > 0)) && (
        <details className="rounded-xl border border-line bg-elev px-3 py-2">
          <summary className="cursor-pointer text-[13.5px] font-medium text-ink">More details</summary>
          {output.meta && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(output.meta).map(([key, value]) => (
                <span
                  key={key}
                  className="max-w-full truncate rounded-md border border-line bg-sidebar px-2 py-0.5 text-[12.5px] text-mute"
                  title={`${key}=${value}`}
                >
                  {key}={value}
                </span>
              ))}
            </div>
          )}
          {output.logs && (
            <pre className="mt-2 overflow-hidden whitespace-pre-wrap break-words font-mono text-[12.5px] leading-5 text-mute">
              {output.logs.map((line, index) => (
                <div key={index}>
                  <span className="text-faint">{line.ts}</span> {line.level} {line.msg}
                </div>
              ))}
            </pre>
          )}
        </details>
      )}
    </div>
  )
}

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <li className="px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase', sev[finding.severity])}>
          {sevLabel[finding.severity]}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium" title={finding.title}>
          {finding.title}
        </span>
      </div>
      {(finding.detail || finding.remediation) && (
        <details className="mt-1.5 pl-1">
          <summary className="cursor-pointer text-[13px] font-medium text-mute">Details</summary>
          {finding.detail && <p className="mt-1 text-[14px] leading-6 text-mute">{finding.detail}</p>}
          {finding.remediation && (
            <p className="mt-1 text-[13.5px] leading-6 text-accent">Next: {finding.remediation}</p>
          )}
        </details>
      )}
    </li>
  )
}
