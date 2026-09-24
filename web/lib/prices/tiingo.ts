// ดึงราคาจาก Tiingo (แผนฟรี) ใช้ IEX endpoint สำหรับราคาล่าสุด + ราคาปิดวันก่อนหน้า
// ข้อจำกัดของแผนฟรี: ไม่มีราคาสินค้าโภคภัณฑ์/ดัชนีโดยตรง (WTI, S&P 500 index, บอนด์)
// จึงใช้ ETF ที่ซื้อขายเป็นหุ้นแทนราคาที่ใกล้เคียง (บอกไว้ตรง ๆ ในหน้าเว็บด้วย proxyNote)

export interface ProxyTicker {
  /** key ที่ใช้แสดงในหน้าเว็บ เช่น "WTI" */
  key: string;
  /** ticker จริงที่ยิง Tiingo */
  fetchTicker: string;
  proxyNote: string;
}

export const PROXY_TICKERS: ProxyTicker[] = [
  { key: "WTI", fetchTicker: "USO", proxyNote: "อ้างอิงจาก ETF น้ำมัน USO (ไม่ใช่ราคา WTI ฟิวเจอร์สโดยตรง)" },
  { key: "SPX", fetchTicker: "SPY", proxyNote: "อ้างอิงจาก ETF ดัชนี SPY (ไม่ใช่ดัชนี S&P 500 โดยตรง)" },
  { key: "GOLD", fetchTicker: "GLD", proxyNote: "อ้างอิงจาก ETF ทองคำ GLD (ไม่ใช่ราคาทองคำแท่งโดยตรง)" },
  { key: "US10Y", fetchTicker: "TLT", proxyNote: "อ้างอิงจาก ETF พันธบัตรระยะยาว TLT (ทิศทางตรงข้ามผลตอบแทนพันธบัตรคร่าว ๆ ไม่ใช่ yield โดยตรง)" },
];

/** key ของดัชนีตลาดที่ใช้เป็นตัวเทียบผลตอบแทนส่วนเกิน (abnormal return) คือ SPX ในตาราง PROXY_TICKERS ด้านบน */
export const MARKET_BENCHMARK_KEY = "SPX";

/** กลุ่มอุตสาหกรรมที่หน้าเว็บโชว์เป็นค่าเฉลี่ย เทียบกับ sector ที่ตั้งไว้ใน entities */
export const SECTOR_GROUPS: { key: string; sector: string }[] = [
  { key: "AIRLINES", sector: "กลุ่มสายการบิน" },
  { key: "ENERGY", sector: "กลุ่มพลังงาน" },
];

interface TiingoIexQuote {
  ticker: string;
  last: number | null;
  tngoLast: number | null; // ราคาล่าสุดแบบของ Tiingo เอง มีค่าเสมอแม้ตลาดปิด
  prevClose: number | null;
}

export class TiingoError extends Error {}

export async function getQuote(ticker: string): Promise<{ c: number; pc: number }> {
  const key = process.env.TIINGO_API_KEY;
  if (!key) throw new TiingoError("ไม่พบ TIINGO_API_KEY");
  const res = await fetch(`https://api.tiingo.com/iex/${encodeURIComponent(ticker)}?token=${key}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new TiingoError(`Tiingo ตอบกลับผิดพลาด (${res.status}) สำหรับ ${ticker}`);
  const data = (await res.json()) as TiingoIexQuote[];
  const q = data?.[0];
  const current = q?.tngoLast ?? q?.last;
  if (!q || typeof current !== "number" || typeof q.prevClose !== "number") {
    throw new TiingoError(`ไม่มีข้อมูลราคาสำหรับ ${ticker} (อาจไม่อยู่ในแผนฟรี หรือถึงโควตาแล้ว)`);
  }
  return { c: current, pc: q.prevClose };
}

export function pctReturn(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

/** หน่วงเวลาสั้น ๆ ระหว่างเรียก API ให้สุภาพกับแผนฟรี (Tiingo จำกัดเป็นรายชั่วโมง ไม่ใช่รายนาทีเหมือน Finnhub) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
