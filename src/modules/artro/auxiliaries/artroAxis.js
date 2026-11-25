/**
 * Eje principal del dispositivo según el movimiento Artro.
 * Flexoextensión / abducción-aducción / bending / DF-PF / pro-sup → X
 * Rotaciones → Y
 */
export const ARTRO_AXIS_X = "x";
export const ARTRO_AXIS_Y = "y";

const Y_MOVEMENTS = new Set([
  "right rotation",
  "left rotation",
  "lateral rotation",
  "medial rotation",
  "rotation",
]);

export const resolveArtroAxis = (movement = "") => {
  const key = String(movement || "")
    .trim()
    .toLowerCase();
  if (!key) return ARTRO_AXIS_X;
  if (Y_MOVEMENTS.has(key) || key.includes("rotation")) {
    return ARTRO_AXIS_Y;
  }
  return ARTRO_AXIS_X;
};

export const pickGyroRate = (sample = {}, axis = ARTRO_AXIS_X) => {
  if (axis === ARTRO_AXIS_Y) return Number(sample.y) || 0;
  return Number(sample.x) || 0;
};
