// Portfolio Impact: หน้า "พอร์ตของฉัน"
// เดิมหน้านี้เป็น client component ล้วน ๆ (ดึงเหตุการณ์ที่เกี่ยวข้องผ่าน /api/portfolio — ดู git history)
// เปลี่ยนตามคำขอของเจ้าของ (6 ต.ค. 2569): ตัดส่วน "เหตุการณ์ที่เกี่ยวข้อง" ออก เปลี่ยนเป็นหน้าวิเคราะห์หุ้นรายตัว
// "ราคาล่าสุด" ต้องดึง metrics จริงจากฐานข้อมูล (ฟรี ผ่าน Tiingo ที่มีอยู่แล้ว ไม่ใช้ AI) ซึ่งทำได้เฉพาะฝั่งเซิร์ฟเวอร์เท่านั้น
// (driver ของ Postgres ใช้ Node built-in ที่ bundle เข้า client component ไม่ได้) — จึงแยกเป็น 2 ชั้น:
// ไฟล์นี้ (server component) ดึง metrics แล้วส่งเข้า PortfolioList (client component) ที่อ่าน watchlist จาก localStorage

import { Footer } from "@/components/Footer";
import { PortfolioList } from "@/components/PortfolioList";
import { getMetrics } from "@/lib/data";

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export default async function PortfolioPage() {
  const metrics = await getMetrics();
  return (
    <>
      <PortfolioList metrics={metrics} />
      <Footer />
    </>
  );
}
