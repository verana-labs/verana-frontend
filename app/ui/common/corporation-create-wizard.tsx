'use client'

import { useChain } from '@cosmos-kit/react'
import { faCheck, faPlus, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { UserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { type CorporationMemberInput, useActionCorporation } from '@/msg/actions_hooks/actionCorporation'
import { resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'
import { isValidHttpUrl } from '@/util/validations'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

const STEPS = ['identity', 'members', 'review', 'grant'] as const
type WizardStep = (typeof STEPS)[number]

const inputClass =
  'mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface'
const primaryButton =
  'px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60'
const ghostButton = 'px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg font-medium'

function StepDots({ current, created }: { current: WizardStep; created: boolean }) {
  const currentIndex = STEPS.indexOf(current)
  return (
    <ol className="flex flex-wrap items-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const done = index < currentIndex || (created && step !== 'grant')
        const active = step === current
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                active
                  ? 'bg-primary-600 text-white'
                  : done
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                    : 'bg-neutral-20 dark:bg-neutral-70/40 text-gray-600 dark:text-gray-300'
              }`}
            >
              {done && !active ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
            </span>
            <span
              className={`text-sm ${active ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {t(`corporation.wizard.step.${step}`)}
            </span>
            {index < STEPS.length - 1 ? <span className="w-6 h-px bg-neutral-20 dark:bg-neutral-70" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

export function CorporationCreateWizard({ onDone }: { onDone: () => void }) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { createOnly, grantFirstOperator } = useActionCorporation()

  const [step, setStep] = useState<WizardStep>('identity')
  const [did, setDid] = useState('')
  const [language, setLanguage] = useState('en')
  const [docUrl, setDocUrl] = useState('')
  const [extraMembers, setExtraMembers] = useState<CorporationMemberInput[]>([])
  const [ownWeight, setOwnWeight] = useState('1')
  const [threshold, setThreshold] = useState('1')
  const [votingPeriod, setVotingPeriod] = useState('60')
  const [fundingUvna, setFundingUvna] = useState('0')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<UserCorporation | null>(null)

  if (!address) return null

  const members: CorporationMemberInput[] = [{ address, weight: ownWeight }, ...extraMembers]
  const identityValid = did.trim().startsWith('did:') && language.trim().length > 0 && isValidHttpUrl(docUrl.trim())
  const membersValid =
    members.every((member) => member.address.startsWith('verana1') && /^[1-9]\d*$/.test(member.weight)) &&
    /^[1-9]\d*$/.test(threshold) &&
    /^[1-9]\d*$/.test(votingPeriod)
  const fundingValid = /^\d+$/.test(fundingUvna)

  async function create() {
    setBusy(true)
    try {
      const corporation = await createOnly({
        did: did.trim(),
        language: language.trim(),
        docUrl: docUrl.trim(),
        fundingUvna,
        forceCreate: true,
        members,
        threshold,
        votingPeriodSeconds: Number(votingPeriod),
      })
      if (corporation) {
        setCreated(corporation)
        setStep('grant')
      }
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

  return (
    <section className="mb-6 rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('corporation.wizard.title')}</h2>
      <p className="text-sm text-neutral-70 mb-6">{t('corporation.wizard.desc')}</p>
      <StepDots current={step} created={created !== null} />

      {step === 'identity' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            {t('corporation.setup.did')}
            <input
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:method:identifier"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('corporation.setup.language')}
            <input value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('corporation.setup.docurl')}
            <input
              type="url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              disabled={!identityValid}
              onClick={() => setStep('members')}
              className={primaryButton}
            >
              {t('corporation.wizard.next')}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'members' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono grow break-all">{shortenMiddle(address, 30)}</span>
              <label className="text-gray-500 dark:text-gray-400">
                {t('corporation.page.weight')}
                <input
                  value={ownWeight}
                  onChange={(e) => setOwnWeight(e.target.value)}
                  className="ml-2 w-16 px-2 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
                />
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('corporation.wizard.you')}</span>
            </div>
            {extraMembers.map((member, index) => (
              <div key={`member-${index}-${member.address}`} className="flex items-center gap-2 text-sm">
                <input
                  value={member.address}
                  onChange={(e) =>
                    setExtraMembers(extraMembers.map((m, i) => (i === index ? { ...m, address: e.target.value } : m)))
                  }
                  placeholder="verana1…"
                  className="grow px-2 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface font-mono"
                />
                <label className="text-gray-500 dark:text-gray-400">
                  {t('corporation.page.weight')}
                  <input
                    value={member.weight}
                    onChange={(e) =>
                      setExtraMembers(extraMembers.map((m, i) => (i === index ? { ...m, weight: e.target.value } : m)))
                    }
                    className="ml-2 w-16 px-2 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
                  />
                </label>
                <button
                  type="button"
                  aria-label={t('corporation.wizard.removemember')}
                  onClick={() => setExtraMembers(extraMembers.filter((_, i) => i !== index))}
                  className="text-red-500 px-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraMembers([...extraMembers, { address: '', weight: '1' }])}
              className="text-sm font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('corporation.wizard.addmember')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('corporation.page.threshold')}
              <input value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('corporation.wizard.votingperiod')}
              <input value={votingPeriod} onChange={(e) => setVotingPeriod(e.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('identity')} className={ghostButton}>
              {t('corporation.wizard.back')}
            </button>
            <button type="button" disabled={!membersValid} onClick={() => setStep('review')} className={primaryButton}>
              {t('corporation.wizard.next')}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="space-y-4">
          <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg p-4 flex gap-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-100">{t('corporation.wizard.noprivileges')}</p>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">DID</dt>
              <dd className="break-all">{did.trim()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('corporation.setup.language')}
              </dt>
              <dd>{language.trim()}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('corporation.setup.docurl')}
              </dt>
              <dd className="break-all">{docUrl.trim()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('corporation.page.members')}
              </dt>
              <dd>
                {members.map((member) => (
                  <span key={member.address} className="block font-mono">
                    {shortenMiddle(member.address, 26)} ×{member.weight}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('corporation.page.threshold')} / {t('corporation.wizard.votingperiod')}
              </dt>
              <dd>
                {threshold} / {votingPeriod}s
              </dd>
            </div>
          </dl>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block max-w-xs">
            {t('corporation.setup.funding')}
            <input value={fundingUvna} onChange={(e) => setFundingUvna(e.target.value)} className={inputClass} />
          </label>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('members')} className={ghostButton}>
              {t('corporation.wizard.back')}
            </button>
            <button
              type="button"
              disabled={busy || !fundingValid}
              onClick={() => void create()}
              className={primaryButton}
            >
              {t(busy ? 'corporation.wizard.creating' : 'corporation.wizard.create')}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'grant' && created ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {t('corporation.wizard.created')} <span className="font-mono">#{created.id}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('corporation.wizard.grantdesc')}</p>
          <div className="flex justify-between">
            <button type="button" onClick={onDone} className={ghostButton}>
              {t('corporation.wizard.skip')}
            </button>
            <button type="button" disabled={busy} onClick={() => void grant()} className={primaryButton}>
              {t(busy ? 'corporation.wizard.granting' : 'corporation.wizard.grant')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
