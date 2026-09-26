// ระบบตรวจจับการเคลื่อนไหวราคาผิดปกติ + สร้าง "เหตุการณ์ร่าง" อัตโนมัติ (ไม่ใช้ AI เลย)
// เรียกจาก /api/cron/prices หลังคำนวณ ret_1d / abn_ret_1d เสร็จในแต่ละคืน
//
// หลักการ: ตัวเลขราคาจริงเป็นคนตัดสินใจว่าเรื่องไหน "น่าเขียน" ไม่ใช่ความเห็นคน (ดู CLAUDE.md)
// เมื่อเจอการเคลื่อนไหวผิดปกติ จะ:
//   1. ดึงข่าวที่เกี่ยวข้องจาก Marketaux อัตโนมัติ (ระบบเดิม เดิมต้องกดปุ่มเอง)
//   2. สร้างเหตุการณ์เข้าสถานะ "pending_explanation" (รอคำอธิบาย) พร้อมตัวเลขจริง + ลิงก์ข่าวที่พบ
//   3. ไม่เขียนคำอธิบาย/การตีความใด ๆ เอง — รอเจ้าของหรือ Claude Code มาเติมทีหลัง
// เหตุการณ์ร่างจะไม่ขึ้นเว็บจริงจนกว่าจะมีคนแก้สถานะเป็น "approved" ในหน้าแอดมิน

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { claimEvidence, claims, events, evidence, eventDocuments, explanations } from "@/db/schema";
import { companies } from "@/lib/sample/data";
import { fetchLatestNews, saveArticlesToDb, MarketauxError } from "@/lib/news/marketaux";

/** ตัวเลข ret_1d (%) ของ WTI/XAU/US10Y (proxy) ที่ถือว่า "ผิดปกติ" พอจะสร้างเหตุการณ์ร่าง */
const MACRO_THRESHOLD_PCT = 3;
/** abnormal return (%) ของหุ้นรายตัว (เทียบ S&P 500) ที่ถือว่า "ผิดปกติ" */
const STOCK_ABN_THRESHOLD_PCT = 5;

/** proxy key -> สายที่เกี่ยวข้องโดยตรง (ไม่ใช่ ticker หุ้นจริง ดึงข่าวรายตัวไม่ได้) */
const MACRO_FACTOR: Record<string, { factorId: string; label: string }> = {
  WTI: { factorId: "oil", label: "ราคาน้ำมัน (WTI)" },
  XAU: { factorId: "dollar", label: "ราคาทองคำ" },
  US10Y: { factorId: "inflation", label: "ตลาดพันธบัตรสหรัฐฯ (ผ่าน ETF ตัวแทน)" },
};

/** คำในลิสต์ sensitivities ของบริษัท (lib/sample/data.ts) ที่ผูกกับสายไหนชัดเจน — ใช้คำแรกที่เจอเท่านั้น ไม่เดาถ้าไม่มี */
const SENSITIVITY_FACTOR: [string, string][] = [
  ["ราคาน้ำมัน", "oil"],
  ["ราคาก๊าซธรรมชาติ", "oil"],
  ["ดอกเบี้ย", "inflation"],
  ["เงินเฟ้อ", "inflation"],
  ["ค่าเงินดอลลาร์", "dollar"],
  ["ราคาทองคำ", "dollar"],
];

function factorForStock(ticker: string): string | null {
  const company = companies.find((c) => c.ticker === ticker);
  if (!company) return null;
  for (const [keyword, factorId] of SENSITIVITY_FACTOR) {
    if (company.sensitivities.includes(keyword)) return factorId;
  }
  return null;
}

interface Trigger {
  ticker: string;
  label: string;
  factorId: string;
  value: number; // ret_1d หรือ abn_ret_1d (%)
  metric: "ret_1d" | "abn_ret_1d";
  /** true = proxy ตัวชี้วัด (WTI/XAU/US10Y) ไม่ใช่ ticker หุ้นจริง ดึงข่าวรายตัวจาก Marketaux ไม่ได้ */
  isMacroProxy: boolean;
}

