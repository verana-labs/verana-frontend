import { translate } from '@/i18n/dataview'
import { formatVNAFromUVNA } from '@/util/util'

const AUTHORIZATION_REJECTIONS = [
  /operator authorization not found for this corporation\/operator pair/,
  /operator authorization has expired/,
  /operator authorization does not include requested message type/,
  /operator authorization spend limit exceeded/,
  /signing account is not the policy_address of a registered Corporation/,
  /signing corporation does not control this ecosystem/,
  /authorization check failed/,
]

export function authorizationRejection(text: string): string | null {
  for (const pattern of AUTHORIZATION_REJECTIONS) {
    const match = pattern.exec(text)
    if (match) return match[0]
  }
  return null
}

const CHAIN_REJECTIONS: ReadonlyArray<{ pattern: RegExp; reason: (match: RegExpExecArray) => string }> = [
  {
    pattern: /amount exceeds available deposit: (\d+) > (\d+)/,
    reason: ([, amount, deposit]) =>
      translate('txconfirm.rejection.depositexceeded', {
        amount: formatVNAFromUVNA(amount),
        deposit: formatVNAFromUVNA(deposit),
      }),
  },
  {
    pattern: /insufficient funds to repay slashed deposit: required (\d+)/,
    reason: ([, required]) => translate('txconfirm.rejection.repayfunds', { required: formatVNAFromUVNA(required) }),
  },
  {
    pattern: /spendable balance (\d+)uvna is smaller than (\d+)uvna/,
    reason: ([, balance, required]) =>
      translate('txconfirm.rejection.balance', {
        balance: formatVNAFromUVNA(balance),
        required: formatVNAFromUVNA(required),
      }),
  },
]

export function chainRejection(text: string): string | null {
  for (const { pattern, reason } of CHAIN_REJECTIONS) {
    const match = pattern.exec(text)
    if (match) return reason(match)
  }
  return null
}
