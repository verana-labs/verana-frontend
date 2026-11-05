import type { Page } from '@playwright/test'
import { labelInput } from '../support/forms'
import {
  composeProposal,
  confirmDialog,
  DOC_URL,
  daysFromNow,
  fillFees,
  fillSchemaForm,
  groupProposalRow,
  joinFromTree,
  newStamp,
  openEcosystemForm,
  openParticipant,
  pickLanguage,
  ready,
  reloadUntilVisible,
  submitFormIfShown,
  testDid,
} from './support/app-flows'
import { eventAttribute, indexerList, latestGroupProposal } from './support/chain-tx'
import { loadDotEnv } from './support/env'
import {
  assertFunded,
  connectApp,
  expect,
  type LiveSession,
  rejectWithKeplr,
  signWithKeplr,
  test,
  throwawayAddress,
} from './support/fixtures'

loadDotEnv()

const SUBMIT_PROPOSAL = '/cosmos.group.v1.MsgSubmitProposal'
const stamp = newStamp()

type State = {
  address?: string
  grantee?: string
  corporationId?: string
  policyAddress?: string
  ecosystemId?: string
  schemaOpen?: string
  schemaOnboarding?: string
  rootOpen?: string
  rootOnboarding?: string
  issuerOpen?: { id: string; did: string }
  issuerOnboarding?: { id: string; did: string }
}

const state: State = {}

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined)
    throw new Error(`prerequisite missing: ${what}. An earlier test in this run failed or was skipped.`)
  return value
}

async function newestSchemaId(
  env: Parameters<typeof indexerList>[0],
  ecosystemId: string,
  above: number
): Promise<string> {
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    const schemas = await indexerList(env, `credential-schema/list?ecosystem_id=${ecosystemId}`, 'schemas')
    const ids = schemas.map((schema) => Number(schema.id)).filter((id) => id > above)
    if (ids.length > 0) return String(Math.max(...ids))
    await new Promise((resolve) => setTimeout(resolve, 4_000))
  }
  throw new Error(`no new schema showed up in the indexer for ecosystem ${ecosystemId}`)
}

async function highestSchemaId(env: Parameters<typeof indexerList>[0], ecosystemId: string): Promise<number> {
  const schemas = await indexerList(env, `credential-schema/list?ecosystem_id=${ecosystemId}`, 'schemas')
  return Math.max(0, ...schemas.map((schema) => Number(schema.id)))
}

test('preflight: Keplr unlocked, app connected through Keplr, wallet funded', async ({ live, app }) => {
  state.address = await connectApp(live, app)
  state.grantee = await throwawayAddress()
  await assertFunded(live, state.address)
})

test('/verana.co.v1.MsgCreateCorporation creates the fresh corporation through the wizard', async ({ live, app }) => {
  await ready(live, app, '/corporation?create=1')
  await app.getByLabel('Corporation DID').fill(testDid('corp', stamp))
  await app.getByLabel('CGF document URL').fill(DOC_URL)
  await app.getByRole('button', { name: 'Continue' }).click()
  await app.getByRole('button', { name: 'Continue' }).click()
  await expect(app.getByText(/you keep no personal privileges/)).toBeVisible()
  await app.getByLabel('Policy funding (uvna)').fill('200000000')
  const signed = await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Sign & create corporation' }).click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.co.v1.MsgCreateCorporation'] }
  )
  state.corporationId = eventAttribute(signed.response.events, 'create_corporation', 'corporation_id')
  state.policyAddress = eventAttribute(signed.response.events, 'create_corporation', 'policy_address')
  need(state.policyAddress, 'policy address emitted by create_corporation')
})

test('/verana.de.v1.MsgGrantOperatorAuthorization self-grant via /cosmos.group.v1.MsgSubmitProposal funded by /cosmos.bank.v1beta1.MsgSend', async ({
  live,
  app,
}) => {
  need(state.policyAddress, 'corporation policy address')
  await app
    .getByRole('button', { name: 'Grant me operator authorization' })
    .waitFor({ state: 'visible', timeout: 5_000 })
    .catch(async () => {
      await ready(live, app, '/corporation?create=1')
    })
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Grant me operator authorization' }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL, '/cosmos.bank.v1beta1.MsgSend'],
      chainTypes: [SUBMIT_PROPOSAL, '/cosmos.bank.v1beta1.MsgSend', '/verana.de.v1.MsgGrantOperatorAuthorization'],
      outcome: 'executed',
    }
  )
  const address = need(state.address, 'wallet address')
  await expect
    .poll(
      async () =>
        (
          await indexerList(
            live.env,
            `delegation/operator-authorizations?operator=${address}&only_active=true`,
            'authorizations'
          )
        ).length,
      {
        timeout: 180_000,
        intervals: [4_000],
      }
    )
    .toBeGreaterThan(0)
})

