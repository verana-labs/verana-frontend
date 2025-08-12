'use client';

import Image from 'next/image'

export default function VeranaLogo() {
  return (
<div className='logo-container'>
  <div className='logo-image'>
    <Image 
      src="/verana.io.svg"
      alt="Logo Verana"
      width={34}
      height={34}
      style={{ width: '100%', height: '100%' }}
    />
  </div>
  <span className='logo-label'>
    VERANA
  </span>
</div>
  );
}
