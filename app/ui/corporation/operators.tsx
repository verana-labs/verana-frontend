'use client'

import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { OperatorAuthorizationRow, VsOperatorAuthorizationRow } from '@/hooks/useCorporationDetails'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { groupMsgTypes, MODULE_LABELS } from './msg-type-groups'
import { Card, formatDate, SectionTitle, t, YouBadge } from './shared'

const CHIP = 'text-xs px-2 py-0.5 rounded-md border'
const CHIP_ON =
  'border-primary-300 bg-primary-100 text-primary-800 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
const CHIP_OFF = 'border-neutral-20 dark:border-neutral-70 text-gray-400 line-through'

export function MsgTypeChips({
  typeUrls,
  selected,
  onToggle,
}: {
  typeUrls: readonly string[]
  selected?: Set<string>
  onToggle?: (typeUrl: string) => void
}) {
  return (
    <div className="space-y-2">
      {groupMsgTypes(typeUrls).map((group) => (
        <div key={group.module} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-32">
            {MODULE_LABELS[group.module] ?? group.module}
          </span>
          {group.entries.map((entry) => {
            const active = selected ? selected.has(entry.typeUrl) : true
            const className = `${CHIP} ${active ? CHIP_ON : CHIP_OFF}`
            return onToggle ? (
              <button
                key={entry.typeUrl}
                type="button"
                onClick={() => onToggle(entry.typeUrl)}
                aria-pressed={active}
                className={className}
              >
                {entry.name}
              </button>
            ) : (
              <span key={entry.typeUrl} className={className}>
                {entry.name}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function OperatorRow({
  authorization,
  revokeMode,
  walletAddress,
  onRevoke,
}: {
  authorization: OperatorAuthorizationRow
  revokeMode: CorporationSigningMode | null
  walletAddress: string | undefined
  onRevoke: (operator: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="min-w-0 text-left flex items-center gap-2"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className="font-mono break-all flex items-center gap-2">
              {authorization.operator}
              {authorization.operator === walletAddress ? <YouBadge /> : null}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {authorization.msgTypes.length} {t('corporation.page.msgtypes')}
            </span>
          </span>
        </button>
        {revokeMode ? (
          <button
            type="button"
            onClick={() => onRevoke(authorization.operator)}
            className="px-3 py-1.5 border border-red-300 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <SigningModeIcon mode={revokeMode} />
            {t('corporation.page.revoke')}
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-2 ml-5">
          <MsgTypeChips typeUrls={authorization.msgTypes} />
        </div>
      ) : null}
    </li>
  )
}

export function GrantOperatorForm({
  mode,
  onGrant,
}: {
  mode: CorporationSigningMode
  onGrant: (grantee: string, msgTypes: string[]) => void
}) {
  const [grantee, setGrantee] = useState('')
  const [selected, setSelected] = useState(() => new Set<string>(OPERATOR_GRANT_MESSAGE_TYPES))
  const [showTypes, setShowTypes] = useState(false)

  function toggle(typeUrl: string) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(typeUrl)) next.delete(typeUrl)
      else next.add(typeUrl)
      return next
    })
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (grantee.trim() && selected.size > 0) {
          onGrant(grantee.trim(), [...selected])
          setGrantee('')
        }
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 grow max-w-xl">
          {t('corporation.page.grant')}
          <input
            value={grantee}
            onChange={(event) => setGrantee(event.target.value)}
            placeholder="verana1…"
            className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
          />
        </label>
        <button
          type="submit"
          disabled={!grantee.trim() || selected.size === 0}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
        >
          <SigningModeIcon mode={mode} />
          {t('corporation.page.grant.submit')}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setShowTypes(!showTypes)}
        aria-expanded={showTypes}
        className="text-xs text-primary-700 dark:text-primary-300 flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${showTypes ? 'rotate-180' : ''}`} />
        {t('corporation.page.grant.count', { selected: selected.size, total: OPERATOR_GRANT_MESSAGE_TYPES.length })}
      </button>
      {showTypes ? (
        <div className="space-y-2">
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSelected(new Set(OPERATOR_GRANT_MESSAGE_TYPES))}
              className="text-primary-700 dark:text-primary-300"
            >
              {t('corporation.page.msgtypes.all')}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-primary-700 dark:text-primary-300"
            >
              {t('corporation.page.msgtypes.none')}
            </button>
          </div>
          <MsgTypeChips typeUrls={OPERATOR_GRANT_MESSAGE_TYPES} selected={selected} onToggle={toggle} />
        </div>
      ) : null}
    </form>
  )
}

export function OperatorsSection({
  authorizations,
  vsAuthorizations,
  revokeMode,
  grantMode,
  walletAddress,
  onRevoke,
  onGrant,
}: {
  authorizations: OperatorAuthorizationRow[]
  vsAuthorizations: VsOperatorAuthorizationRow[]
  revokeMode: CorporationSigningMode | null
  grantMode: CorporationSigningMode | null
  walletAddress: string | undefined
  onRevoke: (operator: string) => void
  onGrant: (grantee: string, msgTypes: string[]) => void
}) {
  return (
    <div id="operators" className="space-y-6">
      <Card>
        <div className="mb-3">
          <SectionTitle>{t('corporation.page.operators')}</SectionTitle>
        </div>
        <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {authorizations.map((authorization) => (
            <OperatorRow
              key={authorization.id}
              authorization={authorization}
              revokeMode={revokeMode}
              walletAddress={walletAddress}
              onRevoke={onRevoke}
            />
          ))}
          {authorizations.length === 0 ? (
            <li className="py-2 text-sm text-gray-500">{t('corporation.page.operators.empty')}</li>
          ) : null}
        </ul>
        {grantMode ? <GrantOperatorForm mode={grantMode} onGrant={onGrant} /> : null}
      </Card>
      {vsAuthorizations.length > 0 ? (
        <Card>
          <div className="mb-3">
            <SectionTitle>{t('corporation.page.agents')}</SectionTitle>
          </div>
          <ul className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {vsAuthorizations.map((authorization) => (
              <li key={`${authorization.vsOperator}-${authorization.participantId}`} className="py-2 text-sm">
                <span className="font-mono break-all">{authorization.vsOperator}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {authorization.participantId !== null ? `participant ${authorization.participantId} · ` : ''}
                  {authorization.msgTypes.length} {t('corporation.page.msgtypes')}
                  {authorization.expiration ? ` · ${formatDate(authorization.expiration)}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('corporation.page.agents.note')}</p>
        </Card>
      ) : null}
    </div>
  )
}
