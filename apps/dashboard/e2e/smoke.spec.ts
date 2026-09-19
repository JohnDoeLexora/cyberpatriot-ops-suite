import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('catalog search, three panes, and wired run', async ({ page }) => {
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
  await page.getByTestId('catalog-item-apply-default-deny-inbound').click()
  await expect(page.getByTestId('pane')).toHaveCount(3)
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
