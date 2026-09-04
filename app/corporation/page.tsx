'use client'

import { useChain } from '@cosmos-kit/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useCorporationDetails, useProposalVotes } from '@/hooks/useCorporationDetails'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { logger } from '@/lib/logger'
import { type DidEnrichment, fetchDidEnrichment } from '@/lib/resolverClient'
import { corporationSigningMode, useCorporationManage } from '@/msg/actions_hooks/actionCorporationManage'
import { CorporationCreateWizard } from '@/ui/common/corporation-create-wizard'
import { ProposalComposer } from '@/ui/common/proposal-composer'
import { type CorporationTab, type CorporationView, TABS, TabsLayout } from '@/ui/corporation/layouts'
import { t } from '@/ui/corporation/shared'

function pick<T extends string>(values: readonly T[], value: string | null, fallback: T): T {
  return (values as readonly string[]).includes(value ?? '') ? (value as T) : fallback
}

export default function CorporationPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { acting, loading: actingLoading, refetch: refetchCorporations, revalidate } = useUserCorporation()
  const { details, loading, error, refetch } = useCorporationDetails(acting?.corporation.id)
  const refreshAfterTx = () => {
    void refetch()
    void revalidate()
  }
  const manage = useCorporationManage(refreshAfterTx)
  const rotate = useActionSigning('MsgUpdateCorporation')
  const [rotating, setRotating] = useState(false)
  const [composing, setComposing] = useState(false)
  const [enrichment, setEnrichment] = useState<DidEnrichment | null>(null)

  const creating = searchParams.get('create') === '1'
  const tab = pick(TABS, searchParams.get('tab'), 'overview')

  const proposalIds = useMemo(() => (details?.proposals ?? []).map((proposal) => proposal.id), [details])
  const { votes } = useProposalVotes(proposalIds)

  const did = details?.profile.did
  useEffect(() => {
    setEnrichment(null)
    if (!did) return
    let cancelled = false
    fetchDidEnrichment(did)
      .then((value) => {
        if (!cancelled) setEnrichment(value)
      })
      .catch((cause) => logger.error('corporation enrichment', cause))
    return () => {
      cancelled = true
    }
  }, [did])

  function selectTab(next: CorporationTab) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'overview') params.delete('tab')
    else params.set('tab', next)
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`)
  }

  if (actingLoading || (acting && loading)) {
    return <p className="p-6 text-sm text-gray-500">{t('corporation.page.loading')}</p>
  }

  if (!acting || creating) {
    return (
      <>
        {!acting ? (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{t('corporation.page.nocorp')}</p>
        ) : null}
        <CorporationCreateWizard
          onDone={() => {
            void refetchCorporations()
            router.replace(pathname)
          }}
        />
      </>
    )
  }

  if (error || !details) {
    return <div className="p-6 error-pane">{error ?? t('corporation.page.error')}</div>
  }

  const { members, policy, trustDeposit, proposals } = details
  const unrepaidSlash = trustDeposit ? trustDeposit.slashedDeposit - trustDeposit.repaidDeposit : 0
  const openProposals = proposals.filter((proposal) => proposal.status === 'SUBMITTED').length
  const view: CorporationView = {
    acting,
    details,
    enrichment,
    walletAddress: address,
    openProposals,
    unrepaidSlash,
    rotate,
    modes: {
      grant: corporationSigningMode('/verana.de.v1.MsgGrantOperatorAuthorization', acting),
      revoke: corporationSigningMode('/verana.de.v1.MsgRevokeOperatorAuthorization', acting),
      repay: corporationSigningMode('/verana.td.v1.MsgRepaySlashedTrustDeposit', acting),
    },
    rotating,
    onToggleRotate: () => setRotating(!rotating),
    onRotate: (nextDid) => {
      void manage.updateCorporationDid(acting, nextDid)
      setRotating(false)
    },
    onCreate: () => router.push(`${pathname}?create=1`),
    onGrant: (grantee, msgTypes) => void manage.grantOperator(acting, grantee, msgTypes),
    onRevoke: (operator) => void manage.revokeOperator(acting, operator),
    onRepay: () => void manage.repaySlashed(acting, unrepaidSlash),
    composing,
    onCompose: () => setComposing(true),
    composer: (
      <ProposalComposer
        membership={acting}
        policy={policy}
        members={members}
        onDone={refreshAfterTx}
        onClose={() => setComposing(false)}
      />
    ),
    proposalCtx: {
      members,
      policy,
      isMember: acting.member,
      walletAddress: address,
      votesById: votes,
      actions: {
        onVote: (id, choice) => void manage.vote(id, choice),
        onExecute: (id) => void manage.execute(id),
        onWithdraw: (id) => void manage.withdraw(id),
      },
    },
  }

  return <TabsLayout view={view} tab={tab} onSelectTab={selectTab} />
}
