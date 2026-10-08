import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('opening an op shows what, why, changes, and undo', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('catalog-item-list-users').click()

  const pane = page.locator('[data-testid="pane"][data-op-id="list-users"]')
  const explainer = pane.getByTestId('op-explainer')
  await expect(explainer).toBeVisible()
  await expect(explainer.getByTestId('op-explain-whatItDoes')).toContainText('What it does')
  await expect(explainer.getByTestId('op-explain-whyItScores')).toContainText('Why it scores')
  await expect(explainer.getByTestId('op-explain-whatItChanges')).toContainText('Nothing - read-only audit')
  await expect(explainer.getByTestId('op-explain-howToUndo')).toContainText('Nothing to undo')

  await pane.getByTestId('howto-button').click()
  const article = page.getByTestId('howto-article')
  await expect(article).toHaveAttribute('data-op-id', 'list-users')
  const drawerCard = article.getByTestId('op-explainer')
  await expect(drawerCard.getByTestId('op-explain-whatItDoes')).toBeVisible()
  await expect(drawerCard.getByTestId('op-explain-whyItScores')).toBeVisible()
  await expect(drawerCard.getByTestId('op-explain-whatItChanges')).toContainText('What it changes')
  await expect(drawerCard.getByTestId('op-explain-howToUndo')).toContainText('How to undo')
})
