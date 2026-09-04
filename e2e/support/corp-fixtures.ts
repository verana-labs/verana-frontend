export const HARNESS_ADDRESS = 'verana1dnucfytqvaat3a5m2tcc3dan0e3x8826h0fe6c'
export const OTHER_MEMBER = 'verana1h5m6c6a33kncyrm05rz4k4lj9u2q2t2dkzrnts'
export const SECOND_OPERATOR = 'verana1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
export const ACME_DID = 'did:web:acme-trust.ch'
export const PLAIN_DID = 'did:web:keplr-maxime-0825.devnet.verana.network'
export const ACME_POLICY_ADDRESS = 'verana10ezj2lmcj3flaacqwrzv278aled0pen8cnx257sggeng2fdel53q0929dj'

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

export const PROPOSALS = [
  {
    id: 42,
    corporation_id: 13,
    status: 'SUBMITTED',
    submit_time: '2026-09-02T08:00:00Z',
    voting_period_end: '2026-09-02T09:00:00Z',
    executor_result: null,
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.ec.v1.MsgArchiveEcosystem', id: '13', archive: true }],
  },
  {
    id: 41,
    corporation_id: 13,
    status: 'SUBMITTED',
    submit_time: '2026-09-01T11:00:00Z',
    voting_period_end: '2026-09-01T12:00:00Z',
    executor_result: null,
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.de.v1.MsgGrantOperatorAuthorization', grantee: 'verana1grantee' }],
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
  },
  {
    id: 39,
    corporation_id: 13,
    status: 'REJECTED',
    submit_time: '2026-08-30T10:00:00Z',
    voting_period_end: '2026-08-30T11:00:00Z',
    executor_result: null,
    proposers: [OTHER_MEMBER],
    messages: [{ '@type': '/verana.de.v1.MsgRevokeOperatorAuthorization', authorization_id: '2' }],
  },
  {
    id: 38,
    corporation_id: 13,
    status: 'WITHDRAWN',
    submit_time: '2026-08-29T10:00:00Z',
    voting_period_end: '2026-08-29T11:00:00Z',
    executor_result: null,
    proposers: [HARNESS_ADDRESS],
    messages: [{ '@type': '/verana.ec.v1.MsgCreateEcosystem', did: 'did:web:acme-eco.example' }],
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
