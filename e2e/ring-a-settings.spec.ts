import { expect, test } from '@playwright/test'

const CHAIN_ID = process.env.NEXT_PUBLIC_VERANA_CHAIN_ID ?? 'vna-devnet-1'
const PREFERENCES_KEY = 'verana.preferences'

test('a guest reaches settings from the header and sees the network card', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('#settings-link')).toBeVisible({ timeout: 15_000 })
  expect(await page.locator('a[href="/settings"]').count()).toBeGreaterThanOrEqual(2)

  await page.locator('#settings-link').click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#settings-network')).toContainText(CHAIN_ID)
  await expect(page.locator('#settings-network')).toContainText(/https?:\/\//)
})

test('switching the locale relabels the console and survives a reload', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15_000 })

  await page.locator('#settings-locale-select').selectOption('es')
  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tablero' }).first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible({ timeout: 15_000 })
  expect(await page.evaluate((key) => window.localStorage.getItem(key), PREFERENCES_KEY)).toBe(
    JSON.stringify({ locale: 'es', theme: 'system' })
  )

  await page.locator('#settings-locale-select').selectOption('en')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('the dark theme persists across reloads and the header toggle flips it', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15_000 })

  await page.getByLabel('Dark', { exact: true }).check()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByLabel('Dark', { exact: true })).toBeChecked({ timeout: 15_000 })
  expect(await page.evaluate((key) => window.localStorage.getItem(key), PREFERENCES_KEY)).toBe(
    JSON.stringify({ locale: null, theme: 'dark' })
  )

  await page.locator('#theme-toggle').click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByLabel('Light', { exact: true })).toBeChecked()

  await page.locator('#theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByLabel('Dark', { exact: true })).toBeChecked()
})
