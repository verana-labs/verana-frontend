'use client'

import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import type { JoinableParticipantRole } from '@/lib/participant-onboarding'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { isExpireSoon, onboardingStateColor, participantStateBadgeClass, roleBadgeClass } from '@/util/util'

export type CreatedParticipant = {
  id: string | undefined
  msgType: 'MsgSelfCreateParticipant' | 'MsgStartParticipantOP'
  did: string
  role: JoinableParticipantRole
}

type JoinSuccessProps = {
  created: CreatedParticipant
  participant: Participant | null
  schemaId: string
}

const BADGE_CLASS = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function JoinSuccess({ created, participant, schemaId }: JoinSuccessProps) {
  const proposal = created.id === undefined
  const expireSoon = isExpireSoon(participant?.effective_until)
  const { labelOnboardingState, classOnboardingState } = onboardingStateColor(participant?.op_state)
  const { labelParticipantState, classParticipantState } = participantStateBadgeClass(
    participant?.participant_state,
    expireSoon
  )

  return (
    <section className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8">
      <div className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon className="text-white text-4xl" aria-hidden="true" icon={faCheck} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        {proposal ? t('join.proposal.pending.title') : t('join.success.title')}
      </h1>
      {proposal ? (
        <p className="text-neutral-70 mb-8 text-center">{t('join.proposal.pending.desc')}</p>
      ) : (
        <>
          <dl className="mx-auto max-w-xl grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm mb-6">
            <dt className="text-neutral-70">{t('join.success.participant')}</dt>
            <dd className="font-mono text-gray-900 dark:text-white">{created.id}</dd>
            <dt className="text-neutral-70">{t('dataview.participant.fields.did')}</dt>
            <dd className="font-mono text-gray-900 dark:text-white break-all">{created.did}</dd>
            <dt className="text-neutral-70">{t('join.success.role')}</dt>
            <dd>
              <span className={`${BADGE_CLASS} ${roleBadgeClass(created.role)}`}>{created.role}</span>
            </dd>
            {participant?.op_state ? (
              <>
                <dt className="text-neutral-70">{t('join.success.opstate')}</dt>
                <dd>
                  <span className={`${BADGE_CLASS} ${classOnboardingState}`}>{labelOnboardingState}</span>
                </dd>
              </>
            ) : null}
            {participant ? (
              <>
                <dt className="text-neutral-70">{t('join.success.state')}</dt>
                <dd>
                  <span className={`${BADGE_CLASS} ${classParticipantState}`}>{labelParticipantState}</span>
                </dd>
              </>
            ) : null}
          </dl>
          <p className="mx-auto max-w-xl text-neutral-70 mb-8">
            {created.msgType === 'MsgStartParticipantOP' ? t('join.success.op') : t('join.success.selfcreate')}
          </p>
        </>
      )}
      <div className="text-center">
        <Link
          href={`/participants/${schemaId}`}
          className="inline-flex items-center px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
        >
          <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faArrowRight} />
          {t('join.success.view')}
        </Link>
      </div>
    </section>
  )
}
