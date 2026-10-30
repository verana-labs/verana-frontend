'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  BadgeCheckIcon,
  BarChart3Icon,
  ChevronRightIcon,
  CoinsIcon,
  FolderIcon,
  HandshakeIcon,
  type LucideIcon,
  ScaleIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  WalletIcon,
} from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import { formatSchemaAmount, type SchemaPricing } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import ServiceIdentity from '@/ui/common/service-identity'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'
import {
  formatVNAFromUVNA,
  isExpireSoon,
  onboardingStateColor,
  participantStateBadgeClass,
  roleBadgeClass,
} from '@/util/util'

export type TreeNodeHeaderProps = {
  node: TreeNode
  type: 'participants' | 'tasks'
  isExpanded: boolean
  isSelected?: boolean
  childCount?: string
  showWeight: boolean
  showBusiness: boolean
  showStats: boolean
  onToggle: (id: string, role?: string, validatorId?: string) => void
  onJoin: (node: TreeNode) => void
  joinBlockedReason?: string
  feePricing?: SchemaPricing
  onConnect?: () => void
}

const ROLE_ICON: Record<string, LucideIcon> = {
  ISSUER_GRANTOR: ShieldCheckIcon,
  VERIFIER_GRANTOR: ShieldIcon,
  ISSUER: BadgeCheckIcon,
  VERIFIER: ScanSearchIcon,
  HOLDER: WalletIcon,
}

const PILL = 'h-5 rounded-full px-2 font-medium'

const NAME_TRUNCATE = 'min-w-0 [&>span:nth-child(2)]:truncate [&>span:nth-child(2)]:break-normal'

function JoinButton({
  action,
  blockedReason,
  onClick,
}: {
  action: string
  blockedReason?: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const { mode, disabled, reason } = useActionSigning(action)
  const shownReason = blockedReason ?? reason
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="gap-1.5 bg-card px-2 text-xs disabled:pointer-events-auto disabled:cursor-not-allowed"
      disabled={disabled || Boolean(blockedReason)}
      title={shownReason}
      onClick={onClick}
    >
      <HandshakeIcon aria-hidden="true" />
      {resolveTranslatable({ key: 'participants.btn.join' }, translate)}
      <SigningModeIcon mode={mode} />
      {shownReason ? <span className="sr-only">{shownReason}</span> : null}
    </Button>
  )
}

function authorityLabelKey(node: TreeNode): string | undefined {
  if (node.isValidator) return 'participants.authority.validator'
  if (node.isCorporation) return 'participants.authority.corporation'
  if (node.isPredecessor) return 'participants.authority.predecessor'
}

