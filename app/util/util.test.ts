import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  countryCodeToFlag,
  countryNameFromCode,
  formatDateTime,
  formatNumber,
  formatUSDfromUVNA,
  formatVNA,
  formatVNAFromUVNA,
  getStatus,
  isExpired,
  isExpireSoon,
  isJson,
  parseVNA,
  roleBadgeClass,
  roleColorClass,
  roleJoinColorClass,
  rolesSchema,
  shortenDID,
  shortenMiddle,
  withCurrentLocalTimePlusOneMinute,
} from '@/util/util'

describe('formatNumber', () => {
  it('returns the plain string form of a finite number', () => {
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber('1000')).toBe('1000')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(-5.5)).toBe('-5.5')
  })

  it('returns "0" for null or undefined regardless of flags', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
    expect(formatNumber(null, false, true)).toBe('0')
  })

  it('returns "isNan" for non-numeric input by default', () => {
    expect(formatNumber('abc')).toBe('isNan')
    expect(formatNumber({})).toBe('isNan')
  })

  it('returns "0" for non-numeric input when defaultZero is set', () => {
    expect(formatNumber('abc', true)).toBe('0')
  })

  it('groups digits with separators when requested (en-US locale)', () => {
    expect(formatNumber(1234567, false, true)).toBe('1,234,567')
  })
})

describe('formatVNA', () => {
  it('converts a microVNA string to VNA with the unit suffix', () => {
    expect(formatVNA('1000000')).toBe('1 VNA')
    expect(formatVNA('1500000')).toBe('1.5 VNA')
    expect(formatVNA('500000')).toBe('0.5 VNA')
  })

  it('keeps up to six fractional digits and trims trailing zeros', () => {
    expect(formatVNA('1234567')).toBe('1.234567 VNA')
    expect(formatVNA('1')).toBe('0.000001 VNA')
  })

  it('honours a custom decimals exponent', () => {
    expect(formatVNA('1000', 3)).toBe('1 VNA')
    expect(formatVNA('1500', 3)).toBe('1.5 VNA')
  })

  it('returns an empty string for null or empty input', () => {
    expect(formatVNA(null)).toBe('')
    expect(formatVNA('')).toBe('')
  })
})

describe('formatVNAFromUVNA', () => {
  it('formats a finite numeric string as VNA', () => {
    expect(formatVNAFromUVNA('2000000')).toBe('2 VNA')
  })

  it('returns an empty string for blank or non-finite input', () => {
    expect(formatVNAFromUVNA(null)).toBe('')
    expect(formatVNAFromUVNA('')).toBe('')
    expect(formatVNAFromUVNA('   ')).toBe('')
    expect(formatVNAFromUVNA('not-a-number')).toBe('')
  })
})

describe('parseVNA', () => {
  it('is the inverse of formatVNA for whole and fractional VNA', () => {
    expect(parseVNA('1 VNA')).toBe('1000000')
    expect(parseVNA('1.5 VNA')).toBe('1500000')
    expect(parseVNA('0.000001 VNA')).toBe('1')
  })

  it('strips thousands separators and the unit', () => {
    expect(parseVNA('1,234.5 VNA')).toBe('1234500000')
  })

  it('rounds to the nearest microVNA', () => {
    expect(parseVNA('0.0000005 VNA')).toBe('1')
    expect(parseVNA('0.0000004 VNA')).toBe('0')
  })

  it('honours a custom decimals exponent', () => {
    expect(parseVNA('1.5 VNA', 3)).toBe('1500')
  })

  it('returns "0" for empty or unparseable input', () => {
    expect(parseVNA('')).toBe('0')
    expect(parseVNA('VNA')).toBe('0')
  })
})

describe('formatUSDfromUVNA', () => {
  it('multiplies the VNA amount by the conversion factor with a USD prefix', () => {
    expect(formatUSDfromUVNA('10', 1.5)).toBe('≈ $15 USD')
    expect(formatUSDfromUVNA('2', 0.5)).toBe('≈ $1 USD')
  })

  it('clamps the displayed value to two fractional digits', () => {
    expect(formatUSDfromUVNA('1', 0.125)).toBe('≈ $0.13 USD')
  })

  it('ignores thousands separators in the amount', () => {
    expect(formatUSDfromUVNA('1,000', 2)).toBe('≈ $2,000 USD')
  })

  it('returns an empty string for an empty amount', () => {
    expect(formatUSDfromUVNA(null, 1)).toBe('')
    expect(formatUSDfromUVNA('', 1)).toBe('')
  })

  it('returns an empty string for a non-positive or non-finite factor', () => {
    expect(formatUSDfromUVNA('10', 0)).toBe('')
    expect(formatUSDfromUVNA('10', -1)).toBe('')
    expect(formatUSDfromUVNA('10', Number.NaN)).toBe('')
    expect(formatUSDfromUVNA('10', Number.POSITIVE_INFINITY)).toBe('')
  })

  it('returns an empty string when the amount has no numeric content', () => {
    expect(formatUSDfromUVNA('abc', 1)).toBe('')
  })
})

