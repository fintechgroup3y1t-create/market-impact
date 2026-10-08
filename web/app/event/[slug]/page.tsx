import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { ChainRoutes } from "@/components/ChainRoutes";
import { DepthProvider, Show } from "@/components/Depth";
import { Footer } from "@/components/Footer";
import { WithGlossary } from "@/components/Glossary";
import { lineVar } from "@/components/LineBadge";
import { T } from "@/components/Metric";
import { Sources } from "@/components/Sources";
import { getEvent, getEvidence, getExposure, getLine, getMetrics } from "@/lib/data";
import { fillTemplate, thaiDateTime } from "@/lib/format";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { ClaimKind } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// ไม่ prerender ตอน build เลย (ต้องคุย DB ข้ามภูมิภาคกับเครื่อง build ของ Vercel ซึ่งช้าเกินเวลาที่กำหนดตอน build)
// หน้าจะสร้างตอนมีคนเข้าดูครั้งแรกแทน แล้วแคชไว้ตาม revalidate ด้านล่าง
export function generateStaticParams() {
  return [];
}
export const dynamicParams = true;

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return { title: e?.title };
}

const CLAIM_LABEL: Record<ClaimKind, { mk: string; name: string }> = {
  fact: { mk: "f", name: "ข้อเท็จจริง" },
  analysis: { mk: "a", name: "การวิเคราะห์" },
  uncertainty: { mk: "u", name: "สิ่งที่อาจทำให้ต่างไป" },
};

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  const line = getLine(event.lineId);
  const [sources, metrics] = await Promise.all([getEvidence(event.evidenceIds), getMetrics()]);

  // หา href ของหน้า "ทำไมถึงเป็นหุ้นตัวนี้" ล่วงหน้าสำหรับทุก ticker ที่ปรากฏในหน้านี้ (chains + impacts)
  const allTickers = [...new Set([...event.chains.map((c) => c.ticker), ...event.impacts.map((i) => i.ticker)])];
  const hrefEntries = await Promise.all(
    allTickers.map(async (ticker) => [ticker, (await getExposure(slug, ticker)) ? `/event/${slug}/stock/${ticker}` : null] as const),
  );
  const hrefs = Object.fromEntries(hrefEntries);
  const stockHref = (ticker: string) => hrefs[ticker] ?? null;

  const claimsWithSources = await Promise.all(
    event.claims.map(async (c) => ({ ...c, sourceNames: (await getEvidence(c.evidenceIds)).map((e) => e.sourceName) })),
  );

  // เติมตัวเลขบนเซิร์ฟเวอร์ก่อนส่งให้ส่วนที่กดสลับได้
  const chains = event.chains.map((c) => ({
    ...c,
    steps: c.steps.map((s) => ({ ...s, desc: fillTemplate(s.desc, metrics) })),
  }));

  return (
    <>
      <BackBar href="/" label="กลับหน้าแรก" line={line} />
      <h1 className="title">{event.title}</h1>
      <p className="small">
        อัปเดต {thaiDateTime(event.updatedAt)}, {sources.length} แหล่งอ้างอิง
      </p>

      <DepthProvider>
        <Show at={["quick"]}>
          <div className="qa-list">
            <div><h3>เกิดอะไรขึ้น</h3><p>{event.quick.what}</p></div>
            <div><h3>ใครได้รับผล</h3><p>{event.quick.who}</p></div>
            <div>
              <h3>หุ้นที่เกี่ยวข้อง</h3>
              <p className="disp" style={{ fontSize: 18, fontWeight: 700 }}>{event.quick.tickers.join(", ")}</p>
            </div>
          </div>
        </Show>

        <Show at={["understand", "deep"]}>
          <div className="qa-list">
            {event.understand.map((qa) => (
              <div key={qa.q}>
                <h3>{qa.q}</h3>
                <p><WithGlossary text={qa.a} term={qa.glossary?.term} /></p>
                {qa.glossary && <p className="def">{qa.glossary.def}</p>}
              </div>
            ))}
          </div>
        </Show>

        {/* เดิมส่วนนี้อยู่ไว้ล่างสุดหลังเส้นทางผลกระทบ+แยกข้อเท็จจริง (ซึ่งแสดงทุกระดับเหมือนกัน)
            ผลคือกด "เข้าใจ" กับ "เจาะลึก" แล้วเห็นเหมือนกันเป๊ะด้านบนจอ ต้องเลื่อนลงไปมากถึงจะเจอความต่าง
            ย้ายมาไว้ติดกับ qa-list เลย ให้กดสลับระดับแล้วเห็นเนื้อหาที่เพิ่มขึ้นทันทีไม่ต้องเลื่อน */}
        <Show at={["deep"]}>
          <section className="sec">
            <h2>เจาะลึก</h2>
            <div className="tl">
              {event.deep.timeline.map((t) => (
                <div key={t.when + t.text} className="row">
                  <span className="when">{t.when}</span>
                  <span><T text={t.text} metrics={metrics} /></span>
                </div>
              ))}
            </div>
            <details className="q" open>
              <summary>ในอดีตเกิดอะไรขึ้นในสถานการณ์คล้ายกัน</summary>
              <div className="ans">
                <T text={event.deep.history.text} metrics={metrics} />
                <span className="small">{event.deep.history.note}</span>
              </div>
            </details>
            <details className="q">
              <summary>สิ่งที่ควรติดตามต่อ</summary>
              <div className="ans">{event.deep.watch}</div>
            </details>
          </section>
        </Show>

        {/* ก่อนหน้านี้ 5 ส่วนนี้ (เส้นทางผลกระทบ, แยกข้อเท็จจริง, FAQ, หุ้นที่ได้รับผล, แหล่งอ้างอิง)
            แสดงทุกระดับเหมือนกันหมด ทำให้กด "เร็ว" (สัญญาไว้ 15 วิ) แล้วยังเจอหน้ายาวเท่าเดิม
            ตอนนี้ครอบด้วย Show ให้ "เร็ว" เหลือแค่ qa-list ด้านบนจริงๆ ส่วน "เข้าใจ"/"เจาะลึก" เห็นครบเหมือนเดิม
            แหล่งอ้างอิงยังคงแสดงทุกระดับเสมอ (อยู่นอก DepthProvider) เพราะเป็นหลักฐานพื้นฐานที่ไม่ควรซ่อน */}
        <Show at={["understand", "deep"]}>
          <section className="sec">
            <h2>เส้นทางผลกระทบ</h2>
            <ChainRoutes chains={chains} lineColor={lineVar(line) ?? "var(--a)"} stockHref={hrefs} />
            <div className="keys">
              <span><i />เส้นทึบ หลักฐานแข็งแรง</span>
              <span><i className="d" />เส้นประ มีปัจจัยที่อาจทำให้ผลต่างไป</span>
            </div>
          </section>

          <section className="sec">
            <h2>แยกให้ชัดว่าอะไรคือข้อเท็จจริง</h2>
            <div className="fau">
              {claimsWithSources.map((c) => (
                <div key={c.text} className="r">
                  <span className={`mk ${CLAIM_LABEL[c.kind].mk}`} aria-hidden="true" />
                  <div>
                    <div className="k">{CLAIM_LABEL[c.kind].name}</div>
                    <p><T text={c.text} metrics={metrics} /></p>
                    {c.note && <p className="s2">{c.note}</p>}
                    {c.sourceNames.length > 0 && <p className="s2">หลักฐาน: {c.sourceNames.join(", ")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sec">
            <h2>คำถามที่คนถามบ่อย</h2>
            {event.faq.map((f) => (
              <details key={f.q} className="q">
                <summary>{f.q}</summary>
                <div className="ans">
                  {f.a}
                  {f.link && (
                    <>
                      {" "}
                      <Link href={f.link.href}>{f.link.label}</Link>
                    </>
                  )}
                  {f.evidenceNote && <span className="small">{f.evidenceNote}</span>}
                </div>
              </details>
            ))}
            <p className="small" style={{ marginTop: 8 }}>คำตอบเตรียมไว้ล่วงหน้าและตรวจโดยทีมงาน</p>
          </section>

          <section className="sec">
            <h2>หุ้นที่ได้รับผล</h2>
            <div className="list">
              {event.impacts.map((i) => {
                const href = stockHref(i.ticker);
                const inner = (
                  <>
                    <b>{i.ticker}</b>
                    <span className="w">{i.reason}</span>
                    <span className={`pill ${i.exposure}`}>{EXPOSURE_SHORT[i.exposure]}</span>
                  </>
                );
                return href ? (
                  <Link key={i.ticker} className="stk-row" href={href}>{inner}</Link>
                ) : (
                  <div key={i.ticker} className="stk-row static">{inner}</div>
                );
              })}
            </div>
            {event.impacts.some((i) => !stockHref(i.ticker)) && (
              <p className="small" style={{ marginTop: 8 }}>หุ้นที่ไม่มีลิงก์ ยังไม่มีหน้าหลักฐานละเอียดในข้อมูลตัวอย่าง</p>
            )}
          </section>
        </Show>
      </DepthProvider>

      <section className="sec" id="sources">
        <h2>แหล่งอ้างอิง</h2>
        <Sources items={sources} />
      </section>
      <Footer />
    </>
  );
}
