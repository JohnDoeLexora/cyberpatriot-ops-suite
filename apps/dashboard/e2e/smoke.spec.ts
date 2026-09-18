import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('catalog search, three panes, and mock run', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page.getByTestId('ops-catalog')).toBeVisible()

  const search = page.getByTestId('catalog-search')
  await page.keyboard.press('/')
  await expect(search).toBeFocused()
  await search.fill('firewall')
  await expect(page.getByTestId('catalog-item-net.firewall-apply')).toBeVisible()
  await expect(page.getByTestId('catalog-item-users.list')).toHaveCount(0)

  await search.fill('')
  await page.getByTestId('catalog-item-users.list').click()
  await page.getByTestId('catalog-item-users.flag-suspicious').click()
  await page.getByTestId('catalog-item-net.firewall-apply').click()
  await expect(page.getByTestId('pane')).toHaveCount(3)

  const first = page.getByTestId('pane').first()
  await first.getByTestId('run-op').click()
  await expect(first.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 10_000 })
  await expect(first.getByTestId('op-output')).toBeVisible()

  await first.getByTestId('user-row-guest').hover()
  await first.getByTestId('action-disable-guest').click()
  await expect(page.getByTestId('toasts')).toContainText('Disabled guest')

  await page.screenshot({ path: 'test-results/dashboard-smoke.png', fullPage: true })
})
