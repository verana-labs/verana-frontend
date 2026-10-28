'use client'

import { BuildingIcon } from 'lucide-react'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { translate } from '@/i18n/dataview'
import { serviceAvatarUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import FieldRow from '@/ui/common/field-row'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag } from '@/util/util'

const LABEL_CLASS = 'mb-1 block text-xs font-medium text-muted-foreground'
const MONO_VALUE_CLASS = 'font-mono text-xs break-all text-foreground sm:text-sm'

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
    resolveTranslatable({ key: 'dataview.ecosystem.sections.serviceProvider' }, translate) ?? 'Service Provider'
  const countryLabel = resolveTranslatable({ key: 'dataview.ecosystem.fields.country' }, translate) ?? 'Country'
  const addressLabel = resolveTranslatable({ key: 'dataview.ecosystem.fields.address' }, translate) ?? 'Address'
  const registryIdLabel =
    resolveTranslatable({ key: 'dataview.ecosystem.fields.registryId' }, translate) ?? 'Registry ID'
  const issuerLabel =
    resolveTranslatable({ key: 'dataview.ecosystem.fields.credentialIssuer' }, translate) ?? 'Credential Issuer'

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        <BuildingIcon aria-hidden="true" className="size-4 text-primary" />
        {sectionLabel}
      </h2>

      <div className="rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <LogoImage
            src={enrichment?.organizationLogoUrl}
            fallbackSrc={serviceAvatarUrl(did)}
            className="size-16 shrink-0 rounded-xl bg-background object-contain p-1 ring-1 ring-foreground/10 sm:size-20"
          />

          <div className="min-w-0 flex-1 space-y-4">
            {orgName ? (
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight break-all text-foreground sm:text-lg">
                  {orgName}
                </h3>
                <TrustBadge state={enrichment?.trustStatus} size="md" />
              </div>
            ) : null}

            <div className={cn('grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2', orgName && 'border-t pt-4')}>
              {countryCode ? (
                <FieldRow label={`${countryLabel}:`} labelClassName={LABEL_CLASS}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none" aria-hidden="true">
                      {countryCodeToFlag(countryCode)}
                    </span>
                    <span className="font-medium text-foreground">{countryName(countryCode)}</span>
                  </div>
                </FieldRow>
              ) : null}

              {address ? (
                <FieldRow label={`${addressLabel}:`} labelClassName={LABEL_CLASS}>
                  <p className="font-medium break-words text-foreground">{address}</p>
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
