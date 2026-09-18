import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('empty state, user table, and three-pane workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('empty-pane')).toBeVisible()
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-theme', 'paper')

  const bg = await page.getByTestId('app-shell').evaluate((el) => getComputedStyle(el).backgroundColor)
  const rgb = bg.match(/\d+/g)?.map(Number) ?? [0, 0, 0]
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  expect(luminance, `expected paper-white surface, got ${bg}`).toBeGreaterThan(0.7)

  await page.screenshot({ path: 'test-results/empty.png' })

  await page.getByTestId('catalog-item-list-users').click()
  await expect(page.getByTestId('user-table')).toBeVisible()
  await page.getByTestId('run-op').click()
  await expect(page.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  await page.screenshot({ path: 'test-results/users.png' })

  await page.getByTestId('catalog-item-ssh-hardening-audit').click()
  await page.getByTestId('catalog-item-apply-default-deny-inbound').click()
  await expect(page.getByTestId('pane')).toHaveCount(3)
  await page.getByTestId('pane').nth(1).getByTestId('run-op').click()
  await expect(page.getByTestId('pane').nth(1).getByTestId('run-status')).toHaveAttribute(
    'data-status',
    'done',
  )
  await page.screenshot({ path: 'test-results/three-panes.png' })
})
