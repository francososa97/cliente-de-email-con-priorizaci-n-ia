// Tipos del dominio de ingesta OAuth. Idealmente re-exportados/consumidos
// desde src/shared/types/index.ts cuando ese módulo exista.

/** Estados posibles de una cuenta conectada. */
export type AccountStatus = 'active' | 'syncing' | 'reauth_required' | 'disabled';

/** Proveedores OAuth soportados por la ingesta. */
export type OAuthProvider = 'google' | 'microsoft';

/** Par de tokens OAuth persistido por cuenta. */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch en milisegundos en que expira el accessToken. */
  expiresAt: number;
  /** Scope concedido, tal cual lo devuelve el proveedor. */
  scope: string;
  tokenType: string;
}

/** Cuenta de email conectada vía OAuth. */
export interface OAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  email: string;
  status: AccountStatus;
  tokens: OAuthTokens;
}

/** Respuesta cruda del endpoint de token del proveedor OAuth. */
export interface TokenEndpointResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type: string;
  /** Algunos proveedores rotan el refresh_token; puede venir ausente. */
  refresh_token?: string;
}

/** Configuración del cliente OAuth por proveedor. */
export interface OAuthClientConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  /** URL del endpoint de token (ej: https://oauth2.googleapis.com/token). */
  tokenEndpoint: string;
}

/** Persistencia de cuentas (abstrae la base de datos concreta). */
export interface AccountRepository {
  save(account: OAuthAccount): Promise<void>;
}

/** Canal de notificación al usuario (email, push, in-app, etc.). */
export interface UserNotifier {
  notifyReauthRequired(account: OAuthAccount): Promise<void>;
}

/** Error tipado que representa un refresh_token inválido o revocado. */
export class RefreshTokenRevokedError extends Error {
  readonly accountId: string;

  constructor(accountId: string, message: string) {
    super(message);
    this.name = 'RefreshTokenRevokedError';
    this.accountId = accountId;
  }
}
