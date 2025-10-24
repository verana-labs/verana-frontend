/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataField } from '@/ui/dataview/types';

const DID_PATTERN = /^did:[a-zA-Z0-9]+:[a-zA-Z0-9._-]+$/;
const LANGUAGE_TAG_PATTERN = /^[a-z]{2}$/;

export function isValidDID(did: string): boolean {
  return DID_PATTERN.test(did);
}

export function isValidLanguageTag(lang: string): boolean {
  return LANGUAGE_TAG_PATTERN.test(lang);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidField(field: DataField<any>, value: unknown): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  const validation = field.validation;
  const isEmptyString = typeof value === 'string' && value.trim() === '';
  if (value === undefined || value === null || isEmptyString) {
    return !field.required;
  }

  if (!validation) return true;

  const {
    type,
    lessThan,
    lessThanOrEqual,
    greaterThan,
    greaterThanOrEqual,
    minLength,
    maxLength,
  } = validation;

  switch (type) {
    case 'DID':
      return typeof value === 'string' && isValidDID(value);
    case 'URL': {
      if (typeof value !== 'string' || !isValidUrl(value)) return false;
      if (minLength !== undefined && value.length < minLength) return false;
      if (maxLength !== undefined && value.length > maxLength) return false;
      return true;
    }
    case 'String': {
      if (typeof value !== 'string') return false;
      if (minLength !== undefined && value.length < minLength) return false;
      if (maxLength !== undefined && value.length > maxLength) return false;
      return true;
    }
    case 'Number': {
      const numericValue = typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;
      if (!Number.isFinite(numericValue)) return false;
      if (greaterThan !== undefined && !(numericValue > greaterThan)) return false;
      if (greaterThanOrEqual !== undefined && !(numericValue >= greaterThanOrEqual)) return false;
      if (lessThan !== undefined && !(numericValue < lessThan)) return false;
      if (lessThanOrEqual !== undefined && !(numericValue <= lessThanOrEqual)) return false;
      return true;
    }
    case 'Long': {
      const numericValue = typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;
      if (!Number.isFinite(numericValue)) return false;
      if (greaterThan !== undefined && !(numericValue > greaterThan)) return false;
      if (greaterThanOrEqual !== undefined && !(numericValue >= greaterThanOrEqual)) return false;
      if (lessThan !== undefined && !(numericValue < lessThan)) return false;
      if (lessThanOrEqual !== undefined && !(numericValue <= lessThanOrEqual)) return false;
      return true;
    }
    default:
      return true;
  }
}

export function getErrorMessage(field: DataField<any>): string {
  const validation = field.validation;

  if (!validation) {
    return field.required ? 'Required' : 'Invalid value';
  }

  const {
    type,
    lessThan,
    lessThanOrEqual,
    greaterThan,
    greaterThanOrEqual,
    minLength,
    maxLength,
  } = validation;
  const lengthHint = (() => {
    const parts: string[] = [];
    if (typeof minLength === 'number') parts.push(`min length ${minLength}`);
    if (typeof maxLength === 'number') parts.push(`max length ${maxLength}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
  })();

  const rangeHint = (() => {
    const parts: string[] = [];
    if (typeof greaterThan === 'number') parts.push(`> ${greaterThan}`);
    if (typeof greaterThanOrEqual === 'number') parts.push(`>= ${greaterThanOrEqual}`);
    if (typeof lessThan === 'number') parts.push(`< ${lessThan}`);
    if (typeof lessThanOrEqual === 'number') parts.push(`<= ${lessThanOrEqual}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
  })();

  switch (type) {
    case 'DID':
      return `Enter a valid DID. (${field.placeholder})`;
    case 'URL':
      return 'Enter a valid URL.';
    case 'JSON_SCHEMA':
      return 'Provide a valid JSON schema document.';
    case 'String':
      return `Enter valid text${lengthHint}.`.trim();
    case 'Number':
      return `Enter a valid number${rangeHint}.`.trim();
    case 'Long':
      return `Enter a valid number${rangeHint}.`.trim();
    default:
      return field.required ? 'Required' : 'Invalid value';
  }
}
