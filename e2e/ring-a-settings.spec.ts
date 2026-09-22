import { expect, type Locator, type Page, test } from '@playwright/test'

const networkValue = (page: Page, label: string) =>
  page.locator('dt', { hasText: new RegExp(`^${label}$`) }).locator('xpath=following-sibling::dd[1]')

const headerChainId = (page: Page) => page.locator('header .pulse-dot + span')

test.describe('guest mode, browser in English', () => {
  test.use({ locale: 'en-US' })

  test('Settings is reachable from the nav and from the header, and shows the connected network', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60_000 })
    await page.waitForLoadState('domcontentloaded')

    // VFE-PAGE-NAV-1 / NAV-2: last entry of the primary navigation, shown with no wallet.
    const navLinks = page.locator('aside nav a')
    await expect(navLinks.last()).toHaveText('Settings')
    await navLinks.last().click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.locator('h1.page-title')).toHaveText('Settings')

    // VFE-GEN-LAYOUT-2: the gear in the header leads to the same page.
    await page.goto('/dashboard')
    await page.locator('header a[aria-label="Settings"]').click()
    await expect(page).toHaveURL(/\/settings$/)

    // VFE-PAGE-SET-1: chain id and endpoints of the connected network.
    const chainId = (await headerChainId(page).textContent())?.trim()
    expect(chainId).toBeTruthy()
    await expect(networkValue(page, 'Chain id')).toHaveText(chainId as string)
    await expect(networkValue(page, 'RPC endpoint')).toHaveText(/^https?:\/\//)
    await expect(networkValue(page, 'REST endpoint')).toHaveText(/^https?:\/\//)
    await expect(networkValue(page, 'Indexer')).toHaveText(/^https?:\/\//)
  })

  test('the theme choice survives a reload, from the page and from the header toggle', async ({ page }) => {
    await page.goto('/settings', { timeout: 60_000 })
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    await page.getByRole('radio', { name: 'Dark' }).check()
    await expect(html).toHaveClass(/dark/)

    await page.reload()
    await expect(html).toHaveClass(/dark/)
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked()

    await page.locator('header button[aria-label="Switch to light theme"]').click()
    await expect(html).not.toHaveClass(/dark/)
    await page.reload()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('the layout keeps the side navigation at the inline start in a right-to-left direction', async ({ page }) => {
    await page.goto('/settings', { timeout: 60_000 })
    await expect(page.locator('h1.page-title')).toHaveText('Settings')

    const aside = page.locator('aside')
    const main = page.locator('main')
    const left = async (locator: Locator) => (await locator.boundingBox())?.x ?? Number.NaN
    expect(await left(aside)).toBeLessThan(await left(main))

    // VFE-GEN-I18N-3: no supported locale is RTL yet, so force the direction the layout would get.
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
    })
    expect(await left(aside)).toBeGreaterThan(await left(main))
    await expect(page.locator('h1.page-title')).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('guest mode, browser in Spanish', () => {
  test.use({ locale: 'es-ES' })

  test('the locale follows the browser, then the choice made in Settings, and survives a reload', async ({ page }) => {
    // VFE-GEN-I18N-2: nothing stored, so the browser locale (es-ES) resolves to the es dictionary.
    await page.goto('/settings', { timeout: 60_000 })
    await expect(page.locator('h1.page-title')).toHaveText('Configuración')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('aside nav a').last()).toHaveText('Configuración')

    await page.locator('#settings-locale').selectOption('en')
    await expect(page.locator('h1.page-title')).toHaveText('Settings')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // The stored choice wins over the browser locale after a reload.
    await page.reload()
    await expect(page.locator('h1.page-title')).toHaveText('Settings')
    await expect(page.locator('#settings-locale')).toHaveValue('en')
    await expect(page.locator('aside nav a').last()).toHaveText('Settings')
  })
})
