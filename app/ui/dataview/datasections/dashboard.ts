export interface ParticipantRoles {
  ecosystem: number
  issuer: number
  verifier: number
  holder: number
  issuerGrantor: number
  verifierGrantor: number
}

export interface DashboardData {
  blockHeight?: number | null
  ecosystems?: number | null
  schemas?: number | null
  participants?: number | null
  totalLockedTrustDeposit?: string | null
  issuedCredentials?: number | null
  verifiedCredentials?: number | null
  roles?: ParticipantRoles | null
}
