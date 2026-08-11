/**
 * Filtro pasa-alto de primer orden (eliminación de gravedad / componente DC).
 * Mismo enfoque que jump-pub para aislar la aceleración dinámica.
 */
export function highPassFilter(values, alpha = 0.98) {
  if (!values?.length) return [];

  const filtered = [];
  let biasEstimate = values[0];

  for (let i = 0; i < values.length; i++) {
    const raw = values[i];
    biasEstimate = alpha * biasEstimate + (1 - alpha) * raw;
    filtered[i] = raw - biasEstimate;
  }

  return filtered;
}
