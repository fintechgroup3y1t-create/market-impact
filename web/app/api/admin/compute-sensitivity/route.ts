// ดึงราคาปิดย้อนหลัง ~2 ปีของหุ้นที่มีหน้าหลักฐาน + ETF ตัวแทนของแต่ละปัจจัย (USO/TLT/GLD) มาคำนวณ Beta จริง
// (สถิติล้วน ๆ ไม่ใช้ AI) แล้วบันทึกลง market_metrics แทนค่า "[ไม่มีข้อมูล]" เดิม
//
// รันเองผ่านปุ่มในหน้าแอดมิน ไม่ผูกกับ cron รายวัน เพราะ:
// - Beta จากข้อมูล 2 ปีไม่เปลี่ยนเร็วพอต้องคำนวณใหม่ทุกคืน
// - แผนฟรีของ Tiingo จำกัดโควตารายชั่วโมง ถ้ารันพร้อม /api/cron/prices (ซึ่งดึงราคาล่าสุดของหุ้นทุกตัวอยู่แล้ว)
//   ในชั่วโมงเดียวกันอาจโดนจำกัดโควตา (429) ได้ทั้งคู่

import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { marketMetrics } from "@/db/schema";
import { getManualSecret } from "@/lib/admin-auth";
import { computeBeta } from "@/lib/prices/beta";
import { BETA_PROXIES, BETA_TARGETS, type BetaFactor } from "@/lib/prices/beta-targets";
import { getDailyHistory, sleep, type DailyClose } from "@/lib/prices/tiingo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function upsertMetric(entityKey: string, metric: string, value: number, unit: string, asOfDate: string) {
  const db = getDb();
  await db
    .insert(marketMetrics)
    .values({ entityKey, metric, value, unit, asOfDate })
    .onConflictDoUpdate({
      target: [marketMetrics.entityKey, marketMetrics.metric, marketMetrics.asOfDate],
      set: { value },
    });
}

function startDateTwoYearsAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 730);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  // เฉพาะเปิดเองผ่านหน้าแอดมินเท่านั้น (ไม่ต้องรองรับ Vercel Cron header เหมือนงานรายวันอื่น)
  const manualSecret = getManualSecret(request);
  const isManual = Boolean(process.env.ADMIN_SECRET) && manualSecret === process.env.ADMIN_SECRET;
  if (!isManual) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  if (!process.env.TIINGO_API_KEY) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า TIINGO_API_KEY" }, { status: 503 });
  }

  const asOfDate = new Date().toISOString().slice(0, 10);
  const startDate = startDateTwoYearsAgo();
  const errors: string[] = [];
  const computed: { ticker: string; factor: BetaFactor; beta: number; days: number }[] = [];

  // ดึงประวัติราคาของ ETF ตัวแทนแต่ละปัจจัยครั้งเดียว แคชไว้ใช้ซ้ำกับหุ้นหลายสิบตัวในกลุ่มเดียวกัน
  const proxyHistory = new Map<BetaFactor, DailyClose[]>();
  for (const [factor, proxy] of Object.entries(BETA_PROXIES) as [BetaFactor, (typeof BETA_PROXIES)[BetaFactor]][]) {
    try {
      proxyHistory.set(factor, await getDailyHistory(proxy.fetchTicker, startDate));
    } catch (err) {
      errors.push(`ดึงประวัติราคา ${proxy.fetchTicker} (${factor}) ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(250);
  }

  for (const [ticker, factor] of Object.entries(BETA_TARGETS)) {
    const proxy = BETA_PROXIES[factor];
    const proxyCloses = proxyHistory.get(factor);
    if (!proxyCloses) continue; // ตัวแทนของปัจจัยนี้ดึงไม่สำเร็จไปแล้ว ข้ามหุ้นทั้งกลุ่มไปเลย ไม่เดา

    try {
      const stockCloses = await getDailyHistory(ticker, startDate);
      const result = computeBeta(stockCloses, proxyCloses);
      if (!result) {
        errors.push(`${ticker}: มีข้อมูลราคาย้อนหลังไม่พอ (น้อยกว่า ~3 เดือน) คำนวณ Beta ไม่ได้`);
      } else {
        const beta = proxy.inverse ? -result.beta : result.beta;
        await upsertMetric(ticker, proxy.metricSuffix, beta, "number", asOfDate);
        computed.push({ ticker, factor, beta, days: result.days });
      }
    } catch (err) {
      errors.push(`${ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(250);
  }

  return NextResponse.json(
    { ok: errors.length === 0, asOfDate, computed: computed.length, total: Object.keys(BETA_TARGETS).length, details: computed, errors },
    { headers: { "Cache-Control": "no-store" } },
  );
}
