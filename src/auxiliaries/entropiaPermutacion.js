function mediaMovil(array, ventana = 5) {
  return array.map((_, i, arr) => {
    const desde = Math.max(0, i - Math.floor(ventana / 2));
    const hasta = Math.min(arr.length, i + Math.ceil(ventana / 2));
    const ventanaArray = arr.slice(desde, hasta);
    const suma = ventanaArray.reduce((a, b) => a + b, 0);
    return suma / ventanaArray.length;
  });
}

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function toNumericSeries(data) {
  if (!data?.length) return [];

  if (typeof data[0] === "number") {
    return data.filter((value) => !Number.isNaN(value));
  }

  return data
    .map((sample) => {
      if (typeof sample === "number") return sample;

      if (sample?.dynamicMag != null) return Number(sample.dynamicMag);

      const x = Number(sample.x) || 0;
      const y = Number(sample.y) || 0;
      const z = Number(sample.z) || 0;
      return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    })
    .filter((value) => !Number.isNaN(value));
}

/**
 * Entropía por permutación normalizada (0 = regular, 1 = máxima complejidad).
 */
export function entropiaPermutacion(data, options = {}) {
  const {
    m = 3,
    delay = 1,
    ventana = 5,
  } = typeof options === "number"
    ? { m: options, delay: arguments[2] ?? 1, ventana: arguments[3] ?? 5 }
    : options;

  const valoresCrudos = toNumericSeries(data);
  const valores = mediaMovil(valoresCrudos, ventana);

  const N = valores.length;
  if (N < m * delay) return 0;

  const patrones = {};

  for (let i = 0; i < N - (m - 1) * delay; i++) {
    const subserie = [];
    for (let j = 0; j < m; j++) {
      subserie.push(valores[i + j * delay]);
    }

    const orden = subserie
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((entry) => entry.idx)
      .join("");

    patrones[orden] = (patrones[orden] || 0) + 1;
  }

  const total = Object.values(patrones).reduce((acc, count) => acc + count, 0);
  if (total === 0) return 0;

  const probs = Object.values(patrones).map((count) => count / total);
  const entropia = -probs.reduce(
    (sum, probability) =>
      probability > 0 ? sum + probability * Math.log(probability) : sum,
    0,
  );
  const maxEntropia = Math.log(factorial(m));

  if (maxEntropia === 0) return 0;

  return entropia / maxEntropia;
}
