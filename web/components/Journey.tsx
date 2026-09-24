"use client";

import { useGame } from "./GameProvider";

/** เส้นทางเรียนรู้วันนี้: ภารกิจ 3 สถานี (เฉพาะหน้าแรก) */
export function Journey() {
  const g = useGame();
  const n = Number(g.done.lines) + Number(g.done.quiz) + Number(g.done.evidence);
  const fill = n <= 1 ? 0 : n === 2 ? 50 : 100;
  const quests = [
    { id: "lines" as const, title: `สำรวจครบ ${g.totalLines} สาย`, sub: `${g.seenLines.length} จาก ${g.totalLines}, +40 XP` },
    { id: "quiz" as const, title: "ตอบคำถามทายผล", sub: "+30 XP" },
    { id: "evidence" as const, title: "เปิดดูหลักฐาน", sub: "+10 XP" },
  ];
  return (
    <section className="journey" aria-labelledby="jh">
      <div className="jhead">
        <span className="streak">
          <svg width="18" height="20" viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1C11 6 17 8 17 14a7 7 0 0 1-14 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 1-7 2-10z" fill="#F97316" /><path d="M10 11c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-5z" fill="#FDBA3B" /></svg>
          อ่านต่อเนื่อง {g.streakDays} วัน
        </span>
        <span className="lvl">
          เลเวล {g.level} {g.levelName}
          <br />
          <b>
            {g.xp} / {g.xpGoal} XP
          </b>
        </span>
      </div>
      <p className="jtitle" id="jh">เส้นทางเรียนรู้วันนี้</p>
      <div className="jtrack" aria-hidden="true">
        <span className="jfill" style={{ width: `${fill}%` }} />
        {quests.map((q, i) => (
          <span key={q.id} className={g.done[q.id] ? "jst done" : "jst"} style={{ left: `${i * 50}%` }} />
        ))}
      </div>
      <div className="jlabs">
        {quests.map((q) => (
          <div key={q.id} className={g.done[q.id] ? "ok" : undefined}>
            <b>{q.title}</b>
            <span>
              {q.sub}
              {g.done[q.id] && <span className="sr-only"> (ทำแล้ว)</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
