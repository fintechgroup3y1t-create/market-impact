import { describe, expect, it } from "vitest";
import { pctReturn } from "./tiingo";

describe("pctReturn", () => {
  it("computes a plain percent change", () => {
    expect(pctReturn(110, 100)).toBeCloseTo(10, 10);
    expect(pctReturn(90, 100)).toBeCloseTo(-10, 10);
  });

  it("returns 0 instead of dividing by zero when there's no previous price", () => {
    expect(pctReturn(50, 0)).toBe(0);
  });
});
