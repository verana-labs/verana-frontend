'use client'

import { Building2Icon, CircleAlertIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export function CorporationRequired({
  failed,
  title,
  description,
}: {
  failed: boolean
  title: string
  description: string
}) {
  return (
    <>
      <BlurFade>
        <section id="page-header" className="mb-6">
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </section>
      </BlurFade>
      <BlurFade delay={0.05}>
        <Empty className="mx-auto max-w-2xl bg-card py-12 shadow-card">
          <EmptyHeader>
            <EmptyMedia variant="icon" className={failed ? 'bg-destructive/10 text-destructive' : undefined}>
              {failed ? <CircleAlertIcon /> : <Building2Icon />}
            </EmptyMedia>
            <EmptyTitle className={failed ? 'text-destructive' : undefined}>
              {translate(failed ? 'corporation.page.error' : 'corporation.page.nocorp')}
            </EmptyTitle>
          </EmptyHeader>
          {failed ? null : (
            <EmptyContent>
              <Button asChild size="lg">
                <Link href="/corporation?create=1">
                  <PlusIcon aria-hidden="true" />
                  {translate('corporation.selector.create')}
                </Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </BlurFade>
    </>
  )
}
