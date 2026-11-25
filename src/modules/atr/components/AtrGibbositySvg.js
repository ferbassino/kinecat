import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Polygon, Polyline, Circle, Text as SvgText, Rect } from "react-native-svg";
import { ATR_THRESHOLDS, smoothAtrSeries } from "../auxiliaries/computeAtr";

const MAX_SLICES = 40;
const LAT_SEGS = 10;

function buildSlices(points, maxSlices = MAX_SLICES) {
  const smoothed = smoothAtrSeries(points, 3);
  if (!Array.isArray(smoothed) || smoothed.length < 2) return [];
  const n = Math.min(maxSlices, smoothed.length);
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0 : i / (n - 1);
    const idx = Math.min(
      smoothed.length - 1,
      Math.round(t * (smoothed.length - 1)),
    );
    out.push({ s: t, atr: Number(smoothed[idx]?.atr) || 0 });
  }
  return out;
}

function heightAt(lateral, atrDeg) {
  const base = 0.12 * (1 - lateral * lateral);
  const rad = (atrDeg * Math.PI) / 180;
  return base + Math.tan(rad) * lateral * 0.95;
}

function zoneFill(absDeg, alpha = 1) {
  if (absDeg < ATR_THRESHOLDS.mild) return `rgba(74, 222, 128, ${alpha})`;
  if (absDeg < ATR_THRESHOLDS.refer) return `rgba(251, 191, 36, ${alpha})`;
  return `rgba(248, 113, 113, ${alpha})`;
}

/**
 * Giba 3D esquemática (SVG) — vista posterior-superior.
 * data: [{ atr, sec? }, ...] lumbar → dorsal
 */
