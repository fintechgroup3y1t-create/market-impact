// ดึงข่าวการเงินจาก Marketaux (แผนฟรี) — เก็บไว้ให้แอดมินอ่านแล้วตัดสินใจเขียนเหตุการณ์เอง
// ไม่มี AI จัดประเภทอัตโนมัติในชิ้นนี้ (ตามที่ตกลงกันไว้ ประหยัดค่าใช้จ่าย)
// เอกสาร: https://www.marketaux.com/documentation

export class MarketauxError extends Error {}

export interface NewsArticle {
  title: string;
  url: string;
  sourceName: string; // โดเมนต้นฉบับข่าว เช่น "reuters.com" (ไม่ใช่ "Marketaux" เพราะ Marketaux เป็นแค่ตัวรวมข่าว)
  publishedAt: string; // ISO 8601
  tickers: string[]; // ticker ที่ Marketaux ตรวจพบว่าเกี่ยวข้อง (อาจว่างเปล่า)
}

/** หุ้นสำคัญบางส่วนที่ใช้กรองข่าวให้ตรงกับสิ่งที่เว็บครอบคลุม (ส่งได้สูงสุดประมาณนี้ต่อคำขอในแผนฟรี) */
const FOCUS_TICKERS = ["XOM", "CVX", "DAL", "UAL", "NVDA", "AAPL", "JPM", "AMZN", "MSFT"];

export async function fetchLatestNews(limit = 20): Promise<NewsArticle[]> {
  const key = process.env.MARKETAUX_API_KEY;
  if (!key) throw new MarketauxError("ไม่พบ MARKETAUX_API_KEY");
  const params = new URLSearchParams({
    api_token: key,
    symbols: FOCUS_TICKERS.join(","),
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
