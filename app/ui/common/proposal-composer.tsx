'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { GroupMemberRow, GroupPolicy } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import {
  buildGrantOperatorMessage,
  buildRevokeOperatorMessage,
  buildUpdateCorporationMessage,
  buildUpdateDecisionPolicyMessage,
  buildUpdateMembersMessage,
  type GroupMemberUpdate,
  useCorporationManage,
} from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { ThresholdHint } from '@/ui/common/threshold-hint'
import { isValidDID } from '@/util/validations'

const KINDS = ['grant', 'revoke', 'members', 'policy', 'rotate'] as const
type ComposerKind = (typeof KINDS)[number]

const inputClass =
  'mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface'

export function ProposalComposer({
  membership,
  policy,
  members,
  onDone,
  onClose,
}: {
  membership: CorporationMembership
  policy: GroupPolicy
  members: GroupMemberRow[]
  onDone: () => void
  onClose: () => void
}) {
  const manage = useCorporationManage(onDone)
  const [kind, setKind] = useState<ComposerKind>('grant')
  const [grantee, setGrantee] = useState('')
  const [msgTypes, setMsgTypes] = useState<string[]>([...OPERATOR_GRANT_MESSAGE_TYPES])
  const [memberUpdates, setMemberUpdates] = useState<GroupMemberUpdate[]>(
    members.map((member) => ({ address: member.address, weight: member.weight }))
  )
  const [threshold, setThreshold] = useState(policy.threshold ?? '1')
  const [votingPeriod, setVotingPeriod] = useState(policy.votingPeriod?.replace(/s$/, '') ?? '60')
  const [did, setDid] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const policyAddress = membership.corporation.policyAddress
  const granteeValid = grantee.trim().startsWith('verana1')
  const membersValid =
    memberUpdates.length > 0 &&
    memberUpdates.every((update) => update.address.startsWith('verana1') && /^\d+$/.test(update.weight)) &&
    memberUpdates.some((update) => update.weight !== '0')
  const policyValid = /^[1-9]\d*$/.test(threshold) && /^[1-9]\d*$/.test(votingPeriod)

  const ready =
    kind === 'grant'
      ? granteeValid && msgTypes.length > 0
      : kind === 'revoke'
        ? granteeValid
        : kind === 'members'
          ? membersValid
          : kind === 'policy'
            ? policyValid
            : isValidDID(did.trim())

  function compose(): { message: EncodeObject; title: string } {
    const target = grantee.trim()
    switch (kind) {
      case 'grant':
        return {
          message: buildGrantOperatorMessage(membership, target, msgTypes, policyAddress),
          title: `Grant operator authorization to ${target}`,
        }
      case 'revoke':
        return {
          message: buildRevokeOperatorMessage(membership, target, policyAddress),
          title: `Revoke operator authorization of ${target}`,
        }
      case 'members':
        return {
          message: buildUpdateMembersMessage(membership, policy.groupId, memberUpdates),
          title: 'Update the group members',
        }
      case 'policy':
        return {
          message: buildUpdateDecisionPolicyMessage(membership, threshold, Number(votingPeriod)),
          title: `Set the decision policy to ${threshold} of ${policy.totalWeight} over ${votingPeriod}s`,
        }
      default:
        return {
          message: buildUpdateCorporationMessage(membership, did.trim(), policyAddress),
          title: `Rotate the corporation DID to ${did.trim()}`,
        }
    }
  }

  async function submit() {
    setSubmitting(true)
    try {
      const { message, title } = compose()
      if (await manage.propose(membership, message, title)) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-4 border border-neutral-20 dark:border-neutral-70 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {translate('corporation.composer.title')}
        </h3>
        <button type="button" onClick={onClose} className="text-sm text-gray-500 dark:text-gray-400">
          {translate('corporation.composer.close')}
        </button>
      </div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block max-w-sm">
        {translate('corporation.composer.kind')}
        <select value={kind} onChange={(event) => setKind(event.target.value as ComposerKind)} className={inputClass}>
          {KINDS.map((entry) => (
            <option key={entry} value={entry}>
              {translate(`corporation.composer.kind.${entry}`)}
            </option>
          ))}
        </select>
      </label>

      {kind === 'grant' || kind === 'revoke' ? (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block max-w-xl mt-3">
          {translate('corporation.composer.grantee')}
          <input
            value={grantee}
            onChange={(event) => setGrantee(event.target.value)}
            placeholder="verana1…"
            className={inputClass}
          />
        </label>
      ) : null}

      {kind === 'grant' ? (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translate('corporation.composer.msgtypes')} ({msgTypes.length}/{OPERATOR_GRANT_MESSAGE_TYPES.length})
          </legend>
          <div className="mt-2 max-h-44 overflow-y-auto border border-neutral-20 dark:border-neutral-70 rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
            {OPERATOR_GRANT_MESSAGE_TYPES.map((msgType) => (
              <label
                key={msgType}
                className="flex items-center gap-2 text-xs font-mono text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={msgTypes.includes(msgType)}
                  onChange={(event) =>
                    setMsgTypes(
                      event.target.checked ? [...msgTypes, msgType] : msgTypes.filter((entry) => entry !== msgType)
                    )
                  }
                />
                <span className="truncate">{msgType.split('.Msg').pop()}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {kind === 'members' ? (
        <div className="mt-3 space-y-2">
          {memberUpdates.map((update, index) => (
            <div key={`update-${index}-${update.address}`} className="flex items-center gap-2 text-sm">
              <input
                value={update.address}
                onChange={(event) =>
                  setMemberUpdates(
                    memberUpdates.map((entry, i) => (i === index ? { ...entry, address: event.target.value } : entry))
                  )
                }
                placeholder="verana1…"
                className="grow px-2 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface font-mono"
              />
              <label className="text-gray-500 dark:text-gray-400">
                {translate('corporation.page.weight')}
                <input
                  value={update.weight}
                  onChange={(event) =>
                    setMemberUpdates(
                      memberUpdates.map((entry, i) => (i === index ? { ...entry, weight: event.target.value } : entry))
                    )
                  }
                  className="ml-2 w-16 px-2 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
                />
              </label>
              <button
                type="button"
                aria-label={translate('corporation.wizard.removemember')}
                onClick={() => setMemberUpdates(memberUpdates.filter((_, i) => i !== index))}
                className="text-red-500 px-2"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMemberUpdates([...memberUpdates, { address: '', weight: '1' }])}
            className="text-sm font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            {translate('corporation.wizard.addmember')}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">{translate('corporation.composer.members.note')}</p>
        </div>
      ) : null}

      {kind === 'policy' ? (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {translate('corporation.page.threshold')}
              <input value={threshold} onChange={(event) => setThreshold(event.target.value)} className={inputClass} />
            </label>
            <ThresholdHint threshold={Number(threshold)} totalWeight={Number(policy.totalWeight)} />
          </div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translate('corporation.wizard.votingperiod')}
            <input
              value={votingPeriod}
              onChange={(event) => setVotingPeriod(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      ) : null}

      {kind === 'rotate' ? (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block max-w-xl mt-3">
          DID
          <input
            value={did}
            onChange={(event) => setDid(event.target.value)}
            placeholder="did:method:identifier"
            className={inputClass}
          />
        </label>
      ) : null}

      <button
        type="button"
        disabled={!ready || submitting}
        onClick={() => void submit()}
        className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60"
      >
        {translate(submitting ? 'corporation.composer.submitting' : 'corporation.composer.submit')}
      </button>
    </div>
  )
}
