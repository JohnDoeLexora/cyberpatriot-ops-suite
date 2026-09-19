import { expect, test, type Locator } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

function clusterCount(values: number[], slop = 48) {
  const sorted = [...values].sort((a, b) => a - b)
  const clusters: number[] = []
  for (const value of sorted) {
    if (!clusters.some((c) => Math.abs(c - value) < slop)) clusters.push(value)
  }
  return clusters.length
}

async function paneBoxes(panes: Locator) {
  const count = await panes.count()
  const boxes = []
  for (let i = 0; i < count; i++) {
    const box = await panes.nth(i).boundingBox()
    if (box) boxes.push(box)
  }
  return boxes
}

test('empty state, user table, and 2×2 four-pane workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('empty-pane')).toBeVisible()
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-theme', 'paper')

  const bg = await page.getByTestId('app-shell').evaluate((el) => getComputedStyle(el).backgroundColor)
  const rgb = bg.match(/\d+/g)?.map(Number) ?? [0, 0, 0]
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  expect(luminance, `expected warm-white surface, got ${bg}`).toBeGreaterThan(0.85)
  expect(rgb[0] - rgb[2], `expected soft gray-white, not papyrus, got ${bg}`).toBeLessThan(12)

  const rootSize = await page.locator('#root').evaluate((el) => getComputedStyle(el).fontSize)
  expect(Number.parseFloat(rootSize), `expected comfortable type, got ${rootSize}`).toBeGreaterThanOrEqual(15)

  await page.screenshot({ path: 'test-results/empty.png' })

  await page.getByTestId('catalog-item-list-users').click()
  await expect(page.getByTestId('user-table')).toBeVisible()
  await page.getByTestId('run-op').click()
  await expect(page.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  const usersBox = await page.getByTestId('pane').filter({ visible: true }).first().boundingBox()
  expect(usersBox?.width ?? 0).toBeGreaterThan(360)
  expect(usersBox?.height ?? 0).toBeGreaterThan(280)
  await page.screenshot({ path: 'test-results/users.png' })

  await page.getByTestId('catalog-item-ssh-hardening-audit').click()
  await expect(page.getByTestId('pane')).toHaveCount(2)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
  await expect(page.getByTestId('pane-tabs')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/two-up.png' })

  await page.getByTestId('catalog-item-apply-default-deny-inbound').click()
  await expect(page.getByTestId('pane')).toHaveCount(3)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')

  await page.getByTestId('catalog-item-flag-suspicious-users').click()
  await expect(page.getByTestId('pane')).toHaveCount(4)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-grid', '2x2')
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
  await expect(page.getByTestId('pane-tabs')).toHaveCount(0)

  const boxes = await paneBoxes(page.getByTestId('pane'))
  expect(boxes).toHaveLength(4)
  expect(clusterCount(boxes.map((b) => b.x)), 'expected two columns').toBe(2)
  expect(clusterCount(boxes.map((b) => b.y)), 'expected two rows').toBe(2)
  for (const box of boxes) {
    expect(box.width, '2×2 cell too narrow').toBeGreaterThan(280)
    expect(box.height, '2×2 cell too short').toBeGreaterThan(200)
  }

  const sshPane = page.locator('[data-testid="pane"][data-op-id="ssh-hardening-audit"]')
  await sshPane.getByTestId('run-op').click()
  await expect(sshPane.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  await page.screenshot({ path: 'test-results/four-panes.png' })

  await sshPane.getByTestId('howto-button').click()
  await expect(page.getByTestId('howto-drawer')).toBeVisible()
  await expect(page.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'ssh-hardening-audit')
  await page.screenshot({ path: 'test-results/howto.png' })
})

test('narrow mosaic stacks two panes into tabs', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 900 })
  await page.goto('/')
  await page.getByTestId('catalog-item-list-users').click()
  await page.getByTestId('catalog-item-ssh-hardening-audit').click()
  await expect(page.getByTestId('pane')).toHaveCount(2)
  await expect(page.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'tabs')
  await expect(page.getByTestId('pane-tabs')).toBeVisible()
  const visible = page.getByTestId('pane').filter({ visible: true })
  await expect(visible).toHaveCount(1)
  const box = await visible.first().boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(320)
  expect(box?.height ?? 0).toBeGreaterThan(280)
  await page.screenshot({ path: 'test-results/narrow-tabs.png' })
})
