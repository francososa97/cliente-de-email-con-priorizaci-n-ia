// Tipos del feature de ingesta. Reutiliza los tipos compartidos cuando existen
// (src/shared/types) y define los específicos del worker de sincronización.
import type { EmailMessage, EmailAccount, Provider } from '../../shared/types/index';

export type { EmailMessage, EmailAccount, Provider };

/**
 * Estados posibles de la sincronización de una cuenta.
 * Se persisten en la columna `account.sync_status`.
 */
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Payload que viaja en el job de BullMQ para la sincronización inicial.
 */
export interface InitialSyncJobData {
  readonly accountId: string;
  readonly userId: string;
  readonly provider: Provider;
  /** Cantidad de emails a traer en la carga inicial. */
  readonly limit: number;
}

/**
 * Resultado devuelto por el processor del job.
 */
export interface InitialSyncJobResult {
  readonly accountId: string;
  readonly fetched: number;
  readonly persisted: number;
  readonly durationMs: number;
  readonly syncStatus: SyncStatus;
}

/**
 * Credenciales OAuth ya validadas y persistidas para una cuenta.
 */
export interface OAuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresAt: Date;
}

/**
 * Representación normalizada de un email traído del proveedor, agnóstica
 * de IMAP o Graph, lista para persistir.
 */
export interface RawFetchedEmail {
  readonly externalId: string;
  readonly threadId: string | null;
  readonly fromAddress: string;
  readonly fromName: string | null;
  readonly toAddresses: readonly string[];
  readonly subject: string;
  readonly snippet: string;
  readonly bodyText: string;
  readonly bodyHtml: string | null;
  readonly receivedAt: Date;
  readonly isRead: boolean;
}

/**
 * Abstracción de un cliente de email. Cada proveedor (IMAP / Graph) implementa
 * esta interfaz, de modo que el service es independiente del transporte.
 */
export interface MailboxClient {
  /** Trae los `limit` emails más recientes de INBOX. */
  fetchRecent(limit: number): Promise<readonly RawFetchedEmail[]>;
  /** Libera conexiones subyacentes. */
  close(): Promise<void>;
}

export const INITIAL_SYNC_QUEUE_NAME = 'initial-sync' as const;
