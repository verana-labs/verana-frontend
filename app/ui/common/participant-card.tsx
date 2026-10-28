'use client'

import { faCopy, faCrown, faEye, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion } from 'framer-motion'
import {
  BabyIcon,
  BadgeCheckIcon,
  CoinsIcon,
  FileTextIcon,
  HistoryIcon,
  InfoIcon,
  type LucideIcon,
  RouteIcon,
  ScanSearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersIcon,
  WorkflowIcon,
  XIcon,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useCredentialSchemaData } from '@/hooks/useCredentialSchemaData'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { mergeParticipantDetailActions, refreshParticipantSources, useParticipant } from '@/hooks/useParticipant'
import { useParticipantHistory } from '@/hooks/useParticipantHistory'
import { translate } from '@/i18n/dataview'
import { FEE_BEARING_PARTICIPANT_ACTIONS, formatSchemaAmount, isNativePricing } from '@/lib/pricing-asset'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import ActionFieldButtonModal from '@/ui/common/action-field-button-modal'
import ClaimText from '@/ui/common/claim-text'
import type { ActionFieldProps } from '@/ui/common/data-view-typed'
import { FeeDistributionPreview } from '@/ui/common/fee-distribution'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import LogoImage from '@/ui/common/logo-image'
import ParticipantAttribute from '@/ui/common/participant-attribute'
import ParticipantTimeline from '@/ui/common/participant-timeline'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import { feeBlockedReasonFor, PricingNotice } from '@/ui/common/pricing-notice'
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
import { Shimmer } from '@/ui/motion/shimmer'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Timeline } from '@/ui/participants/timeline'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  countryCodeToFlag,
  formatDateTime,
  formatVNAFromUVNA,
  isExpireSoon,
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

const PILL = 'h-auto rounded-full px-2.5 py-0.5 font-medium'

function tr(key: string, fallback: string): string {
  return resolveTranslatable({ key }, translate) ?? fallback
}

function roleLabel(role: string): string {
  return tr(ROLE_SINGULAR_KEY[role] ?? '', role)
}

export function participantCardTitle(participant: Participant, schemaTitle: string): string {
  return tr('participantcard.header.title', `${roleLabel(participant.role)} role for schema ${schemaTitle}`)
    .replace('{role}', roleLabel(participant.role))
    .replace('{schema}', schemaTitle)
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
  { label: tr('participantcard.meta.ecosystem', 'Ecosystem'), attr: 'ecosystem_id', hiddenZero: true },
  {
    label: tr('participantcard.meta.vsoperator', 'VS Operator'),
    attr: 'vs_operator',
    mono: true,
    extraActions: accountActions,
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
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-6 gap-y-4',
        columns === 3 ? '@lg/card:grid-cols-3' : '@md/card:grid-cols-2'
      )}
    >
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
    </dl>
  )
}

