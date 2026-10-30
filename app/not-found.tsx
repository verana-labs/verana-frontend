'use client'

import { CompassIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export default function NotFound() {
  return (
    <Empty className="relative isolate min-h-[60svh] overflow-hidden">
      <DotPattern
        width={18}
        height={18}
        className="-z-10 text-primary/25 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]"
      />
      <BlurFade className="flex flex-col items-center gap-6">
        <EmptyHeader>
          <p className="bg-linear-to-r from-primary-700 via-primary-600 to-primary-400 bg-clip-text text-7xl leading-none font-semibold tracking-[-0.06em] text-transparent tabular-nums sm:text-8xl dark:from-primary-400 dark:via-primary-300 dark:to-primary-200">
            404
          </p>
          <EmptyMedia
            variant="icon"
            className="-mt-4 size-10 rounded-xl bg-card text-primary shadow-hairline ring-4 ring-page"
          >
            <CompassIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            <h1 className="text-xl font-semibold tracking-[-0.015em]">{translate('shell.notfound.title')}</h1>
          </EmptyTitle>
          <EmptyDescription>{translate('shell.notfound.description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center">
          <Button asChild>
            <Link href="/dashboard">{translate('shell.home')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/discover">{translate('discover.title')}</Link>
          </Button>
        </EmptyContent>
      </BlurFade>
    </Empty>
  )
}
