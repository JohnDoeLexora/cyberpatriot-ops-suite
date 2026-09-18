import {
  catalog,
  getOp as getCatalogOp,
  listOps,
  type Category,
  type OpDefinition as CatalogOp,
} from '@cyberpatriot/ops-catalog'
import type { OpCategoryId, OpView, UiOp } from './types'

export type CategoryMeta = {
  id: OpCategoryId
  label: string
  hint: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'users', label: 'Accounts', hint: 'Who can log in' },
  { id: 'auth', label: 'Passwords & sign-in', hint: 'Rules, SSH, sudo' },
  { id: 'services', label: 'Services', hint: 'Programs that stay running' },
  { id: 'ports', label: 'Open ports', hint: 'What is listening' },
  { id: 'network', label: 'Network', hint: 'SSH, RDP, hosts file' },
  { id: 'firewall', label: 'Firewall', hint: 'What is allowed in' },
  { id: 'files', label: 'Files & folders', hint: 'Permissions, media, keys' },
  { id: 'packages', label: 'Installed software', hint: 'Packages and banned tools' },
  { id: 'logging', label: 'Logs', hint: 'Whether the computer is recording' },
  { id: 'updates', label: 'Updates', hint: 'Pending security patches' },
  { id: 'scheduled', label: 'Scheduled jobs', hint: 'Cron, at, Task Scheduler' },
  { id: 'kernel', label: 'System', hint: 'Startup items and kernel settings' },
  { id: 'windows', label: 'Windows', hint: 'Defender, AutoPlay, SMBv1' },
  { id: 'evidence', label: 'Reports', hint: 'Checklists and export' },
  { id: 'team', label: 'Team', hint: 'Notes, change log, pins' },
]

const USER_VIEWS = new Set([
  'list-users',
  'flag-suspicious-users',
  'disable-user',
  'lock-user',
  'list-admin-users',
  'audit-uid-zero',
  'check-empty-passwords',
  'audit-never-logged-in',
  'check-user-shells',
  'disable-guest-account',
  'audit-duplicate-uids',
  'expire-user-password',
  'remove-user-from-admins',
])

const RUN_LABELS: Record<string, string> = {
  'list-users': 'Scan users',
  'flag-suspicious-users': 'Scan accounts',
  'disable-user': 'Turn off account',
  'lock-user': 'Lock account',
  'remove-user-from-admins': 'Remove admin rights',
  'list-admin-users': 'List admins',
  'audit-uid-zero': 'Find extra roots',
  'check-empty-passwords': 'Find blank passwords',
  'audit-never-logged-in': 'Find unused accounts',
  'check-user-shells': 'Check shells',
  'list-groups': 'List groups',
  'disable-guest-account': 'Turn off Guest',
  'audit-duplicate-uids': 'Find shared IDs',
  'expire-user-password': 'Expire password',
  'audit-password-policy': 'Check password rules',
  'enforce-password-policy': 'Apply password rules',
  'check-password-aging': 'Check password age',
  'audit-pam': 'Check sign-in rules',
  'enable-account-lockout': 'Turn on lockout',
  'disable-root-ssh': 'Block root SSH',
  'audit-sudoers': 'Check sudo rules',
  'audit-uac': 'Check UAC',
  'list-services': 'List services',
  'flag-risky-services': 'Find risky services',
  'disable-service': 'Turn off service',
  'audit-ftp-telnet': 'Check FTP & Telnet',
  'disable-telnet': 'Turn off Telnet',
  'disable-legacy-r-services': 'Turn off rsh',
  'audit-smb': 'Check file sharing',
  'audit-listening-ports': 'Scan open ports',
  'ssh-hardening-audit': 'Check SSH',
  'harden-sshd': 'Harden SSH',
  'audit-rdp': 'Check Remote Desktop',
  'disable-rdp': 'Turn off Remote Desktop',
  'audit-hosts-file': 'Check hosts file',
  'check-ntp': 'Check clock sync',
  'audit-firewall': 'Check firewall',
  'enable-firewall': 'Turn on firewall',
  'list-firewall-rules': 'List firewall rules',
  'apply-default-deny-inbound': 'Apply safe firewall',
  'find-world-writable': 'Find open files',
  'find-suid-sgid': 'Find special programs',
  'find-media-files': 'Find media files',
  'audit-home-permissions': 'Check home folders',
  'check-sensitive-file-perms': 'Check key files',
  'audit-ssh-authorized-keys': 'Check SSH keys',
  'find-hidden-executables': 'Find hidden programs',
  'list-installed-packages': 'List software',
  'find-prohibited-software': 'Find banned software',
  'remove-package': 'Remove software',
  'audit-logging': 'Check logging',
  'check-auditd': 'Check audit log',
  'check-pending-updates': 'Check updates',
  'apply-security-updates': 'Install updates',
  'audit-cron': 'Check cron jobs',
  'audit-at-jobs': 'Check at jobs',
  'list-scheduled-tasks': 'List scheduled tasks',
  'audit-sysctl': 'Check kernel settings',
  'harden-sysctl': 'Harden kernel',
  'audit-startup-items': 'Check startup items',
  'disable-smbv1': 'Turn off SMBv1',
  'enable-windows-defender': 'Turn on Defender',
  'audit-powershell-logging': 'Check PowerShell logs',
  'disable-autoplay': 'Turn off AutoPlay',
  'check-bitlocker-status': 'Check BitLocker',
  'export-evidence-bundle': 'Export report',
  'one-click-hardening-checklist': 'Run checklist',
  'score-image-heuristics': 'Score remaining work',
  'find-backdoor-binaries': 'Find leftover tools',
  'audit-shared-folders': 'Check shared folders',
}

