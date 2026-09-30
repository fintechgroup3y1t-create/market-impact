// คำนวณ Beta (ความไวของหุ้นต่อปัจจัยหนึ่ง ๆ) จากผลตอบแทนรายวันย้อนหลังจริง — สถิติล้วน ๆ ไม่ใช้ AI
// Beta = Cov(ผลตอบแทนหุ้น, ผลตอบแทนตัวแทนปัจจัย) / Var(ผลตอบแทนตัวแทนปัจจัย)

import type { DailyClose } from "./tiingo";

/** อย่างน้อยกี่วันที่จับคู่กันได้ถึงจะถือว่าคำนวณได้น่าเชื่อถือพอ (ประมาณ 3 เดือนซื้อขาย) */
const MIN_PAIRED_DAYS = 60;

/** วันที่ -> ผลตอบแทนรายวัน (close-to-close) ใช้ร่วมกันทั้งการคำนวณ Beta และ backtest.ts */
export function dailyReturns(closes: DailyClose[]): Map<string, number> {
  const sorted = [...closes].sort((a, b) => a.date.localeCompare(b.date));
  const out = new Map<string, number>();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].close;
    const curr = sorted[i].close;
    if (prev > 0) out.set(sorted[i].date, (curr - prev) / prev);
  }
  return out;
}

export interface BetaResult {
  beta: number;
  /** จำนวนวันที่มีข้อมูลทั้งหุ้นและตัวแทนปัจจัยพร้อมกันจริง ๆ (อาจน้อยกว่าช่วงที่ขอ ถ้าหุ้นเพิ่งเข้าตลาด) */
  days: number;
}

/** จับคู่ผลตอบแทนรายวันเฉพาะวันที่มีข้อมูลทั้งคู่ แล้วคำนวณ Beta ทางสถิติ คืน null ถ้าข้อมูลน้อยเกินจะเชื่อถือได้ */
export function computeBeta(stockCloses: DailyClose[], proxyCloses: DailyClose[]): BetaResult | null {
  const stockRet = dailyReturns(stockCloses);
  const proxyRet = dailyReturns(proxyCloses);
  const pairs: [number, number][] = [];
  for (const [date, sr] of stockRet) {
    const pr = proxyRet.get(date);
    if (pr !== undefined) pairs.push([sr, pr]);
  }
  if (pairs.length < MIN_PAIRED_DAYS) return null;

  const n = pairs.length;
  const meanS = pairs.reduce((s, [a]) => s + a, 0) / n;
  const meanP = pairs.reduce((s, [, b]) => s + b, 0) / n;
  let cov = 0;
  let varP = 0;
  for (const [s, p] of pairs) {
    cov += (s - meanS) * (p - meanP);
    varP += (p - meanP) ** 2;
  }
  cov /= n;
  varP /= n;
  if (varP === 0) return null;
  return { beta: cov / varP, days: n };
}
