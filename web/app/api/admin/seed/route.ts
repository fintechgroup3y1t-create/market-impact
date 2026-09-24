// ใส่ข้อมูลตั้งต้น (factors, บริษัท, เนื้อหาเหตุการณ์ตัวอย่าง) ลงฐานข้อมูลผ่าน HTTPS
// รันซ้ำได้ปลอดภัย เรียกได้เฉพาะคนที่มี ADMIN_SECRET เท่านั้น (ดู lib/admin-auth.ts)

import { NextResponse } from "next/server";
import { runSeed } from "@/db/seed";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  try {
    await runSeed(getDb());
    return NextResponse.json({ ok: true, message: "ใส่ข้อมูลตั้งต้นเรียบร้อย" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
