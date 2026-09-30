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
