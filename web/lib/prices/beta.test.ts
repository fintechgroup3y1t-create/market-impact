import { describe, expect, it } from "vitest";
import { computeBeta } from "./beta";
import type { DailyClose } from "./tiingo";

// สร้างราคาย้อนหลังสมมติจากผลตอบแทนรายวันที่กำหนดเอง (deterministic, ไม่สุ่ม) เพื่อคำนวณ beta ที่รู้คำตอบล่วงหน้า
// ใช้ Date จริงเพิ่มทีละวัน (ไม่ใช่ต่อ string เอง) กัน bug เรื่อง string sort ผิดลำดับตอนวันที่เกิน 2 หลัก
function buildCloses(dailyReturns: number[], startDate = "2024-01-01"): DailyClose[] {
  let price = 100;
  const start = new Date(startDate);
  return dailyReturns.map((r, i) => {
    price *= 1 + r;
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), close: price };
  });
}

describe("computeBeta", () => {
  it("returns null when fewer than ~60 trading days overlap", () => {
    const returns = Array.from({ length: 30 }, (_, i) => Math.sin(i) * 0.01);
    const proxy = buildCloses(returns);
    const stock = buildCloses(returns);
    expect(computeBeta(stock, proxy)).toBeNull();
  });

  it("recovers beta ≈ 2.0 for a stock that moves exactly 2x the proxy", () => {
    const proxyReturns = Array.from({ length: 200 }, (_, i) => (Math.sin(i * 0.7) + Math.sin(i * 1.3) * 0.5) * 0.01);
    const stockReturns = proxyReturns.map((r) => r * 2);
    const proxy = buildCloses(proxyReturns);
    const stock = buildCloses(stockReturns);
    const result = computeBeta(stock, proxy);
    expect(result).not.toBeNull();
    expect(result!.beta).toBeCloseTo(2.0, 6);
    expect(result!.days).toBe(199);
  });

  it("recovers a negative beta for a stock that moves opposite the proxy (e.g. TLT vs. rates)", () => {
    const proxyReturns = Array.from({ length: 200 }, (_, i) => (Math.sin(i * 0.7) + Math.sin(i * 1.3) * 0.5) * 0.01);
    const stockReturns = proxyReturns.map((r) => r * -1.5);
    const proxy = buildCloses(proxyReturns);
    const stock = buildCloses(stockReturns);
    const result = computeBeta(stock, proxy);
    expect(result!.beta).toBeCloseTo(-1.5, 6);
  });

  it("only pairs dates present in both series (handles a stock with a shorter history)", () => {
    const proxyReturns = Array.from({ length: 200 }, (_, i) => (Math.sin(i * 0.7) + Math.sin(i * 1.3) * 0.5) * 0.01);
    const proxy = buildCloses(proxyReturns);
    // หุ้นมีราคาแค่ 100 วันหลังสุด (เพิ่งเข้าตลาด) ควรจับคู่ได้แค่วันที่ overlap กัน
    const stock = buildCloses(proxyReturns.slice(100).map((r) => r * 2)).map((c, i) => ({
      ...c,
      date: proxy[100 + i].date,
    }));
    const result = computeBeta(stock, proxy);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(99);
    expect(result!.beta).toBeCloseTo(2.0, 6);
  });
});
