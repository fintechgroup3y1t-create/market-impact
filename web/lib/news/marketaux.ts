// ดึงข่าวการเงินจาก Marketaux (แผนฟรี) — เก็บไว้ให้แอดมินอ่านแล้วตัดสินใจเขียนเหตุการณ์เอง
// ไม่มี AI จัดประเภทอัตโนมัติในชิ้นนี้ (ตามที่ตกลงกันไว้ ประหยัดค่าใช้จ่าย)
// เอกสาร: https://www.marketaux.com/documentation

import { inArray } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { documents, sources } from "@/db/schema";

export class MarketauxError extends Error {}

export interface NewsArticle {
  title: string;
  url: string;
  sourceName: string; // โดเมนต้นฉบับข่าว เช่น "reuters.com" (ไม่ใช่ "Marketaux" เพราะ Marketaux เป็นแค่ตัวรวมข่าว)
  publishedAt: string; // ISO 8601
  tickers: string[]; // ticker ที่ Marketaux ตรวจพบว่าเกี่ยวข้อง (อาจว่างเปล่า)
}

/** หุ้นสำคัญบางส่วนที่ใช้กรองข่าวให้ตรงกับสิ่งที่เว็บครอบคลุม (ค่าเริ่มต้นเวลาไม่ได้ระบุ symbols เอง) */
const FOCUS_TICKERS = ["XOM", "CVX", "DAL", "UAL", "NVDA", "AAPL", "JPM", "AMZN", "MSFT"];

/**
 * symbols: ระบุ ticker เฉพาะที่อยากได้ข่าว (เช่น ตัวที่ระบบตรวจพบว่าราคาขยับผิดปกติวันนี้)
 *   ไม่ระบุ = ใช้ FOCUS_TICKERS เดิม, ส่ง null = ไม่กรองตาม ticker เลย (ใช้คู่กับ search)
 * search: ค้นด้วยคำสำคัญทั่วไป (เช่น "flood", "Thailand flooding") ไม่ผูกกับ ticker ไหน — ใช้สำหรับข่าวที่ไม่รู้ล่วงหน้าว่าเกี่ยวหุ้นตัวไหน
 * signal: ใส่ตอนเรียกจากที่มี "เวลาจำกัด" (เช่น cron ราคาที่ใช้เวลาร่วมกับงานอื่นใน maxDuration เดียว)
 *   เพื่อตัดการรอทิ้งถ้า Marketaux ตอบช้าเกินไป — ทางเรียกเดิมที่ไม่ส่งมา (ปุ่มในหน้าแอดมิน) ไม่กระทบ ยังไม่มี timeout เหมือนก่อน
 */
export async function fetchLatestNews(
  limit = 20,
  symbols: string[] | null = FOCUS_TICKERS,
  search?: string,
  signal?: AbortSignal,
): Promise<NewsArticle[]> {
  const key = process.env.MARKETAUX_API_KEY;
  if (!key) throw new MarketauxError("ไม่พบ MARKETAUX_API_KEY");
  if (!symbols?.length && !search) throw new MarketauxError("ต้องระบุ symbols หรือ search อย่างน้อยหนึ่งอย่าง");
  const params = new URLSearchParams({
    api_token: key,
    language: "en",
    limit: String(limit),
    sort: "published_desc",
  });
  if (symbols?.length) params.set("symbols", symbols.join(","));
  if (search) params.set("search", search);
  const res = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, { cache: "no-store", signal });
  if (!res.ok) throw new MarketauxError(`Marketaux ตอบกลับผิดพลาด (${res.status})`);
  const data = (await res.json()) as {
    data?: { title: string; url: string; source: string; published_at: string; entities?: { symbol: string }[] }[];
    error?: { message: string };
  };
  if (data.error) throw new MarketauxError(data.error.message);
  return (data.data ?? []).map((a) => ({
    title: a.title,
    url: a.url,
    sourceName: a.source,
    publishedAt: a.published_at,
    tickers: (a.entities ?? []).map((e) => e.symbol),
  }));
}

export interface SavedArticles {
  /** url -> documents.id (ทั้งที่เพิ่งเพิ่มใหม่และที่มีอยู่แล้วก่อนเรียกครั้งนี้) */
  urlToDocId: Map<string, number>;
  /** url ที่เพิ่งบันทึกใหม่ในการเรียกครั้งนี้เท่านั้น (ไม่รวมของเดิมที่มีอยู่แล้ว) */
  insertedUrls: Set<string>;
}

