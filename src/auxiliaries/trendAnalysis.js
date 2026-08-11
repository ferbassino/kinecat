/** Porcentaje de cambio de la regresión lineal sobre ventanas. */
export function calculateTrendPercentage(values) {
  const n = values?.length ?? 0;
  if (n < 2) return 0;

  const xValues = Array.from({ length: n }, (_, i) => i + 1);
  const xSum = xValues.reduce((a, b) => a + b, 0);
  const ySum = values.reduce((a, b) => a + b, 0);
  const xySum = xValues.reduce((acc, x, i) => acc + x * values[i], 0);
  const xxSum = xValues.reduce((acc, x) => acc + x * x, 0);
  const denominator = n * xxSum - xSum * xSum;

  if (denominator === 0) return 0;

  const slope = (n * xySum - xSum * ySum) / denominator;
  const intercept = (ySum - slope * xSum) / n;
  const trendValues = xValues.map((x) => slope * x + intercept);

  const initial = trendValues[0];
  const final = trendValues[trendValues.length - 1];

  if (initial === 0) return 0;

  return ((final - initial) / initial) * 100;
}
