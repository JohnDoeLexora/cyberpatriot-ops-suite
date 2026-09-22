import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('practice Run next completes a step and advances playlist progress', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('mode-label')).toHaveText('practice')
  await expect(page.getByTestId('demo-toggle')).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'linux-starter')
  await expect(page.getByTestId('playlist-progress')).toHaveText(/^0\/\d+$/)

  const next = page.getByTestId('playlist-run-next')
  await expect(next).toHaveText('Run next')
  await next.click()

  const first = page.locator('[data-testid="pane"][data-op-id="skim-forensics-readme"]')
  await expect(first.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 15_000 })
  await expect(page.getByTestId('playlist-step-skim-forensics-readme')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('playlist-step-list-users')).toHaveAttribute('data-status', 'idle')
  await expect(page.getByTestId('playlist-progress')).toHaveText(/^1\/\d+$/)
  await expect(page.getByTestId('confirm-dialog')).toHaveCount(0)

  await expect(next).toBeEnabled()
  await expect(next).toHaveText('Run next')
  await next.click()

  const second = page.locator('[data-testid="pane"][data-op-id="list-users"]')
  await expect(second.getByTestId('run-status')).toHaveAttribute('data-status', 'done', { timeout: 15_000 })
  await expect(page.getByTestId('playlist-step-list-users')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('playlist-progress')).toHaveText(/^2\/\d+$/)
  await expect(page.getByTestId('mode-label')).toHaveText('practice')
})

test('practice Run all finishes the starter playlist, including changes steps, without hanging', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await expect(page.getByTestId('mode-label')).toHaveText('practice')
  await expect(page.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'linux-starter')

  const progress = page.getByTestId('playlist-progress')
  const initial = await progress.innerText()
  const total = Number(initial.split('/')[1])
  expect(total).toBeGreaterThanOrEqual(6)

  // Practice mutations are simulated. A confirm dialog here would stall Run all.
  await page.addLocatorHandler(page.getByTestId('confirm-dialog'), async () => {
    const text = await page.getByTestId('confirm-dialog').innerText().catch(() => '')
    throw new Error(`Practice Run all opened a confirm dialog:\n${text}`)
  })

  await page.getByTestId('playlist-run-all').click()
  await expect(page.getByTestId('playlist-run-next')).toHaveText('Running…')
  await expect(progress).toHaveText(`${total}/${total}`, { timeout: 60_000 })

  for (const opId of ['disable-guest-account', 'enable-firewall', 'apply-default-deny-inbound']) {
    await expect(page.getByTestId(`playlist-step-${opId}`)).toHaveAttribute('data-status', 'done')
    await expect(page.getByTestId(`playlist-step-${opId}`)).toContainText(/changes/i)
  }

  await expect(page.getByTestId('playlist-run-next')).toHaveText('Done')
  await expect(page.getByTestId('playlist-run-next')).toBeDisabled()
  await expect(page.getByTestId('playlist-run-all')).toBeDisabled()
  await expect(page.getByTestId('confirm-dialog')).toHaveCount(0)
  await expect(page.locator('[data-testid="pane"]').last()).toHaveAttribute('data-op-id', 'scoreboard-preflight')
  await expect(page.getByTestId('mode-label')).toHaveText('practice')
})

test('switching to This computer asks before a changes op and does not apply on cancel', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('mode-label')).toHaveText('practice')

  const step = page.getByTestId('playlist-step-enable-firewall')
  await expect(step).toContainText(/changes/i)
  await step.getByRole('button').first().click()

  const pane = page.locator('[data-testid="pane"][data-op-id="enable-firewall"]')
  await expect(pane).toBeVisible()
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', 'idle')

  await page.getByTestId('demo-toggle').click()
  await expect(page.getByTestId('demo-toggle')).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('mode-label')).toHaveText('this computer')
  await expect(page.getByTestId('demo-toggle')).toHaveText(/This computer/)
  await expect(pane.getByText('asks first', { exact: true })).toBeVisible()

  await pane.getByTestId('run-op').click()
  const dialog = page.getByTestId('confirm-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/Change this computer/i)
  await expect(dialog).toContainText(/Enable host firewall/i)
  await expect(page.getByTestId('confirm-accept')).toHaveText('Yes, apply')

  // Cancel — never apply a live mutation from this suite.
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(pane.getByTestId('run-status')).toHaveAttribute('data-status', 'idle')
  await expect(pane.getByTestId('op-output')).toHaveCount(0)
  await expect(page.getByTestId('playlist-step-enable-firewall')).toHaveAttribute('data-status', 'idle')
  await expect(page.getByTestId('mode-label')).toHaveText('this computer')
})

test('how-to search still finds a guide from the header', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('howto-open').click()
  await expect(page.getByTestId('howto-drawer')).toBeVisible()

  const search = page.getByTestId('howto-search')
  await expect(search).toBeFocused()
  await search.fill('PermitRootLogin')
  const hit = page.getByTestId('howto-result-ssh-hardening-audit')
  await expect(hit).toBeVisible()
  await hit.click()
  await expect(page.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'ssh-hardening-audit')
  await expect(page.getByTestId('howto-article')).toContainText(/PermitRootLogin/)

  await search.fill('zzzz-not-a-real-guide')
  await expect(page.getByTestId('howto-result-ssh-hardening-audit')).toHaveCount(0)
  await expect(page.getByTestId('howto-drawer')).toContainText(/No guides match/i)

  await page.getByTestId('howto-close').click()
  await expect(page.getByTestId('howto-drawer')).toHaveCount(0)
})
