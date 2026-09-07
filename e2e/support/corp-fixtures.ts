import { createHash } from 'node:crypto'

export const HARNESS_MNEMONIC =
  'fire inner worth basket annual click random life will style science wolf notice village hand curve urge rifle only attract tilt way strong cover'
export const HARNESS_ADDRESS = 'verana1pjluhuuyzgdey0syket0xqthv2usmjfe4pta2s'
export const OTHER_MEMBER = 'verana1h5m6c6a33kncyrm05rz4k4lj9u2q2t2dkzrnts'
export const SECOND_OPERATOR = 'verana1uvdtvs7yfaaqajpykkw3r9xkpkkrxssqs8nnu7'
export const ACME_DID = 'did:web:acme-trust.ch'
export const PLAIN_DID = 'did:web:keplr-maxime-0825.devnet.verana.network'
export const ACME_POLICY_ADDRESS = 'verana10ezj2lmcj3flaacqwrzv278aled0pen8cnx257sggeng2fdel53q0929dj'
export const GRANTEE = 'verana1enndx0fjq23urqc9fpf66y7xwvhe2ajhme498v'
export const REPLACEMENT_MEMBER = 'verana1y6hjwe5kpmuvw920cn5gje9mk7smgcgeuj4jdf'

export const CGF_URL = 'https://acme-trust.ch/cgf.md'
export const CGF_DRAFT_URL = 'https://acme-trust.ch/cgf-v2.md'
export const CGF_MARKDOWN = '# Acme Trust AG governance framework\n\nVersion 1. Members vote with weight.\n'
export const CGF_DIGEST = `sha384-${createHash('sha384').update(CGF_MARKDOWN).digest('base64')}`

export const CGF_VERSIONS = [
  {
    id: 15,
    corporation_id: 13,
    ecosystem_id: null,
    version: 1,
    created: '2026-09-01T10:00:00Z',
    active_since: '2026-09-01T10:00:00Z',
    documents: [
      { id: 15, gfv_id: 15, language: 'en', url: CGF_URL, digest_sri: CGF_DIGEST, created: '2026-09-01T10:00:00Z' },
    ],
  },
  {
    id: 16,
    corporation_id: 13,
    ecosystem_id: null,
    version: 2,
    created: '2026-09-02T10:00:00Z',
    active_since: null,
    documents: [
      {
        id: 16,
        gfv_id: 16,
        language: 'de',
        url: CGF_DRAFT_URL,
        digest_sri: CGF_DIGEST,
        created: '2026-09-02T10:00:00Z',
      },
    ],
  },
]

export const OPERATOR_GRANT_MESSAGE_TYPES = [
  '/verana.co.v1.MsgUpdateCorporation',
  '/verana.ec.v1.MsgCreateEcosystem',
  '/verana.ec.v1.MsgUpdateEcosystem',
  '/verana.ec.v1.MsgArchiveEcosystem',
  '/verana.gf.v1.MsgAddGovernanceFrameworkDocument',
  '/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
  '/verana.cs.v1.MsgCreateCredentialSchema',
  '/verana.cs.v1.MsgUpdateCredentialSchema',
  '/verana.cs.v1.MsgArchiveCredentialSchema',
  '/verana.pp.v1.MsgSelfCreateParticipant',
  '/verana.pp.v1.MsgCreateRootParticipant',
  '/verana.pp.v1.MsgSetParticipantEffectiveUntil',
  '/verana.pp.v1.MsgRevokeParticipant',
  '/verana.pp.v1.MsgStartParticipantOP',
  '/verana.pp.v1.MsgRenewParticipantOP',
  '/verana.pp.v1.MsgSetParticipantOPToValidated',
  '/verana.pp.v1.MsgTriggerResolver',
  '/verana.pp.v1.MsgCancelParticipantOPLastRequest',
  '/verana.pp.v1.MsgSlashParticipantTrustDeposit',
  '/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit',
  '/verana.td.v1.MsgReclaimTrustDepositYield',
  '/verana.td.v1.MsgRepaySlashedTrustDeposit',
  '/verana.di.v1.MsgStoreDigest',
]

const HARNESS_GRANTS_13 = [
  '/verana.co.v1.MsgUpdateCorporation',
  '/verana.de.v1.MsgGrantOperatorAuthorization',
  '/verana.de.v1.MsgRevokeOperatorAuthorization',
  '/verana.td.v1.MsgRepaySlashedTrustDeposit',
]

