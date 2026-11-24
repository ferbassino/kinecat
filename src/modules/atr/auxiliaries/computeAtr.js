/** Rango típico de escoliómetros comerciales (ATR). */
export const ATR_MAX_DEG = 50;

/** Umbrales de cribado orientativos (no diagnóstico). */
export const ATR_THRESHOLDS = {
  mild: 5,
  refer: 7,
};

/**
 * Convención de colocación (obligatoria):
 * - Móvil DE COSTADO (paisaje), apoyado sobre su BORDE LARGO inferior
 *   (el borde de abajo cuando el teléfono está en vertical).
 * - Pantalla mirando al evaluador.
 * - Extremo del puerto USB / carga hacia los PIES del paciente.
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
    hint: "Orientación OK · USB hacia los pies · pantalla al evaluador",
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
