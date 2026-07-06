// Tipos del dominio de priorización de la bandeja.
// En un monorepo maduro estos vivirían en src/shared/types/index.ts y se
// reexportarían desde aquí; se definen locales porque el paquete compartido
// aún no expone el modelo de Email priorizado.

/** Niveles de prioridad que asigna el motor de IA. */
export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * Email tal como lo devuelve el backend en GET /inbox.
 * `priority` es `null` mientras el motor todavía no lo clasificó: esos emails
 * se muestran en la sección 'Procesando'.
 */
export interface Email {
  readonly id: string;
  readonly threadId: string;
  readonly from: string;
  readonly subject: string;
  readonly snippet: string;
  /** ISO 8601, e.g. '2026-07-06T12:34:56.000Z'. */
  readonly receivedAt: string;
  readonly isRead: boolean;
  readonly priority: PriorityLevel | null;
  /** Motivo textual que justifica la prioridad (opcional, para UI/tooltip). */
  readonly priorityReason: string | null;
}

/**
 * Respuesta cruda de GET /inbox. El backend ya agrupa por prioridad para que
 * el frontend no tenga que recalcular en cada render.
 */
export interface InboxResponse {
  readonly high: readonly Email[];
  readonly medium: readonly Email[];
  readonly low: readonly Email[];
  /** Emails sincronizados sin priority asignada aún. */
  readonly processing: readonly Email[];
  /** Momento de la última sincronización con el proveedor (ISO 8601). */
  readonly syncedAt: string;
}

/** Identificador estable de cada sección renderizable de la bandeja. */
export type InboxSectionKey = 'high' | 'medium' | 'low' | 'processing';

/** Sección lista para renderizar, con etiqueta y emails ya resueltos. */
export interface InboxSection {
  readonly key: InboxSectionKey;
  readonly label: string;
  readonly emails: readonly Email[];
}
