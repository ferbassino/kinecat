export function highPassFilter(accY, alpha = 0.98) {
  const filteredAcc = [];
  let biasEstimate = accY[0]; // Inicializa con el primer valor

  for (let i = 0; i < accY.length; i++) {
    const rawAcc = accY[i];
    biasEstimate = alpha * biasEstimate + (1 - alpha) * rawAcc;
    filteredAcc[i] = rawAcc - biasEstimate;
  }

  return filteredAcc;
}
