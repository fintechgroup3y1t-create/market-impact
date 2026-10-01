"use client";

// ฟอร์มเขียนเหตุการณ์ใหม่แบบกรอกทีละช่อง (ทางเลือกที่เป็นมิตรกว่าการวาง JSON ดิบ)
// ประกอบร่างเป็น NewEventPayload เดียวกับที่ /api/admin/events ต้องการ แล้วส่งให้ AdminPage เป็นคนยิง fetch
// หมายเหตุ: โหมดนี้ยังไม่รองรับการสร้าง "chains" (แผนที่ผลกระทบเต็มรูปแบบ) เพราะโครงสร้างซ้อนลึกเกินไปสำหรับฟอร์ม
// เหตุการณ์ที่ต้องการ chains เต็มยังต้องให้ Claude Code ช่วยเขียนหรือใช้โหมด JSON ดิบแทน

import { useState } from "react";
import type { Exposure, ClaimKind } from "@/lib/types";

export interface FormEventPayload {
  slug: string;
  lineId: string;
  title: string;
  quick: { what: string; who: string; tickers: string[] };
  understand: { q: string; a: string }[];
  deep: { timeline: never[]; history: { text: string; note: string }; watch: string };
  faq: { q: string; a: string; evidenceNote: string }[];
  evidence: {
    key: string;
    sourceName: string;
    kind: string;
    note: string;
    url: string | null;
    linkLabel: string;
    publishedAt: string | null;
    retrievedAt: string | null;
  }[];
  claims: { kind: ClaimKind; text: string; note?: string; evidenceKeys: string[] }[];
  chains: never[];
  impacts: { ticker: string; exposure: Exposure; reason: string }[];
}

const LINE_OPTIONS: { id: string; label: string }[] = [
  { id: "oil", label: "น้ำมัน" },
  { id: "inflation", label: "เงินเฟ้อ" },
  { id: "dollar", label: "ดอลลาร์" },
];

const EXPOSURE_OPTIONS: { id: Exposure; label: string }[] = [
  { id: "pos", label: "Positive" },
  { id: "neg", label: "Negative" },
  { id: "mix", label: "Mixed" },
];

const CLAIM_KIND_OPTIONS: { id: ClaimKind; label: string }[] = [
  { id: "fact", label: "ข้อเท็จจริง (Fact)" },
  { id: "analysis", label: "การวิเคราะห์ (Analysis)" },
  { id: "uncertainty", label: "ความไม่แน่นอน (Uncertainty)" },
];

function newId() {
  return Math.random().toString(36).slice(2);
}

interface EvidenceRow {
  _id: string;
  sourceName: string;
  kind: string;
  note: string;
  url: string;
  linkLabel: string;
  publishedAt: string;
  retrievedAt: string;
}
interface ClaimRow {
  _id: string;
  kind: ClaimKind;
  text: string;
  note: string;
  evidenceIdx: number[];
}
interface ImpactRow {
  _id: string;
  ticker: string;
  exposure: Exposure;
  reason: string;
}
interface QaRow {
  _id: string;
  q: string;
  a: string;
}
interface FaqRow {
  _id: string;
  q: string;
  a: string;
  evidenceNote: string;
}