function AuthorityIcon({ node }: { node: TreeNode }) {
  const key = authorityLabelKey(node)
  if (!key) return null
  const label = resolveTranslatable({ key }, translate) ?? ''
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <FontAwesomeIcon icon={node.icon} className={cn('size-3.5', node.iconColorClass)} aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Metric({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      {children}
    </span>
  )
}

export default function TreeNodeHeader({
  node,
  type,
  isExpanded,
  isSelected = false,
  childCount,
  showWeight,
  showBusiness,
  showStats,
  onToggle,
  onJoin,
  joinBlockedReason,
  feePricing,
  onConnect,
}: TreeNodeHeaderProps) {
  const hasChildren = Boolean(node.children?.length)
  const participant = node.participant
  const participantState = participantStateBadgeClass(
    participant?.participant_state,
    isExpireSoon(participant?.effective_until)
  )
  const onboardingState = onboardingStateColor(participant?.op_state)
  const showParticipantState = type === 'participants' || participantState.expireSoon !== null

  const fee = (value: string | number | undefined) =>
    feePricing ? formatSchemaAmount(value ?? 0, feePricing) : formatVNAFromUVNA(String(value ?? 0))

  let trailing: ReactNode = null
  if (type === 'participants') {
    if (!node.group && participant && (showWeight || showBusiness || showStats)) {
      trailing = (
        <div className="flex flex-wrap items-center gap-1.5 ms-auto">
          {showWeight ? <Metric icon={ScaleIcon}>{formatVNAFromUVNA(String(participant.weight ?? 0))}</Metric> : null}
          {showBusiness ? (
            <Metric icon={CoinsIcon}>
              {`validation: ${fee(participant.validation_fees)} | issuance: ${fee(participant.issuance_fees)} | verification: ${fee(participant.verification_fees)}`}
            </Metric>
          ) : null}
          {showStats ? (
            <Metric
              icon={BarChart3Icon}
            >{`issued: ${participant.issued ?? 0} | verified: ${participant.verified ?? 0}`}</Metric>
          ) : null}
        </div>
      )
    } else if (node.group) {
      trailing = (
        <div className="flex flex-wrap items-center gap-2 ms-auto">
          {node.onboardingLabel ? (
            <Badge variant="secondary" className={cn(PILL, node.iconColorClass)}>
              {node.onboardingLabel}
            </Badge>
          ) : null}
          {node.enabledJoin ? (
            <JoinButton
              action={node.onboardingAction ?? ''}
              blockedReason={node.onboardingAction === 'LinkDID' ? undefined : joinBlockedReason}
              onClick={(event) => {
                event.stopPropagation()
                if (node.onboardingAction === 'LinkDID') {
                  onJoin(node)
                } else if (node.onboardingAction === 'Connect') {
                  onConnect?.()
                } else {
                  onJoin(node)
                  onToggle(node.nodeId, node.type, node.parentId)
                }
              }}
            />
          ) : null}
        </div>
      )
    }
  }

  const RoleIcon = ROLE_ICON[node.type ?? ''] ?? FolderIcon

  return (
    <div
      className={cn(
        'flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg py-1.5 pe-2 transition-colors duration-(--duration-base) ease-standard',
        'group-hover/row:bg-muted/60 group-focus-visible/row:ring-[3px] group-focus-visible/row:ring-ring/50',
        isSelected && 'bg-(--selected) ring-1 ring-primary/15 ring-inset group-hover/row:bg-(--selected)'
      )}
    >
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-2">
        {hasChildren || node.group ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(node.nodeId, node.type, node.parentId)
            }}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle"
          >
            <ChevronRightIcon
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform duration-(--duration-base) ease-standard rtl:rotate-180',
                isExpanded && 'rotate-90 rtl:rotate-90'
              )}
            />
          </button>
        ) : (
          <span aria-hidden="true" className="size-5 shrink-0" />
        )}

        {node.group ? (
          node.serviceDid || node.serviceTitle ? (
            <>
              <ServiceIdentity
                did={node.serviceDid}
                enrichment={node.serviceTrustData}
                fallbackName={node.serviceTitle ?? node.name}
                showFlag={Boolean(node.serviceDid)}
                showTrust={Boolean(node.serviceDid)}
                className={NAME_TRUNCATE}
              />
              {node.badgeCount ? (
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">({node.badgeCount})</span>
              ) : null}
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', node.iconColorClass)}
              >
                <RoleIcon className="size-3.5" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-foreground">{node.name}</span>
              {childCount ? (
                <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {childCount}
                </span>
              ) : null}
            </>
          )
        ) : (
          <>
            <ServiceIdentity
              did={participant?.did ?? undefined}
              enrichment={participant?.trustData}
              fallbackName={node.name}
              className={cn(NAME_TRUNCATE, isSelected && '[&>span:nth-child(2)]:text-primary')}
            />
            <AuthorityIcon node={node} />
          </>
        )}

        {showParticipantState && !node.group && participant?.participant_state ? (
          <span className="flex shrink-0 items-center gap-1">
            <Badge variant="secondary" className={cn(PILL, participantState.classParticipantState)}>
              {participantState.labelParticipantState}
            </Badge>
            {participantState.expireSoon ? (
              <Badge variant="secondary" className={cn(PILL, participantState.expireSoon.classExpireSoon)}>
                {participantState.expireSoon.labelExpireSoon}
              </Badge>
            ) : null}
          </span>
        ) : null}
        {type === 'tasks' && participant?.op_state ? (
          <span className="flex shrink-0 items-center gap-1">
            <Badge variant="secondary" className={cn(PILL, onboardingState.classOnboardingState)}>
              {onboardingState.labelOnboardingState}
            </Badge>
            <Badge variant="secondary" className={cn(PILL, roleBadgeClass(participant.role))}>
              {participant.role}
            </Badge>
          </span>
        ) : null}
      </div>
      {trailing}
    </div>
  )
}
