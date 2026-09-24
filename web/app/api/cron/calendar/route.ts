// งานตามเวลา (Vercel Cron) ดึงตัวเลขเศรษฐกิจจริงจาก FRED และ EIA แล้วเก็บเป็น market_metrics
// (ใช้ตารางเดียวกับราคาหุ้น entityKey เปลี่ยนเป็นชื่อตัวชี้วัดแทน ticker)
// ทำงานได้เฉพาะเมื่อตั้งค่า DATABASE_URL, FRED_API_KEY และ EIA_API_KEY แล้วเท่านั้น

import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { marketMetrics } from "@/db/schema";
import { getCrudeStocks } from "@/lib/econ/eia";
import { getCpiYoy, getFedFundsRate, getNonfarmPayrollChange } from "@/lib/econ/fred";

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

export async function GET(request: Request) {
  // อนุญาต 2 ทาง เหมือน /api/cron/prices: header จาก Vercel Cron จริง หรือ ?secret=ADMIN_SECRET เปิดเองผ่านเบราว์เซอร์
  const auth = request.headers.get("authorization");
  const isCron = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const manualSecret = request.headers.get("x-admin-secret") ?? new URL(request.url).searchParams.get("secret");
  const isManual = process.env.ADMIN_SECRET && manualSecret === process.env.ADMIN_SECRET;
  if (!isCron && !isManual) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }

  const asOfDate = new Date().toISOString().slice(0, 10);
  const errors: string[] = [];
  const fetched: string[] = [];

  const jobs: { key: string; unit: string; run: () => Promise<{ latest: number; previous: number }> }[] = [
    { key: "CPI", unit: "pct", run: getCpiYoy },
    { key: "FEDFUNDS", unit: "pct", run: getFedFundsRate },
    { key: "NFP", unit: "number", run: getNonfarmPayrollChange },
    { key: "EIA_CRUDE", unit: "number", run: getCrudeStocks },
  ];

  for (const job of jobs) {
    try {
      const r = await job.run();
      await upsertMetric(job.key, "latest", r.latest, job.unit, asOfDate);
      await upsertMetric(job.key, "previous", r.previous, job.unit, asOfDate);
      fetched.push(job.key);
    } catch (err) {
      errors.push(`${job.key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json(
    { ok: errors.length === 0, asOfDate, fetched, errors },
    { headers: { "Cache-Control": "no-store" } },
  );
}
