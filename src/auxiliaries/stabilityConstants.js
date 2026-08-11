/** Intervalo de muestreo configurado en ExerciseScreen (ms). */
export const SAMPLE_INTERVAL_MS = 10;

/** Muestras descartadas al inicio (~0,5 s) para estabilizar el sensor. */
export const WARMUP_SAMPLES = 50;

/** Ventanas de análisis (~2 s c/u) sobre ~30 s de registro. */
export const WINDOW_COUNT = 15;

/** Primeras ventanas omitidas (periodo de adaptación postural). */
export const WARMUP_WINDOWS = 2;

/** Segundos aproximados por ventana (para etiquetas de gráficos). */
export const SECONDS_PER_WINDOW = 2;

/** Coeficiente del filtro pasa-alto (100 Hz → alpha 0,98). */
export const HIGH_PASS_ALPHA = 0.98;

/** Parámetros estándar de Permutation Entropy (Bandt & Pompe). */
export const PERM_EN_ORDER = 3;
export const PERM_EN_DELAY = 1;
export const PERM_EN_SMOOTH = 5;

/**
 * RMS en mg por debajo del cual se considera reposo / ruido de sensor.
 * Umbral general para smartphones (no calibrado por dispositivo).
 * Tu dispositivo midió ~1.7 mg en mesa; 5 mg deja margen para otros modelos.
 */
export const BASELINE_RMS_MG = 5;

export const RMS_THRESHOLDS_MG = {
  baseline: BASELINE_RMS_MG,
  stable: 15,
  moderate: 40,
};

/**
 * CV sobre magnitud dinámica filtrada (%).
 * Solo interpretable cuando RMS > baseline.
 */
export const CV_THRESHOLDS = {
  low: 25,
  medium: 45,
};

/**
 * Entropía normalizada (0–1). Valores altos = patrón más irregular/complejo.
 * En baseline refleja ruido del sensor, no estabilidad postural.
 */
export const PERM_EN_THRESHOLDS = {
  low: 0.85,
  medium: 0.95,
};

export const ANALYSIS_VERSION = "2.1";
