import type { Finding as EngineFinding, FindingSeverity, RunData, RunResult } from '@cyberpatriot/ops-engine/demo'
import type { ChecklistItem, Finding, OpResult, ResultTable, Severity } from '../catalog/types'

function mapSev(s: FindingSeverity): Severity {
  if (s === 'critical' || s === 'high') return 'crit'
  if (s === 'medium') return 'warn'
  if (s === 'low') return 'info'
  return 'info'
}

function findingOf(f: EngineFinding): Finding {
  return {
    id: f.id,
    severity: mapSev(f.severity),
    title: f.title,
    detail: f.detail ?? '',
    remediation: f.remediationOpId,
  }
}

function tablesFromData(data: RunData): ResultTable[] {
  const tables: ResultTable[] = []
  if (data.users?.length) {
    tables.push({
      title: 'Accounts',
      columns: [
        { key: 'name', label: 'User', mono: true },
        { key: 'uid', label: 'UID', mono: true },
        { key: 'shell', label: 'Shell', mono: true },
        { key: 'home', label: 'Home', mono: true },
        { key: 'state', label: 'State' },
      ],
      rows: data.users.map((u) => ({
        name: u.name,
        uid: u.uid == null ? '' : String(u.uid),
        shell: u.shell ?? '',
        home: u.home ?? '',
        state: u.locked ? 'locked' : u.enabled === false ? 'off' : 'active',
      })),
    })
  }
  if (data.services?.length) {
    tables.push({
      title: 'Services',
      columns: [
        { key: 'name', label: 'Service', mono: true },
        { key: 'state', label: 'State' },
        { key: 'enabled', label: 'Starts on boot' },
        { key: 'note', label: 'Note' },
      ],
      rows: data.services.map((s) => ({
        name: s.name,
        state: s.state,
        enabled: s.enabled ? 'yes' : 'no',
        note: s.risky ? 'risky' : s.required ? 'required' : s.description ?? '',
      })),
    })
  }
  if (data.ports?.length) {
    tables.push({
      title: 'Listening ports',
      columns: [
        { key: 'proto', label: 'Proto' },
        { key: 'local', label: 'Address', mono: true },
        { key: 'proc', label: 'Process', mono: true },
        { key: 'note', label: 'Note' },
      ],
      rows: data.ports.map((p) => ({
        proto: p.protocol,
        local: `${p.address}:${p.port}`,
        proc: p.process ?? '',
        note: p.suspicious ? p.reason ?? 'unexpected' : p.required ? 'expected' : '',
      })),
    })
  }
  if (data.files?.length) {
    tables.push({
      title: 'Files',
      columns: [
        { key: 'path', label: 'Path', mono: true },
        { key: 'mode', label: 'Mode', mono: true },
        { key: 'note', label: 'Note' },
      ],
      rows: data.files.map((f) => ({
        path: f.path,
        mode: f.mode ?? '',
        note: f.note ?? (f.suid ? 'SUID' : f.worldWritable ? 'world-writable' : ''),
      })),
    })
  }
  if (data.packages?.length) {
    tables.push({
      title: 'Software',
      columns: [
        { key: 'name', label: 'Package', mono: true },
        { key: 'ver', label: 'Version', mono: true },
        { key: 'note', label: 'Note' },
      ],
      rows: data.packages.map((p) => ({
        name: p.name,
        ver: p.version ?? '',
        note: p.prohibited ? 'banned' : '',
      })),
    })
  }
  if (data.groups?.length) {
    tables.push({
      title: 'Groups',
      columns: [
        { key: 'name', label: 'Group', mono: true },
        { key: 'members', label: 'Members' },
        { key: 'note', label: 'Note' },
      ],
      rows: data.groups.map((g) => ({
        name: g.name,
        members: g.members.join(', '),
        note: g.privileged ? 'privileged' : '',
      })),
    })
  }
  if (data.shares?.length) {
    tables.push({
      title: 'Shares',
      columns: [
        { key: 'name', label: 'Share', mono: true },
        { key: 'path', label: 'Path', mono: true },
        { key: 'note', label: 'Note' },
      ],
      rows: data.shares.map((s) => ({
        name: s.name,
        path: s.path ?? '',
        note: [s.guest ? 'guest' : '', s.writable ? 'writable' : ''].filter(Boolean).join(', '),
      })),
    })
  }
  if (data.checksums && Object.keys(data.checksums).length) {
    tables.push({
      title: 'Checksums',
      columns: [
        { key: 'path', label: 'Path', mono: true },
        { key: 'hash', label: 'SHA-256', mono: true },
      ],
      rows: Object.entries(data.checksums).map(([path, hash]) => ({ path, hash })),
    })
  }
  return tables
}

