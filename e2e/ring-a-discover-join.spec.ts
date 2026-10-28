import { createHash } from 'node:crypto'
import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Page, test } from '@playwright/test'
import { MsgSelfCreateParticipant } from '@verana-labs/verana-types/codec/verana/pp/v1/tx'
import { ParticipantRole } from '@verana-labs/verana-types/codec/verana/pp/v1/types'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import { ACME_POLICY_ADDRESS, GRANTEE } from './support/corp-fixtures'
import { HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'
import { labelInput } from './support/forms'
import { installMockChain } from './support/mock-chain'

const ACME_ID = 9450
const ACME_DID = 'did:web:acme-join.example'
const ACTING_CORPORATION_ID = 13
const EGF_URL = 'https://gov.acme-join.example/egf.md'
const EGF_MARKDOWN = '# Acme join framework\n\nParticipants follow these rules.\n'
const MARKDOWN_HEADERS = { 'access-control-allow-origin': '*', 'content-type': 'text/markdown; charset=utf-8' }
const CREATED = '2026-09-01T10:00:00Z'
const SERVICE_DID = 'did:web:ring-a-join.example'

const sri = (text: string) => `sha384-${createHash('sha384').update(text).digest('base64')}`

function trustData(did: string, trusted: boolean, name: string) {
  return {
    did,
    trusted,
    evaluatedAtTime: CREATED,
    evaluatedAtBlock: 1,
    expiresAtTime: null,
    ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name } }],
  }
}

function ecosystem(id: number, name: string, weight: string, trusted = true) {
  const did = id === ACME_ID ? ACME_DID : `did:web:ecosystem-${id}.example`
  const documents = id === ACME_ID ? [{ id: 1, url: EGF_URL, language: 'en', digest_sri: sri(EGF_MARKDOWN) }] : []
  return {
    id,
    did,
    corporation_id: 100 + id,
    created: CREATED,
    modified: CREATED,
    language: 'en',
    active_version: 1,
    versions: [{ id, version: 1, active_since: CREATED, documents }],
    participants: 2,
    active_schemas: 1,
    weight,
    issued: 3,
    verified: 4,
    archived: null,
    trust_data: trustData(did, trusted, name),
  }
}

const ECOSYSTEMS = [
  ecosystem(ACME_ID, 'Acme Join Registry', '3000'),
  ecosystem(9449, 'Zeta Registry', '10'),
  ecosystem(9448, 'Shady Registry', '500', false),
  ecosystem(9447, 'Beta Registry', '90000000'),
  ecosystem(9446, 'Gamma Registry', '7'),
  ecosystem(9445, 'Beyond The Window Registry', '1'),
]

const SCHEMA = {
  id: 94500,
  ecosystem_id: ACME_ID,
  json_schema: JSON.stringify({ title: 'Acme Membership', description: 'Acme membership credential' }),
  issuer_grantor_validation_validity_period: 0,
  verifier_grantor_validation_validity_period: 0,
  issuer_validation_validity_period: 0,
  verifier_validation_validity_period: 0,
  holder_validation_validity_period: 0,
  issuer_onboarding_mode: 'OPEN',
  verifier_onboarding_mode: 'OPEN',
  holder_onboarding_mode: 'PERMISSIONLESS',
  pricing_asset_type: 'COIN',
  pricing_asset: 'uvna',
  digest_algorithm: 'sha384',
  participants: 1,
  issued: 0,
  verified: 0,
  weight: 0,
  archived: null,
}

function participant(id: number, role: string, corporationId: number, ecosystemId = ACME_ID) {
  const did = role === 'ECOSYSTEM' ? ACME_DID : SERVICE_DID
  return {
    id,
    schema_id: SCHEMA.id,
    ecosystem_id: ecosystemId,
    role,
    did,
    trust_data: trustData(did, true, role === 'ECOSYSTEM' ? 'Acme Join Registry' : 'Ring A Service'),
    corporation_id: corporationId,
    participant_state: 'ACTIVE',
    op_state: 'VALIDATED',
    validator_participant_id: null,
    effective_from: CREATED,
    effective_until: null,
    validation_fees: 0,
    issuance_fees: 0,
    verification_fees: 0,
    deposit: 0,
    corporation_available_actions: [],
    validator_available_actions: [],
  }
}

