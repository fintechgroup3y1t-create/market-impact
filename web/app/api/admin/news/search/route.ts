// ค้นข่าวด้วยคำสำคัญทั่วไป (ไม่ผูกกับ ticker) เช่น "flood", "Thailand flooding"
// ใช้ตอนเจ้าของอยากหาข่าวเรื่องที่ยังไม่รู้ว่ากระทบหุ้นตัวไหน (ต่างจากปุ่ม "ดึงข่าวใหม่ตอนนี้" เดิมที่ดึงตาม ticker หลัก ๆ)
// บันทึกลง documents เหมือนข่าวปกติ เพื่อให้คัดลอกลิงก์ไปใส่ในฟอร์มเขียนเหตุการณ์ได้ทันที

import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { fetchLatestNews, saveArticlesToDb, MarketauxError } from "@/lib/news/marketaux";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "ต้องระบุคำค้น (q)" }, { status: 400 });

  const db = getDb();
  try {
    const articles = await fetchLatestNews(10, null, q);
    const { insertedUrls } = await saveArticlesToDb(db, articles);
    return NextResponse.json(
      { ok: true, query: q, results: articles, inserted: insertedUrls.size },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const message = err instanceof MarketauxError ? err.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
