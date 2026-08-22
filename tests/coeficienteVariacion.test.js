import { describe, it, expect } from "vitest";
import { coeficienteVariacion } from "../src/auxiliaries/coeficienteVariacion.js";

describe("coeficienteVariacion", () => {
  it("devuelve 0 con datos vacíos", () => {
    expect(coeficienteVariacion([])).toBe(0);
    expect(coeficienteVariacion(null)).toBe(0);
  });

  it("calcula CV sobre dynamicMag", () => {
    const data = [{ dynamicMag: 10 }, { dynamicMag: 20 }, { dynamicMag: 30 }];
    const cv = coeficienteVariacion(data, "dynamicMag");
    expect(cv).toBeCloseTo(40.82, 1);
  });

  it("calcula CV sobre números planos", () => {
    const cv = coeficienteVariacion([2, 4, 6]);
    expect(cv).toBeCloseTo(40.82, 1);
  });

  it("devuelve 0 si la media es ~0", () => {
    expect(coeficienteVariacion([0, 0, 0])).toBe(0);
  });
});
