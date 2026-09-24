// งานตามเวลา (Vercel Cron) ดึงราคาปิดของหุ้นที่ครอบคลุมทั้งหมด + proxy ticker ของดัชนี/โภคภัณฑ์
// แล้วคำนวณ ret_1d และ ผลต่างจากตลาด (abnormal return แบบง่าย = ret_1d ของหุ้น - ret_1d ของ SPY)
// ทำงานได้เฉพาะเมื่อตั้งค่า DATABASE_URL และ TIINGO_API_KEY แล้วเท่านั้น (ไม่ทำให้เว็บพังถ้ายังไม่ตั้งค่า)

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { entities, marketMetrics, prices } from "@/db/schema";
import { getQuote, MARKET_BENCHMARK_KEY, PROXY_TICKERS, pctReturn, SECTOR_GROUPS, sleep } from "@/lib/prices/tiingo";

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

async function upsertPrice(ticker: string, asOfDate: string, close: number) {
  const db = getDb();
  await db
    .insert(prices)
    .values({ ticker, asOfDate, close })
    .onConflictDoUpdate({ target: [prices.ticker, prices.asOfDate], set: { close } });
}

export async function GET(request: Request) {
  // อนุญาต 2 ทาง: (1) Vercel ใส่ header นี้ให้อัตโนมัติเมื่อยิงจาก Cron จริงตามเวลา
  // (2) เปิดลิงก์เองพร้อม ?secret=ADMIN_SECRET เพื่อทดสอบดึงราคาด้วยมือ (ดู lib/admin-auth.ts)
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
  if (!process.env.TIINGO_API_KEY) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า TIINGO_API_KEY" }, { status: 503 });
  }

  const db = getDb();
  const asOfDate = new Date().toISOString().slice(0, 10);
  const errors: string[] = [];
  const returns: Record<string, number> = {}; // ticker -> ret_1d (%)

  const covered = await db.select().from(entities).where(eq(entities.covered, true));
  const jobs = [
    ...covered.map((e) => ({ key: e.ticker, fetchTicker: e.ticker })),
    ...PROXY_TICKERS.map((p) => ({ key: p.key, fetchTicker: p.fetchTicker })),
  ];

  for (const job of jobs) {
    try {
      const quote = await getQuote(job.fetchTicker);
      const ret = pctReturn(quote.c, quote.pc);
      returns[job.key] = ret;
      await upsertPrice(job.fetchTicker, asOfDate, quote.c);
      await upsertMetric(job.key, "ret_1d", ret, "pct", asOfDate);
      await upsertMetric(job.key, "close", quote.c, "usd", asOfDate);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
    await sleep(250); // แผนฟรี Tiingo จำกัดเป็นรายชั่วโมง เว้นจังหวะสั้น ๆ ให้สุภาพ
  }

  const marketReturn = returns[MARKET_BENCHMARK_KEY];
  if (marketReturn !== undefined) {
    for (const e of covered) {
      if (returns[e.ticker] === undefined) continue;
      await upsertMetric(e.ticker, "abn_ret_1d", returns[e.ticker] - marketReturn, "pct", asOfDate);
    }
  }

  // ค่าเฉลี่ยรายกลุ่มอุตสาหกรรม (เช่น "กลุ่มสายการบิน") ใช้แสดงในหน้าหลักฐานหุ้น
  for (const group of SECTOR_GROUPS) {
    const members = covered.filter((e) => e.sector === group.sector && returns[e.ticker] !== undefined);
    if (members.length === 0) continue;
    const avg = members.reduce((sum, e) => sum + returns[e.ticker], 0) / members.length;
    await upsertMetric(group.key, "ret_1d", avg, "pct", asOfDate);
  }

  return NextResponse.json({
    ok: errors.length === 0,
    asOfDate,
    fetched: Object.keys(returns).length,
    errors,
  });
}
