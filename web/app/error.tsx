"use client";

import { useEffect } from "react";
import { Footer } from "@/components/Footer";

// Next.js App Router error boundary ของทั้งแอป (ครอบคลุมทุกหน้ายกเว้น root layout เอง)
// เดิมไม่มีไฟล์นี้เลย — ถ้าหน้าใดโยน error ที่ไม่ได้ถูก try/catch ไว้ก่อน (เช่น error ที่ไม่คาดคิดจาก DB/โค้ด)
// ผู้ใช้จะเห็นหน้า error เริ่มต้นของ Next.js (ภาษาอังกฤษ ไม่ตรงดีไซน์) แทน — ขัดกับกฎ "ห้ามทำให้หน้าเว็บพัง" ใน CLAUDE.md
// ที่ต้องการให้เว็บใช้งานได้แม้มีบางส่วนล้มเหลว ไฟล์นี้เป็นตาข่ายนิรภัยชั้นสุดท้าย ไม่ใช่การจัดการ error หลัก
// (DB-touching code ใน lib/data.ts ยังคง try/catch คืน fallback เองเป็นหลักเหมือนเดิม)
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="notfound">
      <h1 className="mood" style={{ fontSize: 30 }}>เกิดข้อผิดพลาดบางอย่าง</h1>
      <p className="muted" style={{ marginTop: 8 }}>หน้านี้โหลดไม่สำเร็จ ลองใหม่อีกครั้ง หรือกลับไปหน้าแรก</p>
      <button type="button" className="cta" onClick={() => reset()} style={{ border: "none", cursor: "pointer" }}>
        ลองใหม่
      </button>
      <Footer />
    </div>
  );
}
