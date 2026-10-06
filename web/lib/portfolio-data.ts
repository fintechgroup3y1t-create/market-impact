// แยกออกจาก lib/data.ts โดยตั้งใจ: ไฟล์นั้น import db/client.ts (postgres driver ใช้ Node built-in เช่น fs/tls)
// ซึ่ง build ไม่ผ่านถ้าถูกดึงเข้า client component (/portfolio ต้องเป็น client component เพื่ออ่าน localStorage)
// ฟังก์ชันในไฟล์นี้อ่านจาก lib/sample/data.ts ล้วน ๆ ไม่แตะฐานข้อมูลเลย จึง import จาก client component ได้ปลอดภัย

import * as sample from "./sample/data";
import type { Company, Evidence, StockUpdate } from "./types";

export function getCompany(ticker: string): Company | undefined {
  return sample.companies.find((c) => c.ticker === ticker);
}

/** หน้าพอร์ต: บันทึกวิเคราะห์รายวันของหุ้นตัวหนึ่ง เขียนโดยทีมงาน/Claude Code ยังไม่มีฐานข้อมูลรองรับ
 * (ข้อมูลตัวอย่างเท่านั้นตอนนี้ เหมือนเนื้อหาเหตุการณ์ก่อนชิ้นที่ 5) เรียงล่าสุดก่อน */
export function getStockUpdates(ticker: string): StockUpdate[] {
  return sample.stockUpdates
    .filter((u) => u.ticker === ticker.toUpperCase())
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** หาหลักฐานจากข้อมูลตัวอย่างเท่านั้น (ไม่ query ฐานข้อมูล) — ใช้คู่กับ getStockUpdates() */
export function getEvidenceSample(ids: string[]): Evidence[] {
  return sample.evidence.filter((e) => ids.includes(e.id));
}
