/** Mirror of gestion-baskin evaluationPlanModuleOptions (sanitize + defaults). */

export const ARTRO_SEGMENT_OPTIONS = [
  { value: "cervical", label: "Cervical", bilateral: false },
  { value: "trunc", label: "Tronco", bilateral: false },
  { value: "shoulder", label: "Hombro", bilateral: true },
  { value: "elbow", label: "Codo", bilateral: true },
  { value: "forearm", label: "Antebrazo", bilateral: true },
  { value: "wrist", label: "Muñeca", bilateral: true },
  { value: "hip", label: "Cadera", bilateral: true },
  { value: "knee", label: "Rodilla", bilateral: true },
  { value: "ankle", label: "Tobillo", bilateral: true },
  { value: "foot", label: "Pie", bilateral: true },
];

export const ARTRO_SIDE_OPTIONS = [
  { value: "right", label: "Derecho" },
  { value: "left", label: "Izquierdo" },
];

export const ARTRO_MOVEMENTS_BY_SEGMENT = {
  cervical: ["flexion", "extension", "right bending", "left bending", "right rotation", "left rotation"],
  trunc: ["flexion", "extension", "right bending", "left bending", "right rotation", "left rotation"],
  shoulder: ["flexion", "extension", "abduction", "adduction", "lateral rotation", "medial rotation"],
  elbow: ["flexion", "extension"],
  forearm: ["supination", "pronation"],
  wrist: ["flexion", "extension", "abduction", "adduction"],
  hip: ["flexion", "extension", "abduction", "adduction", "lateral rotation", "medial rotation"],
  knee: ["flexion", "extension"],
  ankle: ["dorsiflexion", "plantarflexion", "closed chain dorsiflexion"],
  foot: ["pronation", "supination"],
};

export const JUMP_TEST_OPTIONS = [{ value: "CMJ", label: "CMJ", type: "PP" }];
export const JUMP_LEG_OPTIONS = [
  { value: "", label: "Sin preferencia" },
  { value: "right", label: "Pierna derecha" },
  { value: "left", label: "Pierna izquierda" },
  { value: "both", label: "Ambas piernas" },
];
export const STABILITY_EXERCISE_OPTIONS = [
  { value: "Puente Prono", label: "Puente Prono", type: "PP" },
  { value: "Puente Supino", label: "Puente Supino", type: "PS" },
  { value: "Puente Lateral", label: "Puente Lateral", type: "PL" },
  { value: "Apoyo Monopodal", label: "Apoyo Monopodal", type: "AM" },
];
export const PROM_OPTIONS = [
  { value: "oswestry", label: "Oswestry" },
  { value: "ndi", label: "NDI" },
  { value: "dash", label: "DASH" },
  { value: "womac", label: "WOMAC" },
  { value: "eva", label: "EVA" },
  { value: "psqi", label: "PSQI" },
];

const segmentRequiresSide = (segment) => {
  const meta = ARTRO_SEGMENT_OPTIONS.find((item) => item.value === segment);
  return Boolean(meta?.bilateral);
};

const pickString = (value, allowed = []) => {
  if (typeof value !== "string" || !value) return "";
  return allowed.includes(value) ? value : "";
};

const pickStringArray = (values, allowed = []) => {
  if (!Array.isArray(values)) return [];
  return values.filter((value) => allowed.includes(value));
};

export const getDefaultModuleConfig = (moduleId) => {
  switch (moduleId) {
    case "artro":
      return { segment: "", side: "", movement: "" };
    case "jump":
      return { allowedTests: ["CMJ"], defaultTest: "CMJ", defaultLegSide: "" };
    case "stability":
      return {
        allowedExercises: STABILITY_EXERCISE_OPTIONS.map((item) => item.value),
        defaultExercise: "",
      };
    case "proms":
      return { allowedPromIds: [], defaultPromId: "" };
    default:
      return {};
  }
};

