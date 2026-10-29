import { expect, type Page } from '@playwright/test'
import { installKeplrMock } from '../mocks/keplrMock'
import { resolveMnemonic } from './mnemonic'

type ConnectOptions = {
  mnemonic?: string
  connectedTimeout?: number
}

export async function hideNextDevIndicator(page: Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = 'nextjs-portal { display: none !important; }'
    const attach = () => document.head.append(style)
    if (document.head) attach()
    else document.addEventListener('DOMContentLoaded', attach, { once: true })
  })
}

export async function connectWallet(page: Page, opts: ConnectOptions = {}) {
  const { connectedTimeout = 20_000 } = opts
  const mnemonic = opts.mnemonic ?? (await resolveMnemonic())

  await hideNextDevIndicator(page)
  const wallet = await installKeplrMock(page, { mnemonic })

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')

  await page
    .getByRole('button', { name: /connect/i })
    .first()
    .click()
  await page.getByText(/keplr/i).first().click()

  await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: connectedTimeout })
  return wallet
}
