import { describe, expect, it } from "vitest";
import { chunkedEventStudy, chunkedVolatilityStudy } from "./backtest";
import type { DailyClose } from "./tiingo";

function dateAt(i: number): string {
  const d = new Date("2024-01-01");
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
}

/**
 * สร้างราคาปิดสมมติจาก "แผนผลตอบแทนรายวัน" ที่กำหนดไว้ล่วงหน้า (deterministic)
 * เพื่อให้รู้คำตอบที่ถูกต้องของ chunkedEventStudy ก่อนเรียกจริง
 */
function buildCloses(dailyReturns: number[]): DailyClose[] {
  let price = 100;
  return dailyReturns.map((r, i) => {
    price *= 1 + r;
    return { date: dateAt(i), close: price };
  });
}

const WINDOW = 5;
const CHUNKS = 40; // 40 ช่วง x 5 วัน = 200 วันซื้อขาย มากกว่า minChunks เริ่มต้น (20) พอ

describe("chunkedEventStudy", () => {
  it("returns null when there isn't enough history to form minChunks windows", () => {
    const short = buildCloses(Array(10).fill(0));
    expect(chunkedEventStudy(short, [short], short, { windowDays: WINDOW, thresholdPct: 5, direction: "up" })).toBeNull();
  });

  it("counts exactly the chunks that cross the threshold, and computes the right average excess return", () => {
    // เลือกไว้ล่วงหน้าว่า chunk ที่ 3 และ chunk ที่ 10 (0-indexed) จะเป็น "เหตุการณ์" (trigger ขึ้น >= 6%)
    const triggerEventChunks = new Set([3, 10]);
    const triggerReturns: number[] = [];
    const marketReturns: number[] = [];
    const stockAReturns: number[] = [];
    const stockBReturns: number[] = [];

    for (let c = 0; c < CHUNKS; c++) {
      for (let d = 0; d < WINDOW; d++) {
        const isEventChunk = triggerEventChunks.has(c);
        // trigger: วันแรกของ chunk ขยับ +6% ถ้าเป็น event chunk, วันอื่นเรียบ 0%
        triggerReturns.push(isEventChunk && d === 0 ? 0.06 : 0);
        // ตลาด: +1% วันแรกของ event chunk เท่านั้น, ปกติ 0%
        marketReturns.push(isEventChunk && d === 0 ? 0.01 : 0);
        // ตะกร้า (หุ้น A และ B เหมือนกัน): -2% วันแรกของ event chunk เท่านั้น -> excess ที่คาดไว้ = -2 - 1 = -3%
        stockAReturns.push(isEventChunk && d === 0 ? -0.02 : 0);
        stockBReturns.push(isEventChunk && d === 0 ? -0.02 : 0);
      }
    }

    const trigger = buildCloses(triggerReturns);
    const market = buildCloses(marketReturns);
    const stockA = buildCloses(stockAReturns);
    const stockB = buildCloses(stockBReturns);

    const result = chunkedEventStudy(trigger, [stockA, stockB], market, {
      windowDays: WINDOW,
      thresholdPct: 5,
      direction: "up",
    });

    expect(result).not.toBeNull();
    expect(result!.occurrences).toBe(2);
    expect(result!.avgExcessReturnPct).toBeCloseTo(-3, 4);
    expect(result!.sinceYear).toBe(2024);
    // ทั้งสองเหตุการณ์ควรมี excess ใกล้เคียงกัน (คำนวณจากแพทเทิร์นเดียวกัน) ไม่ใช่แค่ค่าเฉลี่ยบังเอิญตรง
    for (const e of result!.events) {
      expect(e.excessReturnPct).toBeCloseTo(-3, 4);
      expect(e.triggerReturnPct).toBeCloseTo(6, 4);
    }
  });

  it("finds nothing when the trigger never crosses the threshold", () => {
    const flat = Array(WINDOW * CHUNKS).fill(0.001); // ขยับแค่ 0.1%/วัน ไม่มีทางถึง 5% ต่อช่วง 5 วัน
    const trigger = buildCloses(flat);
    const market = buildCloses(flat);
    const basket = buildCloses(flat);
    const result = chunkedEventStudy(trigger, [basket], market, { windowDays: WINDOW, thresholdPct: 5, direction: "up" });
    expect(result).not.toBeNull();
    expect(result!.occurrences).toBe(0);
    expect(result!.avgExcessReturnPct).toBe(0);
  });

  it("direction: down only counts drops past -threshold, not rises", () => {
    const returns: number[] = [];
    for (let c = 0; c < CHUNKS; c++) {
      for (let d = 0; d < WINDOW; d++) {
        if (c === 5 && d === 0) returns.push(-0.08); // ลง 8% -> ควรนับ (เกณฑ์ 5%)
        else if (c === 6 && d === 0) returns.push(0.08); // ขึ้น 8% -> ไม่ควรนับเพราะ direction คือ "down"
        else returns.push(0);
      }
    }
    const trigger = buildCloses(returns);
    const flatMarket = buildCloses(Array(WINDOW * CHUNKS).fill(0));
    const flatBasket = buildCloses(Array(WINDOW * CHUNKS).fill(0));
    const result = chunkedEventStudy(trigger, [flatBasket], flatMarket, { windowDays: WINDOW, thresholdPct: 5, direction: "down" });
    expect(result!.occurrences).toBe(1);
  });

  it("basket return is an equal-weighted average of daily returns, not an average of raw prices", () => {
    // หุ้น A ราคาสูง (เริ่ม 100 ขยับ +10%), หุ้น B ราคาต่ำ (เริ่ม 100 เหมือนกันแต่ตั้งใจให้ผลตอบแทนต่าง +2%)
    // ผลตอบแทนตะกร้าที่ถูกต้องคือค่าเฉลี่ยผลตอบแทน (10+2)/2 = 6% ไม่ใช่เฉลี่ยราคาปิด
    const returns: number[] = [];
    const aReturns: number[] = [];
    const bReturns: number[] = [];
    for (let c = 0; c < CHUNKS; c++) {
      for (let d = 0; d < WINDOW; d++) {
        const isEvent = c === 8 && d === 0;
        returns.push(isEvent ? 0.06 : 0);
        aReturns.push(isEvent ? 0.1 : 0);
        bReturns.push(isEvent ? 0.02 : 0);
      }
    }
    const trigger = buildCloses(returns);
    const market = buildCloses(Array(WINDOW * CHUNKS).fill(0));
    const stockA = buildCloses(aReturns);
    const stockB = buildCloses(bReturns);
    const result = chunkedEventStudy(trigger, [stockA, stockB], market, { windowDays: WINDOW, thresholdPct: 5, direction: "up" });
    expect(result!.occurrences).toBe(1);
    expect(result!.events[0].basketReturnPct).toBeCloseTo(6, 4);
    expect(result!.events[0].excessReturnPct).toBeCloseTo(6, 4); // market flat ที่ 0%
  });
});

