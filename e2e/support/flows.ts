import { expect, type Page } from '@playwright/test'
import { watchChainErrors } from './chain'
import { labelInput } from './forms'

const DEFAULT_DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

export type EcosystemFormOptions = {
  did: string
  docUrl?: string
}

export async function fillEcosystemForm(page: Page, opts: EcosystemFormOptions) {
  const { did, docUrl = DEFAULT_DOC_URL } = opts

  if (new URL(page.url()).pathname !== '/ecosystems') {
    await page.locator('a[href="/ecosystems"]').first().click()
    await expect(page).toHaveURL(/\/ecosystems$/)
  }
  await page
    .getByRole('button', { name: /create ecosystem/i })
    .first()
    .click()
  await expect(page.getByText(/basic information/i)).toBeVisible()

  await page.getByPlaceholder('did:method:identifier').first().fill(did)
  await page.getByPlaceholder(/search languages/i).fill('English')
  await page
    .getByRole('option', { name: /english/i })
    .first()
    .click()
  await labelInput(page, 'Document URL').fill(docUrl)
}

// Broadcasts MsgCreateEcosystem and returns the indexed ID from the canonical redirect.
export async function createEcosystem(page: Page, opts: EcosystemFormOptions): Promise<string> {
  const chainErrors = watchChainErrors(page)
  await fillEcosystemForm(page, opts)
  await page.locator('.btn-action-confirm').click()

  const success = expect
    .poll(() => page.url(), { timeout: 240_000 })
    .toMatch(/\/ecosystems\/\d+(\?|$)/)
    .then(() => 'ok' as const)
  const failure = new Promise<'error'>((resolve) => {
    const timer = setInterval(() => {
      if (chainErrors.error) {
        clearInterval(timer)
        resolve('error')
      }
    }, 250)
  })
  if ((await Promise.race([success, failure])) === 'error') {
    throw new Error(`devnet rejected the create-ecosystem tx: ${chainErrors.error}`)
  }

  await expect(page.getByText(opts.did).first()).toBeVisible()
  const ecosystemId = page.url().match(/\/ecosystems\/(\d+)/)?.[1]
  if (!ecosystemId) throw new Error('no ecosystem id in the redirect URL')
  return ecosystemId
}
