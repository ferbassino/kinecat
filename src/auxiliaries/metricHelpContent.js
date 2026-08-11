import {
  BASELINE_RMS_MG,
  CV_THRESHOLDS,
  PERM_EN_THRESHOLDS,
  RMS_THRESHOLDS_MG,
} from "./stabilityConstants";

export const METRIC_HELP = {
  rms: {
    title: "RMS dinámico",
    what:
      "Mide cuánto tiembla el dispositivo después de quitar la gravedad. Resume la oscilación típica durante toda la prueba.",
    unit: "mg (miligramos de g). 1000 mg = 1 g de aceleración.",
    expectBaseline: `En mesa quieta: menos de ${BASELINE_RMS_MG} mg (ruido del sensor).`,
    expectExercise: [
      `< ${RMS_THRESHOLDS_MG.stable} mg → muy estable`,
      `${RMS_THRESHOLDS_MG.stable}–${RMS_THRESHOLDS_MG.moderate} mg → moderada`,
      `> ${RMS_THRESHOLDS_MG.moderate} mg → inestable`,
    ],
    good: "Valor bajo y estable entre sesiones.",
    bad: "Valor alto o que sube mucho hacia el final (fatiga o pérdida de control).",
    note: "Es la métrica principal. Compará siempre con la misma posición del teléfono.",
  },
  cv: {
    title: "Variabilidad (CV)",
    what:
      "Porcentaje de dispersión de la señal respecto a su promedio. Indica qué tan uniforme es el balanceo.",
    unit: "% (porcentaje).",
    expectBaseline:
      "En reposo suele ser alto (~40%) pero no se interpreta: la media es muy chica.",
    expectExercise: [
      `< ${CV_THRESHOLDS.low}% → variabilidad baja (más uniforme)`,
      `${CV_THRESHOLDS.low}–${CV_THRESHOLDS.medium}% → moderada`,
      `> ${CV_THRESHOLDS.medium}% → alta variabilidad`,
    ],
    good: "CV bajo o que se mantiene estable durante los 30 s.",
    bad: "CV alto o que sube al final (más correcciones, posible fatiga).",
    note: "Solo tiene sentido clínico cuando RMS > baseline (modo ejercicio).",
  },
  permEn: {
    title: "Entropía por permutación (PermEn)",
    what:
      "Mide qué tan predecible o caótico es el patrón de oscilación. Valores de 0 (regular) a 1 (muy irregular).",
    unit: "Adimensional (0 a 1).",
    expectBaseline:
      "En mesa: ~0.95–0.98 por ruido del sensor. Badge REFERENCIA.",
    expectExercise: [
      `< ${PERM_EN_THRESHOLDS.low} → patrón regular`,
      `${PERM_EN_THRESHOLDS.low}–${PERM_EN_THRESHOLDS.medium} → moderado`,
      `> ${PERM_EN_THRESHOLDS.medium} → complejo / caótico`,
    ],
    good: "Valor moderado y estable (control sin rigidez extrema).",
    bad: "Muy alto y subiendo = movimiento cada vez más desordenado.",
    note: "Complementa al RMS: dos personas pueden tener RMS similar con distinto PermEn.",
  },
  regularity: {
    title: "Regularidad",
    what: "Es 1 − PermEn. Cuanto más alto, más repetitivo y predecible es el movimiento.",
    unit: "Adimensional (0 a 1).",
    expectBaseline: "En reposo suele ser muy bajo (~0.03). Badge REFERENCIA.",
    expectExercise: [
      "> 0.15 → regularidad alta",
      "0.05–0.15 → media",
      "< 0.05 → baja (muy irregular)",
    ],
    good: "Regularidad relativamente alta en ejercicio controlado.",
    bad: "Muy baja = oscilaciones impredecibles.",
    note: "Es la lectura inversa de PermEn; usá la que te resulte más intuitiva.",
  },
  cvTrend: {
    title: "Tendencia CV",
    what:
      "Indica si la variabilidad sube o baja a lo largo de los 30 segundos (regresión lineal sobre ventanas).",
    unit: "% de cambio relativo.",
    expectBaseline: "No se muestra en modo baseline.",
    expectExercise: [
      "Estable o ↓ → te adaptás / mantenés control",
      "↑ → posible fatiga o más correcciones al final",
    ],
    good: "Tendencia estable o a la baja.",
    bad: "Aumento marcado hacia el final de la prueba.",
    note: "Mirá también el gráfico de CV para ver en qué segundo cambia.",
  },
  permTrend: {
    title: "Tendencia PermEn",
    what:
      "Indica si la complejidad del movimiento aumenta o disminuye con el tiempo.",
    unit: "% de cambio relativo.",
    expectBaseline: "No se muestra en modo baseline.",
    expectExercise: [
      "Estable o ↓ → control sostenido",
      "↑ → movimiento más caótico al final",
    ],
    good: "Tendencia estable o a la baja.",
    bad: "Subida sostenida = pérdida de patrón controlado.",
    note: "Útil para detectar fatiga cuando el RMS también sube.",
  },
};

export const ANGLE_HELP = {
  title: "¿Influye el ángulo del cuerpo?",
  body: [
    "El filtro elimina la gravedad estática, así que el ángulo fijo de la plancha influye poco en RMS si mantenés la postura.",
    "Lo que sí cambia las métricas: balanceo, caída de cadera, respiración brusca y movimientos de corrección.",
    "Para comparar sesiones: misma posición del teléfono (pecho/espalda), misma orientación y mismo ejercicio.",
    "Pitch y roll se guardan como referencia pero no entran en el score de estabilidad.",
  ],
};
