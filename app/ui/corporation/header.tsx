'use client'

import { Building2Icon, PlusIcon, WalletIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { CorporationProfile, GroupMemberRow } from '@/hooks/useCorporationDetails'
import type { ActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import type { DidEnrichment, DidTrustState } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { CapabilityButton } from '@/ui/common/capability-button'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import TrustBadge from '@/ui/common/trust-badge'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { countryCodeToFlag, shortenMiddle } from '@/util/util'
import { isValidDID } from '@/util/validations'
import { addressInitials, nameInitials } from './shared'

const VISIBLE_AVATARS = 4

export function RotateDidForm({ mode, onSubmit }: { mode: CorporationSigningMode; onSubmit: (did: string) => void }) {
  const [draft, setDraft] = useState('')
  const valid = isValidDID(draft.trim())
  return (
    <BlurFade>
      <form
        className="flex flex-col gap-2 border-t border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (valid) {
            onSubmit(draft.trim())
            setDraft('')
          }
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="did:method:identifier"
          aria-label={translate('corporation.page.rotatedid')}
          className="h-9 bg-background font-mono sm:max-w-xl"
        />
        <Button type="submit" size="lg" disabled={!valid}>
          <SigningModeIcon mode={mode} />
          {translate('corporation.page.rotatedid.submit')}
        </Button>
      </form>
    </BlurFade>
  )
}

function MemberStack({ members }: { members: GroupMemberRow[] }) {
  if (members.length === 0) return null
  const shown = members.slice(0, VISIBLE_AVATARS)
  const rest = members.length - shown.length
  return (
    <div className="flex items-center gap-2">
      <AvatarGroup className="-space-x-1.5">
        {shown.map((member) => (
          <Avatar key={member.address} title={member.address} className="size-7 ring-2 ring-card">
            <AvatarFallback className="bg-linear-to-br from-primary/25 to-primary/5 text-[10px] font-semibold text-primary">
              {addressInitials(member.address)}
            </AvatarFallback>
          </Avatar>
        ))}
        {rest > 0 ? <AvatarGroupCount className="size-7 text-[10px]">+{rest}</AvatarGroupCount> : null}
      </AvatarGroup>
      <span className="text-xs text-muted-foreground tabular-nums">
        {members.length}{' '}
        {translate(members.length === 1 ? 'corporation.selector.member' : 'corporation.tab.members').toLowerCase()}
      </span>
    </div>
  )
}

export function CorporationHeader({
  profile,
  members,
  enrichment,
  rotate,
  rotating,
  onToggleRotate,
  onCreate,
  rotateForm,
  nav,
}: {
  profile: CorporationProfile
  members: GroupMemberRow[]
  enrichment: DidEnrichment | null
  rotate: ActionSigning
  rotating: boolean
  onToggleRotate: () => void
  onCreate: () => void
  rotateForm?: ReactNode
  nav?: ReactNode
}) {
  const displayName = enrichment?.organizationName ?? enrichment?.serviceName
  const trust = (enrichment?.trustStatus ?? 'UNRESOLVED') as DidTrustState

  return (
    <section className="overflow-hidden rounded-xl bg-card shadow-card">
      <div className="relative isolate flex flex-col gap-5 bg-linear-to-br from-primary/10 via-card to-card p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <DotPattern
          width={16}
          height={16}
          className="-z-10 text-primary/25 [mask-image:radial-gradient(320px_circle_at_top_right,white,transparent)] rtl:[mask-image:radial-gradient(320px_circle_at_top_left,white,transparent)]"
        />
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-400 to-primary-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] sm:size-14"
          >
            {displayName ? (
              <span className="text-base font-semibold tracking-tight sm:text-lg">{nameInitials(displayName)}</span>
            ) : (
              <Building2Icon className="size-6" />
            )}
          </span>
          <div className="min-w-0 space-y-2">
            <h1 className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {enrichment?.countryCode ? (
                <span aria-hidden="true">{countryCodeToFlag(enrichment.countryCode)}</span>
              ) : null}
              <span className="min-w-0 break-all">{displayName ?? shortenMiddle(profile.did, 40)}</span>
              <TrustBadge state={trust} size="md" />
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {displayName ? (
                <span className="min-w-0 font-mono break-all" title={profile.did}>
                  {profile.did}
                </span>
              ) : null}
              <Badge variant="outline" className="border-transparent bg-tint-accent font-mono text-primary">
                #{profile.id}
              </Badge>
              <span className="inline-flex items-center gap-1 font-mono" title={profile.policyAddress}>
                <WalletIcon aria-hidden="true" className="size-3.5" />
                {shortenMiddle(profile.policyAddress, 26)}
              </span>
            </div>
            <MemberStack members={members} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <CapabilityButton
            signing={rotate}
            label={translate('corporation.page.rotatedid')}
            onClick={onToggleRotate}
            className={cn(
              buttonVariants({ variant: rotating ? 'secondary' : 'outline', size: 'lg' }),
              'gap-2',
              !rotating && 'bg-background'
            )}
          />
          <Button type="button" variant="outline" size="lg" onClick={onCreate} className="gap-2 bg-background">
            <PlusIcon aria-hidden="true" />
            {translate('corporation.page.new')}
          </Button>
        </div>
      </div>
      {rotating && rotate.mode ? rotateForm : null}
      {nav}
    </section>
  )
}
