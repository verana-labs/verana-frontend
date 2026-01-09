"use client";

import React from "react";
import { resolveTranslatable } from "../dataview/types";
import { translate } from "@/i18n/dataview";

export type Role = "ECOSYSTEM" | "ISSUER_GRANTOR" | "VERIFIER_GRANTOR" | "ISSUER" | "VERIFIER" | "HOLDER";

export const ROLE_OPTIONS = [
  {
    role: "ISSUER_GRANTOR",
    label: resolveTranslatable({key: "join.role.issuergrantor.label"}, translate),
    description: resolveTranslatable({key: "join.role.issuergrantor.description"}, translate),
  },
  {
    role: "VERIFIER_GRANTOR",
    label: resolveTranslatable({key: "join.role.verifiergrantor.label"}, translate),
    description: resolveTranslatable({key: "join.role.verifiergrantor.description"}, translate),
  },
  {
    role: "ISSUER",
    label: resolveTranslatable({key: "join.role.issuer.label"}, translate),
    description: resolveTranslatable({key: "join.role.issuer.description"}, translate),
  },
  {
    role: "VERIFIER",
    label: resolveTranslatable({key: "join.role.verifier.label"}, translate),
    description: resolveTranslatable({key: "join.role.verifier.description"}, translate),
  },
  {
    role: "HOLDER",
    label: resolveTranslatable({key: "join.role.holder.label"}, translate),
    description: resolveTranslatable({key: "join.role.holder.description"}, translate),
  },
];

export type RoleCardProps = {
  role: Role;
  onSelect?: () => void;
  selected: boolean;
};

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export default function RoleCard({
  role,
  selected,
  onSelect,
}: RoleCardProps) {
    const roleObject = ROLE_OPTIONS.find((o) => o.role === role);
  return (
    <div
      onClick={onSelect? () => onSelect() : undefined}
      className={cn(
        "border-2 rounded-xl p-4 cursor-pointer transition-all mb-3",
        selected
          ? "border-primary-600 shadow-[0_0_0_3px_rgba(118,62,240,0.2)]"
          : "border-neutral-20 dark:border-neutral-70",
        "hover:border-primary-300 dark:hover:border-primary-600",
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onSelect) onSelect();
      }}
      aria-pressed={selected}
    >
      <div className="flex items-start space-x-3">
        <input
          type="radio"
          checked={selected}
          readOnly
          className="mt-1 w-4 h-4 text-primary-600"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {roleObject?.label}
          </h3>
          <p className="text-sm text-neutral-70 dark:text-neutral-70">
            {roleObject?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
