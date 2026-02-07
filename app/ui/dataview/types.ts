/* eslint-disable @typescript-eslint/no-explicit-any */
import { translate } from "@/i18n/dataview";
import { ComponentType, ReactNode } from "react";

// Localization helpers
export type MessagePrimitive = string | number | boolean | null;

export type I18nValues = Record<string, MessagePrimitive>;

export type Translator = (key: string, values?: I18nValues) => string;

export type Translatable =
  | string
  | {
      key: string;
      values?: I18nValues;
      fallback?: string;
    };

export function resolveTranslatable(
  text: Translatable | undefined,
  translate: Translator
): string | undefined {
  if (text === undefined) return undefined;
  if (typeof text === "string") return text;
  try {
    return translate(text.key, text.values);
  } catch {
    return text.fallback ?? text.key;
  }
}

export function resolveTranslatables(
  texts: ReadonlyArray<Translatable> | undefined,
  translate: Translator
): string[] {
  return (texts ?? []).map((item) => resolveTranslatable(item, translate) ?? "");
}
/**
 * Creates a translated copy of the given sections array.
 * Converts all Translatable fields (name, label, help, description, etc.)
 * into plain strings so that the render components no longer need to call
 * resolveTranslatable themselves.
 */
export function translateSections<T>(
  sections: ReadonlyArray<Section<T>>
): ResolvedSection<T>[] {
  return sections.map((section) => {
    const translatedFields: ResolvedField<T>[] | undefined = section.fields?.map((field) => {
      const label = resolveTranslatable(field.label, translate) ?? "";
      const description = resolveTranslatable(field.description, translate);

      if (isDataField(field)) {
        const placeholder = resolveTranslatable(field.placeholder, translate);
        const options = field.options?.map((opt) => ({
          ...opt,
          label: resolveTranslatable(opt.label, translate) ?? "",
        }));
        const out: ResolvedDataField<T> = {
          ...(field as any),
          label,
          placeholder,
          description,
          options,
        };
        return out;
      }

      if (isActionField(field)) {
        const out: ResolvedActionField<T> = { 
          ...(field as any),
          label,
          description,
        };
        return out;
      }

      // list fields
      if (isObjectListField(field)) {
        const os = field.objectSections;
        const objectSections = Array.isArray(os)
          ? translateSections(os as ReadonlyArray<Section<any>>)
          : translateSections([os as Section<any>])[0];

        const out: ResolvedObjectListField<T, any> = {
          ...(field as any),
          label,
          objectSections,
        };
        return out;
      }

      const out: ResolvedStringListField<T> = { ...(field as any), label };
      return out;
    });

    const out: ResolvedSection<T> = {
      ...(section as any),
      name: resolveTranslatable(section.name, translate) ?? "",
      help: section.help
        ? resolveTranslatables(section.help as ReadonlyArray<Translatable>, translate)
        : section.help,
      fields: translatedFields,
    };
    return out;
  });
}

/* Utility type: returns keys of T whose value type is assignable to V */
type KeysWithType<T, V> = {
  [K in keyof T]-?: Exclude<T[K], undefined | null> extends V ? K : never
}[keyof T];

// Define a TypeToken with a string identifier
export type TypeToken<I> = { readonly __type?: I; readonly typeName: string };

// Factory helper
export const typeOf = <I>(typeName: string): TypeToken<I> =>
  ({ typeName } as TypeToken<I>);

/* Section: groups a set of fields for a given type */
export type Section<I> = {
  name?: Translatable;
  icon?: ComponentType<{ className?: string }>;
  type?: "basic" | "help" | "advanced" | "actions";
  help?: Translatable[];
  fields?: Field<I>[];
  classForm?: string;
  cardView?: boolean;
  largeTexts?: boolean;
};

export interface DataViewProps<T extends object> {
  sectionsI18n: Section<T>[];
  data: T;
  id?: string;
  onEdit?: () => void;
  onRefresh?: () => void;
  onBack?:() => void;
  showSectionTitle?: string;
  otherButton?: React.ReactNode;
}

/* Base field shared by all field types */
type BaseField = {
  label: Translatable;
  description?: Translatable;
  show?: string; //'view' | 'edit' | 'all' | 'none' | 'create';
  required?: boolean;
  update?: boolean;
  id?: boolean;
  icon?: any;
  iconClass?: string;
  iconColorClass?: string;
};

/* Field validation params by all field types */
export type FieldValidation = {
  type: 'DID' | 'URL' | 'JSON_SCHEMA' | 'String' | 'Number' | 'Long';
  lessThan?: number;
  lessThanOrEqual?: number;
  greaterThan?: number;
  greaterThanOrEqual?: number;
  minLength?: number;
  maxLength?: number;
};

/* Field for simple data or actions */
/* Action */
type ActionField<T> = BaseField & {
  type: "action";
  name: keyof T;
  isWarning?: boolean;
};

