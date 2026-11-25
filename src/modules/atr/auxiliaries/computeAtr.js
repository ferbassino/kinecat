/** Rango típico de escoliómetros comerciales (ATR). */
export const ATR_MAX_DEG = 50;

/** Umbrales de cribado orientativos (no diagnóstico). */
export const ATR_THRESHOLDS = {
  mild: 5,
  refer: 7,
};

/**
 * Convención de colocación (obligatoria):
 * - Móvil DE COSTADO con el BORDE IZQUIERDO hacia abajo (apoyado en la espalda).
 * - Pantalla mirando al evaluador.
 * - Extremo CÁMARA = IZQ del paciente (ATR −).
 * - Extremo BASE / USB (enchufe) = DER del paciente (ATR +).
 *
 * Así el ATR mide la inclinación I/D del plano del aparato sobre la espalda
 * (no el “pitch” vertical del móvil en vertical).
 *
 * Signo:
 * - ATR > 0 → joroba / inclinación hacia la DERECHA del paciente
 * - ATR < 0 → joroba / inclinación hacia la IZQUIERDA del paciente
 */
export function computeAtrDegrees({ x, y, z }) {
  const ax = Number(x);
  const ay = Number(y);
  const az = Number(z);
  if (![ax, ay, az].every(Number.isFinite)) return 0;

  // Con el teléfono de costado (borde largo apoyado), la inclinación I/D
  // se obtiene con Y y X (sin Z).
  // atan2(y, x) ≈ 0 cuando el borde está nivelado según la convención.
  // Signo invertido vs atan2 crudo: calibrado en dispositivo para que
  // giba IZQ → ATR − y giba DER → ATR +.
  const rad = Math.atan2(ay, ax);
  let deg = -((rad * 180) / Math.PI);

  // Normalizar a [-180, 180] y acercar a rango de escoliómetro
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;

  if (deg > ATR_MAX_DEG) deg = ATR_MAX_DEG;
  if (deg < -ATR_MAX_DEG) deg = -ATR_MAX_DEG;
  return deg;
}

/**
 * Detecta si el móvil está mal orientado (vertical / muy plano).
 * "side" = de costado (correcto para esta convención).
 */
export function detectPhonePose({ x, y, z }) {
  const ax = Math.abs(Number(x) || 0);
  const ay = Math.abs(Number(y) || 0);
  const az = Math.abs(Number(z) || 0);
  const max = Math.max(ax, ay, az) || 1;

  // En vertical (retrato), Y suele dominar con gravedad.
  if (ay / max > 0.72 && ay > 0.55) {
    return {
      pose: "portrait",
      ok: false,
      hint: "Poné el móvil DE COSTADO (borde largo apoyado), no en vertical.",
    };
  }

  // Muy plano pantalla arriba: Z domina — también válido si está nivelado
  // sobre la espalda, pero pedimos costado para esta convención.
  if (az / max > 0.85) {
    return {
      pose: "flat",
      ok: false,
      hint: "Apoyá el BORDE LARGO del teléfono sobre la espalda (de costado).",
    };
  }

  return {
    pose: "side",
    ok: true,
    hint: "Orientación OK · cámara=IZQ · USB=DER · borde izquierdo abajo",
  };
}

export function atrSideLabel(deg) {
  if (!Number.isFinite(deg) || Math.abs(deg) < 0.5) {
    return "neutro (nivelado)";
  }
  return deg > 0
    ? "derecha del paciente"
    : "izquierda del paciente";
}

export function atrZone(absDeg) {
  if (absDeg < ATR_THRESHOLDS.mild) return "ok";
  if (absDeg < ATR_THRESHOLDS.refer) return "watch";
  return "refer";
}

/**
 * Suavizado leve EMA para ATR en vivo.
 * alpha alto (≈0.45) sigue el pico sin “comer” ángulos.
 */
export function createAtrEma(alpha = 0.45) {
  let prev = null;
  return (value) => {
    const v = Number(value);
    if (!Number.isFinite(v)) return prev ?? 0;
    if (prev == null) {
      prev = v;
      return v;
    }
    prev = alpha * v + (1 - alpha) * prev;
    return prev;
  };
}

/**
 * Media móvil centrada muy leve (default 3) sobre la serie ATR.
 * Conserva el máximo local para no achicar el pico |ATR|.
 */
export function smoothAtrSeries(points = [], windowSize = 3) {
  if (!Array.isArray(points) || points.length < 3) return points || [];
  const w = Math.max(3, windowSize | 0);
  const half = Math.floor(w / 2);
  return points.map((p, i) => {
    let sum = 0;
    let n = 0;
    let localMaxAbs = 0;
    let localMaxSigned = Number(p.atr) || 0;
    for (let j = i - half; j <= i + half; j += 1) {
      if (j < 0 || j >= points.length) continue;
      const atr = Number(points[j]?.atr);
      if (!Number.isFinite(atr)) continue;
      sum += atr;
      n += 1;
      if (Math.abs(atr) > localMaxAbs) {
        localMaxAbs = Math.abs(atr);
        localMaxSigned = atr;
      }
    }
    if (!n) return { ...p, atr: Number(p.atr) || 0 };
    const avg = sum / n;
    // Si el punto es un pico local, conservar el valor; si no, promedio leve.
    const isLocalPeak =
      Math.abs(Number(p.atr) || 0) >= localMaxAbs - 0.05;
    const atr = isLocalPeak ? localMaxSigned : avg;
    return {
      ...p,
      atr: Math.round(atr * 10) / 10,
    };
  });
}
