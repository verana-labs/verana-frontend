import { ReactNode } from 'react';
import {
  Translatable,
  resolveTranslatable,
  resolveTranslatables,
} from "@/ui/dataview/types";
import { translate } from '@/i18n/dataview';

// Generic column definition (i18n-aware)
export type Column<T> = {
  header: Translatable;                 // ← before: string
  accessor: keyof T;
  format?: (value: T[keyof T]) => ReactNode;
  priority?: number;
  className?: (value: T[keyof T]) => string;
};

// Generic filter definition (i18n-aware)
export type Filter<T> = {
  label: Translatable;                 // ← before: string
  columns: (keyof T)[];
  inputType: "text" | "select";
  placeholder?: Translatable;
  options?: { value: string | number; label: Translatable }[]; // (inputType === 'select');
};

// Resolved (ready-to-render) columns
export type ResolvedColumn<T> = Omit<Column<T>, "header" | "filterLabel"> & {
  header: string;
  filterLabel?: string;
};

// Resolved (ready-to-render) filters
export type ResolvedFilter<T> = Omit<
  Filter<T>,
  "label" | "placeholder" | "options"
> & {
  label: string;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
};

export interface DataTableProps<T extends object> {
  entities: string;
  columnsI18n: Column<T>[];         // ← resolved
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  descriptionI18n?: Translatable[];               // ← resolved
  defaultSortColumn?: keyof T;
  defaultSortDirection?: "asc" | "desc";
  filterI18n?: Filter<T>[];
  showDetailModal?: boolean;
}

// Helper: translate columns
export function translateColumns<T>(
  cols: ReadonlyArray<Column<T>>
): ResolvedColumn<T>[] {
  return cols.map((c) => ({
    ...c,
    header: resolveTranslatable(c.header, translate) ?? "",
  }));
}

// Helper: translate filters
export function translateFilter<T>(
  filters: ReadonlyArray<Filter<T>> | undefined
): ResolvedFilter<T>[] | undefined {
  if (!filters) return undefined;
  return filters.map((f) => ({
    ...f,
    label: resolveTranslatable(f.label, translate) ?? "",
    placeholder: f.placeholder
      ? resolveTranslatable(f.placeholder, translate) ?? ""
      : undefined,
    options: f.options
      ? f.options.map((opt) => ({
          ...opt,
          label: resolveTranslatable(opt.label, translate) ?? "",
        }))
      : undefined,
  }));
}

// Helper: translate columns description
export function translateDataTableDescriptions(
  texts: ReadonlyArray<Translatable> | undefined
): string[] | undefined {
  return texts ? resolveTranslatables(texts, translate) : undefined;
}