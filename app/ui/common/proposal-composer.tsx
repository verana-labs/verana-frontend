'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import { GavelIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { FeeGrantRow, GroupMemberRow, GroupPolicy, OperatorAuthorizationRow } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { currentDecisionPolicyDraft, formatDecisionRule, readDecisionPolicyDraft } from '@/lib/decision-policy'
import { grantOptionLines, readGrantOptions } from '@/lib/operator-grant'
import type { CostLine } from '@/lib/tx-preview'
import { cn } from '@/lib/utils'
import {
  buildGrantOperatorMessage,
  buildRevokeOperatorMessage,
  buildUpdateCorporationMessage,
  buildUpdateDecisionPolicyMessage,
  buildUpdateMembersMessage,
  decisionPolicyChangeLines,
  type GroupMemberUpdate,
  memberChangeLines,
  useCorporationManage,
} from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { AddressIssueNote, addressIssue } from '@/ui/common/address-issue'
import { DecisionPolicyFields } from '@/ui/common/decision-policy-fields'
import { OperatorGrantOptionsFields, useOperatorGrantDraft } from '@/ui/common/operator-grant-options'
import { FIELD_CHECKBOX, FIELD_INPUT, FIELD_LABEL, FIELD_SELECT } from '@/ui/corporation/form-styles'
import { MsgTypeChips } from '@/ui/corporation/operators'
import { PartialNote } from '@/ui/corporation/shared'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'
import { isValidDID } from '@/util/validations'

const KINDS = ['grant', 'revoke', 'members', 'policy', 'rotate'] as const
type ComposerKind = (typeof KINDS)[number]

