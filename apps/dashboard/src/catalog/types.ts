export type Platform = 'linux' | 'windows' | 'both'

export type OpView =
  | 'standard'
  | 'users'
  | 'groups'
  | 'notes'
  | 'journal'
  | 'export'
  | 'favorites'
  | 'preflight'

export type OpCategoryId =
  | 'users'
  | 'auth'
  | 'services'
  | 'network'
  | 'files'
  | 'logging'
  | 'software'
  | 'windows'
  | 'linux'
  | 'team'

export type OpDefinition = {
  id: string
  title: string
  category: OpCategoryId
  description: string
  keywords: string[]
  platform: Platform
  view: OpView
  /** Short hint shown in the pane chrome. */
  runLabel: string
}

export type Severity = 'ok' | 'info' | 'warn' | 'crit'

export type Finding = {
  id: string
  severity: Severity
  title: string
  detail: string
  remediation?: string
}

export type ResultTable = {
  title: string
  columns: { key: string; label: string; mono?: boolean }[]
  rows: Record<string, string>[]
}

export type ChecklistItem = {
  id: string
  label: string
  status: 'pass' | 'fail' | 'warn' | 'na'
  note?: string
}

export type LogLine = {
  ts: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUTH'
  msg: string
}

export type OpResult = {
  summary: string
  findings: Finding[]
  tables?: ResultTable[]
  checklist?: ChecklistItem[]
  logs?: LogLine[]
  meta?: Record<string, string>
}

export type RunStatus = 'idle' | 'running' | 'done' | 'error'