function emptyEvidence(): EvidenceRow {
  return { _id: newId(), sourceName: "", kind: "ข่าว", note: "", url: "", linkLabel: "อ่านต้นฉบับ", publishedAt: "", retrievedAt: "" };
}
function emptyClaim(): ClaimRow {
  return { _id: newId(), kind: "fact", text: "", note: "", evidenceIdx: [] };
}
function emptyImpact(): ImpactRow {
  return { _id: newId(), ticker: "", exposure: "pos", reason: "" };
}
function emptyQa(): QaRow {
  return { _id: newId(), q: "", a: "" };
}
function emptyFaq(): FaqRow {
  return { _id: newId(), q: "", a: "", evidenceNote: "" };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1.5px solid var(--rule)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label className="small" style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="def" style={{ padding: 10, marginTop: 8, position: "relative" }}>
      {children}
      <button
        type="button"
        onClick={onRemove}
        style={{ position: "absolute", top: 8, right: 8, border: "none", background: "none", color: "var(--neg)", cursor: "pointer", fontSize: 13 }}
      >
        ลบ ✕
      </button>
    </div>
  );
}

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** ตรวจก่อนส่งจริง กันพิมพ์ผิดพลาดที่เจอทีหลังตอนเผยแพร่ไปแล้ว (เว็บนี้บันทึก = ขึ้นเว็บจริงทันที ไม่มีขั้นตอนอนุมัติแยก) */
function validate(payload: FormEventPayload, knownTickers: Set<string>): string[] {
  const errors: string[] = [];
  if (!payload.slug) errors.push("ยังไม่ได้ใส่ slug");
  else if (!SLUG_PATTERN.test(payload.slug)) errors.push("slug ต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลางเท่านั้น (ห้ามมีภาษาไทยหรือช่องว่าง)");
  if (!payload.title) errors.push("ยังไม่ได้ใส่หัวข้อเหตุการณ์");
  if (!payload.quick.what) errors.push("ยังไม่ได้ใส่ \"เกิดอะไรขึ้น\"");
  if (!payload.quick.who) errors.push("ยังไม่ได้ใส่ \"ใครได้รับผล\"");
  if (payload.impacts.length === 0) errors.push("ต้องมีหุ้นที่ได้รับผล (impacts) อย่างน้อย 1 ตัว");
  if (knownTickers.size > 0) {
    const unknown = [...new Set([...payload.quick.tickers, ...payload.impacts.map((i) => i.ticker)])].filter(
      (t) => !knownTickers.has(t),
    );
    if (unknown.length > 0) errors.push(`ไม่รู้จัก ticker นี้ในระบบ (พิมพ์ผิดหรือยังไม่ครอบคลุม): ${unknown.join(", ")}`);
  }
  const factClaimsWithoutEvidence = payload.claims.filter((c) => c.kind === "fact" && c.evidenceKeys.length === 0);
  if (factClaimsWithoutEvidence.length > 0) errors.push("มีข้ออ้างประเภท \"ข้อเท็จจริง\" ที่ยังไม่ได้ผูกหลักฐาน (ตามกฎของเว็บ ทุก Fact ต้องมีหลักฐานอ้างอิง)");
  return errors;
}

