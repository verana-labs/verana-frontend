'use client'

import {
  faChevronLeft,
  faChevronRight,
  faCoins,
  faFileContract,
  faScaleBalanced,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { DidEnrichment, fetchDidEnrichment, serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import CsCard from '@/ui/common/cs-card'
import LogoImage from '@/ui/common/logo-image'
import TitleAndButton from '@/ui/common/title-and-button'
import TrustBadge from '@/ui/common/trust-badge'
import { CsList } from '@/ui/datatable/columnslist/cs'
import { TrList } from '@/ui/datatable/columnslist/tr'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, formatVNA, shortenDID } from '@/util/util'

export default function DiscoverJoinPage() {
  const discoverCtx = useDiscoverCtx()
  const [ecosystems, setEcosystems] = useState<TrList[]>()

  const csByTrId = useMemo(() => {
    const map = new Map<string, CsList[]>()
    if (!discoverCtx.csList) return map
    for (const cs of discoverCtx.csList) {
      const key = cs.trId
      const arr = map.get(key)
      if (arr) arr.push(cs)
      else map.set(key, [cs])
    }
    return map
  }, [discoverCtx.csList])

  useEffect(() => {
    if (!discoverCtx.discoverList) {
      setEcosystems(undefined)
      return
    }
    setEcosystems(
      discoverCtx.discoverList.map((tr) => ({
        ...tr,
        csList: csByTrId.get(String(tr.id)) ?? [],
      }))
    )
  }, [discoverCtx.discoverList, csByTrId])

  // Ecosystems without credential schemas are never listed.
  const withSchemas = useMemo(() => ecosystems?.filter((e) => (e.csList?.length ?? 0) > 0), [ecosystems])

  // Trust-resolve every candidate ecosystem DID. An ecosystem is only shown
  // once its DID resolves as TRUSTED; while its state is unknown (resolution
  // pending or failed) it stays hidden.
  const [enrichmentByDid, setEnrichmentByDid] = useState<Record<string, DidEnrichment>>({})

  useEffect(() => {
    if (!withSchemas) return
    let cancelled = false
    const pending = [...new Set(withSchemas.map((e) => e.did).filter(Boolean))].filter((did) => !enrichmentByDid[did])
    for (const did of pending) {
      fetchDidEnrichment(did)
        .catch((): DidEnrichment => ({ did, trustStatus: 'UNRESOLVED' }))
        .then((enrichment) => {
          if (cancelled) return
          setEnrichmentByDid((prev) => (prev[did] ? prev : { ...prev, [did]: enrichment }))
        })
    }
    return () => {
      cancelled = true
    }
  }, [withSchemas, enrichmentByDid])

  const verifiable = useMemo(
    () => withSchemas?.filter((e) => enrichmentByDid[e.did]?.trustStatus === 'TRUSTED'),
    [withSchemas, enrichmentByDid]
  )

  const resolving = useMemo(
    () => (withSchemas ?? []).some((e) => e.did && !enrichmentByDid[e.did]),
    [withSchemas, enrichmentByDid]
  )

  const [search, setSearch] = useState(discoverCtx.discoverSearch)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return verifiable
    return verifiable?.filter((e) => {
      const enrichment = enrichmentByDid[e.did]
      return [e.did, enrichment?.serviceName, enrichment?.organizationName].some((v) => v?.toLowerCase().includes(term))
    })
  }, [search, verifiable, enrichmentByDid])

  const PAGE_SIZE = 5
  const [page, setPage] = useState(discoverCtx.discoverPage)

  const totalPages = useMemo(() => {
    if (!filtered) return undefined
    return Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE))
  }, [filtered])

  useEffect(() => {
    if (totalPages == null) return
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered?.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    discoverCtx.setDiscoverSearch(search)
  }, [search])

  useEffect(() => {
    discoverCtx.setDiscoverPage(page)
    document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  // Refresh trList and csList
  const [refresh, setRefresh] = useState<boolean>(true)
  useEffect(() => {
    if (!refresh) return
    ;(async () => {
      await discoverCtx.refetch()
      setRefresh(false)
    })()
  }, [refresh])

  const loading = ecosystems === undefined || (resolving && (filtered?.length ?? 0) === 0)

  return (
    <>
      <TitleAndButton title={resolveTranslatable({ key: 'discover.title' }, translate) ?? 'Discover & Join'} />

      <section
        id="search-form"
        className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
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
        </div>
      </section>

      <section id="ecosystem-list" className="space-y-6">
        {loading ? (
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
        ) : (filtered?.length ?? 0) === 0 ? (
          <div className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-70 dark:text-neutral-70">
              {resolveTranslatable({ key: 'discover.empty' }, translate) ?? 'No verifiable ecosystems found.'}
            </p>
          </div>
        ) : (
          paginated?.map((eco, idx) => {
            const egfUrl = eco.versions?.find((x) => x.version === eco.active_version)?.documents?.[0]?.url
            const enrichment = enrichmentByDid[eco.did]
            const serviceName = enrichment?.serviceName ?? shortenDID(eco.did) ?? eco.did
            const orgName = enrichment?.organizationName ?? shortenDID(eco.did) ?? eco.did
            const flag = countryCodeToFlag(enrichment?.countryCode)
            return (
              <div
                key={`${eco.did}-${idx}`}
                className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6"
              >
                <div className="mb-6">
                  {/* Ecosystem service identity */}
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

                  {/* Controller organization identity */}
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
                      {eco.csList?.length} {resolveTranslatable({ key: 'discover.cs.label' }, translate)}
                    </span>
                    <span>
                      <FontAwesomeIcon className="mr-1" aria-hidden="true" icon={faCoins} />
                      {resolveTranslatable({ key: 'discover.td.label' }, translate)} {formatVNA(eco.deposit)}
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
                      href={`/tr/${eco.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                    >
                      <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faShieldHalved} />
                      {resolveTranslatable({ key: 'discover.btn.view' }, translate)}
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {eco.csList?.map((schema) => (
                    <CsCard key={schema.id} cs={schema} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </section>

      {filtered && filtered.length > 0 ? (
        <section id="pagination" className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-lg shadow-sm" aria-label="Pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={[
                'px-3 py-2 text-sm font-medium bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-l-lg',
                page === 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
              aria-label="Previous page"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            {(() => {
              if (totalPages == null) return null
              const maxVisible = 6
              const pages: (number | 'ellipsis')[] = []

              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                if (page <= 3) {
                  pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages)
                } else if (page >= totalPages - 2) {
                  pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                } else {
                  pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages)
                }
              }

              return pages.map((item, idx) => {
                if (item === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  )
                }

                const isActive = item === page
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-primary-600'
                        : 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  >
                    {item}
                  </button>
                )
              })
            })()}

            <button
              type="button"
              disabled={totalPages == null || page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages ?? 1, p + 1))}
              className={[
                'px-3 py-2 text-sm font-medium bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-r-lg',
                page === totalPages
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
              aria-label="Next page"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </nav>
        </section>
      ) : null}
    </>
  )
}
