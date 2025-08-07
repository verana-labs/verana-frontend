import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Downloads a file from the given URL and computes its SRI (Subresource Integrity) hash using sha384.
 * @param url The file URL
 * @returns The SRI string (e.g. "sha384-...")
 */
export async function calculateSRI(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  const buffer = await res.buffer();
  const hash = crypto.createHash('sha384').update(buffer).digest('base64');
  return `sha384-${hash}`;
}
