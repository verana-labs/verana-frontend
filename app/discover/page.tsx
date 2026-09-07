'use client'

import { faCoins, faFileContract, faScaleBalanced, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { byTrustThenLockedValue } from '@/lib/discover-order'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import CsCard from '@/ui/common/cs-card'
import { KeysetPager, LoadedWindowNote } from '@/ui/common/keyset-pager'
import LogoImage from '@/ui/common/logo-image'
import TitleAndButton from '@/ui/common/title-and-button'
import TrustBadge from '@/ui/common/trust-badge'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, formatVNAFromUVNA, shortenDID } from '@/util/util'

export default function DiscoverJoinPage() {
  const discoverCtx = useDiscoverCtx()

  const credentialSchemasByEcosystemId = useMemo(() => {
    const map = new Map<string, CredentialSchemaListItem[]>()
    for (const credentialSchema of discoverCtx.credentialSchemas) {
      const key = credentialSchema.ecosystemId
      const arr = map.get(key)
      if (arr) arr.push(credentialSchema)
      else map.set(key, [credentialSchema])
    }
    return map
  }, [discoverCtx.credentialSchemas])

  const ecosystems = useMemo(
    () =>
      discoverCtx.discoverList.map((ecosystem) => ({
        ...ecosystem,
        credentialSchemas: credentialSchemasByEcosystemId.get(ecosystem.id) ?? [],
      })),
    [discoverCtx.discoverList, credentialSchemasByEcosystemId]
  )

  const [showUntrusted, setShowUntrusted] = useState(false)
  const [search, setSearch] = useState(discoverCtx.discoverSearch)

  const filtered = useMemo(() => {
    const candidates = showUntrusted ? ecosystems : ecosystems.filter((e) => e.trust?.trustStatus === 'TRUSTED')
    const term = search.trim().toLowerCase()
    const matching = term
      ? candidates.filter((e) =>
          [e.did, e.trust?.serviceName, e.trust?.organizationName].some((v) => v?.toLowerCase().includes(term))
        )
      : candidates
    return [...matching].sort(byTrustThenLockedValue)
  }, [ecosystems, search, showUntrusted])

  useEffect(() => {
    discoverCtx.setDiscoverSearch(search)
  }, [discoverCtx.setDiscoverSearch, search])

  const paging = useMemo(() => {
    const scrolled = (turn: () => void) => () => {
      turn()
      document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return { ...discoverCtx.paging, next: scrolled(discoverCtx.paging.next), prev: scrolled(discoverCtx.paging.prev) }
  }, [discoverCtx.paging])

  return (
    <>
      <TitleAndButton title={resolveTranslatable({ key: 'discover.title' }, translate) ?? 'Discover & Join'} />

      <section
        id="search-form"
        className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              id="search-input"
              placeholder={resolveTranslatable({ key: 'discover.search.placeholder' }, translate)}
              className="w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer" htmlFor="discover-show-untrusted">
            <input
              id="discover-show-untrusted"
              type="checkbox"
              checked={showUntrusted}
              onChange={(e) => setShowUntrusted(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{translate('discover.show.untrusted')}</span>
          </label>
        </div>
      </section>

      <LoadedWindowNote partial={discoverCtx.paging.partial} />

      <section id="ecosystem-list" className="space-y-6">
        {discoverCtx.loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card rounded-xl border border-neutral-20 dark:border-neutral-70">
              <div className="skeleton-title mb-2 w-1/2" />
              <div className="skeleton-text w-1/3 mb-6" />
              <div className="space-y-4">
                <div className="skeleton-block h-16 rounded-lg" />
                <div className="skeleton-block h-16 rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-70 dark:text-neutral-70">
              {resolveTranslatable({ key: 'discover.empty' }, translate) ?? 'No verifiable ecosystems found.'}
            </p>
          </div>
        ) : (
          filtered.map((eco) => {
            const egfUrl = eco.versions?.find((x) => x.version === eco.activeVersion)?.documents?.[0]?.url
            const enrichment = eco.trust
            const serviceName = enrichment?.serviceName ?? shortenDID(eco.did) ?? eco.did
            const orgName = enrichment?.organizationName ?? shortenDID(eco.did) ?? eco.did
            const flag = countryCodeToFlag(enrichment?.countryCode)
            return (
              <div
                key={eco.id}
                className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6"
              >
                <div className="mb-6">
                  <div className="flex items-start space-x-3 mb-3">
                    <LogoImage
                      src={enrichment?.serviceLogoUrl}
                      fallbackSrc={serviceIdenticonUrl(eco.did)}
                      className="w-12 h-12 rounded-lg flex-shrink-0 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words" title={serviceName}>
                          {serviceName}
                        </h2>
                        <TrustBadge state={enrichment?.trustStatus} size="xl" />
                      </div>
                      {enrichment?.serviceDescription ? (
                        <p
                          className="text-xs text-neutral-70 dark:text-neutral-70 mt-1 line-clamp-2 break-words"
                          title={enrichment.serviceDescription}
                        >
                          {enrichment.serviceDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 mb-4">
                    <LogoImage
                      src={enrichment?.organizationLogoUrl}
                      fallbackSrc={serviceAvatarUrl(enrichment?.organizationName ?? eco.did)}
                      className="w-8 h-8 rounded flex-shrink-0 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white" title={orgName}>
                        {orgName}
                      </h3>
                      <span className="text-lg leading-none" aria-hidden="true">
                        {flag}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-neutral-70 dark:text-neutral-70 mb-4">
                    <span>
                      <FontAwesomeIcon className="mr-1" aria-hidden="true" icon={faFileContract} />
                      {eco.credentialSchemas.length} {resolveTranslatable({ key: 'discover.cs.label' }, translate)}
                    </span>
                    <span>
                      <FontAwesomeIcon className="mr-1" aria-hidden="true" icon={faCoins} />
                      {resolveTranslatable({ key: 'discover.td.label' }, translate)}{' '}
                      {formatVNAFromUVNA(String(eco.weight))}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {egfUrl && (
                      <Link
                        href={egfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
                      >
                        <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faScaleBalanced} />
                        {resolveTranslatable({ key: 'discover.btn.egf' }, translate)}
                      </Link>
                    )}

                    <Link
                      href={`/ecosystems/${eco.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                    >
                      <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faShieldHalved} />
                      {resolveTranslatable({ key: 'discover.btn.view' }, translate)}
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {eco.credentialSchemas.map((schema) => (
                    <CsCard key={schema.id} credentialSchema={schema} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </section>

      <KeysetPager paging={paging} showing={ecosystems.length} loading={discoverCtx.loading} />
    </>
  )
}
