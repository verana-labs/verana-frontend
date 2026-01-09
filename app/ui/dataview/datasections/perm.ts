export type PermissionType =
  | "ECOSYSTEM"
  | "ISSUER_GRANTOR"
  | "VERIFIER_GRANTOR"
  | "ISSUER"
  | "VERIFIER"
  | "HOLDER";

export type VpState =
  | "PENDING"
  | "VALIDATED"
  | "TERMINATED"
  | "VALIDATION_STATE_UNSPECIFIED";

/**
 * API Permission payload (dates are ISO strings)
 */
export interface Permission {
  id: string;
  schema_id: string;
  type: PermissionType;
  did: string;
  grantee: string;
  created_by: string;
  created: string;  // ISO datetime
  modified: string; // ISO datetime
  extended: string; // ISO datetime
  extended_by: string;
  slashed: string;  // ISO datetime
  slashed_by: string;
  repaid: string;   // ISO datetime
  repaid_by: string;
  effective_from: string;   // ISO datetime
  effective_until: string;  // ISO datetime
  revoked: string;  // ISO datetime
  revoked_by: string;
  country: string;
  validation_fees: string;
  issuance_fees: string;
  verification_fees: string;
  deposit: string;
  slashed_deposit: string;
  repaid_deposit: string;
  validator_perm_id: string;
  vp_state: VpState;
  vp_last_state_change: string; // ISO datetime
  vp_current_fees: string;
  vp_current_deposit: string;
  vp_summary_digest_sri: string;
  vp_exp: string;   // ISO datetime
  vp_validator_deposit: string;
  vp_term_requested: string;    // ISO datetime
}