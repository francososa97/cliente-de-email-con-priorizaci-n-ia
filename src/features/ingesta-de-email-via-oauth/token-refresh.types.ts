// Tipos y puertos (ports) para el refresco automático de tokens OAuth.
// Cuando exista src/shared/types/index.ts, `AccountStatus` y `EmailAccount`
// deberían re-exportarse desde ahí; se declaran aquí para que la feature sea
// autocontenida y compile en TypeScript strict sin dependencias faltantes.

/** Estado del ciclo de vida de una cuenta de email conectada vía OAuth. */
export type AccountStatus =
  | 'active'
  | 'reauth_required'
  | 'disabled';

/** Proveedor de correo soportado por la ingesta. */
export type EmailProvider = 'gmail' | 'outlook';

/**
 * Credenciales OAuth almacenadas por cuenta.
 * `expiresAt` es un epoch en milisegundos (UTC) para facilitar comparaciones
 * de expiración sin ambigüedad de zona horaria.
 */
export interface OAuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly tokenType: string;
  readonly scope: string;
}

/** Cuenta de email conectada. */
export interface EmailAccount {
  readonly id: string;
  readonly userId: string;
  readonly provider: EmailProvider;
  readonly email: string;
  readonly status: AccountStatus;
  readonly tokens: OAuthTokens;
}

/**
 * Resultado de un intercambio de refresh_token contra el proveedor OAuth.
 * El proveedor puede o no rotar el refresh_token; si no lo devuelve se reusa
 * el existente.
 */
export interface RefreshedTokens {
  readonly accessToken: string;
  /** Nuevo refresh_token si el proveedor lo rotó; ausente si se conserva. */
  readonly refreshToken?: string;
  /** Segundos de validez del nuevo access_token (campo `expires_in` OAuth). */
  readonly expiresInSeconds: number;
  readonly tokenType: string;
  readonly scope: string;
}

/**
 * Motivo por el que falló un intercambio de refresh_token.
 * - `revoked`: el refresh_token fue revocado/invalidado (requiere re-auth).
 * - `invalid_grant`: grant inválido o expirado (requiere re-auth).
 * - `transient`: error de red/5xx/timeout — se puede reintentar en el próximo sync.
 */
export type RefreshFailureReason = 'revoked' | 'invalid_grant' | 'transient';

/** Error tipado lanzado por el TokenRefresher cuando el intercambio falla. */
export class TokenRefreshError extends Error {
  public readonly reason: RefreshFailureReason;

  constructor(reason: RefreshFailureReason, message: string) {
    super(message);
    this.name = 'TokenRefreshError';
    this.reason = reason;
  }

  /** True si el fallo es permanente y la cuenta debe pasar a reauth_required. */
  public get requiresReauth(): boolean {
    return this.reason === 'revoked' || this.reason === 'invalid_grant';
  }
}

/**
 * Error lanzado por el servicio hacia el caller (p.ej. el orquestador de sync)
 * cuando la cuenta quedó en estado reauth_required. Señala que NO se debe
 * reintentar el sync hasta que el usuario reconecte la cuenta.
 */
export class ReauthRequiredError extends Error {
  public readonly accountId: string;

  constructor(accountId: string, message: string) {
    super(message);
    this.name = 'ReauthRequiredError';
    this.accountId = accountId;
  }
}

// ----------------------------------------------------------------------------
// Puertos (interfaces) — implementados por la infraestructura (Gmail/Outlook,
// repositorio de cuentas, sistema de notificaciones). Inyección de dependencias
// según ARCHITECTURE.md (hexagonal / ports & adapters).
// ----------------------------------------------------------------------------

/** Realiza el intercambio del refresh_token contra el proveedor OAuth. */
export interface TokenRefresher {
  /**
   * Intercambia un refresh_token por un nuevo access_token.
   * @throws {TokenRefreshError} con el `reason` correspondiente si falla.
   */
  refresh(input: {
    readonly provider: EmailProvider;
    readonly refreshToken: string;
  }): Promise<RefreshedTokens>;
}

/** Persistencia de cuentas de email. */
export interface AccountRepository {
  findById(accountId: string): Promise<EmailAccount | null>;
  /** Persiste tokens actualizados de forma atómica para la cuenta. */
  updateTokens(accountId: string, tokens: OAuthTokens): Promise<void>;
  /** Actualiza el status de la cuenta. */
  updateStatus(accountId: string, status: AccountStatus): Promise<void>;
}

/** Notifica al usuario que debe volver a autenticar su cuenta. */
export interface UserNotifier {
  notifyReauthRequired(input: {
    readonly userId: string;
    readonly accountId: string;
    readonly email: string;
  }): Promise<void>;
}

/** Abstracción de reloj para testabilidad determinística. */
export interface Clock {
  now(): number;
}

/** Reloj por defecto basado en el reloj del sistema. */
export const systemClock: Clock = {
  now: (): number => Date.now(),
};
