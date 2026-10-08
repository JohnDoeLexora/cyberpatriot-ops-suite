import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Demo fixtures for read-only audits that used to stop at "Check finished."
 * Each headline is the fixture sentence. Details are the status card.
 */

const STATUS_OPS: Array<{ id: string; headline: string; rules?: boolean }> = [
  { id: 'audit-firewall', headline: 'Firewall is on: default deny incoming, allow outgoing, 4 rules', rules: true },
  { id: 'list-firewall-rules', headline: 'Firewall is on: default deny incoming, allow outgoing, 4 rules', rules: true },
  { id: 'ssh-hardening-audit', headline: 'SSH root login is enabled; password auth is on' },
  { id: 'check-ntp', headline: 'NTP synced via systemd-timesyncd' },
  { id: 'check-auditd', headline: 'auditd is running with 12 rules' },
  { id: 'audit-logging', headline: 'auditd is running; rsyslog is running' },
  { id: 'audit-sysctl', headline: 'Sysctl: forwarding on, syncookies off' },
  { id: 'audit-time-timezone', headline: 'Timezone is Etc/GMT+12; 1 unexpected NTP server' },
  { id: 'audit-ipv6-privacy', headline: 'IPv6 temporary addresses are off' },
  { id: 'audit-mac-enforcement', headline: 'SELinux is permissive; AppArmor has 1 enforcing profile and 3 complain profiles' },
  { id: 'audit-idle-lock', headline: 'Shell idle lock is not set' },
  { id: 'audit-auto-updates', headline: 'Unattended upgrades are off' },
  { id: 'audit-password-policy', headline: 'Password policy from login.defs (no hashes): minimum length 8, maximum age 99999 days.' },
  { id: 'check-password-aging', headline: '3 unlocked accounts have password aging disabled (hashes omitted).' },
  { id: 'audit-pam', headline: 'PAM allows empty passwords in 2 files' },
  { id: 'audit-startup-items', headline: 'Startup items include a suspicious rc.local' },
  { id: 'audit-at-jobs', headline: '1 at job is queued' },
  { id: 'audit-cron', headline: 'Cron contains wget|sh and a /tmp payload.' },
  { id: 'audit-log-persistence', headline: 'Journald storage is volatile and may not persist' },
  { id: 'audit-sudoers', headline: 'NOPASSWD sudoers plant and world-writable sudoers.d.' },
  { id: 'audit-mail-services', headline: 'Mail checks found 2 issues' },
  { id: 'audit-database-bind', headline: 'Database bind checks found 3 issues' },
  { id: 'audit-php-hardening', headline: 'PHP hardening found 3 issues' },
  { id: 'audit-browser-baseline', headline: '3 Firefox baseline settings are weak (cookies not dumped)' },
  { id: 'audit-browser-policy', headline: 'Browser policy has 2 unexpected settings' },
  { id: 'audit-snap-flatpak', headline: '4 suspicious snap or flatpak apps' },
  { id: 'audit-anonymous-ftp', headline: 'Anonymous FTP is on' },
  { id: 'audit-snmp', headline: 'SNMP uses a default community' },
  { id: 'audit-web-server', headline: 'Web server config has 5 issues' },
  { id: 'check-sensitive-file-perms', headline: 'Checked 3 sensitive files; 2 are world-writable' },
  { id: 'find-world-writable', headline: '5 world-writable files under /home, /etc, /opt, /tmp, /var, /usr/local' },
  { id: 'find-suid-sgid', headline: '2 SUID/SGID files.' },
  { id: 'find-media-files', headline: '3 prohibited media files.' },
  { id: 'find-hidden-executables', headline: '3 hidden executables.' },
  { id: 'find-backdoor-binaries', headline: '2 suspicious binaries.' },
  { id: 'hunt-remote-access-tools', headline: '3 remote-access tools and 2 browser extension dirs.' },
  { id: 'hunt-shell-backdoors', headline: '4 shell backdoors in rc or profile files.' },
  { id: 'hunt-sysprep-leftovers', headline: '3 sysprep leftovers.' },
  { id: 'audit-sticky-tmp', headline: '2 temp paths missing sticky bit (1777 expected on /tmp).' },
  { id: 'skim-forensics-readme', headline: '3 README keyword hits. CCS was not contacted.' },
  { id: 'audit-critical-perm-drift', headline: 'Critical permission drift on shadow, sudoers, host key, and SAM ACL.' },
]

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

async function runDemo(page: Page, opId: string): Promise<Locator> {
  const search = page.getByTestId('catalog-search')
  await search.fill(opId)
  const item = page.getByTestId(`catalog-item-${opId}`)
  await expect(item).toBeVisible()
  await item.click()
  await search.fill('')
  const pane = page.locator(`[data-testid="pane"][data-op-id="${opId}"]`)
  await expect(pane).toBeVisible()
  await pane.getByTestId('run-op').click()
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  await dismissToasts(page)
  return pane
}

test('demo status cards show the audit headline and details', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await expect(page.getByTestId('demo-toggle')).toHaveAttribute('aria-checked', 'true')

  for (const op of STATUS_OPS) {
    const pane = await runDemo(page, op.id)
    await expect(pane.getByTestId('result-headline'), op.id).toHaveText(op.headline)
    const details = pane.getByTestId('result-details')
    await expect(details, op.id).toBeVisible()
    await expect(details, op.id).toHaveAttribute('aria-label', 'Check details')
    await expect(details.locator('dt').first(), op.id).toBeVisible()
    await expect(details.locator('dd').first(), op.id).not.toHaveText('')
    if (op.rules) {
      const table = pane.locator('[data-testid="result-table"][data-title="Rules"]')
      await expect(table, op.id).toBeVisible()
      await expect(table.getByRole('columnheader', { name: 'To' })).toBeVisible()
      await expect(table.getByRole('columnheader', { name: 'Action', exact: true })).toBeVisible()
      await expect(table.getByRole('columnheader', { name: 'From' })).toBeVisible()
      await expect(table.getByRole('columnheader', { name: 'Family' })).toBeVisible()
      await expect(table).toContainText('22/tcp')
      await expect(table).toContainText('80/tcp')
      await expect(table).toContainText('ALLOW IN')
      await expect(table).toContainText('v6')
      await expect(details).toContainText('ufw')
      await expect(details).toContainText('active')
      await expect(details).toContainText('deny')
    }
  }
})
