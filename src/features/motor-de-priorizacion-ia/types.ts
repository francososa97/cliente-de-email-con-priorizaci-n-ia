// Tipos del Motor de Priorización IA.
// Se definen aquí los contratos que consume el servicio de escalado.
// Si el proyecto ya expone estos tipos en src/shared/types/index.ts,
// reemplazar estas definiciones por un `export ... from` hacia ese módulo.

/** Identificadores de modelo soportados por el motor de priorización. */
export type ModelId = 'claude-haiku-4-5-20251001' | 'claude-opus-4-8';

/** Etiqueta de prioridad asignada a un email. */
export type PriorityLabel = 'urgent' | 'important' | 'normal' | 'low' | 'ignore';

/** Email normalizado que ingresa al motor de priorización. */
export interface EmailMessage {
  readonly id: string;
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly body: string;
  /** Fecha de recepción en formato ISO-8601. */
  readonly receivedAt: string;
}

/** Consumo de tokens reportado por una llamada al modelo. */
export interface ModelUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/** Resultado crudo de una clasificación de prioridad por un modelo. */
export interface ClassificationResult {
  readonly priority: PriorityLabel;
  /** Confianza del modelo en el rango [0, 1]. */
  readonly confidenceScore: number;
  readonly reasoning: string;
  readonly usage: ModelUsage;
}

/** Scoring final persistido para un email, con trazabilidad del modelo usado. */
export interface PriorityScoring {
  readonly emailId: string;
  readonly priority: PriorityLabel;
  readonly confidenceScore: number;
  readonly reasoning: string;
  /** Modelo que produjo el scoring definitivo. */
  readonly model: ModelId;
  /** true si el resultado provino de un escalado a Opus. */
  readonly escalated: boolean;
  readonly scoredAt: string;
}

/** Abstracción de un clasificador de prioridad respaldado por un modelo. */
export interface Classifier {
  readonly model: ModelId;
  classify(email: EmailMessage): Promise<ClassificationResult>;
}

/** Entrada del log de costos, granular por modelo para auditoría. */
export interface CostLogEntry {
  readonly emailId: string;
  readonly model: ModelId;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  /** true cuando la llamada corresponde a un escalado a Opus. */
  readonly escalated: boolean;
  readonly loggedAt: string;
}

/** Sumidero de eventos de costo por modelo (habilita verificación en logs). */
export interface CostLogger {
  record(entry: CostLogEntry): Promise<void>;
}

/** Persistencia del scoring final del email. */
export interface ScoringRepository {
  save(scoring: PriorityScoring): Promise<void>;
}
