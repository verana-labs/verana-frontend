'use client';

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
  const usd = Number(amount) * conversionFactorUSDfromVNA

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
  const cellDate = new Date(String(input));
  const today = new Date();
  today.setHours(0,0,0,0);
  return cellDate < today;
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
