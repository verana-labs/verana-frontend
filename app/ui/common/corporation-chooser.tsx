'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { TriangleAlertIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { CorporationDiscoveryFailure } from '@/ui/common/corporation-discovery-failure'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'
import { Alert, AlertDescription } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'

function keepOpen() {}

export function CorporationChooser() {
  const router = useRouter()
  const {
    memberships,
    needsSelection,
    loading,
    actingCorporationLost,
    acknowledgeLost,
    attention,
    setActingCorporation,
  } = useUserCorporation()
  const lostLast = !loading && actingCorporationLost && memberships.length === 0

  function continueWithoutCorporation() {
    acknowledgeLost()
    router.push('/dashboard')
  }

  return (
    <Dialog open={needsSelection || lostLast} onClose={keepOpen} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-xs data-closed:opacity-0 dark:bg-black/60"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md space-y-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-foreground/10 duration-100 data-closed:scale-95 data-closed:opacity-0 sm:p-6"
          >
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold leading-snug text-foreground">
                {translate(lostLast ? 'corporation.chooser.losttitle' : 'corporation.chooser.title')}
              </DialogTitle>
              {lostLast ? null : (
                <p className="text-sm text-muted-foreground">{translate('corporation.chooser.desc')}</p>
              )}
            </div>
            {actingCorporationLost ? (
              <Alert
                role="note"
                className="border-warning/30 bg-warning/10 px-3 py-2.5 text-warning dark:bg-warning/20"
              >
                <TriangleAlertIcon />
                <AlertDescription className="text-current">
                  {translate(lostLast ? 'corporation.chooser.lostlast' : 'corporation.chooser.lost')}
                </AlertDescription>
              </Alert>
            ) : null}
            <CorporationDiscoveryFailure className="mb-0" />
            {memberships.length > 0 ? (
              <div className="space-y-2">
                {memberships.map((membership) => (
                  <button
                    key={membership.corporation.id}
                    type="button"
                    onClick={() => setActingCorporation(membership.corporation.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm outline-none transition-colors duration-(--duration-base) hover:border-primary/40 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <CorporationMembershipRow
                      membership={membership}
                      isActing={false}
                      attention={attention[membership.corporation.id]}
                    />
                  </button>
                ))}
              </div>
            ) : null}
            {lostLast ? (
              <Button type="button" size="lg" onClick={continueWithoutCorporation} className="w-full">
                {translate('corporation.chooser.continue')}
              </Button>
            ) : null}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