describe('shortenMiddle', () => {
  it('leaves strings within the limit untouched', () => {
    expect(shortenMiddle('short', 10)).toBe('short')
    expect(shortenMiddle('exactly-10', 10)).toBe('exactly-10')
  })

  it('collapses the middle of long strings with an ellipsis', () => {
    expect(shortenMiddle('abcdefghijklmnop', 9)).toBe('abc...nop')
  })

  it('keeps floor((maxLength-3)/2) characters on each side', () => {
    const result = shortenMiddle('0123456789ABCDEF', 10)
    expect(result).toBe('012...DEF')
    expect(result.startsWith('012')).toBe(true)
    expect(result.endsWith('DEF')).toBe(true)
  })
})

describe('shortenDID', () => {
  it('returns short DIDs unchanged', () => {
    expect(shortenDID('did:example:123')).toBe('did:example:123')
  })

  it('truncates DIDs longer than 30 characters in the middle', () => {
    const did = 'did:example:0123456789abcdefghijklmnopqrstuvwxyz'
    const out = shortenDID(did)
    expect(out).toContain('...')
    expect(out.length).toBeLessThan(did.length)
    expect(out.startsWith('did:example:')).toBe(true)
  })
})

describe('formatDateTime', () => {
  it('formats a Date into YYYY-MM-DD HH:mm:ss in local time', () => {
    const d = new Date(2026, 1, 6, 9, 5, 3)
    expect(formatDateTime(d)).toBe('2026-02-06 09:05:03')
  })

  it('zero-pads month, day, hour, minute and second', () => {
    const d = new Date(2026, 0, 1, 0, 0, 0)
    expect(formatDateTime(d)).toBe('2026-01-01 00:00:00')
  })

  it('returns an empty string for nullish, empty or invalid input', () => {
    expect(formatDateTime('')).toBe('')
    expect(formatDateTime(null as unknown as string)).toBe('')
    expect(formatDateTime('not-a-date')).toBe('')
  })
})

describe('countryNameFromCode', () => {
  it('resolves ISO codes to English region names', () => {
    expect(countryNameFromCode('US')).toBe('United States')
    expect(countryNameFromCode('FR')).toBe('France')
  })

  it('normalises case and whitespace before lookup', () => {
    expect(countryNameFromCode('  fr  ')).toBe('France')
  })

  it('returns an empty string for empty or nullish input', () => {
    expect(countryNameFromCode('')).toBe('')
    expect(countryNameFromCode(null)).toBe('')
    expect(countryNameFromCode(undefined)).toBe('')
  })

  it('returns the normalised code when ICU rejects the format', () => {
    expect(countryNameFromCode('A1')).toBe('A1')
  })

  it('returns the well-formed-but-unknown code unchanged', () => {
    expect(countryNameFromCode('XX')).toBe('XX')
  })
})

describe('countryCodeToFlag', () => {
  it('maps a valid two-letter code to its regional-indicator flag', () => {
    expect(countryCodeToFlag('FR')).toBe('🇫🇷')
    expect(countryCodeToFlag('us')).toBe('🇺🇸')
  })

  it('returns the white-flag fallback for missing input', () => {
    expect(countryCodeToFlag()).toBe('🏳️')
    expect(countryCodeToFlag(null)).toBe('🏳️')
    expect(countryCodeToFlag('')).toBe('🏳️')
  })

  it('returns the white-flag fallback for non two-letter codes', () => {
    expect(countryCodeToFlag('USA')).toBe('🏳️')
    expect(countryCodeToFlag('U')).toBe('🏳️')
    expect(countryCodeToFlag('1F')).toBe('🏳️')
  })
})

describe('isJson', () => {
  it('returns objects and arrays as-is', () => {
    const obj = { a: 1 }
    const arr = [1, 2, 3]
    expect(isJson(obj)).toBe(obj)
    expect(isJson(arr)).toBe(arr)
  })

  it('parses JSON-shaped strings', () => {
    expect(isJson('{"a":1}')).toEqual({ a: 1 })
    expect(isJson('  [1,2]  ')).toEqual([1, 2])
  })

  it('returns null for malformed JSON strings', () => {
    expect(isJson('{bad json}')).toBeNull()
  })

  it('returns null for non-JSON strings and primitives', () => {
    expect(isJson('hello')).toBeNull()
    expect(isJson('42')).toBeNull()
    expect(isJson(42)).toBeNull()
    expect(isJson(null)).toBeNull()
    expect(isJson(undefined)).toBeNull()
  })
})

