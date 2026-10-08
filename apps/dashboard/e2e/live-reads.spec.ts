import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Live reads execute engines/linux/*.sh. Nothing here is applied to the host.
 * Assertions follow the machine: a missing tool is the script's skip line and
 * an error dot; a present tool is that script's real status, rows, or rules.
 * Demo fixtures stay out unless this host actually has those names.
 */

/** Playwright webServer in playwright.config.ts. Not a host service. */
const DEV_SERVER_PORT = 5183

const LINUX_ONLY =
  'Linux live reads execute engines/linux/*.sh through the dashboard API. Non-Linux hosts skip this file; Windows coverage is the windows-smoke workflow.'

type LiveBody = {
  ok: boolean
  mode?: string
  engine?: string
  summary: string
  blocked?: { reason?: string }
  findings?: { title: string }[]
  data?: {
    users?: { name: string; passwordHidden?: boolean }[]
    services?: { name: string }[]
    ports?: { port: number; address?: string; suspicious?: boolean; reason?: string }[]
    files?: { path?: string }[]
    packages?: { name: string }[]
    checklist?: { title: string; detail: string }[]
    policy?: Record<string, string | number | boolean | null>
    report?: { tone?: string; facts?: { label: string; value: string }[] }
    extra?: {
      script?: string
      ufw?: unknown
      iptables?: unknown
      timedatectl?: unknown
      preview?: unknown
      details?: unknown
    }
  }
}

