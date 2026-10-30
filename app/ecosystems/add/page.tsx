'use client'

import { ChevronLeftIcon, LayersIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddEcosystemPage, { CreateEcosystemNotes } from '@/ecosystems/add/add'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { CorporationRequired } from '@/ui/common/corporation-required'
import { PageHeader } from '@/ui/common/page-header'
import { StepRail } from '@/ui/common/wizard/step-rail'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { tr } from '@/ui/ecosystems/i18n'
import { BlurFade } from '@/ui/motion/blur-fade'
import { PageTransition } from '@/ui/motion/page-transition'

function createSteps(proposal: boolean) {
  return [
    {
      id: 'details',
      title: tr('ecosystems.add.step.details', 'Ecosystem details'),
      description: tr('ecosystems.add.step.details.description', 'DID, language and governance document'),
    },
    {
      id: 'sign',
      title: tr('ecosystems.add.step.sign', 'Confirm and sign'),
      description: tr('ecosystems.add.step.sign.description', 'Review the transaction before it is broadcast'),
    },
    proposal
      ? {
          id: 'open',
          title: tr('ecosystems.add.step.vote', 'Proposal vote'),
          description: tr(
            'ecosystems.add.step.vote.description',
            'You return to your list, the ecosystem appears once the proposal executes'
          ),
        }
      : {
          id: 'open',
          title: tr('ecosystems.add.step.open', 'Open the ecosystem'),
          description: tr('ecosystems.add.step.open.description', 'You land on it once the indexer has it'),
        },
  ]
}

export default function CreateEcosystemRoute() {
  const router = useRouter()
  const { refetch } = useEcosystemsCtx()
  const { mode } = useActionSigning('MsgCreateEcosystem')
  const { actingCorporation, loading, error } = useUserCorporation()
  const title = tr('datatable.ecosystem.add', 'Create Ecosystem')
  const description = tr(
    'ecosystems.add.intro',
    'Register a new ecosystem on Verana, controlled by your acting corporation.'
  )

  if (!actingCorporation && !loading) {
    return <CorporationRequired title={title} description={description} failed={Boolean(error)} />
  }

  const toList = () => router.push('/ecosystems')
  const refreshList = () => void refetch()

  return (
    <PageTransition>
      <div className="@container/create min-w-0">
        <Link
          href="/ecosystems"
          className="mb-3 inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-3.5 rtl:rotate-180" />
          {tr('ecosystemList.title', 'Ecosystems')}
        </Link>
        <BlurFade>
          <PageHeader title={title} description={description} />
        </BlurFade>
        <div className="grid min-w-0 gap-6 md:grid-cols-[208px_minmax(0,1fr)] @5xl/create:grid-cols-[208px_minmax(0,1fr)_288px]">
          <StepRail
            steps={createSteps(mode === 'proposal')}
            current="details"
            className="md:sticky md:top-20 md:row-span-2 md:self-start"
          />
          <BlurFade delay={0.04} className="min-w-0 self-start">
            <section className="relative isolate overflow-hidden rounded-xl bg-card p-4 shadow-card sm:p-6">
              <AddEcosystemPage onCancel={toList} onRefresh={refreshList} withinView />
            </section>
          </BlurFade>
          <BlurFade
            delay={0.08}
            className="min-w-0 md:col-start-2 @5xl/create:sticky @5xl/create:top-20 @5xl/create:col-start-3 @5xl/create:row-start-1 @5xl/create:self-start"
          >
            <aside
              aria-label={tr('ecosystems.add.summary.title', 'Before you sign')}
              className="relative isolate overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-card sm:p-5"
            >
              <DotPattern
                width={14}
                height={14}
                className="-z-10 text-primary/25 [mask-image:radial-gradient(160px_circle_at_top_right,white,transparent)]"
              />
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-lg bg-tint-accent text-primary [&_svg]:size-4"
                >
                  <LayersIcon />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {tr('ecosystems.add.summary.title', 'Before you sign')}
                </h2>
              </div>
              <div className="mt-4">
                <CreateEcosystemNotes />
              </div>
            </aside>
          </BlurFade>
        </div>
      </div>
    </PageTransition>
  )
}
