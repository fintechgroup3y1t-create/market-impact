"use client";

// หน้าพอร์ต (ส่วน client): อ่าน watchlist จาก localStorage แล้วแสดงต่อหุ้นแต่ละตัว
// "ราคาล่าสุด" ดึงจาก metrics จริง (ฟรี ผ่าน Tiingo ที่ต่อคำนวณทุกคืนอยู่แล้ว ดู /api/cron/prices)
// ครอบคลุมหุ้นที่มีอยู่ทั้ง 35 บริษัทโดยอัตโนมัติ ไม่ต้องเขียนเพิ่มทีละตัว
// ส่วน "ข่าว/มุมมองนักวิเคราะห์/ปฏิทิน/ความเสี่ยง" ยังเป็นเนื้อหาที่ทีมงาน/Claude Code เขียนเพิ่มทีละตัว
// (lib/sample/data.ts: stockUpdates) — ไม่มี AI มาช่วยตีความส่วนนี้ ตามหลักการ "AI เป็นส่วนเสริม"
// แยกเป็น client component เพราะต้องอ่าน localStorage — metrics ถูกดึงฝั่งเซิร์ฟเวอร์ใน page.tsx แล้วส่งเข้ามาเป็น prop
// (เรียกฐานข้อมูลตรงจาก client component ไม่ได้ เพราะ driver ของ Postgres ใช้ Node built-in ที่ bundle ขึ้นเบราว์เซอร์ไม่ได้)

import Link from "next/link";
import { dirClass, T } from "@/components/Metric";
import { WatchlistButton } from "@/components/WatchlistButton";
import { useWatchlist } from "@/components/WatchlistProvider";
import { thaiDayMonth } from "@/lib/format";
import { getCompany, getEvidenceSample, getStockUpdates } from "@/lib/portfolio-data";
import type { MarketMetrics } from "@/lib/types";

