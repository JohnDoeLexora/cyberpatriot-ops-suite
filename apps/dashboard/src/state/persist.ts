import type { OpResult, RunStatus } from '../catalog/types'
import { migrateOpId } from '../catalog/ops'
import { isMosaicNode, type MosaicNode } from '../layout/tree'
import { SEED_GROUPS, seedUsers, type GroupRecord, type UiUser } from '../lib/users'
import { uid } from '../lib/id'

export const STORAGE_KEY = 'cp-ops.workspace.v2'

export type FirewallState = {
  enabled: boolean
  profile: 'unknown' | 'off' | 'on' | 'default-deny'
}

export const DEFAULT_FIREWALL: FirewallState = {
  enabled: false,
  profile: 'off',
}

export type PaneState = {
  id: string
  opId: string | null
  status: RunStatus
  output: OpResult | null
  error: string | null
  selectedUserIds: string[]
  params: Record<string, string>
}

export type JournalKind = 'run' | 'user' | 'layout' | 'system' | 'note'

export type JournalEntry = {
  id: string
  ts: number
  kind: JournalKind
  text: string
}

export function journalEntry(kind: JournalKind, text: string): JournalEntry {
  return { id: uid('j'), ts: Date.now(), kind, text }
}

export type PersistedWorkspace = {
  tree: MosaicNode
  panes: Record<string, PaneState>
  focusedId: string
  demoMode: boolean
  favorites: string[]
  notes: string
  users: UiUser[]
  groups: GroupRecord[]
  firewall: FirewallState
  journal: JournalEntry[]
  preflight: Record<string, boolean>
  mediaExtensions: string
}

export const DEFAULT_NOTES = `# Forensics questions

- Who created the unauthorized users?
- What is the last login source for root?
- Which process is listening on 4444?

Use this pane as the team scratchpad. Notes stay in this browser.
`

export const PREFLIGHT_ITEMS: { id: string; label: string; hint: string }[] = [
  { id: 'readme', label: 'Read the image README', hint: 'Authorized users and scored services' },
  { id: 'forensics', label: 'Copy forensic questions into notes', hint: 'Before you change evidence' },
  { id: 'snapshot', label: 'Export an evidence report', hint: 'Users, ports, checksums' },
  { id: 'firewall', label: 'Turn the firewall on', hint: 'Then allow only scored ports' },
  { id: 'users', label: 'Turn off extra accounts', hint: 'After the README check' },
  { id: 'guest', label: 'Turn off Guest', hint: 'Almost never authorized' },
  { id: 'ssh', label: 'Tighten SSH / root login', hint: 'Check SSH, then apply' },
  { id: 'insecure', label: 'Turn off Telnet and FTP', hint: 'Unless the README requires them' },
  { id: 'media', label: 'Find banned media and software', hint: 'mp3, games, nmap' },
  { id: 'updates', label: 'Check updates first', hint: 'Then install if allowed' },
  { id: 'shares', label: 'Check shared folders', hint: 'Guest shares' },
  { id: 'logging', label: 'Make sure logging is on', hint: 'rsyslog / Event Log' },
]

export function emptyPane(id = uid('pane')): PaneState {
  return {
    id,
    opId: null,
    status: 'idle',
    output: null,
    error: null,
    selectedUserIds: [],
    params: {},
  }
}

export function initialWorkspace(): PersistedWorkspace {
  const pane = emptyPane()
  return {
    tree: { type: 'leaf', id: pane.id },
    panes: { [pane.id]: pane },
    focusedId: pane.id,
    demoMode: true,
    favorites: [
      'flag-suspicious-users',
      'audit-uid-zero',
      'apply-default-deny-inbound',
      'one-click-hardening-checklist',
    ],
    notes: DEFAULT_NOTES,
    users: seedUsers(),
    groups: SEED_GROUPS.map((g) => ({ ...g, members: [...g.members] })),
    firewall: { ...DEFAULT_FIREWALL },
    journal: [journalEntry('system', 'Workspace ready. Practice data is on — nothing on this computer is changed.')],
    preflight: {},
    mediaExtensions: 'mp3,mp4,avi,wav,mkv,ogg',
  }
}

function migratePane(id: string, pane: Partial<PaneState>): PaneState {
  return {
    ...emptyPane(id),
    ...pane,
    id,
    opId: migrateOpId(pane.opId ?? null),
    status: pane.status === 'running' ? 'idle' : (pane.status ?? 'idle'),
    params: pane.params ?? {},
    selectedUserIds: pane.selectedUserIds ?? [],
  }
}

export function loadWorkspace(): PersistedWorkspace {
  const fallback = initialWorkspace()
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('cp-ops.workspace.v1')
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspace>
    if (!parsed.tree || !isMosaicNode(parsed.tree) || !parsed.panes) return fallback
    const panes: Record<string, PaneState> = {}
    for (const [id, pane] of Object.entries(parsed.panes)) {
      panes[id] = migratePane(id, pane)
    }
    const favorites = (parsed.favorites ?? fallback.favorites)
      .map((id) => migrateOpId(id))
      .filter((id): id is string => Boolean(id))
    return {
      ...fallback,
      ...parsed,
      tree: parsed.tree,
      panes,
      focusedId: parsed.focusedId && panes[parsed.focusedId] ? parsed.focusedId : Object.keys(panes)[0],
      demoMode: parsed.demoMode !== false,
      users: parsed.users?.length ? parsed.users : fallback.users,
      groups: parsed.groups?.length ? parsed.groups : fallback.groups,
      firewall: parsed.firewall ?? fallback.firewall,
      journal: parsed.journal ?? [],
      favorites: favorites.length ? favorites : fallback.favorites,
      notes: parsed.notes ?? fallback.notes,
      preflight: parsed.preflight ?? {},
      mediaExtensions: parsed.mediaExtensions ?? fallback.mediaExtensions,
    }
  } catch {
    return fallback
  }
}

export function saveWorkspace(state: PersistedWorkspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota / private mode
  }
}
