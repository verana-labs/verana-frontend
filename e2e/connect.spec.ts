import { expect, test } from '@playwright/test'
import { installKeplrMock } from './support/keplr-mock'

const SHOT = 'e2e/artifacts'

test('connect injected Keplr and open the create-ecosystem form', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })

  await installKeplrMock(page, { prefix: 'verana' })

  await test.step('load dashboard', async () => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.screenshot({ path: `${SHOT}/01-dashboard.png`, fullPage: true })
  })

  await test.step('open connect modal and pick Keplr', async () => {
    await page
      .getByRole('button', { name: /connect/i })
      .first()
      .click()
    await page.getByText(/keplr/i).first().click()
  })

  await test.step('assert connected', async () => {
    await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('link', { name: /ecosystems/i })).toBeVisible()
    await page.screenshot({ path: `${SHOT}/03-connected.png`, fullPage: true })
  })

  await test.step('open the create-ecosystem form', async () => {
    await page.goto('/tr')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOT}/04-ecosystems.png`, fullPage: true })
    await page
      .getByRole('button', { name: /create ecosystem|add ecosystem|new trust/i })
      .first()
      .click()
    await expect(page.getByText(/create ecosystem/i).first()).toBeVisible()
    await expect(page.getByText(/^DID/i).first()).toBeVisible()
    await page.screenshot({ path: `${SHOT}/05-create-form.png`, fullPage: true })
  })

  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors.slice(0, 25), null, 2))
})
