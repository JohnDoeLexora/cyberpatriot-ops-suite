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
