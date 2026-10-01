import type { Page } from '@playwright/test'
import {
  ACME_DID,
  ACME_ECOSYSTEM_DID,
  ACME_POLICY_ADDRESS,
  ACME_TRUST_DATA,
  AGENT_ECOSYSTEMS,
  AGENT_PARTICIPANTS,
  AGENT_RESOLUTIONS,
  CGF_VERSIONS_12,
  CGF_VERSIONS_13,
  EGF_ACTIVE_13,
  FEE_GRANTS,
  GROUP_MEMBERS,
  HARNESS_ADDRESS,
  HISTORY_13,
  OPERATOR_AUTHORIZATIONS,
  PLAIN_DID,
  PROPOSALS,
  VOTES,
  VS_OPERATOR,
  VS_OPERATOR_AUTHORIZATIONS,
} from './corp-fixtures'

export { ACME_DID, ACME_ECOSYSTEM_DID, HARNESS_ADDRESS, HARNESS_MNEMONIC, PLAIN_DID } from './corp-fixtures'

const unavailable = { status: 502, json: { error: 'indexer unavailable', code: 502 } }

const CORPORATION_13 = {
  id: 13,
  did: ACME_DID,
  policy_address: ACME_POLICY_ADDRESS,
  language: 'de',
  active_version: 1,
  created: '2026-09-01T10:00:00Z',
  modified: '2026-09-01T10:00:00Z',
  trust_data: ACME_TRUST_DATA,
}

export type CorpStubOptions = {
  memberOnly?: boolean
  trustDeposit404?: boolean
  fresh?: boolean
  sectionsDown?: boolean
}

export async function seedActingCorporation(page: Page, corporationId: number) {
  await page.addInitScript(
    ({ key, stored }) => {
      window.localStorage.setItem(key, stored)
    },
    {
      key: `verana.acting-corporation:${HARNESS_ADDRESS}`,
      stored: JSON.stringify({ corporationId, expiresAt: Date.now() + 3_600_000 }),
    }
  )
}

export async function installEcosystemStubs(page: Page, versions: unknown[] = [EGF_ACTIVE_13]) {
  await page.route(/\/v4\/ecosystem\/get\/13(?:\?.*)?$/, (route) => {
    const all = new URL(route.request().url()).searchParams.get('gf_data') === 'all'
    return route.fulfill({
      json: {
        ecosystem: {
          id: 13,
          did: ACME_ECOSYSTEM_DID,
          corporation_id: 13,
          created: '2026-09-01T10:30:00Z',
          modified: '2026-09-01T10:30:00Z',
          archived: null,
          language: 'en',
          active_version: 1,
          versions: all ? versions : versions.slice(0, 1),
          participants: 0,
          active_schemas: 0,
          weight: 0,
          issued: 0,
          verified: 0,
        },
      },
    })
  })
  await page.route('**/v4/credential-schema/list*', (route) => route.fulfill({ json: { schemas: [] } }))
}

