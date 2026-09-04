import type { Page } from '@playwright/test'
import {
  ACME_DID,
  ACME_POLICY_ADDRESS,
  GROUP_MEMBERS,
  HARNESS_ADDRESS,
  HISTORY_13,
  OPERATOR_AUTHORIZATIONS,
  PLAIN_DID,
  PROPOSALS,
  VOTES,
} from './corp-fixtures'

export { ACME_DID, HARNESS_ADDRESS, PLAIN_DID } from './corp-fixtures'

export type CorpStubOptions = {
  memberOnly?: boolean
  trustDeposit404?: boolean
  fresh?: boolean
}

export async function seedActingCorporation(page: Page, corporationId: number) {
  await page.addInitScript(
    (stored) => {
      window.localStorage.setItem('verana.acting-corporation', stored)
    },
    JSON.stringify({ address: HARNESS_ADDRESS, corporationId, expiresAt: Date.now() + 3_600_000 })
  )
}

export async function installCorporationStubs(page: Page, opts: CorpStubOptions = {}) {
  const { memberOnly = false, trustDeposit404 = false, fresh = false } = opts

  await page.route('**/v4/delegation/operator-authorizations*', (route) => {
    if (fresh || memberOnly) return route.fulfill({ json: { authorizations: [] } })
    const params = new URL(route.request().url()).searchParams
    const operator = params.get('operator')
    const corporationId = params.get('corporation_id')
    return route.fulfill({
      json: {
        authorizations: OPERATOR_AUTHORIZATIONS.filter(
          (row) =>
            (operator === null || row.operator === operator) &&
            (corporationId === null || String(row.corporation_id) === corporationId)
        ),
      },
    })
  })
  await page.route('**/v4/group/corporations-by-member*', (route) =>
    route.fulfill({
      json: {
        memberships: fresh
          ? []
          : [
              { corporation_id: 12, weight: '1' },
              { corporation_id: 13, weight: '3' },
            ],
      },
    })
  )
  await page.route('**/v4/corporation/get/12', (route) =>
    route.fulfill({
      json: {
        corporation: {
          id: 12,
          did: PLAIN_DID,
          policy_address: 'verana1wfse3z8akyw3pmn8x0htzq6l5wwfgqmc2jgnhxtzm96h4ywhhr0qpua4w7',
          language: 'en',
          created: '2026-08-25T20:34:20Z',
          modified: '2026-08-25T20:34:20Z',
        },
      },
    })
  )
  await page.route('**/v4/corporation/get/13', (route) =>
    route.fulfill({
      json: {
        corporation: {
          id: 13,
          did: ACME_DID,
          policy_address: ACME_POLICY_ADDRESS,
          language: 'de',
          created: '2026-09-01T10:00:00Z',
          modified: '2026-09-01T10:00:00Z',
        },
      },
    })
  )
  await page.route('**/v4/corporation/history/12*', (route) =>
    route.fulfill({ json: { entity_type: 'Corporation', entity_id: '12', activity: [] } })
  )
  await page.route('**/v4/corporation/history/13*', (route) =>
    route.fulfill({ json: { entity_type: 'Corporation', entity_id: '13', activity: HISTORY_13 } })
  )
  for (const id of [12, 13]) {
    await page.route(`**/v4/group/get/${id}`, (route) =>
      route.fulfill({
        json: {
          group: {
            corporation_id: id,
            group_id: id,
            version: 2,
            total_weight: '6',
            created_at: '2026-09-01T10:00:00Z',
            policy: {
              address: 'verana1policy',
              version: 2,
              decision_policy: {
                '@type': '/cosmos.group.v1.ThresholdDecisionPolicy',
                threshold: '3',
                windows: { voting_period: '300s', min_execution_period: '0s' },
              },
            },
            members: GROUP_MEMBERS,
          },
        },
      })
    )
    await page.route(`**/v4/trust-deposit/get/${id}`, (route) =>
      trustDeposit404
        ? route.fulfill({ status: 404, json: { error: 'not found', code: 404 } })
        : route.fulfill({
            json: {
              trust_deposit: {
                corporation_id: id,
                deposit: 25_000_000,
                slashed_deposit: 2_000_000,
                repaid_deposit: 0,
                claimable: 0,
                share: 25_000_000,
                slash_count: 1,
                last_slashed: '2026-08-30T09:00:00Z',
                last_repaid: null,
                refunded: 0,
              },
            },
          })
    )
  }
  await page.route('**/v4/group/proposals*', (route) => {
    const url = route.request().url()
    if (url.includes('pending_voter')) {
      return route.fulfill({ json: { proposals: url.includes('corporation_id=13') ? [{ id: 41 }] : [] } })
    }
    return route.fulfill({ json: { proposals: PROPOSALS } })
  })
  await page.route('**/v4/group/votes*', (route) => {
    const proposalId = Number(new URL(route.request().url()).searchParams.get('proposal_id'))
    return route.fulfill({ json: { votes: VOTES[proposalId] ?? [] } })
  })
  await page.route('**/v4/delegation/vs-operator-authorizations*', (route) =>
    route.fulfill({ json: { authorizations: [] } })
  )
  await page.route('**/v4/participant/pending/flat*', (route) => {
    const url = route.request().url()
    return route.fulfill({ json: { participants: url.includes('corporation_id=13') ? [{ id: 1 }, { id: 2 }] : [] } })
  })
  await page.route('**/v4/verifiable-trust/resolve', (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { did?: string }
    if (body.did !== ACME_DID) {
      return route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
    }
    return route.fulfill({
      json: {
        did: ACME_DID,
        trusted: true,
        evaluatedAtTime: '2026-09-01T12:00:00Z',
        evaluatedAtBlock: 405000,
        expiresAtTime: null,
        corporationId: 13,
        ecsCredentials: [
          {
            ecsSchema: 'OrganizationCredential',
            credentialSubject: { name: 'Acme Trust AG', countryCode: 'CH', registryId: 'CHE-999.999.999' },
          },
          { ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Trust Registry' } },
        ],
      },
    })
  })
}
