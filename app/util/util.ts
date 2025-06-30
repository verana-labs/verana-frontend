export const formatVNA = (amount: string | null, decimals: number) => {
    if (!amount) return ''
    return (
      Number(amount) / Math.pow(10, decimals)
    ).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }) + ' VNA'
  }

export function shortenMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const keep = Math.floor((maxLength - 3) / 2);
  const start = str.slice(0, keep);
  const end = str.slice(-keep);
  return `${start}...${end}`;
}