function viewFor(op: CatalogOp): OpView {
  if (USER_VIEWS.has(op.id)) return 'users'
  if (op.id === 'list-groups') return 'groups'
  if (op.id === 'export-evidence-bundle') return 'export'
  if (op.id === 'one-click-hardening-checklist') return 'preflight'
  return 'standard'
}

function runLabelFor(op: CatalogOp): string {
  if (RUN_LABELS[op.id]) return RUN_LABELS[op.id]
  if (op.risk === 'mutate') return 'Apply'
  if (op.id.startsWith('list-')) return 'List'
  if (op.id.startsWith('find-') || op.id.startsWith('flag-')) return 'Scan'
  if (op.id.startsWith('audit-') || op.id.startsWith('check-')) return 'Check'
  return 'Run'
}

function toUiOp(op: CatalogOp): UiOp {
  return {
    id: op.id,
    title: op.title,
    category: op.category,
    description: op.description,
    keywords: [op.id, op.category, op.demoFixtureHint],
    platform: op.platforms,
    risk: op.risk,
    view: viewFor(op),
    runLabel: runLabelFor(op),
    engine: true,
  }
}

export const LOCAL_OPS: UiOp[] = [
  {
    id: 'local-notes',
    title: 'Team notes',
    category: 'team',
    description: 'Scratchpad for forensics questions. Saved in this browser.',
    keywords: ['notes', 'forensics', 'readme', 'questions'],
    platform: 'both',
    risk: 'local',
    view: 'notes',
    runLabel: 'Save snapshot',
    engine: false,
  },
  {
    id: 'local-journal',
    title: 'What we changed',
    category: 'team',
    description: 'A log of every check and change in this session.',
    keywords: ['journal', 'changelog', 'history'],
    platform: 'both',
    risk: 'local',
    view: 'journal',
    runLabel: 'Refresh',
    engine: false,
  },
  {
    id: 'local-pins',
    title: 'Pinned checks',
    category: 'team',
    description: 'The checks you starred for the heat of the round.',
    keywords: ['pin', 'star', 'favorites'],
    platform: 'both',
    risk: 'local',
    view: 'favorites',
    runLabel: 'Refresh',
    engine: false,
  },
]