async function stubDiscover(page: Page): Promise<URLSearchParams[]> {
  const participantQueries: URLSearchParams[] = []
  await page.route('**/v4/ecosystem/list*', (route) => {
    const params = new URL(route.request().url()).searchParams
    const discoverQuery = params.get('trust_data') === 'full' && params.get('archived') === 'false'
    return route.fulfill({ json: { ecosystems: discoverQuery ? ECOSYSTEMS : [] } })
  })
  await page.route(`**/v4/ecosystem/get/${ACME_ID}*`, (route) => route.fulfill({ json: { ecosystem: ECOSYSTEMS[0] } }))
  await page.route('**/v4/credential-schema/list*', (route) => {
    const ecosystemId = new URL(route.request().url()).searchParams.get('ecosystem_id')
    return route.fulfill({ json: { schemas: ecosystemId === String(ACME_ID) ? [SCHEMA] : [] } })
  })
  await page.route(`**/v4/credential-schema/get/${SCHEMA.id}*`, (route) => route.fulfill({ json: { schema: SCHEMA } }))
  await page.route('**/v4/participant/list*', (route) => {
    const params = new URL(route.request().url()).searchParams
    participantQueries.push(params)
    if (params.get('corporation_id') === String(ACTING_CORPORATION_ID)) {
      const roles =
        params.get('participant_state') === 'ACTIVE'
          ? [
              participant(31, 'HOLDER', ACTING_CORPORATION_ID),
              participant(30, 'ISSUER', ACTING_CORPORATION_ID),
              participant(29, 'VERIFIER', ACTING_CORPORATION_ID, 9447),
            ]
          : []
      return route.fulfill({ json: { participants: roles } })
    }
    const root = params.get('schema_id') === String(SCHEMA.id) && params.get('role') === 'ECOSYSTEM'
    return route.fulfill({ json: { participants: root ? [participant(20, 'ECOSYSTEM', 100 + ACME_ID)] : [] } })
  })
  await page.route('**/v4/verifiable-trust/resolve', (route) =>
    route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
  )
  await page.route(EGF_URL, (route) => route.fulfill({ status: 200, headers: MARKDOWN_HEADERS, body: EGF_MARKDOWN }))
  return participantQueries
}

const cardNames = (page: Page) =>
  page.locator('#ecosystem-list article').evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')))

test('discover lists every ecosystem of the window, finds one by name and orders by locked trust value', async ({
  page,
}) => {
  await stubDiscover(page)
  await page.goto('/discover')

  await expect(page.locator('#ecosystem-list article')).toHaveCount(5)
  expect(await cardNames(page)).toEqual([
    'Acme Join Registry',
    'Zeta Registry',
    'Shady Registry',
    'Beta Registry',
    'Gamma Registry',
  ])
  await expect(page.getByText('Sorting and filters apply to the loaded results only.')).toHaveCount(1)
  await expect(page.locator('section', { hasText: 'Search Ecosystems' }).getByText(/loaded results only/)).toBeVisible()

  await page.locator('#discover-order').selectOption('trustValue')
  await expect
    .poll(() => cardNames(page))
    .toEqual(['Beta Registry', 'Acme Join Registry', 'Shady Registry', 'Zeta Registry', 'Gamma Registry'])

  await page.locator('#show-untrusted').uncheck()
  await expect(page.getByRole('article', { name: 'Shady Registry' })).toBeHidden()

  await page.locator('#ecosystem-search').fill('acme join')
  await expect(page.locator('#ecosystem-list article')).toHaveCount(1)
  const acme = page.getByRole('article', { name: 'Acme Join Registry' })
  const counters = [
    ['Active Schemas:', '1'],
    ['Participants:', '2'],
    ['Trust Value:', '0.003 VNA'],
    ['Issued Credentials:', '3'],
    ['Verified Credentials:', '4'],
  ] as const
  for (const [label, value] of counters) {
    const counter = acme.locator('dl > div').filter({ has: page.locator('dt', { hasText: label }) })
    await expect(counter.locator('dd')).toHaveText(value)
  }
  await expect(acme.getByRole('heading', { name: 'Acme Membership' })).toBeVisible()
  await expect(acme.getByRole('button', { name: /View JSON Schema/ })).toBeVisible()
  await expect(acme.getByRole('link', { name: 'Join' })).toHaveCount(0)

  await acme.getByRole('button', { name: 'EGF' }).click()
  await expect(acme.getByRole('status')).toHaveText('Verified')
  await expect(acme.getByRole('heading', { name: 'Acme join framework' })).toBeVisible()
})

