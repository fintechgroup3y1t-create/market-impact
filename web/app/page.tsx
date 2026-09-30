import Link from "next/link";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { ImpactMap } from "@/components/ImpactMap";
import { Journey } from "@/components/Journey";
import { lineVar } from "@/components/LineBadge";
import { Arrowed, dirClass } from "@/components/Metric";
import { Quiz } from "@/components/Quiz";
import { ThemeToggle } from "@/components/ThemeToggle";
import { allLines, getLine, getMetrics, home } from "@/lib/data";
import { thaiDayMonth } from "@/lib/format";

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export default async function HomePage() {
  const metrics = await getMetrics();
  return (
    <>
      <header className="top">
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 4V26" stroke="var(--a)" strokeWidth="4" strokeLinecap="round" /><path d="M15 4V14L24 23V26" stroke="var(--b)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx="6" cy="15" r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" /><circle cx="15" cy="10" r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" /></svg>
          Market Impact
        </div>
        <div className="actions">
          <ThemeToggle />
          <Link href="/search" className="iconbtn" aria-label="ค้นหาหุ้น">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </Link>
        </div>
      </header>

      <p className="date">{thaiDayMonth(home.asOf)} · ราคาปิดล่าสุด อัปเดตทุกคืนหลังตลาดสหรัฐฯ ปิด</p>
      <h1 className="mood">{home.mood}</h1>

      <div className="pulse" aria-label="ภาพรวมตลาด ราคาปิดล่าสุด">
        {home.pulse.map((p) => {
          const tpl = `{{${p.metric}}}`;
          const colored = !p.metric.endsWith("_bps"); // ผลตอบแทนพันธบัตรไม่ใส่สีตามดีไซน์
          return (
            <div key={p.metric}>
              <span>{p.label}</span>
              <b className={colored ? dirClass(tpl, metrics) : undefined}>
                <Arrowed text={tpl} metrics={metrics} />
              </b>
            </div>
          );
        })}
      </div>

      {/* ทายก่อนอ่านมาก่อนแผนที่เสมอ ไม่งั้นแผนที่จะเฉลยคำตอบให้ก่อนถาม */}
      <Quiz quiz={home.quiz} />
      <ImpactMap lines={allLines()} signs={home.signs} />
      <Journey />

      <section className="sec">
        <h2>เรื่องอื่นที่ควรรู้</h2>
        <div className="list">
          {home.others.map((o) => {
            const style = { "--lc": lineVar(getLine(o.lineId)) } as CSSProperties;
            const inner = (
              <>
                <span className="bar" style={style} />
                <div>
                  <b>{o.title}</b>
                  <span className="small">{o.sub}</span>
                </div>
              </>
            );
            return o.href ? (
              <Link key={o.title} className="item" href={o.href}>
                {inner}
              </Link>
            ) : (
              <div key={o.title} className="item">
                {inner}
              </div>
            );
          })}
        </div>
      </section>
      <Footer extra="XP ได้จากการเรียนรู้และเปิดดูหลักฐาน ไม่เกี่ยวกับการซื้อขายหุ้น" />
    </>
  );
}
