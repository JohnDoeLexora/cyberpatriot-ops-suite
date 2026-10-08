import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({
  viewport: { width: 1280, height: 800 },
  reducedMotion: 'reduce',
  locale: 'en-US',
  timezoneId: 'UTC',
  colorScheme: 'light',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(page.locator('footer')).toContainText(/engine ready|engine connected/)
}

async function dismissToasts(page: Page) {
  const dismiss = page.getByRole('button', { name: /^Dismiss / })
  while ((await dismiss.count()) > 0) {
    await dismiss.first().click()
  }
}

async function split(page: Page, axis: 'h' | 'v', opId?: string) {
  const pane = opId
    ? page.locator(`[data-testid="pane"][data-op-id="${opId}"]`)
    : page.locator('[data-testid="pane"][data-active="true"]')
  const id = await pane.getAttribute('data-pane-id')
  await page.getByTestId(`split-${axis}-${id}`).click()
}

async function shot(page: Page, name: string, options?: { mask?: Locator[] }) {
  await settle(page)
  // Baselines are linux chromium shots. A Windows runner has no matching
  // *-chromium-win32.png files; the functional asserts above still run.
  if (process.platform === 'win32') return
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    mask: options?.mask,
  })
}

test('empty workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('empty-pane')).toBeVisible()
  await expect(page.getByTestId('empty-top-ops')).toBeVisible()
  await expect(page.getByTestId('focus-badge')).toHaveText('Next op opens here')
  await shot(page, 'empty-workspace.png')
})

test('four panes keep the focus target obvious', async ({ page }) => {
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
  await expect(page.getByTestId('focus-badge')).toHaveCount(1)
  await expect(page.locator('[data-testid="pane"][data-active="true"]')).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('[data-testid="pane"][data-active="true"]')).toHaveAttribute(
    'data-op-id',
    'flag-suspicious-users',
  )
  await shot(page, 'four-panes-focus.png')
})

test('suspicious users lead with a summary', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('catalog-item-flag-suspicious-users').click()
  await page.getByTestId('run-op').click()
  await expect(page.getByTestId('run-status')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('result-headline')).toContainText(/suspicious users found/i)
  await expect(page.getByTestId('result-summary')).toBeVisible()
  await dismissToasts(page)
  await shot(page, 'summary-suspicious-users.png')
})

test('a failed run shows a friendly error card', async ({ page }) => {
  await page.route('**/ops/**/run', (route) => route.abort('failed'))
  await page.goto('/')
  await page.getByTestId('demo-toggle').click()
  await expect(page.getByTestId('mode-label')).toHaveText('this computer')
  await dismissToasts(page)
  await page.getByTestId('catalog-item-list-users').click()
  await page.getByTestId('run-op').click()
  const card = page.getByTestId('error-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText(/What happened/i)
  await expect(card).toContainText(/What to try/i)
  await expect(page.getByTestId('state-idle')).toHaveCount(0)
  await dismissToasts(page)
  await shot(page, 'error-state.png')
})

test('how-to drawer', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('howto-open').click()
  await expect(page.getByTestId('howto-drawer')).toBeVisible()
  await expect(page.getByTestId('howto-search')).toBeFocused()
  await shot(page, 'howto-drawer.png')
})

test('shortcuts cheat sheet', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('empty-pane')).toBeVisible()
  await page.keyboard.press('?')
  await expect(page.getByTestId('shortcuts-modal')).toBeVisible()
  await expect(page.getByTestId('shortcuts-modal')).toContainText('Ctrl+K')
  await shot(page, 'shortcuts-modal.png')
})

test('confirm dialog keeps a dry-run slot', async ({ page }) => {
  const applied: string[] = []
  page.on('request', (req) => {
    if (req.method() !== 'POST' || !req.url().includes('/run')) return
    let body: { confirm?: boolean } | undefined
    try {
      body = req.postDataJSON() as { confirm?: boolean }
    } catch {
      return
    }
    if (body?.confirm === true) applied.push(req.url())
  })
  await page.goto('/')
  await page.getByTestId('demo-toggle').click()
  await expect(page.getByTestId('mode-label')).toHaveText('this computer')
  await dismissToasts(page)
  await page.getByTestId('catalog-item-enable-firewall').click()
  await page.getByTestId('run-op').click()
  const dialog = page.getByTestId('confirm-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/Change this computer/i)
  const preview = page.getByTestId('confirm-dry-run')
  await expect(preview).toBeVisible()
  await expect(preview).not.toHaveText('')
  await expect(preview).toContainText(/Preview:|Skipped:|Will |would change|ufw|firewall/i)
  await expect(page.getByTestId('confirm-accept')).toHaveText('Yes, apply')
  // The preview text depends on whether ufw is installed. Mask that region so the baseline stays stable.
  await shot(page, 'confirm-dialog.png', { mask: [preview] })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(applied).toEqual([])
  await expect(page.getByTestId('run-status')).not.toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('state-idle')).toBeVisible()
})
