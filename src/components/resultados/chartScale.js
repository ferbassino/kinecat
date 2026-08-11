/**
 * Escala Y ajustada al rango de datos (no fuerza origen en 0).
 */
export function computePaddedYDomain(values, paddingRatio = 0.15) {
  if (!values?.length) return [0, 1];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const padding =
    range > 0
      ? range * paddingRatio
      : Math.max(Math.abs(min), Math.abs(max), 0.01) * paddingRatio;

  return [min - padding, max + padding];
}

export function createYScale(yDomain, chartTop, chartHeight) {
  const [yMin, yMax] = yDomain;
  const span = yMax - yMin || 1;

  return (value) =>
    chartTop + chartHeight - ((value - yMin) / span) * chartHeight;
}

export function buildYAxisTicks(yDomain, steps = 5) {
  const [yMin, yMax] = yDomain;
  const stepValue = (yMax - yMin) / steps;

  return Array.from({ length: steps + 1 }, (_, index) => yMin + index * stepValue);
}

export { calculateTrendPercentage } from "../../auxiliaries/trendAnalysis";