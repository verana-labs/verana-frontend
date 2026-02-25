'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface TitleAndButtonProps {
  title: string;
  description?: string[];
  buttonLabel?: string;
  to?: string;
  onClick?: () => void;
  icon?: IconDefinition;
  backLink?: boolean;
  type?: 'page' | 'view' | 'table';
  checkFilter?: {show: boolean; changeFilter: (value: boolean) => void; label: string};
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
  checkFilter
}: TitleAndButtonProps) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return router.push(to);
  };

  return (
    <>
    {/* Back Navigation */}
    { backLink && (
    <section id="back-nav" className="mb-6">
      {(buttonLabel || icon) && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {icon? (<FontAwesomeIcon className="icon-sm" aria-hidden="true" icon={icon} />) : null}
          {buttonLabel && <span className="inline">&nbsp;{buttonLabel}</span>}
        </button>
      )}
    </section>
    )}
    
    <section id="page-header" className={ type === "table" ? "" : "mb-8"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
                { type === "table" ? (
                <h3 className="data-table-title">{title}</h3>
                ):(
                <h1 className={type === "view" ? "view-title" : "page-title"}>{title}</h1>
                )}

                {/* Help Section (if present) */}
                {description && Array.isArray(description) && (
                  <>
                    {description.map((d, idx) => (
                      <p key={idx} className="page-description">
                        {d}
                      </p>
                    ))}
                  </>
                )}
            </div>
            {}
            { !backLink && (
            <div className="mt-4 sm:mt-0 flex items-center space-x-6">
              {checkFilter && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkFilter?.show}
                  onChange={(e) => checkFilter?.changeFilter(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {checkFilter?.label}
                </span>
              </label>
              )}
              {/* Render button only if buttonLabel or Icon is provided */}
              {(buttonLabel || icon) && (
                <button
                  onClick={handleClick}
                  className="btn-link"
                >
                  {icon? (<FontAwesomeIcon className="icon-sm" aria-hidden="true" icon={icon} />) : null}
                  {buttonLabel && <span className="inline">&nbsp;{buttonLabel}</span>}
                </button>
              )}
            </div>
            )}
        </div>
    </section>
    </>

  );
}
