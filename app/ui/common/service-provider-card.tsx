'use client';

import TrustBadge from '@/ui/common/trust-badge';
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment';
import { serviceAvatarUrl } from '@/lib/resolverClient';
import { countryCodeToFlag } from '@/util/util';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

export type ServiceProviderCardProps = {
  did: string;
  controller?: string;
};

function countryName(code: string): string {
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase());
    return display ?? code;
  } catch {
    return code;
  }
}

export default function ServiceProviderCard({ did, controller }: ServiceProviderCardProps) {
  const { data: enrichment } = useDidTrustEnrichment(did);

  const orgName = enrichment?.organizationName ?? enrichment?.serviceName;
  const countryCode = enrichment?.countryCode;
  const address = enrichment?.organizationAddress;
  const registryId = enrichment?.organizationRegistryId;

  const hasContent = !!orgName || !!countryCode || !!address || !!registryId;
  if (!hasContent) return null;

  const sectionLabel = resolveTranslatable({ key: 'dataview.tr.sections.serviceProvider' }, translate) ?? 'Service Provider';
  const countryLabel = resolveTranslatable({ key: 'dataview.tr.fields.country' }, translate) ?? 'Country';
  const addressLabel = resolveTranslatable({ key: 'dataview.tr.fields.address' }, translate) ?? 'Address';
  const registryIdLabel = resolveTranslatable({ key: 'dataview.tr.fields.registryId' }, translate) ?? 'Registry ID';
  const issuerLabel = resolveTranslatable({ key: 'dataview.tr.fields.credentialIssuer' }, translate) ?? 'Credential Issuer';

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
                <div>
                  <span className="text-neutral-70 dark:text-neutral-70 block mb-1">{countryLabel}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl" aria-hidden="true">{countryCodeToFlag(countryCode)}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{countryName(countryCode)}</span>
                  </div>
                </div>
              ) : null}

              {address ? (
                <div>
                  <span className="text-neutral-70 dark:text-neutral-70 block mb-1">{addressLabel}:</span>
                  <p className="text-gray-900 dark:text-white font-medium break-words">{address}</p>
                </div>
              ) : null}

              {registryId ? (
                <div>
                  <span className="text-neutral-70 dark:text-neutral-70 block mb-1">{registryIdLabel}:</span>
                  <p className="text-gray-900 dark:text-white font-mono text-xs sm:text-sm break-all">{registryId}</p>
                </div>
              ) : null}

              {controller ? (
                <div>
                  <span className="text-neutral-70 dark:text-neutral-70 block mb-1">{issuerLabel}:</span>
                  <p className="text-gray-900 dark:text-white font-mono text-xs sm:text-sm break-all">
                    {controller}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