test('discover search finds an ecosystem beyond the first page from one full window request, then pages by keyset again', async ({
  page,
}) => {
  await stubDiscover(page)
  const listLimits: string[] = []
  const schemaRequests: string[] = []
  await page.route('**/v4/ecosystem/list*', (route) => {
    listLimits.push(new URL(route.request().url()).searchParams.get('limit') ?? '')
    return route.fallback()
  })
  await page.route('**/v4/credential-schema/list*', (route) => {
    schemaRequests.push(new URL(route.request().url()).searchParams.get('ecosystem_id') ?? '')
    return route.fallback()
  })
  await page.goto('/discover')

  const firstPage = ['Acme Join Registry', 'Zeta Registry', 'Shady Registry', 'Beta Registry', 'Gamma Registry']
  await expect.poll(() => cardNames(page)).toEqual(firstPage)
  await expect(page.getByRole('article', { name: 'Beyond The Window Registry' })).toHaveCount(0)

  await page.locator('#ecosystem-search').fill('beyond')
  await expect.poll(() => cardNames(page)).toEqual(['Beyond The Window Registry'])
  expect(listLimits.filter((limit) => limit === '1024')).toHaveLength(1)
  await expect(page.getByText('Sorting and filters apply to the loaded results only.')).toHaveCount(0)

  await page.locator('#ecosystem-search').fill('registry')
  await expect.poll(() => cardNames(page)).toHaveLength(5)
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect.poll(() => cardNames(page)).toEqual(['Beyond The Window Registry'])
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()

  const schemaRequestsBeforeClear = schemaRequests.length
  await page.locator('#ecosystem-search').fill('')
  await expect.poll(() => cardNames(page)).toEqual(firstPage)
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled()
  await expect(page.getByText('Sorting and filters apply to the loaded results only.')).toHaveCount(1)
  await page.waitForTimeout(500)
  expect(schemaRequests.length - schemaRequestsBeforeClear).toBeLessThanOrEqual(firstPage.length)
})

test('an acting corporation sees its roles from one corporation query and joins a schema through its participant tree', async ({
  page,
}) => {
  await installCorporationStubs(page)
  const participantQueries = await stubDiscover(page)
  await seedActingCorporation(page, ACTING_CORPORATION_ID)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/discover')
  const acme = page.getByRole('article', { name: 'Acme Join Registry' })
  const beta = page.getByRole('article', { name: 'Beta Registry' })
  await expect(acme.getByText('ISSUER', { exact: true })).toBeVisible()
  await expect(acme.getByText('HOLDER', { exact: true })).toBeVisible()
  await expect(beta.getByText('VERIFIER', { exact: true })).toBeVisible()
  const roleQueries = participantQueries.filter((params) => params.has('corporation_id'))
  expect(roleQueries).toHaveLength(1)
  for (const params of roleQueries) {
    expect(params.get('participant_state')).toBe('ACTIVE')
    expect(params.has('ecosystem_id')).toBe(false)
  }

  await page.locator('#hide-participant').check()
  await expect(acme).toBeHidden()
  await expect(beta).toBeHidden()
  await page.locator('#hide-participant').uncheck()

  const join = acme.getByRole('link', { name: 'Join' })
  await expect(join).toHaveAttribute('href', `/participants/${SCHEMA.id}`)
  await join.click()
  await expect(page).toHaveURL(new RegExp(`/participants/${SCHEMA.id}$`))
  await expect(
    page.locator('[data-slot="tree-row"]').filter({ hasText: 'Issuers' }).getByRole('button', { name: /join/ })
  ).toBeVisible({ timeout: 15_000 })
})

