import { Column } from "@/ui/datatable/types";
import { type I18nValues, type Translatable } from "@/ui/dataview/types";

const t = (key: string, values?: I18nValues) => ({ key, values });

// Escape HTML special characters to prevent XSS
function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] || char;
  });
}

export interface CsList {
  id: string;
  trId: string;
  title: string;
  description: string;
  role: string;
  issuerPermManagementMode: string;
  verifierPermManagementMode: string;
  jsonSchema: string;
  participants?: number;
  issued?: number;
  verified?: number;
  archived: boolean;
  issuerValidationValidityPeriod: number;
  verifierValidationValidityPeriod: number;
}

const modeOptions = [
  { value: "ECOSYSTEM_ISSUER", class: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" },
  { value: "ECOSYSTEM_VERIFIER", class: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" },
  { value: "GRANTOR_VALIDATION_ISSUER", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
  { value: "GRANTOR_VALIDATION_VERIFIER", class: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300" },
  { value: "OPEN_ISSUER", class: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
  { value: "OPEN_VERIFIER", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" },
];

// Factory function to create columns with translated archived label
export function createColumnsCsList(archivedLabel: string = 'ARCHIVED'): Column<CsList>[] {
  const safeArchivedLabel = escapeHtml(archivedLabel);
  return [
    { header: t("datatable.cs.header.id"), accessor: "id" },
    {
      header: t("datatable.cs.header.title"),
      accessor: "title",
      isHtml: true,
      format: (value, row) => {
        const titleStr = escapeHtml(String(value ?? ''));
        if (row?.archived) {
          return `${titleStr} <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-300 dark:bg-slate-700 dark:text-slate-300 ml-2">${safeArchivedLabel}</span>`;
        }
        return titleStr;
      }
    },
    { header: t("datatable.cs.header.desc"), accessor: "description" },
    {
      header: t("datatable.cs.header.participants"),
      accessor: "participants",
      priority: 2,
      format: (value) => value !== undefined && value !== null ? String(value) : ''
    },
    {
      header: t("datatable.cs.header.issued"),
      accessor: "issued",
      priority: 2,
      format: (value) => value !== undefined && value !== null ? String(value) : ''
    },
    {
      header: t("datatable.cs.header.verified"),
      accessor: "verified",
      priority: 2,
      format: (value) => value !== undefined && value !== null ? String(value) : ''
    },
  ];
}

// Default columns for backward compatibility
export const columnsCsList: Column<CsList>[] = [
  { header: t("datatable.cs.header.id"), accessor: "id" },
  {
    header: t("datatable.cs.header.title"),
    accessor: "title",
    isHtml: true,
    format: (value, row) => {
      const titleStr = escapeHtml(String(value ?? ''));
      if (row?.archived) {
        return `${titleStr} <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-300 dark:bg-slate-700 dark:text-slate-300 ml-2">ARCHIVED</span>`;
      }
      return titleStr;
    }
  },
  { header: t("datatable.cs.header.desc"), accessor: "description" },
  {
    header: t("datatable.cs.header.participants"),
    accessor: "participants",
    priority: 2,
    format: (value) => value !== undefined && value !== null ? String(value) : ''
  },
  {
    header: t("datatable.cs.header.issued"),
    accessor: "issued",
    priority: 2,
    format: (value) => value !== undefined && value !== null ? String(value) : ''
  },
  {
    header: t("datatable.cs.header.verified"),
    accessor: "verified",
    priority: 2,
    format: (value) => value !== undefined && value !== null ? String(value) : ''
  },
];

export const description: Translatable[] = [
      t("datatable.cs.description")
];

export function getModeLabel(value: string, suffix: string): string {
  if (!value?.trim()) return "";
  return (
    `<label class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeClass(value.concat(suffix))}">${value}</label>`
  );
}

function getModeClass(value: string): string {
  const found = modeOptions.find(opt => opt.value === value);
  return found?.class ?? "";
}
