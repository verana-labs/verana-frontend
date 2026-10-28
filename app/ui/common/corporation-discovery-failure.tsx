'use client'

import { CircleAlertIcon } from 'lucide-react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'

export function CorporationDiscoveryFailure({ className }: { className?: string }) {
  const { error, loading, refetch } = useUserCorporation()
  if (!error) return null
  return (
    <Alert
      variant="destructive"
      className={cn('mb-4 border-destructive/30 bg-destructive/10 px-3 py-2.5 dark:bg-destructive/20', className)}
    >
      <CircleAlertIcon />
      <AlertTitle>{translate('corporation.chooser.failed')}</AlertTitle>
      <AlertDescription className="text-current">
        <p className="break-all text-xs">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void refetch()}
          className="mt-2 border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive dark:bg-transparent"
        >
          {translate('corporation.chooser.retry')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
