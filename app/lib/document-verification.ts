const SRI_PATTERN = /^sha384-([A-Za-z0-9+/]{64})$/

export function parseSriDigest(value: string | null | undefined): string | null {
  if (!value) return null
  return SRI_PATTERN.exec(value)?.[1] ?? null
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function sha384Sri(bytes: Uint8Array | ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-384', bytes)
  return `sha384-${base64(new Uint8Array(hash))}`
}

export function digestsMatch(actual: string, expected: string | null | undefined): boolean {
  const left = parseSriDigest(actual)
  const right = parseSriDigest(expected)
  return left !== null && right !== null && left === right
}