test('/cosmos.bank.v1beta1.MsgSend sends VNA from the account', async ({ live, app }) => {
  const grantee = need(state.grantee, 'throwaway recipient')
  await ready(live, app, `/account?send=${grantee}`)
  await app.locator('#sendvna-amount').fill('0.01')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Send', exact: true }).click()
      await confirmDialog(app)
    },
    { popupTypes: ['/cosmos.bank.v1beta1.MsgSend'] }
  )
})

test('/verana.co.v1.MsgUpdateCorporation rotates the corporation DID as operator', async ({ live, app }) => {
  await ready(live, app, '/corporation')
  await app
    .getByRole('button', { name: /Rotate DID/ })
    .first()
    .click()
  await app.getByPlaceholder('did:method:identifier').fill(testDid('corp-rotated', stamp))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Update DID' }).click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.co.v1.MsgUpdateCorporation'] }
  )
})

test('/verana.ec.v1.MsgCreateEcosystem creates the ecosystem', async ({ live, app }) => {
  await ready(live, app, '/ecosystems')
  await openEcosystemForm(app, testDid('eco', stamp))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.ec.v1.MsgCreateEcosystem'] }
  )
  await expect.poll(() => app.url(), { timeout: 240_000 }).toMatch(/\/ecosystems\/\d+(\?|$)/)
  state.ecosystemId = app.url().match(/\/ecosystems\/(\d+)/)?.[1]
  need(state.ecosystemId, 'ecosystem id from the redirect')
})

test('/verana.ec.v1.MsgUpdateEcosystem rotates the ecosystem DID', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  await ready(live, app, `/ecosystems/${id}`)
  await app.getByRole('button', { name: /^Edit Configuration/ }).click()
  await app.getByPlaceholder('did:method:identifier').fill(testDid('eco-rotated', stamp))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.ec.v1.MsgUpdateEcosystem'] }
  )
})

test('/verana.ec.v1.MsgArchiveEcosystem archives the ecosystem', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  await ready(live, app, `/ecosystems/${id}`)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /^archive\b/i })
        .first()
        .click()
      await submitFormIfShown(app)
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.ec.v1.MsgArchiveEcosystem'] }
  )
})

test('/verana.ec.v1.MsgArchiveEcosystem with archive=false is MsgUnarchiveEcosystem', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  await ready(live, app, `/ecosystems/${id}`)
  await reloadUntilVisible(app, app.getByRole('button', { name: /^unarchive\b/i }))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /^unarchive\b/i })
        .first()
        .click()
      await submitFormIfShown(app)
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.ec.v1.MsgArchiveEcosystem'] }
  )
})

test('/verana.gf.v1.MsgAddGovernanceFrameworkDocument adds a document for the next version', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  await ready(live, app, `/ecosystems/${id}?tab=governance`)
  await app
    .getByRole('button', { name: /Add New EGF Document/ })
    .first()
    .click()
  await pickLanguage(app, 'English')
  await labelInput(app, 'Governance Framework Document URL').fill(DOC_URL)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.gf.v1.MsgAddGovernanceFrameworkDocument'] }
  )
})

test('/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion activates the new version', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  await ready(live, app, `/ecosystems/${id}?tab=governance`)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /Increase Active EGF/ })
        .first()
        .click()
      await submitFormIfShown(app)
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion'] }
  )
})

test('/verana.cs.v1.MsgCreateCredentialSchema creates a schema with open issuer onboarding', async ({ live, app }) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  const before = await highestSchemaId(live.env, id)
  await ready(live, app, `/ecosystems/${id}`)
  await fillSchemaForm(app, `${stamp}-open`, '1')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.cs.v1.MsgCreateCredentialSchema'] }
  )
  state.schemaOpen = await newestSchemaId(live.env, id, before)
})

test('/verana.cs.v1.MsgCreateCredentialSchema creates a schema with ecosystem-approval issuer onboarding', async ({
  live,
  app,
}) => {
  const id = need(state.ecosystemId, 'ecosystem id')
  const before = await highestSchemaId(live.env, id)
  await ready(live, app, `/ecosystems/${id}`)
  await fillSchemaForm(app, `${stamp}-op`, '2')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.cs.v1.MsgCreateCredentialSchema'] }
  )
  state.schemaOnboarding = await newestSchemaId(live.env, id, before)
})