const AtrGibbositySvg = ({ data = [], peakAbs = 0, style }) => {
  const { width: winW } = useWindowDimensions();
  const cssW = Math.max(280, Math.min(winW - 32, 520));
  const cssH = Math.max(220, Math.round(cssW * 0.72));

  const slices = useMemo(() => buildSlices(data), [data]);

  const { quads, midLine, edgeIzq, edgeDer, ribLines, labels, peakTip } =
    useMemo(() => {
    const yaw = 0.42;
    const pitch = 0.62;
    const scale = Math.min(cssW, cssH) * 0.38;
    const cx = cssW * 0.52;
    const cy = cssH * 0.58;

    const project = (L, S, H) => {
      const x = L * 1.15;
      const y = (S - 0.35) * 2.05;
      const z = H * 1.35;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = x * cosY - y * sinY;
      const y1 = x * sinY + y * cosY;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y2 = y1 * cosP - z * sinP;
      const z2 = y1 * sinP + z * cosP;
      return {
        x: cx + x1 * scale,
        y: cy - z2 * scale * 0.92 - y2 * scale * 0.15,
      };
    };

    if (!slices.length) {
      return {
        quads: [],
        midLine: "",
        edgeIzq: "",
        edgeDer: "",
        ribLines: [],
        labels: {
          lumbar: project(0, 0.02, -0.02),
          dorsal: project(0, 0.98, -0.02),
          izq: project(-1.12, 0.5, 0.08),
          der: project(1.12, 0.5, 0.08),
        },
        peakTip: null,
      };
    }

    const ordered = [...slices].sort((a, b) => b.s - a.s);
    const latStep = 2 / LAT_SEGS;
    const nextQuads = [];
    for (let si = 0; si < ordered.length - 1; si += 1) {
      const a = ordered[si];
      const b = ordered[si + 1];
      for (let li = 0; li < LAT_SEGS; li += 1) {
        const L0 = -1 + li * latStep;
        const L1 = L0 + latStep;
        const p00 = project(L0, a.s, heightAt(L0, a.atr));
        const p10 = project(L1, a.s, heightAt(L1, a.atr));
        const p11 = project(L1, b.s, heightAt(L1, b.atr));
        const p01 = project(L0, b.s, heightAt(L0, b.atr));
        const midAtr = (Math.abs(a.atr) + Math.abs(b.atr)) / 2;
        const shade = 0.28 + 0.45 * (1 - Math.abs((L0 + L1) / 2));
        nextQuads.push({
          points: `${p00.x},${p00.y} ${p10.x},${p10.y} ${p11.x},${p11.y} ${p01.x},${p01.y}`,
          fill: zoneFill(midAtr, shade),
        });
      }
    }

    const mid = slices
      .map((sl) => {
        const p = project(0, sl.s, heightAt(0, sl.atr));
        return `${p.x},${p.y}`;
      })
      .join(" ");

    const edgeIzq = slices
      .map((sl) => {
        const p = project(-1, sl.s, heightAt(-1, sl.atr));
        return `${p.x},${p.y}`;
      })
      .join(" ");
    const edgeDer = slices
      .map((sl) => {
        const p = project(1, sl.s, heightAt(1, sl.atr));
        return `${p.x},${p.y}`;
      })
      .join(" ");

    const ribs = [];
    for (let i = 0; i < slices.length; i += 4) {
      const sl = slices[i];
      const pts = [];
      for (let li = 0; li <= LAT_SEGS; li += 1) {
        const L = -1 + (li / LAT_SEGS) * 2;
        const p = project(L, sl.s, heightAt(L, sl.atr));
        pts.push(`${p.x},${p.y}`);
      }
      ribs.push({
        points: pts.join(" "),
        stroke: zoneFill(Math.abs(sl.atr), 0.85),
      });
    }

    let peakSlice = slices[0];
    for (const sl of slices) {
      if (Math.abs(sl.atr) > Math.abs(peakSlice.atr)) peakSlice = sl;
    }
    let tip = null;
    if (peakSlice && Math.abs(peakSlice.atr) >= 0.5) {
      const side = peakSlice.atr >= 0 ? 0.78 : -0.78;
      const p = project(side, peakSlice.s, heightAt(side, peakSlice.atr) + 0.08);
      tip = {
        ...p,
        label: `Giba ${peakSlice.atr >= 0 ? "DER" : "IZQ"} ${Math.abs(peakSlice.atr).toFixed(1)}°`,
      };
    }

    return {
      quads: nextQuads,
      midLine: mid,
      edgeIzq,
      edgeDer,
      ribLines: ribs,
      labels: {
        lumbar: project(0, 0.02, -0.02),
        dorsal: project(0, 0.98, -0.02),
        izq: project(-1.12, 0.5, 0.08),
        der: project(1.12, 0.5, 0.08),
      },
      peakTip: tip,
    };
  }, [slices, cssW, cssH]);

  return (
    <View style={[styles.wrap, style, { width: cssW, height: cssH }]}>
      <Svg width={cssW} height={cssH}>
        <Rect x={0} y={0} width={cssW} height={cssH} fill="#0b1220" rx={16} />
        {quads.map((q, i) => (
          <Polygon
            key={`q-${i}`}
            points={q.points}
            fill={q.fill}
            stroke="rgba(15,23,42,0.18)"
            strokeWidth={0.6}
          />
        ))}
        {ribLines.map((r, i) => (
          <Polyline
            key={`r-${i}`}
            points={r.points}
            fill="none"
            stroke={r.stroke}
            strokeWidth={1.4}
          />
        ))}
        {midLine ? (
          <Polyline
            points={midLine}
            fill="none"
            stroke="rgba(226,232,240,0.75)"
            strokeWidth={2}
          />
        ) : null}
        {edgeIzq ? (
          <Polyline
            points={edgeIzq}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {edgeDer ? (
          <Polyline
            points={edgeDer}
            fill="none"
            stroke="#f472b6"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {peakTip ? (
          <>
            <Circle cx={peakTip.x} cy={peakTip.y} r={5} fill="#f9a8d4" />
            <SvgText
              x={peakTip.x + 8}
              y={peakTip.y - 4}
              fill="#fce7f3"
              fontSize="11"
              fontWeight="700"
            >
              {peakTip.label}
            </SvgText>
          </>
        ) : null}
        <SvgText
          x={labels.lumbar.x}
          y={labels.lumbar.y + 16}
          fill="#67e8f9"
          fontSize="12"
          fontWeight="700"
          textAnchor="middle"
        >
          LUMBAR
        </SvgText>
        <SvgText
          x={labels.dorsal.x}
          y={labels.dorsal.y - 8}
          fill="#7dd3fc"
          fontSize="12"
          fontWeight="700"
          textAnchor="middle"
        >
          DORSAL
        </SvgText>
        <SvgText
          x={labels.izq.x - 6}
          y={labels.izq.y}
          fill="#22d3ee"
          fontSize="13"
          fontWeight="800"
          textAnchor="middle"
        >
          IZQ
        </SvgText>
        <SvgText
          x={labels.der.x + 6}
          y={labels.der.y}
          fill="#f472b6"
          fontSize="13"
          fontWeight="800"
          textAnchor="middle"
        >
          DER
        </SvgText>
        {!slices.length ? (
          <SvgText
            x={cssW / 2}
            y={cssH / 2}
            fill="#94a3b8"
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
          >
            Barré lumbar → dorsal para ver la giba
          </SvgText>
        ) : null}
      </Svg>
      {peakAbs > 0 ? (
        <Text style={styles.peakHint}>Pico |ATR| {Number(peakAbs).toFixed(1)}°</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.25)",
  },
  peakHint: {
    position: "absolute",
    left: 12,
    top: 10,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default AtrGibbositySvg;
