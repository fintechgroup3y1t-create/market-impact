import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { lineVar } from "@/components/LineBadge";
import { T } from "@/components/Metric";
import { calendar, getLine, getMetrics } from "@/lib/data";

export const metadata: Metadata = { title: "ปฏิทินเศรษฐกิจ" };

// ตัวเลขมาจากฐานข้อมูล อัปเดตทุกวันผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export default async function CalendarPage() {
  const metrics = await getMetrics();
  const groups = [...new Set(calendar.map((c) => c.group))];
  return (
    <>
      <h1 className="mood" style={{ marginTop: 22, fontSize: 34 }}>
        ตัวเลขที่ตลาด
        <br />
        กำลังรอ
      </h1>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        เวลาประเทศไทย ตารางจากหน่วยงานทางการ แตะแต่ละรายการเพื่อดูว่าตัวเลขส่งผลอย่างไร
      </p>

      {groups.map((g) => (
        <section key={g} aria-label={g}>
          <h2 className="day">{g}</h2>
          {calendar
            .filter((c) => c.group === g)
            .map((c) => {
              const line = getLine(c.lineId);
              return (
                <div key={c.name} className="ev">
                  <div className="meta">
                    <span className="tag" style={c.status === "released" ? { color: "var(--pos)" } : undefined}>{c.importance}</span>
                    <span className="when">{c.when}</span>
                  </div>
                  <div className="nm">{c.name}</div>
                  {line && (
                    <span className="lk" style={{ "--lc": lineVar(line) } as CSSProperties}>
                      <i />
                      อยู่บน{line.name}วันนี้
                    </span>
                  )}
                  <div className="vals">
                    {c.values.map((v) => (
                      <span key={v.label}>
                        {v.label} <b><T text={v.value} metrics={metrics} /></b>
                      </span>
                    ))}
                  </div>
                  <details className="q">
                    <summary>{c.explainer.q}</summary>
                    <div className="ans">
                      {c.explainer.a}
                      {c.explainer.link && (
                        <>
                          {" "}
                          <Link href={c.explainer.link.href}>{c.explainer.link.label}</Link>
                        </>
                      )}
                      <span className="small">{c.explainer.source}</span>
                    </div>
                  </details>
                </div>
              );
            })}
        </section>
      ))}
      <p className="small" style={{ marginTop: 16 }}>ยังไม่แสดงตัวเลขที่ตลาดคาดการณ์ไว้ เพราะเป็นข้อมูลที่ต้องซื้อ จะเพิ่มในเฟสถัดไป</p>
      <Footer />
    </>
  );
}
