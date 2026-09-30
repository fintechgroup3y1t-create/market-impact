import { describe, expect, it } from "vitest";
import { findTriggers } from "./auto-events";

// findTriggers เป็นตัวตัดสินว่าเหตุการณ์ร่างจะถูกสร้างไหม (ดูคอมเมนต์บนสุดของ auto-events.ts)
// ต้องแม่นเรื่อง threshold เพราะถ้าหลวมไปจะสแปมเหตุการณ์ปลอม ถ้าเข้มไปจะพลาดเหตุการณ์จริง

describe("findTriggers — macro proxies (WTI/XAU/US10Y)", () => {
  it("triggers an oil-line event when WTI moves >= 3%", () => {
    const triggers = findTriggers({ WTI: 4.2 }, {});
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({ ticker: "WTI", factorId: "oil", isMacroProxy: true, metric: "ret_1d" });
  });

  it("does not trigger just under the 3% threshold", () => {
    expect(findTriggers({ WTI: 2.99 }, {})).toHaveLength(0);
  });

  it("triggers on a negative move too (uses absolute value)", () => {
    const triggers = findTriggers({ WTI: -3.5 }, {});
    expect(triggers).toHaveLength(1);
    expect(triggers[0].value).toBe(-3.5);
  });

  it("maps XAU to the dollar line and US10Y to the inflation line", () => {
    const triggers = findTriggers({ XAU: -3.2, US10Y: 3.1 }, {});
    const byTicker = Object.fromEntries(triggers.map((t) => [t.ticker, t.factorId]));
    expect(byTicker.XAU).toBe("dollar");
    expect(byTicker.US10Y).toBe("inflation");
  });

  it("ignores tickers it doesn't recognize as a macro proxy", () => {
    expect(findTriggers({ SPX: 10 }, {})).toHaveLength(0);
  });
});

describe("findTriggers — individual stocks (abnormal return)", () => {
  it("triggers a covered stock whose sensitivities map to a known line", () => {
    const triggers = findTriggers({}, { XOM: 6.1 });
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({ ticker: "XOM", factorId: "oil", isMacroProxy: false, metric: "abn_ret_1d" });
  });

  it("does not trigger just under the 5% abnormal-return threshold", () => {
    expect(findTriggers({}, { XOM: 4.99 })).toHaveLength(0);
  });

  it("does not guess a line for an uncovered stock with no sensitivities (e.g. the XYZW sample)", () => {
    expect(findTriggers({}, { XYZW: 20 })).toHaveLength(0);
  });

  it("does not trigger a ticker that isn't in the covered-companies list at all", () => {
    expect(findTriggers({}, { NOTACOMPANY: 20 })).toHaveLength(0);
  });

  it("picks the first matching sensitivity keyword (rate-sensitive stock maps to inflation)", () => {
    const triggers = findTriggers({}, { NVDA: 7 });
    expect(triggers[0]).toMatchObject({ ticker: "NVDA", factorId: "inflation" });
  });

  it("combines macro and stock triggers from the same run", () => {
    const triggers = findTriggers({ WTI: 4 }, { XOM: 6 });
    expect(triggers.map((t) => t.ticker).sort()).toEqual(["WTI", "XOM"]);
  });
});
