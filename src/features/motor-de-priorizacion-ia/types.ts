/**
 * Tipos del Motor de Priorización IA (Épica E2 · Task E2-T1).
 *
 * Nota: en un monorepo maduro estos tipos vivirían (o se re-exportarían) desde
 * `src/shared/types/index.ts`. Se declaran aquí de forma explícita para mantener
 * la feature auto-contenida y compilable bajo TypeScript strict.
 */

/** Nivel de prioridad asignado por la IA a un email. */
export type Priority = 'alta' | 'media' | 'baja';

/** Emails que llegan al worker de scoring ya ingestados. */
export interface EmailToClassify {
  readonly id: string;
  readonly from: string;
  readonly subject: string;
  /** Cuerpo en texto plano (ya normalizado / limpio de HTML). */
  readonly bodyText: string;
  readonly receivedAt: Date;
}

/** Resultado de una clasificación exitosa. */
export interface ClassificationResult {
  readonly priority: Priority;
  /** Confianza del modelo en el rango [0, 1]. */
  readonly confidenceScore: number;
  /** Justificación breve (útil para auditar y depurar). */
  readonly reasoning: string;
}

/**
 * Payload de persistencia. Cuando la clasificación falla definitivamente,
 * ambos campos quedan en `null` (ver Acceptance Criteria E2-T1).
 */
export interface EmailPriorityUpdate {
  readonly priority: Priority | null;
  readonly confidenceScore: number | null;
}

/** Puerto de persistencia (implementado por la capa de datos / repositorio). */
export interface EmailPriorityRepository {
  updatePriority(emailId: string, update: EmailPriorityUpdate): Promise<void>;
}

/** Logger mínimo e inyectable (evita acoplar a una lib concreta). */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** Contrato del clasificador (permite mockear la IA en tests). */
export interface EmailClassifier {
  classify(email: EmailToClassify): Promise<ClassificationResult>;
}

/** Configuración del clasificador basado en Claude Haiku. */
export interface ClassifierConfig {
  readonly apiKey: string;
  /** Por defecto: `claude-haiku-4-5-20251001`. */
  readonly model?: string;
  /** Timeout por llamada a la API. Por defecto 3000 ms (AC: <3s por email). */
  readonly perAttemptTimeoutMs?: number;
}
