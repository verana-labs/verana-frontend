import {
  MsgArchiveEcosystem,
  MsgCreateEcosystem,
  MsgUpdateEcosystem,
} from '@verana-labs/verana-types/codec/verana/ec/v1/tx'
import {
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion,
} from '@verana-labs/verana-types/codec/verana/gf/v1/tx'
import { describe, expect, it } from 'vitest'
import { buildEcosystemMessage } from './actionEcosystem'

const context = { corporation: 'verana1policy', operator: 'verana1operator' }

describe('buildEcosystemMessage', () => {
  it('round-trips the V4 create contract', () => {
    const message = buildEcosystemMessage(
      {
        msgType: 'MsgCreateEcosystem',
        did: 'did:web:ecosystem.example',
        language: 'en',
        docUrl: 'https://example.com/governance.pdf',
        docDigestSri: 'sha384-example',
      },
      context
    )
    const value = MsgCreateEcosystem.decode(MsgCreateEcosystem.encode(message.value as MsgCreateEcosystem).finish())

    expect(message.typeUrl).toBe('/verana.ec.v1.MsgCreateEcosystem')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      did: 'did:web:ecosystem.example',
      language: 'en',
      docUrl: 'https://example.com/governance.pdf',
      docDigestSri: 'sha384-example',
    })
  })

  it('round-trips the V4 update contract', () => {
    const message = buildEcosystemMessage(
      { msgType: 'MsgUpdateEcosystem', id: '7', did: 'did:web:ecosystem-updated.example' },
      context
    )
    const value = MsgUpdateEcosystem.decode(MsgUpdateEcosystem.encode(message.value as MsgUpdateEcosystem).finish())

    expect(message.typeUrl).toBe('/verana.ec.v1.MsgUpdateEcosystem')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      id: 7,
      did: 'did:web:ecosystem-updated.example',
    })
  })

  it.each([
    ['MsgArchiveEcosystem', true],
    ['MsgUnarchiveEcosystem', false],
  ] as const)('round-trips %s through the V4 archive toggle', (msgType, archive) => {
    const message = buildEcosystemMessage({ msgType, id: '7' }, context)
    const value = MsgArchiveEcosystem.decode(MsgArchiveEcosystem.encode(message.value as MsgArchiveEcosystem).finish())

    expect(message.typeUrl).toBe('/verana.ec.v1.MsgArchiveEcosystem')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      id: 7,
      archive,
    })
  })

  it('round-trips the V4 governance-framework document contract', () => {
    const message = buildEcosystemMessage(
      {
        msgType: 'MsgAddGovernanceFrameworkDocument',
        ecosystemId: '7',
        targetVersion: 2,
        docLanguage: 'fr',
        docUrl: 'https://example.com/framework-v2.pdf',
        docDigestSri: 'sha384-v2',
      },
      context
    )
    const value = MsgAddGovernanceFrameworkDocument.decode(
      MsgAddGovernanceFrameworkDocument.encode(message.value as MsgAddGovernanceFrameworkDocument).finish()
    )

    expect(message.typeUrl).toBe('/verana.gf.v1.MsgAddGovernanceFrameworkDocument')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      ecosystemId: 7,
      docLanguage: 'fr',
      docUrl: 'https://example.com/framework-v2.pdf',
      docDigestSri: 'sha384-v2',
      version: 2,
    })
  })

  it('round-trips the V4 governance-framework activation contract', () => {
    const message = buildEcosystemMessage(
      { msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion', ecosystemId: '7' },
      context
    )
    const value = MsgIncreaseActiveGovernanceFrameworkVersion.decode(
      MsgIncreaseActiveGovernanceFrameworkVersion.encode(
        message.value as MsgIncreaseActiveGovernanceFrameworkVersion
      ).finish()
    )

    expect(message.typeUrl).toBe('/verana.gf.v1.MsgIncreaseActiveGovernanceFrameworkVersion')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      ecosystemId: 7,
    })
  })
})
