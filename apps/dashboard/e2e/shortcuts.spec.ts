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

test('number keys move the catalog target and shortcuts stay out of inputs', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
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

  await page.keyboard.press('1')
  const first = page.getByTestId('pane').nth(0)
  await expect(first).toHaveAttribute('data-active', 'true')
  await expect(first).toHaveAttribute('data-op-id', 'list-users')
  await expect(first).toHaveAttribute('aria-current', 'true')
  await expect(first.getByTestId('focus-badge')).toHaveText('Next op opens here')

  await page.keyboard.press('4')
  const fourth = page.getByTestId('pane').nth(3)
  await expect(fourth).toHaveAttribute('data-active', 'true')
  await expect(fourth).toHaveAttribute('data-op-id', 'flag-suspicious-users')
  await expect(page.getByTestId('focus-badge')).toHaveCount(1)

  await page.keyboard.press('Alt+ArrowLeft')
  await expect(page.getByTestId('pane').nth(2)).toHaveAttribute('data-active', 'true')

  await page.keyboard.press('?')
  const sheet = page.getByTestId('shortcuts-modal')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText(/Search the check list/)
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)

  await page.keyboard.press('h')
  await expect(page.getByTestId('howto-drawer')).toBeVisible()
  await expect(page.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'ssh-hardening-audit')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('howto-drawer')).toHaveCount(0)

  const search = page.getByTestId('catalog-search')
  await search.click()
  await search.fill('')
  await page.keyboard.type('h')
  await expect(page.getByTestId('howto-drawer')).toHaveCount(0)
  await expect(search).toHaveValue('h')
  await page.keyboard.press('?')
  await expect(page.getByTestId('shortcuts-modal')).toHaveCount(0)
  await expect(search).toHaveValue('h?')

  await page.keyboard.press('Escape')
  await page.keyboard.press('Control+k')
  await expect(search).toBeFocused()
  await expect(search).toHaveValue('h?')

  await page.keyboard.press('Escape')
  await page.keyboard.press('1')
  await page.keyboard.press('Enter')
  const users = page.locator('[data-testid="pane"][data-op-id="list-users"]')
  await expect(users.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 15_000 })
  await expect(users.getByTestId('result-headline')).toContainText(/accounts/i)
  await expect(page.getByTestId('pane')).toHaveCount(4)

  const copy = users.getByTestId('row-copy-guest')
  await copy.focus()
  await expect(copy).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('toasts')).toContainText(/Copied guest/i)

  await page.keyboard.press('?')
  await expect(page.getByTestId('shortcuts-modal')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('pane')).toHaveCount(4)
  await expect(page.getByTestId('pane-tabs')).toHaveCount(0)
})
