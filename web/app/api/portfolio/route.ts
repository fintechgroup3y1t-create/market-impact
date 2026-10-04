// Portfolio Impact เฟส 2: อ่านเหตุการณ์ที่เกี่ยวข้องกับ ticker ในรายการ watchlist ของผู้ใช้ (เก็บฝั่งไคลเอนต์)
// endpoint ภายในเท่านั้น ไม่เรียก API ภายนอกเพิ่ม (ราคา/ข่าว) — อ่านจากฐานข้อมูล/ข้อมูลตัวอย่างเดิมผ่าน lib/data.ts อย่างเดียว
//
// เดิมคอมเมนต์ตรงนี้อ้างว่า publishedEvents()/allEventsAnyStatus() แคชต่อ request ด้วย React cache() อยู่แล้ว
// ซึ่ง**ไม่จริง**ตามที่ตรวจพบจริงด้วยการนับ log (watchlist เกิน 3 ticker ขึ้นไปบน Preview จริงแล้วค้าง/ล้มเหลว
// เพราะเหตุนี้โดยตรง — 4 ticker ยิง query events table 4 ครั้งแยกกัน ไม่ใช่ 1 ครั้งตามที่สันนิษฐานไว้เดิม)
// ตอนนี้เรียก publishedEvents() เองครั้งเดียวตรงนี้ แล้วส่งผลลัพธ์เข้า storiesForTicker() ทุก ticker แทน
import { NextResponse } from "next/server";
import { lineVar } from "@/components/LineBadge";
import { getCompany, getLine, publishedEvents, storiesForTicker } from "@/lib/data";

export const dynamic = "force-dynamic";
// route อื่นที่คุย DB หลาย query ในคำขอเดียว (/api/admin/seed, /api/admin/compute-sensitivity,
// /api/admin/migrate, /api/admin/compute-backtest, /api/cron/*) ตั้งค่านี้ไว้ทุกตัวตาม pattern เดียวกัน
// แต่ route นี้ไม่เคยตั้งไว้เลยตั้งแต่สร้าง — เพิ่มให้ตรงกับ pattern เดิม กันแพลตฟอร์มตัดการทำงานก่อนเวลา
// สำหรับ ticker หลายตัวที่ต้อง query หลายรอบ (ไม่ได้ยืนยันว่าเป็นสาเหตุของบั๊กที่รายงาน แค่เป็นความเสี่ยงที่สอดคล้องกัน)
export const maxDuration = 30;

const TICKER_PATTERN = /^[A-Z]{1,5}$/;
const MAX_TICKERS = 30; // ตรงกับ MAX_TICKERS ฝั่ง WatchlistProvider.tsx กันคำขอใหญ่ผิดปกติ

export interface PortfolioStory {
  title: string;
  sub: string;
  exposure: "pos" | "neg" | "mix";
  href?: string;
  color?: string;
}

export interface PortfolioItem {
  ticker: string;
  name: string | null;
  covered: boolean;
  stories: PortfolioStory[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("tickers");
  if (!raw) {
    return NextResponse.json({ ok: false, error: "ต้องระบุ tickers อย่างน้อย 1 ตัว" }, { status: 400 });
  }

  // uppercase + ตัดช่องว่าง + กันซ้ำ + กรองรูปแบบที่ไม่ใช่ ticker หุ้นทิ้งเงียบ ๆ (ไม่ error ทั้งคำขอเพราะพิมพ์ผิดตัวเดียว)
  const candidates = [...new Set(raw.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean))];
  if (candidates.length > MAX_TICKERS) {
    return NextResponse.json({ ok: false, error: `ส่ง ticker ได้ไม่เกิน ${MAX_TICKERS} ตัวต่อครั้ง` }, { status: 400 });
  }
  const tickers = candidates.filter((t) => TICKER_PATTERN.test(t));

  if (tickers.length === 0) {
    return NextResponse.json({ ok: true, items: [] satisfies PortfolioItem[] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    // ดึงเหตุการณ์ที่เผยแพร่แล้วครั้งเดียวสำหรับทุก ticker ในคำขอนี้ (ดูหมายเหตุด้านบนของไฟล์ว่าทำไมสำคัญ)
    const published = await publishedEvents();
    const items: PortfolioItem[] = await Promise.all(
      tickers.map(async (ticker) => {
        const company = getCompany(ticker);
        try {
          const rawStories = await storiesForTicker(ticker, published);
          const stories: PortfolioStory[] = rawStories.map((s) => ({
            title: s.title,
            sub: s.sub,
            exposure: s.exposure,
            href: s.href,
            color: lineVar(getLine(s.lineId)),
          }));
          return { ticker, name: company?.name ?? null, covered: company?.covered ?? false, stories };
        } catch (err) {
          // ไม่ส่ง error ภายใน (stack trace/ข้อความ DB) กลับไปหน้าบ้าน แค่ log ฝั่งเซิร์ฟเวอร์แล้วถือว่า ticker นี้ไม่มีข้อมูล
          console.error(`/api/portfolio: ดึงข้อมูล ${ticker} ไม่สำเร็จ`, err);
          return { ticker, name: company?.name ?? null, covered: company?.covered ?? false, stories: [] };
        }
      }),
    );
    return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("/api/portfolio: ล้มเหลวทั้งคำขอ", err);
    return NextResponse.json({ ok: false, error: "ดึงข้อมูลพอร์ตไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
