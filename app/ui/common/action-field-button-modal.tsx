'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import { ActionLabel } from '@/ui/common/action-field-button'
import { ActionFieldProps, renderActionComponent } from '@/ui/common/data-view-typed'
import IconLabelButton from '@/ui/common/icon-label-button'
import { ModalAction } from '@/ui/common/modal-action'

type ActionFieldButtonModalProps = {
  data: object
  field: ActionFieldProps
  onClickButton?: () => void
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  isActive: boolean
}

export default function ActionFieldButtonModal({
  data,
  field,
  onClickButton,
  onClose,
  onRefresh,
  isActive,
}: ActionFieldButtonModalProps) {
  const [modalHidden, setModalHidden] = useState(true)
  const { mode, disabled, reason } = useActionSigning(field.value)
  // Reset internal state when the modal is closed / deactivated
  useEffect(() => {
    if (!isActive) setModalHidden(true)
  }, [isActive])

  return (
    <section>
      <IconLabelButton
        label={<ActionLabel label={field.label} mode={mode} reason={reason} />}
        icon={field.icon}
        className={clsx(
          'btn-action-confirm text-sm disabled:opacity-50 disabled:cursor-not-allowed',
          field.iconColorClass
        )}
        onClick={onClickButton}
        disabled={disabled}
        title={reason}
      />

      {field.value ? (
        <ModalAction onClose={onClose} titleKey={field.label} isActive={isActive} modalHidden={modalHidden}>
          {renderActionComponent(field.value, onClose, data, onRefresh, undefined, () => setModalHidden(false))}
        </ModalAction>
      ) : null}
    </section>
  )
}