export const OPERATOR_AUTHORIZATIONS = [
  { id: 1, corporation_id: 12, operator: HARNESS_ADDRESS, msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
  { id: 2, corporation_id: 13, operator: HARNESS_ADDRESS, msg_types: HARNESS_GRANTS_13 },
  { id: 3, corporation_id: 13, operator: SECOND_OPERATOR, msg_types: OPERATOR_GRANT_MESSAGE_TYPES },
]

export const GROUP_MEMBERS = [
  { address: HARNESS_ADDRESS, weight: '3', added_at: '2026-09-01T10:00:00Z' },
  { address: OTHER_MEMBER, weight: '2', added_at: '2026-09-01T10:00:00Z' },
  { address: SECOND_OPERATOR, weight: '1', added_at: '2026-09-01T10:00:00Z' },
]

function tally(yes = 0, no = 0) {
  return { yes_count: String(yes), no_count: String(no), abstain_count: '0', no_with_veto_count: '0' }
}

const OPEN_VOTING_PERIOD_END = new Date(Date.now() + 3_600_000).toISOString()

export const PROPOSALS = [
  {
    id: 42,
    corporation_id: 13,
    status: 'SUBMITTED',
    submit_time: '2026-09-02T08:00:00Z',
    voting_period_end: '2026-09-02T09:00:00Z',
    executor_result: 'NOT_RUN',
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.ec.v1.MsgArchiveEcosystem', id: '13', archive: true }],
    tally: tally(2, 1),
  },
  {
    id: 41,
    corporation_id: 13,
    status: 'SUBMITTED',
    submit_time: '2026-09-01T11:00:00Z',
    voting_period_end: OPEN_VOTING_PERIOD_END,
    executor_result: 'NOT_RUN',
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.de.v1.MsgGrantOperatorAuthorization', grantee: GRANTEE }],
    tally: tally(),
  },
  {
    id: 40,
    corporation_id: 13,
    status: 'ACCEPTED',
    submit_time: '2026-09-01T10:00:00Z',
    voting_period_end: '2026-09-01T10:05:00Z',
    executor_result: 'SUCCESS',
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.co.v1.MsgUpdateCorporation', did: ACME_DID }],
    tally: tally(5),
  },
  {
    id: 39,
    corporation_id: 13,
    status: 'REJECTED',
    submit_time: '2026-08-30T10:00:00Z',
    voting_period_end: '2026-08-30T11:00:00Z',
    executor_result: 'NOT_RUN',
    proposers: [OTHER_MEMBER],
    messages: [{ '@type': '/verana.de.v1.MsgRevokeOperatorAuthorization', authorization_id: '2' }],
    tally: tally(0, 6),
  },
  {
    id: 38,
    corporation_id: 13,
    status: 'WITHDRAWN',
    submit_time: '2026-08-29T10:00:00Z',
    voting_period_end: '2026-08-29T11:00:00Z',
    executor_result: 'NOT_RUN',
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.ec.v1.MsgCreateEcosystem', did: 'did:web:acme-eco.example' }],
    tally: tally(),
  },
]

function vote(id: number, proposalId: number, voter: string, option: string, submitTime: string) {
  return { id, proposal_id: proposalId, voter, option, metadata: '', submit_time: submitTime }
}

export const VOTES: Record<number, ReturnType<typeof vote>[]> = {
  42: [
    vote(421, 42, OTHER_MEMBER, 'YES', '2026-09-02T08:10:00Z'),
    vote(422, 42, SECOND_OPERATOR, 'NO', '2026-09-02T08:20:00Z'),
  ],
  40: [
    vote(401, 40, OTHER_MEMBER, 'YES', '2026-09-01T10:01:00Z'),
    vote(402, 40, HARNESS_ADDRESS, 'YES', '2026-09-01T10:02:00Z'),
  ],
  39: [
    vote(391, 39, HARNESS_ADDRESS, 'NO', '2026-08-30T10:10:00Z'),
    vote(392, 39, OTHER_MEMBER, 'NO', '2026-08-30T10:20:00Z'),
    vote(393, 39, SECOND_OPERATOR, 'NO', '2026-08-30T10:30:00Z'),
  ],
}

function activity(
  id: number,
  timestamp: string,
  blockHeight: number,
  msg: string,
  changes: Record<string, unknown>,
  account?: string
) {
  return {
    id,
    timestamp,
    block_height: blockHeight,
    entity_type: 'Corporation',
    entity_id: '13',
    msg,
    changes,
    ...(account ? { account } : {}),
  }
}

export const HISTORY_13 = [
  activity(6, '2026-09-02T08:00:00Z', 405600, 'SubmitProposal', { proposal_id: 42 }, HARNESS_ADDRESS),
  activity(5, '2026-09-01T11:00:00Z', 405300, 'UpdateCorporation', { did: ACME_DID }, ACME_POLICY_ADDRESS),
  activity(
    4,
    '2026-09-01T10:05:00Z',
    405050,
    'GrantOperatorAuthorization',
    { operator: HARNESS_ADDRESS, msg_types: HARNESS_GRANTS_13 },
    ACME_POLICY_ADDRESS
  ),
  activity(
    3,
    '2026-09-01T10:00:00Z',
    405000,
    'CreateCorporation',
    { did: 'did:web:acme-trust.example', language: 'de' },
    OTHER_MEMBER
  ),
  activity(
    2,
    '2026-08-31T09:00:00Z',
    404500,
    'RepaySlashedTrustDeposit',
    { repaid_deposit: 2_000_000 },
    HARNESS_ADDRESS
  ),
  activity(1, '2026-08-30T09:00:00Z', 404000, 'SlashTrustDeposit', { slashed_deposit: 2_000_000, slash_count: 1 }),
]

export const LIST_ECOSYSTEM_COUNT = 12

export function listEcosystemDid(id: number) {
  return `did:web:eco-${id}.example`
}

function listTimestamp(id: number) {
  return `2026-08-${String(id).padStart(2, '0')}T10:00:00Z`
}

function listController(id: number) {
  return id >= 3 ? 13 : 12
}

export function listEcosystemRoles(ecosystemId: number, corporationId: number): string[] {
  if (corporationId !== 13) return []
  if (ecosystemId === 2) return ['ISSUER']
  return ecosystemId >= 3 ? ['ECOSYSTEM'] : []
}

export function listEcosystemTrust(id: number, mode: string | null) {
  if (mode === null) return null
  const trusted = id % 2 === 0
  const summary = {
    did: listEcosystemDid(id),
    trusted,
    evaluatedAtTime: '2026-09-01T12:00:00Z',
    evaluatedAtBlock: 405000,
    expiresAtTime: null,
    corporationId: listController(id),
  }
  if (mode === 'summary') return summary
  return {
    ...summary,
    ecsCredentials: trusted
      ? [
          {
            ecsSchema: 'ServiceCredential',
            credentialSubject: { name: `Eco ${id} Registry`, description: `Registry ${id}` },
          },
          { ecsSchema: 'OrganizationCredential', credentialSubject: { name: `Org ${id}`, countryCode: 'CH' } },
        ]
      : [],
  }
}

export function listEcosystem(id: number) {
  const created = listTimestamp(id)
  return {
    id,
    did: listEcosystemDid(id),
    corporation_id: listController(id),
    created,
    modified: created,
    archived: null,
    language: 'en',
    active_version: 1,
    versions: [
      {
        id,
        ecosystem_id: id,
        created,
        version: 1,
        active_since: created,
        documents: [
          {
            id,
            gfv_id: id,
            created,
            language: 'en',
            url: `https://eco-${id}.example/egf.md`,
            digest_sri: 'sha384-eco',
          },
        ],
      },
    ],
    participants: id,
    active_schemas: 1,
    weight: String(id * 1_000_000),
    issued: id * 2,
    verified: id,
  }
}

export function listSchema(ecosystemId: number) {
  const created = listTimestamp(ecosystemId)
  return {
    id: 100 + ecosystemId,
    ecosystem_id: ecosystemId,
    json_schema: JSON.stringify({
      $id: `vpr:verana:e2e:cs:${100 + ecosystemId}`,
      title: `Schema ${ecosystemId}`,
      description: 'E2E schema',
      type: 'object',
      properties: {},
    }),
    issuer_grantor_validation_validity_period: 365,
    verifier_grantor_validation_validity_period: 365,
    issuer_validation_validity_period: 365,
    verifier_validation_validity_period: 365,
    holder_validation_validity_period: 365,
    issuer_onboarding_mode: 'OPEN',
    verifier_onboarding_mode: 'OPEN',
    holder_onboarding_mode: 'PERMISSIONLESS',
    pricing_asset_type: 'COIN',
    pricing_asset: 'uvna',
    digest_algorithm: 'sha384',
    archived: null,
    created,
    modified: created,
    participants: 0,
    weight: '0',
    issued: 0,
    verified: 0,
  }
}
