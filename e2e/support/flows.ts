import { expect, type Page } from '@playwright/test'
import { watchChainErrors } from './chain'
import { labelInput } from './forms'

const DEFAULT_DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

export type EcosystemFormOptions = {
  did: string
  aka?: string
  docUrl?: string
  orgName?: string
  serviceName?: string
}

export async function fillEcosystemForm(page: Page, opts: EcosystemFormOptions) {
  const {
    did,
    aka = `https://${did.split(':').pop()}`,
    docUrl = DEFAULT_DOC_URL,
    orgName = 'E2E Ecosystem',
    serviceName = 'E2E Trust Registry',
  } = opts

  await page.goto('/tr')
  await page
    .getByRole('button', { name: /create ecosystem/i })
    .first()
    .click()
  await expect(page.getByText(/basic information/i)).toBeVisible()

  await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill(orgName)
  await page.getByPlaceholder('Healthcare Trust Registry').fill(serviceName)
  await page.getByPlaceholder('did:method:identifier').first().fill(did)
  await labelInput(page, 'AKA').fill(aka)
  await page.getByPlaceholder(/search languages/i).fill('English')
  await page
    .getByRole('option', { name: /english/i })
    .first()
    .click()
  await labelInput(page, 'Document URL').fill(docUrl)
}

// Fills + broadcasts MsgCreateTrustRegistry, then returns the new TR id from the /tr/<id> redirect.
export async function createEcosystem(page: Page, opts: EcosystemFormOptions): Promise<string> {
  const chainErrors = watchChainErrors(page)
  await fillEcosystemForm(page, opts)
  await page.locator('.btn-action-confirm').click()

  const success = page.waitForURL(/\/tr\/\d+(\?|$)/, { timeout: 240_000 }).then(() => 'ok' as const)
  const failure = new Promise<'error'>((resolve) => {
    const timer = setInterval(() => {
      if (chainErrors.error) {
        clearInterval(timer)
        resolve('error')
      }
    }, 250)
  })
  if ((await Promise.race([success, failure])) === 'error') {
    throw new Error(`testnet rejected the create-ecosystem tx: ${chainErrors.error}`)
  }

  await expect(page.getByText(opts.did).first()).toBeVisible()
  const trId = page.url().match(/\/tr\/(\d+)/)?.[1]
  if (!trId) throw new Error('no trust registry id in the redirect URL')
  return trId
}
