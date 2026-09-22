import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

async function split(page: Page, axis: 'h' | 'v', opId?: string) {
  const pane = opId
    ? page.locator(`[data-testid="pane"][data-op-id="${opId}"]`)
    : page.locator('[data-testid="pane"][data-active="true"]')
  const id = await pane.getAttribute('data-pane-id')
  await page.getByTestId(`split-${axis}-${id}`).click()
}

test('catalog search replaces the focused pane, and a split keeps the previous check', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-theme', 'paper')
  await expect(page.getByTestId('ops-catalog')).toBeVisible()

  const search = page.getByTestId('catalog-search')
  await page.keyboard.press('/')
  await expect(search).toBeFocused()
  await search.fill('firewall')
  await expect(page.getByTestId('catalog-item-apply-default-deny-inbound')).toBeVisible()
  await expect(page.getByTestId('catalog-item-list-users')).toHaveCount(0)

  await search.fill('')
  await page.getByTestId('catalog-item-list-users').click()
  await page.getByTestId('catalog-item-flag-suspicious-users').click()
  await expect(page.getByTestId('pane')).toHaveCount(1)
  await expect(page.getByTestId('pane')).toHaveAttribute('data-op-id', 'flag-suspicious-users')
  await split(page, 'h')
  await page.getByTestId('catalog-item-list-users').click()
  await expect(page.getByTestId('pane')).toHaveCount(2)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')

  const usersPane = page.locator('[data-testid="pane"][data-op-id="list-users"]')
  await usersPane.getByTestId('run-op').click()
  await expect(usersPane.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 15_000 })
  await expect(usersPane.getByTestId('op-output')).toBeVisible()
  await expect(usersPane.getByTestId('op-output')).toContainText(/accounts/i)

  await usersPane.getByTestId('howto-button').click()
  await expect(page.getByTestId('howto-drawer')).toBeVisible()
  await expect(page.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'list-users')
  await page.getByTestId('howto-search').fill('PermitRootLogin')
  await expect(page.getByTestId('howto-result-ssh-hardening-audit')).toBeVisible()
  await page.getByTestId('howto-close').click()
  await expect(page.getByTestId('howto-drawer')).toHaveCount(0)

  await usersPane.getByTestId('user-row-guest').hover()
  await usersPane.getByTestId('action-disable-guest').click()
  await expect(page.getByTestId('toasts')).toContainText(/Turned off Guest/i)

  await page.screenshot({ path: 'test-results/dashboard-smoke.png', fullPage: true })
})

test('playlist, beginner mode, and allowlist editor', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-theme', 'paper')
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-beginner', 'true')
  await expect(page.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'linux-starter')
  await expect(page.getByTestId('empty-playlist-linux-starter')).toBeVisible()

  await page.getByTestId('playlist-select').selectOption('forensics-first')
  await expect(page.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'forensics-first')

  await page.getByTestId('playlist-run-next').click()
  const pane = page.locator('[data-testid="pane"][data-op-id="skim-forensics-readme"]')
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 15_000 })
  await expect(page.getByTestId('playlist-step-skim-forensics-readme')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('coach-tip')).toBeVisible()

  await page.getByTestId('playlist-howto-list-users').click()
  await expect(page.getByTestId('howto-drawer')).toBeVisible()
  await expect(page.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'list-users')
  await page.getByTestId('howto-close').click()

  await expect(page.getByTestId('catalog-item-list-users')).toBeVisible()
  await expect(page.getByTestId('catalog-item-audit-iis')).toHaveCount(0)
  await page.getByTestId('show-advanced').click()
  await expect(page.getByTestId('catalog-item-audit-iis')).toBeVisible()

  await page.getByTestId('allowlist-open').click()
  await expect(page.getByTestId('allowlist-editor')).toBeVisible()
  await page.getByTestId('allowlist-users').fill('# README\nalice\nbob\n')
  await page.getByTestId('allowlist-close').click()
  await page.getByTestId('allowlist-open').click()
  await expect(page.getByTestId('allowlist-users')).toHaveValue('# README\nalice\nbob\n')

  await page.screenshot({ path: 'test-results/playlist-beginner.png', fullPage: true })
})

test('playlist run next then run all stays on one pane', async ({ page }) => {
  await page.goto('/')
  const next = page.getByTestId('playlist-run-next')
  await next.click()
  await expect(page.getByTestId('playlist-step-skim-forensics-readme')).toHaveAttribute('data-status', 'done', {
    timeout: 15_000,
  })
  await expect(next).toBeEnabled()
  await next.click()
  await expect(page.getByTestId('playlist-step-list-users')).toHaveAttribute('data-status', 'done', {
    timeout: 15_000,
  })
  await expect(page.getByTestId('playlist-progress')).toHaveText('2/13')
  await expect(page.getByTestId('pane')).toHaveCount(1)
  await expect(page.getByTestId('confirm-dialog')).toHaveCount(0)

  await page.getByTestId('playlist-run-all').click()
  await expect(page.getByTestId('playlist-progress')).toHaveText('13/13', { timeout: 20_000 })
  await expect(page.getByTestId('playlist-step-enable-firewall')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('playlist-step-scoreboard-preflight')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('pane')).toHaveCount(1)
  await expect(page.getByTestId('confirm-dialog')).toHaveCount(0)
  await expect(page.getByTestId('pane')).toHaveAttribute('data-op-id', 'scoreboard-preflight')
})

test('live mutation asks to confirm and cancel leaves the pane idle', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('demo-toggle').click()
  await expect(page.getByTestId('mode-label')).toHaveText(/this computer/i)
  await page.getByTestId('catalog-item-enable-firewall').click()
  await expect(page.getByTestId('pane')).toHaveCount(1)
  await page.getByTestId('run-op').click()
  const dialog = page.getByTestId('confirm-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/Change this computer/i)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  const pane = page.locator('[data-testid="pane"][data-op-id="enable-firewall"]')
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', 'idle')
  await expect(page.getByTestId('pane')).toHaveCount(1)
})

test('a fifth catalog click on a 2×2 does not open a tab', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByTestId('catalog-item-list-users').click()
  await split(page, 'h')
  await page.getByTestId('catalog-item-ssh-hardening-audit').click()
  await split(page, 'v', 'list-users')
  await page.getByTestId('catalog-item-apply-default-deny-inbound').click()
  await split(page, 'v', 'ssh-hardening-audit')
  await page.getByTestId('catalog-item-flag-suspicious-users').click()
  await expect(page.getByTestId('pane')).toHaveCount(4)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-grid', '2x2')
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
  await expect(page.getByTestId('pane-tabs')).toHaveCount(0)

  await page.getByTestId('catalog-item-enable-firewall').click()
  await expect(page.getByTestId('pane')).toHaveCount(4)
  await expect(page.locator('[data-testid="pane"][data-active="true"]')).toHaveAttribute(
    'data-op-id',
    'enable-firewall',
  )
  await expect(page.locator('[data-testid="pane"][data-op-id="list-users"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="pane"][data-op-id="ssh-hardening-audit"]')).toHaveCount(1)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
  await expect(page.getByTestId('pane-tabs')).toHaveCount(0)
})
