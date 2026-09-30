import { describe, expect, it } from "vitest";
import { direction, fillTemplate, firstMetric, formatMetric, lookup, MISSING } from "./format";
import type { MarketMetrics } from "./types";

describe("formatMetric", () => {
  it("formats positive pct with a leading +", () => {
    expect(formatMetric({ value: 4.2, unit: "pct" })).toBe("+4.2%");
  });

  it("formats negative pct with the Thai-style minus sign, not a hyphen", () => {
    expect(formatMetric({ value: -3.1, unit: "pct" })).toBe("−3.1%");
  });

  it("formats zero without a sign", () => {
    expect(formatMetric({ value: 0, unit: "pct" })).toBe("0.0%");
  });

  it("abs mode drops the sign entirely", () => {
    expect(formatMetric({ value: -3.1, unit: "pct" }, true)).toBe("3.1%");
  });

  it("formats bps with no decimal places", () => {
    expect(formatMetric({ value: 6, unit: "bps" })).toBe("+6 bps");
    expect(formatMetric({ value: -6, unit: "bps" })).toBe("−6 bps");
  });

  it("formats usd with 2 decimals and no sign", () => {
    expect(formatMetric({ value: 123.4, unit: "usd" })).toBe("123.40");
  });

  it("formats a plain number (e.g. beta) with 2 decimals and a sign", () => {
    expect(formatMetric({ value: -0.42, unit: "number" })).toBe("−0.42");
    expect(formatMetric({ value: 0.61, unit: "number" })).toBe("+0.61");
  });
});

describe("direction", () => {
  it("is flat when the metric is missing or exactly zero", () => {
    expect(direction(undefined)).toBe("flat");
    expect(direction({ value: 0, unit: "pct" })).toBe("flat");
  });

  it("is up for positive values and down for negative ones (color only, not a value judgment)", () => {
    expect(direction({ value: 0.1, unit: "pct" })).toBe("up");
    expect(direction({ value: -0.1, unit: "pct" })).toBe("down");
  });
});

const metrics: MarketMetrics = {
  DAL: { ret_1d: { value: -3.9, unit: "pct" }, beta_oil_2y: { value: -0.42, unit: "number" } },
  WTI: { ret_1d: { value: 4.2, unit: "pct" } },
};

describe("lookup", () => {
  it("finds a known entity.field pair", () => {
    expect(lookup(metrics, "DAL.ret_1d")).toEqual({ value: -3.9, unit: "pct" });
  });

  it("returns undefined for an unknown entity or field", () => {
    expect(lookup(metrics, "XOM.ret_1d")).toBeUndefined();
    expect(lookup(metrics, "DAL.close")).toBeUndefined();
  });
});

describe("fillTemplate", () => {
  it("substitutes a known placeholder with its formatted value", () => {
    expect(fillTemplate("ราคา WTI เพิ่มขึ้น {{WTI.ret_1d}}", metrics)).toBe("ราคา WTI เพิ่มขึ้น +4.2%");
  });

  it("applies the |abs modifier", () => {
    expect(fillTemplate("ราคา WTI เพิ่มขึ้น {{WTI.ret_1d|abs}}", metrics)).toBe("ราคา WTI เพิ่มขึ้น 4.2%");
  });

  it("falls back to the MISSING marker instead of fabricating a number", () => {
    expect(fillTemplate("Beta ต่อดอกเบี้ย {{NVDA.beta_rate_2y}}", metrics)).toBe(`Beta ต่อดอกเบี้ย ${MISSING}`);
  });

  it("fills every placeholder when there are several in one string", () => {
    expect(fillTemplate("{{DAL.ret_1d}} เทียบกับ {{WTI.ret_1d}}", metrics)).toBe("−3.9% เทียบกับ +4.2%");
  });

  it("leaves text with no placeholders untouched", () => {
    expect(fillTemplate("ไม่มี placeholder ในข้อความนี้", metrics)).toBe("ไม่มี placeholder ในข้อความนี้");
  });
});

describe("firstMetric", () => {
  it("returns the metric behind the first placeholder in the text", () => {
    expect(firstMetric("{{DAL.ret_1d}} เทียบกับ {{WTI.ret_1d}}", metrics)).toEqual({ value: -3.9, unit: "pct" });
  });

  it("returns undefined when the text has no placeholder or the metric is missing", () => {
    expect(firstMetric("ไม่มี placeholder", metrics)).toBeUndefined();
    expect(firstMetric("{{XOM.ret_1d}}", metrics)).toBeUndefined();
  });
});