/** หา ticker ที่ขยับผิดปกติวันนี้จากตัวเลขที่ cron ราคาคำนวณไว้แล้ว (ไม่ยิง API ราคาเพิ่ม) */
export function findTriggers(returns: Record<string, number>, abnormalReturns: Record<string, number>): Trigger[] {
  const triggers: Trigger[] = [];

  for (const [key, cfg] of Object.entries(MACRO_FACTOR)) {
    const ret = returns[key];
    if (ret !== undefined && Math.abs(ret) >= MACRO_THRESHOLD_PCT) {
      triggers.push({ ticker: key, label: cfg.label, factorId: cfg.factorId, value: ret, metric: "ret_1d", isMacroProxy: true });
    }
  }

  for (const [ticker, abn] of Object.entries(abnormalReturns)) {
    if (Math.abs(abn) < STOCK_ABN_THRESHOLD_PCT) continue;
    const factorId = factorForStock(ticker);
    if (!factorId) continue; // ไม่รู้ว่าเกี่ยวกับสายไหน ไม่เดา ข้ามไป
    const company = companies.find((c) => c.ticker === ticker);
    triggers.push({ ticker, label: company?.name ?? ticker, factorId, value: abn, metric: "abn_ret_1d", isMacroProxy: false });
  }

  return triggers;
}

/** เช็กว่าวันนี้มีเหตุการณ์ (สถานะไหนก็ได้) ของสายนี้ถูกสร้าง/แก้ไขไปแล้วหรือยัง กันสร้างซ้ำ */
async function hasEventTodayForFactor(db: ReturnType<typeof getDb>, factorId: string, asOfDate: string): Promise<boolean> {
  const rows = await db.select({ updatedAt: events.updatedAt }).from(events).where(eq(events.factorId, factorId));
  return rows.some((r) => r.updatedAt.toISOString().slice(0, 10) === asOfDate);
}

/** ดึงข่าวที่เกี่ยวกับ ticker นี้ (ถ้าตั้งค่า MARKETAUX_API_KEY ไว้) แล้วผูกเป็น evidence ของ event ที่สร้างแล้ว */
async function attachNewsEvidence(db: ReturnType<typeof getDb>, eventId: number, ticker: string): Promise<number> {
  if (!process.env.MARKETAUX_API_KEY) return 0;
  try {
    const articles = await fetchLatestNews(5, [ticker]);
    const { urlToDocId } = await saveArticlesToDb(db, articles);
    for (const a of articles) {
      await db.insert(evidence).values({
        eventId,
        sourceName: a.sourceName,
        kind: "ข่าว",
        note: "ข่าวที่ระบบดึงมาอัตโนมัติจาก Marketaux ยังไม่ผ่านการตรวจสอบ",
        url: a.url,
        linkLabel: "อ่านต้นฉบับ",
        publishedAt: new Date(a.publishedAt),
        retrievedAt: new Date(),
      });
      const docId = urlToDocId.get(a.url);
      if (docId) await db.insert(eventDocuments).values({ eventId, documentId: docId, role: "supporting" }).onConflictDoNothing();
    }
    return articles.length;
  } catch (err) {
    if (err instanceof MarketauxError) return 0; // โควตาหมด/ยังไม่ตั้งค่า ฯลฯ ไม่ทำให้เหตุการณ์ร่างสร้างไม่ได้
    throw err;
  }
}

export interface DetectResult {
  checked: number;
  drafted: string[]; // slug ที่สร้างสำเร็จ
  skipped: string[]; // ticker ที่ข้าม (มีเหตุการณ์วันนี้แล้ว)
  errors: string[];
}

