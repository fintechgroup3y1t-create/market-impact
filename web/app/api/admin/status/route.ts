// เช็กสถานะเซิร์ฟเวอร์จริงจากภายนอกผ่าน HTTPS (ใช้ตอนตั้งค่าครั้งแรก ไม่โชว์ข้อมูลลับ)

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { entities, events, marketMetrics } from "@/db/schema";
import { checkAdminSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkAdminSecret(request);
  if (denied) return denied;

  const result: Record<string, unknown> = {
    databaseUrlSet: isDatabaseConfigured(),
    tiingoKeySet: Boolean(process.env.TIINGO_API_KEY),
    cronSecretSet: Boolean(process.env.CRON_SECRET),
  };

  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      await db.execute(sql`select 1`);
      result.databaseReachable = true;
      result.tableCounts = {
        events: (await db.select().from(events)).length,
        entities: (await db.select().from(entities)).length,
        marketMetrics: (await db.select().from(marketMetrics)).length,
      };
    } catch (err) {
      result.databaseReachable = false;
      result.databaseError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(result);
}
