// โครงสร้างข้อมูลตั้งให้ตรงกับตารางในฐานข้อมูลที่จะสร้างในชิ้นที่ 2 (ดู CLAUDE.md)
// ตอนนี้ข้อมูลมาจากไฟล์ตัวอย่างใน lib/sample/ แต่หน้าเว็บอ่านผ่าน lib/data.ts เท่านั้น
// พอมีฐานข้อมูลจริงก็เปลี่ยนเฉพาะ lib/data.ts

/** สีของ "สาย" อ้างถึงตัวแปร CSS --a / --b / --c */
export type LineColor = "a" | "b" | "c" | "d";

/** Positive / Negative / Mixed Exposure ห้ามใช้คำว่า "จะขึ้น" "จะลง" */
export type Exposure = "pos" | "neg" | "mix";

/** เส้นทึบ = หลักฐานแข็งแรง, เส้นประ = มีปัจจัยที่อาจทำให้ต่างไป */
export type Strength = "solid" | "dashed";

/** ข้อความที่มีตัวเลขตลาดต้องใช้ placeholder เช่น "{{DAL.ret_1d}}" ห้ามพิมพ์ตัวเลขเอง */
export type Template = string;

/** สายในตลาด (factors) */
export interface Line {
  id: string;
  name: string; // เช่น "สายน้ำมัน"
  short: string; // เช่น "น้ำมัน"
  color: LineColor;
}

/** evidence: ทุก Fact ต้องผูกกับรายการในนี้ */
export interface Evidence {
  id: string;
  sourceName: string;
  kind: string; // เช่น "ข่าว", "ข้อมูลทางการ", "เอกสารบริษัท"
  note: string;
  url: string | null; // null = ยังเป็นตัวอย่าง ยังไม่มีลิงก์จริง
  linkLabel: string;
  publishedAt: string | null; // ISO 8601
  retrievedAt: string | null; // ISO 8601
}

export type ClaimKind = "fact" | "analysis" | "uncertainty";

/** claims: แยก Fact / Analysis / Uncertainty */
export interface Claim {
  kind: ClaimKind;
  text: Template;
  note?: string;
  evidenceIds: string[];
}

export interface ChainStep {
  layer: string; // เหตุการณ์ / เศรษฐกิจ / อุตสาหกรรม / บริษัท
  name: string;
  desc: Template;
  confidence: string;
  strength: Strength;
}

/** impact_chains + impact_chain_steps */
export interface ImpactChain {
  id: string;
  label: string; // เช่น "ไปสายการบิน"
  ticker: string;
  exposure: Exposure;
  steps: ChainStep[];
}

/** event_company_impacts */
export interface CompanyImpact {
  ticker: string;
  exposure: Exposure;
  reason: string;
}

export interface QA {
  q: string;
  a: string;
  glossary?: { term: string; def: string };
}

export interface Faq {
  q: string;
  a: string;
  evidenceNote: string;
  link?: { href: string; label: string };
}

export type ReviewStatus = "pending_explanation" | "pending_review" | "approved";

/** events + explanations (explanations เก็บครั้งเดียวต่อเหตุการณ์) */
export interface MarketEvent {
  slug: string;
  lineId: string;
  title: string;
  updatedAt: string;
  reviewStatus: ReviewStatus;
  /** ถ้า AI เป็นคนร่าง ต้องเก็บ model และ prompt_version */
  explanationSource: { by: "team" | "ai"; model?: string; promptVersion?: string };
  quick: { what: string; who: string; tickers: string[] };
  understand: QA[];
  claims: Claim[];
  deep: {
    timeline: { when: string; text: Template }[];
    history: { text: Template; note: string };
    watch: string;
  };
  faq: Faq[];
  chains: ImpactChain[];
  impacts: CompanyImpact[];
  evidenceIds: string[];
}

/** entities (บริษัท) */
export interface Company {
  ticker: string;
  name: string;
  sector: string;
  covered: boolean; // อยู่ในความครอบคลุมของการวิเคราะห์หรือไม่
  sensitivities: string[];
}

export interface EvidenceLayer {
  title: string;
  signal: "support" | "offset"; // สนับสนุน หรือ ปัจจัยชดเชย
  text?: string;
  kv?: { k: string; v: Template }[];
  glossary?: { term: string; def: string };
  note: string;
  link?: { href: string; label: string };
}

/** company_exposures: หลักฐาน 4 ชั้นของหุ้นหนึ่งตัวต่อเหตุการณ์หนึ่ง */
export interface StockExposure {
  eventSlug: string;
  ticker: string;
  exposure: Exposure;
  confidence: "สูง" | "กลาง" | "ต่ำ";
  summary: string;
  layers: EvidenceLayer[];
  /** ตลาดวันนี้: key ของ market_metrics ที่จะแสดง */
  today: { label: string; value: Template; emphasis?: boolean }[];
}

/** market_metrics: ตัวเลขทุกตัวมาจาก backend เท่านั้น */
export interface MetricValue {
  value: number;
  unit: "pct" | "bps" | "usd" | "number";
}
export type MarketMetrics = Record<string, Record<string, MetricValue>>;

export interface CalendarItem {
  group: string; // "วันนี้" / "สัปดาห์นี้"
  when: string;
  importance: string;
  status?: "released";
  name: string;
  lineId?: string;
  values: { label: string; value: string }[];
  explainer: { q: string; a: string; source: string; link?: { href: string; label: string } };
}

export interface OtherStory {
  title: string;
  sub: string;
  lineId?: string;
  href?: string;
}

export interface Quiz {
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string;
  evidenceNote: string;
}

export interface MapSign {
  lineId: string;
  title: string;
  body: string;
  effects: { exposure: Exposure; text: string }[];
  cta: { label: string; href: string } | null;
  meta: string;
}

/** หน้าพอร์ต: บันทึกวิเคราะห์หุ้นรายตัวต่อวัน เขียนโดยทีมงาน/Claude Code ไม่ใช้ AI อัตโนมัติ
 * ไม่มีราคาเป้าหมาย/คำแนะนำ BUY-SELL เป็นความเห็นของเว็บเอง — ถ้าอ้างถึงมุมมองนักวิเคราะห์ภายนอก
 * ต้องระบุชื่อสำนักและผูกกับ evidence เสมอ (รายงานสิ่งที่คนอื่นพูด ไม่ใช่คำแนะนำของเว็บนี้) */
export interface StockUpdate {
  ticker: string;
  date: string; // YYYY-MM-DD
  priceNote: string; // ข้อเท็จจริงด้านราคา ณ วันที่ระบุ (ไม่ใช่ placeholder เพราะเป็นภาพรวมของวันนั้น ไม่ใช่ตัวเลขสด)
  news: string[];
  analystNotes: { text: string; evidenceIds: string[] }[];
  calendar: { label: string; when: string }[];
  risk: { level: string; points: string[]; strengths: string[] };
  evidenceIds: string[];
}

export interface HomeData {
  asOf: string;
  mood: string;
  pulse: { label: string; metric: string }[];
  signs: MapSign[];
  quiz: Quiz;
  others: OtherStory[];
}
