"use client";

// หน้าแอดมิน: คิวอนุมัติเหตุการณ์ + ดูข่าวที่ดึงมา + เขียนเหตุการณ์ใหม่เอง (วาง JSON)
// ป้องกันด้วยรหัสผ่านเดียวกับที่ใช้ตั้งค่าฐานข้อมูล (ADMIN_SECRET) เก็บไว้ใน sessionStorage ของเบราว์เซอร์เท่านั้น

import { useEffect, useState } from "react";
import AdminEventForm, { type FormEventPayload } from "@/components/AdminEventForm";

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
  id: number;
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
  // แยกไว้ต่างหากจาก busy เพราะปุ่มอื่นก็ใช้ busy ตัวเดียวกัน (กันกดซ้อน) แต่จะโชว์ข้อความ "กำลังทำงาน" เฉพาะปุ่มที่กดจริงเท่านั้น
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [writeMode, setWriteMode] = useState<"form" | "json">("form");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [backtestResult, setBacktestResult] = useState<string | null>(null);
  // กดลบข่าวต้องกดยืนยันอีกครั้ง — ใช้ state เองแทน window.confirm() เพราะเบราว์เซอร์ในแอป (เช่น Line/Facebook webview)
  // มักบล็อก confirm() เงียบ ๆ แล้วตอบ "ยกเลิก" ทันทีโดยไม่โชว์กล่องให้กดเลย ทำให้ลบไม่ได้แม้กดปุ่มแล้ว
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<{ ticker: string; name: string }[]>([]);

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
    // HTTP header ส่งได้แค่ตัวอักษร ASCII เท่านั้น ถ้ารหัสผ่านมีภาษาไทยหรืออักขระอื่นที่ไม่ใช่ ASCII
    // เบราว์เซอร์จะโยน error ทันทีตอนสร้าง request (พังทุกปุ่มที่ต้องยืนยันตัวตน) — เข้ารหัสก่อนส่งเสมอ
    return { "x-admin-secret": encodeURIComponent(secret) };
  }

  async function refresh() {
    // ไม่เรียก setMessage(null) ที่นี่โดยไม่มีเงื่อนไข — ผู้เรียก (fetchNewsNow/setStatus/submitPayload) ตั้งข้อความ
    // "สำเร็จ" ไว้ก่อนเรียก refresh() เสมอ ถ้าล้างทิ้งตรงนี้แบบไม่มีเงื่อนไข ข้อความสำเร็จจะหายไปทันทีก่อนผู้ใช้
    // เห็น (ล้างแล้วค่อยเซ็ตใหม่เฉพาะกรณี error ด้านล่างเท่านั้น ไม่แตะ error path เดิม)
    try {
      const [eventsRes, newsRes, companiesRes] = await Promise.all([
        fetch("/api/admin/events", { headers: headers() }),
        fetch("/api/admin/news", { headers: headers() }),
        fetch("/api/admin/companies", { headers: headers() }),
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
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.companies ?? []);
      }
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

  async function submitPayload(payload: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify(payload),
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

  async function createEventFromJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      await submitPayload(parsed);
    } catch (err) {
      setMessage(`JSON ไม่ถูกต้อง: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function createEventFromForm(payload: FormEventPayload) {
    await submitPayload(payload);
  }

  async function deleteNews(id: number) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE", headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      setMessage("ลบข่าวแล้ว");
      await refresh();
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
      setConfirmDeleteId(null);
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

  async function computeBetaNow() {
    setBusy(true);
    setRunningAction("beta");
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/compute-sensitivity`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      const errNote = data.errors?.length ? ` (มีบางตัวคำนวณไม่สำเร็จ ${data.errors.length} รายการ ดู log ฝั่งเซิร์ฟเวอร์)` : "";
      setMessage(`คำนวณ Beta สำเร็จ ${data.computed}/${data.total} บริษัท${errNote}`);
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
      setRunningAction(null);
    }
  }

  async function computeBacktestNow() {
    setBusy(true);
    setRunningAction("backtest");
    setMessage(null);
    setBacktestResult(null);
    try {
      const res = await fetch(`/api/admin/compute-backtest`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      const errNote = data.errors?.length ? ` (มีบางตัวดึงราคาไม่สำเร็จ ${data.errors.length} รายการ ดูรายละเอียด error ด้านล่าง)` : "";
      setMessage(`คำนวณ backtest สำเร็จ${errNote} — คัดลอกตัวเลขด้านล่างไปแทนที่ [n]/[x.x%]/[ปี] ในเนื้อหาเอง`);
      setBacktestResult(JSON.stringify({ results: data.results, errors: data.errors }, null, 2));
    } catch (err) {
      setMessage(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
      setRunningAction(null);
    }
  }

  async function searchNews() {
    const q = searchQuery.trim();
    if (!q) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/news/search?q=${encodeURIComponent(q)}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
      setSearchResults(data.results ?? []);
      if ((data.results ?? []).length === 0) setMessage(`ไม่พบข่าวที่ตรงกับคำค้น "${q}"`);
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
          <h2>Beta ต่อปัจจัย (น้ำมัน / ดอกเบี้ย / ดอลลาร์)</h2>
          <button type="button" className="chip" disabled={busy} onClick={computeBetaNow}>
            {runningAction === "beta" ? "กำลังคำนวณ... (รอได้เลย ใช้เวลาถึง 1 นาที)" : "คำนวณ Beta ใหม่"}
          </button>
        </div>
        <p className="small">
          ดึงราคาปิดย้อนหลัง ~2 ปีของหุ้น 35 ตัวที่มีหน้าหลักฐาน + ETF ตัวแทนของแต่ละปัจจัย มาคำนวณทางสถิติ (ไม่ใช้ AI) แทนที่ &quot;[ไม่มีข้อมูล]&quot;
          ใช้เวลาประมาณครึ่งถึงหนึ่งนาที — <b>อย่ากดพร้อมกับตอนที่ cron ดึงราคาประจำวันกำลังทำงาน</b> เพราะแผนฟรีของ Tiingo จำกัดโควตารายชั่วโมงร่วมกัน
          ถ้ากดแล้วเจอ error โควตาเต็ม ให้รอประมาณ 1 ชั่วโมงแล้วลองใหม่
        </p>
      </section>

      <section className="sec">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>สถิติในอดีต (backtest) สำหรับข้อความ &quot;[n] ครั้ง ตั้งแต่ปี [ปี]&quot;</h2>
          <button type="button" className="chip" disabled={busy} onClick={computeBacktestNow}>
            {runningAction === "backtest" ? "กำลังคำนวณ... (รอได้เลย ใช้เวลาถึง 1 นาที)" : "คำนวณ backtest"}
          </button>
        </div>
        <p className="small">
          ดึงราคาย้อนหลังตั้งแต่ปี 2015 มาแบ่งเป็นช่วง ๆ นับว่าน้ำมัน/ดอลลาร์ (ผ่านราคาทองคำ) ขยับเกินเกณฑ์กี่ครั้ง แล้ววัดผลตอบแทนของหุ้นสายการบิน/เหมืองทองในช่วงเดียวกันเทียบตลาด
          (สถิติล้วน ๆ ไม่ใช้ AI) — ผลลัพธ์เป็น JSON ให้คัดลอกตัวเลขไปแทนที่ข้อความในโค้ดเอง ยังไม่เขียนกลับให้อัตโนมัติ ใช้เวลาประมาณ 1 นาที
          <b> อย่ากดพร้อมกับ cron ราคาประจำวันหรือปุ่มคำนวณ Beta</b> เพราะแชร์โควตา Tiingo กัน
        </p>
        {backtestResult && (
          <pre style={{ fontSize: 12, overflowX: "auto", background: "var(--chalk)", padding: 10, borderRadius: 8, marginTop: 8 }}>
            {backtestResult}
          </pre>
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
                {confirmDeleteId === n.id ? (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button type="button" className="chip" disabled={busy} onClick={() => deleteNews(n.id)} style={{ borderColor: "var(--neg)", color: "var(--neg)" }}>
                      ยืนยันลบ
                    </button>
                    <button type="button" className="chip" disabled={busy} onClick={() => setConfirmDeleteId(null)}>
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button type="button" className="chip" disabled={busy} onClick={() => setConfirmDeleteId(n.id)} style={{ flexShrink: 0 }}>
                    ลบ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sec">
        <h2>ค้นข่าวด้วยคำค้น (ไม่ผูกกับหุ้นตัวไหน)</h2>
        <p className="small">
          ใช้ตอนอยากหาข่าวเรื่องที่ยังไม่รู้ว่ากระทบหุ้นตัวไหนโดยตรง เช่น ภัยธรรมชาติ, เหตุการณ์ภูมิรัฐศาสตร์ — พิมพ์เป็นภาษาอังกฤษจะเจอผลลัพธ์มากกว่า
          (เช่น &quot;Thailand flood&quot; แทน &quot;น้ำท่วม&quot;)
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchNews()}
            placeholder="เช่น Thailand flood, semiconductor supply"
            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--rule)", background: "var(--paper)", color: "var(--ink)" }}
          />
          <button type="button" className="chip" disabled={busy} onClick={searchNews}>
            ค้นข่าว
          </button>
        </div>
        {searchResults && (
          <div className="list" style={{ marginTop: 12 }}>
            {searchResults.length === 0 ? (
              <p className="muted">ไม่พบข่าว</p>
            ) : (
              searchResults.map((n) => (
                <div key={n.url} className="src-row">
                  <div>
                    <a href={n.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{n.title}</a>
                    <br />
                    <span className="small">{n.sourceName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="sec">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h2>เขียนเหตุการณ์ใหม่ (บันทึกแล้วขึ้นเว็บจริงทันที)</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="chip"
              style={writeMode === "form" ? { borderColor: "var(--ink)" } : undefined}
              onClick={() => setWriteMode("form")}
            >
              แบบฟอร์ม (ง่าย)
            </button>
            <button
              type="button"
              className="chip"
              style={writeMode === "json" ? { borderColor: "var(--ink)" } : undefined}
              onClick={() => setWriteMode("json")}
            >
              JSON ดิบ (ขั้นสูง)
            </button>
          </div>
        </div>
        <p className="small" style={{ marginTop: 8 }}>
          ticker ทุกตัวต้องเป็นบริษัทที่มีอยู่แล้วในระบบ ตัวเลขในข้อความต้องใส่ผ่าน <code>{"{{TICKER.field}}"}</code> เท่านั้น{" "}
          <b>slug ต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลางเท่านั้น เช่น &quot;oil-supply-2&quot; ห้ามมีภาษาไทยหรือช่องว่างเด็ดขาด ไม่งั้นเปิดหน้าจริงจะหาไม่เจอ</b>
        </p>

        {writeMode === "form" ? (
          <AdminEventForm busy={busy} onSubmit={createEventFromForm} companies={companies} />
        ) : (
          <>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={16}
              style={{ width: "100%", marginTop: 8, fontFamily: "monospace", fontSize: 13, padding: 12, borderRadius: 12, border: "1.5px solid var(--rule)", background: "var(--paper)", color: "var(--ink)" }}
            />
            <button type="button" className="cta" style={{ marginTop: 12, border: "none", cursor: "pointer" }} disabled={busy} onClick={createEventFromJson}>
              บันทึกและเผยแพร่ขึ้นเว็บทันที
            </button>
          </>
        )}
      </section>
    </div>
  );
}
