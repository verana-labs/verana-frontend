import { Column } from "@/ui/datatable/types";
import { type I18nValues, type Translatable } from "@/ui/dataview/types";

const t = (key: string, values?: I18nValues) => ({ key, values });

export interface CsList {
  id: string;
  trId: string;
  title: string;
  description: string;
  role: string;
  issuerPermManagementMode: string;
  verifierPermManagementMode: string;
  jsonSchema: string;
  participants: number;
  issuedCredentials: number;
  verifiedCredentials: number;
  archived: string;
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

const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  return isNaN(num) ? "0" : String(num);
};

export const columnsCsList: Column<CsList>[] = [
  { header: t("datatable.cs.header.id"), accessor: "id" },
  { header: t("datatable.cs.header.title"), accessor: "title" },
  { header: t("datatable.cs.header.desc"), accessor: "description", priority: 4 },
  { header: t("datatable.cs.header.participants"), accessor: "participants", format: formatNumber },
  { header: t("datatable.cs.header.issuedCredentials"), accessor: "issuedCredentials", format: formatNumber },
  { header: t("datatable.cs.header.verifiedCredentials"), accessor: "verifiedCredentials", format: formatNumber },
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
