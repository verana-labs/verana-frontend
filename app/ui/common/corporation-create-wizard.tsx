'use client'

import { useChain } from '@cosmos-kit/react'
import { KeyRoundIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { UserCorporation } from '@/lib/corporation-discovery'
import {
  DEFAULT_DECISION_POLICY_DRAFT,
  type DecisionPolicyDraft,
  formatDecisionRule,
  readDecisionPolicyDraft,
} from '@/lib/decision-policy'
import { canonicalizeLanguageTag } from '@/lib/language'
import { cn } from '@/lib/utils'
import {
  type CorporationMemberInput,
  type CreateCorporationParams,
  useActionCorporation,
} from '@/msg/actions_hooks/actionCorporation'
import { AddressIssueNote, addressIssue } from '@/ui/common/address-issue'
import { DecisionPolicyFields } from '@/ui/common/decision-policy-fields'
import { LanguageCombobox } from '@/ui/common/language-combobox'
import { ToneTag } from '@/ui/common/tone-tag'
import { WizardLayout } from '@/ui/common/wizard/wizard-layout'
import { FIELD_INPUT, FIELD_LABEL } from '@/ui/corporation/form-styles'
import { addressInitials } from '@/ui/corporation/shared'
import { SuccessCheck } from '@/ui/motion/feedback'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import { shortenMiddle } from '@/util/util'
import { isValidDID, isValidHttpUrl } from '@/util/validations'

const STEPS = ['identity', 'members', 'review', 'grant'] as const
type WizardStep = (typeof STEPS)[number]

function totalMemberWeight(members: CorporationMemberInput[]): number {
  return members.reduce((total, member) => {
    const weight = Number(member.weight)
    return total + (Number.isFinite(weight) ? weight : 0)
  }, 0)
}

function ReviewItem({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-all text-foreground">{children}</dd>
    </div>
  )
}

function MemberAvatar({ address, className }: { address: string; className?: string }) {
  return (
    <Avatar size="sm" className={cn('shrink-0', className)}>
      <AvatarFallback className="bg-tint-accent text-[10px] font-semibold text-primary">
        {address ? addressInitials(address) : '?'}
      </AvatarFallback>
    </Avatar>
  )
}

export function CorporationCreateWizard({
  onCreating,
  onDone,
}: {
  onCreating: (active: boolean) => void
  onDone: () => void
}) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { createOnly, grantFirstOperator } = useActionCorporation()

  const [step, setStep] = useState<WizardStep>('identity')
  const [did, setDid] = useState('')
  const [language, setLanguage] = useState('en')
  const [docUrl, setDocUrl] = useState('')
  const [extraMembers, setExtraMembers] = useState<CorporationMemberInput[]>([])
  const [ownWeight, setOwnWeight] = useState('1')
  const [policyDraft, setPolicyDraft] = useState<DecisionPolicyDraft>(DEFAULT_DECISION_POLICY_DRAFT)
  const [fundingUvna, setFundingUvna] = useState('0')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<UserCorporation | null>(null)

  const members = useMemo<CorporationMemberInput[]>(
    () => [
      { address: address ?? '', weight: ownWeight },
      ...extraMembers.map((member) => ({ ...member, address: member.address.trim() })),
    ],
    [address, ownWeight, extraMembers]
  )
  const createParams = useMemo<Omit<CreateCorporationParams, 'decisionPolicy'>>(
    () => ({ did: did.trim(), language, docUrl: docUrl.trim(), members }),
    [did, language, docUrl, members]
  )

  if (!address) return null

  const memberIssues = members.map((member, index) =>
    addressIssue(
      member.address,
      members.slice(0, index).map((listed) => listed.address)
    )
  )
  const identityValid = isValidDID(did.trim()) && language.length > 0 && isValidHttpUrl(docUrl.trim())
  const decisionPolicy = readDecisionPolicyDraft(policyDraft)
  const membersValid =
    members.every(
      (member, index) => member.address.length > 0 && memberIssues[index] === null && /^[1-9]\d*$/.test(member.weight)
    ) && decisionPolicy !== null
  const fundingValid = /^\d+$/.test(fundingUvna)
  const totalWeight = totalMemberWeight(members)

  async function create() {
    if (!decisionPolicy) return
    onCreating(true)
    setBusy(true)
    try {
      const corporation = await createOnly({ ...createParams, decisionPolicy })
      if (!corporation) {
        onCreating(false)
        return
      }
      setCreated(corporation)
      setStep('grant')
    } finally {
      setBusy(false)
    }
  }

  async function grant() {
    if (!created) return
    setBusy(true)
    try {
      const status = await grantFirstOperator(created, fundingUvna)
      if (status !== 'failed') onDone()
    } finally {
      setBusy(false)
    }
  }

  const steps = STEPS.map((entry) => ({
    id: entry,
    title: translate(`corporation.wizard.step.${entry}`),
    status: created && entry !== 'grant' ? ('complete' as const) : undefined,
  }))

  const next =
    step === 'identity'
      ? {
          label: translate('corporation.wizard.next'),
          disabled: !identityValid,
          onClick: () => setStep('members'),
        }
      : step === 'members'
        ? {
            label: translate('corporation.wizard.next'),
            disabled: !membersValid,
            onClick: () => setStep('review'),
          }
        : step === 'review'
          ? {
              disabled: !fundingValid,
              pending: busy,
              label: translate(busy ? 'corporation.wizard.creating' : 'corporation.wizard.create'),
              onClick: () => void create(),
            }
          : {
              pending: busy,
              label: (
                <>
                  {busy ? null : <KeyRoundIcon aria-hidden="true" />}
                  {translate(busy ? 'corporation.wizard.granting' : 'corporation.wizard.grant')}
                </>
              ),
              onClick: () => void grant(),
            }

  const onBack =
    step === 'members'
      ? () => setStep('identity')
      : step === 'review'
        ? () => setStep('members')
        : step === 'grant'
          ? onDone
          : undefined
  const backLabel = step === 'grant' ? translate('corporation.wizard.skip') : translate('corporation.wizard.back')

  return (
    <WizardLayout
      title={translate('corporation.wizard.title')}
      description={translate('corporation.wizard.desc')}
      steps={steps}
      current={step}
      onBack={onBack}
      backLabel={backLabel}
      next={next}
    >
      {step === 'identity' ? (
        <div className="grid grid-cols-1 gap-5 @2xl/wizard:grid-cols-2">
          <label className={cn(FIELD_LABEL, '@2xl/wizard:col-span-2')}>
            {translate('corporation.setup.did')}
            <input
              value={did}
              onChange={(event) => setDid(event.target.value)}
              placeholder="did:method:identifier"
              autoComplete="off"
              spellCheck={false}
              className={cn(FIELD_INPUT, 'font-mono')}
            />
          </label>
          <label className={FIELD_LABEL}>
            {translate('corporation.setup.language')}
            <LanguageCombobox value={language} onChange={(value) => setLanguage(canonicalizeLanguageTag(value))} />
          </label>
          <label className={FIELD_LABEL}>
            {translate('corporation.setup.docurl')}
            <input
              type="url"
              value={docUrl}
              onChange={(event) => setDocUrl(event.target.value)}
              placeholder="https://…"
              className={FIELD_INPUT}
            />
          </label>
        </div>
      ) : null}

      {step === 'members' ? (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {translate('corporation.page.members')}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-lg bg-tint-accent px-3 py-2 text-sm ring-1 ring-primary/15 sm:flex-nowrap">
              <MemberAvatar address={address} />
              <span className="min-w-0 basis-[calc(100%-2.125rem)] truncate font-mono text-xs sm:grow sm:basis-0 sm:text-sm">
                {shortenMiddle(address, 30)}
              </span>
              <ToneTag tone="accent" className="ms-8.5 sm:ms-0">
                {translate('corporation.wizard.you')}
              </ToneTag>
              <label className="ms-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:ms-0">
                {translate('corporation.page.weight')}
                <input
                  inputMode="numeric"
                  value={ownWeight}
                  onChange={(event) => setOwnWeight(event.target.value)}
                  className={cn(FIELD_INPUT, 'w-16 text-center tabular-nums')}
                />
              </label>
            </div>
            {extraMembers.map((member, index) => (
              <div
                key={`member-${index}`}
                className="animate-in duration-(--duration-base) fade-in-0 slide-in-from-top-1 motion-reduce:animate-none"
              >
                <div className="flex flex-wrap items-center gap-2 px-3 text-sm">
                  <MemberAvatar address={member.address.trim()} />
                  <input
                    value={member.address}
                    onChange={(event) =>
                      setExtraMembers(
                        extraMembers.map((entry, i) =>
                          i === index ? { ...entry, address: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="verana1…"
                    spellCheck={false}
                    aria-label={`${translate('corporation.page.members')} ${index + 2}`}
                    className={cn(FIELD_INPUT, 'min-w-0 flex-1 basis-[calc(100%-2rem)] font-mono sm:basis-0')}
                  />
                  {memberIssues[index + 1] ? (
                    <div className="-mt-1.5 basis-full ps-8 sm:order-last">
                      <AddressIssueNote issue={memberIssues[index + 1]} />
                    </div>
                  ) : null}
                  <label className="ms-8 flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:ms-0">
                    {translate('corporation.page.weight')}
                    <input
                      inputMode="numeric"
                      value={member.weight}
                      onChange={(event) =>
                        setExtraMembers(
                          extraMembers.map((entry, i) =>
                            i === index ? { ...entry, weight: event.target.value } : entry
                          )
                        )
                      }
                      className={cn(FIELD_INPUT, 'w-16 text-center tabular-nums')}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={translate('corporation.wizard.removemember')}
                    onClick={() => setExtraMembers(extraMembers.filter((_, i) => i !== index))}
                    className="ms-auto shrink-0 text-muted-foreground hover:bg-tint-destructive hover:text-destructive sm:ms-0"
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExtraMembers([...extraMembers, { address: '', weight: '1' }])}
              className="mt-1 self-start"
            >
              <PlusIcon aria-hidden="true" />
              {translate('corporation.wizard.addmember')}
            </Button>
          </section>
          <section className="grid grid-cols-1 gap-4 rounded-lg bg-muted/40 p-4 ring-1 ring-border/60 @2xl/wizard:grid-cols-2">
            <DecisionPolicyFields value={policyDraft} onChange={setPolicyDraft} totalWeight={totalWeight} />
          </section>
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="flex flex-col gap-5">
          <p className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-tint-warning px-4 py-3 text-sm text-warning">
            <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {translate('corporation.wizard.noprivileges')}
          </p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg bg-muted/40 p-4 ring-1 ring-border/60 sm:grid-cols-2">
            <ReviewItem label="DID">
              <span className="font-mono">{did.trim()}</span>
            </ReviewItem>
            <ReviewItem label={translate('corporation.setup.language')}>{language}</ReviewItem>
            <ReviewItem label={translate('corporation.setup.docurl')} wide>
              {docUrl.trim()}
            </ReviewItem>
            <ReviewItem label={translate('corporation.page.members')}>
              {members.map((member, index) => (
                <span key={`review-${index}-${member.address}`} className="block font-mono text-xs">
                  {shortenMiddle(member.address, 26)} ×{member.weight}
                </span>
              ))}
            </ReviewItem>
            {decisionPolicy ? (
              <ReviewItem
                label={`${translate(`corporation.page.${decisionPolicy.rule.kind}`)} / ${translate('corporation.page.votingperiod')} / ${translate('corporation.page.minexecutionperiod')}`}
              >
                {formatDecisionRule(decisionPolicy.rule)} / {decisionPolicy.votingPeriodSeconds}s /{' '}
                {decisionPolicy.minExecutionPeriodSeconds}s
              </ReviewItem>
            ) : null}
          </dl>
          <label className={cn(FIELD_LABEL, 'max-w-xs')}>
            {translate('corporation.setup.funding')}
            <input
              inputMode="numeric"
              value={fundingUvna}
              onChange={(event) => setFundingUvna(event.target.value)}
              className={cn(FIELD_INPUT, 'tabular-nums')}
            />
          </label>
        </div>
      ) : null}

      {step === 'grant' && created ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <SuccessCheck className="size-14" />
          <p className="text-base font-semibold text-foreground">
            {translate('corporation.wizard.created')} <span className="font-mono tabular-nums">#{created.id}</span>
          </p>
          <p className="max-w-md text-sm text-muted-foreground">{translate('corporation.wizard.grantdesc')}</p>
        </div>
      ) : null}
    </WizardLayout>
  )
}