function Section({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-t px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Actions({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null
  return <div className="mt-5 flex flex-wrap items-start gap-2">{children}</div>
}

function StatTile({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('min-w-0 rounded-lg border bg-card px-3 py-2.5', className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-lg font-semibold tracking-tight text-foreground tabular-nums">{children}</dd>
    </div>
  )
}

const LEAF_ROLES = new Set(['VERIFIER', 'HOLDER'])

function countOf(value: string | number | undefined): string {
  const parsed = Number(value ?? 0)
  return (Number.isFinite(parsed) ? parsed : 0).toLocaleString()
}

type ParticipantCardProps = {
  selectedNode: TreeNode
  path: TreeNode[]
  schemaTitle: string
  pricingNoticeShown?: boolean
  viewerCorporationId?: number
  embedded?: boolean
  onClose?: () => void
  onRefresh?: (participant: Participant) => void
  onRefreshList?: () => void | Promise<void>
}

export default function ParticipantCard({
  selectedNode,
  path,
  schemaTitle,
  pricingNoticeShown = false,
  viewerCorporationId,
  embedded = false,
  onClose,
  onRefresh,
  onRefreshList,
}: ParticipantCardProps) {
  const participant = selectedNode.participant
  const participantId = participant?.id
  const did = participant?.did ?? undefined
  const { data: enrichment } = useDidTrustEnrichment(did)
  const { participant: refreshedParticipant, refetch } = useParticipant(participantId)
  const {
    participantHistory,
    loading: historyLoading,
    errorParticipantHistory,
    refetch: refetchHistory,
    hasNext: historyHasNext,
    loadMore: loadMoreHistory,
  } = useParticipantHistory(participantId)
  const {
    credentialSchema,
    loading: schemaLoading,
    errorCredentialSchema,
  } = useCredentialSchemaData(participant?.schema_id ?? '')
  const feeBlockedReason = feeBlockedReasonFor(credentialSchema)
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
  const state = participantStateBadgeClass(
    participant.participant_state,
    isExpireSoon(participant.effective_until),
    'header'
  )
  const onboardingState = onboardingStateColor(participant.op_state)
  const pricingSettled = !schemaLoading && (credentialSchema !== null || errorCredentialSchema !== null)
  const feeActionBlocked =
    pricingSettled &&
    Boolean(feeBlockedReason) &&
    [...allowed].some((name) => FEE_BEARING_PARTICIPANT_ACTIONS.has(name))
  const businessModels = participantBusinessModels.map((item) => ({
    ...item,
    format: (value: Participant[keyof Participant]) => formatSchemaAmount(String(value), credentialSchema),
  }))

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
            blockedReason={FEE_BEARING_PARTICIPANT_ACTIONS.has(action.name) ? feeBlockedReason : undefined}
          />
        )
      })
  }

  const title = participantCardTitle(participant, schemaTitle)
  const leaf = LEAF_ROLES.has(participant.role)
  const countSpan = leaf ? '@md/card:col-span-3' : '@md/card:col-span-2'
  const historyEmpty = participantHistory.length === 0

  return (
    <motion.section
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base, ease: EASE.standard }}
      className={cn(
        '@container/card text-sm text-card-foreground',
        !embedded && 'overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10'
      )}
    >
      <header className="px-5 pt-5 pb-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className={cn('flex flex-wrap gap-1.5', !embedded && 'mb-3')}>
              <Badge variant="secondary" className={cn(PILL, roleBadgeClass(participant.role))}>
                {participant.role}
              </Badge>
              <Badge variant="secondary" className={cn(PILL, state.classParticipantState)}>
                {state.labelParticipantState}
              </Badge>
              {state.expireSoon ? (
                <Badge variant="secondary" className={cn(PILL, state.expireSoon.classExpireSoon)}>
                  {state.expireSoon.labelExpireSoon}
                </Badge>
              ) : null}
            </div>
            <div className={cn('flex items-center gap-2', embedded && 'sr-only')}>
              <h2 className="text-lg font-semibold tracking-tight text-foreground break-words">{title}</h2>
              <FontAwesomeIcon icon={faCrown} className="size-4 shrink-0 text-yellow-500" aria-hidden="true" />
            </div>
            {detailBreadcrumb ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground break-all">
                <RouteIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {detailBreadcrumb}
              </p>
            ) : null}
          </div>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={translate('common.close')}
              className="-me-1.5 -mt-1 text-muted-foreground"
            >
              <XIcon />
            </Button>
          ) : null}
        </div>

        <div className="mt-5 rounded-xl border bg-muted/40">
          <div className="flex items-start gap-4 p-4">
            <LogoImage
              src={enrichment?.serviceLogoUrl}
              fallbackSrc={serviceIdenticonUrl(did)}
              className="size-14 shrink-0 rounded-xl bg-background object-contain ring-1 ring-foreground/10"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {tr('participantcard.grantedservice.title', 'Granted Service')}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground break-words">{serviceLabel}</h4>
                <TrustBadge state={enrichment?.trustStatus} size="lg" />
              </div>
              {enrichment?.serviceDescription ? (
                <ClaimText
                  text={enrichment.serviceDescription}
                  format={enrichment.serviceDescriptionFormat}
                  className="mt-1 text-sm text-muted-foreground"
                />
              ) : null}
              {enrichment?.serviceMinAge || enrichment?.serviceTermsUrl || enrichment?.servicePrivacyUrl ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {enrichment?.serviceMinAge ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2 py-1 ring-1 ring-foreground/10">
                      <BabyIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      {enrichment.serviceMinAge}
                    </span>
                  ) : null}
                  {enrichment?.serviceTermsUrl ? (
                    <a
                      href={enrichment.serviceTermsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-primary hover:underline"
                    >
                      <FileTextIcon aria-hidden="true" className="size-3.5" />
                      {tr('participantcard.grantedservice.terms', 'Terms & Conditions')}
                    </a>
                  ) : null}
                  {enrichment?.servicePrivacyUrl ? (
                    <a
                      href={enrichment.servicePrivacyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-primary hover:underline"
                    >
                      <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
                      {tr('participantcard.grantedservice.privacy', 'Privacy Policy')}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-3">
            <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {tr('participantcard.serviceprovider.title', 'Service Provider')}
            </h3>
            <div className="flex min-w-0 items-center gap-2">
              <LogoImage
                src={enrichment?.organizationLogoUrl}
                fallbackSrc={serviceAvatarUrl(did)}
                className="size-5 shrink-0 rounded object-contain"
              />
              <h4 className="text-sm font-medium text-foreground break-words">{organizationLabel || '—'}</h4>
              {!enrichment?.organizationName && did ? <span className="sr-only">Unverified organization</span> : null}
              {enrichment?.countryCode ? (
                <span className="shrink-0 text-base leading-none" aria-hidden="true">
                  {countryCodeToFlag(enrichment.countryCode)}
                </span>
              ) : null}
              <TrustBadge state={enrichment?.trustStatus} size="md" />
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 @md/card:grid-cols-6">
          <StatTile label={tr('participantcard.meta.issued', 'Issued Credentials')} className={countSpan}>
            {countOf(participant.issued)}
          </StatTile>
          <StatTile label={tr('participantcard.meta.verified', 'Verified Credentials')} className={countSpan}>
            {countOf(participant.verified)}
          </StatTile>
          {leaf ? null : (
            <StatTile label={tr('participantcard.meta.participants', 'Participants')} className={countSpan}>
              {countOf(participant.participants)}
            </StatTile>
          )}
          <StatTile label={tr('participantcard.meta.deposit', 'Deposit')} className="@md/card:col-span-3">
            <span className="font-mono text-base">{formatVNAFromUVNA(String(participant.deposit ?? 0))}</span>
          </StatTile>
          <StatTile
            label={tr('participantcard.meta.weight', 'Weight')}
            className={cn('@md/card:col-span-3', !leaf && 'col-span-2')}
          >
            <span className="font-mono text-base">{formatVNAFromUVNA(String(participant.weight ?? 0))}</span>
          </StatTile>
        </dl>
      </header>

      <Section icon={InfoIcon} title={tr('participantcard.meta.title', 'Key Metadata')}>
        <AttributeGrid participant={participant} items={metadataItems} />
      </Section>

      <Section icon={WorkflowIcon} title={tr('participantcard.lifecycle.title', 'Participant Lifecycle')}>
        <AttributeGrid participant={participant} items={lifecycleItems} />
        <Actions>{renderActions(lifecycleActions)}</Actions>
      </Section>

      {participant.op_state ? (
        <Section
          icon={ScanSearchIcon}
          title={tr('participantcard.onboarding.title', 'Onboarding Process')}
          aside={
            <Badge variant="secondary" className={cn(PILL, onboardingState.classOnboardingState)}>
              {onboardingState.labelOnboardingState}
            </Badge>
          }
        >
          <AttributeGrid participant={participant} items={onboardingItems} />
          {feeActionBlocked && !pricingNoticeShown ? (
            <PricingNotice schema={credentialSchema ?? null} className="mt-4" />
          ) : null}
          <Actions>{renderActions(participantOnboardingActions)}</Actions>
        </Section>
      ) : null}

      <Section icon={CoinsIcon} title={tr('participantcard.businessmodels.title', 'Business Models')}>
        <AttributeGrid participant={participant} items={businessModels} columns={3} />
        {credentialSchema && isNativePricing(credentialSchema) ? (
          <FeeDistributionPreview participant={participant} />
        ) : null}
      </Section>

      <Section icon={ShieldAlertIcon} title={tr('participantcard.slashing.title', 'Slashing')}>
        <AttributeGrid participant={participant} items={participantSlashing} />
        <Actions>{renderActions(participantSlashingActions)}</Actions>
      </Section>

      <Section icon={HistoryIcon} title={tr('participantcard.timeline.title', 'Activity Timeline')}>
        {historyEmpty && historyLoading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-3">
                <Shimmer className="size-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-1">
                  <Shimmer className="h-3.5 w-40" />
                  <Shimmer className="h-3 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : historyEmpty && errorParticipantHistory ? (
          <p className="flex items-start gap-2 text-sm text-foreground">
            <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            {translate('activity.unavailable')}
          </p>
        ) : historyEmpty ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheckIcon aria-hidden="true" className="size-4" />
            {tr('participantcard.timeline.empty', 'No activity yet.')}
          </p>
        ) : (
          <>
            <Timeline>
              {participantHistory.map((history, index) => (
                <ParticipantTimeline
                  participantHistory={history}
                  feePricing={credentialSchema}
                  key={`${history.block_height}-${index}`}
                />
              ))}
            </Timeline>
            {historyHasNext ? (
              <div className="mt-3 ms-8">
                <ShowMoreButton onClick={loadMoreHistory} />
              </div>
            ) : null}
          </>
        )}
      </Section>
    </motion.section>
  )
}

export function ParticipantCardPlaceholder() {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UsersIcon aria-hidden="true" className="size-5" />
      </div>
      <p className="max-w-56 text-sm text-muted-foreground">
        {tr('participants.tree.selectHint', 'Select a participant to see its details.')}
      </p>
    </div>
  )
}
