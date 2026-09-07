import { promises as dns } from 'node:dns'
import { SafeFetchError } from '@/lib/safe-fetch-error'

type Cidr = { network: number; mask: number }

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = value * 256 + octet
  }
  return value
}

function cidr(text: string): Cidr {
  const [address, bits] = text.split('/')
  const network = ipv4ToNumber(address)
  if (network === null) throw new Error(`Invalid CIDR ${text}`)
  const mask = (0xffffffff << (32 - Number(bits))) >>> 0
  return { network: (network & mask) >>> 0, mask }
}

const PRIVATE_IPV4 = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '224.0.0.0/4',
  '240.0.0.0/4',
].map(cidr)

function isPrivateIpv4(value: number): boolean {
  return PRIVATE_IPV4.some(({ network, mask }) => (value & mask) >>> 0 === network)
}

function ipv6ToBytes(ip: string): Uint8Array | null {
  let text = ip.toLowerCase()
  const zone = text.indexOf('%')
  if (zone !== -1) text = text.slice(0, zone)
  const lastColon = text.lastIndexOf(':')
  if (lastColon === -1) return null
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const embedded = ipv4ToNumber(tail)
    if (embedded === null) return null
    text = `${text.slice(0, lastColon + 1)}${(embedded >>> 16).toString(16)}:${(embedded & 0xffff).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] === '' ? [] : halves[0].split(':')
  const rest = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : []
  const missing = 8 - head.length - rest.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...new Array<string>(missing).fill('0'), ...rest]
  const bytes = new Uint8Array(16)
  for (let index = 0; index < 8; index++) {
    if (!/^[0-9a-f]{1,4}$/.test(groups[index])) return null
    const value = Number.parseInt(groups[index], 16)
    bytes[index * 2] = value >> 8
    bytes[index * 2 + 1] = value & 0xff
  }
  return bytes
}

function embeddedIpv4(bytes: Uint8Array): number {
  return bytes[12] * 16777216 + bytes[13] * 65536 + bytes[14] * 256 + bytes[15]
}

function isPrivateIpv6(bytes: Uint8Array): boolean {
  const leadingZero = bytes.subarray(0, 10).every((byte) => byte === 0)
  if (leadingZero && bytes[10] === 0xff && bytes[11] === 0xff) return isPrivateIpv4(embeddedIpv4(bytes))
  if (leadingZero && bytes[10] === 0 && bytes[11] === 0) {
    const low = embeddedIpv4(bytes)
    return low <= 1 || isPrivateIpv4(low)
  }
  if ((bytes[0] & 0xfe) === 0xfc) return true
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true
  return bytes[0] === 0xff
}

type AddressClass = 'public' | 'private' | 'invalid'

function classifyAddress(ip: string): AddressClass {
  const text = ip.replace(/^\[|\]$/g, '')
  const ipv4 = ipv4ToNumber(text)
  if (ipv4 !== null) return isPrivateIpv4(ipv4) ? 'private' : 'public'
  const ipv6 = ipv6ToBytes(text)
  if (ipv6) return isPrivateIpv6(ipv6) ? 'private' : 'public'
  return 'invalid'
}

export function isPrivateAddress(ip: string): boolean {
  return classifyAddress(ip) === 'private'
}

const FORBIDDEN_SUFFIXES = ['localhost', 'local', 'internal', 'home.arpa']

export function isForbiddenHostname(hostname: string): boolean {
  const host = hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.+$/, '')
    .toLowerCase()
  if (host === '') return true
  if (FORBIDDEN_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) return true
  return classifyAddress(host) === 'private'
}

export type LookupAddresses = (host: string, options: { all: true }) => Promise<Array<{ address: string }>>

const defaultLookup: LookupAddresses = (host, options) => dns.lookup(host, options)

export async function assertPublicTarget(url: string | URL, lookup: LookupAddresses = defaultLookup): Promise<void> {
  const host = (typeof url === 'string' ? new URL(url) : url).hostname.replace(/^\[|\]$/g, '')
  if (isForbiddenHostname(host)) throw new SafeFetchError('Target host is not allowed', 400)
  if (classifyAddress(host) === 'public') return
  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new SafeFetchError('Target host could not be resolved', 400)
  }
  if (addresses.length === 0 || addresses.some((entry) => classifyAddress(entry.address) !== 'public')) {
    throw new SafeFetchError('Target host resolves to a private address', 400)
  }
}
