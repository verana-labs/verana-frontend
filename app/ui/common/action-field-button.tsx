'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { ChevronDownIcon, ZapIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { CapabilityReason } from '@/ui/common/capability-button'
import { ActionFieldProps, renderActionComponent } from '@/ui/common/data-view-typed'
import IconLabelButton from '@/ui/common/icon-label-button'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { Card } from '@/ui/shadcn/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/shadcn/collapsible'

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
  const { mode, disabled, reason } = useActionSigning(field.value)
  const reasonId = useId()

  const toggle = () => {
    const next = !active
    setActive(next)
    if (next) onClickButton?.()
    else onClose?.()
  }

  useEffect(() => {
    setActive(isActive)
  }, [isActive])

  if (type !== 'button') {
    return (
      <Collapsible open={active} onOpenChange={toggle} disabled={disabled} asChild>
        <Card className="gap-0 py-0">
          <CollapsibleTrigger
            title={reason}
            className={clsx(
              'group/trigger flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50',
              field.isWarning ? 'not-disabled:hover:bg-destructive/5' : 'not-disabled:hover:bg-muted/50'
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                field.isWarning ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}
            >
              {field.icon ? <FontAwesomeIcon icon={field.icon} className="size-4" /> : <ZapIcon className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug font-medium text-foreground">
                <ActionLabel label={field.label} mode={mode} />
              </span>
              <span className="block text-sm text-muted-foreground">{reason ?? field.description}</span>
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border p-4">
            {renderActionComponent(field.value, toggle, data, onRefresh)}
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  return (
    <div>
      {!active && (
        <>
          <IconLabelButton
            label={<ActionLabel label={field.label} mode={mode} />}
            icon={field.icon}
            className={clsx(
              'btn-action-confirm text-sm disabled:opacity-50 disabled:cursor-not-allowed',
              field.iconColorClass
            )}
            onClick={toggle}
            disabled={disabled}
            title={reason}
            describedBy={reason ? reasonId : undefined}
          />
          <CapabilityReason id={reasonId} reason={reason} />
        </>
      )}

      {active ? renderActionComponent(field.value, toggle, data, onRefresh) : null}
    </div>
  )
}