export function ProposalComposer({
  membership,
  policy,
  members,
  authorizations,
  feeGrants,
  partialGrants,
  onDone,
  onClose,
}: {
  membership: CorporationMembership
  policy: GroupPolicy
  members: GroupMemberRow[]
  authorizations: OperatorAuthorizationRow[]
  feeGrants: FeeGrantRow[]
  partialGrants: boolean
  onDone: () => void
  onClose: () => void
}) {
  const manage = useCorporationManage(onDone)
  const [kind, setKind] = useState<ComposerKind>('grant')
  const draft = useOperatorGrantDraft(feeGrants, authorizations)
  const { msgTypes, setMsgTypes } = draft
  const [memberUpdates, setMemberUpdates] = useState<GroupMemberUpdate[]>(
    members.map((member) => ({ address: member.address, weight: member.weight }))
  )
  const [policyDraft, setPolicyDraft] = useState(() => currentDecisionPolicyDraft(policy))
  const [did, setDid] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const policyAddress = membership.corporation.policyAddress
  const target = draft.target
  const granteeIssue = addressIssue(target, [])
  const granteeValid = target.length > 0 && granteeIssue === null
  const grantReading = readGrantOptions(draft.options)
  const trimmedUpdates = memberUpdates.map((update) => ({ ...update, address: update.address.trim() }))
  const updateIssues = trimmedUpdates.map((update, index) =>
    addressIssue(
      update.address,
      trimmedUpdates.slice(0, index).map((listed) => listed.address)
    )
  )
  const membersValid =
    trimmedUpdates.length > 0 &&
    trimmedUpdates.every(
      (update, index) => update.address.length > 0 && updateIssues[index] === null && /^\d+$/.test(update.weight)
    ) &&
    trimmedUpdates.some((update) => update.weight !== '0')
  const decisionPolicy = readDecisionPolicyDraft(policyDraft)

  const ready =
    kind === 'grant'
      ? granteeValid && msgTypes.length + draft.keptMsgTypes.length > 0 && grantReading.issue === null
      : kind === 'revoke'
        ? granteeValid
        : kind === 'members'
          ? membersValid
          : kind === 'policy'
            ? decisionPolicy !== null
            : isValidDID(did.trim())

  function compose(): { message: EncodeObject; title: string; costLines?: CostLine[]; effectKey?: string } {
    switch (kind) {
      case 'grant': {
        if (!grantReading.options) throw new Error(translate(grantReading.issue))
        return {
          message: buildGrantOperatorMessage(
            membership,
            target,
            [...msgTypes, ...draft.keptMsgTypes],
            policyAddress,
            grantReading.options
          ),
          title: `Grant operator authorization to ${target}`,
          costLines: grantOptionLines(grantReading.options, draft.existingFeeGrant !== undefined),
        }
      }
      case 'revoke':
        return {
          message: buildRevokeOperatorMessage(membership, target, policyAddress),
          title: `Revoke operator authorization of ${target}`,
        }
      case 'members':
        return {
          message: buildUpdateMembersMessage(membership, policy.groupId, trimmedUpdates),
          title: 'Update the group members',
          costLines: memberChangeLines(members, trimmedUpdates),
          effectKey: 'txconfirm.effect.proposal.members',
        }
      case 'policy': {
        if (!decisionPolicy) throw new Error('Invalid decision policy')
        const { rule, votingPeriodSeconds, minExecutionPeriodSeconds } = decisionPolicy
        const share = `${formatDecisionRule(rule)} of ${rule.kind === 'threshold' ? policy.totalWeight : 'the total weight'}`
        const delay = minExecutionPeriodSeconds > 0 ? `, executable ${minExecutionPeriodSeconds}s after submission` : ''
        return {
          message: buildUpdateDecisionPolicyMessage(membership, decisionPolicy),
          title: `Set the decision policy to ${share} over ${votingPeriodSeconds}s${delay}`,
          costLines: decisionPolicyChangeLines(policy, decisionPolicy),
          effectKey: 'txconfirm.effect.proposal.policy',
        }
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
      const { message, title, costLines, effectKey } = compose()
      if (await manage.propose(membership, message, title, costLines, effectKey)) {
        draft.reset()
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-muted/40 ring-1 ring-border/60">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <GavelIcon aria-hidden="true" className="size-3.5" />
          </span>
          {translate('corporation.composer.title')}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="gap-1 text-muted-foreground">
          <XIcon aria-hidden="true" />
          {translate('corporation.composer.close')}
        </Button>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        <label className={cn(FIELD_LABEL, 'max-w-sm')}>
          {translate('corporation.composer.kind')}
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as ComposerKind)}
            className={FIELD_SELECT}
          >
            {KINDS.map((entry) => (
              <option key={entry} value={entry}>
                {translate(`corporation.composer.kind.${entry}`)}
              </option>
            ))}
          </select>
        </label>

        {kind === 'grant' || kind === 'revoke' ? (
          <div className="max-w-xl">
            <label className={FIELD_LABEL}>
              {translate('corporation.composer.grantee')}
              <input
                value={draft.grantee}
                onChange={(event) => draft.setGrantee(event.target.value)}
                placeholder="verana1…"
                aria-invalid={granteeIssue ? true : undefined}
                className={cn(FIELD_INPUT, 'font-mono')}
              />
            </label>
            <AddressIssueNote issue={granteeIssue} />
          </div>
        ) : null}

        {kind === 'grant' ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              {translate('corporation.composer.msgtypes')}
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary tabular-nums">
                {msgTypes.length}/{OPERATOR_GRANT_MESSAGE_TYPES.length}
              </span>
            </legend>
            <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-border bg-background p-2 md:grid-cols-2 dark:bg-input/30">
              {OPERATOR_GRANT_MESSAGE_TYPES.map((msgType) => (
                <label
                  key={msgType}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs text-foreground transition-colors duration-(--duration-base) hover:bg-muted has-checked:text-primary"
                >
                  <input
                    type="checkbox"
                    checked={msgTypes.includes(msgType)}
                    onChange={(event) =>
                      setMsgTypes(
                        event.target.checked ? [...msgTypes, msgType] : msgTypes.filter((entry) => entry !== msgType)
                      )
                    }
                    className={FIELD_CHECKBOX}
                  />
                  <span className="truncate">{msgType.split('.Msg').pop()}</span>
                </label>
              ))}
            </div>
            {draft.keptMsgTypes.length > 0 ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">{translate('corporation.page.grant.kept')}</p>
                <MsgTypeChips typeUrls={draft.keptMsgTypes} />
              </div>
            ) : null}
          </fieldset>
        ) : null}

        {kind === 'grant' ? (
          <div>
            {partialGrants ? <PartialNote /> : null}
            <OperatorGrantOptionsFields
              value={draft.options}
              onChange={draft.setOptions}
              replacesFeeGrant={draft.existingFeeGrant !== undefined}
            />
            <AddressIssueNote issue={grantReading.issue} />
          </div>
        ) : null}

        {kind === 'members' ? (
          <div className="space-y-2">
            {memberUpdates.map((update, index) => (
              <div key={`update-${index}`}>
                <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-nowrap">
                  <input
                    value={update.address}
                    onChange={(event) =>
                      setMemberUpdates(
                        memberUpdates.map((entry, i) =>
                          i === index ? { ...entry, address: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="verana1…"
                    aria-invalid={updateIssues[index] ? true : undefined}
                    className={cn(FIELD_INPUT, 'grow basis-full font-mono sm:basis-auto')}
                  />
                  <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {translate('corporation.page.weight')}
                    <input
                      inputMode="numeric"
                      value={update.weight}
                      onChange={(event) =>
                        setMemberUpdates(
                          memberUpdates.map((entry, i) =>
                            i === index ? { ...entry, weight: event.target.value } : entry
                          )
                        )
                      }
                      className={cn(FIELD_INPUT, 'w-16 text-center tabular-nums')}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={translate('corporation.wizard.removemember')}
                    onClick={() => setMemberUpdates(memberUpdates.filter((_, i) => i !== index))}
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </div>
                <AddressIssueNote issue={updateIssues[index]} />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberUpdates([...memberUpdates, { address: '', weight: '1' }])}
              className="gap-1.5 bg-background"
            >
              <PlusIcon aria-hidden="true" />
              {translate('corporation.wizard.addmember')}
            </Button>
            <p className="text-xs text-muted-foreground">{translate('corporation.composer.members.note')}</p>
          </div>
        ) : null}

        {kind === 'policy' ? (
          <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <DecisionPolicyFields
              value={policyDraft}
              onChange={setPolicyDraft}
              totalWeight={Number(policy.totalWeight)}
            />
          </div>
        ) : null}

        {kind === 'rotate' ? (
          <label className={cn(FIELD_LABEL, 'max-w-xl')}>
            DID
            <input
              value={did}
              onChange={(event) => setDid(event.target.value)}
              placeholder="did:method:identifier"
              className={cn(FIELD_INPUT, 'font-mono')}
            />
          </label>
        ) : null}
      </div>
      <div className="flex justify-end border-t border-border px-4 py-3 sm:px-5">
        <Button type="button" size="lg" disabled={!ready || submitting} onClick={() => void submit()} className="gap-2">
          {submitting ? <Spinner aria-hidden="true" /> : <GavelIcon aria-hidden="true" />}
          {translate(submitting ? 'corporation.composer.submitting' : 'corporation.composer.submit')}
        </Button>
      </div>
    </div>
  )
}
