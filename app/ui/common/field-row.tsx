import { ReactNode } from 'react'

export type FieldRowProps = {
  label: ReactNode
  children: ReactNode
  className?: string
  labelClassName?: string
}

const DEFAULT_LABEL_CLASS = 'text-sm text-neutral-70 dark:text-neutral-70 block mb-1'

export default function FieldRow({ label, children, className, labelClassName }: FieldRowProps) {
  return (
    <div className={className}>
      <span className={labelClassName ?? DEFAULT_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
}
