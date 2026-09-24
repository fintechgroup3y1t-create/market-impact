import type { Exposure } from "./types";

/** ป้ายสั้นบนแผนที่และรายการ */
export const EXPOSURE_SHORT: Record<Exposure, string> = { pos: "บวก", neg: "ลบ", mix: "ผสม" };

/** ป้ายเต็ม ใช้คำนี้เท่านั้น ห้ามใช้ "จะขึ้น" "จะลง" "ควรซื้อ" */
export const EXPOSURE_LONG: Record<Exposure, string> = {
  pos: "Positive Exposure",
  neg: "Negative Exposure",
  mix: "Mixed Exposure",
};
