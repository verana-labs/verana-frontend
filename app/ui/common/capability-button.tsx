'use client'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { type ActionSigning, useActionSigning } from '@/hooks/useSigningMode'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'

interface CapabilityButtonProps {
  signing: ActionSigning
  label: string
  icon?: IconDefinition
  className: string
  onClick: () => void
}

export function CapabilityButton({ signing, label, icon, className, onClick }: CapabilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={signing.disabled}
      title={signing.reason}
      className={clsx(className, 'disabled:opacity-50 disabled:cursor-not-allowed')}
    >
      {icon ? <FontAwesomeIcon icon={icon} /> : null}
      <span>{label}</span>
      <SigningModeIcon mode={signing.mode} />
      {signing.reason ? <span className="sr-only">{signing.reason}</span> : null}
    </button>
  )
}

export function EntityActionButton({
  msgType,
  ...props
}: Omit<CapabilityButtonProps, 'signing'> & { msgType: string }) {
  const signing = useActionSigning(msgType)
  return <CapabilityButton signing={signing} {...props} />
}
