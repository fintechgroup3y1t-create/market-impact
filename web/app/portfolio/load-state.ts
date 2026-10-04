// แยก logic การเปลี่ยนสถานะโหลดของหน้า /portfolio ออกมาเป็นฟังก์ชันล้วน ๆ ให้เทสต์ได้ตรง ๆ
// (ต้องอยู่คนละไฟล์กับ page.tsx เพราะ Next.js App Router จำกัด named export ที่อนุญาตใน page.tsx ไว้ตายตัว
//  export อื่นนอกเหนือจากที่กำหนด เช่น loadReducer จะทำให้ type ที่ Next.js generate ขึ้นพัง)
//
// เดิมหน้า /portfolio ใช้ ref `lastFetchedKey` การ์ดคู่กับ dependency array ของ useEffect เอง — ถ้า effect ถูกยกเลิกกลางคัน
// เช่น React Strict Mode ตอน dev หรือการยกเลิกคำขอใด ๆ ก็ตาม ref จะถูกบันทึกว่า "เคย fetch คีย์นี้แล้ว" ทั้งที่ยังไม่โหลดสำเร็จจริง
// ทำให้การรัน effect ครั้งถัดไปสำหรับคีย์เดิมถูกข้ามไปเงียบ ๆ ไม่ส่ง request ออกเลย ค้างที่ "กำลังโหลด..." ถาวร —
// ตอนนี้ตัด ref ที่การ์ดซ้ำซ้อนออก ให้ dependency array ของ effect ใน page.tsx เป็นผู้ตัดสินแต่เพียงผู้เดียวว่าต้อง fetch ใหม่เมื่อไหร่

import type { PortfolioItem } from "@/app/api/portfolio/route";

export type LoadState = { status: "idle" | "loading" | "error" | "done"; items: PortfolioItem[]; error: string | null };

export type LoadAction =
  | { type: "start" }
  | { type: "success"; items: PortfolioItem[] }
  | { type: "error"; message: string }
  | { type: "empty" };

export function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case "start":
      return { status: "loading", items: state.items, error: null };
    case "success":
      return { status: "done", items: action.items, error: null };
    case "error":
      return { status: "error", items: [], error: action.message };
    case "empty":
      return { status: "done", items: [], error: null };
  }
}

// บั๊กที่พบใน Preview จริงหลังแก้ปัญหา lastFetchedKey ด้านบน (ยืนยันจาก reproduction จริง ไม่ใช่แค่ sandbox นี้):
// fetch() เดิมใน page.tsx ไม่มี timeout ของตัวเองเลย ถ้าคำขอไม่ settle (ไม่ resolve ไม่ reject) — เช่น
// เซิร์ฟเวอร์/connection ค้างโดยไม่ส่ง response กลับมาเลย — ไม่มี path ไหนใน reducer ด้านบนถูกเรียกอีก
// หน้าเว็บค้างที่ "loading" ตลอดไป ไม่มีทางออกให้ผู้ใช้เลยแม้แต่ปุ่มลองใหม่ (เพราะปุ่มโผล่เฉพาะตอน status "error")
//
// ตั้งไว้สูงกว่า maxDuration ของ web/app/api/portfolio/route.ts (30 วิ) อย่างมีนัยสำคัญโดยตั้งใจ:
// ถ้าเซิร์ฟเวอร์ตอบช้าแต่ยังตอบได้ปกติ (ไม่เกิน maxDuration) ต้องไม่ถูกตัดจบก่อนเวลาอันควรจน false-positive
// ค่านี้เป็นแค่ "ทางออกสุดท้าย" กันไม่ให้ค้างตลอดไปจริง ๆ เท่านั้น ไม่ใช่ตัวกำหนดว่า "เร็วแค่ไหนถึงจะถือว่าปกติ"
export const PORTFOLIO_FETCH_TIMEOUT_MS = 35000;

export class FetchTimeoutError extends Error {
  constructor() {
    super(`เซิร์ฟเวอร์ตอบช้าเกินไป (รอเกิน ${PORTFOLIO_FETCH_TIMEOUT_MS / 1000} วินาที) ลองใหม่อีกครั้ง`);
    this.name = "FetchTimeoutError";
  }
}

/**
 * รวมหลาย AbortSignal เป็นอันเดียว (signal ที่ได้จะ abort ทันทีที่ตัวใดตัวหนึ่งใน signals abort)
 * ใช้ `AbortSignal.any` ของจริงถ้ามี (Node >=20.3, Chrome/Edge 116+, Firefox 124+, Safari 17.4+)
 * ถ้าไม่มี (เบราว์เซอร์เก่ากว่านี้ที่ยังมีผู้ใช้จริงอยู่ เช่น iOS ก่อน 17.4) เขียน fallback เองแทน
 * ไม่พึ่ง browser API ใหม่เกินไปจนทำให้ทั้งหน้าใช้งานไม่ได้เลยบนเบราว์เซอร์เก่า — เขียน addEventListener
 * ธรรมดาแทน ให้พฤติกรรมเหมือนกันทุกประการ (reason ของ signal ที่ abort ก่อน ถูกส่งต่อไปยัง signal รวม)
 */
function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any(signals);
  }
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

/**
 * ยิง fetch ไป /api/portfolio พร้อม timeout ของตัวเอง — แยกออกมาเป็นฟังก์ชันล้วน ๆ ไม่พึ่ง React
 * เพื่อให้เทสต์ครบทุกเส้นทาง (สำเร็จ/error/reject/timeout/ถูกยกเลิก) ได้โดยไม่ต้อง render component จริง
 * (repo นี้ไม่มี jsdom/React Testing Library ตั้งใจไม่เพิ่มแพ็กเกจใหม่เพื่อเรื่องนี้)
 *
 * externalSignal: ผู้เรียก (page.tsx) ส่ง signal ของ AbortController ที่ตัวเอง cleanup ตอน dependency
 *   เปลี่ยน/unmount เข้ามา — ถ้า signal นี้ abort ก่อน ฟังก์ชันจะ reject ด้วย reason เดิมของมัน (ปกติคือ
 *   DOMException ชื่อ "AbortError") ผู้เรียกเช็ก err.name/instanceof เพื่อรู้ว่าไม่ใช่ error จริง ไม่ต้องแสดง
 * timeoutMs: ถ้าไม่มี signal ไหน abort และไม่มี response กลับมาภายในเวลานี้ จะ reject ด้วย FetchTimeoutError
 *   ซึ่งแยกแยะได้ชัดเจนจาก AbortError ปกติ ให้ผู้เรียกแสดงเป็น error จริงพร้อมปุ่มลองใหม่ได้
 */
export async function fetchPortfolioItems(
  tickerKey: string,
  externalSignal: AbortSignal,
  timeoutMs: number = PORTFOLIO_FETCH_TIMEOUT_MS,
): Promise<PortfolioItem[]> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new FetchTimeoutError()), timeoutMs);
  const signal = combineAbortSignals([externalSignal, timeoutController.signal]);
  try {
    const res = await fetch(`/api/portfolio?tickers=${encodeURIComponent(tickerKey)}`, { signal });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
    return data.items as PortfolioItem[];
  } finally {
    clearTimeout(timeoutId);
  }
}
