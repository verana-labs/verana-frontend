'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment';
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient';
import { trustStateBadge } from '@/lib/trust-state';
import {
  countryCodeToFlag,
  formatNumber,
  formatVNAFromUVNA,
  roleBadgeClass,
  shortenDID,
} from '@/util/util';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

const ECOSYSTEM_ROLES = [
  'ECOSYSTEM',
  'ISSUER_GRANTOR',
  'VERIFIER_GRANTOR',
  'ISSUER',
  'VERIFIER',
  'HOLDER',
] as const;
type EcosystemRole = (typeof ECOSYSTEM_ROLES)[number];

function parseRoles(role: string | undefined | null): EcosystemRole[] {
  if (!role) return [];
  const valid = new Set<EcosystemRole>(ECOSYSTEM_ROLES);
  const seen = new Set<EcosystemRole>();
  for (const r of role.split(/[,\s]+/)) {
    const up = r.trim().toUpperCase() as EcosystemRole;
    if (valid.has(up)) seen.add(up);
  }
  return [...seen];
}

export type EcosystemCardData = {
  id: string;
  did: string;
  aka?: string;
  controller?: string;
  role?: string;
  archived?: string;
  active_schemas?: number | null;
  participants?: number | null;
  weight?: number | string | null;
  issued?: number | null;
  verified?: number | null;
  active_version?: number;
  versions?: Array<{
    id: string;
    version: number;
    active_since: string;
    documents?: Array<{ id: string; url: string; language: string }>;
  }>;
};

function egfHrefFromTr(tr: EcosystemCardData): string | undefined {
  const versions = tr.versions ?? [];
  const target =
    versions.find((v) => v.version === tr.active_version) ?? versions[0];
  return target?.documents?.[0]?.url;
}

type Props = {
  ecosystem: EcosystemCardData;
  hideUntrusted?: boolean;
};

export default function EcosystemCard({ ecosystem, hideUntrusted }: Props) {
  const router = useRouter();
  const { data: enrichment } = useDidTrustEnrichment(ecosystem.did);

  if (hideUntrusted && enrichment?.trustStatus === 'UNTRUSTED') return null;

  const trustBadge = trustStateBadge(enrichment?.trustStatus);
  const trServiceName =
    enrichment?.serviceName ?? shortenDID(ecosystem.did) ?? ecosystem.did;
  const trDescription = enrichment?.serviceDescription;
  const orgName =
    enrichment?.organizationName ?? shortenDID(ecosystem.did) ?? ecosystem.did;
  const flag = countryCodeToFlag(enrichment?.countryCode);
  const egfHref = egfHrefFromTr(ecosystem);
  const roles = parseRoles(ecosystem.role);
  const isArchived = Boolean(ecosystem.archived);

  const handleClick = () => router.push(`/tr/${encodeURIComponent(ecosystem.id)}`);

  const t = (key: string, fallback: string) =>
    resolveTranslatable({ key }, translate) ?? fallback;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
        isArchived ? 'archived-watermark' : ''
      }`}
    >
      <div className={`p-4 sm:p-6 ${isArchived ? 'archived-bg' : ''}`}>
        {/* Trust Registry row */}
        <div className="flex items-start space-x-3 mb-4">
          <img
            src={serviceIdenticonUrl(ecosystem.did)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white break-all">
                {trServiceName}
              </h3>
              <FontAwesomeIcon
                icon={trustBadge.icon}
                className={`text-xl ${trustBadge.iconColorClass} flex-shrink-0`}
                title={trustBadge.label}
                aria-label={trustBadge.label}
              />
            </div>
            {trDescription ? (
              <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 line-clamp-2 break-all">
                {trDescription}
              </p>
            ) : null}
          </div>
        </div>

        {/* Organization row */}
        <div className="flex items-start space-x-2 mb-4">
          <img
            src={serviceAvatarUrl(enrichment?.organizationName ?? ecosystem.did)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white break-all">
              {orgName}
            </h4>
            <div className="flex items-center space-x-2 mt-1 flex-wrap">
              <span className="text-lg" aria-hidden="true">
                {flag}
              </span>
              {egfHref ? (
                <a
                  href={egfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium flex items-center space-x-1"
                >
                  <span>{t('datatable.tr.card.egf', 'EGF')}</span>
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Role pills */}
        {roles.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {roles.map((r) => (
              <span
                key={r}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(r)}`}
              >
                {r}
              </span>
            ))}
          </div>
        ) : null}

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <Stat
            label={t('datatable.tr.card.activeSchemas', 'Active Schemas:')}
            value={formatNumber(ecosystem.active_schemas, true)}
          />
          <Stat
            label={t('datatable.tr.card.participants', 'Participants:')}
            value={formatNumber(ecosystem.participants, true)}
          />
          <Stat
            label={t('datatable.tr.card.trustValue', 'Trust Value:')}
            value={formatVNAFromUVNA(
              ecosystem.weight == null ? null : String(ecosystem.weight),
            )}
            mono
          />
          <Stat
            label={t('datatable.tr.card.issuedCredentials', 'Issued Credentials:')}
            value={formatNumber(ecosystem.issued, true)}
          />
          <Stat
            label={t('datatable.tr.card.verifiedCredentials', 'Verified Credentials:')}
            value={formatNumber(ecosystem.verified, true)}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-70 dark:text-neutral-70">{label}</span>
      <span
        className={`font-medium text-gray-900 dark:text-white text-right break-all ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
