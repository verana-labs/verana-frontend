export function formatVNA (amount: string | null, decimals?: number) : string {
    if (!amount) return ''
    return (
      Number(amount) / Math.pow(10, decimals ? decimals : 6)
    ).toLocaleString(undefined, {
      minimumFractionDigits: 2,
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

export function shortenMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const keep = Math.floor((maxLength - 3) / 2);
  const start = str.slice(0, keep);
  const end = str.slice(-keep);
  return `${start}...${end}`;
}

export function formatDate( input: Date | string | number ): string {
  const date = input instanceof Date
    ? input
    : new Date(
        typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
          ? input + 'T00:00:00Z'
          : input
      );
  const year  = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isExpired (input: Date | string | number ): boolean {
  const cellDate = new Date(String(input));
  const today = new Date();
  today.setHours(0,0,0,0);
  return cellDate < today;
}