'use client'

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { type ReactNode, useEffect, useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { ActionFieldProps, renderActionComponent } from '@/ui/common/data-view-typed'
import IconLabelButton from '@/ui/common/icon-label-button'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'

export function ActionLabel({ label, mode }: { label: ReactNode; mode: CorporationSigningMode | null }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <SigningModeIcon mode={mode} />
    </span>
  )
}

type ActionFieldButtonProps = {
  data: object
  field: ActionFieldProps
  type?: 'button' | 'extend'
  onClickButton?: () => void
  onClose?: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  isActive?: boolean
}

export default function ActionFieldButton({
  data,
  field,
  type,
  onClickButton,
  onClose,
  onRefresh,
  isActive = false,
}: ActionFieldButtonProps) {
  const [active, setActive] = useState<boolean>(isActive)
  const { mode, disabled } = useActionSigning(field.value)

  const toggle = () => {
    const next = !active
    setActive(next)
    if (next) onClickButton?.()
    else onClose?.()
  }

  useEffect(() => {
    setActive(isActive)
  }, [isActive])

  return (
    <div>
      {type === 'button' && !active && (
        <IconLabelButton
          label={<ActionLabel label={field.label} mode={mode} />}
          icon={field.icon}
          className={clsx(
            'btn-action-confirm text-sm disabled:opacity-50 disabled:cursor-not-allowed',
            field.iconColorClass
          )}
          onClick={toggle}
          disabled={disabled}
        />
      )}

      {type !== 'button' && (
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          className={clsx(
            'w-full px-6 py-4 text-left flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            field.isWarning ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          )}
        >
          <div className="flex items-center">
            {field.icon && (
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center mr-3', field.iconClass)}>
                <FontAwesomeIcon icon={field.icon} className={field.iconColorClass ?? field.iconClass ?? ''} />
              </div>
            )}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                <ActionLabel label={field.label} mode={mode} />
              </h4>
              <p className="text-sm text-neutral-70 dark:text-neutral-70">{field.description}</p>
            </div>
          </div>
          <FontAwesomeIcon icon={active ? faChevronUp : faChevronDown} />
        </button>
      )}

      {active ? renderActionComponent(field.value, toggle, data, onRefresh) : null}
    </div>
  )
}
