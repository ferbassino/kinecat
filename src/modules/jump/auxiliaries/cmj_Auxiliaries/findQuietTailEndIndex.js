/**
 * Detecta el fin útil del salto tras el aterrizaje: cuando la señal
 * vuelve a quiet standing (ventana con std/media cercanas al baseline).
 * `signal` debe estar en residual (p.ej. (acc - modo) * 9.81).
 */
export function findQuietTailEndIndex(
  signal = [],
  {
    index1 = 0,
    index4 = -1,
    fallbackEnd = -1,
    windowSize = 25,
    holdWindows = 2,
    minSamplesAfterLanding = 30,
    peakSearch = 80,
    afterPeakSkip = 15,
    stdFactor = 1.8,
    minStd = 0.2,
    meanThreshold = 0.5,
  } = {},
) {
  const n = Array.isArray(signal) ? signal.length : 0;
  if (!n) return 0;

  const safeFallback =
    Number.isFinite(fallbackEnd) && fallbackEnd > 0 && fallbackEnd < n
      ? fallbackEnd
      : n - 1;

  if (!Number.isFinite(index4) || index4 < 0 || index4 >= n - windowSize) {
    return safeFallback;
  }

  const quietTo = Math.max(
    1,
    Math.min(index1 > 0 ? index1 : Math.floor(n * 0.1), n),
  );
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let i = 0; i < quietTo; i += 1) {
    const v = Number(signal[i]);
    if (!Number.isFinite(v)) continue;
    sum += v;
    sumSq += v * v;
    count += 1;
  }
  const mu0 = count ? sum / count : 0;
  const var0 = count > 1 ? Math.max(0, sumSq / count - mu0 * mu0) : 0;
  const sigma0 = Math.sqrt(var0);
  const stdLimit = Math.max(minStd, stdFactor * sigma0);

  const peakTo = Math.min(n - 1, index4 + peakSearch);
  let peakIdx = index4;
  let peakMag = -Infinity;
  for (let i = index4; i <= peakTo; i += 1) {
    const mag = Math.abs(Number(signal[i]) - mu0);
    if (Number.isFinite(mag) && mag > peakMag) {
      peakMag = mag;
      peakIdx = i;
    }
  }

  const start = Math.min(
    n - windowSize,
    Math.max(index4 + minSamplesAfterLanding, peakIdx + afterPeakSkip),
  );

  let consecutive = 0;
  for (let i = start; i < n; i += 1) {
    const from = i - windowSize + 1;
    if (from < 0) continue;

    let wSum = 0;
    let wSumSq = 0;
    let wCount = 0;
    for (let j = from; j <= i; j += 1) {
      const v = Number(signal[j]);
      if (!Number.isFinite(v)) continue;
      wSum += v;
      wSumSq += v * v;
      wCount += 1;
    }
    if (wCount < 5) {
      consecutive = 0;
      continue;
    }

    const mean = wSum / wCount;
    const std = Math.sqrt(Math.max(0, wSumSq / wCount - mean * mean));
    const quiet =
      std <= stdLimit && Math.abs(mean - mu0) <= meanThreshold;

    if (quiet) {
      consecutive += 1;
      if (consecutive >= holdWindows) {
        return Math.min(n - 1, i + Math.floor(windowSize / 2));
      }
    } else {
      consecutive = 0;
    }
  }

  return safeFallback;
}

export function sliceJumpChartSeries(
  accelerationData = [],
  timeData = [],
  startIndex = 0,
  endIndex = -1,
) {
  const n = Array.isArray(accelerationData) ? accelerationData.length : 0;
  if (!n) {
    return { accelerationData: [], timeData: [] };
  }

  const start = Math.max(0, Math.min(Number(startIndex) || 0, n - 1));
  const rawEnd =
    Number.isFinite(endIndex) && endIndex >= 0 ? endIndex : n - 1;
  const endExclusive = Math.min(n, Math.max(start + 1, rawEnd + 1));

  return {
    accelerationData: accelerationData.slice(start, endExclusive),
    timeData:
      Array.isArray(timeData) && timeData.length === n
        ? timeData.slice(start, endExclusive)
        : timeData,
  };
}
