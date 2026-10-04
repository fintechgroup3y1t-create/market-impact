import type { Evidence } from "@/lib/types";
import { thaiDateTime } from "@/lib/format";

/** แหล่งอ้างอิง: ทุกรายการแสดงชื่อแหล่ง, ลิงก์, วันที่เผยแพร่ และวันที่ดึงข้อมูล */
export function Sources({ items }: { items: Evidence[] }) {
  if (items.length === 0) {
    // เคสที่เกิดขึ้นได้จริง ไม่ใช่สมมติ: เหตุการณ์ที่สร้างผ่านหน้าแอดมินไม่ได้บังคับว่าต้องมี evidence อย่างน้อย 1 รายการ
    // เดิมไม่มี branch นี้ — รายการว่างแสดงเป็นหัวข้อ "แหล่งอ้างอิง" ลอย ๆ ไม่มีข้อความอะไรต่อ ดูเหมือนหน้าเว็บพัง
    return <p className="result-empty">ยังไม่มีแหล่งอ้างอิงสำหรับเหตุการณ์นี้</p>;
  }
  return (
    <div className="list">
      {items.map((e) => (
        <div key={e.id} className="src-row">
          <div>
            <b>{e.sourceName}</b>
            <br />
            <span className="small">
              {e.kind} {e.note}
            </span>
            <span className="meta">
              {e.publishedAt ? `เผยแพร่ ${thaiDateTime(e.publishedAt)}` : "เผยแพร่ [วันที่ยื่นเอกสาร]"}
              {e.retrievedAt && `, ดึงข้อมูล ${thaiDateTime(e.retrievedAt)}`}
            </span>
          </div>
          {e.url ? (
            <a href={e.url} target="_blank" rel="noopener noreferrer">
              {e.linkLabel}
            </a>
          ) : (
            <span className="nolink">ยังไม่มีลิงก์</span>
          )}
        </div>
      ))}
    </div>
  );
}
