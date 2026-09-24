// รันเฉพาะตอนตั้งฐานข้อมูลครั้งแรก (สร้างตารางทั้งหมดจาก db/migrations/)
// เรียกผ่าน HTTPS แทนการต่อฐานข้อมูลโดยตรง เพราะรันจากเซิร์ฟเวอร์ Vercel ซึ่งต่อฐานข้อมูลได้
// เรียกได้เฉพาะคนที่มี ADMIN_SECRET เท่านั้น (ดู lib/admin-auth.ts)

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handler(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  try {
    await migrate(getDb(), { migrationsFolder: "./db/migrations" });
    return NextResponse.json({ ok: true, message: "สร้าง/อัปเดตตารางในฐานข้อมูลเรียบร้อย" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export const POST = handler;
export const GET = handler; // เปิดลิงก์ตรง ๆ ในเบราว์เซอร์ได้ (มีค่า ?secret=... ต่อท้าย)
