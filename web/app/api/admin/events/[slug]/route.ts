// PATCH: เปลี่ยนสถานะเหตุการณ์ (อนุมัติ / ส่งกลับไปรอตรวจ)
// body: { "status": "approved" | "pending_review" | "pending_explanation" }

import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db/client";
import { AdminEventError, setEventStatus } from "@/db/admin-events";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  const { slug } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  if (body.status !== "approved" && body.status !== "pending_review" && body.status !== "pending_explanation") {
    return NextResponse.json({ error: 'status ต้องเป็น "approved", "pending_review" หรือ "pending_explanation"' }, { status: 400 });
  }
  try {
    await setEventStatus(slug, body.status);
    return NextResponse.json({ ok: true, slug, status: body.status });
  } catch (err) {
    const message = err instanceof AdminEventError ? err.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

// เปิดผ่านลิงก์เบราว์เซอร์ตรง ๆ ได้ด้วย เช่น .../approve?secret=...
export async function GET(request: Request, { params }: Props) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action !== "approve" && action !== "unapprove") {
    return NextResponse.json({ error: "ใส่ ?action=approve หรือ ?action=unapprove ต่อท้าย" }, { status: 400 });
  }
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  const { slug } = await params;
  try {
    await setEventStatus(slug, action === "approve" ? "approved" : "pending_review");
    return NextResponse.json({ ok: true, slug, status: action === "approve" ? "approved" : "pending_review" });
  } catch (err) {
    const message = err instanceof AdminEventError ? err.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
