import { describe, expect, it } from 'vitest'
import {
  composerMsgs,
  confirmLabelKey,
  formatStdFee,
  modeLabelKey,
  msgShortName,
  proposalMeta,
  txSeverity,
} from './tx-preview'

describe('txSeverity', () => {
  it('flags revocations and slashes as irreversible', () => {
    expect(txSeverity('/verana.de.v1.MsgRevokeOperatorAuthorization')).toBe('irreversible')
    expect(txSeverity('/verana.td.v1.MsgSlashTrustDeposit')).toBe('irreversible')
  })

  it('flags the DID rotation and archival as a notice', () => {
    expect(txSeverity('/verana.co.v1.MsgUpdateCorporation')).toBe('notice')
    expect(txSeverity('/verana.cs.v1.MsgArchiveCredentialSchema')).toBe('notice')
  })

  it('leaves group messages, grants and the slashed-deposit repayment unflagged', () => {
    for (const typeUrl of [
      '/cosmos.group.v1.MsgVote',
      '/cosmos.group.v1.MsgExec',
      '/cosmos.group.v1.MsgWithdrawProposal',
      '/cosmos.group.v1.MsgSubmitProposal',
      '/verana.de.v1.MsgGrantOperatorAuthorization',
      '/verana.td.v1.MsgRepaySlashedTrustDeposit',
    ]) {
      expect(txSeverity(typeUrl)).toBeNull()
    }
  })
})

describe('formatStdFee', () => {
  it('formats the first coin in VNA', () => {
    expect(formatStdFee({ amount: [{ denom: 'uvna', amount: '90000' }], gas: '300000' })).toBe('0.09 VNA')
  })

  it('falls back to zero on an empty fee', () => {
    expect(formatStdFee({ amount: [], gas: '300000' })).toBe('0 VNA')
  })
})

describe('labels', () => {
  it('uses the proposal wording only in proposal mode', () => {
    expect(confirmLabelKey('proposal')).toBe('txconfirm.submitproposal')
    expect(confirmLabelKey('operator')).toBe('txconfirm.confirm')
    expect(confirmLabelKey('account')).toBe('txconfirm.confirm')
    expect(modeLabelKey('account')).toBe('txconfirm.mode.account')
  })

  it('shortens a type url to its message name', () => {
    expect(msgShortName('/verana.co.v1.MsgUpdateCorporation')).toBe('MsgUpdateCorporation')
  })
})

describe('proposalMeta', () => {
  it('falls back to the default title and mirrors it into the summary', () => {
    expect(proposalMeta({}, 'Rotate DID')).toEqual({ title: 'Rotate DID', summary: 'Rotate DID' })
    expect(proposalMeta({ title: '  ', summary: '' }, 'Rotate DID')).toEqual({
      title: 'Rotate DID',
      summary: 'Rotate DID',
    })
  })

  it('keeps what the composer typed', () => {
    expect(proposalMeta({ title: 'Custom', summary: 'Why' }, 'Rotate DID')).toEqual({ title: 'Custom', summary: 'Why' })
  })
})

describe('composerMsgs', () => {
  const msgs = [{ typeUrl: '/cosmos.group.v1.MsgSubmitProposal', value: { title: 'Rotate DID' } }]

  it('returns the previewed set untouched when the request cannot rebuild', () => {
    expect(composerMsgs({ msgs, proposalTitle: 'Rotate DID' }, { title: 'Custom' })).toBe(msgs)
  })

  it('rebuilds the envelope from the trimmed draft with the default title as fallback', () => {
    const rebuild = (meta: { title: string; summary: string }) => [{ typeUrl: 'rebuilt', value: meta }]
    expect(composerMsgs({ msgs, proposalTitle: 'Rotate DID', rebuild }, { title: ' Custom ', summary: 'Why' })).toEqual(
      [{ typeUrl: 'rebuilt', value: { title: 'Custom', summary: 'Why' } }]
    )
    expect(composerMsgs({ msgs, proposalTitle: 'Rotate DID', rebuild }, { title: '', summary: '' })).toEqual([
      { typeUrl: 'rebuilt', value: { title: 'Rotate DID', summary: 'Rotate DID' } },
    ])
  })
})
