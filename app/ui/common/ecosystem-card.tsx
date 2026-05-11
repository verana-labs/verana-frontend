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

const CARD_BODY_CLASS =
  'grid h-full min-h-[20.25rem] grid-rows-[5rem_3.25rem_1.5rem_1fr] gap-3 p-4 sm:p-6';
const CARD_HEADER_REGION_CLASS =
  'flex min-h-0 min-w-0 items-start space-x-3 overflow-hidden';
const CARD_ORG_REGION_CLASS =
  'flex min-h-0 min-w-0 items-start space-x-2 overflow-hidden';
const CARD_ROLES_REGION_CLASS =
  'flex min-h-0 min-w-0 items-start gap-2 overflow-hidden';
const ROLE_PILL_CLASS =
  'inline-flex min-w-0 max-w-[8.5rem] items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

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
  const visibleRoles = roles.slice(0, 2);
  const extraRoleCount = Math.max(0, roles.length - visibleRoles.length);
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
      className={`h-full bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
        isArchived ? 'archived-watermark' : ''
      }`}
    >
      <div className={`${CARD_BODY_CLASS} ${isArchived ? 'archived-bg' : ''}`}>
        {/* Trust Registry row */}
        <div className={CARD_HEADER_REGION_CLASS}>
          <img
            src={serviceIdenticonUrl(ecosystem.did)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white break-words"
                title={trServiceName}
              >
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
              <p
                className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 line-clamp-2 break-words"
                title={trDescription}
              >
                {trDescription}
              </p>
            ) : null}
          </div>
        </div>

        {/* Organization row */}
        <div className={CARD_ORG_REGION_CLASS}>
          <img
            src={serviceAvatarUrl(enrichment?.organizationName ?? ecosystem.did)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4
              className="truncate text-sm font-medium text-gray-900 dark:text-white"
              title={orgName}
            >
              {orgName}
            </h4>
            <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden">
              <span className="flex-shrink-0 text-lg" aria-hidden="true">
                {flag}
              </span>
              {egfHref ? (
                <a
                  href={egfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex min-w-0 items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <span className="truncate">{t('datatable.tr.card.egf', 'EGF')}</span>
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="flex-shrink-0 text-xs"
                  />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Role pills */}
        <div className={CARD_ROLES_REGION_CLASS}>
          {visibleRoles.length > 0 ? (
            visibleRoles.map((r) => (
              <span
                key={r}
                className={`${ROLE_PILL_CLASS} ${roleBadgeClass(r)}`}
                title={r}
              >
                <span className="truncate">{r}</span>
              </span>
            ))
          ) : (
            <span className="sr-only">{t('datatable.tr.card.noRoles', 'No roles')}</span>
          )}
          {extraRoleCount > 0 ? (
            <span
              className="inline-flex flex-shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
              title={roles.slice(visibleRoles.length).join(', ')}
            >
              +{extraRoleCount}
            </span>
          ) : null}
        </div>

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
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(5.5rem,auto)] items-start gap-3">
      <span className="min-w-0 break-words text-neutral-70 dark:text-neutral-70">
        {label}
      </span>
      <span
        className={`min-w-0 break-words text-right font-medium text-gray-900 dark:text-white ${
          mono ? 'font-mono' : ''
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
