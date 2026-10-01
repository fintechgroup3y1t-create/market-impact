// Backtest ทางสถิติล้วน ๆ (ไม่ใช้ AI) สำหรับประโยคแบบ "ในอดีต ... ([n] ครั้ง ตั้งแต่ปี [ปี])"
// ที่ปรากฏในเนื้อหาเหตุการณ์ — โน้ตกำกับไว้แล้วว่า "คำนวณโดยระบบจากข้อมูลราคาย้อนหลัง"
//
// วิธี (ตั้งใจให้เรียบง่ายและอธิบายได้ตรงไปตรงมา แทนที่จะซับซ้อนแต่เข้าใจยาก):
// 1. แบ่งประวัติราคาของ "ตัวกระตุ้น" (เช่น WTI) เป็นช่วง ๆ ไม่ทับกัน ยาวช่วงละ windowDays วันซื้อขาย
// 2. ช่วงไหนที่ตัวกระตุ้นเปลี่ยนแปลงถึงเกณฑ์ที่กำหนด นับเป็น "เหตุการณ์" หนึ่งครั้ง
// 3. วัดผลตอบแทนของ "ตะกร้าหุ้นเป้าหมาย" (เฉลี่ยแบบถ่วงน้ำหนักเท่ากันจากผลตอบแทนรายวัน ไม่ใช่เฉลี่ยราคาดิบ
//    เพราะหุ้นราคาแพงจะถ่วงน้ำหนักเกินจริงถ้าเฉลี่ยราคาตรง ๆ) กับตลาด ในช่วงเวลาเดียวกัน
// 4. เฉลี่ยผลต่าง (ตะกร้า − ตลาด) ทุกครั้งที่เกิดเหตุการณ์

import { dailyReturns } from "./beta";
import type { DailyClose } from "./tiingo";

export interface BacktestEvent {
  startDate: string;
  endDate: string;
  triggerReturnPct: number;
  basketReturnPct: number;
  marketReturnPct: number;
  excessReturnPct: number; // basket - market
}

export interface BacktestResult {
  sinceYear: number;
  occurrences: number;
  avgExcessReturnPct: number;
  events: BacktestEvent[];
}

function closesByDate(closes: DailyClose[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of closes) m.set(c.date, c.close);
  return m;
}

/** ผลตอบแทนรายวันเฉลี่ยแบบถ่วงน้ำหนักเท่ากันของตะกร้าหุ้น (เฉลี่ยเฉพาะตัวที่มีข้อมูลวันนั้นจริง) */
function basketDailyReturns(basket: DailyClose[][]): Map<string, number> {
  const perTicker = basket.map((series) => dailyReturns(series));
  const dates = new Set<string>();
  for (const m of perTicker) for (const d of m.keys()) dates.add(d);
  const out = new Map<string, number>();
  for (const d of dates) {
    const vals = perTicker.map((m) => m.get(d)).filter((v): v is number => v !== undefined);
    if (vals.length > 0) out.set(d, vals.reduce((s, v) => s + v, 0) / vals.length);
  }
  return out;
}

export interface BacktestOptions {
  /** จำนวนวันซื้อขายต่อช่วง เช่น 5 ≈ 1 สัปดาห์ */
  windowDays: number;
  /** เกณฑ์ % ที่ตัวกระตุ้นต้องเปลี่ยนแปลงถึงจะนับเป็นเหตุการณ์ (ใส่เป็นค่าบวกเสมอ) */
  thresholdPct: number;
  /** ตัวกระตุ้นต้อง "ขึ้น" เกินเกณฑ์ หรือ "ลง" เกินเกณฑ์ */
  direction: "up" | "down";
  /** อย่างน้อยกี่ช่วงที่มีข้อมูลครบถึงจะเชื่อถือผลได้ (กันกรณีข้อมูลย้อนหลังสั้นเกินไป) */
  minChunks?: number;
}

/** คืนค่า null ถ้าข้อมูลย้อนหลังสั้นเกินจะแบ่งช่วงได้อย่างมีความหมาย */
export function chunkedEventStudy(
  triggerCloses: DailyClose[],
  basketCloses: DailyClose[][],
  marketCloses: DailyClose[],
  opts: BacktestOptions,
): BacktestResult | null {
  const triggerByDate = closesByDate(triggerCloses);
  const marketByDate = closesByDate(marketCloses);
  const basketReturnByDate = basketDailyReturns(basketCloses);
  const minChunks = opts.minChunks ?? 20;

  const dates = [...triggerByDate.keys()].sort();
  if (dates.length < opts.windowDays * minChunks) return null;

  const events: BacktestEvent[] = [];
  for (let i = 0; i + opts.windowDays < dates.length; i += opts.windowDays) {
    const startDate = dates[i];
    const endDate = dates[i + opts.windowDays];
    const startPrice = triggerByDate.get(startDate)!;
    const endPrice = triggerByDate.get(endDate)!;
    const triggerReturnPct = ((endPrice - startPrice) / startPrice) * 100;

    const qualifies = opts.direction === "up" ? triggerReturnPct >= opts.thresholdPct : triggerReturnPct <= -opts.thresholdPct;
    if (!qualifies) continue;

    const marketStart = marketByDate.get(startDate);
    const marketEnd = marketByDate.get(endDate);
    if (marketStart === undefined || marketEnd === undefined) continue;
    const marketReturnPct = ((marketEnd - marketStart) / marketStart) * 100;

    let basketGrowth = 1;
    let hasBasketData = false;
    for (let j = i + 1; j <= i + opts.windowDays; j++) {
      const r = basketReturnByDate.get(dates[j]);
      if (r !== undefined) {
        basketGrowth *= 1 + r;
        hasBasketData = true;
      }
    }
    if (!hasBasketData) continue;
    const basketReturnPct = (basketGrowth - 1) * 100;

    events.push({
      startDate,
      endDate,
      triggerReturnPct,
      basketReturnPct,
      marketReturnPct,
      excessReturnPct: basketReturnPct - marketReturnPct,
    });
  }

  const sinceYear = new Date(dates[0]).getFullYear();
  if (events.length === 0) return { sinceYear, occurrences: 0, avgExcessReturnPct: 0, events: [] };

  const avgExcessReturnPct = events.reduce((s, e) => s + e.excessReturnPct, 0) / events.length;
  return { sinceYear, occurrences: events.length, avgExcessReturnPct, events };
}

