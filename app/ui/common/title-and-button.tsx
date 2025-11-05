'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface TitleAndButtonProps {
  title: string;
  description?: string[];
  buttonLabel?: string;
  to?: string;
  onClick?: () => void;
  Icon?: React.ComponentType<{ className?: string }> | any;
  className?: string;
}

export default function TitleAndButton({
  title,
  description,
  buttonLabel,
  to,
  onClick,
  Icon,
  className = '',
}: TitleAndButtonProps) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return router.push(to);
  };

  return (
    <section id="page-header" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
                <h1 className="page-title">{title}</h1>
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
            <div className="mt-4 sm:mt-0">
              {/* Render button only if buttonLabel or Icon is provided */}
              {(buttonLabel || Icon) && (
                <button
                  onClick={handleClick}
                  className="btn-link"
                >
                  {Icon && <FontAwesomeIcon className="icon-sm" aria-hidden="true" icon={Icon} />}
                  {buttonLabel && <span className="hidden md:inline">{buttonLabel}</span>}
                </button>
              )}
            </div>
        </div>
    </section>

  );
}
