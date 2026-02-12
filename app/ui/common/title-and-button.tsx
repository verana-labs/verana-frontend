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
  titleFilter?: React.ReactNode;
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
  titleFilter
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
                <h1 className={ type === "table" ? "data-table-title" : type === "view" ? "view-title" : "page-title"}>{title}</h1>
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
              {titleFilter}
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
