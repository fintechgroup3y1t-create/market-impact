"use client";

// หน้าแอดมิน: คิวอนุมัติเหตุการณ์ + ดูข่าวที่ดึงมา + เขียนเหตุการณ์ใหม่เอง (วาง JSON)
// ป้องกันด้วยรหัสผ่านเดียวกับที่ใช้ตั้งค่าฐานข้อมูล (ADMIN_SECRET) เก็บไว้ใน sessionStorage ของเบราว์เซอร์เท่านั้น

import { useEffect, useState } from "react";

const STORAGE_KEY = "mi_admin_secret";

interface EventSummary {
  slug: string;
  title: string;
  lineId: string;
  reviewStatus: "pending_explanation" | "pending_review" | "approved";
  updatedAt: string;
  tickers: string[];
  evidence: { sourceName: string; url: string | null; kind: string }[];
}

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  sourceName: string;
}

const STATUS_LABEL: Record<EventSummary["reviewStatus"], string> = {
  pending_explanation: "รอคำอธิบาย",
  pending_review: "รอตรวจ",
  approved: "เผยแพร่แล้ว",
};

const SAMPLE_TEMPLATE = `{
  "slug": "example-event-slug-2",
  "lineId": "oil",
  "title": "หัวข้อเหตุการณ์",
  "quick": { "what": "เกิดอะไรขึ้น (สั้น ๆ)", "who": "ใครได้รับผล", "tickers": ["XOM"] },
  "understand": [ { "q": "หัวข้อคำถาม", "a": "คำตอบ" } ],
  "deep": { "timeline": [], "history": { "text": "", "note": "" }, "watch": "" },
  "faq": [ { "q": "คำถาม", "a": "คำตอบ", "evidenceNote": "" } ],
  "evidence": [ { "key": "ev1", "sourceName": "ชื่อแหล่งข่าว", "kind": "ข่าว", "note": "", "url": "https://...", "linkLabel": "อ่านต้นฉบับ", "publishedAt": "2026-09-24T10:00:00+07:00", "retrievedAt": "2026-09-24T10:05:00+07:00" } ],
  "claims": [ { "kind": "fact", "text": "ข้อความ ใส่ตัวเลขผ่าน {{XOM.ret_1d}} เท่านั้น", "evidenceKeys": ["ev1"] } ],
  "chains": [],
  "impacts": [ { "ticker": "XOM", "exposure": "pos", "reason": "เหตุผลสั้น ๆ" } ]
}`;

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [jsonInput, setJsonInput] = useState(SAMPLE_TEMPLATE);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setSecret(saved);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  function headers() {
    return { "x-admin-secret": secret };
  }

  async function refresh() {
    setMessage(null);
    try {
      const [eventsRes, newsRes] = await Promise.all([
        fetch("/api/admin/events", { headers: headers() }),
        fetch("/api/admin/news", { headers: headers() }),
      ]);
      if (eventsRes.status === 401 || newsRes.status === 401) {
        setUnlocked(false);
        sessionStorage.removeItem(STORAGE_KEY);
        setMessage("รหัสผ่านไม่ถูกต้อง");
        return;
      }
      const eventsData = await eventsRes.json();
      const newsData = await newsRes.json();
      setEvents(eventsData.events ?? []);
      setNews(newsData.news ?? []);
    } catch (err) {
      setMessage(`โหลดข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function unlock() {
    sessionStorage.setItem(STORAGE_KEY, secret);
    setUnlocked(true);
  }

  async function setStatus(slug: string, status: EventSummary["reviewStatus"]) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${slug}`, {
        method: "PATCH",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      setMessage(`อัปเดต ${slug} เป็น "${STATUS_LABEL[status]}" แล้ว`);
      await refresh();
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function createEvent() {
    setBusy(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      setMessage(`สร้างเหตุการณ์ "${data.slug}" แล้ว ขึ้นเว็บจริงทันที (กด "ถอดออกจากเว็บ" ด้านบนได้ถ้าต้องการแก้ไข)`);
      await refresh();
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function fetchNewsNow() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cron/news`, { headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      setMessage(`ดึงข่าวสำเร็จ: พบ ${data.fetched} รายการ, เพิ่มใหม่ ${data.inserted} รายการ`);
      await refresh();
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
        <h1 className="mood" style={{ fontSize: 26 }}>หน้าแอดมิน</h1>
        <div className="field">
          <label htmlFor="secret">รหัสผ่าน (ADMIN_SECRET)</label>
          <input id="secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} />
        </div>
        <button type="button" className="cta" style={{ marginTop: 16, width: "100%", border: "none", cursor: "pointer" }} onClick={unlock}>
          เข้าสู่ระบบ
        </button>
        {message && <p className="small" style={{ marginTop: 12, color: "var(--neg)" }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 80px" }}>
      <h1 className="mood" style={{ fontSize: 28 }}>หน้าแอดมิน</h1>
      <p className="small">เหตุการณ์ที่เขียนใหม่ขึ้นเว็บจริงทันที (ไม่ต้องกดอนุมัติ) — เฉพาะเจ้าของ</p>
      {message && <div className="def" style={{ marginTop: 12 }}>{message}</div>}

      <section className="sec">
        <h2>เหตุการณ์ทั้งหมด</h2>
        {!events ? (
          <p className="muted">กำลังโหลด...</p>
        ) : events.length === 0 ? (
          <p className="muted">ยังไม่มีเหตุการณ์</p>
        ) : (
          <div className="list">
            {events.map((e) => (
              <div key={e.slug} className="item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <b>{e.title}</b>
                  <span className={`pill ${e.reviewStatus === "approved" ? "pos" : e.reviewStatus === "pending_review" ? "mix" : "neg"}`}>
                    {STATUS_LABEL[e.reviewStatus]}
                  </span>
                </div>
                <span className="small">
                  {e.slug} · สาย {e.lineId} · หุ้น {e.tickers.join(", ") || "-"}
                </span>
                {e.reviewStatus === "pending_explanation" && e.evidence.length > 0 && (
                  <div className="def" style={{ padding: 10 }}>
                    <b className="small">ข่าวที่ระบบดึงมาให้อัตโนมัติ (ยังไม่ผ่านการตรวจสอบ):</b>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      {e.evidence.map((ev) =>
                        ev.url ? (
                          <li key={ev.url} className="small">
                            <a href={ev.url} target="_blank" rel="noreferrer">{ev.sourceName}</a>
                          </li>
                        ) : (
                          <li key={ev.sourceName} className="small">{ev.sourceName} ({ev.kind})</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  {e.reviewStatus !== "approved" && (
                    <button type="button" className="chip" disabled={busy} onClick={() => setStatus(e.slug, "approved")}>
                      อนุมัติ เผยแพร่
                    </button>
                  )}
                  {e.reviewStatus === "approved" && (
                    <button type="button" className="chip" disabled={busy} onClick={() => setStatus(e.slug, "pending_review")}>
                      ถอดออกจากเว็บ (กลับไปรอตรวจ)
                    </button>
                  )}
                  {e.reviewStatus === "approved" && (
                    <a className="chip" href={`/event/${e.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      ดูหน้าจริง
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sec">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>ข่าวล่าสุดที่ดึงมา</h2>
          <button type="button" className="chip" disabled={busy} onClick={fetchNewsNow}>
            ดึงข่าวใหม่ตอนนี้
          </button>
        </div>
        <p className="small">อ่านประกอบเวลาเขียนเหตุการณ์ใหม่ด้านล่าง — ไม่ copy เนื้อหา เขียนคำอธิบายเองแล้ว link กลับต้นฉบับเสมอ</p>
        {!news ? (
          <p className="muted">กำลังโหลด...</p>
        ) : news.length === 0 ? (
          <p className="muted">ยังไม่มีข่าว กดปุ่ม &quot;ดึงข่าวใหม่ตอนนี้&quot; ด้านบน (ต้องตั้งค่า MARKETAUX_API_KEY ก่อน)</p>
        ) : (
          <div className="list">
            {news.map((n) => (
              <div key={n.url} className="src-row">
                <div>
                  <a href={n.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{n.title}</a>
                  <br />
                  <span className="small">{n.sourceName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sec">
        <h2>เขียนเหตุการณ์ใหม่ (บันทึกแล้วขึ้นเว็บจริงทันที)</h2>
        <p className="small">
          วางข้อมูลในรูปแบบ JSON ตามตัวอย่าง (ticker ทุกตัวต้องเป็นบริษัทที่มีอยู่แล้วในระบบ, lineId ต้องเป็น oil / inflation / dollar,
          ตัวเลขในข้อความต้องใส่ผ่าน <code>{"{{TICKER.field}}"}</code> เท่านั้น) <b>slug ต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลางเท่านั้น
          เช่น &quot;oil-supply-2&quot; ห้ามมีภาษาไทยหรือช่องว่างเด็ดขาด ไม่งั้นเปิดหน้าจริงจะหาไม่เจอ</b>
        </p>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={16}
          style={{ width: "100%", marginTop: 8, fontFamily: "monospace", fontSize: 13, padding: 12, borderRadius: 12, border: "1.5px solid var(--rule)", background: "var(--paper)", color: "var(--ink)" }}
        />
        <button type="button" className="cta" style={{ marginTop: 12, border: "none", cursor: "pointer" }} disabled={busy} onClick={createEvent}>
          บันทึกและเผยแพร่ขึ้นเว็บทันที
        </button>
      </section>
    </div>
  );
}
