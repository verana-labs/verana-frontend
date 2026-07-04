import { expect, type Page } from '@playwright/test'
import { installKeplrMock } from '../mocks/keplrMock'
import { resolveMnemonic } from './mnemonic'

type ConnectOptions = {
  mnemonic?: string
  connectedTimeout?: number
}

export async function connectWallet(page: Page, opts: ConnectOptions = {}) {
  const { connectedTimeout = 20_000 } = opts
  const mnemonic = opts.mnemonic ?? (await resolveMnemonic())

  await installKeplrMock(page, { mnemonic })

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')

  await page
    .getByRole('button', { name: /connect/i })
    .first()
    .click()
  await page.getByText(/keplr/i).first().click()

  await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: connectedTimeout })
}
