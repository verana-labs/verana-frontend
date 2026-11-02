'use client'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { type MouseEvent, useId } from 'react'
import { type ActionSigning, useActionSigning } from '@/hooks/useSigningMode'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'

interface CapabilityButtonProps {
  signing: ActionSigning
  label: string
  icon?: IconDefinition
  className: string
  disabled?: boolean
  blockedReason?: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export function CapabilityButton({
  signing,
  label,
  icon,
  className,
  disabled = false,
  blockedReason,
  onClick,
}: CapabilityButtonProps) {
  const reasonId = useId()
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || Boolean(blockedReason) || signing.disabled}
      title={blockedReason ?? signing.reason}
      aria-describedby={signing.reason ? reasonId : undefined}
      className={clsx(className, 'disabled:opacity-50 disabled:cursor-not-allowed')}
    >
      {icon ? <FontAwesomeIcon icon={icon} /> : null}
      <span>{label}</span>
      <SigningModeIcon mode={signing.mode} />
    </button>
  )
  if (!signing.reason) return button
  return (
    <span className="inline-flex flex-col">
      {button}
      <CapabilityReason id={reasonId} reason={signing.reason} />
    </span>
  )
}

export function CapabilityReason({ id, reason }: { id: string; reason: string | undefined }) {
  if (!reason) return null
  return (
    <span id={id} className="mt-1 block text-xs text-neutral-70 dark:text-neutral-30">
      {reason}
    </span>
  )
}

export function EntityActionButton({
  msgType,
  ...props
}: Omit<CapabilityButtonProps, 'signing'> & { msgType: string }) {
  const signing = useActionSigning(msgType)
  return <CapabilityButton signing={signing} {...props} />
}
