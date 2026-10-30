import { cn } from '@/lib/utils'
import { buttonVariants } from '@/ui/shadcn/button'

type Variant = 'default' | 'outline' | 'secondary' | 'destructive'

export function actionButtonClass(variant: Variant = 'default', className?: string): string {
  return cn(buttonVariants({ variant }), 'disabled:pointer-events-auto', className)
}
