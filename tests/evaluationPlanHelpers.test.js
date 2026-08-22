import { describe, it, expect } from "vitest";
import {
  getPlanModuleConfig,
  filterByAllowedNames,
  filterByAllowedIds,
} from "../src/config/evaluationPlanHelpers.js";

describe("evaluationPlanHelpers", () => {
  it("getPlanModuleConfig devuelve null si el módulo no está habilitado", () => {
    const plan = {
      modules: [{ moduleId: "jump", enabled: false, config: { defaultTest: "CMJ" } }],
    };
    expect(getPlanModuleConfig(plan, "jump")).toBeNull();
  });

  it("getPlanModuleConfig fusiona config del plan con defaults", () => {
    const plan = {
      modules: [
        {
          moduleId: "jump",
          enabled: true,
          config: { defaultTest: "CMJ", defaultLegSide: "right" },
        },
      ],
    };

    const config = getPlanModuleConfig(plan, "jump");
    expect(config.defaultTest).toBe("CMJ");
    expect(config.defaultLegSide).toBe("right");
    expect(config.allowedTests).toContain("CMJ");
  });

  it("filterByAllowedNames filtra por nombres permitidos", () => {
    const items = [{ name: "A" }, { name: "B" }, { name: "C" }];
    expect(filterByAllowedNames(items, ["A", "C"])).toEqual([
      { name: "A" },
      { name: "C" },
    ]);
  });

  it("filterByAllowedIds devuelve todo si no hay ids permitidos", () => {
    const items = [{ id: 1 }, { id: 2 }];
    expect(filterByAllowedIds(items, [])).toEqual(items);
  });
});