// ส่วนด้านล่าง: backtest แบบ "ความผันผวน" (volatility) แยกจาก chunkedEventStudy ด้านบนที่วัด "ผลตอบแทนเฉลี่ย"
// ใช้สำหรับข้อความประเภท "หุ้นกลุ่มนี้มักผันผวนมากกว่าปกติ" ซึ่งเป็นคนละคำถามกับ "หุ้นกลุ่มนี้มักได้ผลตอบแทนดี/แย่กว่าตลาด"
// วิธี: หาส่วนเบี่ยงเบนมาตรฐาน (standard deviation) ของผลตอบแทนรายวันของตะกร้าหุ้นในช่วงที่ตัวกระตุ้นขยับถึงเกณฑ์
// (sample stdev) เทียบกับส่วนเบี่ยงเบนมาตรฐานของผลตอบแทนรายวันช่วงอื่น ๆ ทั้งหมด (baseline)

export interface VolatilityEvent {
  startDate: string;
  endDate: string;
  triggerReturnPct: number;
  basketVolatilityPct: number; // ส่วนเบี่ยงเบนมาตรฐานของผลตอบแทนรายวันของตะกร้าในช่วงนี้ (%)
}

export interface VolatilityResult {
  sinceYear: number;
  occurrences: number;
  avgEventVolatilityPct: number;
  baselineVolatilityPct: number;
  events: VolatilityEvent[];
}

function stdevPct(dailyReturnsList: number[]): number {
  if (dailyReturnsList.length < 2) return 0;
  const mean = dailyReturnsList.reduce((s, r) => s + r, 0) / dailyReturnsList.length;
  const variance = dailyReturnsList.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturnsList.length - 1);
  return Math.sqrt(variance) * 100;
}

/** คืนค่า null ถ้าข้อมูลย้อนหลังสั้นเกินจะแบ่งช่วงได้อย่างมีความหมาย */
export function chunkedVolatilityStudy(
  triggerCloses: DailyClose[],
  basketCloses: DailyClose[][],
  opts: BacktestOptions,
): VolatilityResult | null {
  const triggerByDate = closesByDate(triggerCloses);
  const basketReturnByDate = basketDailyReturns(basketCloses);
  const minChunks = opts.minChunks ?? 20;

  const dates = [...triggerByDate.keys()].sort();
  if (dates.length < opts.windowDays * minChunks) return null;

  const events: VolatilityEvent[] = [];
  const eventDates = new Set<string>();

  for (let i = 0; i + opts.windowDays < dates.length; i += opts.windowDays) {
    const startDate = dates[i];
    const endDate = dates[i + opts.windowDays];
    const startPrice = triggerByDate.get(startDate)!;
    const endPrice = triggerByDate.get(endDate)!;
    const triggerReturnPct = ((endPrice - startPrice) / startPrice) * 100;

    const qualifies = opts.direction === "up" ? triggerReturnPct >= opts.thresholdPct : triggerReturnPct <= -opts.thresholdPct;
    if (!qualifies) continue;

    const windowReturns: number[] = [];
    for (let j = i + 1; j <= i + opts.windowDays; j++) {
      const r = basketReturnByDate.get(dates[j]);
      if (r !== undefined) {
        windowReturns.push(r);
        eventDates.add(dates[j]);
      }
    }
    if (windowReturns.length < 2) continue;
    events.push({ startDate, endDate, triggerReturnPct, basketVolatilityPct: stdevPct(windowReturns) });
  }

  const sinceYear = new Date(dates[0]).getFullYear();
  if (events.length === 0) {
    return { sinceYear, occurrences: 0, avgEventVolatilityPct: 0, baselineVolatilityPct: 0, events: [] };
  }

  // baseline = ผลตอบแทนรายวันของตะกร้าทั้งหมดที่ "ไม่ได้" อยู่ในช่วงที่ตัวกระตุ้นขยับถึงเกณฑ์
  const baselineReturns = [...basketReturnByDate.entries()].filter(([d]) => !eventDates.has(d)).map(([, r]) => r);

  const avgEventVolatilityPct = events.reduce((s, e) => s + e.basketVolatilityPct, 0) / events.length;
  const baselineVolatilityPct = stdevPct(baselineReturns);

  return { sinceYear, occurrences: events.length, avgEventVolatilityPct, baselineVolatilityPct, events };
}
