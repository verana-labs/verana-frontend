'use client'

import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { countryCodeToFlag, formatVNAFromUVNA, participantStateBadgeClass, shortenDID } from '@/util/util'

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ')
}

export type ValidatorCardProps = {
  validator: Participant
  selected?: boolean
  onSelect?: () => void
}

export default function ValidatorCard({ validator, selected = false, onSelect }: ValidatorCardProps) {
  const identity = validator.trustData
  const did = validator.did ?? undefined
  const serviceName = identity?.serviceName ?? (did ? shortenDID(did) : '—')
  const orgName = identity?.organizationName
  const { labelParticipantState, classParticipantState } = participantStateBadgeClass(
    validator.participant_state,
    validator.expire_soon ?? false
  )

  const feeLabel = validator.issuance_fees ? 'Issuance Fee' : 'Verification Fee'
  const feeValue = validator.issuance_fees
    ? formatVNAFromUVNA(String(validator.issuance_fees))
    : validator.verification_fees
      ? formatVNAFromUVNA(String(validator.verification_fees))
      : '—'

  return (
    <div
      onClick={onSelect}
      className={cn(
        'border-2 rounded-xl p-4 transition-all',
        onSelect ? 'cursor-pointer' : 'cursor-default',
        selected
          ? 'border-primary-600 shadow-[0_0_0_3px_rgba(118,62,240,0.2)]'
          : 'border-neutral-20 dark:border-neutral-70',
        'hover:border-primary-300 dark:hover:border-primary-600'
      )}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : -1}
      aria-pressed={onSelect ? selected : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onSelect) onSelect()
      }}
    >
      <div className="flex items-start space-x-3">
        {onSelect && (
          <input
            type="radio"
            checked={selected}
            readOnly
            className="mt-1 w-4 h-4 text-primary-600 flex-shrink-0"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <LogoImage
          src={identity?.serviceLogoUrl}
          fallbackSrc={serviceIdenticonUrl(did)}
          className="w-10 h-10 rounded-lg flex-shrink-0 object-contain"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white" title={serviceName}>
                {serviceName}
              </h3>
              {orgName ? (
                <span className="mt-1 flex min-w-0 items-center gap-1.5">
                  <LogoImage
                    src={identity?.organizationLogoUrl}
                    fallbackSrc={serviceAvatarUrl(orgName)}
                    className="w-4 h-4 rounded flex-shrink-0 object-contain"
                  />
                  <span className="truncate text-xs text-neutral-70 dark:text-neutral-70" title={orgName}>
                    {orgName}
                  </span>
                </span>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">
                {countryCodeToFlag(identity?.countryCode)}
              </span>
              <TrustBadge state={identity?.trustStatus} size="lg" />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classParticipantState}`}
              >
                {labelParticipantState}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">Validator DID</label>
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{did ?? '—'}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="min-w-0">
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">Corporation</label>
              <p className="truncate text-sm font-mono text-gray-900 dark:text-white">{validator.corporation_id}</p>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">Deposit</label>
              <p className="truncate text-sm font-mono text-gray-900 dark:text-white">
                {formatVNAFromUVNA(String(validator.deposit ?? 0))}
              </p>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">Validation Fee</label>
              <p className="truncate text-sm font-mono text-gray-900 dark:text-white">
                {validator.validation_fees ? formatVNAFromUVNA(String(validator.validation_fees)) : '—'}
              </p>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">{feeLabel}</label>
              <p className="truncate text-sm font-mono text-gray-900 dark:text-white">{feeValue}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
