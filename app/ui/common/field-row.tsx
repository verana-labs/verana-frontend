import { ReactNode } from 'react'

export type FieldRowProps = {
  label: ReactNode
  children: ReactNode
  className?: string
  labelClassName?: string
}

const DEFAULT_LABEL_CLASS = 'mb-1 block text-sm text-muted-foreground'

export default function FieldRow({ label, children, className, labelClassName }: FieldRowProps) {
  return (
    <div className={className}>
      <span className={labelClassName ?? DEFAULT_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
}
