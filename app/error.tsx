'use client'

import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    logger.error(error)
  }, [error])

  return (
    <Empty className="relative isolate min-h-[60svh] overflow-hidden">
      <DotPattern
        width={18}
        height={18}
        className="-z-10 text-destructive/20 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
      />
      <BlurFade className="flex flex-col items-center gap-6">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-12 rounded-2xl bg-tint-destructive text-destructive ring-1 ring-destructive/20"
          >
            <TriangleAlertIcon className="size-6" />
          </EmptyMedia>
          <EmptyTitle>
            <h1 className="text-xl font-semibold tracking-[-0.015em]">{translate('shell.error.title')}</h1>
          </EmptyTitle>
          <EmptyDescription>{translate('shell.error.description')}</EmptyDescription>
          {error.digest ? (
            <p className="mt-1 inline-flex h-[22px] items-center gap-1.5 rounded-md bg-tint-neutral px-2 font-mono text-xs text-muted-foreground">
              {translate('shell.error.reference')} {error.digest}
            </p>
          ) : null}
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center">
          <Button onClick={() => retry()}>
            <RotateCwIcon />
            {translate('shell.error.retry')}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{translate('shell.home')}</Link>
          </Button>
        </EmptyContent>
      </BlurFade>
    </Empty>
  )
}
