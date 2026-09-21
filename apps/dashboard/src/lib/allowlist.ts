export const ALLOWLIST_USERS_KEY = 'cp-ops.allowlist.users'
export const ALLOWLIST_ADMINS_KEY = 'cp-ops.allowlist.admins'

export const DEFAULT_USERS_TEXT = `# Authorized human accounts for the example CyberPatriot image.
# One username per line. Comments and blanks are ignored.
# Copy the README user list here before sync-authorized-users / flag-suspicious-users.
# Pair with config/allowed-admins.txt for who should keep sudo/Administrators.
# Heuristics only require interactive/human accounts to appear here;
# well-known service accounts (www-data, sshd, daemon, …) are exempt.
# Do not put passwords in this file.
root
alice
bob
coach
Administrator
`

export const DEFAULT_ADMINS_TEXT = `# Authorized administrators / sudoers for the example CyberPatriot image.
# One username per line. Comments and blanks are ignored.
# Must also appear in allowed-users.txt (or they will be flagged as extra humans).
# sync-authorized-users creates missing names as standard users then adds these
# to sudo/Administrators. It never invents passwords.
# Copy the README authorized-admin list here.
root
alice
Administrator
`

export type AllowlistKind = 'users' | 'admins'

export function parseNameList(text: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const name = line.split(/[:\s]/)[0]?.trim() ?? ''
    if (!name || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

export function formatNameList(kind: AllowlistKind, names: string[]): string {
  const header = kind === 'users' ? DEFAULT_USERS_TEXT.split('\n').filter((l) => l.startsWith('#')).join('\n') : DEFAULT_ADMINS_TEXT.split('\n').filter((l) => l.startsWith('#')).join('\n')
  const body = names.join('\n')
  return `${header}\n${body}${body ? '\n' : ''}`
}

export function defaultAllowlist(kind: AllowlistKind): string {
  return kind === 'users' ? DEFAULT_USERS_TEXT : DEFAULT_ADMINS_TEXT
}

export function storageKey(kind: AllowlistKind): string {
  return kind === 'users' ? ALLOWLIST_USERS_KEY : ALLOWLIST_ADMINS_KEY
}

export function loadAllowlist(kind: AllowlistKind): string {
  try {
    const raw = localStorage.getItem(storageKey(kind))
    if (raw != null && raw.length) return raw
  } catch {
    // private mode
  }
  return defaultAllowlist(kind)
}

export function saveAllowlist(kind: AllowlistKind, text: string) {
  try {
    localStorage.setItem(storageKey(kind), text)
  } catch {
    // quota / private mode
  }
}

export function downloadFilename(kind: AllowlistKind): string {
  return kind === 'users' ? 'allowed-users.txt' : 'allowed-admins.txt'
}

export function downloadText(filename: string, body: string) {
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsText(file)
  })
}
