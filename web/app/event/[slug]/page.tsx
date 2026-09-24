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
import { getEvent, getEvidence, getExposure, getLine, metrics, publishedEvents } from "@/lib/data";
import { fillTemplate, thaiTime } from "@/lib/format";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { ClaimKind } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedEvents().map((e) => ({ slug: e.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getEvent((await params).slug);
  return { title: e?.title };
}

const CLAIM_LABEL: Record<ClaimKind, { mk: string; name: string }> = {
  fact: { mk: "f", name: "ข้อเท็จจริง" },
  analysis: { mk: "a", name: "การวิเคราะห์" },
  uncertainty: { mk: "u", name: "สิ่งที่อาจทำให้ต่างไป" },
};

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  const line = getLine(event.lineId);
  const sources = getEvidence(event.evidenceIds);
  const stockHref = (ticker: string) => (getExposure(slug, ticker) ? `/event/${slug}/stock/${ticker}` : null);

  // เติมตัวเลขบนเซิร์ฟเวอร์ก่อนส่งให้ส่วนที่กดสลับได้
  const chains = event.chains.map((c) => ({
    ...c,
    steps: c.steps.map((s) => ({ ...s, desc: fillTemplate(s.desc, metrics) })),
  }));
  const hrefs = Object.fromEntries(event.chains.map((c) => [c.ticker, stockHref(c.ticker)]));

  return (
    <>
      <BackBar href="/" label="กลับหน้าแรก" line={line} />
      <h1 className="title">{event.title}</h1>
      <p className="small">
        อัปเดต {thaiTime(event.updatedAt)}, {sources.length} แหล่งอ้างอิง, ตรวจโดยทีมงานแล้ว
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
            {event.claims.map((c) => (
              <div key={c.text} className="r">
                <span className={`mk ${CLAIM_LABEL[c.kind].mk}`} aria-hidden="true" />
                <div>
                  <div className="k">{CLAIM_LABEL[c.kind].name}</div>
                  <p><T text={c.text} /></p>
                  {c.note && <p className="s2">{c.note}</p>}
                  {c.evidenceIds.length > 0 && (
                    <p className="s2">
                      หลักฐาน: {getEvidence(c.evidenceIds).map((e) => e.sourceName).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Show at={["deep"]}>
          <section className="sec">
            <h2>เจาะลึก</h2>
            <div className="tl">
              {event.deep.timeline.map((t) => (
                <div key={t.when + t.text} className="row">
                  <span className="when">{t.when}</span>
                  <span><T text={t.text} /></span>
                </div>
              ))}
            </div>
            <details className="q" open>
              <summary>ในอดีตเกิดอะไรขึ้นในสถานการณ์คล้ายกัน</summary>
              <div className="ans">
                <T text={event.deep.history.text} />
                <span className="small">{event.deep.history.note}</span>
              </div>
            </details>
            <details className="q">
              <summary>สิ่งที่ควรติดตามต่อ</summary>
              <div className="ans">{event.deep.watch}</div>
            </details>
          </section>
        </Show>
      </DepthProvider>

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

      <section className="sec" id="sources">
        <h2>แหล่งอ้างอิง</h2>
        <Sources items={sources} />
      </section>
      <Footer />
    </>
  );
}
