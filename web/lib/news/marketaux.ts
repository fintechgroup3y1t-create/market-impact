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

/** symbols: ระบุ ticker เฉพาะที่อยากได้ข่าว (เช่น ตัวที่ระบบตรวจพบว่าราคาขยับผิดปกติวันนี้) ไม่ระบุ = ใช้ FOCUS_TICKERS เดิม */
export async function fetchLatestNews(limit = 20, symbols: string[] = FOCUS_TICKERS): Promise<NewsArticle[]> {
  const key = process.env.MARKETAUX_API_KEY;
  if (!key) throw new MarketauxError("ไม่พบ MARKETAUX_API_KEY");
  const params = new URLSearchParams({
    api_token: key,
    symbols: symbols.join(","),
    language: "en",
    limit: String(limit),
    sort: "published_desc",
  });
  const res = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, { cache: "no-store" });
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
