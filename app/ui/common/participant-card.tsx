'use client'

import {
  faChildReaching,
  faCopy,
  faCrown,
  faEye,
  faFileContract,
  faShieldHalved,
  faUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { mergeParticipantDetailActions, refreshParticipantSources, useParticipant } from '@/hooks/useParticipant'
import { useParticipantHistory } from '@/hooks/useParticipantHistory'
import { translate } from '@/i18n/dataview'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import ActionFieldButtonModal from '@/ui/common/action-field-button-modal'
import type { ActionFieldProps } from '@/ui/common/data-view-typed'
import ParticipantAttribute from '@/ui/common/participant-attribute'
import ParticipantTimeline from '@/ui/common/participant-timeline'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import TrustBadge from '@/ui/common/trust-badge'
import {
  type Participant,
  type ParticipantAction,
  type ParticipantItem,
  participantBusinessModels,
  participantLifecycleActions,
  participantOnboardingActions,
  participantSlashing,
  participantSlashingActions,
} from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import {
  formatDateTime,
  formatVNAFromUVNA,
  onboardingStateColor,
  participantStateBadgeClass,
  roleBadgeClass,
  shortenDID,
} from '@/util/util'

const ROLE_SINGULAR_KEY: Record<string, string> = {
  ECOSYSTEM: 'participantcard.role.singular.ecosystem',
  ISSUER_GRANTOR: 'participantcard.role.singular.issuergrantor',
  VERIFIER_GRANTOR: 'participantcard.role.singular.verifiergrantor',
  ISSUER: 'participantcard.role.singular.issuer',
  VERIFIER: 'participantcard.role.singular.verifier',
  HOLDER: 'participantcard.role.singular.holder',
}

function tr(key: string, fallback: string): string {
  return resolveTranslatable({ key }, translate) ?? fallback
}

function roleLabel(role: string): string {
  return tr(ROLE_SINGULAR_KEY[role] ?? '', role)
}

const accountActions: ParticipantAction[] = [
  { icon: faCopy, label: tr('participantcard.action.copy', 'copy'), value: 'copy' },
  {
    icon: faEye,
    label: tr('participantcard.action.visualizer', 'visualizer'),
    value: 'visualizer',
    visualizerTarget: 'account',
  },
  { icon: faUpRightFromSquare, label: tr('participantcard.action.explorer', 'explorer'), value: 'explorer' },
]

const didActions: ParticipantAction[] = [
  { icon: faCopy, label: tr('participantcard.action.copy', 'copy'), value: 'copy' },
  {
    icon: faEye,
    label: tr('participantcard.action.visualizer', 'visualizer'),
    value: 'visualizer',
    visualizerTarget: 'did',
  },
  { icon: faUpRightFromSquare, label: tr('participantcard.action.service', 'service'), value: 'service' },
]

const idActions: ParticipantAction[] = [
  { icon: faCopy, label: tr('participantcard.action.copy', 'copy'), value: 'copy' },
  {
    icon: faEye,
    label: tr('participantcard.action.visualizer', 'visualizer'),
    value: 'visualizer',
    visualizerTarget: 'participant',
  },
]

const metadataItems: ParticipantItem[] = [
  { label: 'DID', attr: 'did', mono: true, extraActions: didActions },
  { label: 'ID', attr: 'id', mono: true, extraActions: idActions },
  { label: tr('participantcard.meta.corporation', 'Corporation'), attr: 'corporation_id' },
  {
    label: tr('participantcard.meta.vsoperator', 'VS Operator'),
    attr: 'vs_operator',
    mono: true,
    extraActions: accountActions,
  },
  {
    label: tr('participantcard.meta.deposit', 'Deposit'),
    attr: 'deposit',
    mono: true,
    format: (value) => formatVNAFromUVNA(String(value)),
  },
  {
    label: tr('participantcard.meta.effectivefrom', 'Effective From'),
    attr: 'effective_from',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.meta.effectiveuntil', 'Effective Until'),
    attr: 'effective_until',
    format: (value) => formatDateTime(String(value)),
  },
  { label: tr('participantcard.meta.participants', 'Participants'), attr: 'participants' },
  { label: tr('participantcard.meta.weight', 'Weight'), attr: 'weight' },
  { label: tr('participantcard.meta.issued', 'Issued Credentials'), attr: 'issued' },
  { label: tr('participantcard.meta.verified', 'Verified Credentials'), attr: 'verified' },
]

const lifecycleItems: ParticipantItem[] = [
  {
    label: tr('participantcard.lifecycle.created', 'Created'),
    attr: 'created',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.lifecycle.modified', 'Modified'),
    attr: 'modified',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.lifecycle.adjusted', 'Adjusted'),
    attr: 'adjusted',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.lifecycle.revoked', 'Revoked'),
    attr: 'revoked',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.lifecycle.slashed', 'Slashed'),
    attr: 'slashed',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.lifecycle.repaid', 'Repaid'),
    attr: 'repaid',
    format: (value) => formatDateTime(String(value)),
  },
]

const onboardingItems: ParticipantItem[] = [
  {
    label: tr('participantcard.onboarding.expiration', 'OP Expiration'),
    attr: 'op_exp',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.onboarding.laststatechange', 'OP Last State Change'),
    attr: 'op_last_state_change',
    format: (value) => formatDateTime(String(value)),
  },
  {
    label: tr('participantcard.onboarding.validatordeposit', 'OP Validator Deposit'),
    attr: 'op_validator_deposit',
    mono: true,
    format: (value) => formatVNAFromUVNA(String(value)),
  },
  {
    label: tr('participantcard.onboarding.currentfees', 'OP Current Fees'),
    attr: 'op_current_fees',
    mono: true,
    format: (value) => formatVNAFromUVNA(String(value)),
  },
  {
    label: tr('participantcard.onboarding.currentdeposit', 'OP Current Deposit'),
    attr: 'op_current_deposit',
    mono: true,
    format: (value) => formatVNAFromUVNA(String(value)),
  },
  { label: tr('participantcard.onboarding.summarydigest', 'OP Summary Digest'), attr: 'op_summary_digest', mono: true },
]

function actionable(action: ParticipantAction): action is ParticipantAction & { name: string; value: string } {
  return Boolean(action.name && action.value)
}

function itemValue(participant: Participant, item: ParticipantItem): string | null {
  const raw = participant[item.attr]
  if (raw === null || raw === undefined || raw === '') return null
  const formatted = item.format?.(raw)
  if (typeof formatted === 'string' || typeof formatted === 'number') return String(formatted)
  return String(raw)
}

function AttributeGrid({
  participant,
  items,
  columns = 2,
}: {
  participant: Participant
  items: ParticipantItem[]
  columns?: 2 | 3
}) {
  return (
    <div className={`grid grid-cols-1 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
      {items.map((item) => {
        const value = itemValue(participant, item)
        if (value === null || (item.hiddenZero && Number(value) === 0)) return null
        return (
          <ParticipantAttribute
            key={item.attr}
            label={item.label}
            value={value}
            mono={item.mono}
            actions={item.extraActions}
          />
        )
      })}
    </div>
  )
}

type ParticipantCardProps = {
  selectedNode: TreeNode
  path: TreeNode[]
  schemaTitle: string
  viewerCorporationId?: number
  onRefresh?: (participant: Participant) => void
  onRefreshList?: () => void | Promise<void>
}

export default function ParticipantCard({
  selectedNode,
  path,
  schemaTitle,
  viewerCorporationId,
  onRefresh,
  onRefreshList,
}: ParticipantCardProps) {
  const participant = selectedNode.participant
  const participantId = participant?.id
  const did = participant?.did ?? undefined
  const { data: enrichment } = useDidTrustEnrichment(did)
  const { participant: refreshedParticipant, refetch } = useParticipant(participantId)
  const { participantHistory, refetch: refetchHistory } = useParticipantHistory(participantId)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const participantRef = useRef(participant)
  participantRef.current = participant

  useEffect(() => {
    const current = participantRef.current
    if (refreshedParticipant && current) {
      const merged = mergeParticipantDetailActions(current, refreshedParticipant)
      if (merged !== current) onRefresh?.(merged)
    }
  }, [onRefresh, refreshedParticipant])

  const detailBreadcrumb = useMemo(
    () =>
      path
        .filter((node) => !node.group)
        .slice(0, -1)
        .map((node) => node.name)
        .join(' → '),
    [path]
  )

  if (!participant) return null
  const currentParticipant = participant

  const serviceLabel = enrichment?.serviceName ?? (did ? shortenDID(did) : '')
  const organizationLabel = enrichment?.organizationName ?? (did ? shortenDID(did) : '')
  const corporationActions =
    viewerCorporationId === participant.corporation_id ? participant.corporation_available_actions : []
  const validatorActions = selectedNode.isValidator ? participant.validator_available_actions : []
  const allowed = new Set([...corporationActions, ...validatorActions])
  const state = participantStateBadgeClass(participant.participant_state, participant.expire_soon ?? false, 'header')
  const onboardingState = onboardingStateColor(
    participant.op_state,
    participant.op_exp,
    participant.expire_soon ?? false
  )
  const lifecycleActions = participantLifecycleActions.filter(
    (action) => !participantSlashingActions.some((slashing) => slashing.name === action.name)
  )

  function renderActions(actions: ParticipantAction[]) {
    return actions
      .filter(actionable)
      .filter((action) => allowed.has(action.name))
      .map((action) => {
        const field: ActionFieldProps = {
          name: action.name,
          label: action.label,
          value: action.value,
          icon: action.icon,
          iconColorClass: action.iconColorClass,
        }
        return (
          <ActionFieldButtonModal
            isActive={activeActionId === action.name}
            data={currentParticipant}
            field={field}
            key={action.name}
            onRefresh={(id) =>
              void refreshParticipantSources(id ?? currentParticipant.id, refetch, onRefreshList, refetchHistory)
            }
            onClickButton={() => setActiveActionId(activeActionId === action.name ? null : action.name)}
            onClose={() => setActiveActionId(null)}
          />
        )
      })
  }

  return (
    <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6">
      <div className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words">
              {tr('participantcard.header.title', `${roleLabel(participant.role)} role for schema ${schemaTitle}`)
                .replace('{role}', roleLabel(participant.role))
                .replace('{schema}', schemaTitle)}
            </h2>
            <FontAwesomeIcon icon={faCrown} className="text-yellow-500" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass(participant.role)}`}
            >
              {participant.role}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${state.classParticipantState}`}
            >
              {state.labelParticipantState}
            </span>
          </div>
        </div>
        {detailBreadcrumb ? <p className="text-sm text-neutral-70 mt-2">{detailBreadcrumb}</p> : null}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {tr('participantcard.grantedservice.title', 'Granted Service')}
          </h3>
          <div className="flex items-start space-x-4">
            <img src={serviceIdenticonUrl(did)} alt="" className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white break-words">{serviceLabel}</h4>
                <TrustBadge state={enrichment?.trustStatus} size="xl" />
              </div>
              {enrichment?.serviceDescription ? (
                <p className="text-sm text-neutral-70 mb-3">{enrichment.serviceDescription}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {enrichment?.serviceMinAge ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <FontAwesomeIcon icon={faChildReaching} className="text-neutral-70" />
                    {enrichment.serviceMinAge}
                  </span>
                ) : null}
                {enrichment?.serviceTermsUrl ? (
                  <a href={enrichment.serviceTermsUrl} target="_blank" rel="noreferrer" className="text-primary-600">
                    <FontAwesomeIcon icon={faFileContract} className="mr-1" />
                    {tr('participantcard.grantedservice.terms', 'Terms & Conditions')}
                  </a>
                ) : null}
                {enrichment?.servicePrivacyUrl ? (
                  <a href={enrichment.servicePrivacyUrl} target="_blank" rel="noreferrer" className="text-primary-600">
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
                    {tr('participantcard.grantedservice.privacy', 'Privacy Policy')}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {tr('participantcard.serviceprovider.title', 'Service Provider')}
          </h3>
          <div className="flex items-center space-x-3">
            <img src={serviceAvatarUrl(did)} alt="" className="w-6 h-6 rounded" />
            <h4 className="text-base font-medium text-gray-900 dark:text-white break-words">
              {organizationLabel || '—'}
            </h4>
            <TrustBadge state={enrichment?.trustStatus} size="lg" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold mb-4">{tr('participantcard.meta.title', 'Key Metadata')}</h3>
          <AttributeGrid participant={participant} items={metadataItems} />
        </div>
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold mb-4">
            {tr('participantcard.lifecycle.title', 'Participant Lifecycle')}
          </h3>
          <AttributeGrid participant={participant} items={lifecycleItems} />
          <div className="flex flex-wrap gap-3 mt-4">{renderActions(lifecycleActions)}</div>
        </div>
        {participant.op_state ? (
          <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{tr('participantcard.onboarding.title', 'Onboarding Process')}</h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${onboardingState.classOnboardingState}`}
              >
                {onboardingState.labelOnboardingState}
              </span>
            </div>
            <AttributeGrid participant={participant} items={onboardingItems} />
            <div className="flex flex-wrap gap-3 mt-4">{renderActions(participantOnboardingActions)}</div>
          </div>
        ) : null}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold mb-4">
            {tr('participantcard.businessmodels.title', 'Business Models')}
          </h3>
          <AttributeGrid participant={participant} items={participantBusinessModels} columns={3} />
        </div>
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold mb-4">{tr('participantcard.slashing.title', 'Slashing')}</h3>
          <AttributeGrid participant={participant} items={participantSlashing} />
          <div className="flex flex-wrap gap-3 mt-4">{renderActions(participantSlashingActions)}</div>
        </div>
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold mb-4">{tr('participantcard.timeline.title', 'Activity Timeline')}</h3>
          {participantHistory.length ? (
            <div className="space-y-4">
              {participantHistory.map((history, index) => (
                <ParticipantTimeline participantHistory={history} key={`${history.block_height}-${index}`} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-70">{tr('participantcard.timeline.empty', 'No activity yet.')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