export const sanitizeModuleConfig = (moduleId, config = {}) => {
  const safe = config && typeof config === "object" ? config : {};

  switch (moduleId) {
    case "artro": {
      const segment = pickString(safe.segment, ARTRO_SEGMENT_OPTIONS.map((o) => o.value));
      const movementOptions = ARTRO_MOVEMENTS_BY_SEGMENT[segment] || [];
      const sideOptions = segmentRequiresSide(segment)
        ? ARTRO_SIDE_OPTIONS.map((o) => o.value)
        : [""];
      return {
        segment,
        side: pickString(safe.side, sideOptions),
        movement: pickString(safe.movement, movementOptions),
      };
    }
    case "jump": {
      const allowed = pickStringArray(
        safe.allowedTests,
        JUMP_TEST_OPTIONS.map((o) => o.value),
      );
      const defaultTest = pickString(safe.defaultTest, allowed.length ? allowed : ["CMJ"]);
      const legSide = pickString(safe.defaultLegSide, ["", "right", "left", "both"]);
      return {
        allowedTests: allowed.length ? allowed : ["CMJ"],
        defaultTest: defaultTest || allowed[0] || "CMJ",
        defaultLegSide: legSide,
      };
    }
    case "stability": {
      const all = STABILITY_EXERCISE_OPTIONS.map((o) => o.value);
      const allowed = pickStringArray(safe.allowedExercises, all);
      const pool = allowed.length ? allowed : all;
      const defaultExercise = pickString(safe.defaultExercise, pool);
      return { allowedExercises: pool, defaultExercise };
    }
    case "proms": {
      const all = PROM_OPTIONS.map((o) => o.value);
      const allowed = pickStringArray(safe.allowedPromIds, all);
      const pool = allowed.length ? allowed : [];
      const defaultPromId = pickString(safe.defaultPromId, pool);
      return { allowedPromIds: pool, defaultPromId };
    }
    default:
      return {};
  }
};

export const mergeModuleConfig = (moduleId, config = {}) => ({
  ...getDefaultModuleConfig(moduleId),
  ...sanitizeModuleConfig(moduleId, config),
});

const formatMovementLabel = (value) =>
  value
    ? value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

export const formatModuleConfigSummary = (moduleId, config = {}) => {
  const safe = sanitizeModuleConfig(moduleId, config);

  switch (moduleId) {
    case "artro": {
      const parts = [];
      if (safe.segment) {
        parts.push(
          ARTRO_SEGMENT_OPTIONS.find((o) => o.value === safe.segment)?.label ||
            safe.segment,
        );
      }
      if (safe.side) {
        parts.push(
          ARTRO_SIDE_OPTIONS.find((o) => o.value === safe.side)?.label || safe.side,
        );
      }
      if (safe.movement) parts.push(formatMovementLabel(safe.movement));
      return parts.length ? parts.join(" · ") : "";
    }
    case "jump": {
      const tests = safe.allowedTests?.join(", ") || "CMJ";
      const leg = JUMP_LEG_OPTIONS.find((o) => o.value === safe.defaultLegSide)?.label;
      return leg && safe.defaultLegSide ? `${tests} · ${leg}` : tests;
    }
    case "stability": {
      if (safe.defaultExercise) return safe.defaultExercise;
      const count = safe.allowedExercises?.length || 0;
      return count ? `${count} ejercicio(s) permitidos` : "";
    }
    case "proms": {
      const count = safe.allowedPromIds?.length || 0;
      if (!count) return "";
      const names = safe.allowedPromIds
        .map((id) => PROM_OPTIONS.find((o) => o.value === id)?.label || id)
        .slice(0, 2);
      return count > 2 ? `${names.join(", ")} +${count - 2}` : names.join(", ");
    }
    default:
      return "";
  }
};

export const hasMeaningfulModuleConfig = (moduleId, config = {}) =>
  Boolean(formatModuleConfigSummary(moduleId, config));
