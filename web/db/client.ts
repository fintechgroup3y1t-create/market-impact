// จุดเดียวที่เชื่อมต่อฐานข้อมูล
// สำคัญ: ไม่เชื่อมต่อจริงตอน import (postgres.js ต่อแบบ lazy) เพื่อไม่ให้ build บน Vercel พังถ้ายังไม่ตั้งค่า
// DATABASE_URL — เว็บต้องขึ้นได้แม้ยังไม่ได้ตั้งฐานข้อมูล (ดู "AI เป็นส่วนเสริม" ใน CLAUDE.md ที่ใช้หลักการเดียวกัน)

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** เรียกเฉพาะตอนต้องอ่าน/เขียนฐานข้อมูลจริง ๆ เท่านั้น */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "ไม่พบ DATABASE_URL ตั้งค่าใน .env.local (ระหว่างพัฒนา) หรือ Vercel Environment Variables (บนเว็บจริง)",
    );
  }
  if (!dbInstance) {
    client = postgres(process.env.DATABASE_URL, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}
