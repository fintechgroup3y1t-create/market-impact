// งานตามเวลา ดึงข่าวการเงินจาก Marketaux เก็บไว้ในตาราง documents ให้แอดมินอ่านแล้วตัดสินใจเขียนเหตุการณ์เอง
// ไม่มี AI จัดประเภทอัตโนมัติ (ตามที่ตกลงกันไว้ในชิ้นที่ 5 — ประหยัดค่าใช้จ่าย)

import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { fetchLatestNews, saveArticlesToDb } from "@/lib/news/marketaux";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
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
  if (!process.env.MARKETAUX_API_KEY) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า MARKETAUX_API_KEY" }, { status: 503 });
  }

  const db = getDb();
  try {
    const articles = await fetchLatestNews();
    const { insertedUrls } = await saveArticlesToDb(db, articles);

    return NextResponse.json(
      { ok: true, fetched: articles.length, inserted: insertedUrls.size, skipped: articles.length - insertedUrls.size },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
