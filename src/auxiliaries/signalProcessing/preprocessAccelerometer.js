import { highPassFilter } from "./highPassFilter";
import { HIGH_PASS_ALPHA } from "../stabilityConstants";

/**
 * Elimina la componente gravitacional por eje y calcula magnitud dinámica.
 */
export function preprocessAccelerometer(rawData, alpha = HIGH_PASS_ALPHA) {
  if (!rawData?.length) return [];

  const xRaw = rawData.map((d) => Number(d.x) || 0);
  const yRaw = rawData.map((d) => Number(d.y) || 0);
  const zRaw = rawData.map((d) => Number(d.z) || 0);

  const x = highPassFilter(xRaw, alpha);
  const y = highPassFilter(yRaw, alpha);
  const z = highPassFilter(zRaw, alpha);

  return rawData.map((sample, index) => {
    const dynamicMag = Math.sqrt(
      x[index] ** 2 + y[index] ** 2 + z[index] ** 2,
    );

    return {
      ...sample,
      x: x[index],
      y: y[index],
      z: z[index],
      dynamicMag: Number(dynamicMag.toFixed(6)),
    };
  });
}
