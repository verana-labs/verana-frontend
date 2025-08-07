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
    // <div className="self-stretch justify-start text-Black-600 text-xl font-medium font-['Kantumruy_Pro']">Dashboard </div>
    <div className={`flex items-center justify-between pb-4 ${className}`}>      
      <h1 className="text-xl font-medium text-title-light-color dark:text-title-dark-color">
        {title}
      </h1>
      {/* Render button only if buttonLabel or Icon is provided */}
      {(buttonLabel || Icon) && (
        <button
          onClick={handleClick}
          className="inline-flex items-center text-blue-500 hover:underline p-2"
        >
          {Icon && <Icon className="h-6 w-6 mr-1" aria-hidden="true" />}
          {buttonLabel && <span className="hidden md:inline">{buttonLabel}</span>}
        </button>
      )}
    </div>
  );
}
