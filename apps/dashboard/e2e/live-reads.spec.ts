import { expect, test, type Page } from '@playwright/test'

/**
 * Real live reads on this Linux image. Demo fixtures include hacker123, toor,
 * and zygote; those names are absent here. Mutating ops are not applied.
 */
const LINUX_ONLY =
  'Linux live reads execute engines/linux/*.sh through the dashboard API. Windows coverage is the windows-smoke workflow.'

test.beforeEach(() => {
  test.skip(process.platform === 'win32', LINUX_ONLY)
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

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

async function runRead(page: Page, opId: string) {
  // Beginner mode hides advanced checks until the search box has a query.
  const search = page.getByTestId('catalog-search')
  await search.fill(opId)
  const item = page.getByTestId(`catalog-item-${opId}`)
  await expect(item).toBeVisible()
  await item.click()
  await search.fill('')
  const pane = page.locator(`[data-testid="pane"][data-op-id="${opId}"]`)
  await expect(pane).toBeVisible()
  await pane.getByTestId('run-op').click()
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', /^(done|error)$/, { timeout: 90_000 })
  await expect(pane.getByTestId('result-headline')).toBeVisible()
  await expect(pane.getByTestId('result-headline')).not.toHaveText('')
  await dismissToasts(page)
  // Account views render the headline beside the output, not inside it.
  return pane
}

test('dashboard live reads show this computer, not practice fixtures', async ({ page }) => {
  test.setTimeout(240_000)
  await useLive(page)

  const users = await runRead(page, 'list-users')
  await expect(users.getByTestId('result-headline')).toContainText(/\d+ accounts listed/)
  await expect(users.locator('span[title="box"]')).toHaveCount(1)
  await expect(users).not.toContainText('hacker123')
  await expect(users).not.toContainText('toor')
  await expect(users).not.toContainText('zygote')

  const groups = await runRead(page, 'list-groups')
  await expect(groups.getByTestId('result-headline')).toContainText(/groups/i)
  await expect(groups.locator('span[title="sudo"]')).toHaveCount(1)

  const admins = await runRead(page, 'list-admin-users')
  await expect(admins.getByTestId('result-headline')).toContainText(/account|suspicious|Nothing found|privileged/i)
  await expect(admins).not.toContainText('hacker123')

  const hosts = await runRead(page, 'audit-hosts-file')
  await expect(hosts.getByTestId('result-headline')).toContainText(/checks/)
  await expect(hosts).toContainText('127.0.0.1')
  await expect(hosts).toContainText('localhost')

  const ssh = await runRead(page, 'ssh-hardening-audit')
  await expect(ssh.getByTestId('result-headline')).toContainText(/checks/)
  await expect(ssh).toContainText(/sshd_config|PermitRootLogin/)

  const sudoers = await runRead(page, 'audit-sudoers')
  await expect(sudoers).toContainText(/sudoers/)
  await expect(sudoers).not.toContainText('hacker123')

  const files = await runRead(page, 'find-world-writable')
  await expect(files.getByTestId('result-headline')).toContainText(/file|Nothing found|finding/i)
  await expect(files).toContainText(/world-writable|files|\/etc|\/tmp|\/usr|\/var|\/home/)
})

test('dashboard live reads cover ports, cron, policy, and real skips', async ({ page }) => {
  test.setTimeout(180_000)
  await useLive(page)

  const fw = await runRead(page, 'audit-firewall')
  await expect(fw).toContainText(/Skipped: ufw is not installed/)
  await expect(fw).not.toContainText('Firewall inactive')
  const fwPane = page.locator('[data-testid="pane"][data-op-id="audit-firewall"]')
  await expect(fwPane.getByTestId('run-status')).toHaveAttribute('data-status', 'error')

  const ports = await runRead(page, 'audit-listening-ports')
  await expect(ports.getByText('Listening ports', { exact: true })).toBeVisible()
  await expect(ports).toContainText(/listeners|unexpected port/)
  await expect(ports.getByTestId('result-row-0')).toBeVisible()
  const portTable = ports.locator('table')
  await expect(portTable).toContainText('5183')
  await expect(portTable).not.toContainText('31337')

  const cron = await runRead(page, 'audit-cron')
  await expect(cron).toContainText(/cron/)

  const policy = await runRead(page, 'audit-password-policy')
  await expect(policy).toContainText(/login\.defs|PASS_/)

  const services = await runRead(page, 'list-services')
  await expect(services).toContainText(/Skipped: systemctl is not installed/)

  const ntp = await runRead(page, 'check-ntp')
  await expect(ntp).toContainText(/Skipped: timedatectl is not installed/)
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
    const body = (await res.json()) as {
      ok: boolean
      mode: string
      engine: string
      summary: string
      data?: { users?: { name: string; passwordHidden?: boolean }[]; extra?: { script?: string } }
    }
    expect(body.mode, id).toBe('live')
    expect(['linux', 'bend'], id).toContain(body.engine)
    expect(body.summary.trim().length, id).toBeGreaterThan(0)
    expect(String(body.data?.extra?.script ?? ''), id).toContain(`engines/linux/${id}.sh`)
    const blob = JSON.stringify(body)
    expect(blob, id).not.toMatch(/\$[156]\$[A-Za-z0-9./]{8,}/)
    expect(blob, id).not.toMatch(/psk\s*=\s*\S+/i)
    if (id === 'list-users') {
      const names = (body.data?.users ?? []).map((user) => user.name)
      expect(names).toContain('box')
      expect(names).not.toContain('hacker123')
      expect(body.data?.users?.every((user) => user.passwordHidden === true)).toBe(true)
    }
    if (id === 'audit-firewall') {
      expect(body.ok).toBe(false)
      expect(body.summary).toMatch(/Skipped: ufw/)
    }
    if (id === 'list-installed-packages') {
      expect(blob).toContain('"name":"bash"')
    }
  }
})

test('API live mutations stay on dry-run unless confirm is set', async ({ request }) => {
  const dry = await request.post('/ops/enable-firewall/run', {
    data: { mode: 'live', confirm: false, dryRun: true },
  })
  expect(dry.ok()).toBeTruthy()
  const dryBody = (await dry.json()) as { blocked?: unknown; summary: string; ok: boolean }
  expect(dryBody.blocked).toBeUndefined()
  expect(dryBody.summary).toMatch(/Skipped: ufw|Preview:|Will enable/)

  const blocked = await request.post('/ops/disable-user/run', {
    data: { mode: 'live', confirm: false, params: { username: 'hacker123' } },
  })
  const blockedBody = (await blocked.json()) as { ok: boolean; blocked?: { reason?: string } }
  expect(blockedBody.ok).toBe(false)
  expect(blockedBody.blocked?.reason ?? '').toMatch(/confirm/)
})
