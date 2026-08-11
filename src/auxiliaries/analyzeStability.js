import { preprocessAccelerometer } from "./signalProcessing/preprocessAccelerometer";
import { coeficienteVariacion } from "./coeficienteVariacion";
import { entropiaPermutacion } from "./entropiaPermutacion";
import { analizarPorVentanas } from "./analizarPorVentanas";
import {
  ANALYSIS_VERSION,
  BASELINE_RMS_MG,
  PERM_EN_DELAY,
  PERM_EN_ORDER,
  PERM_EN_SMOOTH,
  WARMUP_SAMPLES,
} from "./stabilityConstants";
import {
  interpretStabilityMetrics,
  rmsToMg,
} from "./stabilityInterpretation";
import { calculateTrendPercentage } from "./trendAnalysis";

function computeRms(values) {
  if (!values.length) return 0;
  const sumSquares = values.reduce((acc, value) => acc + value ** 2, 0);
  return Math.sqrt(sumSquares / values.length);
}

function trimWarmupSamples(rawData) {
  if (rawData.length <= WARMUP_SAMPLES) return rawData;
  return rawData.slice(WARMUP_SAMPLES);
}

function computeStats(values) {
  if (!values.length) {
    return { mean: 0, std: 0, min: 0, max: 0 };
  }

  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length,
  );

  return {
    mean,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function logStabilityReport(rawData, trimmed, filtered, analysis) {
  const rawMag = rawData.map((s) =>
    Math.sqrt(s.x ** 2 + s.y ** 2 + s.z ** 2),
  );
  const dynamicSeries = filtered.map((s) => s.dynamicMag);

  const rawStats = computeStats(rawMag);
  const dynamicStats = computeStats(dynamicSeries);

  const ventanaCv = analysis.ventanas.map((v) => v.cv);
  const ventanaPerm = analysis.ventanas.map((v) => v.permEn);

  console.log("\n========== STABILITY ANALYSIS REPORT ==========");
  console.log(`Versión análisis: ${analysis.analysisVersion}`);
  console.log("--- Muestras ---");
  console.log(`  Raw total:     ${rawData.length}`);
  console.log(`  Tras warmup:   ${trimmed.length} (descartadas ${WARMUP_SAMPLES})`);
  console.log(`  Ventanas:      ${analysis.ventanas.length}`);
  console.log("--- Señal CRUDA (con gravedad, en g) ---");
  console.log(
    `  Magnitud media: ${rawStats.mean.toFixed(4)} g  (esperado ~1.0 en mesa)`,
  );
  console.log(
    `  Desv. std:      ${rawStats.std.toFixed(5)} g  (esperado <0.02 en mesa)`,
  );
  console.log(
    `  Rango:          ${rawStats.min.toFixed(4)} – ${rawStats.max.toFixed(4)} g`,
  );
  console.log("--- Señal FILTRADA (sin gravedad, magnitud dinámica) ---");
  console.log(
    `  Media:          ${dynamicStats.mean.toFixed(6)} g  (${(dynamicStats.mean * 1000).toFixed(2)} mg)`,
  );
  console.log(
    `  Desv. std:      ${dynamicStats.std.toFixed(6)} g  (${(dynamicStats.std * 1000).toFixed(2)} mg)`,
  );
  console.log(
    `  RMS:            ${analysis.rms.toFixed(6)} g  (${(analysis.rms * 1000).toFixed(2)} mg)`,
  );
  console.log(
    `  Rango:          ${dynamicStats.min.toFixed(6)} – ${dynamicStats.max.toFixed(6)} g`,
  );
  console.log("--- Métricas globales ---");
  console.log(
    `  CV:             ${analysis.cv.toFixed(2)}%  (menor = más estable)`,
  );
  console.log(
    `  PermEn:         ${analysis.permutationEn.toFixed(4)}  (0=regular, 1=caótico)`,
  );
  console.log(`  Regularidad:    ${analysis.regularity.toFixed(4)}  (1 − PermEn)`);
  console.log("--- Por ventana (post warmup) ---");
  console.log(
    `  CV  → media: ${(ventanaCv.reduce((a, b) => a + b, 0) / ventanaCv.length || 0).toFixed(2)}% | min: ${Math.min(...ventanaCv).toFixed(2)}% | max: ${Math.max(...ventanaCv).toFixed(2)}%`,
  );
  console.log(
    `  PermEn → media: ${(ventanaPerm.reduce((a, b) => a + b, 0) / ventanaPerm.length || 0).toFixed(4)} | min: ${Math.min(...ventanaPerm).toFixed(4)} | max: ${Math.max(...ventanaPerm).toFixed(4)}`,
  );
  console.log("--- Interpretación ---");
  console.log(
    `  Modo:           ${analysis.interpretation.modeLabel}`,
  );
  console.log(
    `  Baseline:       ${analysis.isBaseline ? "SÍ" : "NO"} (umbral RMS < ${BASELINE_RMS_MG} mg, universal)`,
  );
  console.log(
    `  RMS nivel:      ${analysis.interpretation.rms.label}`,
  );
  console.log("--- Referencia mesa quieta ---");
  console.log(
    `  Raw ~1.0 g | std raw <0.02 g | RMS filtrado <${BASELINE_RMS_MG} mg = baseline`,
  );
  console.log("===============================================\n");
}

/**
 * Pipeline completo de análisis de estabilidad lumbo-pélvica.
 */
export function analyzeStability(rawData, options = {}) {
  const { logResults = true } = options;

  if (!rawData?.length) {
    throw new Error("No hay datos de acelerómetro para analizar");
  }

  const trimmed = trimWarmupSamples(rawData);
  const filtered = preprocessAccelerometer(trimmed);
  const dynamicSeries = filtered.map((sample) => sample.dynamicMag);

  const cv = coeficienteVariacion(filtered, "dynamicMag");
  const permutationEn = entropiaPermutacion(dynamicSeries, {
    m: PERM_EN_ORDER,
    delay: PERM_EN_DELAY,
    ventana: PERM_EN_SMOOTH,
  });
  const ventanas = analizarPorVentanas(filtered);
  const rms = computeRms(dynamicSeries);
  const regularity = Math.max(0, Math.min(1, 1 - permutationEn));
  const cvTrend = calculateTrendPercentage(ventanas.map((v) => v.cv));
  const permEnTrend = calculateTrendPercentage(ventanas.map((v) => v.permEn));
  const interpretation = interpretStabilityMetrics({
    rms,
    cv,
    permutationEn,
    regularity,
  });

  const result = {
    cv,
    permutationEn,
    regularity,
    rms,
    rmsMg: rmsToMg(rms),
    isBaseline: interpretation.isBaseline,
    interpretation,
    ventanas,
    cvTrend,
    permEnTrend,
    filteredData: filtered,
    sampleCount: filtered.length,
    analysisVersion: ANALYSIS_VERSION,
  };

  if (logResults) {
    logStabilityReport(rawData, trimmed, filtered, result);
  }

  return result;
}
