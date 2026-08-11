import {
  BASELINE_RMS_MG,
  CV_THRESHOLDS,
  PERM_EN_THRESHOLDS,
  RMS_THRESHOLDS_MG,
} from "./stabilityConstants";

export function rmsToMg(rms) {
  return (rms ?? 0) * 1000;
}

export function isBaselineRms(rms) {
  return rmsToMg(rms) < BASELINE_RMS_MG;
}

export function getRmsLevel(rms) {
  const mg = rmsToMg(rms);

  if (mg < RMS_THRESHOLDS_MG.baseline) {
    return {
      label: "ESTABLE (baseline)",
      hint: "Ruido del sensor · sin oscilación postural",
    };
  }
  if (mg < RMS_THRESHOLDS_MG.stable) {
    return { label: "ESTABLE", hint: "Oscilación baja" };
  }
  if (mg < RMS_THRESHOLDS_MG.moderate) {
    return { label: "MODERADA", hint: "Oscilación perceptible" };
  }
  return { label: "INESTABLE", hint: "Oscilación elevada" };
}

export function getCvLevel(cv, isBaseline) {
  if (isBaseline) {
    return {
      label: "REFERENCIA",
      hint: "CV no interpretable en reposo (media muy baja)",
    };
  }
  if (cv < CV_THRESHOLDS.low) return { label: "BAJO", hint: "Variabilidad baja" };
  if (cv < CV_THRESHOLDS.medium) {
    return { label: "MODERADO", hint: "Variabilidad media" };
  }
  return { label: "ALTO", hint: "Variabilidad alta" };
}

export function getPermEnLevel(permutationEn, isBaseline) {
  if (isBaseline) {
    return {
      label: "REFERENCIA",
      hint: "Ruido del sensor · comparar en ejercicio",
    };
  }
  if (permutationEn < PERM_EN_THRESHOLDS.low) {
    return { label: "REGULAR", hint: "Patrón predecible" };
  }
  if (permutationEn < PERM_EN_THRESHOLDS.medium) {
    return { label: "MODERADA", hint: "Complejidad media" };
  }
  return { label: "COMPLEJA", hint: "Patrón irregular" };
}

export function getRegularityLevel(regularity, isBaseline) {
  if (isBaseline) {
    return {
      label: "REFERENCIA",
      hint: "Derivada de PermEn · comparar en ejercicio",
    };
  }
  if (regularity > 1 - PERM_EN_THRESHOLDS.low) {
    return { label: "ALTA", hint: "Movimiento regular" };
  }
  if (regularity > 1 - PERM_EN_THRESHOLDS.medium) {
    return { label: "MEDIA", hint: "Regularidad media" };
  }
  return { label: "BAJA", hint: "Movimiento irregular" };
}

export function interpretStabilityMetrics({ rms, cv, permutationEn, regularity }) {
  const isBaseline = isBaselineRms(rms);
  const rmsMg = rmsToMg(rms);
  const regularityValue =
    regularity != null ? regularity : 1 - permutationEn;

  return {
    isBaseline,
    rmsMg,
    rms: getRmsLevel(rms),
    cv: getCvLevel(cv, isBaseline),
    permEn: getPermEnLevel(permutationEn, isBaseline),
    regularity: getRegularityLevel(regularityValue, isBaseline),
    primaryMetric: isBaseline ? "rms" : "rms",
    modeLabel: isBaseline ? "MODO BASELINE" : "MODO EJERCICIO",
  };
}
