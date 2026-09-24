// รายการข่าวล่าสุดที่ดึงมาเก็บไว้ (ให้แอดมินอ่านประกอบตอนเขียนเหตุการณ์)

import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { documents, sources } from "@/db/schema";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  const db = getDb();
  const rows = await db
    .select({
      title: documents.title,
      url: documents.url,
      publishedAt: documents.publishedAt,
      retrievedAt: documents.retrievedAt,
      sourceName: sources.name,
    })
    .from(documents)
    .innerJoin(sources, eq(documents.sourceId, sources.id))
    .where(eq(documents.docType, "news"))
    .orderBy(desc(documents.publishedAt))
    .limit(50);
  return NextResponse.json({ news: rows }, { headers: { "Cache-Control": "no-store" } });
}
