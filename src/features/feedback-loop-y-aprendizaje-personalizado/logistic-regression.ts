/**
 * Regresión logística ligera entrenada por descenso de gradiente batch.
 * Sin dependencias externas para poder correr dentro de un job nocturno
 * y mantener el reentrenamiento por usuario bajo el presupuesto de <5min.
 */

export interface LabeledSample {
  readonly features: readonly number[];
  readonly label: 0 | 1;
}

export interface LogisticModel {
  readonly weights: readonly number[];
  readonly bias: number;
  readonly featureCount: number;
}

export interface TrainingOptions {
  readonly learningRate: number;
  readonly epochs: number;
  /** Coeficiente de regularización L2 para evitar sobreajuste con pocos datos. */
  readonly l2: number;
}

export const DEFAULT_TRAINING_OPTIONS: TrainingOptions = {
  learningRate: 0.1,
  epochs: 300,
  l2: 0.001,
};

function sigmoid(z: number): number {
  // Formulación numéricamente estable para z positivos y negativos.
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

export function predictProbability(
  model: LogisticModel,
  features: readonly number[],
): number {
  if (features.length !== model.featureCount) {
    throw new Error(
      `Dimensión de features inválida: esperaba ${model.featureCount}, recibí ${features.length}`,
    );
  }
  let z = model.bias;
  for (let i = 0; i < model.featureCount; i++) {
    z += model.weights[i] * features[i];
  }
  return sigmoid(z);
}

export function predictLabel(
  model: LogisticModel,
  features: readonly number[],
  threshold = 0.5,
): 0 | 1 {
  return predictProbability(model, features) >= threshold ? 1 : 0;
}

export function trainLogisticModel(
  samples: readonly LabeledSample[],
  options: TrainingOptions = DEFAULT_TRAINING_OPTIONS,
): LogisticModel {
  if (samples.length === 0) {
    throw new Error('No se puede entrenar sin muestras');
  }
  const featureCount = samples[0].features.length;
  if (featureCount === 0) {
    throw new Error('Las muestras deben tener al menos una feature');
  }
  for (const sample of samples) {
    if (sample.features.length !== featureCount) {
      throw new Error('Todas las muestras deben tener la misma cantidad de features');
    }
  }

  const weights = new Array<number>(featureCount).fill(0);
  let bias = 0;
  const n = samples.length;

  for (let epoch = 0; epoch < options.epochs; epoch++) {
    const gradW = new Array<number>(featureCount).fill(0);
    let gradB = 0;

    for (const sample of samples) {
      let z = bias;
      for (let i = 0; i < featureCount; i++) {
        z += weights[i] * sample.features[i];
      }
      const error = sigmoid(z) - sample.label;
      for (let i = 0; i < featureCount; i++) {
        gradW[i] += error * sample.features[i];
      }
      gradB += error;
    }

    for (let i = 0; i < featureCount; i++) {
      const grad = gradW[i] / n + options.l2 * weights[i];
      weights[i] -= options.learningRate * grad;
    }
    bias -= options.learningRate * (gradB / n);
  }

  return { weights, bias, featureCount };
}

/** Accuracy = proporción de etiquetas correctas sobre el set provisto. */
export function evaluateAccuracy(
  model: LogisticModel,
  samples: readonly LabeledSample[],
): number {
  if (samples.length === 0) {
    return 0;
  }
  let correct = 0;
  for (const sample of samples) {
    if (predictLabel(model, sample.features) === sample.label) {
      correct++;
    }
  }
  return correct / samples.length;
}