/**
 * บันทึกข่าวลงตาราง sources/documents (ใช้ร่วมกันทั้งปุ่ม "ดึงข่าวใหม่ตอนนี้" ในหน้าแอดมิน
 * และระบบตรวจจับอัตโนมัติ) เลี่ยงข่าวซ้ำด้วยการเช็ก URL ที่มีอยู่แล้วก่อน
 */
export async function saveArticlesToDb(db: ReturnType<typeof getDb>, articles: NewsArticle[]): Promise<SavedArticles> {
  const urlToDocId = new Map<string, number>();
  const insertedUrls = new Set<string>();
  if (articles.length === 0) return { urlToDocId, insertedUrls };

  const sourceNames = [...new Set(articles.map((a) => a.sourceName))];
  const existingSources = await db.select().from(sources).where(inArray(sources.name, sourceNames));
  const sourceIdByName = new Map(existingSources.map((s) => [s.name, s.id]));
  for (const name of sourceNames) {
    if (sourceIdByName.has(name)) continue;
    const [row] = await db
      .insert(sources)
      .values({ name, kind: "ข่าว", licenseNote: "ดึงผ่าน Marketaux (แผนฟรี) — ไม่ copy เนื้อหา แสดงแค่หัวข้อ+ลิงก์กลับต้นฉบับ" })
      .returning({ id: sources.id });
    sourceIdByName.set(name, row.id);
  }

  const urls = articles.map((a) => a.url);
  const existingDocs = await db.select({ id: documents.id, url: documents.url }).from(documents).where(inArray(documents.url, urls));
  for (const d of existingDocs) if (d.url) urlToDocId.set(d.url, d.id);

  for (const a of articles) {
    if (urlToDocId.has(a.url)) continue;
    const sourceId = sourceIdByName.get(a.sourceName);
    if (!sourceId) continue;
    const [row] = await db
      .insert(documents)
      .values({ sourceId, title: a.title, url: a.url, docType: "news", publishedAt: new Date(a.publishedAt), retrievedAt: new Date() })
      .returning({ id: documents.id });
    urlToDocId.set(a.url, row.id);
    insertedUrls.add(a.url);
  }

  return { urlToDocId, insertedUrls };
}

export interface NewsIngestResult {
  ok: boolean;
  fetched: number;
  inserted: number;
  skipped: number;
  error: string | null;
}

/**
 * ดึงข่าว (fetchLatestNews) แล้วบันทึก (saveArticlesToDb) ในครั้งเดียว — ไม่ได้เขียน logic ดึง/บันทึก/กันซ้ำ
 * ขึ้นใหม่ แค่ห่อสองฟังก์ชันเดิมด้วย timeout จำกัดเวลาและสัญญาว่า "ไม่ throw ออกไปเด็ดขาด" ใช้ตอนเรียกจากที่มี
 * เวลาจำกัดร่วมกับงานอื่นที่สำคัญกว่า (เช่น cron ราคาที่มี maxDuration เดียวกันทั้งไฟล์) — ถ้า Marketaux ตอบช้า/
 * พัง หรือบันทึกลง DB ไม่สำเร็จ จะได้ผลลัพธ์ที่ระบุสถานะชัดเจนกลับมาแทน ไม่ทำให้งานหลักของผู้เรียกล้มเหลวไปด้วย
 * (ปุ่ม "ดึงข่าวใหม่ตอนนี้"/ค้นข่าวในหน้าแอดมิน และระบบตรวจจับอัตโนมัติยังเรียก fetchLatestNews/saveArticlesToDb
 * ตรง ๆ แบบเดิมทุกจุด ไม่ได้เปลี่ยนมาเรียกผ่านฟังก์ชันนี้ เพื่อไม่กระทบพฤติกรรมเดิมของจุดอื่น)
 */
export async function fetchAndSaveNewsBounded(
  db: ReturnType<typeof getDb>,
  timeoutMs: number,
  limit = 20,
  symbols: string[] | null = FOCUS_TICKERS,
  search?: string,
): Promise<NewsIngestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const articles = await fetchLatestNews(limit, symbols, search, controller.signal);
    const { insertedUrls } = await saveArticlesToDb(db, articles);
    return { ok: true, fetched: articles.length, inserted: insertedUrls.size, skipped: articles.length - insertedUrls.size, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("fetchAndSaveNewsBounded: ดึง/บันทึกข่าวไม่สำเร็จ", err);
    return { ok: false, fetched: 0, inserted: 0, skipped: 0, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
}