export const ENGINE_OPS: UiOp[] = catalog.map(toUiOp)
export const OPS: UiOp[] = [...ENGINE_OPS, ...LOCAL_OPS]

export const OPS_BY_ID: Record<string, UiOp> = Object.fromEntries(OPS.map((op) => [op.id, op]))

export function getUiOp(id: string): UiOp | undefined {
  return OPS_BY_ID[id]
}

export function getEngineOp(id: string): CatalogOp | undefined {
  return getCatalogOp(id)
}

export function filterOps(query: string, ops: UiOp[] = OPS): UiOp[] {
  const q = query.trim().toLowerCase()
  if (!q) return ops
  const fromCatalog = new Set(listOps({ query: q }).map((op) => op.id))
  return ops.filter((op) => {
    if (fromCatalog.has(op.id)) return true
    if (op.id.toLowerCase().includes(q)) return true
    if (op.title.toLowerCase().includes(q)) return true
    if (op.description.toLowerCase().includes(q)) return true
    if (op.category.toLowerCase().includes(q)) return true
    return op.keywords.some((k) => k.toLowerCase().includes(q))
  })
}

/** Map the old cp-01 dotted ids onto the typed catalog (and local panes). */
export const LEGACY_OP_IDS: Record<string, string> = {
  'users.list': 'list-users',
  'users.flag-suspicious': 'flag-suspicious-users',
  'users.disable': 'disable-user',
  'users.enable': 'lock-user',
  'users.delete': 'disable-user',
  'users.groups': 'list-groups',
  'users.uid0': 'audit-uid-zero',
  'users.guest-audit': 'disable-guest-account',
  'users.password-aging': 'check-password-aging',
  'users.empty-password': 'check-empty-passwords',
  'auth.password-policy': 'audit-password-policy',
  'auth.failed-logins': 'audit-logging',
  'auth.ssh-harden': 'ssh-hardening-audit',
  'auth.sudoers': 'audit-sudoers',
  'auth.sessions': 'list-users',
  'svc.running': 'list-services',
  'svc.insecure': 'flag-risky-services',
  'svc.processes': 'find-backdoor-binaries',
  'svc.startup': 'audit-startup-items',
  'svc.cron': 'audit-cron',
  'net.ports': 'audit-listening-ports',
  'net.firewall-status': 'audit-firewall',
  'net.firewall-apply': 'apply-default-deny-inbound',
  'net.shares': 'audit-shared-folders',
  'net.hosts': 'audit-hosts-file',
  'fs.world-writable': 'find-world-writable',
  'fs.suid': 'find-suid-sgid',
  'fs.sticky': 'find-world-writable',
  'fs.home-perms': 'audit-home-permissions',
  'fs.prohibited-media': 'find-media-files',
  'fs.web-hidden': 'find-hidden-executables',
  'fs.integrity': 'export-evidence-bundle',
  'log.service': 'audit-logging',
  'log.sudo': 'audit-sudoers',
  'log.auth-spike': 'audit-logging',
  'log.notepad': 'local-notes',
  'sw.inventory': 'list-installed-packages',
  'sw.prohibited': 'find-prohibited-software',
  'sw.updates': 'check-pending-updates',
  'sw.remote-access': 'find-backdoor-binaries',
  'win.registry': 'disable-autoplay',
  'win.secpol': 'audit-password-policy',
  'win.iis': 'list-services',
  'win.powershell': 'audit-powershell-logging',
  'linux.pam': 'audit-pam',
  'linux.authorized-keys': 'audit-ssh-authorized-keys',
  'linux.modules': 'audit-sysctl',
  'linux.mac': 'audit-sysctl',
  'team.preflight': 'one-click-hardening-checklist',
  'team.journal': 'local-journal',
  'team.export': 'export-evidence-bundle',
  'team.favorites': 'local-pins',
}

export function migrateOpId(id: string | null | undefined): string | null {
  if (!id) return null
  const mapped = LEGACY_OP_IDS[id] ?? id
  return OPS_BY_ID[mapped] ? mapped : null
}

export function categoryOf(id: Category | 'team'): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
