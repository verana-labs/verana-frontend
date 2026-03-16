'use client';

import Link from "next/link";
import { configFooter } from "@/lib/dashlinks";
import { translate } from "@/i18n/dataview";

export default function VeranaLogo() {
  return (
    <div className="logo-container">
      <Link href={configFooter.href}>
        <img src={configFooter.img} alt={translate("navbar.logo.alt")} className="w-8 h-8"/>
      </Link>
      <h1 className="logo-label">{configFooter.title}</h1>
    </div>
  );
}
