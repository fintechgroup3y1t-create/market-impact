import Link from "next/link";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { ImpactMap } from "@/components/ImpactMap";
import { Journey } from "@/components/Journey";
import { LineBadge, lineVar } from "@/components/LineBadge";
import { Arrowed } from "@/components/Metric";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortfolioEntryCard } from "@/components/WatchlistProvider";
import { allLines, getLine, getMetrics, home, publishedEvents } from "@/lib/data";
import { thaiDateTime, thaiDayMonth } from "@/lib/format";
import { EXPOSURE_SHORT } from "@/lib/labels";

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export default async function HomePage() {
  const metrics = await getMetrics();
  // เหตุการณ์ล่าสุดที่เผยแพร่แล้ว (รวมตัวอย่าง + ฐานข้อมูลจริงผ่าน publishedEvents() เดิม) — ไม่ hard-code
  // เรื่องใหม่ลงหน้านี้ เหตุการณ์ที่เขียนผ่านหน้าแอดมินจะขึ้นมาที่นี่เองโดยเรียงจาก updatedAt ล่าสุด
  const published = await publishedEvents();
  const latestEvent = [...published].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
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
          return (
            <div key={p.metric}>
              <span>{p.label}</span>
              {/* ไม่ใส่สี pos/neg ตรงนี้ เพราะสีนั้นถูกจองไว้แทน Positive/Negative Exposure ของหุ้นแล้ว ใช้ลูกศรบอกทิศทางพอ */}
              <b><Arrowed text={tpl} metrics={metrics} /></b>
            </div>
          );
        })}
      </div>

      <PortfolioEntryCard />

      <ImpactMap lines={allLines()} signs={home.signs} />
      <Journey />

      {latestEvent && (
        <section className="sec">
          <h2>เหตุการณ์ล่าสุด</h2>
          <Link href={`/event/${latestEvent.slug}`} className="item" style={{ display: "block", height: "auto", padding: "14px 16px" }}>
            {getLine(latestEvent.lineId) && <LineBadge line={getLine(latestEvent.lineId)!} />}
            <p className="small" style={{ marginTop: 8 }}>{thaiDateTime(latestEvent.updatedAt)}</p>
            <b style={{ display: "block", marginTop: 4 }}>{latestEvent.title}</b>
            <span className="small" style={{ display: "block", marginTop: 4 }}>{latestEvent.quick.what}</span>
            {latestEvent.impacts.length > 0 && (
              <div className="list" style={{ marginTop: 10 }}>
                {/* หน้าแรกโชว์แค่หุ้นหลักของเรื่อง (quick.tickers) ไม่เอา impacts ทั้งหมดที่สะสมมา
                    ป้องกันรายการยาวเกินไปสำหรับเหตุการณ์ที่ขยายผูกหุ้นเพิ่มทีหลัง (เช่น fed-rate-hike-tech) */}
                {latestEvent.impacts
                  .filter((i) => latestEvent.quick.tickers.includes(i.ticker))
                  .map((i) => (
                  <div key={i.ticker} className="stk-row static">
                    <b>{i.ticker}</b>
                    <span className={`pill ${i.exposure}`}>{EXPOSURE_SHORT[i.exposure]}</span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        </section>
      )}

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
