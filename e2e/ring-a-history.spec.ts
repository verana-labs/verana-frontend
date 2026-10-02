import { expect, type Page, test } from '@playwright/test'
import { ACME_DID } from './support/corp-stubs'

const SCHEMA_ID = 77
const ECOSYSTEM_ID = 13
const CANONICAL_ID = `vpr:verana:vna-devnet-1:cs:${SCHEMA_ID}`

const STORED_JSON_SCHEMA = { $id: 'stored-id', title: 'History fixture', type: 'object' }

const SCHEMA_HISTORY = {
  entity_type: 'CredentialSchema',
  entity_id: String(SCHEMA_ID),
  activity: [
    { id: 9, timestamp: '2026-09-30T10:00:00Z', block_height: 47394, msg: 'StatsUpdate', changes: {} },
    {
      id: 3,
      timestamp: '2026-09-29T10:24:51Z',
      block_height: 9390,
      msg: 'UpdateCredentialSchema',
      account: 'verana1policy',
      changes: {},
    },
    {
      id: 1,
      timestamp: '2026-09-29T10:20:00Z',
      block_height: 9384,
      msg: 'CreateCredentialSchema',
      account: 'verana1policy',
      changes: {},
    },
  ],
}

async function installSchemaPage(page: Page, opts: { canonical: boolean; history: boolean }) {
  await page.route(`**/v4/credential-schema/get/${SCHEMA_ID}*`, (route) =>
    route.fulfill({
      json: {
        schema: {
          id: SCHEMA_ID,
          ecosystem_id: ECOSYSTEM_ID,
          json_schema: JSON.stringify(STORED_JSON_SCHEMA),
          issuer_grantor_validation_validity_period: 0,
          verifier_grantor_validation_validity_period: 0,
          issuer_validation_validity_period: 365,
          verifier_validation_validity_period: 365,
          holder_validation_validity_period: 0,
          issuer_onboarding_mode: 'OPEN',
          verifier_onboarding_mode: 'OPEN',
          holder_onboarding_mode: 'PERMISSIONLESS',
          pricing_asset_type: 'COIN',
          pricing_asset: 'uvna',
          digest_algorithm: 'sha384',
          title: 'History fixture',
          description: 'History fixture',
          archived: null,
        },
      },
    })
  )
  await page.route(`**/v4/credential-schema/js/${SCHEMA_ID}`, (route) =>
    opts.canonical
      ? route.fulfill({ json: { ...STORED_JSON_SCHEMA, $id: CANONICAL_ID } })
      : route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await page.route(`**/v4/credential-schema/history/${SCHEMA_ID}*`, (route) =>
    opts.history
      ? route.fulfill({ json: SCHEMA_HISTORY })
      : route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await page.route(`**/v4/ecosystem/get/${ECOSYSTEM_ID}*`, (route) =>
    route.fulfill({
      json: {
        ecosystem: {
          id: ECOSYSTEM_ID,
          did: ACME_DID,
          corporation_id: ECOSYSTEM_ID,
          created: '2026-09-01T10:00:00Z',
          modified: '2026-09-01T10:00:00Z',
          language: 'en',
          active_version: 1,
          participants: 0,
          active_schemas: 1,
          weight: 0,
          issued: 0,
          verified: 0,
          archived: null,
          versions: [],
        },
      },
    })
  )
}

test('a credential schema shows its canonical JSON Schema and its history', async ({ page }) => {
  await installSchemaPage(page, { canonical: true, history: true })
  await page.goto(`/credential-schemas/${SCHEMA_ID}`)

  await expect(page.getByText(`"${CANONICAL_ID}"`)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('"stored-id"')).toHaveCount(0)
  const activity = page.locator('#activity')
  await expect(activity.getByText('Update Credential Schema')).toBeVisible()
  await expect(activity.getByText('Create Credential Schema')).toBeVisible()
  await expect(activity.getByText('Stats Update')).toHaveCount(0)
})

test('a failed canonical JSON Schema or history load says so instead of reading as empty', async ({ page }) => {
  await installSchemaPage(page, { canonical: false, history: false })
  await page.goto(`/credential-schemas/${SCHEMA_ID}`)

  await expect(page.getByText('The canonical JSON Schema could not be loaded')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('"stored-id"')).toBeVisible()
  await expect(page.locator('#activity').getByText('The activity could not be loaded.')).toBeVisible()
})

test('an ecosystem shows its activity timeline', async ({ page }) => {
  await installSchemaPage(page, { canonical: true, history: true })
  await page.route(`**/v4/ecosystem/history/${ECOSYSTEM_ID}*`, (route) =>
    route.fulfill({
      json: {
        entity_type: 'Ecosystem',
        entity_id: String(ECOSYSTEM_ID),
        activity: [
          {
            id: 1,
            timestamp: '2026-09-01T10:00:00Z',
            block_height: '9384',
            entity_type: 'Ecosystem',
            entity_id: String(ECOSYSTEM_ID),
            msg: 'CreateEcosystem',
            changes: { did: ACME_DID },
          },
        ],
      },
    })
  )
  await page.route('**/v4/credential-schema/list*', (route) => route.fulfill({ json: { schemas: [] } }))
  await page.goto(`/ecosystems/${ECOSYSTEM_ID}`)

  const activity = page.locator('#activity')
  await expect(activity.getByText('Create Ecosystem')).toBeVisible({ timeout: 15_000 })
  await expect(activity).toContainText('9384')
})
