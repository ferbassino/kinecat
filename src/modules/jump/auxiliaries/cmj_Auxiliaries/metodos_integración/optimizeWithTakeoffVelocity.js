import { highPassIntegration } from "./highPassIntegration";

export function optimizeWithTakeoffVelocity(
  accY,
  accT,
  knownTakeoffVelocity,
  alphaRange = [0.97, 0.99],
  steps = 50
) {
  let bestAlpha = 0.98;
  let bestVelocity = [];
  let minTotalError = Infinity;

  // Comparar múltiples puntos de la curva, no solo el final
  const samplePoints = [0.25, 0.5, 0.75, 1.0]; // Porcentajes del recorrido
  const sampleIndices = samplePoints.map((p) =>
    Math.floor(p * (accT.length - 1))
  );

  for (let i = 0; i <= steps; i++) {
    const testAlpha =
      alphaRange[0] + (alphaRange[1] - alphaRange[0]) * (i / steps);
    const { velocity } = highPassIntegration(accY, accT, testAlpha);

    // Escalamos la curva al knownTakeoffVelocity
    const scale = knownTakeoffVelocity / velocity[velocity.length - 1];
    const scaledVelocity = velocity.map((v) => v * scale);

    // Calcular error cuadrático medio sobre los puntos muestreados
    const averageVelocity =
      scaledVelocity.reduce((sum, v) => sum + Math.abs(v), 0) /
      scaledVelocity.length;
    let totalError = 0;
    for (let idx of sampleIndices) {
      const expected = (idx / (accT.length - 1)) * knownTakeoffVelocity; // Asumimos crecimiento lineal ideal
      totalError += Math.pow(scaledVelocity[idx] - expected, 2);
    }

    if (totalError < minTotalError) {
      minTotalError = totalError;
      bestAlpha = testAlpha;
      bestVelocity = scaledVelocity;
    }
  }

  // Recalcular posición con la velocidad ajustada
  const adjustedPosition = [0];
  for (let i = 1; i < accT.length; i++) {
    const dt = accT[i] - accT[i - 1];
    const avgVel = (bestVelocity[i] + bestVelocity[i - 1]) / 2;
    adjustedPosition[i] = adjustedPosition[i - 1] + avgVel * dt;
  }

  return {
    velocity: bestVelocity,
    position: adjustedPosition,
    optimalAlpha: bestAlpha,
    scaleFactor: knownTakeoffVelocity / bestVelocity[bestVelocity.length - 1],
  };
}
