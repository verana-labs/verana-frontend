'use client'

import { CompassIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export default function NotFound() {
  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 rounded-xl bg-primary/10 text-primary">
          <CompassIcon className="size-5" />
        </EmptyMedia>
        <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground">404</p>
        <EmptyTitle>
          <h1 className="text-xl font-semibold tracking-tight">{translate('shell.notfound.title')}</h1>
        </EmptyTitle>
        <EmptyDescription>{translate('shell.notfound.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button asChild>
          <Link href="/dashboard">{translate('shell.home')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/discover">{translate('discover.title')}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
