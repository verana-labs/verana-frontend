'use client'

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { translate } from '@/i18n/dataview'
import { serviceAvatarUrl } from '@/lib/resolverClient'
import FieldRow from '@/ui/common/field-row'
import TrustBadge from '@/ui/common/trust-badge'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag } from '@/util/util'

const LABEL_CLASS = 'text-neutral-70 dark:text-neutral-70 block mb-1'
const MONO_VALUE_CLASS = 'text-gray-900 dark:text-white font-mono text-xs sm:text-sm break-all'

export type ServiceProviderCardProps = {
  did: string
}

function countryName(code: string): string {
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase())
    return display ?? code
  } catch {
    return code
  }
}

export default function ServiceProviderCard({ did }: ServiceProviderCardProps) {
  const { data: enrichment } = useDidTrustEnrichment(did)

  const orgName = enrichment?.organizationName ?? enrichment?.serviceName
  const countryCode = enrichment?.countryCode
  const address = enrichment?.organizationAddress
  const registryId = enrichment?.organizationRegistryId
  const credentialIssuer = enrichment?.credentialIssuerDid

  const hasContent = !!orgName || !!countryCode || !!address || !!registryId || !!credentialIssuer
  if (!hasContent) return null

  const sectionLabel =
    resolveTranslatable({ key: 'dataview.tr.sections.serviceProvider' }, translate) ?? 'Service Provider'
  const countryLabel = resolveTranslatable({ key: 'dataview.tr.fields.country' }, translate) ?? 'Country'
  const addressLabel = resolveTranslatable({ key: 'dataview.tr.fields.address' }, translate) ?? 'Address'
  const registryIdLabel = resolveTranslatable({ key: 'dataview.tr.fields.registryId' }, translate) ?? 'Registry ID'
  const issuerLabel =
    resolveTranslatable({ key: 'dataview.tr.fields.credentialIssuer' }, translate) ?? 'Credential Issuer'

  return (
    <section className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">{sectionLabel}</h2>

      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <img
              src={serviceAvatarUrl(did)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg"
            />
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            {orgName ? (
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-all">
                  {orgName}
                </h3>
                <TrustBadge state={enrichment?.trustStatus} size="md" />
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {countryCode ? (
                <FieldRow label={`${countryLabel}:`} labelClassName={LABEL_CLASS}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl" aria-hidden="true">
                      {countryCodeToFlag(countryCode)}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">{countryName(countryCode)}</span>
                  </div>
                </FieldRow>
              ) : null}

              {address ? (
                <FieldRow label={`${addressLabel}:`} labelClassName={LABEL_CLASS}>
                  <p className="text-gray-900 dark:text-white font-medium break-words">{address}</p>
                </FieldRow>
              ) : null}

              {registryId ? (
                <FieldRow label={`${registryIdLabel}:`} labelClassName={LABEL_CLASS}>
                  <p className={MONO_VALUE_CLASS}>{registryId}</p>
                </FieldRow>
              ) : null}

              {credentialIssuer ? (
                <FieldRow label={`${issuerLabel}:`} labelClassName={LABEL_CLASS}>
                  <p className={MONO_VALUE_CLASS}>{credentialIssuer}</p>
                </FieldRow>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