describe("chunkedVolatilityStudy", () => {
  it("returns null when there isn't enough history to form minChunks windows", () => {
    const short = buildCloses(Array(10).fill(0));
    expect(chunkedVolatilityStudy(short, [short], { windowDays: WINDOW, thresholdPct: 3, direction: "down" })).toBeNull();
  });

  it("measures higher volatility during qualifying windows than the flat baseline", () => {
    // ช่วงที่เริ่มต้นที่ i=15 และ i=50 (ตรงกับ windowDays=5 พอดี) เป็น "เหตุการณ์" ส่วนช่วงอื่นเรียบ 0% ตลอด
    // หมายเหตุ: ฟังก์ชันวัด window ของช่วงที่เริ่มที่ index i จาก return ตำแหน่ง i+1..i+windowDays (ไม่ใช่ i..i+windowDays-1)
    // ต้องวางค่าให้ตรงตำแหน่งนี้เป๊ะ ไม่งั้นค่าที่ตั้งใจจะ "รั่ว" ไปปนกับ baseline ของช่วงข้างเคียง
    const n = WINDOW * CHUNKS;
    const triggerReturns = Array(n).fill(0);
    const basketReturns = Array(n).fill(0);
    // สลับ +5%/-5% ทุกวันในช่วงเหตุการณ์ -> ผันผวนสูงชัดเจน เทียบกับ baseline ที่เรียบ 0% ตลอด
    const oscillating = [0.05, -0.05, 0.05, -0.05, 0.05];

    for (const i of [15, 50]) {
      triggerReturns[i + 1] = -0.04; // ลงทีเดียว 4% ในวันแรกของ window -> เกินเกณฑ์ 3%
      for (let k = 0; k < WINDOW; k++) basketReturns[i + 1 + k] = oscillating[k];
    }

    const trigger = buildCloses(triggerReturns);
    const basket = buildCloses(basketReturns);
    const result = chunkedVolatilityStudy(trigger, [basket], { windowDays: WINDOW, thresholdPct: 3, direction: "down" });

    expect(result).not.toBeNull();
    expect(result!.occurrences).toBe(2);
    expect(result!.sinceYear).toBe(2024);
    expect(result!.baselineVolatilityPct).toBeCloseTo(0, 4); // ช่วงอื่นเรียบ 0% ตลอด
    expect(result!.avgEventVolatilityPct).toBeGreaterThan(result!.baselineVolatilityPct);
    for (const e of result!.events) {
      expect(e.triggerReturnPct).toBeCloseTo(-4, 4);
      expect(e.basketVolatilityPct).toBeGreaterThan(0);
    }
  });

  it("direction: down only counts drops past -threshold, not rises", () => {
    const returns: number[] = [];
    for (let c = 0; c < CHUNKS; c++) {
      for (let d = 0; d < WINDOW; d++) {
        if (c === 5 && d === 0) returns.push(-0.08); // ลง 8% -> ควรนับ (เกณฑ์ 3%)
        else if (c === 6 && d === 0) returns.push(0.08); // ขึ้น 8% -> ไม่ควรนับเพราะ direction คือ "down"
        else returns.push(0);
      }
    }
    const trigger = buildCloses(returns);
    const flatBasket = buildCloses(Array(WINDOW * CHUNKS).fill(0));
    const result = chunkedVolatilityStudy(trigger, [flatBasket], { windowDays: WINDOW, thresholdPct: 3, direction: "down" });
    expect(result!.occurrences).toBe(1);
  });

  it("finds nothing when the trigger never crosses the threshold", () => {
    const flat = Array(WINDOW * CHUNKS).fill(0.001);
    const trigger = buildCloses(flat);
    const basket = buildCloses(flat);
    const result = chunkedVolatilityStudy(trigger, [basket], { windowDays: WINDOW, thresholdPct: 3, direction: "down" });
    expect(result).not.toBeNull();
    expect(result!.occurrences).toBe(0);
  });
});
