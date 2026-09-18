import type { OpResult, RunStatus } from '../catalog/types'
import { isMosaicNode, type MosaicNode } from '../layout/tree'
import { DEFAULT_FIREWALL, type FirewallState } from '../mock/engine'
import { SEED_GROUPS, seedUsers, type GroupRecord, type UserRecord } from '../mock/users'
import { uid } from '../lib/id'

export const STORAGE_KEY = 'cp-ops.workspace.v1'

export type PaneState = {
  id: string
  opId: string | null
  status: RunStatus
  output: OpResult | null
  error: string | null
  selectedUserIds: string[]
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
  users: UserRecord[]
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

Use this pane as the team scratchpad. Notes persist in localStorage.
`

export const PREFLIGHT_ITEMS: { id: string; label: string; hint: string }[] = [
  { id: 'readme', label: 'Read README / scoring image notes', hint: 'Authorized users, scored services' },
  { id: 'forensics', label: 'Copy forensic questions into notepad', hint: 'Before you change evidence' },
  { id: 'snapshot', label: 'Integrity snapshot of critical files', hint: 'passwd, shadow, sshd, sudoers' },
  { id: 'firewall', label: 'Firewall on with scored ports only', hint: 'Apply competition-safe profile' },
  { id: 'users', label: 'Unauthorized users disabled/deleted', hint: 'After README check' },
  { id: 'guest', label: 'Guest/default accounts gone', hint: 'guest, games, ftp leftovers' },
  { id: 'ssh', label: 'SSH/root policy tightened', hint: 'PermitRootLogin, passwords' },
  { id: 'insecure', label: 'Telnet/rsh/ftp masked', hint: 'Insecure services op' },
  { id: 'media', label: 'Prohibited media/software removed', hint: 'mp3, games, nmap' },
  { id: 'updates', label: 'Updates checked (read-only first)', hint: 'Then patch if allowed' },
  { id: 'shares', label: 'Shares/NFS audited', hint: 'Guest shares' },
  { id: 'logging', label: 'Logging services running', hint: 'rsyslog / Event Log' },
]

export function emptyPane(id = uid('pane')): PaneState {
  return {
    id,
    opId: null,
    status: 'idle',
    output: null,
    error: null,
    selectedUserIds: [],
  }
}

export function initialWorkspace(): PersistedWorkspace {
  const pane = emptyPane()
  return {
    tree: { type: 'leaf', id: pane.id },
    panes: { [pane.id]: pane },
    focusedId: pane.id,
    demoMode: true,
    favorites: ['users.flag-suspicious', 'users.uid0', 'net.firewall-apply', 'team.preflight'],
    notes: DEFAULT_NOTES,
    users: seedUsers(),
    groups: SEED_GROUPS.map((g) => ({ ...g })),
    firewall: { ...DEFAULT_FIREWALL, rules: [...DEFAULT_FIREWALL.rules] },
    journal: [
      journalEntry('system', 'Workspace initialized (demo mode on). Engines are mocked until cp-02.'),
    ],
    preflight: {},
    mediaExtensions: 'mp3,mp4,avi,wav,mkv,ogg,exe,jar',
  }
}

export function loadWorkspace(): PersistedWorkspace {
  const fallback = initialWorkspace()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspace>
    if (!parsed.tree || !isMosaicNode(parsed.tree) || !parsed.panes) return fallback
    const panes: Record<string, PaneState> = {}
    for (const [id, pane] of Object.entries(parsed.panes)) {
      panes[id] = {
        ...emptyPane(id),
        ...pane,
        status: pane.status === 'running' ? 'idle' : pane.status,
      }
    }
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
      favorites: parsed.favorites ?? fallback.favorites,
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
