'use client';

import { ReactNode } from "react";
import { getModePillClass } from "@/ui/datatable/columnslist/cs";
import { resolveTranslatable } from "@/ui/dataview/types";
import { translate } from "@/i18n/dataview";

export type SchemaStatus = 'ACTIVE' | 'ARCHIVED';

export type SchemaHeaderProps = {
  title: string;
  description?: string;
  id: string | number;
  status?: SchemaStatus;
  issuerPermManagementMode?: string | number;
  verifierPermManagementMode?: string | number;
  /** Optional top-right action area (e.g. link to participants tree). */
  action?: ReactNode;
};

function statusPillClass(status: SchemaStatus) {
  return status === 'ARCHIVED'
    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
}

function ModePill({ value, suffix }: { value?: string | number; suffix: string }) {
  const raw = value !== undefined && value !== null ? String(value) : '';
  if (!raw.trim()) return null;
  const klass = getModePillClass(raw, suffix);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${klass}`}>
      {raw}
    </span>
  );
}

function HeaderRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-70 dark:text-neutral-70 font-medium">
        {label}:
      </span>
      {children}
    </div>
  );
}

function PermModeRow({
  value,
  label,
  suffix,
}: {
  value?: string | number;
  label: string;
  suffix: string;
}) {
  if (value === undefined || value === '') return null;
  return (
    <HeaderRow label={label}>
      <ModePill value={value} suffix={suffix} />
    </HeaderRow>
  );
}

export default function SchemaHeader({
  title,
  description,
  id,
  status,
  issuerPermManagementMode,
  verifierPermManagementMode,
  action,
}: SchemaHeaderProps) {
  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {status ? (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusPillClass(status)}`}>
                  {status}
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="text-sm sm:text-base text-neutral-70 dark:text-neutral-70 mb-4">
                {description}
              </p>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-70 dark:text-neutral-70 font-medium">
                  {resolveTranslatable({ key: "dataview.cs.fields.id" }, translate) ?? "ID"}:
                </span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{id}</span>
              </div>

              <PermModeRow
                value={issuerPermManagementMode}
                label={resolveTranslatable({ key: "dataview.cs.fields.issuerPermManagementMode" }, translate) ?? "Issuer Permission Mode"}
                suffix="_ISSUER"
              />
              <PermModeRow
                value={verifierPermManagementMode}
                label={resolveTranslatable({ key: "dataview.cs.fields.verifierPermManagementMode" }, translate) ?? "Verifier Permission Mode"}
                suffix="_VERIFIER"
              />
            </div>
          </div>
          {action ? <div className="flex-shrink-0">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