function checklistOf(data: RunData): ChecklistItem[] | undefined {
  if (!data.checklist?.length) return undefined
  return data.checklist.map((c) => ({
    id: c.id,
    label: c.title,
    status: c.status === 'info' ? 'na' : c.status,
    note: c.detail,
  }))
}

export function adaptRunResult(result: RunResult): OpResult {
  return {
    summary: result.summary,
    findings: result.findings.map(findingOf),
    tables: tablesFromData(result.data),
    checklist: checklistOf(result.data),
    meta: {
      mode: result.mode,
      engine: result.engine,
      risk: result.risk,
      ...(result.blocked ? { blocked: result.blocked.reason } : {}),
    },
  }
}

export type SummaryTone = 'clear' | 'watch' | 'urgent' | 'info' | 'empty'

export type SummaryChip = {
  severity: Severity
  label: string
  count: number
}

/** Headline + chips for every op. OutputView renders this above tables. */
export type ResultSummary = {
  headline: string
  tone: SummaryTone
  chips: SummaryChip[]
}

function countPhrase(n: number, singular: string, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`
}

function chipsFromFindings(findings: Finding[]): SummaryChip[] {
  const counts: Record<Severity, number> = { crit: 0, warn: 0, info: 0, ok: 0 }
  for (const finding of findings) counts[finding.severity] += 1
  const chips: SummaryChip[] = []
  if (counts.crit) chips.push({ severity: 'crit', label: counts.crit === 1 ? 'urgent' : 'urgent', count: counts.crit })
  if (counts.warn) chips.push({ severity: 'warn', label: 'watch', count: counts.warn })
  if (counts.info) chips.push({ severity: 'info', label: counts.info === 1 ? 'note' : 'notes', count: counts.info })
  if (counts.ok) chips.push({ severity: 'ok', label: 'ok', count: counts.ok })
  return chips
}

function toneFromFindings(findings: Finding[]): SummaryTone {
  if (findings.some((f) => f.severity === 'crit')) return 'urgent'
  if (findings.some((f) => f.severity === 'warn')) return 'watch'
  if (findings.length) return 'info'
  return 'clear'
}

/**
 * Turn any adapted op result into one sentence a new teammate can read,
 * plus severity chips. Checklist, services, accounts, ports, files, and
 * packages each get a specific headline. Everything else falls back to
 * the finding count.
 */
export function summarizeOpResult(output: OpResult): ResultSummary {
  const findings = output.findings ?? []
  const chips = chipsFromFindings(findings)
  const tables = output.tables ?? []
  const checklist = output.checklist

  if (checklist?.length) {
    const fail = checklist.filter((item) => item.status === 'fail').length
    const warn = checklist.filter((item) => item.status === 'warn').length
    const pass = checklist.filter((item) => item.status === 'pass').length
    if (fail === 0 && warn === 0) {
      return {
        headline: `All ${checklist.length} checks passed`,
        tone: 'clear',
        chips: chips.length ? chips : [{ severity: 'ok', label: 'passed', count: pass || checklist.length }],
      }
    }
    const bad = fail + warn
    return {
      headline: `${bad} of ${checklist.length} checks need attention`,
      tone: fail ? 'urgent' : 'watch',
      chips,
    }
  }

  const services = tables.find((table) => table.title === 'Services')
  if (services) {
    const risky = services.rows.filter((row) => /risky/i.test(row.note ?? '')).length
    if (risky > 0) {
      return {
        headline: `${countPhrase(risky, 'service')} should be disabled`,
        tone: 'watch',
        chips,
      }
    }
  }

  const accounts = tables.find((table) => table.title === 'Accounts')
  if (accounts && findings.length > 0) {
    return {
      headline: `${countPhrase(findings.length, 'suspicious user')} found`,
      tone: toneFromFindings(findings),
      chips,
    }
  }

  const ports = tables.find((table) => table.title === 'Listening ports')
  if (ports) {
    const bad = ports.rows.filter((row) => {
      const note = (row.note ?? '').trim()
      if (!note) return false
      return !/^expected$/i.test(note)
    }).length
    if (bad > 0) {
      return {
        headline: `${countPhrase(bad, 'unexpected port')} found`,
        tone: toneFromFindings(findings) === 'clear' ? 'watch' : toneFromFindings(findings),
        chips,
      }
    }
  }

  const files = tables.find((table) => table.title === 'Files')
  if (files) {
    const bad = files.rows.filter((row) => Boolean(row.note)).length
    if (bad > 0) {
      return {
        headline: bad === 1 ? '1 file needs a closer look' : `${bad} files need a closer look`,
        tone: toneFromFindings(findings) === 'clear' ? 'watch' : toneFromFindings(findings),
        chips,
      }
    }
  }

  const software = tables.find((table) => table.title === 'Software')
  if (software) {
    const banned = software.rows.filter((row) => /banned/i.test(row.note ?? '')).length
    if (banned > 0) {
      return {
        headline: `${countPhrase(banned, 'banned package')} found`,
        tone: 'urgent',
        chips,
      }
    }
  }

  if (findings.length > 0) {
    return {
      headline: `${countPhrase(findings.length, 'finding')} to review`,
      tone: toneFromFindings(findings),
      chips,
    }
  }

  if (accounts) {
    return {
      headline: `${countPhrase(accounts.rows.length, 'account')} listed`,
      tone: accounts.rows.length ? 'info' : 'empty',
      chips: accounts.rows.length ? [{ severity: 'ok', label: 'clear', count: accounts.rows.length }] : [],
    }
  }

  const rowCount = tables.reduce((total, table) => total + table.rows.length, 0)
  if (rowCount === 0) {
    return { headline: 'Nothing found', tone: 'empty', chips: [] }
  }

  return {
    headline: output.summary?.trim() || 'Check finished',
    tone: 'info',
    chips,
  }
}

/** Plain-language error card copy. The raw engine text stays in the details expander. */
export function explainRunError(message: string): { what: string; tryNext: string } {
  const text = message.toLowerCase()
  if (text.includes('failed to fetch') || text.includes('network') || text.includes('abort') || text.includes('econnrefused')) {
    return {
      what: 'The check could not reach the local engine.',
      tryNext: 'Stay on Practice data, or start the app with npm run dev and try the check again.',
    }
  }
  if (text.includes('confirm')) {
    return {
      what: 'This change needs a confirmation before it runs.',
      tryNext: 'Run it again and choose Yes, apply only on an authorized image.',
    }
  }
  if (text.includes('permission') || text.includes('eacces') || text.includes('need root') || text.includes('not permitted')) {
    return {
      what: 'The engine did not have permission to finish this check.',
      tryNext: 'On a competition image, run from an account that is allowed to manage that setting.',
    }
  }
  if (text.includes('timeout') || text.includes('timed out')) {
    return {
      what: 'The check took too long and was stopped.',
      tryNext: 'Run it again. Large scans can take a minute. Cancel if you do not want to wait.',
    }
  }
  return {
    what: 'This check did not finish.',
    tryNext: 'Read the details, then run it again. Practice data never changes this computer.',
  }
}
