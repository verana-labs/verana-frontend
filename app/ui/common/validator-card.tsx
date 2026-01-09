"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { Permission } from "@/ui/dataview/datasections/perm";
import { formatVNA } from "@/util/util";

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export type ValidatorCardProps = {
  validator: Permission;
  selected?: boolean;
  onSelect?: () => void;
};

export default function ValidatorCard({
  validator,
  selected = false,
  onSelect,
}: ValidatorCardProps) {
  const feeLabel = validator.issuance_fees ? "Issuance Fee" : "Verification Fee";
  const feeValue =
    validator.issuance_fees
      ? formatVNA(validator.issuance_fees)
      : validator.verification_fees
      ? formatVNA(validator.verification_fees)
      : "—";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "border-2 rounded-xl p-4 transition-all",
        onSelect ? "cursor-pointer" : "cursor-default",
        selected
          ? "border-primary-600 shadow-[0_0_0_3px_rgba(118,62,240,0.2)]"
          : "border-neutral-20 dark:border-neutral-70",
        "hover:border-primary-300 dark:hover:border-primary-600",
      )}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : -1}
      aria-pressed={onSelect ? selected : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onSelect) onSelect();
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          { onSelect && (
            <input
                type="radio"
                checked={selected}
                readOnly
                className="w-4 h-4 text-primary-600"
                aria-hidden="true"
                tabIndex={-1}
            />
          )}
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon className="text-white" icon={faShieldHalved} />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              Validator DID
            </label>
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {validator.did}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              Controller
            </label>
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {validator.grantee}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              Deposit
            </label>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {formatVNA(validator.deposit)}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              Validation Fee
            </label>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {validator.validation_fees ? formatVNA(validator.validation_fees) : "—"}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              {feeLabel}
            </label>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {feeValue}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
              Country
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {validator.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}