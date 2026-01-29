'use client';

import { PermState } from "@/ui/common/permission-tree";
import { PermissionType, VpState } from "@/ui/dataview/datasections/perm";

export function formatVNA (amount: string | null, decimals?: number) : string {
    if (!amount) return ''
    return (
      Number(amount) / Math.pow(10, decimals ? decimals : 6)
    ).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }) + ' VNA'
  }

export function parseVNA(formatted: string, decimals: number = 6): string {
  if (!formatted) return '0';
  // Remove "VNA" and spaces, and thousands separator
  const clean = formatted.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  // Parse as float
  const floatValue = parseFloat(clean);
  if (isNaN(floatValue)) return '0';
  // Convert to microVNA (as integer string)
  const micro = Math.round(floatValue * Math.pow(10, decimals));
  return micro.toString();
}

export function formatUSDfromUVNA(
  amount: string | null,
  conversionFactorUSDfromVNA: number
): string {
  if (!amount) return ''
  if (!Number.isFinite(conversionFactorUSDfromVNA) || conversionFactorUSDfromVNA <= 0) return ''

  // Clean locale-formatted number (remove thousands separators and whitespace)
  const cleanAmount = amount.trim().replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const numericAmount = parseFloat(cleanAmount);

  if (!Number.isFinite(numericAmount)) return ''

  const usd = numericAmount * conversionFactorUSDfromVNA

  return ( '≈ $' +
    usd.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' USD'
  )
}

export function shortenMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const keep = Math.floor((maxLength - 3) / 2);
  const start = str.slice(0, keep);
  const end = str.slice(-keep);
  return `${start}...${end}`;
}

export function formatDate( input: Date | string | number ): string {
  const date = new Date(input).toLocaleDateString();
  return date;
}

export function formatLongDateUserLocale(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function isExpired (input: Date | string | number ): boolean {
  const date = new Date(String(input));
  const today = new Date();
  today.setHours(0,0,0,0);
  return date < today;
}

const soonDays = 1;
export function isExpireSoon (input: Date | string | number ): boolean {
  const date = new Date(String(input));
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = date.getTime() - today.getTime();
  return diff > 0 && diff <= soonDays * 24 * 60 * 60 * 1000;
}

export function isJson(value: unknown): object | null {
  if (value && typeof value === "object") {
    if (Array.isArray(value) || Object.prototype.toString.call(value) === "[object Object]") {
      return value as object;
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function getStatus(input: Date | string | number): 'expired' | 'expiring' | 'active' {
  const target = new Date(String(input));
  if (Number.isNaN(target.getTime())) return 'expired'; // fallback

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthAfter = new Date(today);
  monthAfter.setMonth(monthAfter.getMonth() + 1);

  if (target < today) {
    return 'expired';
  }

  if (target >= today && target < monthAfter) {
    return 'expiring';
  }

  return 'active';
}

export function formatNetwork(network: string){
  const htmlNetwork = 
    `
    <div class="relative w-2 h-2 bg-success-500 rounded-full pulse-dot"></div>
    <span class="text-sm text-success-700 dark:text-success-300 font-medium">${network}</span>
    `;
  return htmlNetwork;
}

export function roleBadgeClass(role: PermissionType) {
  switch (role) {
    case "ECOSYSTEM":
      return "bg-purple-100 text-purple-800";
    case "ISSUER_GRANTOR":
      return "bg-blue-100 text-blue-800";
    case "VERIFIER_GRANTOR":
      return "bg-slate-100 text-slate-800";
    case "ISSUER":
      return "bg-green-100 text-green-800";
    case "VERIFIER":
      return "bg-orange-100 text-orange-800";
    case "HOLDER":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function roleColorClass(type: string): string {
  switch (type) {
    case "ECOSYSTEM":        return "text-purple-500";
    case "ISSUER_GRANTOR":   return "text-blue-500";
    case "VERIFIER_GRANTOR": return "text-slate-500";
    case "ISSUER":           return "text-green-500";
    case "VERIFIER":         return "text-orange-500";
    case "HOLDER":           return "text-pink-500";
    default:                 return "text-gray-500";
  }
}

export function permStateBadgeClass(permState: PermState, expireSoon: boolean) {
  switch (permState) {
    case "REPAID":
      return "bg-gray-100 text-red-800 dark:bg-gray-900/20 dark:text-red-300";
    case "SLASHED":
      return "bg-red-900 text-red-100 dark:bg-red-300/20 dark:text-red-800";
    case "ACTIVE":
      return expireSoon? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
}

export function vpStateColor(vpState: VpState, vpExp: string): {labelVpState: string, classVpState: string} {
  const GRAY = "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  switch (vpState) {
    case "PENDING":    
      return { labelVpState: "pending approbation", classVpState: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" };
    case "TERMINATED": 
      return { labelVpState: "terminated", classVpState: GRAY };
    case "VALIDATED":  
      return isExpired(vpExp) ? { labelVpState: "expired", classVpState: GRAY }
          : isExpireSoon(vpExp) ? { labelVpState: "expire soon", classVpState: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" }
          : { labelVpState: "validated", classVpState: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" };
    default:           
      return { labelVpState: String(vpState), classVpState: GRAY };
  }
}
