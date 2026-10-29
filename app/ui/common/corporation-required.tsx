'use client'

import { Building2Icon, CircleAlertIcon, PlusIcon, RotateCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/ui/common/page-header'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export type CorporationRequiredProps = {
  title?: string
  description?: string
  failed?: boolean
  className?: string
}

export function CorporationRequired({ title, description, failed, className }: CorporationRequiredProps) {
  const { error, loading, refetch } = useUserCorporation()
  const discoveryFailed = failed ?? Boolean(error)

  return (
    <>
      {title ? (
        <BlurFade>
          <PageHeader title={title} description={description} />
        </BlurFade>
      ) : null}
      <BlurFade delay={0.05}>
        <Empty data-corporation-required className={cn('mx-auto max-w-2xl bg-card py-12 shadow-card', className)}>
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              aria-hidden="true"
              className={cn(
                'size-10 [&_svg:not([class*=size-])]:size-5',
                discoveryFailed
                  ? 'bg-destructive/10 text-destructive dark:bg-destructive/20'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {discoveryFailed ? <CircleAlertIcon /> : <Building2Icon />}
            </EmptyMedia>
            <EmptyTitle className={cn('text-base font-semibold', discoveryFailed && 'text-destructive')}>
              {translate(discoveryFailed ? 'corporation.page.error' : 'nocorporation.dashboard.title')}
            </EmptyTitle>
            {discoveryFailed ? null : <EmptyDescription>{translate('nocorporation.dashboard.msg')}</EmptyDescription>}
          </EmptyHeader>
          <EmptyContent>
            {discoveryFailed ? (
              <Button type="button" variant="outline" size="lg" disabled={loading} onClick={() => void refetch()}>
                <RotateCwIcon aria-hidden="true" />
                {translate('corporation.chooser.retry')}
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/corporation?create=1">
                  <PlusIcon aria-hidden="true" />
                  {translate('corporation.selector.create')}
                </Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      </BlurFade>
    </>
  )
}
