'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReactNode } from 'react'

export interface IconLabelButtonProps {
  onClick?: () => void
  label?: ReactNode
  icon?: IconDefinition
  className?: string
  title?: string
  disabled?: boolean
}

export default function IconLabelButton({ onClick, label, icon, title, className, disabled }: IconLabelButtonProps) {
  return (
    <button type="button" onClick={onClick} title={title} className={className} disabled={disabled}>
      {icon && <FontAwesomeIcon icon={icon} />}
      {label}
    </button>
  )
}
