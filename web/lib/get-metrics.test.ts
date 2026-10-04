import { describe, expect, it, vi } from "vitest";

// เทสต์นี้อยู่คนละไฟล์กับ lib/data.test.ts โดยตั้งใจ — ไฟล์นั้นพึ่งพฤติกรรมจริงของ isDatabaseConfigured()
// (คืน false เพราะไม่มี DATABASE_URL ใน env ของเทสต์) เพื่อตก fallback ไปใช้ sample data โดยไม่แตะ DB เลย
// ถ้า mock @/db/client ไว้ในไฟล์เดียวกันจะไปทับพฤติกรรมนั้นและทำให้เทสต์เดิมพัง จึงแยกไฟล์เพื่อให้ mock
// มีผลแค่ในไฟล์นี้เท่านั้น (vitest แยก module registry ต่อไฟล์เทสต์)
//
// ข้อจำกัดของเทสต์นี้: จำลองว่า getDb().select().from(marketMetrics).orderBy(...) คืนแถวที่เรียง asOfDate
// จากเก่าไปใหม่แล้ว (คือสิ่งที่ ORDER BY asc ควรทำให้จริงบน Postgres จริง) แล้วตรวจว่า loop รวมค่าใน
// getMetrics() เอาค่าของแถวที่มาหลังสุด (asOfDate ใหม่สุด) ไปทับแถวก่อนหน้าเสมอ — ไม่ได้ทดสอบกับฐานข้อมูลจริง
// (sandbox นี้ต่อ Supabase จริงไม่ได้) แค่ยืนยัน "สัญญา" ของฟังก์ชันด้วยข้อมูลจำลองที่เรียงแบบที่ ORDER BY ควรให้มา
const orderByMock = vi.fn(() =>
  Promise.resolve([
    { id: 1, entityKey: "XOM", metric: "ret_1d", value: 1.1, unit: "pct", asOfDate: "2026-09-20", createdAt: new Date() },
    { id: 2, entityKey: "XOM", metric: "ret_1d", value: 2.5, unit: "pct", asOfDate: "2026-09-28", createdAt: new Date() },
    // แถวของวันล่าสุดอยู่หลังสุด (เลียนแบบผลลัพธ์จริงของ ORDER BY asOfDate ASC) ต้องเป็นค่าที่ getMetrics() เลือกใช้
    { id: 3, entityKey: "XOM", metric: "ret_1d", value: 4.2, unit: "pct", asOfDate: "2026-10-04", createdAt: new Date() },
  ]),
);

vi.mock("@/db/client", () => ({
  isDatabaseConfigured: () => true,
  getDb: () => ({
    select: () => ({ from: () => ({ orderBy: orderByMock }) }),
  }),
}));

const { getMetrics } = await import("./data");

describe("getMetrics (regression: ต้องได้ค่าของ asOfDate ล่าสุด ไม่ใช่แถวที่ DB คืนมาเป็นลำดับสุดท้ายโดยบังเอิญ)", () => {
  // รวมสองข้ออ้างไว้ในเทสต์เดียว (ไม่แยก it() หลายตัว) เพราะ getMetrics() ห่อด้วย React cache() —
  // เรียกครั้งที่สองในไฟล์เดียวกันอาจได้ผลลัพธ์ที่แคชไว้จากครั้งแรกโดยไม่เรียก mock ซ้ำจริง ทำให้เช็ก
  // "ถูกเรียกหรือยัง" ในเทสต์ที่สองไม่น่าเชื่อถือ — เช็กทั้งค่าที่ได้และว่า orderBy ถูกเรียกในการเรียกครั้งเดียวกันนี้พอ
  it("เมื่อมีหลายวันสำหรับ entityKey+metric เดียวกัน ต้องได้ค่าของวันที่ล่าสุดเท่านั้น และต้องขอให้ DB เรียง asOfDate ให้ก่อน", async () => {
    const metrics = await getMetrics();
    expect(metrics.XOM?.ret_1d).toEqual({ value: 4.2, unit: "pct" });
    expect(orderByMock).toHaveBeenCalled();
  });
});