export function PortfolioList({ metrics }: { metrics: MarketMetrics }) {
  const { tickers, hydrated } = useWatchlist();

  return (
    <>
      <h1 className="mood" style={{ marginTop: 22, fontSize: 34 }}>
        พอร์ต
        <br />
        ของฉัน
      </h1>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        หุ้นที่คุณติดตามไว้ และการวิเคราะห์รายตัวที่ทีมงานอัปเดต — เก็บรายชื่อไว้ในเบราว์เซอร์นี้เท่านั้น ยังไม่มีระบบสมาชิก
      </p>

      {!hydrated && <p className="muted" style={{ marginTop: 20 }}>กำลังโหลด...</p>}

      {hydrated && tickers.length === 0 && (
        <p className="result-empty" style={{ marginTop: 20 }}>
          ยังไม่มีหุ้นในพอร์ต ไปที่{" "}
          <Link href="/search" style={{ fontWeight: 700 }}>
            หน้าค้นหุ้น
          </Link>{" "}
          แล้วกด &quot;เพิ่มเข้าพอร์ต&quot; ที่หุ้นที่สนใจ
        </p>
      )}

      {hydrated && tickers.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {tickers.map((ticker) => {
            const company = getCompany(ticker);
            const updates = getStockUpdates(ticker);
            const latest = updates[0];
            const retKey = `{{${ticker}.ret_1d}}`;
            const spxKey = "{{SPX.ret_1d}}";
            const abnKey = `{{${ticker}.abn_ret_1d}}`;

            return (
              <section key={ticker} className="sec" style={{ marginTop: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div className="tick" style={{ marginTop: 0, fontSize: 28 }}>{ticker}</div>
                    {company && <p className="small">{company.name}, {company.sector}</p>}
                  </div>
                  <WatchlistButton ticker={ticker} />
                </div>

                {!company?.covered ? (
                  <p className="result-empty" style={{ marginTop: 10 }}>ยังไม่มีข้อมูลรองรับหุ้นตัวนี้ (นอกความครอบคลุม 35 บริษัทปัจจุบัน)</p>
                ) : (
                  <>
                    <h3 style={{ marginTop: 14 }}>ราคาล่าสุด</h3>
                    <div className="list" style={{ marginTop: 6 }}>
                      <div className="stk-row static">
                        <span className="w">{ticker}</span>
                        <b className={dirClass(retKey, metrics)} style={{ width: "auto" }}><T text={retKey} metrics={metrics} /></b>
                      </div>
                      <div className="stk-row static">
                        <span className="w">S&amp;P 500</span>
                        <b className={dirClass(spxKey, metrics)} style={{ width: "auto" }}><T text={spxKey} metrics={metrics} /></b>
                      </div>
                      <div className="stk-row static">
                        <span className="w" style={{ fontWeight: 700 }}>ต่างจากตลาด</span>
                        <b className={dirClass(abnKey, metrics)} style={{ width: "auto" }}><T text={abnKey} metrics={metrics} /></b>
                      </div>
                    </div>
                    <p className="small" style={{ marginTop: 6 }}>ราคาปิดล่าสุด อัปเดตอัตโนมัติทุกคืนหลังตลาดสหรัฐฯ ปิด</p>
                  </>
                )}

                {!latest ? (
                  <p className="result-empty" style={{ marginTop: 14 }}>ยังไม่มีบทวิเคราะห์เชิงลึก (ข่าว/ความเสี่ยง) สำหรับหุ้นตัวนี้ ทีมงานจะทยอยเพิ่ม</p>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <p className="small">บันทึกวิเคราะห์เมื่อ {thaiDayMonth(latest.date)}</p>
                    <p style={{ fontSize: 14, marginTop: 6 }}>{latest.priceNote}</p>

                    {latest.news.length > 0 && (
                      <>
                        <h3 style={{ marginTop: 14 }}>ข่าวสำคัญล่าสุด</h3>
                        <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 14 }}>
                          {latest.news.map((n) => <li key={n} style={{ marginTop: 4 }}>{n}</li>)}
                        </ul>
                      </>
                    )}

                    {latest.analystNotes.length > 0 && (
                      <>
                        <h3 style={{ marginTop: 14 }}>มุมมองนักวิเคราะห์ภายนอก</h3>
                        <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 14 }}>
                          {latest.analystNotes.map((a) => {
                            const sources = getEvidenceSample(a.evidenceIds);
                            return (
                              <li key={a.text} style={{ marginTop: 4 }}>
                                {a.text}
                                {sources.length > 0 && (
                                  <span className="small" style={{ display: "block" }}>
                                    อ้างอิง: {sources.map((s) => s.sourceName).join(", ")}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        <p className="note" style={{ marginTop: 6 }}>
                          เป็นความเห็นของสำนักวิเคราะห์ที่ระบุไว้เท่านั้น ไม่ใช่คำแนะนำของเว็บนี้ และไม่ใช่คำแนะนำให้ซื้อหรือขาย
                        </p>
                      </>
                    )}

                    {latest.calendar.length > 0 && (
                      <>
                        <h3 style={{ marginTop: 14 }}>ปฏิทินที่ต้องจับตา</h3>
                        <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 14 }}>
                          {latest.calendar.map((c) => <li key={c.label} style={{ marginTop: 4 }}>{c.label}: {c.when}</li>)}
                        </ul>
                      </>
                    )}

                    <h3 style={{ marginTop: 14 }}>วิเคราะห์ความเสี่ยง</h3>
                    <p style={{ fontSize: 14 }}>ระดับโดยรวม: {latest.risk.level}</p>
                    <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 14 }}>
                      {latest.risk.points.map((p) => <li key={p} style={{ marginTop: 4 }}>{p}</li>)}
                    </ul>
                    <p style={{ fontSize: 14, marginTop: 8 }}>จุดแข็งที่ช่วยลดความเสี่ยง:</p>
                    <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 14 }}>
                      {latest.risk.strengths.map((s) => <li key={s} style={{ marginTop: 4 }}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="note" style={{ marginTop: 20 }}>
        เนื้อหาในหน้านี้เป็นการสรุปข้อมูล/ข่าวสาธารณะโดยทีมงาน ไม่ใช่คำแนะนำให้ซื้อหรือขาย
      </p>
    </>
  );
}
