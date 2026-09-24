// งานตามเวลา ดึงข่าวการเงินจาก Marketaux เก็บไว้ในตาราง documents ให้แอดมินอ่านแล้วตัดสินใจเขียนเหตุการณ์เอง
// ไม่มี AI จัดประเภทอัตโนมัติ (ตามที่ตกลงกันไว้ในชิ้นที่ 5 — ประหยัดค่าใช้จ่าย)

import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { documents, sources } from "@/db/schema";
import { fetchLatestNews } from "@/lib/news/marketaux";

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

    // หา/สร้างแถว sources ตามโดเมนต้นฉบับข่าว (ไม่ใช่ "Marketaux" เพราะเป็นแค่ตัวรวมข่าว)
    const sourceNames = [...new Set(articles.map((a) => a.sourceName))];
    const existingSources = sourceNames.length ? await db.select().from(sources).where(inArray(sources.name, sourceNames)) : [];
    const sourceIdByName = new Map(existingSources.map((s) => [s.name, s.id]));
    for (const name of sourceNames) {
      if (sourceIdByName.has(name)) continue;
      const [row] = await db
        .insert(sources)
        .values({ name, kind: "ข่าว", licenseNote: "ดึงผ่าน Marketaux (แผนฟรี) — ไม่ copy เนื้อหา แสดงแค่หัวข้อ+ลิงก์กลับต้นฉบับ" })
        .returning({ id: sources.id });
      sourceIdByName.set(name, row.id);
    }

    // เลี่ยงใส่ข่าวซ้ำ เช็ก URL ที่มีอยู่แล้วก่อน
    const urls = articles.map((a) => a.url);
    const existingDocs = urls.length ? await db.select({ url: documents.url }).from(documents).where(inArray(documents.url, urls)) : [];
    const existingUrls = new Set(existingDocs.map((d) => d.url));

    let inserted = 0;
    for (const a of articles) {
      if (existingUrls.has(a.url)) continue;
      const sourceId = sourceIdByName.get(a.sourceName);
      if (!sourceId) continue;
      await db.insert(documents).values({
        sourceId,
        title: a.title,
        url: a.url,
        docType: "news",
        publishedAt: new Date(a.publishedAt),
        retrievedAt: new Date(),
      });
      inserted++;
    }

    return NextResponse.json(
      { ok: true, fetched: articles.length, inserted, skipped: articles.length - inserted },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
