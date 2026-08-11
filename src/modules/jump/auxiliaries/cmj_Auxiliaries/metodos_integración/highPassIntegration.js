export function highPassIntegration(accY, accT, alpha = 0.98) {
  const velocity = [0];
  const position = [0];
  let filteredAcc = accY[0]; // No restar 1g si ya está en m/s²
  let biasEstimate = 0;

  for (let i = 1; i < accY.length; i++) {
    const dt = accT[i] - accT[i - 1];
    const rawAcc = accY[i];

    // Filtro paso alto corregido (resta el bias estimado)
    biasEstimate = alpha * biasEstimate + (1 - alpha) * rawAcc;
    filteredAcc = rawAcc - biasEstimate;

    // Integración de velocidad (trapecio)
    const avgAcc = (filteredAcc + (accY[i - 1] - biasEstimate)) / 2;
    velocity[i] = velocity[i - 1] + avgAcc * dt;

    // Integración de posición (trapecio)
    const avgVel = (velocity[i] + velocity[i - 1]) / 2;
    position[i] = position[i - 1] + avgVel * dt;
  }

  return { velocity, position };
}
