import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Page, test } from '@playwright/test'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import { ACME_POLICY_ADDRESS } from './support/corp-fixtures'
import { HARNESS_ADDRESS, HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'
import { installMockChain } from './support/mock-chain'

test('the account address copies, shows a local QR dialog and links the explorer', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const qrRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('qrserver')) qrRequests.push(request.url())
  })
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const main = page.getByRole('main')
  await expect(main.getByText(HARNESS_ADDRESS, { exact: true })).toBeVisible({ timeout: 15_000 })

  await main.getByRole('button', { name: 'Copy Address' }).click()
  await expect(main.getByRole('button', { name: 'Copied!' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(HARNESS_ADDRESS)

  await expect(main.getByRole('link', { name: 'Pingpub' })).toHaveAttribute(
    'href',
    new RegExp(`/account/${HARNESS_ADDRESS}$`)
  )

  await main.getByRole('button', { name: 'Address QR Code' }).click()
  const dialog = page.getByRole('dialog', { name: 'Account QR Code' })
  await expect(dialog.getByText(HARNESS_ADDRESS, { exact: true })).toBeVisible()
  await expect(dialog.locator('svg title')).toHaveText('Account QR Code')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(qrRequests).toEqual([])
})

test('send VNA opens prefilled from the corporation header, gates its inputs and broadcasts one MsgSend', async ({
  page,
}) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation')
  await page.getByRole('main').getByRole('link', { name: 'Send VNA' }).click({ timeout: 15_000 })

  const recipient = page.locator('#sendvna-recipient')
  const amount = page.locator('#sendvna-amount')
  const send = page.getByRole('button', { name: 'Send', exact: true })
  await expect(recipient).toHaveValue(ACME_POLICY_ADDRESS, { timeout: 15_000 })
  await expect(send).toBeDisabled()

  await amount.fill('1.1234567')
  await expect(page.getByText('Enter an amount above 0 with at most 6 decimals.')).toBeVisible()
  await expect(send).toBeDisabled()

  await amount.fill('1.5')
  await recipient.fill('cosmos1notverana')
  await expect(page.getByText('Enter a valid verana1 address.')).toBeVisible()
  await expect(send).toBeDisabled()

  await recipient.fill(ACME_POLICY_ADDRESS)
  await send.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(`Send 1.5 VNA to ${ACME_POLICY_ADDRESS}.`)).toBeVisible()
  await expect(dialog.getByText('Amount sent')).toBeVisible()
  await dialog.getByRole('button', { name: 'Confirm' }).click({ timeout: 30_000 })

  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBe(1)
  const { messages } = TxBody.decode(TxRaw.decode(fromBase64(mock.broadcastTxs()[0])).bodyBytes)
  expect(messages.map((message) => message.typeUrl)).toEqual(['/cosmos.bank.v1beta1.MsgSend'])
  expect(MsgSend.decode(messages[0].value)).toEqual({
    fromAddress: wallet.bech32Address,
    toAddress: ACME_POLICY_ADDRESS,
    amount: [{ denom: 'uvna', amount: '1500000' }],
  })
  await expect(recipient).toBeHidden({ timeout: 30_000 })
  await mock.teardown()
})

test('send VNA counts the amount in the balance warning of the confirmation', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, {
    address: wallet.bech32Address,
    stubSri: false,
    stubCorporation: false,
    gasUsed: 1,
    balanceUvna: '500000',
  })

  await page.goto(`/account?send=${ACME_POLICY_ADDRESS}`)
  await page.locator('#sendvna-amount').fill('1', { timeout: 15_000 })
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByRole('dialog').getByText(/does not cover/)).toBeVisible({ timeout: 30_000 })
  await mock.teardown()
})

test('opening a membership switches the acting corporation and lands on the corporation page', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const card = page.locator('div', { has: page.getByRole('heading', { name: 'Corporations' }) }).last()
  const list = card.getByRole('list')
  const acme = list.getByRole('button', { name: /Acme Trust AG/ })
  await expect(acme).toBeVisible({ timeout: 15_000 })
  await expect(list.getByRole('button', { name: /did:web:keplr/ })).toHaveAttribute('aria-current', 'true')
  await expect(acme).toContainText('Operator')
  await expect(acme).toContainText('Member ×3')
  await expect(acme.getByLabel('1 Proposals awaiting your vote')).toBeVisible()
  await expect(page.getByText('Corporations are created and managed on the Corporation page.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('button', { name: /create|new corporation/i })).toHaveCount(0)

  await acme.click()
  await expect(page).toHaveURL(/\/corporation(\?|$)/)
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })

  await page.locator('aside a[href="/account"]').click()
  await expect(
    page
      .getByRole('main')
      .getByRole('list')
      .getByRole('button', { name: /Acme Trust AG/ })
  ).toHaveAttribute('aria-current', 'true', { timeout: 15_000 })
})

test('a failed discovery is not presented as an empty membership list', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await page.route('**/v4/group/corporations-by-member*', (route) =>
    route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const main = page.getByRole('main')
  await expect(main.getByText('Discovery failed, so this list may be incomplete.')).toBeVisible({ timeout: 15_000 })
  await expect(main.getByRole('button', { name: 'Retry discovery' })).toBeVisible()
  await expect(main.getByText('This wallet is not an operator or a member of any corporation yet.')).toBeHidden()
})

const getVNACard = (page: Page) => page.getByRole('button', { name: /get vna tokens/i })

async function unsetFaucetUrl(page: Page) {
  await page.addInitScript(() => {
    let stored: Record<string, string | undefined> | undefined
    Object.defineProperty(window, '__ENV', {
      configurable: true,
      get: () => stored,
      set: (value: Record<string, string | undefined>) => {
        stored = { ...value, NEXT_PUBLIC_VERANA_FAUCET_URL: undefined }
      },
    })
  })
}

test('Ring A, the Get VNA card is shown when the faucet url is set', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(getVNACard(page).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /claim yield/i })).toHaveCount(0)
  await expect(page.getByText(/APY/)).toHaveCount(0)
})

test('Ring A, the Get VNA card is hidden when the faucet url is unset', async ({ page }) => {
  await unsetFaucetUrl(page)
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account?getVNA=true')
  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Main Balance', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(getVNACard(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Account Actions' })).toBeVisible()
  await expect(page.getByText('Send VNA', { exact: true })).toBeVisible()
})
