/** Credential stored on a user (password, otp, webauthn, …). */
export interface UserCredential {
  readonly id: string;
  readonly type: string;
  readonly userLabel: string | null;
  readonly createdDate: number | null;
}