export async function installCorporationStubs(page: Page, opts: CorpStubOptions = {}) {
  const { memberOnly = false, trustDeposit404 = false, fresh = false, sectionsDown = false } = opts

  await page.route('**/v4/delegation/operator-authorizations*', (route) => {
    if (fresh || memberOnly) return route.fulfill({ json: { authorizations: [] } })
    const params = new URL(route.request().url()).searchParams
    const operator = params.get('operator')
    const corporationId = params.get('corporation_id')
    if (sectionsDown && corporationId !== null) return route.fulfill(unavailable)
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
  await page.route('**/v4/corporation/get/12*', (route) =>
    route.fulfill({
      json: {
        corporation: {
          id: 12,
          did: PLAIN_DID,
          policy_address: 'verana1wfse3z8akyw3pmn8x0htzq6l5wwfgqmc2jgnhxtzm96h4ywhhr0qpua4w7',
          language: 'en',
          active_version: 1,
          created: '2026-08-25T20:34:20Z',
          modified: '2026-08-25T20:34:20Z',
          trust_data: null,
          versions: CGF_VERSIONS_12,
        },
      },
    })
  )
  await stubCorporationGovernance(page, CGF_VERSIONS_13)
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
    await page.route(`**/v4/trust-deposit/get/${id}`, (route) => {
      if (sectionsDown) return route.fulfill(unavailable)
      return trustDeposit404
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
    })
  }
  await page.route('**/v4/group/proposals*', (route) => {
    const url = route.request().url()
    if (url.includes('pending_voter')) {
      return route.fulfill({ json: { proposals: url.includes('corporation_id=13') ? [{ id: 41 }] : [] } })
    }
    if (sectionsDown) return route.fulfill(unavailable)
    return route.fulfill({ json: { proposals: PROPOSALS } })
  })
  await page.route('**/v4/group/votes*', (route) => {
    const proposalId = Number(new URL(route.request().url()).searchParams.get('proposal_id'))
    return route.fulfill({ json: { votes: VOTES[proposalId] ?? [] } })
  })
  await page.route('**/v4/delegation/vs-operator-authorizations*', (route) =>
    route.fulfill({ json: { authorizations: [] } })
  )
  await page.route('**/v4/delegation/fee-grants*', (route) => {
    if (sectionsDown) return route.fulfill(unavailable)
    const params = new URL(route.request().url()).searchParams
    const corporationId = params.get('grantor_corporation_id')
    const grantee = params.get('grantee')
    const msgType = params.get('msg_type')
    return route.fulfill({
      json: {
        fee_grants: FEE_GRANTS.filter(
          (row) =>
            (corporationId === null || String(row.grantor_corporation_id) === corporationId) &&
            (grantee === null || row.grantee === grantee) &&
            (msgType === null || row.msg_types.includes(msgType))
        ),
      },
    })
  })
  await page.route('**/v4/participant/pending/flat*', (route) => {
    const url = route.request().url()
    const ecosystems = url.includes('corporation_id=13')
      ? [{ id: 1, pending_tasks: 2, participants: 2, schemas: [] }]
      : []
    return route.fulfill({ json: { ecosystems } })
  })
  await stubTrustResolve(page)
}

export async function stubCorporationGovernance(page: Page, versions: unknown[]) {
  await page.route(/\/v4\/corporation\/get\/13(?:\?.*)?$/, (route) =>
    route.fulfill({ json: { corporation: { ...CORPORATION_13, versions } } })
  )
}

type ServiceDescriptionClaims = { description?: string; descriptionFormat?: string }

function resolveBody(service: ServiceDescriptionClaims) {
  return {
    ...ACME_TRUST_DATA,
    ecsCredentials: ACME_TRUST_DATA.ecsCredentials.map((credential) =>
      credential.ecsSchema === 'ServiceCredential'
        ? { ...credential, credentialSubject: { ...credential.credentialSubject, ...service } }
        : credential
    ),
  }
}

// Playwright gives the last handler priority, so a later call replaces the claims of the earlier one.
export async function stubTrustResolve(page: Page, service: ServiceDescriptionClaims = {}) {
  await page.route('**/v4/verifiable-trust/resolve', (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { did?: string }
    if (body.did !== ACME_DID) {
      return route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
    }
    return route.fulfill({ json: resolveBody(service) })
  })
}

export async function stubEcosystemList(page: Page) {
  await page.route('**/v4/ecosystem/list*', (route) =>
    route.fulfill({
      json: {
        ecosystems: [
          {
            id: 1,
            did: ACME_DID,
            corporation_id: 13,
            created: '2026-09-01T10:00:00Z',
            modified: '2026-09-01T10:00:00Z',
            language: 'en',
            active_version: 1,
            active_schemas: 0,
            participants: 1,
            weight: '0',
            issued: 0,
            verified: 0,
            archived: null,
          },
        ],
      },
    })
  )
}

export type AgentStubOptions = {
  ecosystemsDown?: boolean
  delegationsDown?: boolean
  resolverDown?: boolean
}

export async function installAgentStubs(page: Page, opts: AgentStubOptions = {}) {
  const { ecosystemsDown = false, delegationsDown = false, resolverDown = false } = opts

  await page.route('**/v4/participant/list*', (route) => {
    const params = new URL(route.request().url()).searchParams
    if (params.get('corporation_id') !== '13') return route.fulfill({ json: { participants: [] } })
    const wanted = params.get('participant_state')
    const participants = wanted
      ? AGENT_PARTICIPANTS.filter((participant) => participant.participant_state === wanted)
      : AGENT_PARTICIPANTS
    return route.fulfill({ json: { participants } })
  })
  await page.route('**/v4/ecosystem/list*', (route) => {
    if (ecosystemsDown) return route.fulfill(unavailable)
    return route.fulfill({ json: { ecosystems: AGENT_ECOSYSTEMS } })
  })
  await page.route('**/v4/credential-schema/list*', (route) => route.fulfill({ json: { schemas: [] } }))
  await page.route('**/v4/delegation/vs-operator-authorizations*', (route) => {
    if (delegationsDown) return route.fulfill(unavailable)
    return route.fulfill({ json: { authorizations: VS_OPERATOR_AUTHORIZATIONS } })
  })
  await page.route('**/v4/verifiable-trust/resolve', (route) => {
    if (resolverDown) return route.fulfill(unavailable)
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      did?: string
      participations?: { states?: string[] }
    }
    const fixture = body.did ? AGENT_RESOLUTIONS[body.did] : undefined
    if (!body.did || !fixture) return route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
    const states = body.participations?.states ?? []
    return route.fulfill({
      json: {
        did: body.did,
        trusted: fixture.trusted ?? true,
        evaluatedAtBlock: 405000,
        expiresAtTime: null,
        ecsCredentials: [
          {
            id: `urn:uuid:ecs-org-${body.did}`,
            ecsSchema: 'OrganizationCredential',
            credentialSubject: { name: 'Acme Trust AG', countryCode: 'CH' },
          },
          {
            id: `urn:uuid:ecs-service-${body.did}`,
            ecsSchema: 'ServiceCredential',
            credentialSubject: { name: fixture.serviceName },
          },
        ],
        participations: (fixture.participations ?? [])
          .filter((participation) => states.includes(participation.state))
          .map((participation) => ({
            id: participation.id,
            role: participation.role,
            state: participation.state,
            credentialSchemaId: 26,
            ecosystemId: 13,
            vsOperator: participation.id === 102 ? VS_OPERATOR : null,
            validatorParticipantId: null,
          })),
        services: fixture.services ?? [],
        presentations: fixture.presentations ?? [],
      },
    })
  })
}

