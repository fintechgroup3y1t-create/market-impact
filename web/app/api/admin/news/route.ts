// รายการข่าวล่าสุดที่ดึงมาเก็บไว้ (ให้แอดมินอ่านประกอบตอนเขียนเหตุการณ์)
// DELETE: ลบข่าวที่ไม่ต้องการออกจากรายการ (เช่น ไม่เกี่ยวข้อง/รกเกินไป) — ลบไม่ได้ถ้าข่าวนั้นถูกผูกเป็นหลักฐานของเหตุการณ์ไปแล้ว (กัน FK พัง)

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
      id: documents.id,
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

export async function DELETE(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  const idParam = new URL(request.url).searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ ok: false, error: "ต้องระบุ id ที่ถูกต้อง" }, { status: 400 });
  }
  const db = getDb();
  try {
    const deleted = await db.delete(documents).where(eq(documents.id, id)).returning({ id: documents.id });
    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "ไม่พบข่าวนี้ (อาจถูกลบไปแล้ว)" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "ลบไม่ได้ เพราะข่าวนี้ถูกผูกเป็นหลักฐานของเหตุการณ์ไปแล้ว" },
      { status: 409 },
    );
  }
}
