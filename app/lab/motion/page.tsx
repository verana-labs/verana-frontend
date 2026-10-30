'use client'

import { RotateCcw } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { BlurFade } from '@/ui/motion/blur-fade'
import { ErrorShake, SuccessCheck } from '@/ui/motion/feedback'
import { hoverLift, interactiveCard, pressable } from '@/ui/motion/interaction'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { PageTransition } from '@/ui/motion/page-transition'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Tabs, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { AppShell } from '@/ui/shell/app-shell'
import { SiteHeader } from '@/ui/shell/site-header'

const TABS = ['Overview', 'Participants', 'Governance']

function Demo({ title, api, children }: { title: string; api: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="font-mono text-xs">{api}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-32 items-center justify-center">{children}</CardContent>
    </Card>
  )
}

export default function LabMotionPage() {
  const [run, setRun] = useState(0)
  const [tab, setTab] = useState(TABS[0])
  const [error, setError] = useState(0)

  return (
    <AppShell>
      <SiteHeader title="Motion kit" />
      <PageTransition>
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pt-5 pb-8 sm:px-6 lg:px-8 lg:pt-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Motion kit</h1>
            <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
              <RotateCcw />
              Replay
            </Button>
          </div>
          <div key={run} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Demo title="Blur fade" api="<BlurFade delay inView offset blur>">
              <BlurFade delay={0.1} className="text-xl font-semibold">
                Trust registry
              </BlurFade>
            </Demo>
            <Demo title="Stagger" api="<Stagger as step delay><StaggerItem as>">
              <Stagger as="ul" className="grid w-full grid-cols-3 gap-2">
                {['Ecosystems', 'Schemas', 'Participants'].map((label) => (
                  <StaggerItem key={label} as="li" className="rounded-md bg-muted px-2 py-3 text-center text-xs">
                    {label}
                  </StaggerItem>
                ))}
              </Stagger>
            </Demo>
            <Demo title="Number ticker" api="<NumberTicker value delay format>">
              <NumberTicker value={12840} className="text-6xl font-semibold tracking-tight" />
            </Demo>
            <Demo title="Tab indicator" api="<TabIndicator layoutId variant>">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  {TABS.map((value) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="isolate data-active:bg-transparent dark:data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent"
                    >
                      {tab === value && <TabIndicator layoutId="lab-motion-tabs" />}
                      {value}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </Demo>
            <Demo title="Hover lift and press" api="hoverLift, pressable, interactiveCard">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={cn('rounded-xl bg-card px-4 py-6 text-sm shadow-card', interactiveCard)}
                >
                  Card
                </button>
                <div className={cn('rounded-xl bg-card px-4 py-6 text-sm shadow-card', hoverLift)}>Lift</div>
                <Button className={pressable}>Press</Button>
              </div>
            </Demo>
            <Demo title="Success check" api="<SuccessCheck className>">
              <SuccessCheck />
            </Demo>
            <Demo title="Error shake" api="<ErrorShake trigger>">
              <ErrorShake trigger={error} className="flex w-full gap-2">
                <Input aria-label="Amount" aria-invalid={error > 0} placeholder="Amount" />
                <Button variant="outline" onClick={() => setError((n) => n + 1)}>
                  Submit
                </Button>
              </ErrorShake>
            </Demo>
            <Demo title="Shimmer" api="<Shimmer className>">
              <div className="flex w-full flex-col gap-2">
                <Shimmer className="h-5 w-1/2" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-3/4" />
              </div>
            </Demo>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
