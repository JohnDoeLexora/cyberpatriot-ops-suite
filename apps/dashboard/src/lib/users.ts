import {
  DEFAULT_DEMO_ALLOWLIST,
  demoGroups,
  demoUsers,
  scoreUsers,
  type UserRecord as EngineUser,
} from '@cyberpatriot/ops-engine/demo'

export type UserStatus = 'active' | 'disabled' | 'locked' | 'deleted'

export type UiUser = {
  id: string
  name: string
  uid?: number
  gid?: number
  home?: string
  shell?: string
  groups: string[]
  status: UserStatus
  flagged: boolean
  lastLogin: string | null
  createdAt: string
  emptyPassword: boolean
  sudo: boolean
  authorized: boolean
  notes: string
  platform: 'linux' | 'windows'
  suspicionScore?: number
  signals?: string[]
  interactive?: boolean
}

export type GroupRecord = {
  name: string
  members: string[]
  privileged?: boolean
  anomaly?: string
}

const ALLOW = new Set<string>(DEFAULT_DEMO_ALLOWLIST)

export function userKey(platform: string, name: string) {
  return `u_${platform}_${name}`
}

export function toUiUser(u: EngineUser, patch?: Partial<UiUser>): UiUser {
  const status: UserStatus =
    patch?.status ?? (u.locked ? 'locked' : u.enabled === false ? 'disabled' : 'active')
  const sudo = u.groups.some((g) => ['sudo', 'wheel', 'administrators', 'root'].includes(g.toLowerCase()))
  const authorized = ALLOW.has(u.name)
  const notes = (u.signals ?? []).join(', ')
  return {
    id: patch?.id ?? userKey(u.platform, u.name),
    name: u.name,
    uid: u.uid,
    gid: u.gid,
    home: u.home,
    shell: u.shell,
    groups: u.groups,
    status,
    flagged: patch?.flagged ?? (u.suspicionScore ?? 0) >= 10,
    lastLogin: u.lastLogin ?? null,
    createdAt: u.createdAt ?? '',
    emptyPassword: Boolean(u.passwordEmpty),
    sudo: patch?.sudo ?? sudo,
    authorized: patch?.authorized ?? authorized,
    notes: patch?.notes ?? notes,
    platform: u.platform,
    suspicionScore: u.suspicionScore,
    signals: u.signals,
    interactive: u.interactive,
  }
}

export function seedUsers(): UiUser[] {
  const scored = scoreUsers(demoUsers, {
    allowlist: ALLOW,
    now: new Date('2026-09-18T18:00:00.000Z'),
  })
  return scored.map((u) => toUiUser(u))
}

export const SEED_GROUPS: GroupRecord[] = demoGroups.map((g) => ({
  name: g.name,
  members: g.members,
  privileged: g.privileged,
  anomaly: g.privileged && g.members.some((m) => !ALLOW.has(m)) ? 'unexpected member' : undefined,
}))

export function isSuspicious(user: UiUser): boolean {
  if (user.status === 'deleted') return false
  if ((user.suspicionScore ?? 0) >= 10) return true
  if (user.flagged) return true
  if (user.uid === 0 && user.name !== 'root') return true
  if (user.emptyPassword) return true
  return (user.signals ?? []).length > 0 && !user.authorized
}

export function liveUsers(users: UiUser[]): UiUser[] {
  return users.filter((u) => u.status !== 'deleted')
}

export function upsertUsers(prev: UiUser[], incoming: EngineUser[], replace: boolean): UiUser[] {
  const prevById = new Map(prev.map((u) => [u.id, u]))
  const mapped = incoming.map((u) => {
    const id = userKey(u.platform, u.name)
    const old = prevById.get(id)
    return toUiUser(u, old ? { id, flagged: old.flagged, status: old.status } : { id })
  })
  if (replace) return mapped
  const next = new Map(prev.map((u) => [u.id, u]))
  for (const u of mapped) next.set(u.id, u)
  return [...next.values()]
}
