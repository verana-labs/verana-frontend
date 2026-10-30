'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/navigation'
import { Button } from '@/ui/shadcn/button'

interface TitleAndButtonProps {
  title: string
  description?: string[]
  buttonLabel?: string
  to?: string
  onClick?: () => void
  icon?: IconDefinition
  backLink?: boolean
  type?: 'page' | 'view' | 'table'
  checkFilter?: { show: boolean; changeFilter: (value: boolean) => void; label: string }
}

export default function TitleAndButton({
  title,
  description,
  buttonLabel,
  to,
  onClick,
  icon,
  backLink,
  type,
  checkFilter,
}: TitleAndButtonProps) {
  const router = useRouter()
  const handleClick = () => {
    if (onClick) return onClick()
    if (to) return router.push(to)
  }

  return (
    <>
      {backLink && (
        <section id="back-nav" className="mb-6">
          {(buttonLabel || icon) && (
            <Button variant="ghost" size="sm" onClick={handleClick} className="-ms-2 text-primary hover:text-primary">
              {icon ? <FontAwesomeIcon className="icon-sm" aria-hidden="true" icon={icon} /> : null}
              {buttonLabel && <span>{buttonLabel}</span>}
            </Button>
          )}
        </section>
      )}

      <section id="page-header" className={type === 'table' ? '' : 'mb-6'}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            {type === 'table' ? (
              <h3 className="data-table-title">{title}</h3>
            ) : (
              <h1 className={type === 'view' ? 'view-title' : 'page-title'}>{title}</h1>
            )}
            {description &&
              Array.isArray(description) &&
              description.map((d, idx) => (
                <p key={idx} className="page-description">
                  {d}
                </p>
              ))}
          </div>
          {!backLink && (checkFilter || buttonLabel || icon) && (
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              {checkFilter && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={checkFilter?.show}
                    onChange={(e) => checkFilter?.changeFilter(e.target.checked)}
                    className="size-4"
                  />
                  <span>{checkFilter?.label}</span>
                </label>
              )}
              {(buttonLabel || icon) && (
                <Button size="lg" onClick={handleClick} className="px-4">
                  {icon ? <FontAwesomeIcon className="icon-sm" aria-hidden="true" icon={icon} /> : null}
                  {buttonLabel && <span>{buttonLabel}</span>}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
