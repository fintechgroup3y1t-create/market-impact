"use client";

import { useGame } from "./GameProvider";

/** เส้นทางเรียนรู้วันนี้: ภารกิจ 2 สถานี (เฉพาะหน้าแรก) */
export function Journey() {
  const g = useGame();
  // เอา "ทายก่อนอ่าน" ออกจากหน้าแรกแล้ว ภารกิจเหลือ 2 สถานี (เดิม 3 รวม quiz)
  const n = Number(g.done.lines) + Number(g.done.evidence);
  // เดิมคำนวณจากลำดับตายตัว (ทำ 1 อย่าง = 0%) แต่ภารกิจทำสลับลำดับได้ เลยคิดตามสัดส่วนที่ทำจริงแทน
  const fill = (n / 2) * 100;
  const quests = [
    { id: "lines" as const, title: `สำรวจครบ ${g.totalLines} สาย`, sub: `${g.seenLines.length} จาก ${g.totalLines}, +40 XP`, href: "#maph" },
    // เปิดดูหลักฐานทำได้จากหลายหน้า (หน้าหุ้นแต่ละตัว) ไม่มีจุดเดียวในหน้าแรกให้ลิงก์ไป
    { id: "evidence" as const, title: "เปิดดูหลักฐาน", sub: "+10 XP", href: undefined as string | undefined },
  ];
  return (
    <section className="journey" aria-labelledby="jh">
      <p className="jtitle" id="jh">เส้นทางเรียนรู้วันนี้</p>
      <div className="jtrack" aria-hidden="true">
        <span className="jfill" style={{ transform: `scaleX(${fill / 100})` }} />
        {quests.map((q, i) => (
          <span key={q.id} className={g.done[q.id] ? "jst done" : "jst"} style={{ left: `${(i / (quests.length - 1)) * 100}%` }} />
        ))}
      </div>
      <div className="jlabs">
        {quests.map((q) => {
          const inner = (
            <>
              <b>{g.done[q.id] && "✓ "}{q.title}</b>
              <span>
                {q.sub}
                {g.done[q.id] && <span className="sr-only"> (ทำแล้ว)</span>}
              </span>
            </>
          );
          return q.href ? (
            <a key={q.id} href={q.href} className={g.done[q.id] ? "ok" : undefined}>{inner}</a>
          ) : (
            <div key={q.id} className={g.done[q.id] ? "ok" : undefined}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