test.beforeEach(() => {
  test.skip(process.platform !== 'linux', LINUX_ONLY)
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

function canRead(path: string): boolean {
  try {
    fs.accessSync(path, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

function splitLines(text: string): string[] {
  if (text === '') return []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

function accountNames(): string[] {
  const out = execFileSync(
    'python3',
    ['-c', 'import json,pwd; print(json.dumps([p.pw_name for p in pwd.getpwall()]))'],
    { encoding: 'utf8' },
  )
  return JSON.parse(out) as string[]
}

function privilegedNames(): string[] {
  const code = [
    'import grp, json, pwd',
    'priv = {"sudo", "wheel", "admin", "root"}',
    'names = []',
    'for p in pwd.getpwall():',
    '    groups = [g.gr_name for g in grp.getgrall() if p.pw_name in g.gr_mem or g.gr_gid == p.pw_gid]',
    '    if p.pw_uid == 0 or any(g.lower() in priv for g in groups):',
    '        names.append(p.pw_name)',
    'print(json.dumps(names))',
  ].join('\n')
  return JSON.parse(execFileSync('python3', ['-c', code], { encoding: 'utf8' })) as string[]
}

function etcGroups(): { name: string; members: string; privileged: boolean }[] {
  const privileged = new Set(['sudo', 'wheel', 'admin', 'root', 'docker'])
  const rows = []
  for (const line of splitLines(fs.readFileSync('/etc/group', 'utf8'))) {
    if (!line.trim() || line.startsWith('#')) continue
    const parts = line.split(':')
    while (parts.length < 4) parts.push('')
    rows.push({
      name: parts[0],
      members: parts[3].split(',').filter(Boolean).join(', '),
      privileged: privileged.has(parts[0].toLowerCase()),
    })
  }
  return rows
}

function loginPolicy(): Record<string, string> {
  const policy: Record<string, string> = {}
  for (const line of splitLines(fs.readFileSync('/etc/login.defs', 'utf8'))) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = /^(PASS_[A-Z_]+)\s+(\S+)/.exec(trimmed)
    if (match) policy[match[1]] = match[2]
  }
  return policy
}

function sshValue(key: string): string {
  if (!canRead('/etc/ssh/sshd_config')) return 'unset'
  const text = fs.readFileSync('/etc/ssh/sshd_config', 'utf8')
  const matches = [...text.matchAll(new RegExp(`^\\s*${key}\\s+(\\S+)`, 'gim'))]
  return matches.length ? matches[matches.length - 1][1] : 'unset'
}

function dpkgLists(name: string): boolean {
  try {
    execFileSync('dpkg-query', ['-W', '-f', '${Package}', name], { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function accountsListed(count: number): string {
  return count === 1 ? '1 account listed' : `${count} accounts listed`
}

function filesHeadline(count: number): string {
  if (count === 0) return 'Nothing found'
  return count === 1 ? '1 file needs a closer look' : `${count} files need a closer look`
}

function extraLines(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value.filter((line): line is string => typeof line === 'string').join('\n')
}

/** Absent: the locked skip line. Present: a real on/off headline. Unreadable: the tool failed. */
function assertFirewallBody(body: LiveBody): 'absent' | 'present' | 'unreadable' {
  if (/Skipped: ufw is not installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: ufw is not installed/)
    expect(body.summary).not.toContain('Firewall inactive')
    return 'absent'
  }
  if (/could not be read|Permission denied|Operation not permitted/i.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).not.toContain('Host firewall is off; demo rules')
    return 'unreadable'
  }
  expect(body.ok).toBe(true)
  expect(body.summary).toMatch(/^Firewall is on|^Firewall is off/)
  expect((body.data?.report?.facts ?? []).length).toBeGreaterThan(0)
  expect(body.summary).not.toContain('Host firewall is off; demo rules')
  expect(body.summary).not.toContain('allow 23/tcp')
  return 'present'
}

function assertServicesBody(body: LiveBody): 'absent' | 'present' {
  if (/Skipped: systemctl is not installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: systemctl is not installed/)
    return 'absent'
  }
  expect(body.ok).toBe(true)
  const services = body.data?.services ?? []
  expect(body.summary).toBe(`${services.length} services.`)
  expect(services.every((service) => service.name.trim().length > 0)).toBe(true)
  expect(body.summary).not.toContain('demo image')
  return 'present'
}

function assertNtpBody(body: LiveBody): 'absent' | 'present' {
  if (/Skipped: timedatectl is not installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: timedatectl is not installed/)
    return 'absent'
  }
  expect(body.ok).toBe(true)
  expect(body.summary).toMatch(/^NTP /)
  expect((body.data?.report?.facts ?? []).length).toBeGreaterThan(0)
  const timed = extraLines(body.data?.extra?.timedatectl)
  expect(timed).toMatch(/Time zone|Local time|Universal time|System clock|NTP service/)
  expect(body.summary).not.toContain('10.0.0.1')
  return 'present'
}

function assertPortsBody(body: LiveBody): 'absent' | 'present' {
  if (/Skipped: could not list listeners/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: could not list listeners/)
    return 'absent'
  }
  expect(body.ok).toBe(true)
  const ports = body.data?.ports ?? []
  expect(body.summary).toBe(`${ports.length} listeners.`)
  expect(
    ports.some((port) => port.port === DEV_SERVER_PORT),
    `expected the dashboard listener on ${DEV_SERVER_PORT}`,
  ).toBe(true)
  for (const port of ports) {
    expect(port.port).toBeGreaterThan(0)
    expect(port.port).toBeLessThan(65536)
    if (port.port === 31337) expect(port.suspicious).toBe(true)
  }
  return 'present'
}

function assertPackagesBody(body: LiveBody): 'absent' | 'present' {
  if (/Skipped: dpkg-query is not installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: dpkg-query is not installed/)
    return 'absent'
  }
  expect(body.ok).toBe(true)
  const packages = body.data?.packages ?? []
  expect(packages.length).toBeGreaterThan(0)
  expect(body.summary).toBe(`${packages.length} packages.`)
  expect(packages.every((pkg) => pkg.name.trim().length > 0)).toBe(true)
  if (dpkgLists('bash')) expect(packages.map((pkg) => pkg.name)).toContain('bash')
  return 'present'
}

function assertFirewallRulesBody(body: LiveBody): void {
  if (/Skipped: neither ufw nor iptables is installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    expect(body.summary).toMatch(/Skipped: neither ufw nor iptables is installed/)
    return
  }
  if (/could not be read|Permission denied|Operation not permitted/i.test(body.summary)) {
    expect(body.ok).toBe(false)
    return
  }
  expect(body.ok).toBe(true)
  expect(body.summary).toMatch(/^Firewall is on|^Firewall is off/)
  expect((body.data?.report?.facts ?? []).length).toBeGreaterThan(0)
  expect(body.summary).not.toContain('allow 23/tcp')
}

function assertFirewallDryRun(body: LiveBody): void {
  expect(body.blocked).toBeUndefined()
  const extra = body.data?.extra ?? {}
  const blob = `${body.summary}\n${extraLines(extra.preview)}\n${extraLines(extra.details)}`
  expect(blob).toMatch(/Skipped: ufw is not installed|Will enable ufw|ufw is already enabled/)
  if (/Skipped: ufw is not installed/.test(body.summary)) {
    expect(body.ok).toBe(false)
    return
  }
  expect(body.ok).toBe(true)
  expect(body.summary).toMatch(/Preview: would change \d+ settings, \d+ already OK/)
}

async function dismissToasts(page: Page) {
  const dismiss = page.getByRole('button', { name: /^Dismiss / })
  while ((await dismiss.count()) > 0) {
    await dismiss.first().click()
  }
}

async function useLive(page: Page) {
  await page.goto('/')
  await page.getByTestId('demo-toggle').click()
  await expect(page.getByTestId('mode-label')).toHaveText('this computer')
  await dismissToasts(page)
}

async function columnValues(output: Locator, index: number): Promise<string[]> {
  return output.locator('tbody tr').evaluateAll((rows, column) => {
    return rows.map((row) => {
      const cell = row.querySelectorAll('td')[column]
      const span = cell?.querySelector('span')
      const title = span?.getAttribute('title')
      if (title) return title
      return (span?.textContent ?? '').trim()
    })
  }, index)
}

async function expectSettled(pane: Locator, status: 'done' | 'error') {
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', status)
  await expect(pane.getByTestId('op-output')).toBeVisible()
  await expect(pane.getByTestId('result-headline')).toBeVisible()
  await expect(pane.getByTestId('result-headline')).not.toHaveText('')
  if (status === 'error') await expect(pane.getByTestId('error-card')).toBeVisible()
  else await expect(pane.getByTestId('error-card')).toHaveCount(0)
}

async function runRead(page: Page, opId: string): Promise<{ pane: Locator; body: LiveBody }> {
  // Beginner mode hides advanced checks until the search box has a query.
  const search = page.getByTestId('catalog-search')
  await search.fill(opId)
  const item = page.getByTestId(`catalog-item-${opId}`)
  await expect(item).toBeVisible()
  await item.click()
  await search.fill('')
  const pane = page.locator(`[data-testid="pane"][data-op-id="${opId}"]`)
  await expect(pane).toBeVisible()
  const responsePromise = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().includes(`/ops/${opId}/run`),
    { timeout: 90_000 },
  )
  await pane.getByTestId('run-op').click()
  const response = await responsePromise
  const body = (await response.json()) as LiveBody
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', /^(done|error)$/, { timeout: 90_000 })
  await dismissToasts(page)
  return { pane, body }
}

test('dashboard live reads show this computer, not practice fixtures', async ({ page }) => {
  test.setTimeout(240_000)
  await useLive(page)

  const users = await runRead(page, 'list-users')
  const names = accountNames()
  expect((users.body.data?.users ?? []).map((user) => user.name)).toEqual(names)
  expect(users.body.summary).toBe(`Listed ${names.length} local accounts (hashes omitted).`)
  expect(users.body.data?.users?.every((user) => user.passwordHidden === true)).toBe(true)
  expect(users.body.ok).toBe(true)
  await expectSettled(users.pane, 'done')
  await expect(users.pane.getByTestId('result-headline')).toHaveText(accountsListed(names.length))
  const userOutput = users.pane.getByTestId('op-output')
  expect(await columnValues(userOutput, 0)).toEqual(names)
  await expect(userOutput).toContainText(`Listed ${names.length} local accounts (hashes omitted).`)
  await expect(userOutput).not.toContainText(/\$[156]\$[A-Za-z0-9./]{8,}/)
  for (const demoName of ['hacker123', 'toor', 'zygote']) {
    const row = users.pane.getByTestId(`user-row-${demoName}`)
    if (names.includes(demoName)) await expect(row).toBeVisible()
    else await expect(row).toHaveCount(0)
  }

  const groups = await runRead(page, 'list-groups')
  const groupOutput = groups.pane.getByTestId('op-output')
  if (/Skipped: cannot read/.test(groups.body.summary)) {
    expect(groups.body.ok).toBe(false)
    await expectSettled(groups.pane, 'error')
    await expect(groupOutput).toContainText('Skipped: cannot read')
    await expect(groupOutput).toContainText('/etc/group')
  } else {
    const rows = etcGroups()
    expect(groups.body.ok).toBe(true)
    expect(groups.body.summary).toBe(`${rows.length} groups.`)
    await expectSettled(groups.pane, 'done')
    await expect(groups.pane.getByTestId('result-headline')).toHaveText(`${rows.length} groups.`)
    expect(await columnValues(groupOutput, 0)).toEqual(rows.map((row) => row.name))
    expect(await columnValues(groupOutput, 1)).toEqual(rows.map((row) => row.members))
    expect(await columnValues(groupOutput, 2)).toEqual(rows.map((row) => (row.privileged ? 'privileged' : '')))
  }

  const admins = await runRead(page, 'list-admin-users')
  const adminNames = privilegedNames()
  expect((admins.body.data?.users ?? []).map((user) => user.name)).toEqual(adminNames)
  expect(admins.body.summary).toBe(`${adminNames.length} privileged accounts (hashes omitted).`)
  expect(admins.body.ok).toBe(true)
  await expectSettled(admins.pane, 'done')
  const adminOutput = admins.pane.getByTestId('op-output')
  if (adminNames.length === 0) {
    await expect(admins.pane.getByTestId('result-headline')).toHaveText('Nothing found')
  } else {
    await expect(admins.pane.getByTestId('result-headline')).toHaveText(accountsListed(adminNames.length))
    expect(await columnValues(adminOutput, 0)).toEqual(adminNames)
  }
  await expect(adminOutput).toContainText(`${adminNames.length} privileged accounts (hashes omitted).`)
  await expect(adminOutput).not.toContainText(/\$[156]\$[A-Za-z0-9./]{8,}/)

  const hosts = await runRead(page, 'audit-hosts-file')
  const hostsOutput = hosts.pane.getByTestId('op-output')
  if (!canRead('/etc/hosts')) {
    expect(hosts.body.ok).toBe(false)
    expect(hosts.body.summary).toMatch(/Skipped: cannot read \/etc\/hosts/)
    await expectSettled(hosts.pane, 'error')
    await expect(hostsOutput).toContainText('Skipped: cannot read')
    await expect(hostsOutput).toContainText('/etc/hosts')
  } else {
    const text = fs.readFileSync('/etc/hosts', 'utf8')
    const all = splitLines(text)
    const shown = all.filter((line) => line.trim() && !line.trim().startsWith('#')).slice(0, 12)
    expect(hosts.body.ok).toBe(true)
    expect(hosts.body.summary).toBe(`Read /etc/hosts (${all.length} lines).`)
    await expectSettled(hosts.pane, 'done')
    await expect(hostsOutput).toContainText(`Read /etc/hosts (${all.length} lines).`)
    if (shown.length > 0) {
      await expect(hosts.pane.getByTestId('result-headline')).toContainText(/checks/)
      for (const line of shown) {
        await expect(hostsOutput).toContainText(line.replace(/\s+/g, ' ').trim().slice(0, 80))
      }
    }
    if (!text.includes('windowsupdate.microsoft.com')) {
      await expect(hostsOutput).not.toContainText('windowsupdate.microsoft.com')
    }
  }

  const ssh = await runRead(page, 'ssh-hardening-audit')
  const sshOutput = ssh.pane.getByTestId('op-output')
  const sshPath = '/etc/ssh/sshd_config'
  if (canRead(sshPath)) {
    expect(ssh.body.ok).toBe(true)
    expect(ssh.body.summary).toMatch(/^SSH root login is /)
    expect(ssh.body.summary).toMatch(/password auth is /)
    await expectSettled(ssh.pane, 'done')
  } else if (!fs.existsSync(sshPath)) {
    expect(ssh.body.ok).toBe(true)
    expect(ssh.body.summary).toBe('sshd_config is missing.')
    await expectSettled(ssh.pane, 'done')
  } else {
    expect(ssh.body.ok).toBe(false)
    expect(ssh.body.summary.trim().length).toBeGreaterThan(0)
    await expectSettled(ssh.pane, 'error')
  }
  if (ssh.body.ok) {
    const permit = sshValue('PermitRootLogin')
    expect(ssh.body.data?.checklist?.find((item) => item.title === 'PermitRootLogin')?.detail).toBe(permit)
    await expect(ssh.pane.getByTestId('result-headline')).toHaveText(ssh.body.summary)
    await expect(ssh.pane.getByTestId('result-details')).toBeVisible()
    await expect(sshOutput).toContainText('PermitRootLogin')
    await expect(sshOutput).toContainText(permit)
    await expect(sshOutput).toContainText(ssh.body.summary)
  }

  const sudoers = await runRead(page, 'audit-sudoers')
  expect(sudoers.body.ok).toBe(true)
  expect(sudoers.body.summary).toMatch(
    /^Audited sudoers permissions and NOPASSWD \(no full dump of rules\)\.$|^Audited sudoers modes\. The file was not readable, so NOPASSWD was not checked and the rules were not dumped\.$/,
  )
  await expectSettled(sudoers.pane, 'done')
  const sudoersOutput = sudoers.pane.getByTestId('op-output')
  await expect(sudoersOutput).toContainText(sudoers.body.summary)
  if (fs.existsSync('/etc/sudoers')) await expect(sudoersOutput).toContainText('/etc/sudoers')
  if (!fs.existsSync('/etc/sudoers.d/hack')) await expect(sudoersOutput).not.toContainText('/etc/sudoers.d/hack')

  const files = await runRead(page, 'find-world-writable')
  expect(files.body.ok).toBe(true)
  expect(files.body.summary).toMatch(/world-writable files/)
  expect(files.body.summary).not.toContain('demo image')
  await expectSettled(files.pane, 'done')
  const found = (files.body.data?.files ?? []).map((file) => file.path ?? '').filter(Boolean)
  const filesOutput = files.pane.getByTestId('op-output')
  await expect(files.pane.getByTestId('result-headline')).toContainText(/world-writable files/)
  await expect(files.pane.getByTestId('result-details')).toBeVisible()
  if (found.length > 0) {
    expect(found[0].startsWith('/')).toBe(true)
    await expect(filesOutput).toContainText(found[0])
  } else {
    await expect(filesOutput).toContainText(/No world-writable files under/)
  }
  if (!fs.existsSync('/tmp/suid_bash')) expect(found).not.toContain('/tmp/suid_bash')
  if (!fs.existsSync('/etc/cron.d/hack')) expect(found).not.toContain('/etc/cron.d/hack')
})

test('dashboard live reads cover ports, cron, policy, and real skips', async ({ page }) => {
  test.setTimeout(180_000)
  await useLive(page)

  const fw = await runRead(page, 'audit-firewall')
  const firewallKind = assertFirewallBody(fw.body)
  await expectSettled(fw.pane, firewallKind === 'present' ? 'done' : 'error')
  const firewallOutput = fw.pane.getByTestId('op-output')
  if (firewallKind === 'absent') {
    await expect(firewallOutput).toContainText('Skipped: ufw is not installed')
    await expect(firewallOutput).not.toContainText('Firewall inactive')
  } else if (firewallKind === 'unreadable') {
    await expect(firewallOutput).toContainText(/could not be read|Permission denied|Operation not permitted/)
  } else {
    await expect(fw.pane.getByTestId('result-headline')).toHaveText(fw.body.summary.trim().split('\n')[0])
    await expect(fw.pane.getByTestId('result-details')).toBeVisible()
    await expect(firewallOutput).not.toContainText('Firewall inactive')
    await expect(firewallOutput).not.toContainText('Host firewall is off')
  }

  const ports = await runRead(page, 'audit-listening-ports')
  const portsKind = assertPortsBody(ports.body)
  await expectSettled(ports.pane, portsKind === 'absent' ? 'error' : 'done')
  const portsOutput = ports.pane.getByTestId('op-output')
  if (portsKind === 'absent') {
    await expect(portsOutput).toContainText('Skipped: could not list listeners')
  } else {
    const listed = ports.body.data?.ports ?? []
    const suspicious = listed.filter((port) => port.suspicious)
    if (listed.length === 0) {
      await expect(ports.pane.getByTestId('result-headline')).toHaveText('Nothing found')
      await expect(portsOutput).toContainText('0 listeners.')
    } else if (suspicious.length > 0) {
      const word = suspicious.length === 1 ? 'unexpected port' : 'unexpected ports'
      await expect(ports.pane.getByTestId('result-headline')).toHaveText(`${suspicious.length} ${word} found`)
    } else {
      await expect(ports.pane.getByTestId('result-headline')).toHaveText(`${listed.length} listeners.`)
    }
    if (listed.length > 0) {
      await expect(portsOutput.getByText('Listening ports', { exact: true })).toBeVisible()
      await expect(portsOutput.getByTestId('result-row-0')).toBeVisible()
      const table = portsOutput.locator('table')
      for (const row of listed.filter((port) => port.port === DEV_SERVER_PORT)) {
        await expect(table).toContainText(`${row.address ?? '*'}:${row.port}`)
      }
      const backdoor = listed.find((port) => port.port === 31337)
      if (backdoor) {
        expect(backdoor.suspicious).toBe(true)
        await expect(table).toContainText('31337')
        await expect(table).toContainText('unexpected')
      } else {
        await expect(table).not.toContainText('31337')
      }
    }
  }

  const cron = await runRead(page, 'audit-cron')
  expect(cron.body.ok).toBe(true)
  const cronFiles = (cron.body.data?.files ?? []).map((file) => file.path ?? '').filter(Boolean)
  expect(cron.body.summary).toBe(`${cronFiles.length} cron files.`)
  await expectSettled(cron.pane, 'done')
  const cronOutput = cron.pane.getByTestId('op-output')
  await expect(cron.pane.getByTestId('result-headline')).toHaveText(filesHeadline(cronFiles.length))
  await expect(cronOutput).toContainText(cron.body.summary)
  if (cronFiles[0]) await expect(cronOutput).toContainText(cronFiles[0])
  if (!fs.existsSync('/etc/cron.d/hack')) await expect(cronOutput).not.toContainText('/etc/cron.d/hack')

  const policy = await runRead(page, 'audit-password-policy')
  const policyOutput = policy.pane.getByTestId('op-output')
  if (!canRead('/etc/login.defs')) {
    expect(policy.body.ok).toBe(false)
    expect(policy.body.summary).toMatch(/Skipped: cannot read \/etc\/login\.defs/)
    await expectSettled(policy.pane, 'error')
    await expect(policyOutput).toContainText('Skipped: cannot read')
    await expect(policyOutput).toContainText('login.defs')
  } else {
    expect(policy.body.ok).toBe(true)
    expect(policy.body.summary).toContain('login.defs (no hashes)')
    const minLen = loginPolicy().PASS_MIN_LEN
    if (minLen) expect(policy.body.summary).toContain(minLen)
    expect(policy.body.data?.policy ?? {}).toEqual(loginPolicy())
    await expectSettled(policy.pane, 'done')
    await expect(policy.pane.getByTestId('result-headline')).toHaveText(policy.body.summary)
    await expect(policy.pane.getByTestId('result-details')).toBeVisible()
    await expect(policyOutput).toContainText('login.defs (no hashes)')
    for (const finding of policy.body.findings ?? []) {
      await expect(policyOutput).toContainText(finding.title)
    }
  }

  const services = await runRead(page, 'list-services')
  const servicesKind = assertServicesBody(services.body)
  await expectSettled(services.pane, servicesKind === 'absent' ? 'error' : 'done')
  const servicesOutput = services.pane.getByTestId('op-output')
  if (servicesKind === 'absent') {
    await expect(servicesOutput).toContainText('Skipped: systemctl is not installed')
  } else {
    const listed = services.body.data?.services ?? []
    if (listed.length === 0) {
      await expect(services.pane.getByTestId('result-headline')).toHaveText('Nothing found')
      await expect(servicesOutput).toContainText('0 services.')
    } else {
      await expect(services.pane.getByTestId('result-headline')).toHaveText(services.body.summary)
      await expect(servicesOutput.getByText('Services', { exact: true })).toBeVisible()
      expect(await columnValues(servicesOutput, 0)).toEqual(listed.map((service) => service.name))
    }
  }

  const ntp = await runRead(page, 'check-ntp')
  const ntpKind = assertNtpBody(ntp.body)
  await expectSettled(ntp.pane, ntpKind === 'absent' ? 'error' : 'done')
  const ntpOutput = ntp.pane.getByTestId('op-output')
  if (ntpKind === 'absent') {
    await expect(ntpOutput).toContainText('Skipped: timedatectl is not installed')
    await expect(ntpOutput).not.toContainText('10.0.0.1')
  } else {
    await expect(ntp.pane.getByTestId('result-headline')).toHaveText(ntp.body.summary)
    await expect(ntp.pane.getByTestId('result-details')).toBeVisible()
    await expect(ntpOutput).toContainText(ntp.body.summary)
  }
})

const LIVE_STATUS: Array<[string, RegExp]> = [
  ['audit-sysctl', /^(Sysctl:|Skipped: sysctl)/],
  ['audit-ipv6-privacy', /^IPv6 /],
  ['audit-time-timezone', /^Timezone is /],
  ['audit-mac-enforcement', /SELinux|AppArmor/],
  ['audit-idle-lock', /idle lock/],
  ['audit-auto-updates', /Unattended upgrades/],
  ['audit-pam', /^(PAM |Skipped:)/],
  ['check-auditd', /^(auditd is |Skipped:)/],
  ['audit-logging', /auditd is|rsyslog is|Skipped:/],
  ['audit-startup-items', /units enabled|rc\.local|Startup items/],
  ['audit-at-jobs', /at job|Skipped:/],
  ['audit-log-persistence', /^Journald storage/],
  ['audit-mail-services', /^(Mail |No postfix)/],
  ['audit-database-bind', /^(Database |No MySQL|No remote database)/],
  ['audit-php-hardening', /^PHP |^No PHP /],
  ['audit-browser-baseline', /Firefox /],
  ['audit-browser-policy', /^(Browser |No browser)/],
  ['audit-snap-flatpak', /snap or flatpak/],
  ['audit-anonymous-ftp', /^(Anonymous FTP|No vsftpd)/],
  ['audit-snmp', /^SNMP |^No SNMP /],
  ['audit-web-server', /^(Web server|No Apache)/],
  ['check-sensitive-file-perms', /sensitive files/],
  ['check-password-aging', /password aging|Skipped:/],
]

test('API live status audits report what they checked', async ({ request }) => {
  test.setTimeout(180_000)
  for (const [id, pattern] of LIVE_STATUS) {
    const res = await request.post(`/ops/${id}/run`, {
      data: { mode: 'live', confirm: false },
      timeout: 40_000,
    })
    expect(res.ok(), id).toBeTruthy()
    const body = (await res.json()) as LiveBody
    expect(body.mode, id).toBe('live')
    expect(['linux', 'bend'], id).toContain(body.engine)
    expect(body.summary, id).toMatch(pattern)
    expect(String(body.data?.extra?.script ?? ''), id).toContain(`engines/linux/${id}.sh`)
    const blob = JSON.stringify(body)
    expect(blob, id).not.toMatch(/\$[156]\$[A-Za-z0-9./]{8,}/)
    expect(blob, id).not.toMatch(/psk\s*=\s*\S+/i)
    if (body.ok && !body.summary.startsWith('Skipped:')) {
      expect((body.data?.report?.facts ?? []).length, id).toBeGreaterThan(0)
    }
  }
})

const API_READS = [
  'list-users',
  'flag-suspicious-users',
  'list-groups',
  'list-admin-users',
  'audit-uid-zero',
  'check-user-shells',
  'audit-duplicate-uids',
  'audit-password-policy',
  'audit-pam',
  'audit-sudoers',
  'audit-hosts-file',
  'ssh-hardening-audit',
  'audit-listening-ports',
  'audit-cron',
  'audit-firewall',
  'list-firewall-rules',
  'list-services',
  'check-ntp',
  'check-empty-passwords',
  'audit-home-permissions',
  'list-installed-packages',
  'audit-ftp-telnet',
  'one-click-hardening-checklist',
  'export-evidence-bundle',
  'find-suid-sgid',
  'audit-ipv6-privacy',
  'select-unauthorized-users',
  'score-image-heuristics',
]

test('API live reads execute the engine scripts', async ({ request }) => {
  test.setTimeout(300_000)
  for (const id of API_READS) {
    const res = await request.post(`/ops/${id}/run`, {
      data: { mode: 'live', confirm: false },
      timeout: 90_000,
    })
    expect(res.ok(), id).toBeTruthy()
    const body = (await res.json()) as LiveBody
    expect(body.mode, id).toBe('live')
    expect(['linux', 'bend'], id).toContain(body.engine)
    expect(body.summary.trim().length, id).toBeGreaterThan(0)
    expect(String(body.data?.extra?.script ?? ''), id).toContain(`engines/linux/${id}.sh`)
    const blob = JSON.stringify(body)
    expect(blob, id).not.toMatch(/\$[156]\$[A-Za-z0-9./]{8,}/)
    expect(blob, id).not.toMatch(/psk\s*=\s*\S+/i)
    if (id === 'list-users') {
      const names = (body.data?.users ?? []).map((user) => user.name)
      expect(names).toEqual(accountNames())
      expect(body.data?.users?.every((user) => user.passwordHidden === true)).toBe(true)
    }
    if (id === 'audit-firewall') assertFirewallBody(body)
    if (id === 'list-firewall-rules') assertFirewallRulesBody(body)
    if (id === 'list-services') assertServicesBody(body)
    if (id === 'check-ntp') assertNtpBody(body)
    if (id === 'audit-listening-ports') assertPortsBody(body)
    if (id === 'list-installed-packages') assertPackagesBody(body)
  }
})

test('API live mutations stay on dry-run unless confirm is set', async ({ request }) => {
  const dry = await request.post('/ops/enable-firewall/run', {
    data: { mode: 'live', confirm: false, dryRun: true },
  })
  expect(dry.ok()).toBeTruthy()
  assertFirewallDryRun((await dry.json()) as LiveBody)

  // The name is only a refused parameter. confirm:false blocks the op before the script runs.
  const blocked = await request.post('/ops/disable-user/run', {
    data: { mode: 'live', confirm: false, params: { username: 'hacker123' } },
  })
  const blockedBody = (await blocked.json()) as LiveBody
  expect(blockedBody.ok).toBe(false)
  expect(blockedBody.blocked?.reason ?? '').toMatch(/confirm/)
})