/** เรียกจาก cron ราคาหลังคำนวณ returns/abnormalReturns เสร็จ ไม่ทำให้ cron ราคาพังถ้าขั้นตอนนี้ error */
export async function detectAndDraftEvents(
  returns: Record<string, number>,
  abnormalReturns: Record<string, number>,
  asOfDate: string,
): Promise<DetectResult> {
  const result: DetectResult = { checked: 0, drafted: [], skipped: [], errors: [] };
  const triggers = findTriggers(returns, abnormalReturns);
  result.checked = triggers.length;
  if (triggers.length === 0) return result;

  const db = getDb();

  // จำกัดจำนวนเหตุการณ์ร่างต่อการรันหนึ่งครั้ง กัน cron (maxDuration 60 วิ) รันนานเกินไปถ้าวันนั้นมีตัวเลขขยับแรงพร้อมกันหลายตัว
  const MAX_DRAFTS_PER_RUN = 8;
  for (const t of triggers.slice(0, MAX_DRAFTS_PER_RUN)) {
    try {
      if (await hasEventTodayForFactor(db, t.factorId, asOfDate)) {
        result.skipped.push(t.ticker);
        continue;
      }

      const slug = `auto-${t.ticker.toLowerCase()}-${asOfDate}`;
      const dir = t.value >= 0 ? "พุ่งขึ้น" : "ร่วงลง";
      const title = `${t.label} ${dir} ${Math.abs(t.value).toFixed(1)}% ผิดปกติวันนี้ — รอคำอธิบาย`;

      const [eventRow] = await db
        .insert(events)
        .values({ slug, factorId: t.factorId, title, reviewStatus: "pending_explanation", explanationBy: "team" })
        .returning({ id: events.id });

      // หลักฐานข้อมูลราคา (มีอยู่จริงเสมอ ไม่ต้องรอข่าว)
      const [priceEvidence] = await db
        .insert(evidence)
        .values({
          eventId: eventRow.id,
          sourceName: "Tiingo",
          kind: "ข้อมูลตลาด",
          note: "ราคาปิดล่าสุด คำนวณ ret_1d/abnormal return โดยระบบ",
          url: null,
          linkLabel: "ดูข้อมูล",
          publishedAt: null,
          retrievedAt: new Date(),
        })
        .returning({ id: evidence.id });

      await db.insert(explanations).values({
        eventId: eventRow.id,
        section: "quick",
        contentJson: {
          what: `${t.label} เปลี่ยนแปลง {{${t.ticker}.${t.metric}|abs}} ในวันนี้ ระบบตรวจพบอัตโนมัติจากราคาจริง ยังไม่มีคำอธิบายสาเหตุ`,
          who: "รอเจ้าของ/ทีมงานอ่านข่าวที่เกี่ยวข้องด้านล่างแล้วเขียนคำอธิบายและผลกระทบต่อหุ้นที่เกี่ยวข้อง",
          tickers: t.isMacroProxy ? [] : [t.ticker],
        },
        by: "team",
      });
      await db.insert(explanations).values({ eventId: eventRow.id, section: "understand", contentJson: [], by: "team" });
      await db.insert(explanations).values({
        eventId: eventRow.id,
        section: "deep",
        contentJson: { timeline: [], history: { text: "", note: "" }, watch: "" },
        by: "team",
      });
      await db.insert(explanations).values({ eventId: eventRow.id, section: "faq", contentJson: [], by: "team" });

      // claim ข้อเท็จจริงเดียว (แค่บอกว่าขยับเท่าไหร่ ไม่ตีความสาเหตุ) ผูกกับหลักฐานราคาจริง
      const [claimRow] = await db
        .insert(claims)
        .values({
          eventId: eventRow.id,
          kind: "fact",
          textTemplate: `${t.label} เปลี่ยนแปลง {{${t.ticker}.${t.metric}|abs}} ในวันนี้ ถือว่าผิดปกติกว่าค่าเฉลี่ยทั่วไป`,
          note: "ตรวจพบโดยระบบอัตโนมัติจากราคาจริง ยังไม่ทราบสาเหตุ",
        })
        .returning({ id: claims.id });
      await db.insert(claimEvidence).values({ claimId: claimRow.id, evidenceId: priceEvidence.id });

      // ข่าวที่เกี่ยวข้อง (ถ้ามี ticker หุ้นจริง + ตั้งค่า Marketaux ไว้)
      if (!t.isMacroProxy) await attachNewsEvidence(db, eventRow.id, t.ticker);

      result.drafted.push(slug);
    } catch (err) {
      result.errors.push(`${t.ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