/* Data */
export type DataField<T> = BaseField & {
  type: "data";
  name: keyof T;
  inputType?: 'text' | 'number' | 'textarea' | 'select' | 'date';
  options?: { value: string | number; label: Translatable }[]; // (inputType === 'select');
  placeholder?: Translatable;
  validation?: FieldValidation;
  classField?: string;
  isHtml?: boolean;
  usdValue?: boolean;
  hasStats?: boolean;
  format?: (value: T[keyof T]) => ReactNode;
};

/* Data & Action */
type DataOrActionField<T> = DataField<T> | ActionField<T>;

/* Field for lists of strings */
type StringListField<T> = BaseField & {
  type: "list";
  // Must reference a property of T that is string[]
  name: KeysWithType<T, string[] | ReadonlyArray<string>>;
  objectData: "string";      // marker for simple string lists
  list?: string[];
};

/* Field for lists of objects */
type ObjectListField<T, I> = BaseField & {
  type: "list";
  // Must reference a property of T that is I[]
  name: KeysWithType<T, I[] | ReadonlyArray<I>>;
  objectSections: Section<I> | ReadonlyArray<Section<I>>;  // describes how to render each item
  objectData: TypeToken<I>;                               // type witness for item
  list?: I[];
};

/* Final Field type */
export type Field<T> =
  | DataOrActionField<T>
  | StringListField<T>
  | ObjectListField<T, any>;


// ---------------------------------------------------------------------------
// Resolved types: same shapes but with plain strings instead of Translatable.
// Use these when you want to render without calling resolveTranslatable in JSX.
// ---------------------------------------------------------------------------

type BaseFieldResolved = Omit<BaseField, "label" | "description"> & {
  label: string;
  description: string;
};

export type ResolvedDataField<T> = Omit<
  DataField<T>,
  "label" | "description" | "placeholder" | "options"
> &
  BaseFieldResolved & {
    placeholder?: string;
    options?: { value: string | number; label: string }[];
  };

export type ResolvedActionField<T> = Omit<
  ActionField<T>,
  "label" | "description"
> &
  BaseFieldResolved;  

export type ResolvedStringListField<T> = Omit<StringListField<T>, "label"> & {
  label: string;
};

export type ResolvedObjectListField<T, I> = Omit<
  ObjectListField<T, I>,
  "label" | "objectSections"
> & {
  label: string;
  objectSections: ResolvedSection<I> | ReadonlyArray<ResolvedSection<I>>;
};

export type ResolvedField<T> =
  | ResolvedDataField<T>
  | ResolvedActionField<T>
  | ResolvedStringListField<T>
  | ResolvedObjectListField<T, any>;

export type ResolvedSection<I> = Omit<Section<I>, "name" | "help" | "fields"> & {
  name: string;
  help?: string[];
  fields?: ResolvedField<I>[];
};

// ---- Type guards for AnyField<T> ----
// These read the discriminant "type" and (for list) the "objectData" marker.

// =======================
// Guards para Field<T> (no resueltos)
// =======================

export function isDataField<T>(f: Field<T>): f is DataField<T> {
  return f.type === "data";
}
export function isActionField<T>(f: Field<T>): f is ActionField<T> {
  return f.type === "action";
}
export function isListField<T>(f: Field<T>): f is StringListField<T> | ObjectListField<T, any> {
  return f.type === "list";
}
export function isStringListField<T>(f: Field<T>): f is StringListField<T> {
  return f.type === "list" && (f as any).objectData === "string";
}
export function isObjectListField<T>(f: Field<T>): f is ObjectListField<T, any> {
  return f.type === "list" && (f as any).objectData !== "string";
}

// Guards specifically for ResolvedField<T>
export function isResolvedDataField<T>(f: ResolvedField<T>): f is ResolvedDataField<T> {
  return f.type === "data";
}
export function isResolvedActionField<T>(f: ResolvedField<T>): f is ResolvedActionField<T> {
  return f.type === "action";
}
export function isResolvedListField<T>(f: Field<T>): f is StringListField<T> | ObjectListField<T, any> {
  return f.type === "list";
}
export function isResolvedStringListField<T>(f: ResolvedField<T>): f is ResolvedStringListField<T> {
  return f.type === "list" && (f as any).objectData === "string";
}
export function isResolvedObjectListField<T>(f: ResolvedField<T>): f is ResolvedObjectListField<T, any> {
  return f.type === "list" && (f as any).objectData !== "string";
}

// --- Filter Show: "view" | "edit" | "create" ---
export type DataViewMode = "view" | "edit" | "create" ;

export function isFieldVisibleInMode<T>(field: ResolvedField<T>, mode: DataViewMode): boolean {
  const show = field.show ?? "all";
  if (show === "none") return false;
  if (show === "all") return true;
  return show.includes(mode);
}

export function visibleFieldsForMode<T>(fields: ResolvedField<T>[] | undefined, mode: DataViewMode): ResolvedField<T>[] {
  return (fields ?? []).filter(f => isFieldVisibleInMode(f, mode));
}

export function visibleFieldsForModeAndDataField<T>(fields: ResolvedField<T>[] | undefined, mode: DataViewMode): ResolvedField<T>[] {
  return (fields ?? []).filter(f => isFieldVisibleInMode(f, mode) && isDataField(f));
}
