export const FIELD_LABEL = 'flex flex-col gap-2 text-sm font-medium text-foreground'

export const FIELD_HINT = 'mt-1.5 text-xs text-muted-foreground'

export const FIELD_INPUT =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1 text-sm font-normal text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-(--duration-base) placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

export const FIELD_SELECT = `${FIELD_INPUT} pe-9`

export const FIELD_CHECKBOX =
  'size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-0'
