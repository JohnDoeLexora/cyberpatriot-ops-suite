export type UserStatus = 'active' | 'disabled' | 'locked' | 'deleted'

export type UserRecord = {
  id: string
  name: string
  uid: number
  gid: number
  home: string
  shell: string
  groups: string[]
  status: UserStatus
  flagged: boolean
  lastLogin: string | null
  createdAt: string
  neverExpires: boolean
  emptyPassword: boolean
  hashHint: 'yescrypt' | 'sha512' | 'descrypt' | 'empty' | 'locked'
  sudo: boolean
  loggedIn: boolean
  authorized: boolean
  notes: string
}

export type GroupRecord = {
  name: string
  gid: number
  members: string[]
  anomaly?: string
}

export function seedUsers(): UserRecord[] {
  return [
    u('root', 0, 0, '/root', '/bin/bash', ['root'], {
      lastLogin: '12 min ago',
      sudo: true,
      authorized: true,
      notes: 'System root',
    }),
    u('toor', 0, 0, '/home/toor', '/bin/bash', ['root'], {
      lastLogin: null,
      sudo: true,
      authorized: false,
      notes: 'UID 0 alias — not authorized',
      hashHint: 'descrypt',
    }),
    u('cpadmin', 1000, 1000, '/home/cpadmin', '/bin/bash', ['cpadmin', 'sudo', 'adm'], {
      lastLogin: '8 min ago',
      sudo: true,
      authorized: true,
      loggedIn: true,
      notes: 'Team admin',
    }),
    u('alice', 1001, 1001, '/home/alice', '/bin/bash', ['alice', 'users'], {
      lastLogin: '1 hr ago',
      authorized: true,
      notes: 'Authorized user',
    }),
    u('john', 1002, 1002, '/home/john', '/bin/bash', ['john', 'users', 'sudo'], {
      lastLogin: '3 hr ago',
      authorized: true,
      sudo: true,
      notes: 'Authorized; unexpected sudo — verify README',
    }),
    u('guest', 1003, 1003, '/home/guest', '/bin/bash', ['guest'], {
      lastLogin: null,
      authorized: false,
      emptyPassword: true,
      hashHint: 'empty',
      notes: 'Guest account',
    }),
    u('games', 1004, 1004, '/usr/games', '/bin/sh', ['games'], {
      lastLogin: null,
      authorized: false,
      createdAt: '2 hours ago',
      notes: 'Default/games leftover',
    }),
    u('hacker123', 1337, 1337, '/tmp/l33t', '/bin/zsh', ['hacker123'], {
      lastLogin: null,
      authorized: false,
      createdAt: '41 min ago',
      notes: 'Nonstandard home + recent create',
      hashHint: 'descrypt',
    }),
    u('ftp', 14, 50, '/var/ftp', '/usr/sbin/nologin', ['ftp'], {
      lastLogin: null,
      authorized: false,
      notes: 'Service/default ftp',
      hashHint: 'locked',
      status: 'locked',
    }),
    u('ubuntu', 1005, 1005, '/home/ubuntu', '/bin/bash', ['ubuntu', 'sudo', 'adm'], {
      lastLogin: '2 days ago',
      authorized: false,
      sudo: true,
      notes: 'Cloud leftover with sudo',
    }),
    u('backup', 1006, 1006, '/home/backup', '/bin/bash', ['backup'], {
      lastLogin: null,
      authorized: false,
      neverExpires: true,
      notes: 'Never logged in; password never expires',
    }),
    u('www-data', 33, 33, '/var/www', '/usr/sbin/nologin', ['www-data'], {
      lastLogin: null,
      authorized: true,
      hashHint: 'locked',
      notes: 'Service account',
    }),
    u('mysql', 27, 27, '/nonexistent', '/bin/false', ['mysql'], {
      lastLogin: null,
      authorized: true,
      hashHint: 'locked',
      notes: 'Service account',
    }),
    u('student1', 1007, 1007, '/home/student1', '/bin/bash', ['student1', 'users'], {
      lastLogin: '26 min ago',
      authorized: true,
      loggedIn: true,
      notes: 'Authorized student',
    }),
    u('admin', 1008, 1008, '/home/admin', '/bin/bash', ['admin', 'sudo'], {
      lastLogin: '5 days ago',
      authorized: false,
      sudo: true,
      neverExpires: true,
      notes: 'Unauthorized admin-named account',
    }),
    u('operator', 1009, 1009, '/home/operator', '/bin/bash', ['operator'], {
      lastLogin: '12 days ago',
      authorized: true,
      status: 'locked',
      hashHint: 'locked',
      notes: 'Authorized but locked — verify before unlock',
    }),
    u('testuser', 1010, 1010, '/home/testuser', '/bin/bash', ['testuser'], {
      lastLogin: null,
      authorized: false,
      createdAt: '18 min ago',
      emptyPassword: true,
      hashHint: 'empty',
      notes: 'Recently created test account',
    }),
    u('nobody', 65534, 65534, '/nonexistent', '/usr/sbin/nologin', ['nogroup'], {
      lastLogin: null,
      authorized: true,
      hashHint: 'locked',
      notes: 'Nobody',
    }),
  ]
}

