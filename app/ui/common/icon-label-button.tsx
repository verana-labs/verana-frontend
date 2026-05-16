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
}

export default function IconLabelButton({ onClick, label, icon, title, className }: IconLabelButtonProps) {
  return (
    <button type="button" onClick={onClick} title={title} className={className}>
      {icon && <FontAwesomeIcon icon={icon} />}
      {label}
    </button>
  )
}
