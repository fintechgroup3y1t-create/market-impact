// GET: รายการเหตุการณ์ทุกสถานะ (สำหรับหน้าแอดมิน)
// POST: สร้างเหตุการณ์ใหม่ (สถานะเริ่มต้น "รอตรวจ" เสมอ ต้องกดอนุมัติแยกที่ /api/admin/events/[slug])

import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db/client";
import { createEvent, AdminEventError, type NewEventPayload } from "@/db/admin-events";
import { allEventsAnyStatus, getEvidence } from "@/lib/data";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  const events = await allEventsAnyStatus();
  const summary = await Promise.all(
    events.map(async (e) => ({
      slug: e.slug,
      title: e.title,
      lineId: e.lineId,
      reviewStatus: e.reviewStatus,
      updatedAt: e.updatedAt,
      tickers: e.quick.tickers,
      // สำหรับเหตุการณ์ร่างที่ระบบตรวจจับอัตโนมัติสร้างไว้ (สถานะ "รอคำอธิบาย") — ข่าว/หลักฐานที่ระบบหาให้แล้ว
      evidence:
        e.reviewStatus === "pending_explanation"
          ? (await getEvidence(e.evidenceIds)).map((ev) => ({ sourceName: ev.sourceName, url: ev.url, kind: ev.kind }))
          : [],
    })),
  );
  return NextResponse.json({ events: summary }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  let payload: NewEventPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  try {
    const result = await createEvent(payload);
    return NextResponse.json({ ok: true, ...result, message: "สร้างเหตุการณ์แล้ว สถานะ: รอตรวจ" });
  } catch (err) {
    const message = err instanceof AdminEventError ? err.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
