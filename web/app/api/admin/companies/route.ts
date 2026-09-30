// รายชื่อ ticker ที่ครอบคลุม ให้หน้าแอดมินใช้ทำ autocomplete ตอนพิมพ์ ticker ในฟอร์ม
// กันคนพิมพ์ ticker ผิด/เขียนบริษัทที่ไม่มีในระบบ ซึ่งก่อนหน้านี้พิมพ์ผิดแล้วรู้ตัวหลังเผยแพร่ไปแล้วเท่านั้น

import { NextResponse } from "next/server";
import { checkAdminSecret } from "@/lib/admin-auth";
import { companies } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;
  const covered = companies
    .filter((c) => c.covered)
    .map((c) => ({ ticker: c.ticker, name: c.name }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
  return NextResponse.json({ companies: covered }, { headers: { "Cache-Control": "no-store" } });
}