test('/verana.pp.v1.MsgCreateRootParticipant creates the root participant on the open schema', async ({
  live,
  app,
}) => {
  const schema = need(state.schemaOpen, 'open schema id')
  await ready(live, app, `/participants/${schema}`)
  await app.getByRole('button', { name: 'New Participant' }).first().click()
  await labelInput(app, 'DID').fill(testDid('root-open', stamp))
  await fillFees(app)
  const signed = await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgCreateRootParticipant'] }
  )
  state.rootOpen = eventAttribute(signed.response.events, 'create_root_participant', 'root_participant_id')
})

test('/verana.pp.v1.MsgCreateRootParticipant creates the root participant on the onboarding schema', async ({
  live,
  app,
}) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  await ready(live, app, `/participants/${schema}`)
  await app.getByRole('button', { name: 'New Participant' }).first().click()
  await labelInput(app, 'DID').fill(testDid('root-op', stamp))
  await fillFees(app)
  const signed = await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgCreateRootParticipant'] }
  )
  state.rootOnboarding = eventAttribute(signed.response.events, 'create_root_participant', 'root_participant_id')
})

test('/verana.pp.v1.MsgSelfCreateParticipant joins the open schema as issuer', async ({ live, app }) => {
  const schema = need(state.schemaOpen, 'open schema id')
  need(state.rootOpen, 'root participant on the open schema')
  const did = testDid('issuer-open', stamp)
  await ready(live, app, `/participants/${schema}`)
  await joinFromTree(app, schema, 'Issuers')
  await labelInput(app, 'DID').fill(did)
  await fillFees(app)
  const signed = await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgSelfCreateParticipant'] }
  )
  const id = eventAttribute(signed.response.events, 'create_participant', 'participant_id')
  state.issuerOpen = { id: need(id, 'participant id from create_participant'), did }
})

test('/verana.pp.v1.MsgStartParticipantOP starts the onboarding process as issuer', async ({ live, app }) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  need(state.rootOnboarding, 'root participant on the onboarding schema')
  const did = testDid('issuer-op', stamp)
  await ready(live, app, `/participants/${schema}`)
  await joinFromTree(app, schema, 'Issuers')
  await labelInput(app, 'DID').fill(did)
  await fillFees(app)
  const signed = await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgStartParticipantOP'] }
  )
  const id = eventAttribute(signed.response.events, 'start_participant_op', 'participant_id')
  state.issuerOnboarding = { id: need(id, 'participant id from start_participant_op'), did }
})

test('/verana.pp.v1.MsgSetParticipantOPToValidated validates the onboarding issuer', async ({ live, app }) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  const issuer = need(state.issuerOnboarding, 'onboarding issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await app
    .getByRole('button', { name: /Accept and Set Validated|Accept and Validate/ })
    .first()
    .click()
  await fillFees(app)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgSetParticipantOPToValidated'] }
  )
})

test('/verana.pp.v1.MsgRenewParticipantOP renews the onboarding issuer', async ({ live, app }) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  const issuer = need(state.issuerOnboarding, 'onboarding issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /Renew Onboarding Process/ })
        .first()
        .click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgRenewParticipantOP'] }
  )
})

test('/verana.pp.v1.MsgCancelParticipantOPLastRequest cancels the renewal request', async ({ live, app }) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  const issuer = need(state.issuerOnboarding, 'onboarding issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /Cancel Request/ })
        .first()
        .click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgCancelParticipantOPLastRequest'] }
  )
})

test('/verana.pp.v1.MsgSetParticipantEffectiveUntil adjusts the open issuer', async ({ live, app }) => {
  const schema = need(state.schemaOpen, 'open schema id')
  const issuer = need(state.issuerOpen, 'open issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await app
    .getByRole('button', { name: /Adjust Participant/ })
    .first()
    .click()
  await labelInput(app, 'Effective Until').fill(daysFromNow(180))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgSetParticipantEffectiveUntil'] }
  )
})

test('/verana.pp.v1.MsgSlashParticipantTrustDeposit slashes the onboarding issuer', async ({ live, app }) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  const issuer = need(state.issuerOnboarding, 'onboarding issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await app
    .getByRole('button', { name: /Slash Deposit/ })
    .first()
    .click()
  await labelInput(app, 'Amount (VNA)').fill('0.01')
  await labelInput(app, 'Reason').fill('live keplr suite slash')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgSlashParticipantTrustDeposit'] }
  )
})

