'use client';

import { configFooter } from "@/lib/dashlinks";

export default function VeranaLogo() {
  return (
    <div className="logo-container">
      <img src={configFooter.img} alt="Veranito Logo" className="w-8 h-8"/>
      <h1 className="logo-label">{configFooter.title}</h1>
    </div>
  );
}