export const SEED_GROUPS: GroupRecord[] = [
  { name: 'root', gid: 0, members: ['root', 'toor'], anomaly: 'toor is not an authorized root alias' },
  { name: 'sudo', gid: 27, members: ['cpadmin', 'john', 'ubuntu', 'admin'], anomaly: 'john, ubuntu, admin unexpected' },
  { name: 'adm', gid: 4, members: ['cpadmin', 'ubuntu'] },
  { name: 'users', gid: 100, members: ['alice', 'john', 'student1'] },
  { name: 'guest', gid: 1003, members: ['guest'], anomaly: 'guest group should not exist on a hardened image' },
  { name: 'docker', gid: 998, members: ['hacker123'], anomaly: 'unauthorized user in docker' },
  { name: 'www-data', gid: 33, members: ['www-data'] },
]

function u(
  name: string,
  uid: number,
  gid: number,
  home: string,
  shell: string,
  groups: string[],
  extra: Partial<UserRecord>,
): UserRecord {
  return {
    id: `u_${name}`,
    name,
    uid,
    gid,
    home,
    shell,
    groups,
    status: extra.status ?? 'active',
    flagged: extra.flagged ?? false,
    lastLogin: extra.lastLogin ?? null,
    createdAt: extra.createdAt ?? 'image default',
    neverExpires: extra.neverExpires ?? false,
    emptyPassword: extra.emptyPassword ?? false,
    hashHint: extra.hashHint ?? 'yescrypt',
    sudo: extra.sudo ?? false,
    loggedIn: extra.loggedIn ?? false,
    authorized: extra.authorized ?? false,
    notes: extra.notes ?? '',
  }
}

export function isSuspicious(user: UserRecord): boolean {
  if (user.status === 'deleted') return false
  if (['www-data', 'mysql', 'nobody', 'root'].includes(user.name) && user.shell.includes('nologin')) {
    return false
  }
  if (user.uid === 0 && user.name !== 'root') return true
  if (!user.authorized && user.shell.includes('bash')) return true
  if (user.lastLogin === null && interactiveShell(user) && !user.authorized) return true
  if (user.home.startsWith('/tmp') || user.home.includes('l33t')) return true
  if (user.createdAt.includes('min ago') || user.createdAt.includes('hour')) return true
  if (user.emptyPassword) return true
  if (['guest', 'games', 'hacker123', 'toor', 'ftp', 'ubuntu', 'testuser'].includes(user.name)) {
    return true
  }
  return false
}

export function interactiveShell(user: UserRecord): boolean {
  return ['/bin/bash', '/bin/sh', '/bin/zsh', '/bin/fish'].includes(user.shell)
}

export function liveUsers(users: UserRecord[]): UserRecord[] {
  return users.filter((u) => u.status !== 'deleted')
}
