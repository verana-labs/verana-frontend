import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { msgTypeConfig } from '@/msg/constants/msgTypeConfig'

const ROOT = process.cwd()
const LIVE_DIR = join(ROOT, 'e2e/live')
const HOOKS_DIR = join(ROOT, 'app/msg/actions_hooks')

const SIGNABLE_TYPE_URLS = [
  '/cosmos.bank.v1beta1.MsgSend',
  '/cosmos.group.v1.MsgExec',
  '/cosmos.group.v1.MsgSubmitProposal',
  '/cosmos.group.v1.MsgUpdateGroupMembers',
  '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy',
  '/cosmos.group.v1.MsgVote',
  '/cosmos.group.v1.MsgWithdrawProposal',
  '/verana.co.v1.MsgCreateCorporation',
  '/verana.co.v1.MsgUpdateCorporation',
  '/verana.cs.v1.MsgArchiveCredentialSchema',
  '/verana.cs.v1.MsgCreateCredentialSchema',
  '/verana.cs.v1.MsgUpdateCredentialSchema',
  '/verana.de.v1.MsgGrantOperatorAuthorization',
  '/verana.de.v1.MsgRevokeOperatorAuthorization',
  '/verana.ec.v1.MsgArchiveEcosystem',
  '/verana.ec.v1.MsgCreateEcosystem',
  '/verana.ec.v1.MsgUpdateEcosystem',
  '/verana.gf.v1.MsgAddGovernanceFrameworkDocument',
  '/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
  '/verana.pp.v1.MsgCancelParticipantOPLastRequest',
  '/verana.pp.v1.MsgCreateRootParticipant',
  '/verana.pp.v1.MsgRenewParticipantOP',
  '/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit',
  '/verana.pp.v1.MsgRevokeParticipant',
  '/verana.pp.v1.MsgSelfCreateParticipant',
  '/verana.pp.v1.MsgSetParticipantEffectiveUntil',
  '/verana.pp.v1.MsgSetParticipantOPToValidated',
  '/verana.pp.v1.MsgSlashParticipantTrustDeposit',
  '/verana.pp.v1.MsgStartParticipantOP',
  '/verana.td.v1.MsgRepaySlashedTrustDeposit',
]

const DEFERRED_TYPE_URLS = ['/cosmos.group.v1.MsgVote', '/verana.td.v1.MsgRepaySlashedTrustDeposit']

const TEST_TITLE = /^\s*test\(\s*(?:\n\s*)?(['"`])(.*?)\1/gm
const HOOK_TYPE_URL = /'(\/(?:verana|cosmos)\.[a-z0-9.]+\.Msg\w+)'/g

function liveTitles(): string[] {
  return readdirSync(LIVE_DIR)
    .filter((file) => file.endsWith('.live.ts'))
    .flatMap((file) => [...readFileSync(join(LIVE_DIR, file), 'utf8').matchAll(TEST_TITLE)].map((match) => match[2]))
}

function namesTypeUrl(title: string, typeUrl: string): boolean {
  return new RegExp(`${typeUrl.replaceAll('.', '\\.')}(?!\\w)`).test(title)
}

function hookTypeUrls(): string[] {
  const found = readdirSync(HOOKS_DIR)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .flatMap((file) =>
      [...readFileSync(join(HOOKS_DIR, file), 'utf8').matchAll(HOOK_TYPE_URL)].map((match) => match[1])
    )
  return [...new Set(found)]
}

describe('live Keplr suite coverage', () => {
  const titles = liveTitles()

  it('finds the live test titles', () => {
    expect(titles.length).toBeGreaterThan(0)
  })

  it('lists every type URL the action hooks can sign', () => {
    const unlisted = hookTypeUrls().filter((typeUrl) => !SIGNABLE_TYPE_URLS.includes(typeUrl))
    expect(
      unlisted,
      `signable in the action hooks but missing from SIGNABLE_TYPE_URLS: ${unlisted.join(', ')}`
    ).toEqual([])
  })

  it('has a live test for every signable type URL that is not deferred', () => {
    const missing = SIGNABLE_TYPE_URLS.filter(
      (typeUrl) => !DEFERRED_TYPE_URLS.includes(typeUrl) && !titles.some((title) => namesTypeUrl(title, typeUrl))
    )
    expect(missing, `no e2e/live test title names: ${missing.join(', ')}`).toEqual([])
  })

  it('defers only type URLs that still have no live test', () => {
    const covered = DEFERRED_TYPE_URLS.filter((typeUrl) => titles.some((title) => namesTypeUrl(title, typeUrl)))
    expect(covered, `covered now, remove from DEFERRED_TYPE_URLS: ${covered.join(', ')}`).toEqual([])
  })

  it('has a live test for every message type in msgTypeConfig', () => {
    const missing = Object.keys(msgTypeConfig).filter(
      (name) => !titles.some((title) => new RegExp(`\\b${name}\\b`).test(title))
    )
    expect(missing, `no e2e/live test title names: ${missing.join(', ')}`).toEqual([])
  })
})