test('/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit repays the slashed onboarding issuer', async ({
  live,
  app,
}) => {
  const schema = need(state.schemaOnboarding, 'onboarding schema id')
  const issuer = need(state.issuerOnboarding, 'onboarding issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await reloadUntilVisible(app, app.getByRole('button', { name: /Repay Slashed Deposit/ }))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /Repay Slashed Deposit/ })
        .first()
        .click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit'] }
  )
})

test('/verana.pp.v1.MsgRevokeParticipant revokes the open issuer', async ({ live, app }) => {
  const schema = need(state.schemaOpen, 'open schema id')
  const issuer = need(state.issuerOpen, 'open issuer')
  await ready(live, app, `/participants/${schema}`)
  await openParticipant(app, schema, issuer.did)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /Revoke Participant/ })
        .first()
        .click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.pp.v1.MsgRevokeParticipant'] }
  )
})

test('/verana.cs.v1.MsgUpdateCredentialSchema updates the validity periods of the open schema', async ({
  live,
  app,
}) => {
  const schema = need(state.schemaOpen, 'open schema id')
  await ready(live, app, `/credential-schemas/${schema}`)
  await app.getByRole('button', { name: /^Edit Configuration/ }).click()
  await labelInput(app, 'Holder Validity Period').fill('30')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.locator('.btn-action-confirm').click()
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.cs.v1.MsgUpdateCredentialSchema'] }
  )
})

test('/verana.cs.v1.MsgArchiveCredentialSchema archives the open schema', async ({ live, app }) => {
  const schema = need(state.schemaOpen, 'open schema id')
  await ready(live, app, `/credential-schemas/${schema}`)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /^Archive Schema/ })
        .first()
        .click()
      await submitFormIfShown(app)
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.cs.v1.MsgArchiveCredentialSchema'] }
  )
})

test('/verana.cs.v1.MsgArchiveCredentialSchema with archive=false is MsgUnarchiveCredentialSchema', async ({
  live,
  app,
}) => {
  const schema = need(state.schemaOpen, 'open schema id')
  await ready(live, app, `/credential-schemas/${schema}`)
  await reloadUntilVisible(app, app.getByRole('button', { name: /^Unarchive Schema/ }))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app
        .getByRole('button', { name: /^Unarchive Schema/ })
        .first()
        .click()
      await submitFormIfShown(app)
      await confirmDialog(app)
    },
    { popupTypes: ['/verana.cs.v1.MsgArchiveCredentialSchema'] }
  )
})

test('/verana.de.v1.MsgGrantOperatorAuthorization grants a second account through a proposal', async ({
  live,
  app,
}) => {
  const grantee = need(state.grantee, 'throwaway grantee')
  await ready(live, app, '/corporation?tab=operators')
  await app.getByLabel('Grant operator authorization').fill(grantee)
  await app.getByRole('button', { name: /message types selected/ }).click()
  await app.getByRole('button', { name: 'Select all' }).click()
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: /Grant$/ }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/verana.de.v1.MsgGrantOperatorAuthorization'],
      outcome: 'executed',
    }
  )
})

test('/verana.de.v1.MsgRevokeOperatorAuthorization revokes the second account through a proposal', async ({
  live,
  app,
}) => {
  const grantee = need(state.grantee, 'throwaway grantee')
  await ready(live, app, '/corporation?tab=operators')
  const row = app.locator('li', { hasText: grantee })
  await reloadUntilVisible(app, row)
  await signWithKeplr(
    live,
    app,
    async () => {
      await row
        .first()
        .getByRole('button', { name: /Revoke$/ })
        .click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/verana.de.v1.MsgRevokeOperatorAuthorization'],
      outcome: 'executed',
    }
  )
})

test('/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy sets a 20 second minimum execution period', async ({
  live,
  app,
}) => {
  await ready(live, app, '/corporation?tab=proposals')
  await composeProposal(app, 'policy')
  await app.getByLabel('Minimum execution period (seconds)').fill('20')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Submit proposal' }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy'],
      outcome: 'executed',
    }
  )
})

test('/cosmos.group.v1.MsgUpdateGroupMembers adds a second member, left scheduled by the execution period', async ({
  live,
  app,
}) => {
  const grantee = need(state.grantee, 'throwaway member')
  await ready(live, app, '/corporation?tab=proposals')
  await composeProposal(app, 'members')
  await app.getByRole('button', { name: 'Add member' }).click()
  await app.getByPlaceholder('verana1…').last().fill(grantee)
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Submit proposal' }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/cosmos.group.v1.MsgUpdateGroupMembers'],
      outcome: 'pending',
    }
  )
})

