import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Fragment } from "react";
import { BackBar } from "@/components/BackBar";
import { Footer } from "@/components/Footer";
import { dirClass, T } from "@/components/Metric";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getCompany, getEvent, getExposure, getLine, getMetrics } from "@/lib/data";
import { EXPOSURE_LONG } from "@/lib/labels";

type Props = { params: Promise<{ slug: string; ticker: string }> };

// ไม่ prerender ตอน build เลย (ต้องคุย DB ข้ามภูมิภาคกับเครื่อง build ของ Vercel ซึ่งช้าเกินเวลาที่กำหนดตอน build)
// หน้าจะสร้างตอนมีคนเข้าดูครั้งแรกแทน แล้วแคชไว้ตาม revalidate ด้านล่าง
export function generateStaticParams() {
  return [];
}
export const dynamicParams = true;

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  return { title: `ทำไมถึงเป็น ${ticker}` };
}

export default async function WhyStockPage({ params }: Props) {
  const { slug, ticker } = await params;
  const [event, x] = await Promise.all([getEvent(slug), getExposure(slug, ticker)]);
  const company = getCompany(ticker);
  if (!event || !x || !company) notFound();
  const line = getLine(event.lineId);
  const ec = `var(--${x.exposure})`;
  const supporting = x.layers.filter((l) => l.signal === "support").length;
  const metrics = await getMetrics();

  return (
    <>
      <BackBar href={`/event/${slug}`} label="กลับไปหน้าเหตุการณ์" line={line} />
      <p className="small" style={{ marginTop: 14 }}>ทำไมเราถึงแสดงหุ้นตัวนี้</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h1 className="tick">{company.ticker}</h1>
        <WatchlistButton ticker={company.ticker} />
      </div>
      <p style={{ marginTop: 6 }}>
        {company.name}, {company.sector}
      </p>

      <div className="conf" style={{ "--ec": ec } as CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span className={`pill ${x.exposure}`}>{EXPOSURE_LONG[x.exposure]}</span>
          <b style={{ fontSize: 14 }}>ความมั่นใจ {x.confidence}</b>
        </div>
        <div className="confline" aria-label={`หลักฐาน ${supporting} จาก ${x.layers.length} ชั้นสนับสนุน`} role="img">
          {x.layers.map((l, i) => {
            const offset = l.signal === "offset";
            return (
              <Fragment key={l.title}>
                {i > 0 && <span className={offset ? "g o" : "g"} />}
                <span className={offset ? "n o" : "n"} />
              </Fragment>
            );
          })}
        </div>
        <p style={{ fontSize: 14 }}>{x.summary}</p>
      </div>

      <section className="sec">
        <h2>หลักฐานทีละชั้น</h2>
        {x.layers.map((l) => (
          <div key={l.title} className="layer">
            {l.signal === "support" ? <span className="mk f" style={{ background: ec }} /> : <span className="mk u" />}
            <div>
              <b>{l.title}</b>
              {l.text && <p style={{ fontSize: 14 }}>{l.text}</p>}
              {l.kv?.map((kv) => (
                <div key={kv.k} className="kv">
                  <span className="muted">{kv.k}</span>
                  <b><T text={kv.v} metrics={metrics} /></b>
                </div>
              ))}
              {l.glossary && (
                <p className="def">
                  <b>{l.glossary.term}</b> {l.glossary.def}
                </p>
              )}
              {l.link && (
                <Link href={l.link.href} style={{ fontSize: 13, fontWeight: 600, display: "inline-flex", minHeight: 40, alignItems: "center" }}>
                  {l.link.label}
                </Link>
              )}
              {l.note && <p className="small" style={l.glossary ? { marginTop: 6 } : undefined}>{l.note}</p>}
            </div>
          </div>
        ))}
      </section>

      <section className="sec">
        <h2>ตลาดวันนี้</h2>
        <div className="list">
          {x.today.map((r) => (
            <div key={r.label} className="stk-row static">
              <span className="w" style={{ color: "var(--ink)", fontWeight: r.emphasis ? 700 : undefined }}>{r.label}</span>
              <b className={dirClass(r.value, metrics)} style={{ width: "auto" }}>
                <T text={r.value} metrics={metrics} />
              </b>
            </div>
          ))}
        </div>
        <p className="small" style={{ marginTop: 8 }}>
          &quot;ต่างจากตลาด&quot; คือผลตอบแทนส่วนที่ต่างจากดัชนี S&amp;P 500 (abnormal return) คำนวณโดยระบบ การเคลื่อนไหวนี้เกิดขึ้นพร้อมกับเหตุการณ์ แต่ไม่ได้พิสูจน์ว่าเหตุการณ์เป็นสาเหตุ
        </p>
      </section>

      <p className="note">เราอธิบายว่าหุ้นตัวนี้เกี่ยวข้องกับเหตุการณ์อย่างไร ไม่ได้บอกว่าหุ้นจะขึ้นหรือลง และไม่ใช่คำแนะนำให้ซื้อหรือขาย</p>
      <Footer />
    </>
  );
}
