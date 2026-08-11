import { coeficienteVariacion } from "./coeficienteVariacion";
import { entropiaPermutacion } from "./entropiaPermutacion";
import {
  PERM_EN_DELAY,
  PERM_EN_ORDER,
  PERM_EN_SMOOTH,
  SECONDS_PER_WINDOW,
  WARMUP_WINDOWS,
  WINDOW_COUNT,
} from "./stabilityConstants";

const permEnOptions = {
  m: PERM_EN_ORDER,
  delay: PERM_EN_DELAY,
  ventana: PERM_EN_SMOOTH,
};

export function analizarPorVentanas(
  data,
  ventanas = WINDOW_COUNT,
  skipWarmupWindows = WARMUP_WINDOWS,
) {
  if (!data?.length) return [];

  const longitudVentana = Math.floor(data.length / ventanas);
  if (longitudVentana < PERM_EN_ORDER * PERM_EN_DELAY) return [];

  const resultados = [];

  for (let i = 0; i < ventanas; i++) {
    const inicio = i * longitudVentana;
    const fin = (i + 1) * longitudVentana;
    const ventana = data.slice(inicio, fin);
    const dynamicSeries = ventana.map((sample) =>
      typeof sample === "number" ? sample : sample.dynamicMag,
    );

    resultados.push({
      ventana: i + 1,
      timeStartSec: i * SECONDS_PER_WINDOW,
      cv: coeficienteVariacion(ventana, "dynamicMag"),
      permEn: entropiaPermutacion(dynamicSeries, permEnOptions),
    });
  }

  return resultados.slice(skipWarmupWindows);
}
