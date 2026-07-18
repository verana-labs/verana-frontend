import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'

test('connected navigation and retired links resolve to canonical V4 routes', async ({ page }) => {
  await connectWallet(page)

  await expect(page.locator('a[href="/ecosystems"]').first()).toBeVisible()
  await expect(page.locator('a[href="/digests"]').first()).toBeVisible()
  await expect(page.locator('a[href^="/tr"]')).toHaveCount(0)
  await expect(page.locator('a[href^="/did"]')).toHaveCount(0)

  const redirects = [
    ['/tr', '/ecosystems'],
    ['/tr/1', '/ecosystems/1'],
    ['/tr/cs/1', '/credential-schemas/1'],
  ] as const
  for (const [legacyPath, canonicalPath] of redirects) {
    const response = await page.request.get(legacyPath, { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers().location).toBe(canonicalPath)
  }
})
