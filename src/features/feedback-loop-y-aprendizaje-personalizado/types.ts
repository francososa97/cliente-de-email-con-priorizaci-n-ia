/**
 * Tipos del dominio para la búsqueda de emails similares vía pgvector
 * dentro de la épica de Feedback Loop y Aprendizaje Personalizado.
 *
 * NOTA: En cuanto exista `src/shared/types/index.ts` estos tipos deberían
 * reexportarse desde allí. Se definen aquí de forma local para mantener la
 * feature autocontenida y compilable en modo `strict`.
 */

/**
 * Prioridad de un email. Se modela como unión de literales para evitar
 * valores inválidos y, a la vez, se mapea a un valor numérico normalizado
 * ([0, 1]) para poder usarla como señal cuantitativa en el score final.
 */
export type EmailPriority = 'urgent' | 'high' | 'normal' | 'low';

/** Valor numérico normalizado en [0, 1] asociado a cada prioridad. */
export const PRIORITY_WEIGHT: Readonly<Record<EmailPriority, number>> = {
  urgent: 1,
  high: 0.66,
  normal: 0.33,
  low: 0,
};

/** Dimensión del embedding (compatible con text-embedding-3-small / pgvector). */
export const EMBEDDING_DIMENSIONS = 1536 as const;

/** Vector de embedding de longitud fija. */
export type Embedding = readonly number[];

/**
 * Email de entrada mínimo necesario para calcular su embedding.
 * Puede ampliarse cuando exista el tipo `Email` compartido.
 */
export interface EmailInput {
  readonly id: string;
  readonly subject: string;
  readonly body: string;
  /** Remitente, útil como contexto adicional para el embedding. */
  readonly from?: string;
}

/**
 * Email ya corregido por el usuario (ground truth del feedback loop),
 * tal como se persiste en la tabla con columna `vector` de pgvector.
 */
export interface CorrectedEmailNeighbor {
  readonly emailId: string;
  /** Prioridad final asignada/corregida por el usuario. */
  readonly correctedPriority: EmailPriority;
  /**
   * Distancia coseno devuelta por pgvector (`<=>`). Rango [0, 2],
   * donde 0 = idéntico. Se convierte a similitud en el servicio.
   */
  readonly cosineDistance: number;
}

/** Vecino con la similitud ya normalizada a [0, 1]. */
export interface SimilarEmail extends CorrectedEmailNeighbor {
  /** Similitud coseno en [0, 1] (1 = idéntico). */
  readonly similarity: number;
}

/** Configuración del cálculo del score. */
export interface SimilarityScoreConfig {
  /**
   * Peso de la señal de prioridad de los vecinos en el score final [0, 1].
   * 0 => la prioridad de los vecinos no influye (sólo baseline de similitud).
   */
  readonly prioritySignalWeight: number;
  /** Cantidad de vecinos a recuperar. */
  readonly topK: number;
}

export const DEFAULT_SCORE_CONFIG: SimilarityScoreConfig = {
  prioritySignalWeight: 0.5,
  topK: 5,
};

/** Resultado del cálculo de prioridad para un email nuevo. */
export interface PriorityPrediction {
  readonly emailId: string;
  /** Score final normalizado en [0, 1] (1 = máxima prioridad). */
  readonly finalScore: number;
  /** Prioridad discreta derivada del `finalScore`. */
  readonly predictedPriority: EmailPriority;
  /** Componente baseline (sólo confianza de similitud, sin prioridad). */
  readonly baselineScore: number;
  /** Componente aportado por la señal de prioridad de los vecinos. */
  readonly prioritySignalScore: number;
  /** Vecinos usados para la predicción, ordenados por similitud desc. */
  readonly neighbors: readonly SimilarEmail[];
  /** Indica si la señal de prioridad influyó en `finalScore`. */
  readonly prioritySignalApplied: boolean;
}

/** Provee embeddings para un texto (ej: wrapper del SDK de OpenAI/Anthropic). */
export interface EmbeddingProvider {
  embed(text: string): Promise<Embedding>;
}

/** Acceso a los vecinos más similares almacenados en pgvector. */
export interface SimilarEmailRepository {
  /**
   * Devuelve los `topK` emails corregidos más similares al embedding dado,
   * ordenados por distancia coseno ascendente.
   */
  findMostSimilarCorrected(
    embedding: Embedding,
    topK: number,
  ): Promise<readonly CorrectedEmailNeighbor[]>;
}
