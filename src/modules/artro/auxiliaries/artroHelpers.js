const MMSS_SEGMENTS = ["shoulder", "elbow", "forearm", "wrist"];
const MMII_SEGMENTS = ["hip", "knee", "ankle", "foot"];
const AXIAL_SEGMENTS = ["cervical", "trunc"];

export function getCorporalPart(segment) {
  if (MMSS_SEGMENTS.includes(segment)) return "MMSS";
  if (MMII_SEGMENTS.includes(segment)) return "MMII";
  if (AXIAL_SEGMENTS.includes(segment)) return "Axial";
  return "";
}

export function requiresSide(segment) {
  return getCorporalPart(segment) === "MMSS" || getCorporalPart(segment) === "MMII";
}

export function formatSegmentLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMovementLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatSideLabel(value) {
  if (value === "left") return "Izquierdo";
  if (value === "right") return "Derecho";
  return "";
}

export const TEST_TIME_MS = 6000;
export const START_DELAY_MS = 3000;
