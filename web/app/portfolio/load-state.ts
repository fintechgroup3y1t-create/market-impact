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
