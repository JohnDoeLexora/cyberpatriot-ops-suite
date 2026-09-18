import type { Category, OpDefinition as CatalogOp, Platform, Risk } from '@cyberpatriot/ops-catalog'

export type { CatalogOp, Category, Platform, Risk }

export type OpView =
  | 'standard'
  | 'users'
  | 'groups'
  | 'notes'
  | 'journal'
  | 'export'
  | 'favorites'
  | 'preflight'

export type OpCategoryId = Category | 'team'

export type UiOp = {
  id: string
  title: string
  category: OpCategoryId
  description: string
  keywords: string[]
  platform: Platform
  risk: Risk | 'local'
  view: OpView
  runLabel: string
  /** False for workspace-only panes (notes, journal, pins). */
  engine: boolean
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
