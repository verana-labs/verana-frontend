import { describe, expect, it } from 'vitest'
import { groupMsgTypes } from './msg-type-groups'

describe('groupMsgTypes', () => {
  it('groups by module in first-seen order and strips the Msg prefix', () => {
    const groups = groupMsgTypes([
      '/verana.co.v1.MsgUpdateCorporation',
      '/verana.ec.v1.MsgCreateEcosystem',
      '/verana.ec.v1.MsgArchiveEcosystem',
      '/cosmos.group.v1.MsgVote',
    ])
    expect(groups.map((group) => group.module)).toEqual(['co', 'ec', 'group'])
    expect(groups[1].entries.map((entry) => entry.name)).toEqual(['CreateEcosystem', 'ArchiveEcosystem'])
    expect(groups[2].entries[0]).toEqual({ typeUrl: '/cosmos.group.v1.MsgVote', name: 'Vote' })
  })

  it('falls back to an other module for unqualified names', () => {
    expect(groupMsgTypes(['MsgSomething'])).toEqual([
      { module: 'other', entries: [{ typeUrl: 'MsgSomething', name: 'Something' }] },
    ])
  })
})
