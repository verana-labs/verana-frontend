'use client'

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { cn } from '@/lib/utils'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { ResolvedDataField } from '../dataview/types'

type CardViewProps<T> = {
  field: ResolvedDataField<T>
  data: T
  largeTexts?: boolean
}

export default function CardView<T>({ field, data, largeTexts }: CardViewProps<T>) {
  const value = field.format ? String(field.format(data[field.name])) : String(data[field.name])
  const iconWrapperClass = field.iconClass ?? ''
  const iconColorClass = field.iconColorClass ?? field.iconClass ?? ''
  const icon = field.icon ? (
    <div className={cn('flex size-10 items-center justify-center rounded-lg', iconWrapperClass)}>
      <FontAwesomeIcon icon={field.icon} className={iconColorClass} aria-hidden="true" />
    </div>
  ) : null

  if (largeTexts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">{field.label}</CardTitle>
          {field.description ? <CardDescription>{field.description}</CardDescription> : null}
          {icon ? <CardAction>{icon}</CardAction> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums break-all text-foreground">
            {value}
          </div>
          {field.name === 'balance' && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <FontAwesomeIcon icon={faCheckCircle} aria-hidden="true" />
              Available
            </span>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>{field.label}</CardDescription>
        <CardTitle className="font-mono text-2xl font-semibold tracking-tight tabular-nums break-all">
          {value}
        </CardTitle>
        {icon ? <CardAction>{icon}</CardAction> : null}
      </CardHeader>
    </Card>
  )
}
