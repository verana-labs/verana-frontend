'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface TitleAndButtonProps {
  title: string;
  buttonLabel?: string;
  to?: string;
  onClick?: () => void;
  Icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export default function TitleAndButton({
  title,
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
    <div className={`titlebar ${className}`}>      
      <h1 className="page-title">
        {title}
      </h1>
      {/* Render button only if buttonLabel or Icon is provided */}
      {(buttonLabel || Icon) && (
        <button
          onClick={handleClick}
          className="btn-link"
        >
          {Icon && <Icon className="icon-sm" aria-hidden="true" />}
          {buttonLabel && <span className="hidden md:inline">{buttonLabel}</span>}
        </button>
      )}
    </div>
  );
}
