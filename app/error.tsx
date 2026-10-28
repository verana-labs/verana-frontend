'use client'

import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    logger.error(error)
  }, [error])

  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 rounded-xl bg-destructive/10 text-destructive">
          <TriangleAlertIcon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>
          <h1 className="text-xl font-semibold tracking-tight">{translate('shell.error.title')}</h1>
        </EmptyTitle>
        <EmptyDescription>{translate('shell.error.description')}</EmptyDescription>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            {translate('shell.error.reference')} {error.digest}
          </p>
        ) : null}
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button onClick={() => retry()}>
          <RotateCwIcon />
          {translate('shell.error.retry')}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">{translate('shell.home')}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