async function executeLatestProposal(live: LiveSession, app: Page) {
  const policy = need(state.policyAddress, 'corporation policy address')
  const proposal = need(await latestGroupProposal(live.env, policy), 'a group proposal')
  await app.goto('/corporation?tab=proposals')
  await groupProposalRow(app, proposal.id).click()
  const execute = app.getByRole('button', { name: 'Execute', exact: true })
  await expect(async () => {
    await app.reload()
    await groupProposalRow(app, proposal.id).click()
    await expect(execute).toBeVisible({ timeout: 3_000 })
  }).toPass({ timeout: 180_000, intervals: [5_000] })
  return signWithKeplr(
    live,
    app,
    async () => {
      await execute.click()
      await confirmDialog(app)
    },
    { popupTypes: ['/cosmos.group.v1.MsgExec'], outcome: 'executed' }
  )
}

test('/cosmos.group.v1.MsgExec executes the scheduled members proposal', async ({ live, app }) => {
  await ready(live, app, '/corporation?tab=proposals')
  await executeLatestProposal(live, app)
})

test('/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy raises the threshold to 2, scheduled then executed with /cosmos.group.v1.MsgExec', async ({
  live,
  app,
}) => {
  await ready(live, app, '/corporation?tab=proposals')
  await composeProposal(app, 'policy')
  await app.getByLabel('Threshold').fill('2')
  await app.getByLabel('Minimum execution period (seconds)').fill('0')
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Submit proposal' }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy'],
      outcome: 'pending',
    }
  )
  await executeLatestProposal(live, app)
})

test('/cosmos.group.v1.MsgSubmitProposal opens a proposal that stays open with one of two votes', async ({
  live,
  app,
}) => {
  await ready(live, app, '/corporation?tab=proposals')
  await composeProposal(app, 'rotate')
  await app.getByLabel('DID', { exact: true }).fill(testDid('corp-proposed', stamp))
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Submit proposal' }).click()
      await confirmDialog(app)
    },
    {
      popupTypes: [SUBMIT_PROPOSAL],
      chainTypes: [SUBMIT_PROPOSAL, '/verana.co.v1.MsgUpdateCorporation'],
      outcome: 'pending',
    }
  )
})

test('/cosmos.group.v1.MsgWithdrawProposal withdraws the open proposal', async ({ live, app }) => {
  const policy = need(state.policyAddress, 'corporation policy address')
  await ready(live, app, '/corporation?tab=proposals')
  const proposal = need(await latestGroupProposal(live.env, policy), 'an open group proposal')
  await groupProposalRow(app, proposal.id).click()
  await signWithKeplr(
    live,
    app,
    async () => {
      await app.getByRole('button', { name: 'Withdraw', exact: true }).click()
      await confirmDialog(app)
    },
    { popupTypes: ['/cosmos.group.v1.MsgWithdrawProposal'] }
  )
})

test('rejecting the Keplr signature leaves the app usable and broadcasts nothing', async ({ live, app }) => {
  const grantee = need(state.grantee, 'throwaway recipient')
  await ready(live, app, `/account?send=${grantee}`)
  await app.locator('#sendvna-amount').fill('0.01')
  const send = app.getByRole('button', { name: 'Send', exact: true })
  await rejectWithKeplr(live, async () => {
    await send.click()
    await confirmDialog(app)
  })
  await expect(app.locator('.notify-error').first()).toBeVisible({ timeout: 30_000 })
  await expect(app.getByRole('dialog')).toBeHidden()
  await expect(send).toBeEnabled()
  await send.click()
  await expect(app.getByRole('dialog')).toBeVisible()
  await app.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(app.getByRole('dialog')).toBeHidden()
})

test.fixme('/cosmos.group.v1.MsgVote needs a second signer', {
  annotation: {
    type: 'fixme-reason',
    description: 'the proposer already votes yes through EXEC_TRY, so a vote needs a second group member wallet',
  },
}, async () => {})

test.fixme('/verana.td.v1.MsgRepaySlashedTrustDeposit needs a governance slash', {
  annotation: {
    type: 'fixme-reason',
    description:
      'the corporation trust deposit can only be slashed by governance, no wallet in this suite can create the debt to repay',
  },
}, async () => {})
