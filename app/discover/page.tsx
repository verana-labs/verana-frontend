'use client'

import { CompassIcon, SearchXIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { useCorporationRolesByEcosystem } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { clientPage, filterEcosystems, orderEcosystems, roleFiltersPending } from '@/lib/discover-list'
import { DISCOVER_PAGE_SIZE, useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import { DiscoverEcosystemCard } from '@/ui/common/discover-ecosystem-card'
import KeysetPagination from '@/ui/common/keyset-pagination'
import TitleAndButton from '@/ui/common/title-and-button'
import { DiscoverCardSkeleton } from '@/ui/discover/discover-card-skeleton'
import { DiscoverFilters } from '@/ui/discover/discover-filters'
import { discoverText as t } from '@/ui/discover/text'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

const NO_SCHEMAS: EcosystemSchemaPage = { items: [], hasNext: false }
const NO_ECOSYSTEM_IDS: string[] = []

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function DiscoverJoinPage() {
  const discoverCtx = useDiscoverCtx()
  const {
    discoverList,
    discoverFilters: filters,
    setDiscoverFilters,
    discoverSearch,
    fullWindow,
    setShownEcosystemIds,
  } = discoverCtx
  const { actingCorporation } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading, failureReason } = useCorporationRolesByEcosystem(actingCorporationId)

  const appliedFilters = useMemo(() => ({ ...filters, search: discoverSearch }), [filters, discoverSearch])
  const pagingKey = JSON.stringify([appliedFilters, actingCorporationId])
  const [paging, setPaging] = useState({ key: pagingKey, index: 0 })
  const pageIndex = paging.key === pagingKey ? paging.index : 0

  const matching = useMemo(
    () =>
      orderEcosystems(
        filterEcosystems(discoverList, appliedFilters, { actingCorporationId, rolesByEcosystem }),
        appliedFilters.order
      ),
    [actingCorporationId, appliedFilters, discoverList, rolesByEcosystem]
  )
  const page = useMemo(
    () =>
      fullWindow
        ? clientPage(matching, pageIndex, DISCOVER_PAGE_SIZE)
        : { items: matching, page: 0, hasPrevious: discoverCtx.hasPrevious, hasNext: discoverCtx.hasNext },
    [discoverCtx.hasNext, discoverCtx.hasPrevious, fullWindow, matching, pageIndex]
  )
  const shown = page.items

  useEffect(() => {
    setShownEcosystemIds(fullWindow ? shown.map((ecosystem) => ecosystem.id) : NO_ECOSYSTEM_IDS)
  }, [fullWindow, setShownEcosystemIds, shown])

  const partial = discoverCtx.hasNext || discoverCtx.hasPrevious
  const loading = (discoverCtx.loading && discoverList.length === 0) || roleFiltersPending(filters, rolesLoading)
  const errors = [
    discoverCtx.error,
    failureReason ? t('discover.roles.failed', { reason: failureReason }) : null,
  ].filter((message): message is string => message !== null)

  return (
    <>
      <TitleAndButton title={t('discover.title')} description={[t('discover.description')]} />

      <DiscoverFilters
        value={filters}
        onChange={setDiscoverFilters}
        corporationFilters={actingCorporationId !== undefined}
        loadedOnly={partial}
      />

      {errors.map((message) => (
        <div key={message} className="error-pane mb-6">
          {message}
        </div>
      ))}

      <section id="ecosystem-list" aria-busy={loading} className="flex flex-col gap-4 sm:gap-5">
        {loading ? (
          [0, 1, 2].map((slot) => <DiscoverCardSkeleton key={slot} />)
        ) : shown.length === 0 && errors.length === 0 ? (
          <Empty className="rounded-xl border border-dashed bg-card py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-10 rounded-xl">
                {filters.search ? <SearchXIcon className="size-5" /> : <CompassIcon className="size-5" />}
              </EmptyMedia>
              <EmptyTitle className="text-base">{t('discover.empty')}</EmptyTitle>
              <EmptyDescription>{t('discover.empty.hint')}</EmptyDescription>
            </EmptyHeader>
            {filters.search ? (
              <EmptyContent>
                <Button variant="outline" onClick={() => setDiscoverFilters({ ...filters, search: '' })}>
                  {t('discover.search.clear')}
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : (
          <Stagger className="flex flex-col gap-4 sm:gap-5">
            {shown.map((ecosystem) => (
              <StaggerItem key={ecosystem.id}>
                <DiscoverEcosystemCard
                  ecosystem={ecosystem}
                  credentialSchemas={discoverCtx.credentialSchemasByEcosystem[ecosystem.id] ?? NO_SCHEMAS}
                  schemasError={discoverCtx.errorCredentialSchemas}
                  moreSchemasFailed={Boolean(discoverCtx.moreSchemaErrors[ecosystem.id])}
                  onLoadMoreSchemas={() => discoverCtx.loadMoreCredentialSchemas(ecosystem.id)}
                  roles={rolesByEcosystem[ecosystem.id] ?? []}
                  canJoin={actingCorporationId !== undefined}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <KeysetPagination
        showing={shown.length}
        itemsLabel={t('datatable.ecosystem.pagination.ecosystems')}
        hasPrevious={page.hasPrevious}
        hasNext={page.hasNext}
        loadedOnlyNote={false}
        onPrevious={() => {
          if (fullWindow) setPaging({ key: pagingKey, index: page.page - 1 })
          else discoverCtx.previousPage()
          scrollToTop()
        }}
        onNext={() => {
          if (fullWindow) setPaging({ key: pagingKey, index: page.page + 1 })
          else discoverCtx.nextPage()
          scrollToTop()
        }}
      />
    </>
  )
}