export default function AdminEventForm({
  busy,
  onSubmit,
  companies,
}: {
  busy: boolean;
  onSubmit: (payload: FormEventPayload) => Promise<void>;
  /** รายชื่อ ticker ที่ครอบคลุมจริง ใช้ทำ autocomplete + ตรวจว่าพิมพ์ถูกไหม (ว่างได้ถ้าโหลดไม่สำเร็จ จะข้ามการตรวจส่วนนี้) */
  companies: { ticker: string; name: string }[];
}) {
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const knownTickers = new Set(companies.map((c) => c.ticker));
  const [slug, setSlug] = useState("");
  const [lineId, setLineId] = useState("oil");
  const [title, setTitle] = useState("");
  const [quickWhat, setQuickWhat] = useState("");
  const [quickWho, setQuickWho] = useState("");
  const [tickersText, setTickersText] = useState("");
  const [deepWatch, setDeepWatch] = useState("");
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([emptyEvidence()]);
  const [claimRows, setClaimRows] = useState<ClaimRow[]>([emptyClaim()]);
  const [impactRows, setImpactRows] = useState<ImpactRow[]>([emptyImpact()]);
  const [qaRows, setQaRows] = useState<QaRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([]);
  const [previewPayload, setPreviewPayload] = useState<FormEventPayload | null>(null);

  function patchRow<T extends { _id: string }>(rows: T[], setRows: (r: T[]) => void, id: string, patch: Partial<T>) {
    setRows(rows.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  }

  function toIso(local: string): string | null {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  function buildPayload(): FormEventPayload {
    const tickers = tickersText
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    return {
      slug: slug.trim(),
      lineId,
      title: title.trim(),
      quick: { what: quickWhat.trim(), who: quickWho.trim(), tickers },
      understand: qaRows.filter((r) => r.q.trim() || r.a.trim()).map((r) => ({ q: r.q.trim(), a: r.a.trim() })),
      deep: { timeline: [], history: { text: "", note: "" }, watch: deepWatch.trim() },
      faq: faqRows
        .filter((r) => r.q.trim() || r.a.trim())
        .map((r) => ({ q: r.q.trim(), a: r.a.trim(), evidenceNote: r.evidenceNote.trim() })),
      evidence: evidenceRows
        .filter((r) => r.sourceName.trim())
        .map((r, i) => ({
          key: `ev${i + 1}`,
          sourceName: r.sourceName.trim(),
          kind: r.kind.trim() || "ข่าว",
          note: r.note.trim(),
          url: r.url.trim() || null,
          linkLabel: r.linkLabel.trim() || "อ่านต้นฉบับ",
          publishedAt: toIso(r.publishedAt),
          retrievedAt: toIso(r.retrievedAt) ?? new Date().toISOString(),
        })),
      claims: claimRows
        .filter((r) => r.text.trim())
        .map((r) => ({
          kind: r.kind,
          text: r.text.trim(),
          note: r.note.trim() || undefined,
          evidenceKeys: r.evidenceIdx.map((i) => `ev${i + 1}`),
        })),
      chains: [],
      impacts: impactRows
        .filter((r) => r.ticker.trim())
        .map((r) => ({ ticker: r.ticker.trim().toUpperCase(), exposure: r.exposure, reason: r.reason.trim() })),
    };
  }

  const validEvidenceRows = evidenceRows.filter((r) => r.sourceName.trim());

  function lineLabel(id: string) {
    return LINE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }
  function exposureLabel(id: Exposure) {
    return EXPOSURE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }
  function claimKindLabel(id: ClaimKind) {
    return CLAIM_KIND_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }

  if (previewPayload) {
    const p = previewPayload;
    return (
      <div>
        <div className="def" style={{ padding: 10, borderColor: "var(--pos)" }}>
          <b>ตรวจสอบก่อนเผยแพร่</b>
          <p className="small" style={{ marginTop: 4 }}>
            กด &quot;ยืนยัน เผยแพร่&quot; แล้วขึ้นเว็บจริงทันที ไม่มีขั้นตอนอนุมัติแยก — อ่านให้ครบก่อนกด (กดถอดออกจากเว็บได้ทีหลังถ้าพลาด)
          </p>
        </div>

        <Field label="slug / สาย">
          <div className="small">{p.slug} — {lineLabel(p.lineId)}</div>
        </Field>
        <Field label="หัวข้อเหตุการณ์">
          <div>{p.title}</div>
        </Field>
        <Field label="เกิดอะไรขึ้น">
          <div className="small">{p.quick.what}</div>
        </Field>
        <Field label="ใครได้รับผล">
          <div className="small">{p.quick.who}</div>
        </Field>
        {p.quick.tickers.length > 0 && (
          <Field label="หุ้นที่เกี่ยวข้อง">
            <div className="small">{p.quick.tickers.join(", ")}</div>
          </Field>
        )}
        {p.deep.watch && (
          <Field label="สิ่งที่ควรจับตาต่อ">
            <div className="small">{p.deep.watch}</div>
          </Field>
        )}

        <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
          <b>หลักฐาน ({p.evidence.length})</b>
          {p.evidence.map((ev) => (
            <div key={ev.key} className="def" style={{ padding: 10, marginTop: 8 }}>
              <span className="small" style={{ opacity: 0.6 }}>{ev.key}</span>
              <div>{ev.sourceName} <span className="small">({ev.kind})</span></div>
              {ev.url && <div className="small">{ev.url}</div>}
              {ev.note && <div className="small">{ev.note}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
          <b>ข้ออ้าง ({p.claims.length})</b>
          {p.claims.map((c, i) => (
            <div key={i} className="def" style={{ padding: 10, marginTop: 8 }}>
              <span className="small" style={{ opacity: 0.6 }}>{claimKindLabel(c.kind)}</span>
              <div>{c.text}</div>
              {c.evidenceKeys.length > 0 && <div className="small">อ้างอิง: {c.evidenceKeys.join(", ")}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
          <b>หุ้นที่ได้รับผล ({p.impacts.length})</b>
          {p.impacts.map((im, i) => (
            <div key={i} className="def" style={{ padding: 10, marginTop: 8 }}>
              <b>{im.ticker}</b> — {exposureLabel(im.exposure)}
              {im.reason && <div className="small">{im.reason}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            className="chip"
            disabled={busy}
            onClick={() => setPreviewPayload(null)}
          >
            กลับไปแก้ไข
          </button>
          <button
            type="button"
            className="cta"
            style={{ border: "none", cursor: "pointer" }}
            disabled={busy}
            onClick={async () => {
              await onSubmit(p);
              setPreviewPayload(null);
            }}
          >
            ยืนยัน เผยแพร่ขึ้นเว็บจริง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Field label="slug (ภาษาอังกฤษ/ตัวเลข/ขีดกลางเท่านั้น เช่น oil-supply-2) *">
        <input style={inputStyle} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="oil-supply-2" />
      </Field>

      <Field label="สาย">
        <select style={inputStyle} value={lineId} onChange={(e) => setLineId(e.target.value)}>
          {LINE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="หัวข้อเหตุการณ์ *">
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อสั้น ๆ บอกว่าเกิดอะไรขึ้น" />
      </Field>

      <Field label="เกิดอะไรขึ้น (สั้น ๆ) *">
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={quickWhat} onChange={(e) => setQuickWhat(e.target.value)} />
      </Field>

      <Field label="ใครได้รับผล *">
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={quickWho} onChange={(e) => setQuickWho(e.target.value)} />
      </Field>

      <Field label="หุ้นที่เกี่ยวข้อง (ticker คั่นด้วยจุลภาค เช่น XOM, DAL)">
        <input style={inputStyle} value={tickersText} onChange={(e) => setTickersText(e.target.value)} placeholder="XOM, DAL" list="known-tickers" />
      </Field>

      <Field label="สิ่งที่ควรจับตาต่อ (deep.watch, ไม่บังคับ)">
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={deepWatch} onChange={(e) => setDeepWatch(e.target.value)} />
      </Field>

      {/* หลักฐาน */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
        <b>หลักฐาน (evidence)</b>
        <p className="small" style={{ marginTop: 4 }}>ทุกข้ออ้างที่เป็น Fact ต้องผูกกับหลักฐานในนี้อย่างน้อย 1 รายการ</p>
        {evidenceRows.map((row, i) => (
          <RowCard key={row._id} onRemove={() => setEvidenceRows(evidenceRows.filter((r) => r._id !== row._id))}>
            <span className="small" style={{ opacity: 0.6 }}>ev{i + 1}</span>
            <Field label="ชื่อแหล่งข่าว/แหล่งข้อมูล">
              <input style={inputStyle} value={row.sourceName} onChange={(e) => patchRow(evidenceRows, setEvidenceRows, row._id, { sourceName: e.target.value })} placeholder="เช่น reuters.com" />
            </Field>
            <Field label="ประเภท">
              <input style={inputStyle} value={row.kind} onChange={(e) => patchRow(evidenceRows, setEvidenceRows, row._id, { kind: e.target.value })} placeholder="ข่าว / ข้อมูลทางการ / เอกสารบริษัท" />
            </Field>
            <Field label="ลิงก์ (URL)">
              <input style={inputStyle} value={row.url} onChange={(e) => patchRow(evidenceRows, setEvidenceRows, row._id, { url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="หมายเหตุ (ไม่บังคับ)">
              <input style={inputStyle} value={row.note} onChange={(e) => patchRow(evidenceRows, setEvidenceRows, row._id, { note: e.target.value })} />
            </Field>
            <Field label="วันที่เผยแพร่ข่าว (ไม่บังคับ)">
              <input type="datetime-local" style={inputStyle} value={row.publishedAt} onChange={(e) => patchRow(evidenceRows, setEvidenceRows, row._id, { publishedAt: e.target.value })} />
            </Field>
          </RowCard>
        ))}
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setEvidenceRows([...evidenceRows, emptyEvidence()])}>
          + เพิ่มหลักฐาน
        </button>
      </div>

      {/* claims */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
        <b>ข้ออ้าง (claims)</b>
        <p className="small" style={{ marginTop: 4 }}>
          ตัวเลขในข้อความต้องใส่ผ่าน <code>{"{{TICKER.field}}"}</code> เท่านั้น ห้ามพิมพ์ตัวเลขเอง
        </p>
        {claimRows.map((row) => (
          <RowCard key={row._id} onRemove={() => setClaimRows(claimRows.filter((r) => r._id !== row._id))}>
            <Field label="ประเภท">
              <select style={inputStyle} value={row.kind} onChange={(e) => patchRow(claimRows, setClaimRows, row._id, { kind: e.target.value as ClaimKind })}>
                {CLAIM_KIND_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ข้อความ">
              <textarea
                style={{ ...inputStyle, resize: "vertical" }}
                rows={2}
                value={row.text}
                onChange={(e) => patchRow(claimRows, setClaimRows, row._id, { text: e.target.value })}
                placeholder="เช่น ราคาน้ำมันขยับ {{WTI.ret_1d}} วันนี้"
              />
            </Field>
            {validEvidenceRows.length > 0 && (
              <Field label="อ้างอิงหลักฐาน">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {validEvidenceRows.map((ev, evIdx) => {
                    const realIdx = evidenceRows.indexOf(ev);
                    const checked = row.evidenceIdx.includes(realIdx);
                    return (
                      <label key={ev._id} className="small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...row.evidenceIdx, realIdx]
                              : row.evidenceIdx.filter((i) => i !== realIdx);
                            patchRow(claimRows, setClaimRows, row._id, { evidenceIdx: next });
                          }}
                        />
                        ev{evIdx + 1} ({ev.sourceName || "ไม่มีชื่อ"})
                      </label>
                    );
                  })}
                </div>
              </Field>
            )}
          </RowCard>
        ))}
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setClaimRows([...claimRows, emptyClaim()])}>
          + เพิ่มข้ออ้าง
        </button>
      </div>

      {/* impacts */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
        <b>หุ้นที่ได้รับผล (impacts) * ต้องมีอย่างน้อย 1 ตัว</b>
        <p className="small" style={{ marginTop: 4 }}>ticker ต้องเป็นบริษัทที่มีอยู่แล้วในระบบเท่านั้น</p>
        {impactRows.map((row) => (
          <RowCard key={row._id} onRemove={() => setImpactRows(impactRows.filter((r) => r._id !== row._id))}>
            <Field label="Ticker">
              <input style={inputStyle} value={row.ticker} onChange={(e) => patchRow(impactRows, setImpactRows, row._id, { ticker: e.target.value })} placeholder="XOM" list="known-tickers" />
            </Field>
            <Field label="Exposure">
              <select style={inputStyle} value={row.exposure} onChange={(e) => patchRow(impactRows, setImpactRows, row._id, { exposure: e.target.value as Exposure })}>
                {EXPOSURE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="เหตุผลสั้น ๆ">
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={row.reason} onChange={(e) => patchRow(impactRows, setImpactRows, row._id, { reason: e.target.value })} />
            </Field>
          </RowCard>
        ))}
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setImpactRows([...impactRows, emptyImpact()])}>
          + เพิ่มหุ้น
        </button>
      </div>

      {/* understand Q&A */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
        <b>คำถามชวนเข้าใจ (understand, ไม่บังคับ)</b>
        {qaRows.map((row) => (
          <RowCard key={row._id} onRemove={() => setQaRows(qaRows.filter((r) => r._id !== row._id))}>
            <Field label="หัวข้อคำถาม">
              <input style={inputStyle} value={row.q} onChange={(e) => patchRow(qaRows, setQaRows, row._id, { q: e.target.value })} />
            </Field>
            <Field label="คำตอบ">
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={row.a} onChange={(e) => patchRow(qaRows, setQaRows, row._id, { a: e.target.value })} />
            </Field>
          </RowCard>
        ))}
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setQaRows([...qaRows, emptyQa()])}>
          + เพิ่มคำถาม
        </button>
      </div>

      {/* faq */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1.5px solid var(--rule)" }}>
        <b>คำถามยอดนิยม (faq, ไม่บังคับ)</b>
        {faqRows.map((row) => (
          <RowCard key={row._id} onRemove={() => setFaqRows(faqRows.filter((r) => r._id !== row._id))}>
            <Field label="คำถาม">
              <input style={inputStyle} value={row.q} onChange={(e) => patchRow(faqRows, setFaqRows, row._id, { q: e.target.value })} />
            </Field>
            <Field label="คำตอบ">
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={row.a} onChange={(e) => patchRow(faqRows, setFaqRows, row._id, { a: e.target.value })} />
            </Field>
            <Field label="หมายเหตุหลักฐาน (ไม่บังคับ)">
              <input style={inputStyle} value={row.evidenceNote} onChange={(e) => patchRow(faqRows, setFaqRows, row._id, { evidenceNote: e.target.value })} />
            </Field>
          </RowCard>
        ))}
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setFaqRows([...faqRows, emptyFaq()])}>
          + เพิ่มคำถาม
        </button>
      </div>

      <datalist id="known-tickers">
        {companies.map((c) => (
          <option key={c.ticker} value={c.ticker}>
            {c.name}
          </option>
        ))}
      </datalist>

      <p className="small" style={{ marginTop: 16, opacity: 0.7 }}>
        หมายเหตุ: ฟอร์มนี้ยังไม่รองรับการวาด &quot;แผนที่ผลกระทบ&quot; แบบเต็ม (chains) — ถ้าต้องการหน้า &quot;ทำไมถึงเป็นหุ้นตัวนี้&quot;
        แบบหลักฐาน 4 ชั้นเต็มรูปแบบ ให้ขอ Claude Code ช่วยเขียนแทน หรือสลับไปโหมด JSON ดิบ
      </p>

      {formErrors.length > 0 && (
        <div className="def" style={{ padding: 10, marginTop: 12, borderColor: "var(--neg)" }}>
          <b style={{ color: "var(--neg)" }}>แก้ก่อนบันทึก:</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {formErrors.map((e) => (
              <li key={e} className="small">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="cta"
        style={{ marginTop: 16, border: "none", cursor: "pointer" }}
        disabled={busy}
        onClick={() => {
          const payload = buildPayload();
          const errors = validate(payload, knownTickers);
          setFormErrors(errors);
          if (errors.length === 0) setPreviewPayload(payload);
        }}
      >
        ตรวจสอบก่อนเผยแพร่
      </button>
    </div>
  );
}
