import { describe, it, expect } from "vitest";
import { calculateTrendPercentage } from "../src/auxiliaries/trendAnalysis.js";

describe("calculateTrendPercentage", () => {
  it("devuelve 0 con menos de 2 valores", () => {
    expect(calculateTrendPercentage([])).toBe(0);
    expect(calculateTrendPercentage([5])).toBe(0);
    expect(calculateTrendPercentage(null)).toBe(0);
  });

  it("detecta tendencia ascendente", () => {
    const trend = calculateTrendPercentage([10, 20, 30, 40]);
    expect(trend).toBeGreaterThan(0);
  });

  it("detecta tendencia descendente", () => {
    const trend = calculateTrendPercentage([40, 30, 20, 10]);
    expect(trend).toBeLessThan(0);
  });
});