test('joining a folder of the participant tree broadcasts the VS operator named in the advanced section', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await installCorporationStubs(page)
  await stubDiscover(page)
  await seedActingCorporation(page, ACTING_CORPORATION_ID)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto(`/participants/${SCHEMA.id}`)
  await page
    .locator('[data-slot="tree-row"]')
    .filter({ hasText: 'Issuers' })
    .getByRole('button', { name: /join/ })
    .click({ timeout: 15_000 })
  const accept = page.locator('#egf-accept')
  await expect(accept).toBeEnabled()
  await accept.check()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await labelInput(page, 'DID').fill(SERVICE_DID)
  const confirm = page.getByRole('button', { name: 'Confirm & Self Create Participant' })
  const frozen = page.getByText(/This configuration is frozen at creation/)
  await expect(frozen).toBeHidden()
  await expect(confirm).toBeEnabled()

  await page.getByText('Advanced: VS operator delegation').click()
  await expect(frozen).toBeVisible()
  await page.locator('#vs-operator-vsOperator').fill('not-an-address')
  await expect(page.getByText('The VS operator must be a Verana account address.')).toBeVisible()
  await expect(confirm).toBeDisabled()
  await page.locator('#vs-operator-vsOperator').fill(GRANTEE)
  await expect(page.getByText('Choose at least one message for the VS operator.')).toBeVisible()
  await expect(confirm).toBeDisabled()
  await page.getByLabel('CreateOrUpdateParticipantSession').check()
  await page.locator('#vs-operator-spendLimit').fill('1000')
  await page.locator('#vs-operator-periodDays').fill('7')
  await expect(confirm).toBeEnabled()
  await confirm.click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toContainText(`Join as ISSUER with ${SERVICE_DID}.`, { timeout: 30_000 })
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Submit proposal' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBe(1)

  const body = TxBody.decode(TxRaw.decode(fromBase64(mock.broadcastTxs()[0])).bodyBytes)
  expect(body.messages.map((message) => message.typeUrl)).toEqual(['/cosmos.group.v1.MsgSubmitProposal'])
  const proposal = MsgSubmitProposal.decode(body.messages[0].value)
  expect(proposal.groupPolicyAddress).toBe(ACME_POLICY_ADDRESS)
  expect(proposal.messages.map((message) => message.typeUrl)).toEqual(['/verana.pp.v1.MsgSelfCreateParticipant'])
  expect(MsgSelfCreateParticipant.decode(proposal.messages[0].value)).toEqual(
    expect.objectContaining({
      corporation: ACME_POLICY_ADDRESS,
      role: ParticipantRole.ISSUER,
      validatorParticipantId: 20,
      did: SERVICE_DID,
      vsOperator: GRANTEE,
      vsOperatorAuthzMsgTypes: ['/verana.pp.v1.MsgCreateOrUpdateParticipantSession'],
      vsOperatorAuthzSpendLimit: [{ denom: 'uvna', amount: '1000' }],
      vsOperatorAuthzWithFeegrant: false,
      vsOperatorAuthzFeeSpendLimit: [],
      vsOperatorAuthzPeriod: { seconds: 604_800, nanos: 0 },
    })
  )
  await mock.teardown()
})
