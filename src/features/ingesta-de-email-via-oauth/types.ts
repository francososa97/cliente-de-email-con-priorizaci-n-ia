// Tipos del dominio para el flujo OAuth 2.0 de ingesta de email (Gmail / Outlook).
// TypeScript strict: sin `any`, tipos explícitos.

/** Proveedores de correo soportados por el flujo OAuth. */
export type EmailProvider = 'google' | 'microsoft';

/** Configuración estática de un proveedor OAuth 2.0 (Authorization Code + PKCE opcional). */
export interface OAuthProviderConfig {
  readonly provider: EmailProvider;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  /** Scopes solicitados; deben incluir acceso de lectura de correo + offline/refresh. */
  readonly scopes: readonly string[];
  /** URI de callback registrada en la consola del proveedor. */
  readonly redirectUri: string;
}

/** Mapa de configuración por proveedor. */
export type OAuthProviderRegistry = Readonly<Record<EmailProvider, OAuthProviderConfig>>;

/** Respuesta cruda del token endpoint (RFC 6749 §5.1). */
export interface ProviderTokenResponse {
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly expires_in: number;
  readonly scope?: string;
  readonly token_type: string;
  readonly id_token?: string;
}

/** Estado firmado que viaja en el parámetro `state` para prevenir CSRF y enrutar el callback. */
export interface OAuthState {
  readonly provider: EmailProvider;
  readonly userId: string;
  readonly nonce: string;
  /** epoch ms de emisión, para expirar states viejos. */
  readonly issuedAt: number;
}

/** Payload de un refresh_token cifrado con envelope encryption (KMS + AES-256-GCM). */
export interface EncryptedSecret {
  /** Data key cifrada por KMS (CiphertextBlob), base64. */
  readonly encryptedDataKey: string;
  /** IV de AES-GCM, base64. */
  readonly iv: string;
  /** Auth tag de AES-GCM, base64. */
  readonly authTag: string;
  /** Ciphertext del secreto, base64. */
  readonly ciphertext: string;
  /** ARN/ID de la KMS key usada, para rotación/auditoría. */
  readonly keyId: string;
}

/** Credencial persistida de una cuenta conectada. */
export interface StoredCredential {
  readonly userId: string;
  readonly provider: EmailProvider;
  /** Refresh token cifrado en reposo (nunca en claro). */
  readonly encryptedRefreshToken: EncryptedSecret;
  readonly scope: string;
  /** epoch ms en el que expira el access token vigente. */
  readonly accessTokenExpiresAt: number;
  readonly connectedAt: number;
}

/** Abstracción del cliente KMS para envelope encryption. */
export interface KmsClient {
  /** Genera una data key: devuelve la clave en claro (para cifrar en memoria) y su blob cifrado. */
  generateDataKey(keyId: string): Promise<{ plaintextKey: Buffer; encryptedDataKey: Buffer }>;
}

/** Abstracción de persistencia de credenciales. */
export interface CredentialStore {
  save(credential: StoredCredential): Promise<void>;
}

/** Firma/verificación del `state` (HMAC) para integridad anti-CSRF. */
export interface StateSigner {
  sign(state: OAuthState): string;
  /** Devuelve el state si la firma es válida y no expiró; null en caso contrario. */
  verify(token: string, maxAgeMs: number): OAuthState | null;
}

/** Error de dominio del flujo OAuth con causa legible para el usuario. */
export class OAuthError extends Error {
  public readonly code: OAuthErrorCode;
  constructor(code: OAuthErrorCode, message: string) {
    super(message);
    this.name = 'OAuthError';
    this.code = code;
  }
}

export type OAuthErrorCode =
  | 'user_cancelled'
  | 'invalid_state'
  | 'token_exchange_failed'
  | 'missing_refresh_token'
  | 'unknown_provider';
