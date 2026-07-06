import type { Priority } from '../../shared/types/index.js';

/**
 * Fila persistida en la tabla `feedback_events`. Cada correccion manual de
 * prioridad genera un registro que alimenta el aprendizaje personalizado.
 */
export interface FeedbackEvent {
  id: string;
  userId: string;
  emailId: string;
  oldPriority: Priority;
  newPriority: Priority;
  createdAt: Date;
}

/** Datos necesarios para insertar un nuevo `FeedbackEvent`. */
export interface NewFeedbackEvent {
  userId: string;
  emailId: string;
  oldPriority: Priority;
  newPriority: Priority;
}

/** Payload recibido en `PATCH /emails/:id/priority`. */
export interface UpdatePriorityRequest {
  priority: Priority;
}

/** Respuesta del endpoint de correccion de prioridad. */
export interface UpdatePriorityResponse {
  emailId: string;
  oldPriority: Priority;
  newPriority: Priority;
  feedbackEventId: string;
}

/**
 * Puerto de persistencia. Se inyecta en el servicio para desacoplar la logica
 * de negocio del driver de base de datos concreto (Postgres, etc.).
 */
export interface FeedbackRepository {
  /** Devuelve la prioridad actual del email o `null` si no existe / no pertenece al usuario. */
  getEmailPriority(userId: string, emailId: string): Promise<Priority | null>;
  /** Actualiza la prioridad del email y persiste el evento de feedback en una unica transaccion. */
  updatePriorityWithFeedback(event: NewFeedbackEvent): Promise<FeedbackEvent>;
}

/** Error de dominio usado cuando el email no existe o no pertenece al usuario. */
export class EmailNotFoundError extends Error {
  constructor(emailId: string) {
    super(`Email not found: ${emailId}`);
    this.name = 'EmailNotFoundError';
  }
}

/** Error de dominio usado cuando la prioridad recibida no es valida. */
export class InvalidPriorityError extends Error {
  constructor(value: unknown) {
    super(`Invalid priority value: ${String(value)}`);
    this.name = 'InvalidPriorityError';
  }
}