const SOCKET_BLOCK_TIME = '2026-09-01T12:00:00Z'
// A long block interval keeps the liveness timer of the client out of the test.
const SOCKET_BLOCK_INTERVAL_MS = 600_000

export type IndexerSocketConnection = {
  corporationId: number | null
  closed: boolean
  send: (message: unknown) => void
}

export type IndexerSocketHarness = {
  openConnections: () => IndexerSocketConnection[]
  subscribedCorporationIds: () => number[]
  connectionsFor: (corporationId: number) => IndexerSocketConnection[]
  pushBlock: (corporationId: number, block: number, events?: unknown[]) => void
}

export function indexerParticipantEvent(txHash: string, blockHeight: number, corporationId: number) {
  return {
    type: 'indexer-event',
    event_type: 'StartParticipantOP',
    did: null,
    block_height: blockHeight,
    tx_hash: txHash,
    timestamp: SOCKET_BLOCK_TIME,
    payload: {
      module: 'pp',
      action: 'start_participant_op',
      message_type: 'MsgStartParticipantOP',
      tx_index: 0,
      message_index: 0,
      sender: HARNESS_ADDRESS,
      related_dids: [],
      corporation_id: corporationId,
    },
  }
}

export async function installIndexerSocket(
  page: Page,
  startBlock = 1001,
  blockIntervalMs = SOCKET_BLOCK_INTERVAL_MS
): Promise<IndexerSocketHarness> {
  const connections: IndexerSocketConnection[] = []

  await page.routeWebSocket('**/v4/indexer/subscribe', (ws) => {
    const connection: IndexerSocketConnection = {
      corporationId: null,
      closed: false,
      send: (message) => ws.send(JSON.stringify(message)),
    }
    connections.push(connection)
    // A page load and the double mount of development mode leave closed connections behind.
    ws.onClose(() => {
      connection.closed = true
    })
    // The server sends `ready` on connect, before any subscribe, per IDX-INDEXER-SUB-1.
    connection.send({
      type: 'ready',
      block: startBlock,
      blockTime: SOCKET_BLOCK_TIME,
      blockIntervalMs,
    })
    ws.onMessage((message) => {
      const control = JSON.parse(String(message)) as { action?: string; corporationId?: number | null }
      if (control.action !== 'subscribe') return
      connection.corporationId = control.corporationId ?? null
      connection.send({ type: 'subscribed', block: startBlock, blockTime: SOCKET_BLOCK_TIME })
    })
  })

  const openConnections = () => connections.filter((connection) => !connection.closed)
  const connectionsFor = (corporationId: number) =>
    connections.filter((connection) => connection.corporationId === corporationId)

  return {
    openConnections,
    connectionsFor,
    subscribedCorporationIds: () =>
      openConnections()
        .map((connection) => connection.corporationId)
        .filter((corporationId): corporationId is number => corporationId !== null),
    pushBlock: (corporationId, block, events = []) => {
      const open = openConnections()
        .filter((connection) => connection.corporationId === corporationId)
        .at(-1)
      if (!open) throw new Error(`No open subscription for corporation ${corporationId}`)
      open.send({ type: 'block', block, blockTime: SOCKET_BLOCK_TIME, events })
    },
  }
}
