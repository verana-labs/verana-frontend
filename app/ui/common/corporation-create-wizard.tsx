'use client'

import { useChain } from '@cosmos-kit/react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  KeyRoundIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react'
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
import { FIELD_INPUT, FIELD_LABEL } from '@/ui/corporation/form-styles'
import { addressInitials } from '@/ui/corporation/shared'
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle } from '@/ui/corporation/stepper'
import { BlurFade } from '@/ui/motion/blur-fade'
import { SuccessCheck } from '@/ui/motion/feedback'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'
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

function MemberAvatar({ address }: { address: string }) {
  return (
    <Avatar size="sm" className="shrink-0">
      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
        {address ? addressInitials(address) : '?'}
      </AvatarFallback>
    </Avatar>
  )
}

export function CorporationCreateWizard({
  onCreating,
  onDone,
  onCancel,
}: {
  onCreating: (active: boolean) => void
  onDone: () => void
  onCancel?: () => void
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
    () => ({
      did: did.trim(),
      language,
      docUrl: docUrl.trim(),
      members,
    }),
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

  const stepIndex = STEPS.indexOf(step)

  return (
    <section className="mx-auto mb-6 max-w-3xl overflow-hidden rounded-xl bg-card shadow-card">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Building2Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {translate('corporation.wizard.title')}
            </h2>
            <p className="text-sm text-muted-foreground">{translate('corporation.wizard.desc')}</p>
          </div>
        </div>
        <Stepper value={stepIndex} className="mt-6">
          {STEPS.map((entry, index) => (
            <StepperItem key={entry} step={index} completed={created !== null && entry !== 'grant'} loading={busy}>
              <StepperIndicator />
              <StepperTitle>{translate(`corporation.wizard.step.${entry}`)}</StepperTitle>
              <StepperSeparator />
            </StepperItem>
          ))}
        </Stepper>
      </div>

      <BlurFade key={step} className="p-5 sm:p-6">
        {step === 'identity' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className={cn(FIELD_LABEL, 'md:col-span-2')}>
                {translate('corporation.setup.did')}
                <input
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  placeholder="did:method:identifier"
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
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://…"
                  className={FIELD_INPUT}
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              {onCancel && !busy && !created ? (
                <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
                  {translate('corporation.wizard.cancel')}
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                size="lg"
                disabled={!identityValid}
                onClick={() => setStep('members')}
                className="gap-1.5"
              >
                {translate('corporation.wizard.next')}
                <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'members' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-border/60">
                <MemberAvatar address={address} />
                <span className="min-w-0 grow truncate font-mono text-xs sm:text-sm">{shortenMiddle(address, 30)}</span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                  {translate('corporation.wizard.you')}
                </span>
                <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {translate('corporation.page.weight')}
                  <input
                    inputMode="numeric"
                    value={ownWeight}
                    onChange={(e) => setOwnWeight(e.target.value)}
                    className={cn(FIELD_INPUT, 'w-16 text-center tabular-nums')}
                  />
                </label>
              </div>
              {extraMembers.map((member, index) => (
                <div key={`member-${index}`} className="animate-in fade-in-0 slide-in-from-top-1">
                  <div className="flex flex-wrap items-center gap-2 px-3 text-sm sm:flex-nowrap">
                    <MemberAvatar address={member.address.trim()} />
                    <input
                      value={member.address}
                      onChange={(e) =>
                        setExtraMembers(
                          extraMembers.map((m, i) => (i === index ? { ...m, address: e.target.value } : m))
                        )
                      }
                      placeholder="verana1…"
                      aria-invalid={memberIssues[index + 1] ? true : undefined}
                      className={cn(FIELD_INPUT, 'min-w-0 flex-1 font-mono')}
                    />
                    <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {translate('corporation.page.weight')}
                      <input
                        inputMode="numeric"
                        value={member.weight}
                        onChange={(e) =>
                          setExtraMembers(
                            extraMembers.map((m, i) => (i === index ? { ...m, weight: e.target.value } : m))
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
                      className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="ps-12">
                    <AddressIssueNote issue={memberIssues[index + 1]} />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setExtraMembers([...extraMembers, { address: '', weight: '1' }])}
                className="gap-1.5"
              >
                <PlusIcon aria-hidden="true" />
                {translate('corporation.wizard.addmember')}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/40 p-4 ring-1 ring-border/60 md:grid-cols-2">
              <DecisionPolicyFields value={policyDraft} onChange={setPolicyDraft} totalWeight={totalWeight} />
            </div>
            <div className="flex justify-between border-t border-border pt-5">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep('identity')} className="gap-1.5">
                <ArrowLeftIcon aria-hidden="true" className="rtl:rotate-180" />
                {translate('corporation.wizard.back')}
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={!membersValid}
                onClick={() => setStep('review')}
                className="gap-1.5"
              >
                {translate('corporation.wizard.next')}
                <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <div className="space-y-6">
            <p className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
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
                onChange={(e) => setFundingUvna(e.target.value)}
                className={cn(FIELD_INPUT, 'tabular-nums')}
              />
            </label>
            <div className="flex justify-between border-t border-border pt-5">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep('members')} className="gap-1.5">
                <ArrowLeftIcon aria-hidden="true" className="rtl:rotate-180" />
                {translate('corporation.wizard.back')}
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={busy || !fundingValid}
                onClick={() => void create()}
                className="gap-2"
              >
                {busy ? <Spinner aria-hidden="true" /> : null}
                {translate(busy ? 'corporation.wizard.creating' : 'corporation.wizard.create')}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'grant' && created ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <SuccessCheck className="size-14" />
              <p className="text-base font-semibold text-foreground">
                {translate('corporation.wizard.created')} <span className="font-mono">#{created.id}</span>
              </p>
              <p className="max-w-md text-sm text-muted-foreground">{translate('corporation.wizard.grantdesc')}</p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" size="lg" onClick={onDone}>
                {translate('corporation.wizard.skip')}
              </Button>
              <Button type="button" size="lg" disabled={busy} onClick={() => void grant()} className="gap-2">
                {busy ? <Spinner aria-hidden="true" /> : <KeyRoundIcon aria-hidden="true" />}
                {translate(busy ? 'corporation.wizard.granting' : 'corporation.wizard.grant')}
              </Button>
            </div>
          </div>
        ) : null}
      </BlurFade>
    </section>
  )
}
