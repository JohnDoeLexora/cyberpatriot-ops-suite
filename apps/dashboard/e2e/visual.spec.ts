import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('empty state, user table, and three-pane workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('empty-pane')).toBeVisible()
  await page.screenshot({ path: 'test-results/empty.png' })

  await page.getByTestId('catalog-item-users.list').click()
  await expect(page.getByTestId('user-table')).toBeVisible()
  await page.getByTestId('run-op').click()
  await expect(page.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  await page.screenshot({ path: 'test-results/users.png' })

  await page.getByTestId('catalog-item-auth.ssh-harden').click()
  await page.getByTestId('catalog-item-net.firewall-apply').click()
  await expect(page.getByTestId('pane')).toHaveCount(3)
  await page.getByTestId('pane').nth(1).getByTestId('run-op').click()
  await expect(page.getByTestId('pane').nth(1).getByTestId('run-status')).toHaveAttribute(
    'data-status',
    'done',
  )
  await page.screenshot({ path: 'test-results/three-panes.png' })
})