describe('isExpired', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('treats dates strictly before today (midnight) as expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpired(new Date(2026, 5, 22))).toBe(true)
  })

  it('treats today and future dates as not expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpired(new Date(2026, 5, 23, 14, 0, 0))).toBe(false)
    expect(isExpired(new Date(2026, 5, 24))).toBe(false)
  })
})

describe('isExpireSoon', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is true for a date within 24h of today midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpireSoon(new Date(2026, 5, 23, 20, 0, 0))).toBe(true)
  })

  it('is false for already-expired dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpireSoon(new Date(2026, 5, 22))).toBe(false)
  })

  it('is false for dates more than a day past today midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpireSoon(new Date(2026, 5, 25))).toBe(false)
  })
})

describe('getStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "expired" for past dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(getStatus(new Date(2026, 5, 22))).toBe('expired')
  })

  it('returns "expiring" for dates within the next month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(getStatus(new Date(2026, 5, 30))).toBe('expiring')
  })

  it('returns "active" for dates more than a month out', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(getStatus(new Date(2026, 7, 22))).toBe('active')
  })

  it('returns "expired" as a fallback for invalid input', () => {
    expect(getStatus('not-a-date')).toBe('expired')
  })
})

describe('withCurrentLocalTimePlusOneMinute', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('combines the given date with the current local clock plus one minute', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 10, 30, 45, 0))
    expect(withCurrentLocalTimePlusOneMinute('2026-02-06')).toBe('2026-02-06T10:31:45')
  })

  it('rolls the minute over into the next hour when seconds carry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 10, 59, 30, 0))
    expect(withCurrentLocalTimePlusOneMinute('2026-12-31')).toBe('2026-12-31T11:00:30')
  })

  it('returns an empty string when the date is not a full YYYY-MM-DD', () => {
    expect(withCurrentLocalTimePlusOneMinute('')).toBe('')
    expect(withCurrentLocalTimePlusOneMinute('2026-02')).toBe('')
    expect(withCurrentLocalTimePlusOneMinute('not-a-date')).toBe('')
  })
})

describe('rolesSchema', () => {
  it('adds grantor roles only under the V4 grantor onboarding mode', () => {
    expect(rolesSchema('GRANTOR_ONBOARDING_PROCESS', 'GRANTOR_ONBOARDING_PROCESS')).toEqual([
      'ISSUER_GRANTOR',
      'ISSUER',
      'VERIFIER_GRANTOR',
      'VERIFIER',
      'HOLDER',
    ])
  })

  it('omits grantor roles for OPEN and ecosystem onboarding modes', () => {
    expect(rolesSchema('OPEN', 'OPEN')).toEqual(['ISSUER', 'VERIFIER', 'HOLDER'])
    expect(rolesSchema('ECOSYSTEM_ONBOARDING_PROCESS', 'ECOSYSTEM_ONBOARDING_PROCESS')).toEqual([
      'ISSUER',
      'VERIFIER',
      'HOLDER',
    ])
  })

  it('handles mixed issuer and verifier modes', () => {
    expect(rolesSchema('GRANTOR_ONBOARDING_PROCESS', 'OPEN')).toEqual([
      'ISSUER_GRANTOR',
      'ISSUER',
      'VERIFIER',
      'HOLDER',
    ])
  })

  it('always includes HOLDER', () => {
    expect(rolesSchema('OPEN', 'OPEN')).toContain('HOLDER')
  })
})

describe('role class helpers', () => {
  it('roleBadgeClass returns distinct classes per known role and a gray default', () => {
    expect(roleBadgeClass('ECOSYSTEM')).toContain('purple')
    expect(roleBadgeClass('ISSUER')).toContain('green')
    expect(roleBadgeClass('VERIFIER')).toContain('orange')
    expect(roleBadgeClass('HOLDER')).toContain('pink')
    expect(roleBadgeClass('UNKNOWN' as never)).toContain('gray')
  })

  it('roleColorClass maps roles to text colour classes', () => {
    expect(roleColorClass('ECOSYSTEM')).toBe('text-purple-500')
    expect(roleColorClass('ISSUER_GRANTOR')).toBe('text-blue-500')
    expect(roleColorClass('whatever')).toBe('text-gray-500')
  })

  it('roleJoinColorClass omits ECOSYSTEM and defaults to gray', () => {
    expect(roleJoinColorClass('ISSUER')).toBe('bg-green-100 text-green-500')
    expect(roleJoinColorClass('ECOSYSTEM')).toBe('bg-gray-100 text-gray-500')
    expect(roleJoinColorClass('whatever')).toBe('bg-gray-100 text-gray-500')
  })
})
